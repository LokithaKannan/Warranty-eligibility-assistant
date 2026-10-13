export type UserRole = 'ADMIN' | 'REVIEWER' | 'CUSTOMER';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type PreliminaryResult =
  | 'MEETS_BASIC_CHECKS'
  | 'OUTSIDE_PERIOD'
  | 'POSSIBLE_EXCLUSION'
  | 'MISSING_INFO'
  | 'MANUAL_REVIEW';

export type RuleStatus = 'PASS' | 'FAIL' | 'REVIEW';
export type ReviewStatus = 'PENDING' | 'REVIEWED' | 'NEEDS_MORE_INFO';
export type ExtractionStatus = 'PENDING' | 'EXTRACTED' | 'FAILED' | 'NEEDS_OCR';
export type ClauseType =
  | 'WARRANTY_DURATION'
  | 'EXCLUSION'
  | 'PROOF_REQUIREMENT'
  | 'CLAIM_PROCEDURE'
  | 'GENERAL_TERMS'
  | 'OTHER';

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  status: RuleStatus;
  explanation: string;
  evidenceClauseId?: string;
  evidencePageNumber?: number;
}

export interface EvidenceItem {
  clauseId?: string;
  clauseType: string;
  clauseText: string;
  pageNumber?: number;
  policyName: string;
  confirmedByReviewer: boolean;
}

export interface EligibilityAssessment {
  preliminaryResult: PreliminaryResult;
  explanation: string;
  calculatedWarrantyEndDate?: string;
  ruleResults: RuleResult[];
  supportingEvidence: EvidenceItem[];
  missingInformation: string[];
  recommendedNextStep: string;
}

export interface PolicyClause {
  id: string;
  policyId: string;
  clauseType: ClauseType;
  clauseText: string;
  pageNumber?: number;
  confirmedByReviewer: boolean;
  createdAt: string;
}

export interface Policy {
  id: string;
  name: string;
  productCategory: string;
  manufacturerLabel: string;
  durationMonths: number | null;
  proofRequired: boolean;
  originalFilename: string;
  storedFilename: string;
  extractionStatus: ExtractionStatus;
  isConfirmed: boolean;
  isActive: boolean;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; username: string };
  clauses?: PolicyClause[];
  _count?: { claimChecks: number };
}

export interface ClaimReview {
  id: string;
  claimId: string;
  reviewerId: string;
  reviewAction: string;
  reviewerNotes?: string;
  reviewOutcome?: string;
  createdAt: string;
  reviewer?: { id: string; username: string };
}

export interface ClaimCheck {
  id: string;
  referenceCode: string;
  userId: string;
  policyId: string;
  productName: string;
  productCategory: string;
  purchaseDate: string;
  issueDate: string;
  issueType: string;
  issueDescription: string;
  proofAvailable: boolean;
  calculatedWarrantyEndDate?: string;
  preliminaryResult: PreliminaryResult;
  explanation: string;
  ruleResults: string; // JSON string
  reviewStatus: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  policy?: Policy;
  user?: { id: string; username: string };
  reviews?: ClaimReview[];
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  outcome: string;
  requestId?: string;
  metadata?: string;
  createdAt: string;
  user?: { id: string; username: string; role: string } | null;
}

export interface DashboardStats {
  totalPolicies: number;
  activePolicies: number;
  totalClaims: number;
  pendingClaims: number;
  needsInfoClaims: number;
  recentClaims: ClaimCheck[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  requestId?: string;
}

export const PRELIMINARY_RESULT_LABELS: Record<PreliminaryResult, string> = {
  MEETS_BASIC_CHECKS: 'Appears to Meet Basic Checks',
  OUTSIDE_PERIOD: 'Outside Warranty Period',
  POSSIBLE_EXCLUSION: 'Possible Exclusion',
  MISSING_INFO: 'Missing Information',
  MANUAL_REVIEW: 'Manual Review Required',
};

export const ISSUE_TYPE_LABELS: Record<string, string> = {
  BATTERY_FAILURE: 'Battery Failure',
  CHARGING_PROBLEM: 'Charging Problem',
  PHYSICAL_DAMAGE: 'Physical Damage',
  WATER_DAMAGE: 'Water Damage',
  MANUFACTURING_DEFECT: 'Manufacturing Defect',
  SOFTWARE_ISSUE: 'Software Issue',
  ACCESSORY_FAILURE: 'Accessory Failure',
  OTHER: 'Other',
};

export const CLAUSE_TYPE_LABELS: Record<ClauseType, string> = {
  WARRANTY_DURATION: 'Warranty Duration',
  EXCLUSION: 'Exclusion',
  PROOF_REQUIREMENT: 'Proof of Purchase',
  CLAIM_PROCEDURE: 'Claim Procedure',
  GENERAL_TERMS: 'General Terms',
  OTHER: 'Other',
};
