import { Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { AuthenticatedRequest, UserRole } from '../types';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import { logger } from '../utils/logger';

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendUnauthorized(res, req.requestId);
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    logger.warn('Invalid or expired token', { error: String(error), requestId: req.requestId });
    sendUnauthorized(res, req.requestId);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, req.requestId);
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      logger.warn('Authorization denied', {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: roles,
        path: req.path,
        requestId: req.requestId,
      });
      sendForbidden(res, req.requestId);
      return;
    }
    next();
  };
}
