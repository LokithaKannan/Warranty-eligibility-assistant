import { describe, it, expect } from 'vitest';
import { runEligibilityRules, calculateWarrantyEndDate, isWithinWarrantyPeriod } from '../src/services/eligibility.service';

// Helper: build a mock policy
function mockPolicy(overrides: Partial<{
  durationMonths: number | null;
  proofRequired: boolean;
  isConfirmed: boolean;
  isActive: boolean;
  clauses: any[];
}> = {}) {
  return {
    id: 'test-policy-1',
    name: 'Test Warranty Policy',
    productCategory: 'Electronics',
    durationMonths: overrides.durationMonths !== undefined ? overrides.durationMonths : 12,
    proofRequired: overrides.proofRequired !== undefined ? overrides.proofRequired : true,
    isConfirmed: overrides.isConfirmed !== undefined ? overrides.isConfirmed : true,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    clauses: overrides.clauses ?? [
      {
        id: 'clause-dur',
        clauseType: 'WARRANTY_DURATION',
        clauseText: '12-month limited warranty from date of purchase.',
        pageNumber: 1,
        confirmedByReviewer: true,
      },
      {
        id: 'clause-proof',
        clauseType: 'PROOF_REQUIREMENT',
        clauseText: 'Original receipt required.',
        pageNumber: 1,
        confirmedByReviewer: true,
      },
    ],
  };
}

// Helper: build a valid claim input
function mockClaim(overrides: Partial<{
  policyId: string;
  purchaseDate: string;
  issueDate: string;
  issueType: any;
  issueDescription: string;
  proofAvailable: boolean;
  productName: string;
  productCategory: string;
}> = {}) {
  return {
    policyId: overrides.policyId ?? 'test-policy-1',
    productName: overrides.productName ?? 'Test Product',
    productCategory: overrides.productCategory ?? 'Electronics',
    purchaseDate: overrides.purchaseDate ?? '2026-01-01',
    issueDate: overrides.issueDate ?? '2026-06-01',
    issueType: overrides.issueType ?? 'MANUFACTURING_DEFECT',
    issueDescription: overrides.issueDescription ?? 'The device stopped working unexpectedly after normal use.',
    proofAvailable: overrides.proofAvailable !== undefined ? overrides.proofAvailable : true,
  };
}

// ---------------------------------------------------------------
// calculateWarrantyEndDate tests
// ---------------------------------------------------------------
describe('calculateWarrantyEndDate', () => {
  it('adds months correctly for standard date', () => {
    const start = new Date('2026-01-01');
    const end = calculateWarrantyEndDate(start, 12);
    expect(end.getFullYear()).toBe(2027);
    expect(end.getMonth()).toBe(0); // January
    expect(end.getDate()).toBe(1);
  });

  it('handles 24-month duration', () => {
    const start = new Date('2026-03-15');
    const end = calculateWarrantyEndDate(start, 24);
    expect(end.getFullYear()).toBe(2028);
    expect(end.getMonth()).toBe(2); // March
  });
});

describe('isWithinWarrantyPeriod', () => {
  it('returns true when issue is within period', () => {
    const issueDate = new Date('2026-06-01');
    const endDate = new Date('2027-01-01T23:59:59.999Z');
    expect(isWithinWarrantyPeriod(issueDate, endDate)).toBe(true);
  });

  it('returns false when issue is after warranty end', () => {
    const issueDate = new Date('2027-06-01');
    const endDate = new Date('2027-01-01T23:59:59.999Z');
    expect(isWithinWarrantyPeriod(issueDate, endDate)).toBe(false);
  });
});

// ---------------------------------------------------------------
// Rule Engine Tests
// ---------------------------------------------------------------
describe('Eligibility Rule Engine', () => {
  // Test 8: Missing purchase date
  it('returns MANUAL_REVIEW when purchase date is missing', () => {
    const claim = mockClaim({ purchaseDate: '' });
    const result = runEligibilityRules(claim as any, mockPolicy());
    expect(result.preliminaryResult).toBe('MANUAL_REVIEW');
    const rule1 = result.ruleResults.find((r) => r.ruleId === 'RULE_1');
    expect(rule1?.status).toBe('FAIL');
  });

  // Test 9: Future purchase date
  it('returns MANUAL_REVIEW for future purchase date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const claim = mockClaim({ purchaseDate: futureDate.toISOString() });
    const result = runEligibilityRules(claim, mockPolicy());
    expect(result.preliminaryResult).toBe('MANUAL_REVIEW');
    const rule3 = result.ruleResults.find((r) => r.ruleId === 'RULE_3');
    expect(rule3?.status).toBe('FAIL');
  });

  // Test 10: Issue date before purchase date
  it('returns MANUAL_REVIEW when issue date precedes purchase date', () => {
    const claim = mockClaim({
      purchaseDate: '2026-06-01',
      issueDate: '2026-01-01',
    });
    const result = runEligibilityRules(claim, mockPolicy());
    expect(result.preliminaryResult).toBe('MANUAL_REVIEW');
    const rule3 = result.ruleResults.find((r) => r.ruleId === 'RULE_3');
    expect(rule3?.status).toBe('FAIL');
  });

  // Test 11: Claim within period, no exclusion
  it('returns MEETS_BASIC_CHECKS for in-period non-excluded issue', () => {
    const claim = mockClaim({
      purchaseDate: '2026-01-01',
      issueDate: '2026-06-01',
      issueType: 'MANUFACTURING_DEFECT',
      proofAvailable: true,
    });
    const result = runEligibilityRules(claim, mockPolicy());
    expect(result.preliminaryResult).toBe('MEETS_BASIC_CHECKS');
    expect(result.calculatedWarrantyEndDate).toBeDefined();
  });

  // Test 12: Outside warranty period
  it('returns OUTSIDE_PERIOD when issue is after warranty end', () => {
    const claim = mockClaim({
      purchaseDate: '2025-01-01',
      issueDate: '2026-06-01', // 17 months after purchase, only 12-month warranty
    });
    const result = runEligibilityRules(claim, mockPolicy());
    expect(result.preliminaryResult).toBe('OUTSIDE_PERIOD');
    const rule4 = result.ruleResults.find((r) => r.ruleId === 'RULE_4');
    expect(rule4?.status).toBe('FAIL');
  });

  // Test 13: Possible exclusion (physical damage)
  it('returns POSSIBLE_EXCLUSION when issue matches exclusion', () => {
    const policyWithExclusion = mockPolicy({
      clauses: [
        {
          id: 'clause-dur',
          clauseType: 'WARRANTY_DURATION',
          clauseText: '12-month warranty.',
          pageNumber: 1,
          confirmedByReviewer: true,
        },
        {
          id: 'clause-excl',
          clauseType: 'EXCLUSION',
          clauseText: 'This warranty does not cover physical damage or water damage.',
          pageNumber: 1,
          confirmedByReviewer: true,
        },
        {
          id: 'clause-proof',
          clauseType: 'PROOF_REQUIREMENT',
          clauseText: 'Receipt required.',
          pageNumber: 1,
          confirmedByReviewer: true,
        },
      ],
    });

    const claim = mockClaim({
      purchaseDate: '2026-01-01',
      issueDate: '2026-06-01',
      issueType: 'PHYSICAL_DAMAGE',
      issueDescription: 'The screen has physical damage from a drop.',
      proofAvailable: true,
    });
    const result = runEligibilityRules(claim, policyWithExclusion);
    expect(result.preliminaryResult).toBe('POSSIBLE_EXCLUSION');
  });

  // Test 14: Missing proof of purchase
  it('returns MISSING_INFO when proof is required but unavailable', () => {
    const claim = mockClaim({
      purchaseDate: '2026-01-01',
      issueDate: '2026-06-01',
      proofAvailable: false,
    });
    const result = runEligibilityRules(claim, mockPolicy({ proofRequired: true }));
    expect(result.preliminaryResult).toBe('MISSING_INFO');
    const rule6 = result.ruleResults.find((r) => r.ruleId === 'RULE_6');
    expect(rule6?.status).toBe('FAIL');
    expect(result.missingInformation).toContain('Proof of purchase');
  });

  // Test 15: Unconfirmed policy
  it('returns MANUAL_REVIEW for unconfirmed policy', () => {
    const claim = mockClaim();
    const result = runEligibilityRules(claim, mockPolicy({ isConfirmed: false }));
    expect(result.preliminaryResult).toBe('MANUAL_REVIEW');
    const rule2 = result.ruleResults.find((r) => r.ruleId === 'RULE_2');
    expect(rule2?.status).toBe('REVIEW');
  });

  // Test 16: Ambiguous exclusion returns manual review
  it('returns POSSIBLE_EXCLUSION for water damage issue type with water damage exclusion', () => {
    const policyWithWaterExclusion = mockPolicy({
      clauses: [
        { id: 'c1', clauseType: 'WARRANTY_DURATION', clauseText: '12 months warranty.', pageNumber: 1, confirmedByReviewer: true },
        { id: 'c2', clauseType: 'EXCLUSION', clauseText: 'Water damage and liquid damage are not covered.', pageNumber: 1, confirmedByReviewer: true },
        { id: 'c3', clauseType: 'PROOF_REQUIREMENT', clauseText: 'Receipt required.', pageNumber: 1, confirmedByReviewer: true },
      ],
    });
    const claim = mockClaim({
      purchaseDate: '2026-01-01',
      issueDate: '2026-06-01',
      issueType: 'WATER_DAMAGE',
      issueDescription: 'Device was exposed to water.',
    });
    const result = runEligibilityRules(claim, policyWithWaterExclusion);
    expect(result.preliminaryResult).toBe('POSSIBLE_EXCLUSION');
  });

  // Test 17: Evidence contains source page
  it('includes evidence page numbers when clauses have page numbers', () => {
    const claim = mockClaim({
      purchaseDate: '2026-01-01',
      issueDate: '2026-06-01',
      proofAvailable: true,
    });
    const result = runEligibilityRules(claim, mockPolicy());
    const rule4 = result.ruleResults.find((r) => r.ruleId === 'RULE_4');
    expect(rule4?.evidencePageNumber).toBeDefined();
  });

  // Rule engine does not approve when proof is not available even if period is valid
  it('does not return MEETS_BASIC_CHECKS when proof required and unavailable', () => {
    const claim = mockClaim({
      purchaseDate: '2026-01-01',
      issueDate: '2026-06-01',
      proofAvailable: false,
    });
    const result = runEligibilityRules(claim, mockPolicy({ proofRequired: true }));
    expect(result.preliminaryResult).not.toBe('MEETS_BASIC_CHECKS');
  });
});
