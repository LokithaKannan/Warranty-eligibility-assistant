import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { signToken } from '../config/jwt';
import { env } from '../config/env';
import { logAuditEvent } from './audit.service';
import { logger } from '../utils/logger';
import { CreateUserInput, AdminSetupInput } from '../validators/auth.validator';

const SALT_ROUNDS = 12;

export async function loginUser(
  username: string,
  password: string,
  requestId?: string
): Promise<{ token: string; user: { id: string; username: string; email: string; role: string } }> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }],
      isActive: true,
    },
  });

  if (!user) {
    await logAuditEvent({
      action: 'LOGIN_ATTEMPT',
      outcome: 'FAILURE',
      requestId,
      metadata: { username, reason: 'User not found or inactive' },
    });
    throw new Error('Invalid credentials');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN_ATTEMPT',
      outcome: 'FAILURE',
      requestId,
      metadata: { reason: 'Invalid password' },
    });
    throw new Error('Invalid credentials');
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role as any,
  });

  await logAuditEvent({
    userId: user.id,
    action: 'LOGIN',
    outcome: 'SUCCESS',
    requestId,
  });

  logger.info('User logged in', { userId: user.id, username: user.username });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
}

export async function createUser(
  input: CreateUserInput,
  createdByUserId?: string,
  requestId?: string
): Promise<{ id: string; username: string; email: string; role: string }> {
  // Check for duplicates
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: input.username }, { email: input.email }] },
  });
  if (existing) {
    throw new Error('Username or email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      passwordHash,
      role: input.role ?? 'CUSTOMER',
    },
  });

  await logAuditEvent({
    userId: createdByUserId,
    action: 'CREATE_USER',
    entityType: 'User',
    entityId: user.id,
    outcome: 'SUCCESS',
    requestId,
    metadata: { newUsername: user.username, newRole: user.role },
  });

  logger.info('User created', { userId: user.id, username: user.username, role: user.role });

  return { id: user.id, username: user.username, email: user.email, role: user.role };
}

export async function setupAdmin(input: AdminSetupInput, requestId?: string) {
  if (input.setupToken !== env.ADMIN_SETUP_TOKEN) {
    await logAuditEvent({
      action: 'ADMIN_SETUP_ATTEMPT',
      outcome: 'DENIED',
      requestId,
      metadata: { reason: 'Invalid setup token' },
    });
    throw new Error('Invalid setup token');
  }

  // Only allow setup if no admins exist yet
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existingAdmin) {
    throw new Error('Administrator already configured. Use the admin panel to manage users.');
  }

  return createUser(
    { username: input.username, email: input.email, password: input.password, role: 'ADMIN' },
    undefined,
    requestId
  );
}

export async function updateUser(
  targetUserId: string,
  updates: { isActive?: boolean; role?: string },
  requestingUserId: string,
  requestId?: string
) {
  // Prevent self-modification of role
  if (targetUserId === requestingUserId && updates.role !== undefined) {
    throw new Error('You cannot change your own role');
  }

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      ...(updates.role !== undefined && { role: updates.role }),
    },
    select: { id: true, username: true, email: true, role: true, isActive: true },
  });

  await logAuditEvent({
    userId: requestingUserId,
    action: 'UPDATE_USER',
    entityType: 'User',
    entityId: targetUserId,
    outcome: 'SUCCESS',
    requestId,
    metadata: updates,
  });

  return user;
}

export async function getUsers(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);
  return { data: users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
