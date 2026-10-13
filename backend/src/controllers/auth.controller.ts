import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { loginUser, createUser, setupAdmin, updateUser, getUsers } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { prisma } from '../config/database';
import { param } from '../utils/params';

export async function register(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await createUser(req.body, undefined, req.requestId);
    const token = (await import('../config/jwt')).signToken({
      userId: user.id,
      username: user.username,
      role: user.role as any,
    });
    sendCreated(res, { token, user }, 'Account created successfully', req.requestId);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('already exists')) {
      sendError(res, msg, 409, req.requestId);
      return;
    }
    next(error);
  }
}

export async function login(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password, req.requestId);
    sendSuccess(res, result, 'Login successful', 200, req.requestId);
  } catch (error) {
    if ((error as Error).message === 'Invalid credentials') {
      sendError(res, 'Invalid username or password', 401, req.requestId);
      return;
    }
    next(error);
  }
}

export async function logout(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  // JWT is stateless; client discards the token. We return success.
  // For a production system, implement a token denylist.
  sendSuccess(res, null, 'Logged out successfully', 200, req.requestId);
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true },
    });
    if (!user || !user.isActive) {
      sendError(res, 'User not found or inactive', 401, req.requestId);
      return;
    }
    sendSuccess(res, user, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function adminSetup(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await setupAdmin(req.body, req.requestId);
    sendCreated(res, user, 'Administrator account created', req.requestId);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('Invalid setup token') || msg.includes('already configured')) {
      sendError(res, msg, 400, req.requestId);
      return;
    }
    next(error);
  }
}

export async function createUserAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await createUser(req.body, req.user!.userId, req.requestId);
    sendCreated(res, user, 'User created successfully', req.requestId);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('already exists')) {
      sendError(res, msg, 409, req.requestId);
      return;
    }
    next(error);
  }
}

export async function listUsers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const pageSize = parseInt(String(req.query.pageSize ?? '20'), 10);
    const result = await getUsers(page, pageSize);
    sendSuccess(res, result, undefined, 200, req.requestId);
  } catch (error) {
    next(error);
  }
}

export async function updateUserAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = param(req.params.id);
    const user = await updateUser(id, req.body, req.user!.userId, req.requestId);
    sendSuccess(res, user, 'User updated', 200, req.requestId);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes('own role')) {
      sendError(res, msg, 403, req.requestId);
      return;
    }
    next(error);
  }
}
