import { prisma } from '../config/database';
import { extractPdfText } from './pdf.service';
import { parsePolicyText } from './policyParser.service';
import { logAuditEvent } from './audit.service';
import { logger } from '../utils/logger';
import {
  CreatePolicyInput,
  ConfirmPolicyInput,
  UpdatePolicyInput,
  PolicyListQuery,
} from '../validators/policy.validator';

export async function uploadPolicy(
  fileBuffer: Buffer,
  originalFilename: string,
  input: CreatePolicyInput,
  userId: string,
  requestId?: string
) {
  // Extract PDF
  const extraction = await extractPdfText(fileBuffer, originalFilename);

  if (extraction.status === 'FAILED') {
    throw new Error(extraction.message ?? 'PDF extraction failed');
  }

  // Parse clause suggestions from extracted text (even for NEEDS_OCR status)
  const parsedInfo =
    extraction.status === 'EXTRACTED' ? parsePolicyText(extraction.pages) : null;

  // Create policy record
  const policy = await prisma.policy.create({
    data: {
      name: input.name,
      productCategory: input.productCategory,
      manufacturerLabel: input.manufacturerLabel,
      originalFilename: extraction.originalFilename,
      storedFilename: extraction.storedFilename,
      fileHash: extraction.fileHash,
      extractionStatus: extraction.status,
      extractedText:
        extraction.status === 'EXTRACTED'
          ? extraction.fullText.slice(0, 100000) // Store up to 100k chars
          : null,
      reviewerNotes: input.reviewerNotes ?? null,
      isConfirmed: false,
      isActive: true,
      durationMonths: parsedInfo?.detectedDurationMonths ?? null,
      proofRequired: parsedInfo?.detectedProofRequired ?? true,
      createdById: userId,
    },
  });

  // Auto-create detected clause suggestions (unconfirmed)
  if (parsedInfo?.detectedClauses && parsedInfo.detectedClauses.length > 0) {
    await prisma.policyClause.createMany({
      data: parsedInfo.detectedClauses.map((clause) => ({
        policyId: policy.id,
        clauseType: clause.clauseType,
        clauseText: clause.clauseText,
        pageNumber: clause.pageNumber ?? null,
        confirmedByReviewer: false,
      })),
    });
  }

  await logAuditEvent({
    userId,
    action: 'POLICY_UPLOAD',
    entityType: 'Policy',
    entityId: policy.id,
    outcome: 'SUCCESS',
    requestId,
    metadata: {
      originalFilename: extraction.originalFilename,
      extractionStatus: extraction.status,
      totalPages: extraction.totalPages,
    },
  });

  logger.info('Policy uploaded', { policyId: policy.id, status: extraction.status });

  return {
    policy,
    extraction: {
      status: extraction.status,
      totalPages: extraction.totalPages,
      message: extraction.message,
      detectedClauses: parsedInfo?.detectedClauses ?? [],
      rawSuggestions: parsedInfo?.rawSuggestions ?? {},
    },
  };
}

export async function confirmPolicy(
  policyId: string,
  input: ConfirmPolicyInput,
  userId: string,
  requestId?: string
) {
  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy) throw new Error('Policy not found');

  // Delete old auto-detected clauses and replace with reviewer-confirmed ones
  if (input.clauses && input.clauses.length > 0) {
    await prisma.policyClause.deleteMany({ where: { policyId } });
    await prisma.policyClause.createMany({
      data: input.clauses.map((c) => ({
        policyId,
        clauseType: c.clauseType,
        clauseText: c.clauseText,
        pageNumber: c.pageNumber ?? null,
        confirmedByReviewer: true,
      })),
    });
  } else {
    // Just mark all existing clauses as confirmed
    await prisma.policyClause.updateMany({
      where: { policyId },
      data: { confirmedByReviewer: true },
    });
  }

  const updated = await prisma.policy.update({
    where: { id: policyId },
    data: {
      durationMonths: input.durationMonths,
      proofRequired: input.proofRequired,
      reviewerNotes: input.reviewerNotes ?? policy.reviewerNotes,
      isConfirmed: true,
    },
    include: { clauses: true },
  });

  await logAuditEvent({
    userId,
    action: 'POLICY_CONFIRM',
    entityType: 'Policy',
    entityId: policyId,
    outcome: 'SUCCESS',
    requestId,
    metadata: { durationMonths: input.durationMonths, proofRequired: input.proofRequired },
  });

  return updated;
}

export async function getPolicies(query: PolicyListQuery, userId?: string, userRole?: string) {
  const { page, pageSize, search, isActive, isConfirmed } = query;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { productCategory: { contains: search } },
      { manufacturerLabel: { contains: search } },
    ];
  }
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (isConfirmed !== undefined) where.isConfirmed = isConfirmed === 'true';

  // Customers can only see active + confirmed policies
  if (userRole === 'CUSTOMER') {
    where.isActive = true;
    where.isConfirmed = true;
  }

  const [total, policies] = await Promise.all([
    prisma.policy.count({ where }),
    prisma.policy.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, username: true } },
        _count: { select: { claimChecks: true } },
      },
    }),
  ]);

  return { data: policies, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getPolicyById(policyId: string) {
  return prisma.policy.findUnique({
    where: { id: policyId },
    include: {
      clauses: { orderBy: { clauseType: 'asc' } },
      createdBy: { select: { id: true, username: true } },
      _count: { select: { claimChecks: true } },
    },
  });
}

export async function updatePolicy(
  policyId: string,
  input: UpdatePolicyInput,
  userId: string,
  requestId?: string
) {
  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy) throw new Error('Policy not found');

  const updated = await prisma.policy.update({
    where: { id: policyId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.productCategory && { productCategory: input.productCategory }),
      ...(input.manufacturerLabel && { manufacturerLabel: input.manufacturerLabel }),
      ...(input.reviewerNotes !== undefined && { reviewerNotes: input.reviewerNotes }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  await logAuditEvent({
    userId,
    action: 'POLICY_UPDATE',
    entityType: 'Policy',
    entityId: policyId,
    outcome: 'SUCCESS',
    requestId,
  });

  return updated;
}

export async function getExtractedText(policyId: string) {
  const policy = await prisma.policy.findUnique({
    where: { id: policyId },
    select: { id: true, extractedText: true, extractionStatus: true, originalFilename: true },
  });
  return policy;
}
