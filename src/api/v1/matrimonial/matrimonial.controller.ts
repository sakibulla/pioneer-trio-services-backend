import { Request, Response } from 'express';
import { MatrimonialService } from '../../../services/matrimonial.service';
import { MatchmakerService } from '../../../services/matchmaker.service';
import { documentService } from '../../../services/document.service';
import { ApiResponse } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { BadRequestError } from '../../../utils/appError';
import { verifyMagicBytes, processProfilePhoto } from '../../../middleware/upload';
import { UserRole } from '@prisma/client';

export class MatrimonialController {
  public static submitProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await MatrimonialService.submitProfile(req.body, userId, req.ip);
    ApiResponse.created(res, result, 'Matrimonial profile submitted for human review');
  });

  public static listProfiles = asyncHandler(async (req: Request, res: Response) => {
    const role = req.user?.role || UserRole.CLIENT;
    const { status, gender, country, city, ageMin, ageMax, search, page, limit } = req.query as any;

    const result = await MatrimonialService.listProfiles(
      role,
      {
        status,
        gender,
        country,
        city,
        ageMin: ageMin ? Number(ageMin) : undefined,
        ageMax: ageMax ? Number(ageMax) : undefined,
        search,
      },
      { page: page ? Number(page) : 1, limit: limit ? Number(limit) : 12 }
    );

    ApiResponse.success(res, result.items, 'Profiles retrieved', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  public static getProfileById = asyncHandler(async (req: Request, res: Response) => {
    const result = await MatrimonialService.getProfileById(req.params.id, req.user);
    ApiResponse.success(res, result);
  });

  public static uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) throw new BadRequestError('No image uploaded');

    const displayOrder = Number(req.body.displayOrder);
    if (displayOrder !== 1 && displayOrder !== 2) {
      throw new BadRequestError('displayOrder must be either 1 or 2 (maximum 2 photos per profile constraint)');
    }

    const isValid = verifyMagicBytes(file.buffer, file.mimetype);
    if (!isValid) {
      throw new BadRequestError('Invalid photo binary signature');
    }

    // Process & optimize to WebP
    const { optimizedBuffer, thumbnailBuffer } = await processProfilePhoto(file.buffer);

    const photo = await documentService.uploadPhoto(
      req.params.profileId,
      displayOrder,
      optimizedBuffer,
      thumbnailBuffer,
      file.originalname
    );

    ApiResponse.created(res, photo, `Profile photo #${displayOrder} optimized and saved`);
  });

  public static createInterviewRecord = asyncHandler(async (req: Request, res: Response) => {
    const result = await MatrimonialService.createInterviewRecord(
      req.params.profileId,
      req.user!.userId,
      req.body
    );
    ApiResponse.created(res, result, 'Interview evaluation record created');
  });

  public static declineProfile = asyncHandler(async (req: Request, res: Response) => {
    const { reasonCategory, notes } = req.body;
    await MatrimonialService.declineProfile(req.params.id, req.user!.userId, reasonCategory, notes);
    ApiResponse.success(res, null, 'Profile declined and recorded for compliance audit');
  });

  public static approveProfile = asyncHandler(async (req: Request, res: Response) => {
    const result = await MatrimonialService.approveProfile(req.params.id);
    ApiResponse.success(res, result, 'Matrimonial profile approved and is now visible to other clients');
  });

  public static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const result = await MatrimonialService.updateProfile(req.params.id, req.body);
    ApiResponse.success(res, result, 'Matrimonial profile updated successfully');
  });

  // Get user's own matrimonial profile
  public static getMyProfile = asyncHandler(async (req: Request, res: Response) => {
    // First try userId (for users who submitted while logged in)
    let profile = await MatrimonialService.getProfileByUserId(req.user!.userId);

    // Fallback: match by email (for profiles submitted as guests before login)
    if (!profile && req.user!.email) {
      profile = await MatrimonialService.getProfileByEmail(req.user!.email);
    }

    if (!profile) {
      return ApiResponse.success(res, null, 'No matrimonial profile found', 200);
    }
    ApiResponse.success(res, profile, 'Your matrimonial profile retrieved');
  });

  // Client matches view & response
  public static getMyMatches = asyncHandler(async (req: Request, res: Response) => {
    const result = await MatchmakerService.listMatches(
      req.user!,
      { page: req.query.page ? Number(req.query.page) : 1, limit: 10 }
    );
    ApiResponse.success(res, result.items, 'My matches retrieved', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  public static respondToMatch = asyncHandler(async (req: Request, res: Response) => {
    const result = await MatchmakerService.respondToMatch(
      req.params.id,
      req.user!.email,
      req.body.response
    );
    ApiResponse.success(res, result, 'Response to match recorded');
  });
}
