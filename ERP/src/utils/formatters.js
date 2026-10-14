/**
 * Utility functions for formatting data like currency, numbers, etc.
 */
import { format } from 'date-fns';

/**
 * Formats a number to currency.
 * @param {number} value - The number to format
 * @param {string} currency - Currency code (e.g., 'INR', 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'INR') => {
  if (value === null || value === undefined || isNaN(value)) {
    value = 0;
  }
  let code = currency;
  if (!code || code === 'null' || code === 'undefined') {
    code = 'INR';
  }
  code = code.trim().toUpperCase();
  let locale = 'en-IN';
  if (code === 'USD') locale = 'en-US';
  else if (code === 'GBP') locale = 'en-GB';
  else if (code === 'EUR') locale = 'en-IE';
  else if (code === 'INR') locale = 'en-IN';
  else if (code === 'CAD') locale = 'en-CA';
  else if (code === 'AUD') locale = 'en-AU';
  else if (code === 'JPY') locale = 'ja-JP';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (err) {
    return `${code} ${Number(value).toFixed(2)}`;
  }
};

/**
 * Formats a plain number as an Indian-locale amount string (no currency symbol).
 * Canonical replacement for the inline `fmt` pattern repeated across 35+ files:
 *   const fmt = (n) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
 * @param {number|null|undefined} value
 * @param {number} [minDecimals=2]
 * @param {number} [maxDecimals=2]
 * @returns {string}
 */
export const formatAmount = (value, minDecimals = 2, maxDecimals = 2) => {
  const n = value ?? 0;
  if (n === null || n === undefined || isNaN(Number(n))) return '-';
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
};

/**
 * Formats a date string using date-fns.
 * @param {string|Date} date - The date to format
 * @param {string} formatStr - Format string (default: 'dd MMM yyyy')
 * @returns {string} Formatted date string or '-' if invalid
 */
export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  if (!date) return '-';
  try {
    return format(new Date(date), formatStr);
  } catch (err) {
    return String(date);
  }
};

/**
 * Formats a date with time.
 * @param {string|Date} date
 * @param {string} formatStr - default 'dd MMM yyyy, hh:mm a'
 * @returns {string}
 */
export const formatDateTime = (date, formatStr = 'dd MMM yyyy, hh:mm a') => {
  if (!date) return '-';
  try {
    return format(new Date(date), formatStr);
  } catch (err) {
    return String(date);
  }
};

/**
 * Formats a date in long human-readable form.
 * @param {string|Date} date
 * @returns {string} e.g. "Monday, 13 October 2026"
 */
export const formatLongDate = (date) => {
  if (!date) return '';
  try {
    return format(new Date(date), 'EEEE, d MMMM yyyy');
  } catch (err) {
    return String(date);
  }
};
