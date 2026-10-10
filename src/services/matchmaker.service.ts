import { MatchStatus, MatchResponse, UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/appError';
import { emailQueue } from '../jobs/queue';
import { AuditService } from './audit.service';
import { PaginationOptions, PaginatedResult } from '../types';

export class MatchmakerService {
  /**
   * Create Human-Led Match Proposal (Explicitly requires Matchmaker ID & Rationale)
   */
  public static async createMatchProposal(
    matchmakerUserId: string,
    profileIdA: string,
    profileIdB: string,
    rationale: string
  ) {
    if (profileIdA === profileIdB) {
      throw new BadRequestError('Cannot propose a match between identical profiles');
    }

    const matchmaker = await prisma.matchmaker.findUnique({ where: { userId: matchmakerUserId } });
    if (!matchmaker) {
      throw new ForbiddenError('Only accredited matchmakers can propose matches');
    }

    const [profA, profB] = await Promise.all([
      prisma.matrimonialProfile.findUnique({ where: { id: profileIdA } }),
      prisma.matrimonialProfile.findUnique({ where: { id: profileIdB } }),
    ]);

    if (!profA || !profB) {
      throw new NotFoundError('One or both matrimonial profiles could not be found');
    }

    // Enforce human-led match proposal
    const proposal = await prisma.matchProposal.create({
      data: {
        profileIdA,
        profileIdB,
        proposedBy: matchmaker.id,
        rationale,
        status: MatchStatus.PROPOSED,
      },
      include: {
        profileA: { select: { id: true, fullName: true, email: true } },
        profileB: { select: { id: true, fullName: true, email: true } },
        matchmaker: { select: { name: true } },
      },
    });

    // Notify both parties via email
    emailQueue.add({
      type: 'MATCH_PROPOSAL_NOTIFICATION',
      payload: { to: profA.email, name: profA.fullName, rationale },
    });
    emailQueue.add({
      type: 'MATCH_PROPOSAL_NOTIFICATION',
      payload: { to: profB.email, name: profB.fullName, rationale },
    });

    await AuditService.log({
      userId: matchmakerUserId,
      action: 'MATCH_PROPOSAL_CREATED',
      resource: 'MatchProposal',
      resourceId: proposal.id,
      details: { profileIdA, profileIdB, matchmaker: matchmaker.name },
    });

    return proposal;
  }

  /**
   * Client responds to match proposal (INTERESTED / NOT_INTERESTED / MAYBE)
   */
  public static async respondToMatch(proposalId: string, userEmail: string, response: MatchResponse) {
    const proposal = await prisma.matchProposal.findUnique({
      where: { id: proposalId },
      include: { profileA: true, profileB: true },
    });

    if (!proposal) throw new NotFoundError('Match proposal not found');

    let updateData: any = {};

    if (proposal.profileA.email === userEmail) {
      updateData = { responseA: response, responseAAt: new Date() };
    } else if (proposal.profileB.email === userEmail) {
      updateData = { responseB: response, responseBAt: new Date() };
    } else {
      throw new ForbiddenError('You are not a participant in this match proposal');
    }

    // Determine state progression if both interested
    const otherResponse = proposal.profileA.email === userEmail ? proposal.responseB : proposal.responseA;

    if (response === MatchResponse.INTERESTED && otherResponse === MatchResponse.INTERESTED) {
      updateData.status = MatchStatus.BOTH_INTERESTED;
    } else if (response === MatchResponse.NOT_INTERESTED || otherResponse === MatchResponse.NOT_INTERESTED) {
      updateData.status = MatchStatus.DECLINED;
      updateData.closedAt = new Date();
    }

    const updated = await prisma.matchProposal.update({
      where: { id: proposalId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Record match check-in notes
   */
  public static async addCheckIn(
    matchId: string,
    notes: string,
    outcome?: string,
    nextFollowUp?: Date,
    checkInDate?: Date
  ) {
    const match = await prisma.matchProposal.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundError('Match proposal not found');

    const checkIn = await prisma.matchCheckIn.create({
      data: {
        matchId,
        notes,
        outcome,
        nextFollowUp,
        checkInDate: checkInDate || new Date(),
      },
    });

    return checkIn;
  }

  /**
   * List matches with filters and pagination
   */
  public static async listMatches(
    user: { role: UserRole; userId: string; email: string },
    pagination: PaginationOptions
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(50, Math.max(1, pagination.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (user.role === UserRole.CLIENT) {
      where.OR = [
        { profileA: { email: user.email } },
        { profileB: { email: user.email } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.matchProposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profileA: {
            select: {
              id: true,
              fullName: true,
              gender: true,
              currentCity: true,
              currentCountry: true,
              currentProfession: true,
              photos: { select: { storageKey: true, thumbnailKey: true, displayOrder: true } },
            },
          },
          profileB: {
            select: {
              id: true,
              fullName: true,
              gender: true,
              currentCity: true,
              currentCountry: true,
              currentProfession: true,
              photos: { select: { storageKey: true, thumbnailKey: true, displayOrder: true } },
            },
          },
          matchmaker: { select: { name: true } },
          checkIns: true,
        },
      }),
      prisma.matchProposal.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
