/**
 * Helper utilities for Organization-Specific Login
 */

/**
 * Builds login payload conforming strictly to backend LoginRequest contract
 */
export function buildLoginPayload({ username, password, organizationCode, companyCode, host, companyId, moduleCode }) {
  const trimmedUser = (username || '').trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedUser);

  const payload = {
    username: trimmedUser,
    password: password || '',
  };

  if (organizationCode) {
    payload.organizationCode = organizationCode.trim().toLowerCase();
    if (isEmail) {
      payload.email = trimmedUser.toLowerCase();
    }
  } else if (companyCode) {
    payload.companyCode = companyCode.trim();
  }

  if (companyId) {
    payload.companyId = companyId;
  }

  if (host) {
    payload.host = host.trim();
  }

  if (moduleCode) {
    payload.moduleCode = moduleCode.trim();
  }

  return payload;
}

/**
 * Parses and validates OrganizationLookupResponse
 */
export function parseOrganizationLookupResponse(response) {
  const data = response?.data || response;
  if (!data || !data.code) {
    return {
      isValid: false,
      organization: null,
    };
  }

  return {
    isValid: true,
    organization: {
      name: data.name || data.code,
      code: data.code,
      loginUrl: data.loginUrl || null,
    },
  };
}

/**
 * Evaluates the next routing step from LoginResponse
 */
export function evaluateLoginResult(loginResponse) {
  const data = loginResponse?.data || loginResponse;

  if (data?.requiresCompanySelection) {
    return {
      type: 'COMPANY_SELECTION',
      path: '/company-select',
      companies: data.companies || [],
      organization: data.organization || null,
    };
  }

  if (data?.redirectUrl) {
    let target = data.redirectUrl;
    try {
      const url = new URL(data.redirectUrl.startsWith('http') ? data.redirectUrl : `http://${data.redirectUrl}`);
      target = url.pathname + url.search + url.hash;
    } catch {
      const match = data.redirectUrl.match(/\/auth\/callback.*$/);
      if (match) target = match[0];
    }
    target = target.replace(/^(\/erp)+/i, '') || '/';
    if (target.startsWith('/api/')) {
      const codeParam = target.includes('?') ? target.substring(target.indexOf('?')) : '';
      target = `/auth/callback${codeParam}`;
    }
    return {
      type: 'REDIRECT_CALLBACK',
      path: target,
      rawUrl: data.redirectUrl,
    };
  }

  if (data?.accessToken || data?.access_token) {
    return {
      type: 'DIRECT_AUTHENTICATION',
      token: data?.accessToken || data?.access_token,
      refreshToken: data?.refreshToken || data?.refresh_token,
      user: data?.user || null,
    };
  }

  return {
    type: 'UNKNOWN',
    path: '/',
  };
}

/**
 * Sanitizes and maps login errors to safe user-facing messages
 */
export function sanitizeLoginError(err) {
  if (!err) return 'Something went wrong. Please try again.';

  const status = err.status || err.statusCode || err.response?.status;
  const message = (err.data?.message || err.response?.data?.message || err.message || '').toLowerCase();

  // Mask internal server stack traces
  if (message.includes('exception') || message.includes('stacktrace') || message.includes('nullpointer') || message.includes('sql')) {
    return 'Something went wrong. Please try again.';
  }

  if (status === 401 || message.includes('invalid credentials') || message.includes('bad credentials')) {
    return 'Invalid email or password.';
  }

  if (status === 403 || message.includes('membership') || message.includes('revoked') || message.includes('portal access')) {
    return "You don't have access to this organization.";
  }

  if (status === 404 || message.includes('not found')) {
    return 'Organization not found.';
  }

  if (message.includes('blocked')) {
    return 'Organization access is blocked. Please contact support.';
  }

  return 'Something went wrong. Please try again.';
}
