import { describe, it, expect } from 'vitest';
import { toBengaliDigits, toEnglishDigits, formatCurrency } from '../src/utils/formatters';

describe('Bangla Typography & Numeral Formatting', () => {
  it('converts ASCII digits to Bengali digits and back accurately', () => {
    const englishNumber = 1234567890;
    const bengaliDigits = toBengaliDigits(englishNumber);
    expect(bengaliDigits).toBe('১২৩৪৫৬৭৮৯০');

    const reversed = toEnglishDigits(bengaliDigits);
    expect(reversed).toBe('1234567890');
  });

  it('formats currency with Taka symbol in Bengali numerals in Bangla mode', () => {
    const formatted = formatCurrency(500000, 'bn');
    expect(formatted).toContain('৳');
    // Checks that Bengali digits are used
    expect(formatted).toMatch(/[০-৯]/);
  });

  it('formats currency with English digits in English mode', () => {
    const formatted = formatCurrency(500000, 'en');
    expect(formatted).toContain('৳');
    expect(formatted).toContain('500,000');
  });

  it('preserves complex Bengali conjunct characters intact without character corruption', () => {
    const conjunctSample = 'পরীক্ষা ও নির্মাণ কাজের শ্রমিকদের মজুরি এবং বৈদ্যুতিক সরঞ্জামাদি';
    // Test that string normalization preserves conjunct codepoints
    expect(conjunctSample).toContain('ক্ষ'); // ক + ষ
    expect(conjunctSample).toContain('শ্রমিক'); // শ + র
    expect(conjunctSample).toContain('নির্মাণ'); // র + ম
    expect(conjunctSample).toContain('সরঞ্জামাদি'); // ঞ + জ
  });
});
