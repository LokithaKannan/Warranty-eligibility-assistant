import apiClient from './client';
import { ClaimCheck, PaginatedResponse, EligibilityAssessment, ClaimReview } from '../types';

export interface ClaimListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  preliminaryResult?: string;
  reviewStatus?: string;
}

export interface CreateClaimInput {
  policyId: string;
  productName: string;
  productCategory: string;
  purchaseDate: string;
  issueDate: string;
  issueType: string;
  issueDescription: string;
  proofAvailable: boolean;
}

export async function getClaims(params?: ClaimListParams) {
  const res = await apiClient.get<{ success: boolean; data: PaginatedResponse<ClaimCheck> }>(
    '/claims',
    { params }
  );
  return res.data.data;
}

export async function getClaimByReference(referenceCode: string) {
  const res = await apiClient.get<{ success: boolean; data: ClaimCheck }>(
    `/claims/${referenceCode}`
  );
  return res.data.data;
}

export async function checkClaim(input: CreateClaimInput) {
  const res = await apiClient.post<{
    success: boolean;
    data: { claim: ClaimCheck; assessment: EligibilityAssessment };
  }>('/claims/check', input);
  return res.data.data;
}

export async function reviewClaim(
  referenceCode: string,
  data: {
    reviewAction: string;
    reviewerNotes?: string;
    reviewOutcome?: string;
  }
) {
  const res = await apiClient.patch<{
    success: boolean;
    data: { claim: ClaimCheck; review: ClaimReview };
  }>(`/claims/${referenceCode}/review`, data);
  return res.data.data;
}

export async function getClaimHistory(referenceCode: string) {
  const res = await apiClient.get<{ success: boolean; data: ClaimReview[] }>(
    `/claims/${referenceCode}/history`
  );
  return res.data.data;
}
