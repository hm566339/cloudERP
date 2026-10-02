import { createApi } from "@reduxjs/toolkit/query/react";
import apiClient from "./client";
import { addAlert } from "../../features/notifications/notificationSlice";
import { createLogger } from "../../utils/logger";

const logger = createLogger("BASE_API");

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
      } else if (
        safeParams &&
        safeParams.pageSize !== undefined &&
        !(url && url.startsWith("/api/sso"))
      ) {
        // Spring Data expects 'size', not 'pageSize'. Auto-map this to prevent default 20 size limit override.
        safeParams = { ...safeParams, size: safeParams.pageSize };
        delete safeParams.pageSize;
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
        // Auto-unpack backend response wrappers to prevent .filter() errors in UI components
        // Handles: Spring pagination {content:[...]}, wrapped {data:[...]},
        // and {success, data: {someKey: [...], pagination: {}}}
        if (
          finalData &&
          typeof finalData === "object" &&
          !Array.isArray(finalData)
        ) {
          // 1) Spring Data pagination: { content: [...], totalElements, totalPages, ... }
          if (Array.isArray(finalData.content)) {
            const pageInfo = {
              totalElements: finalData.totalElements,
              totalPages: finalData.totalPages,
              number: finalData.number,
              size: finalData.size,
            };
            finalData = finalData.content;
            finalData._pageInfo = pageInfo;
          }
          // 2) Wrapper like { success, message, data: ... } — only unwrap if it looks like a response envelope
          // (requires a 'success' boolean flag to avoid accidentally unwrapping entities with a 'data' field)
          else if (
            finalData.data !== undefined &&
            typeof finalData.success === "boolean"
          ) {
            const inner = finalData.data;
            if (Array.isArray(inner)) {
              // { data: [...] }
              finalData = inner;
              if (result.data.pagination)
                finalData._pageInfo = result.data.pagination;
            } else if (
              inner &&
              typeof inner === "object" &&
              !Array.isArray(inner)
            ) {
              // { data: { content: [...], ... } } — Spring pagination inside wrapper
              if (Array.isArray(inner.content)) {
                const pageInfo = {
                  totalElements: inner.totalElements,
                  totalPages: inner.totalPages,
                  number: inner.number,
                  size: inner.size,
                };
                finalData = inner.content;
                finalData._pageInfo = pageInfo;
              } else {
                // { data: { companies: [...], pagination: {} } } — find the array property
                const arrayKeys = Object.keys(inner).filter((k) =>
                  Array.isArray(inner[k]),
                );
                // Only auto-unwrap if the array is the ONLY property (or the only one besides pagination/pageInfo)
                const otherKeys = Object.keys(inner).filter(
                  (k) =>
                    !Array.isArray(inner[k]) &&
                    ![
                      "pagination",
                      "_pageInfo",
                      "page",
                      "size",
                      "totalElements",
                      "totalPages",
                      "totalCount",
                      "total",
                      "count",
                      "pageNumber",
                      "currentPage",
                      "hasNext",
                      "hasPrevious",
                      "number",
                      "first",
                      "last",
                      "empty",
                    ].includes(k),
                );
                const hasImportantOtherKeys = otherKeys.length > 0;

                if (arrayKeys.length === 1 && !hasImportantOtherKeys) {
                  finalData = inner[arrayKeys[0]];
                  if (inner.pagination) finalData._pageInfo = inner.pagination;
                } else {
                  // Return the whole object so components can access rows, summary, openingBalance, etc.
                  finalData = inner;
                }
              }
            }
          }
        }

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
