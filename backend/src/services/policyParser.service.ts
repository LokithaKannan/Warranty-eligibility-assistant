import { ClauseType, EvidenceItem } from '../types';
import { PageText } from './pdf.service';

export interface DetectedClause {
  clauseType: ClauseType;
  clauseText: string;
  pageNumber?: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedValue?: string;
}

export interface ParsedPolicyInfo {
  detectedDurationMonths?: number;
  detectedProofRequired?: boolean;
  detectedClauses: DetectedClause[];
  exclusionKeywords: string[];
  rawSuggestions: Record<string, string>;
}

// -------------------------------------------------------------------
// Duration patterns
// -------------------------------------------------------------------
const DURATION_PATTERNS: Array<{ regex: RegExp; months: number; label: string }> = [
  { regex: /\b(\d+)\s*-?\s*year\s*(limited\s*)?warranty\b/i, months: 0, label: 'year' },
  { regex: /\bwarranty\s+period\s+of\s+(\d+)\s*month/i, months: 0, label: 'months explicit' },
  { regex: /\b(\d+)\s*month\s*(limited\s*)?warranty\b/i, months: 0, label: 'months' },
  { regex: /\blimited\s+warranty[^.]*?(\d+)\s*month/i, months: 0, label: 'limited months' },
  { regex: /\blimited\s+warranty[^.]*?(\d+)\s*year/i, months: 0, label: 'limited years' },
  { regex: /\bwarrants?\s+[^.]*?(\d+)\s*month/i, months: 0, label: 'warrants months' },
  { regex: /\bwarrants?\s+[^.]*?(\d+)\s*year/i, months: 0, label: 'warrants years' },
  { regex: /\bone\s*[\-–]?\s*year\s*(limited\s*)?warranty\b/i, months: 12, label: 'one year' },
  { regex: /\btwo\s*[\-–]?\s*year\s*(limited\s*)?warranty\b/i, months: 24, label: 'two year' },
  { regex: /\bthree\s*[\-–]?\s*year\s*(limited\s*)?warranty\b/i, months: 36, label: 'three year' },
];

// -------------------------------------------------------------------
// Exclusion keywords
// -------------------------------------------------------------------
const EXCLUSION_KEYWORDS = [
  'physical damage',
  'water damage',
  'liquid damage',
  'unauthorized repair',
  'unauthorized modification',
  'misuse',
  'abuse',
  'negligence',
  'accident',
  'normal wear and tear',
  'cosmetic damage',
  'theft',
  'lost',
  'fire damage',
  'flood damage',
  'improper installation',
  'third party',
  'modification',
  'overheating',
  'power surge',
];

// -------------------------------------------------------------------
// Proof of purchase keywords
// -------------------------------------------------------------------
const PROOF_REQUIRED_PATTERNS = [
  /proof\s+of\s+purchase/i,
  /original\s+receipt/i,
  /purchase\s+receipt/i,
  /sales\s+invoice/i,
  /original\s+bill/i,
  /dated\s+receipt/i,
  /retain\s+(your\s+)?receipt/i,
];

const PROOF_NOT_REQUIRED_PATTERNS = [
  /no\s+proof\s+of\s+purchase\s+required/i,
  /without\s+proof\s+of\s+purchase/i,
];

// -------------------------------------------------------------------
// Claim procedure keywords
// -------------------------------------------------------------------
const CLAIM_PROCEDURE_PATTERNS = [
  /contact\s+(our\s+)?support/i,
  /submit\s+a\s+claim/i,
  /authorized\s+service\s+(cent(re|er)|provider)/i,
  /visit\s+(our\s+)?website/i,
  /call\s+(our\s+)?customer\s+service/i,
  /return\s+(the\s+)?(product|device|item)/i,
  /warranty\s+claim/i,
  /service\s+request/i,
];

// -------------------------------------------------------------------
// Main parser
// -------------------------------------------------------------------
export function parsePolicyText(pages: PageText[]): ParsedPolicyInfo {
  const detectedClauses: DetectedClause[] = [];
  const exclusionKeywords: string[] = [];
  let detectedDurationMonths: number | undefined;
  let detectedProofRequired: boolean | undefined;

  for (const page of pages) {
    const text = page.text;
    const pageNum = page.pageNumber;

    // --- Duration detection ---
    for (const pattern of DURATION_PATTERNS) {
      const match = text.match(pattern.regex);
      if (match) {
        let months = pattern.months;
        if (months === 0 && match[1]) {
          const num = parseInt(match[1], 10);
          if (pattern.label.includes('year')) {
            months = num * 12;
          } else {
            months = num;
          }
        }
        if (months > 0 && months <= 600) {
          detectedDurationMonths = months;
          // Extract surrounding sentence as clause text
          const sentence = extractSentenceContaining(text, match[0]);
          detectedClauses.push({
            clauseType: 'WARRANTY_DURATION',
            clauseText: sentence,
            pageNumber: pageNum,
            confidence: 'HIGH',
            suggestedValue: `${months} months`,
          });
          break;
        }
      }
    }

    // --- Exclusion detection ---
    for (const kw of EXCLUSION_KEYWORDS) {
      if (text.toLowerCase().includes(kw.toLowerCase())) {
        if (!exclusionKeywords.includes(kw)) {
          exclusionKeywords.push(kw);
          const sentence = extractSentenceContaining(text, kw);
          detectedClauses.push({
            clauseType: 'EXCLUSION',
            clauseText: sentence,
            pageNumber: pageNum,
            confidence: 'MEDIUM',
            suggestedValue: kw,
          });
        }
      }
    }

    // --- Proof of purchase detection ---
    if (detectedProofRequired === undefined) {
      for (const pattern of PROOF_NOT_REQUIRED_PATTERNS) {
        if (pattern.test(text)) {
          detectedProofRequired = false;
          const sentence = extractSentenceContaining(text, text.match(pattern)?.[0] ?? '');
          detectedClauses.push({
            clauseType: 'PROOF_REQUIREMENT',
            clauseText: sentence,
            pageNumber: pageNum,
            confidence: 'HIGH',
            suggestedValue: 'Not required',
          });
        }
      }
      for (const pattern of PROOF_REQUIRED_PATTERNS) {
        if (pattern.test(text)) {
          detectedProofRequired = true;
          const sentence = extractSentenceContaining(text, text.match(pattern)?.[0] ?? '');
          detectedClauses.push({
            clauseType: 'PROOF_REQUIREMENT',
            clauseText: sentence,
            pageNumber: pageNum,
            confidence: 'HIGH',
            suggestedValue: 'Required',
          });
          break;
        }
      }
    }

    // --- Claim procedure detection ---
    for (const pattern of CLAIM_PROCEDURE_PATTERNS) {
      if (pattern.test(text)) {
        const sentence = extractSentenceContaining(text, text.match(pattern)?.[0] ?? '');
        const alreadyAdded = detectedClauses.some(
          (c) => c.clauseType === 'CLAIM_PROCEDURE' && c.clauseText === sentence
        );
        if (!alreadyAdded) {
          detectedClauses.push({
            clauseType: 'CLAIM_PROCEDURE',
            clauseText: sentence,
            pageNumber: pageNum,
            confidence: 'MEDIUM',
          });
        }
        break;
      }
    }
  }

  const rawSuggestions: Record<string, string> = {};
  if (detectedDurationMonths) rawSuggestions['durationMonths'] = String(detectedDurationMonths);
  if (detectedProofRequired !== undefined)
    rawSuggestions['proofRequired'] = String(detectedProofRequired);

  return {
    detectedDurationMonths,
    detectedProofRequired,
    detectedClauses,
    exclusionKeywords,
    rawSuggestions,
  };
}

/**
 * Extract the sentence (or up to 300 chars) containing the matched text.
 */
function extractSentenceContaining(text: string, match: string): string {
  if (!match) return text.slice(0, 300);

  const idx = text.toLowerCase().indexOf(match.toLowerCase());
  if (idx === -1) return text.slice(0, 300);

  // Find sentence boundaries
  const start = Math.max(0, text.lastIndexOf('.', idx) + 1);
  const end = text.indexOf('.', idx + match.length);
  const sentence =
    end === -1 ? text.slice(start) : text.slice(start, end + 1);

  return sentence.trim().slice(0, 500);
}

/**
 * Check if issue type/description matches any exclusion keyword in the policy.
 */
export function checkExclusions(
  issueType: string,
  issueDescription: string,
  exclusionClauses: Array<{ clauseText: string; clauseType: string; id: string; pageNumber?: number | null; confirmedByReviewer: boolean }>
): { matched: boolean; matchedClauses: typeof exclusionClauses; reason: string } {
  const issueText = `${issueType} ${issueDescription}`.toLowerCase().replace(/_/g, ' ');

  const matchedClauses: typeof exclusionClauses = [];
  const reasons: string[] = [];

  // Map issue types to common exclusion keywords
  const issueTypeExclusionMap: Record<string, string[]> = {
    PHYSICAL_DAMAGE: ['physical damage', 'cosmetic damage', 'accident'],
    WATER_DAMAGE: ['water damage', 'liquid damage'],
    BATTERY_FAILURE: ['normal wear and tear'],
    CHARGING_PROBLEM: ['misuse', 'improper installation'],
    OTHER: [],
    BATTERY_FAILURE_WEAR: ['normal wear and tear'],
  };

  for (const clause of exclusionClauses) {
    if (clause.clauseType !== 'EXCLUSION') continue;
    const clauseTextLower = clause.clauseText.toLowerCase();

    // Check direct keyword match
    for (const kw of EXCLUSION_KEYWORDS) {
      if (
        clauseTextLower.includes(kw.toLowerCase()) &&
        issueText.includes(kw.toLowerCase())
      ) {
        if (!matchedClauses.find((c) => c.id === clause.id)) {
          matchedClauses.push(clause);
          reasons.push(kw);
        }
      }
    }

    // Check by issue type mapping
    const mappedKeywords = issueTypeExclusionMap[issueType] ?? [];
    for (const kw of mappedKeywords) {
      if (clauseTextLower.includes(kw.toLowerCase())) {
        if (!matchedClauses.find((c) => c.id === clause.id)) {
          matchedClauses.push(clause);
          reasons.push(`issue type "${issueType}" may match exclusion: "${kw}"`);
        }
      }
    }
  }

  return {
    matched: matchedClauses.length > 0,
    matchedClauses,
    reason: reasons.join('; '),
  };
}
