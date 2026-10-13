import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  checkClaim,
  getClaims,
  getClaimByReference,
  reviewClaim,
  getClaimHistory,
  getDashboardStats,
} from '../services/claim.service';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response';
import { claimListQuerySchema } from '../validators/claim.validator';
import { param } from '../utils/params';

export async function check(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await checkClaim(req.body, req.user!.userId, req.requestId);
    sendCreated(res, result, 'Claim assessment completed', req.requestId);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('not found') || msg.includes('not currently active')) {
      sendError(res, msg, 400, req.requestId);
      return;
    }
    next(error);
  }
}

export async function list(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = claimListQuerySchema.parse(req.query);
    const result = await getClaims(query, req.user!.userId, req.user!.role);
    sendSuccess(res, result, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function getByReference(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const claim = await getClaimByReference(
      param(req.params.referenceCode),
      req.user!.userId,
      req.user!.role
    );
    if (!claim) {
      sendNotFound(res, 'Claim', req.requestId);
      return;
    }
    sendSuccess(res, claim, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function review(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reviewClaim(
      param(req.params.referenceCode),
      req.body,
      req.user!.userId,
      req.requestId
    );
    sendSuccess(res, result, 'Claim reviewed', 200, req.requestId);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('not found')) {
      sendNotFound(res, 'Claim', req.requestId);
      return;
    }
    next(error);
  }
}

export async function history(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getClaimHistory(param(req.params.referenceCode));
    sendSuccess(res, data, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function dashboardStats(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getDashboardStats(req.user!.userId, req.user!.role);
    sendSuccess(res, stats, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}
