import { Request } from 'express';

export type UserRole = 'ADMIN' | 'REVIEWER' | 'CUSTOMER';

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  requestId?: string;
}

export type PreliminaryResult =
  | 'MEETS_BASIC_CHECKS'
  | 'OUTSIDE_PERIOD'
  | 'POSSIBLE_EXCLUSION'
  | 'MISSING_INFO'
  | 'MANUAL_REVIEW';

export type RuleStatus = 'PASS' | 'FAIL' | 'REVIEW';

export interface RuleResult {
  ruleId: string;
  ruleName: string;
  status: RuleStatus;
  explanation: string;
  evidenceClauseId?: string;
  evidencePageNumber?: number;
}

export interface EligibilityAssessment {
  preliminaryResult: PreliminaryResult;
  explanation: string;
  calculatedWarrantyEndDate?: Date;
  ruleResults: RuleResult[];
  supportingEvidence: EvidenceItem[];
  missingInformation: string[];
  recommendedNextStep: string;
}

export interface EvidenceItem {
  clauseId?: string;
  clauseType: string;
  clauseText: string;
  pageNumber?: number;
  policyName: string;
  confirmedByReviewer: boolean;
}

export type ExtractionStatus = 'PENDING' | 'EXTRACTED' | 'FAILED' | 'NEEDS_OCR';

export type ClauseType =
  | 'WARRANTY_DURATION'
  | 'EXCLUSION'
  | 'PROOF_REQUIREMENT'
  | 'CLAIM_PROCEDURE'
  | 'GENERAL_TERMS'
  | 'OTHER';

export type ReviewStatus = 'PENDING' | 'REVIEWED' | 'NEEDS_MORE_INFO';

export type ReviewAction = 'REVIEWED' | 'REQUESTED_MORE_INFO' | 'ESCALATED';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type IssueType =
  | 'BATTERY_FAILURE'
  | 'CHARGING_PROBLEM'
  | 'PHYSICAL_DAMAGE'
  | 'WATER_DAMAGE'
  | 'MANUFACTURING_DEFECT'
  | 'SOFTWARE_ISSUE'
  | 'ACCESSORY_FAILURE'
  | 'OTHER';

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  BATTERY_FAILURE: 'Battery Failure',
  CHARGING_PROBLEM: 'Charging Problem',
  PHYSICAL_DAMAGE: 'Physical Damage',
  WATER_DAMAGE: 'Water Damage',
  MANUFACTURING_DEFECT: 'Manufacturing Defect',
  SOFTWARE_ISSUE: 'Software Issue',
  ACCESSORY_FAILURE: 'Accessory Failure',
  OTHER: 'Other',
};

export const PRELIMINARY_RESULT_LABELS: Record<PreliminaryResult, string> = {
  MEETS_BASIC_CHECKS: 'Appears to Meet Basic Warranty Checks',
  OUTSIDE_PERIOD: 'Outside Stated Warranty Period',
  POSSIBLE_EXCLUSION: 'Possible Exclusion — Manual Review Required',
  MISSING_INFO: 'Missing Information',
  MANUAL_REVIEW: 'Manual Review Required',
};
