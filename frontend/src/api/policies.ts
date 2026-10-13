import apiClient from './client';
import { Policy, PolicyClause, PaginatedResponse } from '../types';

export interface PolicyListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  isConfirmed?: boolean;
}

export async function getPolicies(params?: PolicyListParams) {
  const res = await apiClient.get<{ success: boolean; data: PaginatedResponse<Policy> }>(
    '/policies',
    { params }
  );
  return res.data.data;
}

export async function getPolicyById(id: string) {
  const res = await apiClient.get<{ success: boolean; data: Policy }>(`/policies/${id}`);
  return res.data.data;
}

export async function uploadPolicy(formData: FormData) {
  const res = await apiClient.post<{
    success: boolean;
    data: {
      policy: Policy;
      extraction: {
        status: string;
        totalPages: number;
        message?: string;
        detectedClauses: Array<{
          clauseType: string;
          clauseText: string;
          pageNumber?: number;
          confidence: string;
          suggestedValue?: string;
        }>;
        rawSuggestions: Record<string, string>;
      };
    };
  }>('/policies', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function confirmPolicy(
  id: string,
  data: {
    durationMonths: number;
    proofRequired: boolean;
    reviewerNotes?: string;
    clauses?: Array<{
      clauseType: string;
      clauseText: string;
      pageNumber?: number;
      confirmedByReviewer: boolean;
    }>;
  }
) {
  const res = await apiClient.post<{ success: boolean; data: Policy }>(
    `/policies/${id}/confirm`,
    data
  );
  return res.data.data;
}

export async function updatePolicy(
  id: string,
  data: { name?: string; productCategory?: string; isActive?: boolean; reviewerNotes?: string }
) {
  const res = await apiClient.patch<{ success: boolean; data: Policy }>(
    `/policies/${id}`,
    data
  );
  return res.data.data;
}

export async function getPolicyClauses(id: string) {
  const res = await apiClient.get<{ success: boolean; data: PolicyClause[] }>(
    `/policies/${id}/clauses`
  );
  return res.data.data;
}

export async function getPolicyExtractedText(id: string) {
  const res = await apiClient.get<{
    success: boolean;
    data: { id: string; extractedText: string | null; extractionStatus: string; originalFilename: string };
  }>(`/policies/${id}/extracted-text`);
  return res.data.data;
}
