import { z } from 'zod';

export const createClaimSchema = z.object({
  policyId: z.string().min(1, 'Policy is required'),
  productName: z.string().min(1).max(200),
  productCategory: z.string().min(1).max(100),
  purchaseDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid purchase date'),
  issueDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid issue date'),
  issueType: z.enum([
    'BATTERY_FAILURE',
    'CHARGING_PROBLEM',
    'PHYSICAL_DAMAGE',
    'WATER_DAMAGE',
    'MANUFACTURING_DEFECT',
    'SOFTWARE_ISSUE',
    'ACCESSORY_FAILURE',
    'OTHER',
  ]),
  issueDescription: z.string().min(10, 'Please provide at least 10 characters describing the issue').max(2000),
  proofAvailable: z.boolean(),
});

export const reviewClaimSchema = z.object({
  reviewAction: z.enum(['REVIEWED', 'REQUESTED_MORE_INFO', 'ESCALATED']),
  reviewerNotes: z.string().max(2000).optional(),
  reviewOutcome: z.enum(['APPROVED_FOR_SUBMISSION', 'REJECTED', 'PENDING_MORE_INFO']).optional(),
}).refine((data) => {
  // When requesting more info, notes are required
  if (data.reviewAction === 'REQUESTED_MORE_INFO' && !data.reviewerNotes) {
    return false;
  }
  return true;
}, { message: 'Reviewer notes are required when requesting more information', path: ['reviewerNotes'] });

export const claimListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().max(200).optional(),
  preliminaryResult: z.enum([
    'MEETS_BASIC_CHECKS',
    'OUTSIDE_PERIOD',
    'POSSIBLE_EXCLUSION',
    'MISSING_INFO',
    'MANUAL_REVIEW',
  ]).optional(),
  reviewStatus: z.enum(['PENDING', 'REVIEWED', 'NEEDS_MORE_INFO']).optional(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type ReviewClaimInput = z.infer<typeof reviewClaimSchema>;
export type ClaimListQuery = z.infer<typeof claimListQuerySchema>;
