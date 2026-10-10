import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/appError';
import { prisma } from '../config/database';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden. Role '${req.user.role}' is not authorized. Allowed roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

export const requireCaseOwnership = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) return next(new UnauthorizedError());

  // Admins bypass ownership checks
  if (req.user.role === UserRole.ADMIN) return next();

  const caseId = req.params.caseId || req.params.id;
  if (!caseId) return next(new NotFoundError('Case ID required'));

  try {
    const caseRecord = await prisma.immigrationCase.findUnique({
      where: { id: caseId },
      include: { client: true },
    });

    if (!caseRecord) {
      return next(new NotFoundError(`Immigration case '${caseId}' not found`));
    }

    if (req.user.role === UserRole.COORDINATOR) {
      if (caseRecord.coordinatorId !== req.user.userId) {
        return next(new ForbiddenError('You are not assigned to manage this immigration case'));
      }
    } else if (req.user.role === UserRole.CLIENT) {
      if (caseRecord.client.email !== req.user.email) {
        return next(new ForbiddenError('You do not own this immigration case'));
      }
    } else {
      return next(new ForbiddenError('Access not permitted for your role'));
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const requireProfileOwnership = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) return next(new UnauthorizedError());

  if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.MATCHMAKER) {
    return next();
  }

  const profileId = req.params.profileId || req.params.id;
  if (!profileId) return next(new NotFoundError('Profile ID required'));

  try {
    const profile = await prisma.matrimonialProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return next(new NotFoundError(`Matrimonial profile '${profileId}' not found`));
    }

    if (profile.email !== req.user.email && profile.userId !== req.user.userId) {
      return next(new ForbiddenError('You are not authorized to access or modify this profile'));
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * 4-Eyes Principle: Enforce that the QC Reviewer must NOT be the same coordinator who prepared the case.
 */
export const requireQCReviewer = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) return next(new UnauthorizedError());

  const caseId = req.params.caseId || req.params.id;
  try {
    const caseRecord = await prisma.immigrationCase.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      return next(new NotFoundError(`Case '${caseId}' not found`));
    }

    if (caseRecord.coordinatorId === req.user.userId && req.user.role !== UserRole.ADMIN) {
      return next(new ForbiddenError('Compliance violation: A coordinator cannot perform QC review on their own assigned case.'));
    }

    next();
  } catch (err) {
    next(err);
  }
};
