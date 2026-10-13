import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  requestId?: string
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    requestId,
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: string,
  statusCode = 400,
  requestId?: string
): void {
  const response: ApiResponse = {
    success: false,
    error,
    requestId,
  };
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message?: string, requestId?: string): void {
  sendSuccess(res, data, message, 201, requestId);
}

export function sendUnauthorized(res: Response, requestId?: string): void {
  sendError(res, 'Authentication required', 401, requestId);
}

export function sendForbidden(res: Response, requestId?: string): void {
  sendError(res, 'Insufficient permissions', 403, requestId);
}

export function sendNotFound(res: Response, resource = 'Resource', requestId?: string): void {
  sendError(res, `${resource} not found`, 404, requestId);
}
