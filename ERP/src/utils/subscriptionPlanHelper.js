/**
 * @fileoverview Helper utilities for Subscription Plan rules, limits, validation,
 * and presentation in the ERP/SSO frontend.
 */

/**
 * Formats a limit value into a human-readable display string.
 * NULL or undefined in the backend contract represents "Unlimited".
 *
 * @param {number|null|undefined} limit - Numeric limit or null/undefined
 * @param {string} unit - Optional unit label (e.g. 'companies', 'users/company')
 * @returns {string} Formatted string, e.g. "Unlimited" or "4 companies"
 */
export function formatPlanLimit(limit, unit = '') {
  if (limit === null || limit === undefined || limit === '') {
    return 'Unlimited';
  }
  const num = Number(limit);
  if (isNaN(num)) {
    return 'Unlimited';
  }
  return unit ? `${num} ${unit}` : `${num}`;
}

/**
 * Normalizes a plan code to uppercase alphanumeric with underscores.
 *
 * @param {string} rawCode - User entered plan code
 * @returns {string} Normalized code (e.g. "30_DAY_FREE_TRIAL")
 */
export function normalizePlanCode(rawCode) {
  if (!rawCode) return '';
  return rawCode
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

/**
 * Validates plan form input values before submission.
 * Frontend validation provides immediate UX feedback while backend remains authoritative.
 *
 * @param {Object} formData
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validatePlanFormData(formData) {
  const errors = {};

  // 1. Plan Name
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Plan name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Plan name must be at least 2 characters';
  }

  // 2. Plan Code
  if (!formData.code || !formData.code.trim()) {
    errors.code = 'Plan code is required';
  } else if (!/^[A-Z0-9_]+$/.test(formData.code.trim().toUpperCase())) {
    errors.code = 'Plan code must contain only uppercase letters, numbers, and underscores';
  }

  // 3. Duration Days
  const duration = Number(formData.durationDays);
  if (formData.durationDays === undefined || formData.durationDays === null || formData.durationDays === '') {
    errors.durationDays = 'Duration in days is required';
  } else if (isNaN(duration) || !Number.isInteger(duration) || duration <= 0) {
    errors.durationDays = 'Duration must be a positive whole number of days';
  }

  // 4. Maximum Companies (when not unlimited)
  if (!formData.isUnlimitedCompanies) {
    const maxComp = Number(formData.maxCompanies);
    if (formData.maxCompanies === undefined || formData.maxCompanies === null || formData.maxCompanies === '') {
      errors.maxCompanies = 'Maximum companies is required when not unlimited';
    } else if (isNaN(maxComp) || !Number.isInteger(maxComp) || maxComp <= 0) {
      errors.maxCompanies = 'Maximum companies must be a positive whole number';
    }
  }

  // 5. Maximum Users Per Company (when not unlimited)
  if (!formData.isUnlimitedUsers) {
    const maxUsers = Number(formData.maxUsersPerCompany);
    if (formData.maxUsersPerCompany === undefined || formData.maxUsersPerCompany === null || formData.maxUsersPerCompany === '') {
      errors.maxUsersPerCompany = 'Maximum users per company is required when not unlimited';
    } else if (isNaN(maxUsers) || !Number.isInteger(maxUsers) || maxUsers <= 0) {
      errors.maxUsersPerCompany = 'Maximum users per company must be a positive whole number';
    }
  }

  // 6. Modules check
  if (!Array.isArray(formData.moduleIds) || formData.moduleIds.length === 0) {
    errors.moduleIds = 'At least one module must be included in the plan';
  }

  // 7. Price
  if (formData.price !== undefined && formData.price !== null && formData.price !== '') {
    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = 'Price must be zero or a positive number';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Prepares the payload for API submission according to the backend DTO contract.
 * Preserves NULL for unlimited limits and trims string inputs.
 *
 * @param {Object} formData
 * @param {Object} existingPlan - Original plan object (to prevent accidental field deletion on edit)
 * @returns {Object} Clean DTO payload
 */
export function preparePlanPayload(formData, existingPlan = null) {
  const maxCompanies = formData.isUnlimitedCompanies
    ? null
    : parseInt(formData.maxCompanies, 10);

  const maxUsersPerCompany = formData.isUnlimitedUsers
    ? null
    : parseInt(formData.maxUsersPerCompany, 10);

  const payload = {
    code: normalizePlanCode(formData.code),
    name: formData.name.trim(),
    description: formData.description ? formData.description.trim() : '',
    durationDays: parseInt(formData.durationDays, 10) || 30,
    price: formData.price !== undefined && formData.price !== null ? parseFloat(formData.price) || 0 : 0,
    currency: formData.currency ? formData.currency.trim().toUpperCase() : 'INR',
    active: formData.active !== false,
    isTrial: Boolean(formData.isTrial),
    maxCompanies,
    maxUsersPerCompany,
    maxUsers: maxUsersPerCompany,
    moduleIds: Array.isArray(formData.moduleIds) ? formData.moduleIds : [],
  };

  // If editing an existing plan, preserve backend fields not exposed on the form
  if (existingPlan) {
    if (existingPlan.razorpayPlanId !== undefined) {
      payload.razorpayPlanId = existingPlan.razorpayPlanId;
    }
    if (existingPlan.planVersion !== undefined) {
      payload.planVersion = existingPlan.planVersion;
    }
  }

  return payload;
}
