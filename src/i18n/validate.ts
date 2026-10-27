import { en } from './en';
import { sw } from './sw';

export interface ValidationResult {
  valid: boolean;
  violations: { key: string; lang: string; wordCount: number; text: string }[];
}

export function validateStringWordBudgets(): ValidationResult {
  const violations: { key: string; lang: string; wordCount: number; text: string }[] = [];

  const countWords = (str: string): number => {
    return str.trim().split(/\s+/).filter(Boolean).length;
  };

  // Keys with explicitly allowed exact fixed copy (exempt from 6-word limit)
  const exemptKeys = new Set(['donor_header_rule', 'tier3_body', 'intro_card1_body', 'intro_card3_body', 'empty_requests_sub']);

  // Check English strings
  (Object.keys(en) as (keyof typeof en)[]).forEach(key => {
    const text = en[key];
    const words = countWords(text);
    if (!exemptKeys.has(key) && words > 6) {
      violations.push({ key, lang: 'en', wordCount: words, text });
    }
  });

  // Check Swahili strings
  (Object.keys(sw) as (keyof typeof sw)[]).forEach(key => {
    const text = sw[key];
    const words = countWords(text);
    if (!exemptKeys.has(key) && words > 6) {
      violations.push({ key, lang: 'sw', wordCount: words, text });
    }
  });

  return {
    valid: violations.length === 0,
    violations
  };
}

// Self-executing validation check at runtime
const result = validateStringWordBudgets();
if (!result.valid) {
  console.warn('Word budget validation warning: strings exceeding 6 words found:', result.violations);
}
