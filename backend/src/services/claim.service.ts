import { prisma } from '../config/database';
import { runEligibilityRules } from './eligibility.service';
import { logAuditEvent } from './audit.service';
import { logger } from '../utils/logger';
import { generateReferenceCode } from '../utils/crypto';
import { CreateClaimInput, ReviewClaimInput, ClaimListQuery } from '../validators/claim.validator';

export async function checkClaim(
  input: CreateClaimInput,
  userId: string,
  requestId?: string
) {
  // Load policy with clauses
  const policy = await prisma.policy.findUnique({
    where: { id: input.policyId },
    include: { clauses: true },
  });

  if (!policy) throw new Error('Policy not found');
  if (!policy.isActive) throw new Error('This policy is not currently active');

  // Run deterministic rule engine
  const assessment = runEligibilityRules(input, policy);

  const referenceCode = generateReferenceCode();

  // Persist the claim
  const claim = await prisma.claimCheck.create({
    data: {
      referenceCode,
      userId,
      policyId: input.policyId,
      productName: input.productName,
      productCategory: input.productCategory,
      purchaseDate: new Date(input.purchaseDate),
      issueDate: new Date(input.issueDate),
      issueType: input.issueType,
      issueDescription: input.issueDescription,
      proofAvailable: input.proofAvailable,
      calculatedWarrantyEndDate: assessment.calculatedWarrantyEndDate ?? null,
      preliminaryResult: assessment.preliminaryResult,
      explanation: assessment.explanation,
      ruleResults: JSON.stringify(assessment.ruleResults),
      reviewStatus: 'PENDING',
    },
    include: {
      policy: {
        include: { clauses: true },
      },
      user: { select: { id: true, username: true } },
    },
  });

  await logAuditEvent({
    userId,
    action: 'CLAIM_CHECK',
    entityType: 'ClaimCheck',
    entityId: claim.id,
    outcome: 'SUCCESS',
    requestId,
    metadata: {
      referenceCode,
      policyId: input.policyId,
      preliminaryResult: assessment.preliminaryResult,
    },
  });

  logger.info('Claim assessed', {
    claimId: claim.id,
    referenceCode,
    result: assessment.preliminaryResult,
  });

  return {
    claim,
    assessment,
  };
}

export async function getClaims(
  query: ClaimListQuery,
  userId: string,
  userRole: string
) {
  const { page, pageSize, search, preliminaryResult, reviewStatus } = query;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  // Customers only see their own claims
  if (userRole === 'CUSTOMER') {
    where.userId = userId;
  }

  if (search) {
    where.OR = [
      { referenceCode: { contains: search } },
      { productName: { contains: search } },
    ];
  }
  if (preliminaryResult) where.preliminaryResult = preliminaryResult;
  if (reviewStatus) where.reviewStatus = reviewStatus;

  const [total, claims] = await Promise.all([
    prisma.claimCheck.count({ where }),
    prisma.claimCheck.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        policy: { select: { id: true, name: true, productCategory: true } },
        user: { select: { id: true, username: true } },
      },
    }),
  ]);

  return { data: claims, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getClaimByReference(
  referenceCode: string,
  userId: string,
  userRole: string
) {
  const claim = await prisma.claimCheck.findUnique({
    where: { referenceCode },
    include: {
      policy: {
        include: { clauses: true },
      },
      user: { select: { id: true, username: true } },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: { reviewer: { select: { id: true, username: true } } },
      },
    },
  });

  if (!claim) return null;

  // Customers can only see their own claims
  if (userRole === 'CUSTOMER' && claim.userId !== userId) {
    return null;
  }

  return claim;
}

export async function reviewClaim(
  referenceCode: string,
  input: ReviewClaimInput,
  reviewerId: string,
  requestId?: string
) {
  const claim = await prisma.claimCheck.findUnique({ where: { referenceCode } });
  if (!claim) throw new Error('Claim not found');

  const newReviewStatus =
    input.reviewAction === 'REQUESTED_MORE_INFO' ? 'NEEDS_MORE_INFO' : 'REVIEWED';

  const [updatedClaim, review] = await prisma.$transaction([
    prisma.claimCheck.update({
      where: { referenceCode },
      data: { reviewStatus: newReviewStatus },
    }),
    prisma.claimReview.create({
      data: {
        claimId: claim.id,
        reviewerId,
        reviewAction: input.reviewAction,
        reviewerNotes: input.reviewerNotes ?? null,
        reviewOutcome: input.reviewOutcome ?? null,
      },
    }),
  ]);

  await logAuditEvent({
    userId: reviewerId,
    action: 'CLAIM_REVIEW',
    entityType: 'ClaimCheck',
    entityId: claim.id,
    outcome: 'SUCCESS',
    requestId,
    metadata: {
      referenceCode,
      reviewAction: input.reviewAction,
      reviewOutcome: input.reviewOutcome,
    },
  });

  logger.info('Claim reviewed', { referenceCode, action: input.reviewAction });

  return { claim: updatedClaim, review };
}

export async function getClaimHistory(referenceCode: string) {
  return prisma.claimReview.findMany({
    where: { claim: { referenceCode } },
    orderBy: { createdAt: 'desc' },
    include: {
      reviewer: { select: { id: true, username: true } },
    },
  });
}

export async function getDashboardStats(userId: string, userRole: string) {
  const isAdmin = userRole === 'ADMIN' || userRole === 'REVIEWER';

  const claimsWhere = isAdmin ? {} : { userId };

  const [
    totalPolicies,
    activePolicies,
    totalClaims,
    pendingClaims,
    needsInfoClaims,
    recentClaims,
  ] = await Promise.all([
    isAdmin ? prisma.policy.count() : prisma.policy.count({ where: { isActive: true, isConfirmed: true } }),
    prisma.policy.count({ where: { isActive: true } }),
    prisma.claimCheck.count({ where: claimsWhere }),
    prisma.claimCheck.count({ where: { ...claimsWhere, reviewStatus: 'PENDING' } }),
    prisma.claimCheck.count({ where: { ...claimsWhere, reviewStatus: 'NEEDS_MORE_INFO' } }),
    prisma.claimCheck.findMany({
      where: claimsWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        policy: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } },
      },
    }),
  ]);

  return {
    totalPolicies,
    activePolicies,
    totalClaims,
    pendingClaims,
    needsInfoClaims,
    recentClaims,
  };
}
