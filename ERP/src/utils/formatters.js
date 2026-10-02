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
 * Formats a date string.
 * @param {string|Date} date - The date to format
 * @param {string} formatStr - Format string (default: 'dd MMM yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  if (!date) return '-';
  try {
    return format(new Date(date), formatStr);
  } catch (err) {
    return String(date);
  }
};
