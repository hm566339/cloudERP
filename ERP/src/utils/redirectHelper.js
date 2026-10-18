/**
 * Validates whether a destination path is a safe relative internal route.
 * Prevents open-redirect vulnerabilities (e.g. //evil.com, https://attacker.com, /\\evil.com, javascript:...).
 * @param {string|null|undefined} path 
 * @returns {boolean}
 */
export function isSafeRedirectPath(path) {
  if (!path || typeof path !== 'string') return false;
  // Must start with a single leading slash
  if (!path.startsWith('/')) return false;
  // Must not start with protocol-relative slash '//' or Windows path separator '/\\'
  if (path.startsWith('//') || path.startsWith('/\\') || path.startsWith('/\\\\')) return false;
  // Reject URL schemes embedded e.g. /http: or /javascript:
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return false;
  // Reject redirect loops and callback destinations
  if (
    path.includes('/dashboard/dashboard') ||
    path.includes('/auth/callback') ||
    path.includes('/account/callback') ||
    path.includes('/accounts/callback') ||
    path === '/403' ||
    path.startsWith('/403') ||
    path === '/login' ||
    path === '/admin-login' ||
    path === '/modules'
  ) {
    return false;
  }
  return true;
}

/**
 * Resolves a safe redirect destination after authentication:
 * 1. Checks query parameters ('redirect', 'goto', 'returnTo')
 * 2. Checks sessionStorage ('auth_return_to')
 * 3. Checks location.state.from (from React Router ProtectedRoute)
 * 4. Falls back to defaultPath if invalid or open-redirect detected.
 */
export function resolveSafeRedirectDestination({ searchParams, sessionStorage, locationStateFrom, defaultPath = '/workspace' }) {
  const cleanCandidate = (p) => {
    if (!p || typeof p !== 'string') return null;
    const stripped = p.replace(/^(\/erp)+/i, '') || '/';
    return isSafeRedirectPath(stripped) ? stripped : null;
  };

  // 1. Query parameters
  if (searchParams) {
    const query = typeof searchParams.get === 'function'
      ? (searchParams.get('redirect') || searchParams.get('goto') || searchParams.get('returnTo'))
      : null;
    const cleaned = cleanCandidate(query);
    if (cleaned) {
      return cleaned;
    }
  }

  // 2. SessionStorage
  if (sessionStorage && typeof sessionStorage.getItem === 'function') {
    const returnTo = sessionStorage.getItem('auth_return_to');
    if (returnTo) {
      if (typeof sessionStorage.removeItem === 'function') {
        sessionStorage.removeItem('auth_return_to');
      }
      const cleaned = cleanCandidate(returnTo);
      if (cleaned) {
        return cleaned;
      }
    }
  }

  // 3. React Router location.state.from
  if (locationStateFrom) {
    let fullPath = '';
    if (typeof locationStateFrom === 'string') {
      fullPath = locationStateFrom;
    } else if (locationStateFrom.pathname) {
      fullPath = locationStateFrom.pathname + (locationStateFrom.search || '') + (locationStateFrom.hash || '');
    }
    const cleaned = cleanCandidate(fullPath);
    if (cleaned) {
      return cleaned;
    }
  }

  return cleanCandidate(defaultPath) || '/workspace';
}
