/**
 * AR Invoice RBAC configuration — mirrors src/config/rbacConfig.js + src/utils/rbac.js
 * This is an inline copy because proxy.js runs in a serverless Node context and
 * cannot import from src/. Keep in sync when rbacConfig.js changes.
 *
 * Permissions required per action:
 *   submit  → UPDATE
 *   approve → APPROVE
 *   reject  → APPROVE
 *   post    → APPROVE  (frontend further restricts to SUPER_ADMIN / FINANCE_MANAGER)
 *   reverse → APPROVE  (frontend further restricts to SUPER_ADMIN / FINANCE_MANAGER)
 *   cancel  → DELETE
 */
const AR_INVOICE_ACTION_PERMISSIONS = {
  submit:  'UPDATE',
  approve: 'APPROVE',
  reject:  'APPROVE',
  post:    'APPROVE',
  reverse: 'APPROVE',
  cancel:  'DELETE',
};

const PROXY_ROLE_PERMISSIONS = {
  super_admin:     { permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'], modules: ['ALL_MODULES'] },
  system_admin:    { permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'], modules: ['ALL_MODULES'] },
  finance_manager: { permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'], modules: ['SALES_INVOICES'] },
  accountant:      { permissions: ['READ', 'CREATE', 'UPDATE'],                      modules: ['SALES_INVOICES'] },
  ar_executive:    { permissions: ['READ', 'CREATE', 'UPDATE'],                      modules: ['SALES_INVOICES'] },
  cfo:             { permissions: ['READ', 'APPROVE'],                               modules: ['ALL_MODULES'] },
  auditor:         { permissions: ['READ'],                                           modules: ['ALL_MODULES'] },
  gl_accountant:   { permissions: ['READ', 'CREATE', 'UPDATE'],                      modules: ['GL_JOURNALS'] },
  ap_executive:    { permissions: ['READ', 'CREATE', 'UPDATE'],                      modules: ['PURCHASE_INVOICES'] },
  cashier:         { permissions: ['READ', 'CREATE', 'UPDATE'],                      modules: ['RECEIPTS'] },
  tax_manager:     { permissions: ['READ', 'CREATE', 'UPDATE'],                      modules: ['GST_SLABS'] },
  budget_manager:  { permissions: ['READ', 'CREATE', 'UPDATE'],                      modules: ['BUDGET_HEADERS'] },
  bank_manager:    { permissions: ['READ', 'CREATE', 'UPDATE'],                      modules: ['BANK_ACCOUNTS'] },
  viewer:          { permissions: ['READ'],                                           modules: ['DASHBOARD'] },
};

/**
 * Safely decode a JWT payload without external libraries.
 * Returns null if the token is invalid or missing.
 */
function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    // Node.js Buffer is available in Vercel serverless
    const json = Buffer.from(base64Url, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Normalize any role string from the JWT to a lowercase key matching PROXY_ROLE_PERMISSIONS.
 */
function normalizeRole(raw) {
  if (!raw) return 'viewer';
  const lower = String(raw).toLowerCase();
  const stripped = lower.replace(/[\s_]/g, '');

  if (stripped.includes('superadmin') || stripped === 'systemadmin') return 'super_admin';
  if (lower.includes('system_admin')) return 'system_admin';
  if (lower.includes('finance_manager')) return 'finance_manager';
  if (lower.includes('gl_accountant')) return 'gl_accountant';
  if (lower.includes('accountant')) return 'accountant';
  if (lower.includes('ap_executive')) return 'ap_executive';
  if (lower.includes('ar_executive')) return 'ar_executive';
  if (lower.includes('cashier')) return 'cashier';
  if (lower.includes('tax_manager')) return 'tax_manager';
  if (lower.includes('budget_manager')) return 'budget_manager';
  if (lower.includes('bank_manager')) return 'bank_manager';
  if (lower.includes('auditor')) return 'auditor';
  if (lower.includes('cfo')) return 'cfo';
  return 'viewer';
}

/**
 * Extract the role string from a decoded JWT payload.
 * Handles: roles[0].name, roles[0] (string), role (string), role[0].name
 */
function extractRole(decoded) {
  if (!decoded) return 'viewer';
  if (Array.isArray(decoded.roles) && decoded.roles.length > 0) {
    const r = decoded.roles[0];
    return typeof r === 'string' ? r : (r?.name || 'viewer');
  }
  if (decoded.role) {
    if (typeof decoded.role === 'string') return decoded.role;
    if (Array.isArray(decoded.role)) {
      const r = decoded.role[0];
      return typeof r === 'string' ? r : (r?.name || 'viewer');
    }
  }
  return 'viewer';
}

/**
 * Check if the role has the required permission on SALES_INVOICES / AR Invoices.
 */
function hasArPermission(role, requiredPermission) {
  const config = PROXY_ROLE_PERMISSIONS[role] || PROXY_ROLE_PERMISSIONS['viewer'];
  const hasModule = config.modules.includes('ALL_MODULES') || config.modules.includes('SALES_INVOICES');
  const hasPerm   = config.permissions.includes(requiredPermission);
  return hasModule && hasPerm;
}

/**
 * Extract the ACCESS_TOKEN from a cookie header string.
 * Reusable by both the RBAC check and the Authorization header injection below.
 */
function extractToken(cookieHeader) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, ...v] = cookie.trim().split('=');
    if (key) acc[key.trim()] = v.join('=');
    return acc;
  }, {});

  let token = cookies['ACCESS_TOKEN'];

  // Fallback: If the backend appends a suffix (e.g., ACCESS_TOKEN_123)
  if (!token) {
    const dynamicKey = Object.keys(cookies).find(k => k.startsWith('ACCESS_TOKEN'));
    if (dynamicKey) token = cookies[dynamicKey];
  }

  // Secondary fallback to auth_token only if it's a real token
  if (!token && cookies['auth_token'] &&
      !cookies['auth_token'].includes('cookie session') &&
      !cookies['auth_token'].includes('cookie-session')) {
    token = cookies['auth_token'];
  }

  if (token && (token.includes('cookie session') || token.includes('cookie-session'))) {
    return null;
  }
  return token || null;
}

/**
 * Match an AR Invoice action route (POST only).
 * Pattern: /api/<anything>/ar-invoices/<id>/<action>
 * Returns the action string or null if not matched.
 *
 * @example
 *   matchArInvoiceAction('/api/account/v1/ar-invoices/123/submit', 'POST') // → 'submit'
 *   matchArInvoiceAction('/api/v1/ar-invoices/456/approve', 'POST')         // → 'approve'
 *   matchArInvoiceAction('/api/v1/ar-invoices', 'GET')                       // → null
 */
function matchArInvoiceAction(path, method) {
  if (method !== 'POST') return null;
  const match = path.match(/\/ar-invoices\/[^/]+\/(submit|approve|reject|post|reverse|cancel)/i);
  return match ? match[1].toLowerCase() : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main proxy handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const targetUrl = process.env.VITE_SSO_BASE_URL || process.env.SSO_BASE_URL || process.env.BACKEND_URL;

  if (!targetUrl) {
    res.status(500).json({ error: 'Proxy target is not configured' });
    return;
  }

  const path = req.query.path;
  const finalPath = path ? (Array.isArray(path) ? path.join('/') : path) : req.url.replace('/api/proxy', '');
  const cleanPath = finalPath.replace(/^\/+/, '');
  const apiPath = cleanPath.startsWith('api/') ? `/${cleanPath}` : `/api/${cleanPath}`;

  // ── AR Invoice RBAC check (runs before any proxying) ──────────────────────
  const arAction = matchArInvoiceAction(apiPath, req.method);
  if (arAction) {
    const requiredPermission = AR_INVOICE_ACTION_PERMISSIONS[arAction];
    const token = extractToken(req.headers.cookie);
    const decoded = parseJwt(token);
    const rawRole = extractRole(decoded);
    const role = normalizeRole(rawRole);

    if (!hasArPermission(role, requiredPermission)) {
      console.warn(
        `[RBAC] Forbidden: role="${role}" attempted AR Invoice action="${arAction}" requiring "${requiredPermission}"`
      );
      res.status(403).json({
        error: 'Forbidden',
        message: `Your role (${rawRole}) does not have permission to perform the "${arAction}" action on AR Invoices.`,
        required: requiredPermission,
        action: arAction,
      });
      return;
    }

    console.log(`[RBAC] Allowed: role="${role}" performing AR Invoice action="${arAction}" (requires ${requiredPermission})`);
  }
  // ─────────────────────────────────────────────────────────────────────────

  const urlObj = buildBackendUrl(targetUrl, apiPath, req.query);
  const backendUrl = urlObj.toString();
  console.log(`[Vercel Proxy] Proxying to: ${backendUrl}`);

  const headers = new Headers();

  for (let key in req.headers) {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'host' && lowerKey !== 'connection' && lowerKey !== 'origin' && lowerKey !== 'referer') {
      const value = req.headers[key];
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  headers.set('ngrok-skip-browser-warning', '69420');

  // Convert ACCESS_TOKEN cookie to Authorization header
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const token = extractToken(cookieHeader);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: headers,
      redirect: 'manual'
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // Vercel automatically parses the body, we need to convert it back to string
      if (typeof req.body === 'object') {
        fetchOptions.body = JSON.stringify(req.body);
      } else {
        fetchOptions.body = req.body;
      }
    }

    const response = await fetch(backendUrl, fetchOptions);

    // Forward status
    res.status(response.status);

    // Modern fetch provides getSetCookie() to avoid comma-concatenation of cookies
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];

    // Forward response headers
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        // Skip set-cookie here, we handle it natively below
        return;
      }
      // Rewrite Location header on 3xx redirects so the browser stays on the
      // Vercel frontend instead of being sent to the ngrok backend domain.
      if (key.toLowerCase() === 'location' && response.status >= 300 && response.status < 400) {
        try {
          const locUrl = new URL(value);
          const reqHost = req.headers['host'] || req.headers[':authority'];
          const scheme = req.headers['x-forwarded-proto'] || 'https';
          const frontendOrigin = `${scheme}://${reqHost}`;
          // Only rewrite if the Location points to the backend, not the frontend
          if (locUrl.origin !== frontendOrigin) {
            const rewritten = frontendOrigin + locUrl.pathname + locUrl.search + locUrl.hash;
            console.log(`[Vercel Proxy] Rewriting Location: ${value} -> ${rewritten}`);
            res.setHeader(key, rewritten);
            return;
          }
        } catch (e) {
          // If URL parsing fails, forward as-is
          console.warn('[Vercel Proxy] Failed to parse Location header:', value, e.message);
        }
      }
      res.setHeader(key, value);
    });

    // Set all cookies natively without corruption, stripping incompatible attributes
    if (setCookies && setCookies.length > 0) {
      const existing = res.getHeader('set-cookie') || [];
      const existingArray = Array.isArray(existing) ? existing : [existing];

      const rewrittenCookies = setCookies.map(cookie => {
        return cookie
          .replace(/;\s*Domain=[^;]+/gi, '') // Strip Domain so it defaults to Vercel host
          .replace(/;\s*HttpOnly/gi, '')     // Strip HttpOnly so frontend JS can read the token
          .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
          .replace(/SameSite=None/gi, 'SameSite=Lax');
      });

      res.setHeader('set-cookie', [...existingArray, ...rewrittenCookies]);
    }

    // Forward response body
    const body = await response.text();
    res.send(body);

  } catch (error) {
    console.error('[Vercel Proxy] Error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}

function buildBackendUrl(targetUrl, apiPath, query) {
  const base = targetUrl.endsWith('/') ? targetUrl : `${targetUrl}/`;
  const urlObj = new URL(apiPath.replace(/^\/+/, ''), base);

  for (const [key, value] of Object.entries(query)) {
    if (key !== 'path') {
      if (Array.isArray(value)) {
        value.forEach((item) => urlObj.searchParams.append(key, item));
      } else {
        urlObj.searchParams.set(key, value);
      }
    }
  }

  return urlObj;
}
