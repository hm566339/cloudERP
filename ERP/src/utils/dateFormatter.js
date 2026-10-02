/**
 * Centralized date formatting utility for the ERP.
 * Ensures consistent date presentation across the application.
 */

/**
 * Formats a date string or Date object into a localized standard date string (e.g. DD/MM/YYYY).
 * @param {string | Date} dateInput - The date to format.
 * @param {string} [fallback='N/A'] - Fallback text if date is invalid.
 * @returns {string} The formatted date.
 */
export function formatDate(dateInput, fallback = 'N/A') {
  if (!dateInput) return fallback;
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return fallback;
  }
}

/**
 * Formats a date into a long string with weekday.
 * @param {string | Date} dateInput - The date to format.
 * @returns {string} The formatted date.
 */
export function formatLongDate(dateInput) {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    return '';
  }
}

export const formatDateTime = formatDate;
