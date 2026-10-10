import { Request, Response } from 'express';
import { MatchmakerService } from '../../../services/matchmaker.service';
import { MatrimonialService } from '../../../services/matrimonial.service';
import { prisma } from '../../../config/database';
import { ApiResponse } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { UserRole, ProfileStatus } from '@prisma/client';

export class MatchmakerController {
  public static getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const [
      pendingReviewCount,
      activeProfilesCount,
      totalProposals,
      activeIntroductions,
    ] = await Promise.all([
      prisma.matrimonialProfile.count({ where: { status: ProfileStatus.PENDING_REVIEW } }),
      prisma.matrimonialProfile.count({ where: { status: ProfileStatus.ACTIVE } }),
      prisma.matchProposal.count(),
      prisma.matchProposal.count({ where: { status: 'BOTH_INTERESTED' } }),
    ]);

    ApiResponse.success(res, {
      pendingReviewCount,
      activeProfilesCount,
      totalProposals,
      activeIntroductions,
    });
  });

  public static createMatchProposal = asyncHandler(async (req: Request, res: Response) => {
    const { profileIdA, profileIdB, rationale } = req.body;
    const proposal = await MatchmakerService.createMatchProposal(
      req.user!.userId,
      profileIdA,
      profileIdB,
      rationale
    );
    ApiResponse.created(res, proposal, 'Human-led match proposal created successfully');
  });

  public static listAllMatches = asyncHandler(async (req: Request, res: Response) => {
    const result = await MatchmakerService.listMatches(
      req.user!,
      { page: req.query.page ? Number(req.query.page) : 1, limit: 20 }
    );
    ApiResponse.success(res, result.items, 'All match proposals retrieved', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  public static addCheckIn = asyncHandler(async (req: Request, res: Response) => {
    const { notes, outcome, nextFollowUp, checkInDate } = req.body;
    const checkIn = await MatchmakerService.addCheckIn(
      req.params.matchId,
      notes,
      outcome,
      nextFollowUp,
      checkInDate
    );
    ApiResponse.created(res, checkIn, 'Match check-in logged');
  });

  public static approveProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await prisma.matrimonialProfile.update({
      where: { id: req.params.id },
      data: { status: ProfileStatus.ACTIVE, approvedAt: new Date() },
    });
    ApiResponse.success(res, profile, 'Profile approved for matchmaking');
  });

  public static rejectProfile = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const profile = await prisma.matrimonialProfile.update({
      where: { id: req.params.id },
      data: { status: ProfileStatus.DECLINED, rejectedAt: new Date(), rejectionReason: reason },
    });
    ApiResponse.success(res, profile, 'Profile declined');
  });
}
