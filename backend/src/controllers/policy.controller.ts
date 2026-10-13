import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  uploadPolicy,
  confirmPolicy,
  getPolicies,
  getPolicyById,
  updatePolicy,
  getExtractedText,
} from '../services/policy.service';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response';
import { policyListQuerySchema } from '../validators/policy.validator';
import { param } from '../utils/params';

export async function upload(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, 'No PDF file uploaded', 400, req.requestId);
      return;
    }

    const result = await uploadPolicy(
      req.file.buffer,
      req.file.originalname,
      req.body,
      req.user!.userId,
      req.requestId
    );

    sendCreated(res, result, 'Policy uploaded and extracted', req.requestId);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('valid PDF') || msg.includes('extraction')) {
      sendError(res, msg, 422, req.requestId);
      return;
    }
    next(error);
  }
}

export async function confirm(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const policy = await confirmPolicy(
      param(req.params.id),
      req.body,
      req.user!.userId,
      req.requestId
    );
    sendSuccess(res, policy, 'Policy confirmed', 200, req.requestId);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('not found')) {
      sendNotFound(res, 'Policy', req.requestId);
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
    const query = policyListQuerySchema.parse(req.query);
    const result = await getPolicies(query, req.user?.userId, req.user?.role);
    sendSuccess(res, result, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const policy = await getPolicyById(param(req.params.id));
    if (!policy) {
      sendNotFound(res, 'Policy', req.requestId);
      return;
    }
    // Customers can only see active+confirmed policies
    if (req.user?.role === 'CUSTOMER' && (!policy.isActive || !policy.isConfirmed)) {
      sendNotFound(res, 'Policy', req.requestId);
      return;
    }
    sendSuccess(res, policy, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const policy = await updatePolicy(
      param(req.params.id),
      req.body,
      req.user!.userId,
      req.requestId
    );
    sendSuccess(res, policy, 'Policy updated', 200, req.requestId);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('not found')) {
      sendNotFound(res, 'Policy', req.requestId);
      return;
    }
    next(error);
  }
}

export async function getExtractedTextHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getExtractedText(param(req.params.id));
    if (!data) {
      sendNotFound(res, 'Policy', req.requestId);
      return;
    }
    sendSuccess(res, data, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function getClauses(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const policy = await getPolicyById(param(req.params.id));
    if (!policy) {
      sendNotFound(res, 'Policy', req.requestId);
      return;
    }
    sendSuccess(res, policy.clauses, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}
