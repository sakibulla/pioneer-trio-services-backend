import { Prisma, CaseStatus, UserRole, NoteType, QCOutcome } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/appError';
import { emailQueue } from '../jobs/queue';
import { AuditService } from './audit.service';
import { PaginationOptions, PaginatedResult } from '../types';

export class ImmigrationService {
  /**
   * Auto-assign least loaded Case Coordinator
   */
  private static async findLeastLoadedCoordinator(): Promise<string | null> {
    const coordinators = await prisma.user.findMany({
      where: { role: UserRole.COORDINATOR, active: true },
      select: {
        id: true,
        _count: {
          select: {
            coordinatorCases: {
              where: {
                status: {
                  in: [
                    CaseStatus.SUBMITTED,
                    CaseStatus.UNDER_REVIEW,
                    CaseStatus.DOCUMENTS_PENDING,
                    CaseStatus.QC_REVIEW,
                  ],
                },
              },
            },
          },
        },
      },
      orderBy: {
        coordinatorCases: {
          _count: 'asc',
        },
      },
      take: 1,
    });

    return coordinators.length > 0 ? coordinators[0].id : null;
  }

  /**
   * Submit complete assessment via atomic transaction
   */
  public static async submitAssessment(data: any, clientIp?: string) {
    const caseRefYear = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const caseReference = `PTS-IMM-${caseRefYear}-${randomSeq}`;

    const createdCase = await prisma.$transaction(async (tx) => {
      // 1. Create or update Client
      const client = await tx.client.upsert({
        where: { email: data.email.toLowerCase() },
        update: {
          fullName: data.fullName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          nationality: data.nationality,
          nidNumber: data.nidNumber,
          passportNumber: data.passportNumber,
          passportExpiry: data.passportExpiry,
          maritalStatus: data.maritalStatus,
          currentAddress: data.currentAddress,
        },
        create: {
          fullName: data.fullName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          nationality: data.nationality,
          nidNumber: data.nidNumber,
          passportNumber: data.passportNumber,
          passportExpiry: data.passportExpiry,
          maritalStatus: data.maritalStatus,
          currentAddress: data.currentAddress,
        },
      });

      // 2. Create Immigration Case Record
      const immigrationCase = await tx.immigrationCase.create({
        data: {
          clientId: client.id,
          caseReference,
          destinationCountry: data.destinationCountry,
          applicationType: data.applicationType,
          specificProgram: data.specificProgram,
          targetApplicationDate: data.targetApplicationDate,
          priorApplications: data.priorApplications,
          priorRefusals: data.priorRefusals,
          refusalDetails: data.refusalDetails,
          status: CaseStatus.SUBMITTED,
          stage: 'Initial Document Verification',
          submittedAt: new Date(),
        },
      });

      // 3. Create Employment Profile
      if (data.employmentProfile) {
        await tx.employmentProfile.create({
          data: {
            caseId: immigrationCase.id,
            employmentStatus: data.employmentProfile.employmentStatus,
            currentEmployer: data.employmentProfile.currentEmployer,
            jobTitle: data.employmentProfile.jobTitle,
            employmentSince: data.employmentProfile.employmentSince,
            monthlyIncome: data.employmentProfile.monthlyIncome,
            businessName: data.employmentProfile.businessName,
            businessType: data.employmentProfile.businessType,
            businessSince: data.employmentProfile.businessSince,
            annualRevenue: data.employmentProfile.annualRevenue,
            institution: data.employmentProfile.institution,
            fieldOfStudy: data.employmentProfile.fieldOfStudy,
            expectedGraduation: data.employmentProfile.expectedGraduation,
          },
        });
      }

      // 4. Create Financial Profile
      if (data.financialProfile) {
        await tx.financialProfile.create({
          data: {
            caseId: immigrationCase.id,
            currentBankBalance: data.financialProfile.currentBankBalance,
            hasSponsor: data.financialProfile.hasSponsor,
            sponsorRelationship: data.financialProfile.sponsorRelationship,
            sponsorContribution: data.financialProfile.sponsorContribution,
            sourceOfFunds: data.financialProfile.sourceOfFunds,
            unusualDeposits: data.financialProfile.unusualDeposits,
            unusualDepositDetails: data.financialProfile.unusualDepositDetails,
          },
        });
      }

      // 5. Create Travel History
      if (data.travelHistory && data.travelHistory.length > 0) {
        await tx.travelHistory.createMany({
          data: data.travelHistory.map((item: any) => ({
            caseId: immigrationCase.id,
            country: item.country,
            visitPurpose: item.visitPurpose,
            visitDate: item.visitDate,
            hadRefusal: item.hadRefusal || false,
            refusalCountry: item.refusalCountry,
            refusalReason: item.refusalReason,
          })),
        });
      }

      // 6. Create Home Country Ties
      if (data.homeCountryTies) {
        await tx.homeCountryTies.create({
          data: {
            caseId: immigrationCase.id,
            applicationPurpose: data.homeCountryTies.applicationPurpose,
            familyInBangladesh: data.homeCountryTies.familyInBangladesh,
            familyDetails: data.homeCountryTies.familyDetails,
            ownsProperty: data.homeCountryTies.ownsProperty,
            propertyDetails: data.homeCountryTies.propertyDetails,
            intentToReturn: data.homeCountryTies.intentToReturn,
          },
        });
      }

      return immigrationCase;
    });

    // Queue confirmation emails
    emailQueue.add({
      type: 'IMMIGRATION_ASSESSMENT_RECEIVED',
      payload: {
        to: data.email,
        name: data.fullName,
        caseReference,
        destination: data.destinationCountry,
      },
    });

    await AuditService.log({
      action: 'IMMIGRATION_ASSESSMENT_SUBMITTED',
      resource: 'ImmigrationCase',
      resourceId: createdCase.id,
      details: { caseReference, destinationCountry: data.destinationCountry },
      ipAddress: clientIp,
    });

    return createdCase;
  }

  /**
   * List immigration cases with RBAC filtering & pagination
   */
  public static async listCases(
    role: UserRole,
    userId: string,
    userEmail: string,
    filters: {
      status?: CaseStatus;
      destinationCountry?: string;
      search?: string;
    },
    pagination: PaginationOptions
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ImmigrationCaseWhereInput = {};

    // Role filtering
    if (role === UserRole.COORDINATOR) {
      where.coordinatorId = userId;
    } else if (role === UserRole.CLIENT) {
      // Find cases where the client email matches the user email (case-insensitive)
      where.client = { email: userEmail.toLowerCase() };
    } else if (role === UserRole.ADMIN) {
      // Admin sees ALL cases - no filtering
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.destinationCountry) {
      where.destinationCountry = { contains: filters.destinationCountry, mode: 'insensitive' };
    }

    if (filters.search) {
      where.OR = [
        { caseReference: { contains: filters.search, mode: 'insensitive' } },
        { client: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { client: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.immigrationCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: pagination.sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          client: true,
          coordinator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { documents: true, notes: true, qcReviews: true },
          },
        },
      }),
      prisma.immigrationCase.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single case by ID with all relations
   */
  public static async getCaseById(caseId: string) {
    const caseRecord = await prisma.immigrationCase.findUnique({
      where: { id: caseId },
      include: {
        client: true,
        coordinator: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        employmentProfile: true,
        financialProfile: true,
        travelHistory: true,
        homeCountryTies: true,
        documents: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            verified: true,
            verifiedAt: true,
            uploadedAt: true,
          },
        },
        qcReviews: {
          include: {
            reviewer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!caseRecord) throw new NotFoundError('Immigration case not found');
    return caseRecord;
  }

  /**
   * Update case status state machine
   */
  public static async updateStatus(caseId: string, status: CaseStatus, stage?: string, notes?: string, user?: any) {
    const existing = await prisma.immigrationCase.findUnique({ where: { id: caseId } });
    if (!existing) throw new NotFoundError('Case not found');

    const updated = await prisma.immigrationCase.update({
      where: { id: caseId },
      data: {
        status,
        stage: stage || existing.stage,
        closedAt: status === CaseStatus.CLOSED || status === CaseStatus.APPROVED || status === CaseStatus.REJECTED ? new Date() : null,
      },
    });

    if (notes && user) {
      await prisma.caseNote.create({
        data: {
          caseId,
          authorId: user.userId,
          note: `Status updated to ${status}. ${notes}`,
          noteType: NoteType.INTERNAL,
        },
      });
    }

    await AuditService.log({
      userId: user?.userId,
      action: 'CASE_STATUS_UPDATED',
      resource: 'ImmigrationCase',
      resourceId: caseId,
      details: { previousStatus: existing.status, newStatus: status, stage },
    });

    return updated;
  }

  /**
   * Update case details (client/admin can edit their case)
   */
  public static async updateCase(caseId: string, updateData: any, user?: any) {
    const existing = await prisma.immigrationCase.findUnique({ where: { id: caseId } });
    if (!existing) throw new NotFoundError('Case not found');

    // Client can only update their own case while it's in SUBMITTED state
    if (user?.role === 'CLIENT' && existing.status !== CaseStatus.SUBMITTED) {
      throw new ForbiddenError('You can only edit your case while it is in SUBMITTED state');
    }

    const updated = await prisma.immigrationCase.update({
      where: { id: caseId },
      data: {
        destinationCountry: updateData.destinationCountry || existing.destinationCountry,
        applicationType: updateData.applicationType || existing.applicationType,
        specificProgram: updateData.specificProgram || existing.specificProgram,
        targetApplicationDate: updateData.targetApplicationDate || existing.targetApplicationDate,
        priorApplications: updateData.priorApplications ?? existing.priorApplications,
        priorRefusals: updateData.priorRefusals ?? existing.priorRefusals,
        refusalDetails: updateData.refusalDetails || existing.refusalDetails,
        stage: updateData.stage || existing.stage,
      },
    });

    await AuditService.log({
      userId: user?.userId,
      action: 'CASE_UPDATED',
      resource: 'ImmigrationCase',
      resourceId: caseId,
      details: { updates: updateData },
    });

    return updated;
  }

  /**
   * Submit QC Review enforcing four-eyes principle
   */
  public static async submitQCReview(
    caseId: string,
    reviewerId: string,
    data: { reviewStage: string; outcome: QCOutcome; findings?: string; recommendations?: string }
  ) {
    const caseRecord = await prisma.immigrationCase.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundError('Case not found');

    if (caseRecord.coordinatorId === reviewerId) {
      throw new ForbiddenError('A coordinator cannot QC review their own assigned case.');
    }

    const review = await prisma.qCReview.create({
      data: {
        caseId,
        reviewerId,
        reviewStage: data.reviewStage,
        outcome: data.outcome,
        findings: data.findings,
        recommendations: data.recommendations,
      },
    });

    // Automatically advance case status on approved QC
    if (data.outcome === QCOutcome.APPROVED) {
      await prisma.immigrationCase.update({
        where: { id: caseId },
        data: { status: CaseStatus.APPROVED, stage: 'QC Passed - Final Submission Ready' },
      });
    } else if (data.outcome === QCOutcome.REQUIRES_CHANGES) {
      await prisma.immigrationCase.update({
        where: { id: caseId },
        data: { status: CaseStatus.DOCUMENTS_PENDING, stage: 'QC Requires Changes' },
      });
    }

    await AuditService.log({
      userId: reviewerId,
      action: 'QC_REVIEW_SUBMITTED',
      resource: 'QCReview',
      resourceId: review.id,
      details: { outcome: data.outcome, caseId },
    });

    return review;
  }

  /**
   * Add Case Note with role-based visibility
   */
  public static async addNote(caseId: string, authorId: string, note: string, noteType: NoteType = NoteType.GENERAL) {
    return prisma.caseNote.create({
      data: {
        caseId,
        authorId,
        note,
        noteType,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  /**
   * List case notes filtered by client visibility
   */
  public static async listNotes(caseId: string, role: UserRole) {
    const where: Prisma.CaseNoteWhereInput = { caseId };

    if (role === UserRole.CLIENT) {
      where.noteType = { in: [NoteType.GENERAL, NoteType.CLIENT_COMMUNICATION] };
    }

    return prisma.caseNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }
}
