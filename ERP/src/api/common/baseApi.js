import { createApi } from "@reduxjs/toolkit/query/react";
import apiClient from "./client.js";
import { addAlert } from "../../features/notifications/notificationSlice.js";
import { createLogger } from "../../utils/logger.js";
import { isValidCompanyId } from "./roleCompanyContext.js";

const logger = createLogger("BASE_API");

// ─────────────────────────────────────────────────────────────────────────────
// Table-Driven Endpoint Contract Mapper
// ─────────────────────────────────────────────────────────────────────────────

export const ENDPOINT_CONTRACT_MAP = [
  // 1. SSO admin endpoints (Spring Data Pageable: 0-based, size, Spring Page in data)
  {
    prefix: '/api/sso/admin',
    pageBase: 0,
    sizeParam: 'size',
    responseShape: 'SPRING_PAGE',
    domainKey: 'content',
  },
  // 2. SSO user endpoints (0-based, pageSize, domain key 'users')
  {
    prefix: '/api/sso/user',
    pageBase: 0,
    sizeParam: 'pageSize',
    responseShape: 'SSO_DOMAIN_PAGINATION',
    domainKey: 'users',
  },
  // 3. SSO role endpoints (0-based, pageSize, domain key 'roles')
  {
    prefix: '/api/sso/role',
    pageBase: 0,
    sizeParam: 'pageSize',
    responseShape: 'SSO_DOMAIN_PAGINATION',
    domainKey: 'roles',
  },
  // 4. SSO company endpoints (1-based, pageSize, domain key 'companies')
  {
    prefix: '/api/sso/company',
    pageBase: 1,
    sizeParam: 'pageSize',
    responseShape: 'SSO_DOMAIN_PAGINATION',
    domainKey: 'companies',
  },
  // 5. General SSO fallback
  {
    prefix: '/api/sso',
    pageBase: 0,
    sizeParam: 'pageSize',
    responseShape: 'SSO_ENVELOPE',
    domainKey: null,
  },
  // 6. Account & Financials Service (0-based, size, ApiResponse.paginated envelope)
  {
    prefix: '/api/account',
    pageBase: 0,
    sizeParam: 'size',
    responseShape: 'API_PAGINATED',
    domainKey: 'content',
  },
  // 7. Inventory Service (0-based, size, ApiResponse.paginated envelope)
  {
    prefix: '/api/inventory',
    pageBase: 0,
    sizeParam: 'size',
    responseShape: 'API_PAGINATED',
    domainKey: 'content',
  },
  // 8. Workflow Service (0-based, size, Spring Page inside ApiResponse data)
  {
    prefix: '/api/v1/workflow',
    pageBase: 0,
    sizeParam: 'size',
    responseShape: 'SPRING_PAGE',
    domainKey: 'content',
  },
  // 9. Communication Service
  {
    prefix: '/api/communication',
    pageBase: 0,
    sizeParam: 'size',
    responseShape: 'API_PAGINATED',
    domainKey: 'content',
  },
];

export const getEndpointContract = (url = '') => {
  if (!url || typeof url !== 'string') {
    return {
      prefix: '',
      pageBase: 0,
      sizeParam: 'size',
      responseShape: 'API_PAGINATED',
      domainKey: 'content',
    };
  }
  for (const contract of ENDPOINT_CONTRACT_MAP) {
    if (url.startsWith(contract.prefix)) {
      return contract;
    }
  }
  return {
    prefix: '',
    pageBase: 0,
    sizeParam: 'size',
    responseShape: 'API_PAGINATED',
    domainKey: 'content',
  };
};

export const normalizeRequestParams = (url, params) => {
  if (!params || typeof params !== 'object') return params;
  const contract = getEndpointContract(url);
  const normalized = { ...params };

  // 1. Normalize size / pageSize
  if (contract.sizeParam === 'size') {
    if (normalized.pageSize !== undefined) {
      normalized.size = normalized.pageSize;
      delete normalized.pageSize;
    }
  } else if (contract.sizeParam === 'pageSize') {
    if (normalized.size !== undefined) {
      normalized.pageSize = normalized.size;
      delete normalized.size;
    }
  }

  // 2. Normalize page base (caller may pass 0-based or 1-based)
  if (contract.pageBase === 1) {
    if (normalized.page !== undefined && Number(normalized.page) === 0) {
      normalized.page = 1;
    }
  }

  // 3. Drop invalid or dummy companyId (e.g. "000000", "0") to prevent backend UUID parsing errors
  if (normalized.companyId !== undefined && !isValidCompanyId(normalized.companyId)) {
    delete normalized.companyId;
  }

  return normalized;
};

export const unwrapResponseByContract = (url, rawData) => {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    return rawData;
  }
  if (typeof Blob !== 'undefined' && rawData instanceof Blob) {
    return rawData;
  }

  const contract = getEndpointContract(url);

  // 1. Direct Spring Page: { content: [...], totalElements, totalPages, number, size }
  if (Array.isArray(rawData.content)) {
    const list = [...rawData.content];
    list._pageInfo = {
      totalElements: rawData.totalElements ?? list.length,
      totalPages: rawData.totalPages ?? 1,
      number: rawData.number ?? 0,
      size: rawData.size ?? list.length,
    };
    return list;
  }

  // 2. Standard ApiResponse / ResponseWrapper: { success: true, data: ... }
  if (rawData.data !== undefined && typeof rawData.success === 'boolean') {
    const inner = rawData.data;

    // 2a. Array inside data: { data: [...] }
    if (Array.isArray(inner)) {
      const list = [...inner];
      if (rawData.pagination) {
        list._pageInfo = {
          totalElements: rawData.pagination.totalElements ?? rawData.pagination.totalCount ?? list.length,
          totalPages: rawData.pagination.totalPages ?? 1,
          page: rawData.pagination.page ?? rawData.pagination.currentPage ?? 1,
          size: rawData.pagination.size ?? rawData.pagination.pageSize ?? list.length,
        };
      }
      return list;
    }

    // 2b. Object inside data
    if (inner && typeof inner === 'object') {
      // Direct Spring Page inside data: { data: { content: [...], totalElements, ... } }
      if (Array.isArray(inner.content)) {
        const list = [...inner.content];
        list._pageInfo = {
          totalElements: inner.totalElements ?? list.length,
          totalPages: inner.totalPages ?? 1,
          number: inner.number ?? 0,
          size: inner.size ?? list.length,
        };
        return list;
      }

      // SSO Domain Pagination: { data: { companies: [...], pagination: { ... } } }
      if (contract.domainKey && Array.isArray(inner[contract.domainKey])) {
        const list = [...inner[contract.domainKey]];
        if (inner.pagination) {
          list._pageInfo = {
            totalElements: inner.pagination.totalCount ?? inner.pagination.totalElements ?? list.length,
            totalPages: inner.pagination.totalPages ?? 1,
            page: inner.pagination.currentPage ?? inner.pagination.page ?? 1,
            size: inner.pagination.pageSize ?? inner.pagination.size ?? list.length,
          };
        }
        return list;
      }

      // General domain array detection (e.g. users, roles, items)
      const arrayKeys = Object.keys(inner).filter((k) => Array.isArray(inner[k]));
      const metaKeys = ['pagination', '_pageInfo', 'page', 'size', 'pageSize', 'totalElements', 'totalCount', 'totalPages'];
      const nonMetaNonArrayKeys = Object.keys(inner).filter((k) => !Array.isArray(inner[k]) && !metaKeys.includes(k));

      if (arrayKeys.length === 1 && nonMetaNonArrayKeys.length === 0) {
        const list = [...inner[arrayKeys[0]]];
        if (inner.pagination) {
          list._pageInfo = {
            totalElements: inner.pagination.totalCount ?? inner.pagination.totalElements ?? list.length,
            totalPages: inner.pagination.totalPages ?? 1,
            page: inner.pagination.currentPage ?? inner.pagination.page ?? 1,
            size: inner.pagination.pageSize ?? inner.pagination.size ?? list.length,
          };
        }
        return list;
      }

      // Return full object if complex (e.g. details, reports, nested objects)
      return inner;
    }
  }

  return rawData;
};

const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: "" }) =>
    async (args, api) => {
      // Normalize string queries: RTK Query endpoints can return a plain string like '/api/foo'
      // but our axiosBaseQuery expects { url, method, data, params, headers }
      if (typeof args === "string") {
        args = { url: args, method: "GET" };
      }
      const { url, method, data, params, headers, responseType } = args;

      // Safeguard: If params is a primitive (e.g. string), it will crash Axios with 'target must be an object'
      // This happens if a component calls `useGetFooQuery(companyId)` but the slice uses `query: (params) => ({ params })`
      let safeParams = params;
      if (params !== undefined && typeof params !== "object") {
        logger.warn(
          `Expected params to be an object, but got ${typeof params}. Dropping params to prevent Axios crash.`,
        );
        safeParams = undefined;
      } else if (safeParams) {
        safeParams = normalizeRequestParams(url, safeParams);
      }

      try {

        const result = await apiClient({
          url: baseUrl + url,
          method,
          data,
          params: safeParams,
          headers,
          responseType,
        });

        let finalData = result.data;
        if (finalData instanceof Blob || (typeof Blob !== 'undefined' && finalData instanceof Blob)) {
          return { data: finalData };
        }
        // Table-driven contract unwrapping
        finalData = unwrapResponseByContract(url, result.data);

        // If the backend returns a 200 OK but success is explicitly false, treat it as an error
        if (result.data && typeof result.data === 'object' && result.data.success === false) {
          return {
            error: {
              status: result.data.status || 400,
              data: result.data,
            }
          };
        }

        return { data: finalData };
      } catch (axiosError) {
        const status = axiosError.response?.status;
        const responseData = axiosError.response?.data;
        let message = responseData?.message;

        if (!message) {
          if (responseData?.errors && Array.isArray(responseData.errors)) {
            message = responseData.errors
              .map((e) => e.defaultMessage || (e.field ? `${e.field}: ${e.defaultMessage}` : String(e)))
              .filter(Boolean)
              .join(", ");
          }
          if (!message) {
            message = axiosError.message || "Something went wrong";
          }
        }

        const reqUrl = axiosError.config?.url || "";
        const isLogoutRequest = reqUrl.includes("/logout");

        if (status === 400) {
          logger.error("Backend 400 Bad Request", { data: responseData });
        }

        // Global error handling & toast dispatching
        if (!isLogoutRequest) {
          if (status === 400) {
            api.dispatch(addAlert({ type: "error", message }));
          } else if (status === 401) {
            const isAuthMeProbe = reqUrl.includes("/api/account/auth/me") || reqUrl.includes("/api/sso/auth/me");
            if (!isAuthMeProbe) {
              api.dispatch(
                addAlert({
                  type: "error",
                  message: "Session expired. Please log in again.",
                }),
              );
            }
            // Handle redirect or logout state in slice
          } else if (status === 403) {
            // Suppress toast for the SSO /me probe
            const isAuthMeProbe = reqUrl.includes("/api/account/auth/me") || reqUrl.includes("/api/sso/auth/me");
            if (!isAuthMeProbe) {
              const lower = String(message || '').toLowerCase();
              const isReadOnlyBlock = lower.includes('read_only') || lower.includes('read-only') || lower.includes('read only');
              const isBlocked = lower.includes('blocked') || lower.includes('restricted');

              api.dispatch(
                addAlert({
                  type: "warning",
                  message: isReadOnlyBlock
                    ? "Your free trial has expired. This account is currently read-only. Upgrade your subscription to continue creating or modifying business data."
                    : isBlocked
                    ? "Account access restricted. Please contact support or your administrator."
                    : "You do not have permission to perform this action.",
                }),
              );
            }
          } else if (status === 404) {
            api.dispatch(
              addAlert({
                type: "error",
                message: `Resource not found: ${message}`,
              }),
            );
          } else if (status >= 500) {
            logger.error("Backend 500 Internal Error", { data: responseData });
            api.dispatch(
              addAlert({
                type: "error",
                message: "Server error. Please try again later.",
              }),
            );
          } else {
            api.dispatch(addAlert({ type: "error", message }));
          }
        }

        return {
          error: {
            status: status || 500,
            message: message || "An unexpected error occurred",
            fieldErrors: responseData?.data?.fieldErrors || responseData?.errors || null,
            data: axiosError.response?.data || { message },
          },
        };
      }
    };

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  keepUnusedDataFor: 300, // 5 minutes (default is 60s)
  refetchOnMountOrArgChange: false, // Prevent refetching on remount if data exists and arg is unchanged
  tagTypes: [
    "Auth",
    "Company",
    "User",
    "Role",
    "Module",
    "CompanyModule",
    "Session",
    "PortalAccess",
    "Finance",
    "Invoices",
    "Accounting",
    "Banking",
    "Budgeting",
    "Periods",
    "HR",
    "Inventory",
    "Sales",
    "Purchase",
    "Manufacturing",
    "CRM",
    "Customer",
    "Vendor",
    "Notes",
    "Dashboard",
    "Audit",
    "Reports",
    "Settings",
    "SalesSettings",
    "DeliveryChallans",
  ],
  endpoints: () => ({}),
});
