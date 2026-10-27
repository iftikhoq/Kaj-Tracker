const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  return input.toString().replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

export function toEnglishDigits(input: string): string {
  if (!input) return '';
  return input.replace(/[০-৯]/g, (char) => {
    return BENGALI_DIGITS.indexOf(char).toString();
  });
}

/**
 * Format a number as currency.
 * In Bangla mode: ৳ ১২,৫০,০০০
 * In English mode: ৳ 1,250,000
 */
export function formatCurrency(amount: number | undefined | null, lang: 'bn' | 'en' = 'bn'): string {
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  // Format with commas using Indian/South Asian grouping if possible
  const formatted = new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);

  return `৳ ${formatted}`;
}

/**
 * Format a regular number with digits according to active language
 */
export function formatNumber(value: number | undefined | null, lang: 'bn' | 'en' = 'bn'): string {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format an ISO date or timestamp into a readable localized format
 */
export function formatDate(dateString: string | undefined | null, lang: 'bn' | 'en' = 'bn'): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string | undefined | null, lang: 'bn' | 'en' = 'bn'): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}
