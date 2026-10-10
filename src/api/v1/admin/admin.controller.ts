import { Request, Response } from 'express';
import { AdminService } from '../../../services/admin.service';
import { ApiResponse } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

export class AdminController {
  public static getDashboard = asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await AdminService.getSystemMetrics();
    ApiResponse.success(res, metrics, 'Executive admin metrics retrieved');
  });

  public static listUsers = asyncHandler(async (req: Request, res: Response) => {
    const { role, search, page, limit } = req.query as any;
    const result = await AdminService.listUsers(
      { role, search },
      { page: page ? Number(page) : 1, limit: limit ? Number(limit) : 20 }
    );
    ApiResponse.success(res, result.items, 'Users list', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  public static createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await AdminService.createUser(req.body, req.user!.userId);
    ApiResponse.created(res, user, 'Staff user account created');
  });

  public static getDeclinedFiles = asyncHandler(async (_req: Request, res: Response) => {
    const report = await AdminService.getDeclinedFilesReport();
    ApiResponse.success(res, report, 'Compliance declined files report');
  });
}
