import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface AuditEventOptions {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  outcome?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(opts: AuditEventOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entityType: opts.entityType ?? null,
        entityId: opts.entityId ?? null,
        outcome: opts.outcome ?? 'SUCCESS',
        requestId: opts.requestId ?? null,
        metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      },
    });
  } catch (error) {
    // Audit failures must not crash the main flow
    logger.error('Failed to write audit log', { error: String(error), action: opts.action });
  }
}

export async function getAuditLogs(options: {
  page: number;
  pageSize: number;
  userId?: string;
}) {
  const { page, pageSize, userId } = options;
  const skip = (page - 1) * pageSize;

  const where = userId ? { userId } : {};

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, role: true },
        },
      },
    }),
  ]);

  return {
    data: logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
