/**
 * Pure validation and payload builders for Organization Trial Signup
 */

export function validateOrganizationSignupInput(data) {
  const errors = {};

  if (!data?.fullName || !data.fullName.trim()) {
    errors.fullName = 'Full Name is required';
  } else if (data.fullName.trim().length > 255) {
    errors.fullName = 'Full Name must not exceed 255 characters';
  }

  if (!data?.email || !data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address';
  } else if (data.email.trim().length > 255) {
    errors.email = 'Email must not exceed 255 characters';
  }

  if (!data?.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (data.password.length > 100) {
    errors.password = 'Password must not exceed 100 characters';
  }

  if (data?.confirmPassword !== undefined && data.confirmPassword !== data.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!data?.organizationName || !data.organizationName.trim()) {
    errors.organizationName = 'Organization / Business name is required';
  } else if (data.organizationName.trim().length > 255) {
    errors.organizationName = 'Organization name must not exceed 255 characters';
  }

  if (!data?.companyName || !data.companyName.trim()) {
    errors.companyName = 'Company name is required';
  } else if (data.companyName.trim().length > 255) {
    errors.companyName = 'Company name must not exceed 255 characters';
  }

  if (!data?.companyCode || !data.companyCode.trim()) {
    errors.companyCode = 'Company code is required';
  } else if (!/^[A-Za-z0-9_-]+$/.test(data.companyCode.trim())) {
    errors.companyCode = 'Company code must contain only letters, numbers, hyphens or underscores';
  } else if (data.companyCode.trim().length > 100) {
    errors.companyCode = 'Company code must not exceed 100 characters';
  }

  if (!data?.baseCurrency || !data.baseCurrency.trim()) {
    errors.baseCurrency = 'Base currency is required';
  } else if (data.baseCurrency.trim().length > 3) {
    errors.baseCurrency = 'Base currency must not exceed 3 characters';
  }

  if (data?.phone && !/^[0-9]{10,15}$/.test(data.phone.trim())) {
    errors.phone = 'Phone number must contain 10 to 15 digits';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildOrganizationSignupPayload(formData) {
  return {
    fullName: formData.fullName.trim(),
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    organizationName: formData.organizationName.trim(),
    company: {
      companyName: formData.companyName.trim(),
      companyCode: formData.companyCode.trim().toUpperCase(),
      baseCurrency: (formData.baseCurrency || 'INR').trim().toUpperCase(),
      ...(formData.legalName ? { legalName: formData.legalName.trim() } : {}),
      ...(formData.gstin ? { gstin: formData.gstin.trim().toUpperCase() } : {}),
      ...(formData.pan ? { pan: formData.pan.trim().toUpperCase() } : {}),
      ...(formData.phone ? { phone: formData.phone.trim() } : {}),
      ...(formData.city ? { city: formData.city.trim() } : {}),
      ...(formData.state ? { state: formData.state.trim() } : {}),
      ...(formData.country ? { country: formData.country.trim() } : {}),
      active: true,
    },
  };
}

export function generateSuggestedCompanyCode(companyName) {
  if (!companyName || typeof companyName !== 'string') return '';
  return companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

export function parseOrganizationSignupResponse(response) {
  const data = response?.data || response;
  return {
    organization: {
      id: data?.organization?.id || null,
      name: data?.organization?.name || '',
      code: data?.organization?.code || '',
    },
    company: {
      id: data?.company?.id || null,
      name: data?.company?.name || '',
      code: data?.company?.code || '',
    },
    subscription: {
      status: data?.subscription?.status || 'TRIALING',
      accessMode: data?.subscription?.accessMode || 'FULL_ACCESS',
      trialEndsAt: data?.subscription?.trialEndsAt || null,
    },
    login: {
      url: data?.login?.url || null,
    },
  };
}

export function evaluateRootIndexDestination({ authenticated, user, cookieToken, urlToken, getPostLoginRedirectPathFn } = {}) {
  if (urlToken) {
    return `/accounts/dashboard?token=${encodeURIComponent(urlToken)}`;
  }
  if ((authenticated && user) || (cookieToken && user)) {
    if (getPostLoginRedirectPathFn) {
      return getPostLoginRedirectPathFn({ user });
    }
    const role = user.role;
    const companyId = user.companyCode || user.companyId;
    if (role === 'super_admin') return '/super-admin/dashboard';
    if (role === 'company_admin') return companyId ? `/company/${companyId}` : '/company-select';
    if (companyId) return '/accounts/dashboard';
    return '/company-select';
  }
  return '/';
}

