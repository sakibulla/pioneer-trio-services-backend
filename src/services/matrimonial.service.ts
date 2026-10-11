import { Prisma, ProfileStatus, UserRole, DeclineReason, InterviewMode } from '@prisma/client';
import { prisma } from '../config/database';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/appError';
import { emailQueue } from '../jobs/queue';
import { AuditService } from './audit.service';
import { PaginationOptions, PaginatedResult } from '../types';

export class MatrimonialService {
  /**
   * Submit complete matrimonial profile
   */
  public static async submitProfile(data: any, userId?: string, clientIp?: string) {
    const existing = await prisma.matrimonialProfile.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestError('A matrimonial profile is already registered under this email address');
    }

    const profile = await prisma.$transaction(async (tx) => {
      // 1. Create Matrimonial Profile
      const createdProfile = await tx.matrimonialProfile.create({
        data: {
          userId,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          height: data.height,
          bloodGroup: data.bloodGroup,
          maritalStatus: data.maritalStatus,
          currentNationality: data.currentNationality,
          currentCountry: data.currentCountry,
          currentCity: data.currentCity,
          visaStatus: data.visaStatus,
          motherTongue: data.motherTongue,
          languagesSpoken: data.languagesSpoken,
          fatherOccupation: data.fatherOccupation,
          motherOccupation: data.motherOccupation,
          siblingsCount: data.siblingsCount,
          siblingsMarried: data.siblingsMarried,
          familyType: data.familyType,
          familyLocation: data.familyLocation,
          familyDescription: data.familyDescription,
          educationLevel: data.educationLevel,
          institution: data.institution,
          fieldOfStudy: data.fieldOfStudy,
          currentProfession: data.currentProfession,
          jobTitle: data.jobTitle,
          employer: data.employer,
          incomeBracket: data.incomeBracket,
          religion: data.religion,
          sect: data.sect,
          religiousPractice: data.religiousPractice,
          ethnicity: data.ethnicity,
          dietaryPreference: data.dietaryPreference,
          smokingHabits: data.smokingHabits,
          drinkingHabits: data.drinkingHabits,
          hobbies: data.hobbies,
          email: data.email.toLowerCase(),
          phone: data.phone,
          preferredContactMethod: data.preferredContactMethod,
          status: ProfileStatus.PENDING_REVIEW,
        },
      });

      // 2. Create Partner Preferences
      if (data.partnerPreference) {
        await tx.partnerPreference.create({
          data: {
            profileId: createdProfile.id,
            ageMin: data.partnerPreference.ageMin,
            ageMax: data.partnerPreference.ageMax,
            preferredLocations: data.partnerPreference.preferredLocations,
            preferredEducation: data.partnerPreference.preferredEducation,
            preferredProfession: data.partnerPreference.preferredProfession,
            religiousPreference: data.partnerPreference.religiousPreference,
            otherPreferences: data.partnerPreference.otherPreferences,
            dealbreakers: data.partnerPreference.dealbreakers,
          },
        });
      }

      return createdProfile;
    });

    // Queue intake email
    emailQueue.add({
      type: 'MATRIMONIAL_PROFILE_SUBMITTED',
      payload: { to: profile.email, name: profile.fullName },
    });

    await AuditService.log({
      userId,
      action: 'MATRIMONIAL_PROFILE_SUBMITTED',
      resource: 'MatrimonialProfile',
      resourceId: profile.id,
      ipAddress: clientIp,
    });

    return profile;
  }

  /**
   * List matrimonial profiles with filtering and privacy masks
   */
  public static async listProfiles(
    requestingRole: UserRole,
    filters: {
      status?: ProfileStatus;
      gender?: any;
      country?: string;
      city?: string;
      ageMin?: number;
      ageMax?: number;
      search?: string;
    },
    pagination: PaginationOptions
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(50, Math.max(1, pagination.limit || 12));
    const skip = (page - 1) * limit;

    const where: Prisma.MatrimonialProfileWhereInput = {};

    // Clients/public only see ACTIVE profiles
    if (requestingRole === UserRole.CLIENT) {
      where.status = ProfileStatus.ACTIVE;
    } else if (filters.status) {
      where.status = filters.status;
    }

    if (filters.gender) where.gender = filters.gender;
    if (filters.country) where.currentCountry = { contains: filters.country, mode: 'insensitive' };
    if (filters.city) where.currentCity = { contains: filters.city, mode: 'insensitive' };

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { currentProfession: { contains: filters.search, mode: 'insensitive' } },
        { currentCity: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [rawItems, total] = await Promise.all([
      prisma.matrimonialProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          photos: {
            select: { id: true, storageKey: true, thumbnailKey: true, displayOrder: true, verified: true },
          },
          partnerPreference: true,
        },
      }),
      prisma.matrimonialProfile.count({ where }),
    ]);

    // Privacy Masking for Clients: Remove employer, incomeBracket, phone, email, and internal fields
    const items = rawItems.map((p) => {
      if (requestingRole === UserRole.CLIENT) {
        const { employer, incomeBracket, email, phone, ...safeProfile } = p;
        return safeProfile;
      }
      return p;
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single profile by ID with privacy safeguards
   */
  public static async getProfileById(profileId: string, user?: { role: UserRole; userId: string; email: string }) {
    const profile = await prisma.matrimonialProfile.findUnique({
      where: { id: profileId },
      include: {
        photos: true,
        partnerPreference: true,
        interviewRecords: user?.role === UserRole.ADMIN || user?.role === UserRole.MATCHMAKER ? {
          include: {
            matchmaker: true,
          },
        } : false,
      },
    });

    if (!profile) throw new NotFoundError('Matrimonial profile not found');

    const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.MATCHMAKER;
    const isOwner = user?.email === profile.email || user?.userId === profile.userId;

    if (!isStaff && !isOwner) {
      // Mask sensitive private fields
      const { employer, incomeBracket, email, phone, ...safeProfile } = profile;
      return safeProfile;
    }

    return profile;
  }

  /**
   * Get user's own profile by userId
   */
  public static async getProfileByUserId(userId: string) {
    if (!userId) return null;

    const profile = await prisma.matrimonialProfile.findFirst({
      where: { userId },
      include: {
        photos: true,
        partnerPreference: true,
        interviewRecords: {
          include: {
            matchmaker: true,
          },
        },
      },
    });

    return profile;
  }

  /**
   * Create staff-only interview record
   */
  public static async createInterviewRecord(
    profileId: string,
    matchmakerUserId: string,
    data: {
      interviewDate: Date;
      mode: InterviewMode;
      intentAssessment: string;
      redFlagNotes?: string;
      internalProfilingTags: string[];
      compatibilityNotes?: string;
      communicationStyle?: string;
      familyExpectations?: string;
      recommendApproval: boolean;
    }
  ) {
    const matchmaker = await prisma.matchmaker.findUnique({ where: { userId: matchmakerUserId } });
    if (!matchmaker) throw new ForbiddenError('Only registered matchmakers can record interviews');

    const record = await prisma.interviewRecord.create({
      data: {
        profileId,
        matchmakerId: matchmaker.id,
        interviewDate: data.interviewDate,
        mode: data.mode,
        intentAssessment: data.intentAssessment,
        redFlagNotes: data.redFlagNotes,
        internalProfilingTags: data.internalProfilingTags,
        compatibilityNotes: data.compatibilityNotes,
        communicationStyle: data.communicationStyle,
        familyExpectations: data.familyExpectations,
        recommendApproval: data.recommendApproval,
      },
    });

    if (data.recommendApproval) {
      await prisma.matrimonialProfile.update({
        where: { id: profileId },
        data: { status: ProfileStatus.ACTIVE, approvedAt: new Date() },
      });
    }

    await AuditService.log({
      userId: matchmakerUserId,
      action: 'INTERVIEW_RECORD_CREATED',
      resource: 'InterviewRecord',
      resourceId: record.id,
      details: { profileId, recommendApproval: data.recommendApproval },
    });

    return record;
  }

  /**
   * Decline profile with compliance categorization
   */
  public static async declineProfile(profileId: string, staffUserId: string, reasonCategory: DeclineReason, notes: string) {
    await prisma.$transaction(async (tx) => {
      await tx.matrimonialProfile.update({
        where: { id: profileId },
        data: {
          status: ProfileStatus.DECLINED,
          rejectedAt: new Date(),
          rejectionReason: notes,
        },
      });

      await tx.declinedFile.upsert({
        where: { profileId },
        update: {
          reasonCategory,
          notes,
          declinedBy: staffUserId,
          declinedAt: new Date(),
        },
        create: {
          profileId,
          reasonCategory,
          notes,
          declinedBy: staffUserId,
          declinedAt: new Date(),
        },
      });
    });

    await AuditService.log({
      userId: staffUserId,
      action: 'PROFILE_DECLINED_COMPLIANCE',
      resource: 'DeclinedFile',
      resourceId: profileId,
      details: { reasonCategory, notes },
    });
  }
}
