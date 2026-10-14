import apiClient from '../../../api/common/client';
import { getUsers, getUserById } from '../../../api/sso/user';

/**
 * In-memory cache for resolved people to avoid redundant fetches
 */
const personCache = new Map();

/**
 * Helper to determine current companyId from localStorage
 */
export const resolveCurrentCompanyId = () => {
  if (typeof window === 'undefined') return null;
  try {
    const selectedCompany = JSON.parse(localStorage.getItem('selected_company') || '{}');
    if (selectedCompany?.id) return selectedCompany.id;
    if (selectedCompany?.companyId) return selectedCompany.companyId;

    const persistedRoot = JSON.parse(localStorage.getItem('persist:root') || '{}');
    if (persistedRoot?.auth) {
      const authState = JSON.parse(persistedRoot.auth);
      if (authState?.user?.companyId) return authState.user.companyId;
    }

    const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    if (authUser?.companyId) return authUser.companyId;
  } catch (e) {
    console.error('Error resolving companyId from storage:', e);
  }
  return null;
};

/**
 * Helper to inspect user roles, codes, and department to check if a person is a driver
 */
export const isPersonDriver = (person) => {
  if (!person) return false;
  const roleStrings = [];

  // Check role property (array of objects, single object, or string)
  if (Array.isArray(person.role)) {
    person.role.forEach((r) => {
      if (typeof r === 'string') roleStrings.push(r);
      else if (r && typeof r === 'object') roleStrings.push(r.name || r.code || r.roleName || r.authority || r.role);
    });
  } else if (typeof person.role === 'string') {
    roleStrings.push(person.role);
  } else if (person.role && typeof person.role === 'object') {
    roleStrings.push(person.role.name || person.role.code || person.role.roleName || person.role.authority);
  }

  // Check roles property
  if (Array.isArray(person.roles)) {
    person.roles.forEach((r) => {
      if (typeof r === 'string') roleStrings.push(r);
      else if (r && typeof r === 'object') roleStrings.push(r.name || r.code || r.roleName || r.authority || r.role);
    });
  }

  // Check authorities property (Spring Security user objects)
  if (Array.isArray(person.authorities)) {
    person.authorities.forEach((a) => {
      if (typeof a === 'string') roleStrings.push(a);
      else if (a && typeof a === 'object') roleStrings.push(a.authority || a.name || a.role);
    });
  }

  // Check employee code prefix (e.g. DRV-001, DRV-008)
  const empCode = String(person.empId || person.employeeCode || person.code || '').toUpperCase();
  if (empCode.startsWith('DRV') || empCode.includes('DRIVER')) return true;

  // Check employee designation, department, type
  if (person.employeeType) roleStrings.push(person.employeeType);
  if (person.designation) roleStrings.push(person.designation);
  if (person.department) roleStrings.push(person.department);
  if (person.title) roleStrings.push(person.title);

  const combined = roleStrings.filter(Boolean).join(' ').toLowerCase();
  return (
    combined.includes('driver') ||
    combined.includes('fleet') ||
    combined.includes('chauffeur') ||
    combined.includes('transport')
  );
};

/**
 * Normalizes raw API response objects from SSO/HR/Auth into standardized Person models
 */
const normalizePerson = (raw) => {
  if (!raw) return null;
  const id = raw.id || raw.userId || raw.uuid;
  if (!id) return null;

  const isDriver = isPersonDriver(raw);
  const name =
    raw.fullName ||
    raw.name ||
    (raw.firstName ? `${raw.firstName} ${raw.lastName || ''}`.trim() : null) ||
    raw.username ||
    raw.email ||
    'Staff Member';

  const empId = raw.empId || raw.employeeCode || raw.code || '';
  const email = raw.email || '';
  const username = raw.username || '';

  // Human-readable type label
  let displayType = isDriver ? 'Driver' : 'Employee';
  if (!isDriver && raw.role) {
    if (typeof raw.role === 'string') {
      displayType = raw.role.replace(/^ROLE_/, '');
    } else if (Array.isArray(raw.role) && raw.role[0]?.name) {
      displayType = raw.role[0].name.replace(/^ROLE_/, '');
    }
  } else if (!isDriver && Array.isArray(raw.roles) && raw.roles[0]?.name) {
    displayType = raw.roles[0].name.replace(/^ROLE_/, '');
  }

  const personObj = {
    id,
    name,
    empId,
    email,
    username,
    isDriver,
    roleType: isDriver ? 'DRIVER' : 'EMPLOYEE',
    displayType,
  };

  personCache.set(id, personObj);
  return personObj;
};

let cachedCurrentUser = null;

export const getCurrentUserCached = () => {
  if (cachedCurrentUser) return cachedCurrentUser;
  try {
    const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    if (authUser?.id || authUser?.userId) {
      return normalizePerson(authUser);
    }
  } catch (e) {}
  return null;
};

export const getCurrentUser = async () => {
  try {
    const meRes = await apiClient.get('/api/account/auth/me');
    const meUser = meRes?.data?.data || meRes?.data;
    if (meUser && (meUser.id || meUser.userId)) {
      const norm = normalizePerson(meUser);
      if (norm) {
        cachedCurrentUser = norm;
      }
    }
    return meUser;
  } catch (err) {
    console.warn('Failed to load user from /api/account/auth/me:', err?.message || err);
    return null;
  }
};

export const employeeDriverService = {
  getCurrentUser,
  getCurrentUserCached,

  /**
   * Fetch company employees and drivers using:
   * 1. GET /api/account/auth/me (Primary: present authenticated employee/driver)
   * 2. GET /api/sso/user/company/{companyId} (Supplementary: all company users)
   * 3. GET /api/account/employees (Fallback: HR employee records)
   */
  getCompanyPeople: async (companyIdOverride = null) => {
    const companyId = companyIdOverride || resolveCurrentCompanyId();
    const collected = new Map();

    // 1. Primary: Get present authenticated Employee / Driver from GET /api/account/auth/me
    try {
      const meRes = await apiClient.get('/api/account/auth/me');
      const meUser = meRes?.data?.data || meRes?.data;
      if (meUser && (meUser.id || meUser.userId)) {
        const normMe = normalizePerson(meUser);
        if (normMe && normMe.id) {
          cachedCurrentUser = normMe;
          collected.set(normMe.id, normMe);
        }
      }
    } catch (meErr) {
      console.warn('Could not fetch present user from /api/account/auth/me:', meErr?.message || meErr);
    }

    // 2. Secondary: SSO Company Users API
    try {
      const ssoRes = await getUsers(companyId, { page: 0, pageSize: 200 });
      const ssoUsers =
        ssoRes?.users ||
        (Array.isArray(ssoRes) ? ssoRes : null) ||
        ssoRes?.content ||
        ssoRes?.data?.users ||
        [];

      if (Array.isArray(ssoUsers)) {
        ssoUsers.forEach((u) => {
          const norm = normalizePerson(u);
          if (norm && !collected.has(norm.id)) {
            collected.set(norm.id, norm);
          }
        });
      }
    } catch (ssoErr) {
      // SSO company users endpoint optional fallback
    }

    // 3. (HR employees /api/account/employees omitted as backend service is unavailable)

    // 4. Local storage fallback if still empty
    if (collected.size === 0) {
      try {
        const authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
        if (authUser?.id || authUser?.userId) {
          const norm = normalizePerson(authUser);
          if (norm && norm.id) {
            cachedCurrentUser = norm;
            collected.set(norm.id, norm);
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const allPeople = Array.from(collected.values());
    const employees = allPeople.filter((p) => !p.isDriver);
    const drivers = allPeople.filter((p) => p.isDriver);

    return {
      all: allPeople,
      employees,
      drivers,
      currentUser: cachedCurrentUser,
    };
  },

  /**
   * Promise cache to deduplicate concurrent requests for the same ID
   */
  _pendingPromises: new Map(),

  /**
   * Resolves a person's display name by their UUID.
   * Checks in-memory cache, then /api/sso/user/{id}.
   */
  resolvePersonName: async (id) => {
    if (!id) return null;
    if (personCache.has(id)) {
      return personCache.get(id).name;
    }
    
    // Check if the UUID matches the present user already in cache
    if (cachedCurrentUser && (cachedCurrentUser.id === id || cachedCurrentUser.userId === id)) {
       return cachedCurrentUser.name;
    }

    // Deduplicate concurrent requests for the same ID
    if (employeeDriverService._pendingPromises.has(id)) {
      return employeeDriverService._pendingPromises.get(id);
    }

    const fetchPromise = (async () => {
      try {
        const user = await getUserById(id);
        if (user) {
          const norm = normalizePerson(user);
          return norm?.name || null;
        }
      } catch (e) {
        // Fallback gracefully on lookup failure
      } finally {
        employeeDriverService._pendingPromises.delete(id);
      }
      return null;
    })();

    employeeDriverService._pendingPromises.set(id, fetchPromise);
    return fetchPromise;
  },

  /**
   * Synchronous cached lookup for immediate UI rendering without promises.
   */
  getCachedPersonName: (id) => {
    if (!id) return null;
    return personCache.get(id)?.name || null;
  },

  /**
   * Synchronous cached lookup for full person object.
   */
  getCachedPerson: (id) => {
    if (!id) return null;
    return personCache.get(id) || null;
  },
};

export default employeeDriverService;
