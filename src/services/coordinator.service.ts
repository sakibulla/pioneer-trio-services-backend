import { CaseStatus } from '@prisma/client';
import { prisma } from '../config/database';

export class CoordinatorService {
  /**
   * Get Coordinator Dashboard KPI metrics
   */
  public static async getDashboardStats(coordinatorId: string) {
    const [
      totalAssigned,
      underReviewCount,
      documentsPendingCount,
      qcReviewCount,
      approvedCount,
      recentCases,
    ] = await Promise.all([
      prisma.immigrationCase.count({ where: { coordinatorId } }),
      prisma.immigrationCase.count({ where: { coordinatorId, status: CaseStatus.UNDER_REVIEW } }),
      prisma.immigrationCase.count({ where: { coordinatorId, status: CaseStatus.DOCUMENTS_PENDING } }),
      prisma.immigrationCase.count({ where: { coordinatorId, status: CaseStatus.QC_REVIEW } }),
      prisma.immigrationCase.count({ where: { coordinatorId, status: CaseStatus.APPROVED } }),
      prisma.immigrationCase.findMany({
        where: { coordinatorId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { client: { select: { fullName: true, email: true, phone: true } } },
      }),
    ]);

    return {
      totalAssigned,
      underReviewCount,
      documentsPendingCount,
      qcReviewCount,
      approvedCount,
      recentCases,
    };
  }

  /**
   * Get cases pending QC review (ready for other coordinators to inspect)
   */
  public static async getPendingQCCases(currentCoordinatorId: string) {
    return prisma.immigrationCase.findMany({
      where: {
        status: CaseStatus.QC_REVIEW,
        // Exclude own cases to uphold 4-eyes principle
        NOT: { coordinatorId: currentCoordinatorId },
      },
      include: {
        client: true,
        coordinator: { select: { firstName: true, lastName: true, email: true } },
        documents: true,
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  /**
   * Export assigned workload to CSV string
   */
  public static async exportWorkloadCSV(coordinatorId: string): Promise<string> {
    const cases = await prisma.immigrationCase.findMany({
      where: { coordinatorId },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Case Reference', 'Client Name', 'Email', 'Phone', 'Destination', 'Status', 'Stage', 'Submitted Date'];
    const rows = cases.map((c) => [
      `"${c.caseReference}"`,
      `"${c.client.fullName}"`,
      `"${c.client.email}"`,
      `"${c.client.phone}"`,
      `"${c.destinationCountry}"`,
      `"${c.status}"`,
      `"${c.stage || ''}"`,
      `"${c.submittedAt?.toISOString() || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
