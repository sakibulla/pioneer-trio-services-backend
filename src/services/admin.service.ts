import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { ConflictError, NotFoundError } from '../utils/appError';
import { AuditService } from './audit.service';
import { PaginationOptions, PaginatedResult } from '../types';

export class AdminService {
  /**
   * Executive high-level KPI dashboard metrics
   */
  public static async getSystemMetrics() {
    const [
      totalUsers,
      totalImmigrationCases,
      totalMatrimonialProfiles,
      totalMatchProposals,
      activeProfiles,
      approvedCases,
      casesByDestination,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.immigrationCase.count(),
      prisma.matrimonialProfile.count(),
      prisma.matchProposal.count(),
      prisma.matrimonialProfile.count({ where: { status: 'ACTIVE' } }),
      prisma.immigrationCase.count({ where: { status: 'APPROVED' } }),
      prisma.immigrationCase.groupBy({
        by: ['destinationCountry'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, role: true } } },
      }),
    ]);

    return {
      overview: {
        totalUsers,
        totalImmigrationCases,
        totalMatrimonialProfiles,
        totalMatchProposals,
        activeProfiles,
        approvedCases,
      },
      topDestinations: casesByDestination.map((d) => ({
        country: d.destinationCountry,
        count: d._count.id,
      })),
      recentAuditLogs,
    };
  }

  /**
   * List platform users with role filters and pagination
   */
  public static async listUsers(
    filters: { role?: UserRole; search?: string },
    pagination: PaginationOptions
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.role) where.role = filters.role;
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          active: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
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
   * Create new coordinator or matchmaker user account
   */
  public static async createUser(data: any, adminUserId: string) {
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw new ConflictError('User email already registered');
    }

    const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        active: true,
      },
    });

    if (data.role === UserRole.MATCHMAKER) {
      await prisma.matchmaker.create({
        data: {
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          bio: data.bio || 'Accredited Matrimonial Consultant',
        },
      });
    }

    await AuditService.log({
      userId: adminUserId,
      action: 'ADMIN_USER_CREATED',
      resource: 'User',
      resourceId: user.id,
      details: { role: user.role, email: user.email },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  /**
   * Get compliance report for declined files
   */
  public static async getDeclinedFilesReport() {
    return prisma.declinedFile.findMany({
      orderBy: { declinedAt: 'desc' },
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            gender: true,
            currentCountry: true,
          },
        },
      },
    });
  }
}
