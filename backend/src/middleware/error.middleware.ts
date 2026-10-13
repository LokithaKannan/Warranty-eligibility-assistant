import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export function errorMiddleware(
  err: Error,
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    res.status(400).json({
      success: false,
      error: `Validation error: ${fieldErrors}`,
      requestId,
    });
    return;
  }

  // Multer file size error
  if (err.message?.includes('File too large') || (err as any).code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      success: false,
      error: 'File exceeds maximum allowed size',
      requestId,
    });
    return;
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId,
  });

  res.status(500).json({
    success: false,
    error: 'An internal server error occurred',
    requestId,
  });
}

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}
