import { Request, Response } from 'express';
import { CoordinatorService } from '../../../services/coordinator.service';
import { ApiResponse } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';

export class CoordinatorController {
  public static getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const stats = await CoordinatorService.getDashboardStats(req.user!.userId);
    ApiResponse.success(res, stats, 'Coordinator dashboard statistics');
  });

  public static getPendingQCQueue = asyncHandler(async (req: Request, res: Response) => {
    const cases = await CoordinatorService.getPendingQCCases(req.user!.userId);
    ApiResponse.success(res, cases, 'Cases pending peer QC review');
  });

  public static exportWorkloadCSV = asyncHandler(async (req: Request, res: Response) => {
    const csvData = await CoordinatorService.exportWorkloadCSV(req.user!.userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="workload_${req.user!.userId}.csv"`);
    res.send(csvData);
  });
}
