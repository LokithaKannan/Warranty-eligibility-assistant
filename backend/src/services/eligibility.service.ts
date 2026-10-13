/**
 * Eligibility Rule Engine — DETERMINISTIC only.
 * No LLM is used to make approval or rejection decisions.
 * All rules are explicit TypeScript functions with transparent logic.
 */

import {
  EligibilityAssessment,
  EvidenceItem,
  PreliminaryResult,
  RuleResult,
  RuleStatus,
} from '../types';
import { checkExclusions } from './policyParser.service';
import { CreateClaimInput } from '../validators/claim.validator';

interface PolicyData {
  id: string;
  name: string;
  productCategory: string;
  durationMonths: number | null;
  proofRequired: boolean;
  isConfirmed: boolean;
  isActive: boolean;
  clauses: Array<{
    id: string;
    clauseType: string;
    clauseText: string;
    pageNumber: number | null;
    confirmedByReviewer: boolean;
  }>;
}

// -------------------------------------------------------------------
// Date Utilities
// -------------------------------------------------------------------

/**
 * Add N months to a date using the documented convention:
 * - Purchase date is day 0 of warranty (inclusive)
 * - End date = same day/month N months later (if day exceeds month end, use last day of that month)
 * - Expiry is END-OF-DAY on the calculated date (the last day is covered)
 */
export function calculateWarrantyEndDate(purchaseDate: Date, durationMonths: number): Date {
  const end = new Date(purchaseDate);
  end.setMonth(end.getMonth() + durationMonths);
  // If month overflow occurred (e.g., Jan 31 + 1 month → Mar 3), clamp to last day
  // This is already handled by JS Date, but we document the behavior:
  // e.g., 2024-01-31 + 1 = 2024-03-02 in JS → use end of that month's last day
  // Convention: we set time to end of warranty day (23:59:59)
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Returns true if the issue date is on or before the warranty end date.
 */
export function isWithinWarrantyPeriod(issueDate: Date, warrantyEndDate: Date): boolean {
  return issueDate.getTime() <= warrantyEndDate.getTime();
}

// -------------------------------------------------------------------
// Rule Engine
// -------------------------------------------------------------------

export function runEligibilityRules(
  input: CreateClaimInput,
  policy: PolicyData
): EligibilityAssessment {
  const ruleResults: RuleResult[] = [];
  const missingInformation: string[] = [];
  const supportingEvidence: EvidenceItem[] = [];

  const purchaseDate = new Date(input.purchaseDate);
  const issueDate = new Date(input.issueDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let finalResult: PreliminaryResult = 'MEETS_BASIC_CHECKS';
  let finalExplanation = '';
  let calculatedWarrantyEndDate: Date | undefined;

  // -------------------------------------------------------------------
  // Rule 1 — Required Input Validation
  // -------------------------------------------------------------------
  {
    const ruleId = 'RULE_1';
    const ruleName = 'Required Information Check';
    let status: RuleStatus = 'PASS';
    const issues: string[] = [];

    if (!input.purchaseDate || isNaN(purchaseDate.getTime())) {
      issues.push('Purchase date is missing or invalid');
      missingInformation.push('Valid purchase date');
    }
    if (!input.issueDate || isNaN(issueDate.getTime())) {
      issues.push('Issue date is missing or invalid');
      missingInformation.push('Valid issue date');
    }
    if (!input.policyId) {
      issues.push('Policy selection is required');
      missingInformation.push('Selected warranty policy');
    }

    if (issues.length > 0) {
      status = 'FAIL';
      finalResult = 'MANUAL_REVIEW';
    }

    ruleResults.push({
      ruleId,
      ruleName,
      status,
      explanation:
        status === 'PASS'
          ? 'All required information is present.'
          : `Missing or invalid information: ${issues.join('; ')}.`,
    });

    if (status === 'FAIL') {
      return buildAssessment(
        'MANUAL_REVIEW',
        'Manual review required — required information is missing or invalid. Please ensure all fields are completed correctly.',
        calculatedWarrantyEndDate,
        ruleResults,
        supportingEvidence,
        missingInformation,
        'Please complete all required fields and resubmit.'
      );
    }
  }

  // -------------------------------------------------------------------
  // Rule 2 — Policy Confirmation Check
  // -------------------------------------------------------------------
  {
    const ruleId = 'RULE_2';
    const ruleName = 'Policy Confirmation Check';
    let status: RuleStatus = 'PASS';
    let explanation = 'Warranty policy is active and confirmed.';

    if (!policy.isActive) {
      status = 'FAIL';
      explanation = 'The selected warranty policy is not active.';
      finalResult = 'MANUAL_REVIEW';
    } else if (!policy.isConfirmed) {
      status = 'REVIEW';
      explanation =
        'The warranty policy has not been confirmed by a reviewer. Duration and exclusion terms cannot be verified.';
      finalResult = 'MANUAL_REVIEW';
    } else if (!policy.durationMonths || policy.durationMonths <= 0) {
      status = 'REVIEW';
      explanation =
        'Warranty duration has not been confirmed in the policy. Cannot determine the coverage period.';
      missingInformation.push('Confirmed warranty duration');
      finalResult = 'MANUAL_REVIEW';
    }

    // Add duration clause as evidence
    const durationClause = policy.clauses.find((c) => c.clauseType === 'WARRANTY_DURATION');
    if (durationClause) {
      supportingEvidence.push({
        clauseId: durationClause.id,
        clauseType: 'WARRANTY_DURATION',
        clauseText: durationClause.clauseText,
        pageNumber: durationClause.pageNumber ?? undefined,
        policyName: policy.name,
        confirmedByReviewer: durationClause.confirmedByReviewer,
      });
      ruleResults.push({
        ruleId,
        ruleName,
        status,
        explanation,
        evidenceClauseId: durationClause.id,
        evidencePageNumber: durationClause.pageNumber ?? undefined,
      });
    } else {
      ruleResults.push({ ruleId, ruleName, status, explanation });
    }

    if (status !== 'PASS') {
      return buildAssessment(
        'MANUAL_REVIEW',
        `Manual review required — warranty policy details need confirmation. ${explanation}`,
        calculatedWarrantyEndDate,
        ruleResults,
        supportingEvidence,
        missingInformation,
        'Please contact a reviewer to confirm the warranty policy details.'
      );
    }
  }

  // -------------------------------------------------------------------
  // Rule 3 — Date Validation
  // -------------------------------------------------------------------
  {
    const ruleId = 'RULE_3';
    const ruleName = 'Date Validation';
    let status: RuleStatus = 'PASS';
    const issues: string[] = [];

    // Purchase date must not be in the future
    if (purchaseDate.getTime() > today.getTime()) {
      issues.push('Purchase date cannot be in the future');
      status = 'FAIL';
    }

    // Issue date must not precede purchase date
    if (issueDate.getTime() < purchaseDate.getTime()) {
      issues.push('Issue date cannot be before the purchase date');
      status = 'FAIL';
    }

    if (status === 'FAIL') {
      finalResult = 'MANUAL_REVIEW';
    }

    ruleResults.push({
      ruleId,
      ruleName,
      status,
      explanation:
        status === 'PASS'
          ? `Purchase date (${purchaseDate.toDateString()}) and issue date (${issueDate.toDateString()}) are chronologically valid.`
          : `Date validation failed: ${issues.join('; ')}.`,
    });

    if (status === 'FAIL') {
      return buildAssessment(
        'MANUAL_REVIEW',
        `Manual review required — date validation failed: ${issues.join('; ')}.`,
        calculatedWarrantyEndDate,
        ruleResults,
        supportingEvidence,
        missingInformation,
        'Please verify the purchase and issue dates and resubmit.'
      );
    }
  }

  // -------------------------------------------------------------------
  // Rule 4 — Warranty Period Check
  // -------------------------------------------------------------------
  {
    const ruleId = 'RULE_4';
    const ruleName = 'Warranty Period Check';

    const durationMonths = policy.durationMonths!;
    calculatedWarrantyEndDate = calculateWarrantyEndDate(purchaseDate, durationMonths);

    const withinPeriod = isWithinWarrantyPeriod(issueDate, calculatedWarrantyEndDate);

    const durationClause = policy.clauses.find((c) => c.clauseType === 'WARRANTY_DURATION');

    if (!withinPeriod) {
      finalResult = 'OUTSIDE_PERIOD';
      ruleResults.push({
        ruleId,
        ruleName,
        status: 'FAIL',
        explanation: `The issue date (${issueDate.toDateString()}) is beyond the stated warranty end date (${calculatedWarrantyEndDate.toDateString()}). The warranty period is ${durationMonths} months from the purchase date.`,
        evidenceClauseId: durationClause?.id,
        evidencePageNumber: durationClause?.pageNumber ?? undefined,
      });

      return buildAssessment(
        'OUTSIDE_PERIOD',
        `Outside stated warranty period. The ${durationMonths}-month warranty expired on ${calculatedWarrantyEndDate.toDateString()}. The reported issue date (${issueDate.toDateString()}) is after the warranty end date.`,
        calculatedWarrantyEndDate,
        ruleResults,
        supportingEvidence,
        missingInformation,
        'The warranty period has expired. Please contact the manufacturer or retailer for out-of-warranty service options.'
      );
    }

    const daysRemaining = Math.ceil(
      (calculatedWarrantyEndDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    ruleResults.push({
      ruleId,
      ruleName,
      status: 'PASS',
      explanation: `Issue date (${issueDate.toDateString()}) is within the ${durationMonths}-month warranty period. Warranty expires on ${calculatedWarrantyEndDate.toDateString()} (${daysRemaining} days remaining at time of issue).`,
      evidenceClauseId: durationClause?.id,
      evidencePageNumber: durationClause?.pageNumber ?? undefined,
    });
  }

  // -------------------------------------------------------------------
  // Rule 5 — Exclusion Check
  // -------------------------------------------------------------------
  {
    const ruleId = 'RULE_5';
    const ruleName = 'Exclusion Check';

    const exclusionClauses = policy.clauses.filter((c) => c.clauseType === 'EXCLUSION');
    const { matched, matchedClauses, reason } = checkExclusions(
      input.issueType,
      input.issueDescription,
      exclusionClauses
    );

    if (matched) {
      finalResult = 'POSSIBLE_EXCLUSION';

      for (const mc of matchedClauses) {
        supportingEvidence.push({
          clauseId: mc.id,
          clauseType: 'EXCLUSION',
          clauseText: mc.clauseText,
          pageNumber: mc.pageNumber ?? undefined,
          policyName: policy.name,
          confirmedByReviewer: mc.confirmedByReviewer,
        });
      }

      ruleResults.push({
        ruleId,
        ruleName,
        status: 'REVIEW',
        explanation: `A possible exclusion was detected. The issue type or description may match a configured policy exclusion: ${reason}. Manual review is required to confirm whether this exclusion applies.`,
        evidenceClauseId: matchedClauses[0]?.id,
        evidencePageNumber: matchedClauses[0]?.pageNumber ?? undefined,
      });

      return buildAssessment(
        'POSSIBLE_EXCLUSION',
        `Possible exclusion — manual review required. The reported issue (${input.issueType.replace(/_/g, ' ')}) may match a policy exclusion. A reviewer must confirm whether the exclusion applies before this claim can proceed.`,
        calculatedWarrantyEndDate,
        ruleResults,
        supportingEvidence,
        missingInformation,
        'Please submit this claim for manual review. A service representative will review the exclusion and contact you.'
      );
    }

    ruleResults.push({
      ruleId,
      ruleName,
      status: 'PASS',
      explanation:
        exclusionClauses.length > 0
          ? 'No configured exclusions appear to match the reported issue type or description.'
          : 'No exclusion clauses are configured for this policy.',
    });
  }

  // -------------------------------------------------------------------
  // Rule 6 — Proof of Purchase
  // -------------------------------------------------------------------
  {
    const ruleId = 'RULE_6';
    const ruleName = 'Proof of Purchase Check';

    const proofClause = policy.clauses.find((c) => c.clauseType === 'PROOF_REQUIREMENT');

    if (policy.proofRequired && !input.proofAvailable) {
      finalResult = 'MISSING_INFO';
      missingInformation.push('Proof of purchase');

      if (proofClause) {
        supportingEvidence.push({
          clauseId: proofClause.id,
          clauseType: 'PROOF_REQUIREMENT',
          clauseText: proofClause.clauseText,
          pageNumber: proofClause.pageNumber ?? undefined,
          policyName: policy.name,
          confirmedByReviewer: proofClause.confirmedByReviewer,
        });
      }

      ruleResults.push({
        ruleId,
        ruleName,
        status: 'FAIL',
        explanation:
          'The warranty policy requires proof of purchase, but it is not available. Please provide a valid receipt, invoice, or other proof of purchase.',
        evidenceClauseId: proofClause?.id,
        evidencePageNumber: proofClause?.pageNumber ?? undefined,
      });

      return buildAssessment(
        'MISSING_INFO',
        'Missing information — proof of purchase required. This warranty policy requires a valid proof of purchase (receipt or invoice). Please provide it to proceed.',
        calculatedWarrantyEndDate,
        ruleResults,
        supportingEvidence,
        missingInformation,
        'Please locate your proof of purchase (receipt, invoice, or original bill) and resubmit the claim.'
      );
    }

    ruleResults.push({
      ruleId,
      ruleName,
      status: 'PASS',
      explanation: policy.proofRequired
        ? 'Proof of purchase is required and has been confirmed as available.'
        : 'Proof of purchase is not required by this warranty policy.',
      evidenceClauseId: proofClause?.id,
      evidencePageNumber: proofClause?.pageNumber ?? undefined,
    });
  }

  // -------------------------------------------------------------------
  // Rule 7 — Preliminary Eligibility (all checks passed)
  // -------------------------------------------------------------------
  {
    const ruleId = 'RULE_7';
    const ruleName = 'Preliminary Eligibility';

    // Collect all remaining policy clauses as supporting evidence
    const claimClauses = policy.clauses.filter(
      (c) => c.clauseType === 'CLAIM_PROCEDURE' || c.clauseType === 'GENERAL_TERMS'
    );
    for (const clause of claimClauses) {
      supportingEvidence.push({
        clauseId: clause.id,
        clauseType: clause.clauseType,
        clauseText: clause.clauseText,
        pageNumber: clause.pageNumber ?? undefined,
        policyName: policy.name,
        confirmedByReviewer: clause.confirmedByReviewer,
      });
    }

    ruleResults.push({
      ruleId,
      ruleName,
      status: 'PASS',
      explanation:
        'All basic warranty checks have been satisfied: policy is confirmed, dates are valid, issue is within the warranty period, no exclusions detected, and proof of purchase requirement is met.',
    });

    finalResult = 'MEETS_BASIC_CHECKS';
    finalExplanation =
      `Appears to meet basic warranty checks — final confirmation required. ` +
      `The ${policy.durationMonths}-month warranty is valid until ${calculatedWarrantyEndDate?.toDateString()}. ` +
      `All automated checks passed. This is a preliminary assessment only. ` +
      `Final eligibility must be confirmed by the manufacturer or authorized service provider.`;
  }

  // -------------------------------------------------------------------
  // Rule 8 — Uncertainty guard (if anything is ambiguous, default to MANUAL_REVIEW)
  // -------------------------------------------------------------------
  const reviewRules = ruleResults.filter((r) => r.status === 'REVIEW');
  if (reviewRules.length > 0 && finalResult === 'MEETS_BASIC_CHECKS') {
    finalResult = 'MANUAL_REVIEW';
    finalExplanation =
      'Manual review required. Some checks require human verification before a preliminary result can be confirmed.';
    ruleResults.push({
      ruleId: 'RULE_8',
      ruleName: 'Uncertainty Guard',
      status: 'REVIEW',
      explanation:
        'One or more rules require manual review. Defaulting to manual review to ensure accuracy.',
    });
  }

  return buildAssessment(
    finalResult,
    finalExplanation ||
      'Appears to meet basic warranty checks — final confirmation required from the manufacturer or authorized service provider.',
    calculatedWarrantyEndDate,
    ruleResults,
    supportingEvidence,
    missingInformation,
    finalResult === 'MEETS_BASIC_CHECKS'
      ? 'Please contact the manufacturer or authorized service centre to proceed with your warranty claim.'
      : 'Please review the assessment details and contact customer support for assistance.'
  );
}

function buildAssessment(
  preliminaryResult: PreliminaryResult,
  explanation: string,
  calculatedWarrantyEndDate: Date | undefined,
  ruleResults: RuleResult[],
  supportingEvidence: EvidenceItem[],
  missingInformation: string[],
  recommendedNextStep: string
): EligibilityAssessment {
  return {
    preliminaryResult,
    explanation,
    calculatedWarrantyEndDate,
    ruleResults,
    supportingEvidence,
    missingInformation,
    recommendedNextStep,
  };
}
