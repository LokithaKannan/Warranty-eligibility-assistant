import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { getAuditLogs } from '../services/audit.service';
import { sendSuccess } from '../utils/response';

export async function listAuditLogs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const pageSize = Math.min(parseInt(String(req.query.pageSize ?? '20'), 10), 100);
    const userId = req.query.userId as string | undefined;

    const result = await getAuditLogs({ page, pageSize, userId });
    sendSuccess(res, result, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}
