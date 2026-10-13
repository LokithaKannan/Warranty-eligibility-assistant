import { z } from 'zod';

export const createPolicySchema = z.object({
  name: z.string().min(1).max(200),
  productCategory: z.string().min(1).max(100),
  manufacturerLabel: z.string().min(1).max(200),
  reviewerNotes: z.string().max(2000).optional(),
});

export const confirmPolicySchema = z.object({
  durationMonths: z.number().int().min(1).max(600),
  proofRequired: z.boolean(),
  reviewerNotes: z.string().max(2000).optional(),
  clauses: z
    .array(
      z.object({
        id: z.string().optional(), // existing clause id
        clauseType: z.enum([
          'WARRANTY_DURATION',
          'EXCLUSION',
          'PROOF_REQUIREMENT',
          'CLAIM_PROCEDURE',
          'GENERAL_TERMS',
          'OTHER',
        ]),
        clauseText: z.string().min(1).max(5000),
        pageNumber: z.number().int().min(1).optional(),
        confirmedByReviewer: z.boolean().default(true),
      })
    )
    .optional(),
});

export const updatePolicySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  productCategory: z.string().min(1).max(100).optional(),
  manufacturerLabel: z.string().min(1).max(200).optional(),
  reviewerNotes: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export const policyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().max(200).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  isConfirmed: z.enum(['true', 'false']).optional(),
});

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type ConfirmPolicyInput = z.infer<typeof confirmPolicySchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;
export type PolicyListQuery = z.infer<typeof policyListQuerySchema>;
