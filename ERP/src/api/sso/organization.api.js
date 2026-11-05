import { baseApi } from '../common/baseApi';
import apiClient from '../common/client';

/**
 * Organization API Slice
 *
 * Provides RTK Query endpoints for the Organization-level multi-tenancy model
 * and platform admin management via the API Gateway prefix /api/sso.
 *
 * Platform-level System Admin endpoints (exposed through SSO gateway):
 *   GET    /api/sso/admin/organizations
 *   GET    /api/sso/admin/organizations/{organizationId}
 *   GET    /api/sso/admin/organizations/{organizationId}/members
 *   GET    /api/sso/admin/organizations/{organizationId}/companies
 *   GET    /api/sso/admin/organizations/{organizationId}/subscription
 *   GET    /api/sso/admin/organizations/{organizationId}/payments
 *   GET    /api/sso/admin/organizations/{organizationId}/invoices
 *   GET    /api/sso/admin/dashboard
 *   GET    /api/sso/admin/audit-logs
 *   GET    /api/sso/admin/support-sessions
 *   POST   /api/sso/admin/support-sessions
 *   POST   /api/sso/admin/support-sessions/{id}/revoke
 *   POST   /api/sso/admin/support-sessions/{id}/mutate
 *   GET    /api/sso/platform/admins
 *   POST   /api/sso/platform/admins
 *   PUT    /api/sso/platform/admins/{id}/status
 *   PUT    /api/sso/platform/admins/{id}/role
 *
 * IMPORTANT pagination conventions:
 *   Organization / Audit Log APIs: page (0-based), size
 *   Legacy company / user / role / module APIs: page (0-based), pageSize
 */

function normalizeOrganization(o) {
  if (!o) return null;
  return {
    id: o.id || o.organizationId,
    name: o.name || o.organizationName,
    code: o.code || o.organizationCode,
    status: o.status || (o.active ? 'ACTIVE' : 'INACTIVE'),
    active: o.active !== undefined ? o.active : (o.status === 'ACTIVE'),
    email: o.email || '',
    phone: o.phone || '',
    address: o.address || o.addressLine1 || '',
    city: o.city || '',
    state: o.state || '',
    country: o.country || '',
    timezone: o.timezone || '',
    currency: o.currency || o.baseCurrency || 'INR',
    memberCount: o.memberCount ?? o.totalMembers ?? 0,
    companyCount: o.companyCount ?? o.totalCompanies ?? 0,
    activeUserCount: o.activeUserCount ?? 0,
    createdAt: o.createdAt || o.created || '',
    updatedAt: o.updatedAt || o.updated || '',
    owner: o.owner || o.ownerName || null,
    subscription: o.subscription || null,
    planCode: o.planCode || null,
    lastActivity: o.lastActivity || null,
  };
}

export const organizationApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({

    // GET /api/sso/admin/organizations?page=0&size=200&search=...&status=...&accessMode=...
    // NOTE: Organization API uses "size" (not "pageSize") — do not mix with company API params
    getOrganizations: builder.query({
      query: (params = { page: 0, size: 200 }) => {
        const safeParams = {
          page: params?.page ?? 0,
          size: params?.size ?? params?.pageSize ?? 200,
        };
        if (params?.search) safeParams.search = params.search;
        if (params?.status && params.status !== 'ALL') safeParams.status = params.status;
        if (params?.accessMode) safeParams.accessMode = params.accessMode;
        return {
          url: '/api/sso/admin/organizations',
          method: 'GET',
          params: safeParams,
        };
      },
      transformResponse: (response) => {
        let orgs = [];
        if (Array.isArray(response)) orgs = response;
        else if (Array.isArray(response?.organizations)) orgs = response.organizations;
        else if (Array.isArray(response?.data?.content)) orgs = response.data.content;
        else if (Array.isArray(response?.data)) orgs = response.data;
        else if (Array.isArray(response?.content)) orgs = response.content;
        return {
          organizations: orgs.map(normalizeOrganization),
          pagination: response?._pageInfo || response?.pagination || response?.data?.pageable || null,
          totalElements: response?._pageInfo?.totalElements || response?.pagination?.totalElements || response?.data?.totalElements || orgs.length,
          totalPages: response?._pageInfo?.totalPages || response?.pagination?.totalPages || response?.data?.totalPages || 1,
        };
      },
      providesTags: ['Organization'],
    }),

    // GET /api/sso/admin/organizations/{organizationId}
    getOrganizationById: builder.query({
      query: (organizationId) => ({
        url: `/api/sso/admin/organizations/${organizationId}`,
        method: 'GET',
      }),
      transformResponse: (response) => {
        const o = response?.data || response;
        return normalizeOrganization(o);
      },
      providesTags: (result, error, organizationId) => [{ type: 'Organization', id: organizationId }],
    }),

    // POST /api/sso/admin/organizations (or trial signup at /api/sso/signup)
    createOrganization: builder.mutation({
      query: (data) => ({
        url: '/api/sso/signup',
        method: 'POST',
        data: {
          name: data.name,
          code: data.code,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          timezone: data.timezone,
          currency: data.currency || 'INR',
          adminEmail: data.adminEmail,
          adminFirstName: data.adminFirstName,
          adminLastName: data.adminLastName,
          adminPassword: data.adminPassword,
        },
      }),
      invalidatesTags: ['Organization'],
    }),

    // PUT /api/sso/admin/organizations/{organizationId}
    updateOrganization: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/sso/admin/organizations/${id}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Organization', id }, 'Organization'],
    }),

    // DELETE /api/sso/admin/organizations/{organizationId}
    deleteOrganization: builder.mutation({
      query: (organizationId) => ({
        url: `/api/sso/admin/organizations/${organizationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Organization'],
    }),

    // PATCH /api/sso/admin/organizations/{organizationId}/status
    updateOrganizationStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/api/sso/admin/organizations/${id}/status`,
        method: 'PATCH',
        params: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Organization', id }, 'Organization'],
    }),

    // GET /api/sso/admin/organizations/{organizationId}/members
    getOrganizationMembers: builder.query({
      query: ({ organizationId, ...params }) => ({
        url: `/api/sso/admin/organizations/${organizationId}/members`,
        method: 'GET',
        params,
      }),
      transformResponse: (response) => {
        const members = response?.members || response?.data || (Array.isArray(response) ? response : []);
        return {
          members: (Array.isArray(members) ? members : []).map((m) => ({
            id: m.id || m.memberId,
            userId: m.userId,
            name: m.name || m.fullName || m.username,
            email: m.email,
            role: m.role || m.roleName,
            status: m.status || (m.active ? 'ACTIVE' : 'INACTIVE'),
            joinedAt: m.joinedAt || m.createdAt,
          })),
          pagination: response?.pagination || null,
          total: response?.total || (Array.isArray(members) ? members.length : 0),
        };
      },
      providesTags: (result, error, { organizationId }) => [{ type: 'OrganizationMember', id: organizationId }],
    }),

    // GET /api/sso/admin/organizations/{organizationId}/companies
    getOrganizationCompanies: builder.query({
      query: ({ organizationId, ...params }) => ({
        url: `/api/sso/admin/organizations/${organizationId}/companies`,
        method: 'GET',
        params,
      }),
      transformResponse: (response) => {
        const companies = response?.companies || response?.data || (Array.isArray(response) ? response : []);
        return {
          companies: (Array.isArray(companies) ? companies : []).map((c) => ({
            ...c,
            id: c.id || c.companyId,
            name: c.companyName || c.name,
            code: c.companyCode || c.code,
            status: c.status || (c.active ? 'ACTIVE' : 'INACTIVE'),
            active: c.active !== undefined ? c.active : true,
          })),
          pagination: response?.pagination || null,
          total: response?.total || (Array.isArray(companies) ? companies.length : 0),
        };
      },
      providesTags: (result, error, { organizationId }) => [
        { type: 'OrganizationCompany', id: organizationId },
        'Company',
      ],
    }),

    // GET /api/sso/admin/organizations/{organizationId}/subscription
    getOrganizationSubscription: builder.query({
      query: (organizationId) => ({
        url: `/api/sso/admin/organizations/${organizationId}/subscription`,
        method: 'GET',
      }),
      transformResponse: (response) => response?.data || response,
      providesTags: (result, error, organizationId) => [{ type: 'OrganizationSubscription', id: organizationId }],
    }),

    // GET /api/sso/admin/organizations/{organizationId}/payments
    getOrganizationPayments: builder.query({
      query: (organizationId) => ({
        url: `/api/sso/admin/organizations/${organizationId}/payments`,
        method: 'GET',
      }),
      transformResponse: (response) => response?.data || response || [],
      providesTags: (result, error, organizationId) => [{ type: 'OrganizationPayment', id: organizationId }],
    }),

    // GET /api/sso/admin/organizations/{organizationId}/invoices
    getOrganizationInvoices: builder.query({
      query: (organizationId) => ({
        url: `/api/sso/admin/organizations/${organizationId}/invoices`,
        method: 'GET',
      }),
      transformResponse: (response) => response?.data || response || [],
      providesTags: (result, error, organizationId) => [{ type: 'OrganizationInvoice', id: organizationId }],
    }),

    // GET /api/sso/admin/organizations/{organizationId}/modules
    getOrganizationModules: builder.query({
      query: ({ organizationId, ...params }) => ({
        url: `/api/sso/admin/organizations/${organizationId}/modules`,
        method: 'GET',
        params,
      }),
      transformResponse: (response) => {
        const modules = response?.modules || response?.data || (Array.isArray(response) ? response : []);
        return {
          modules: (Array.isArray(modules) ? modules : []).map((m) => ({
            id: m.id,
            moduleId: m.moduleId,
            name: m.name || m.moduleName,
            code: m.code || m.moduleCode,
            status: m.status || (m.active ? 'ACTIVE' : 'INACTIVE'),
            active: m.active !== undefined ? m.active : true,
            assignedAt: m.assignedAt || m.createdAt,
          })),
          total: Array.isArray(modules) ? modules.length : 0,
        };
      },
      providesTags: (result, error, { organizationId }) => [{ type: 'OrganizationModule', id: organizationId }],
    }),

    // GET /api/sso/admin/organizations/{organizationId}/roles
    getOrganizationRoles: builder.query({
      query: ({ organizationId, ...params }) => ({
        url: `/api/sso/admin/organizations/${organizationId}/roles`,
        method: 'GET',
        params,
      }),
      transformResponse: (response) => {
        const roles = response?.roles || response?.data || (Array.isArray(response) ? response : []);
        return {
          roles: (Array.isArray(roles) ? roles : []).map((r) => ({
            id: r.id,
            name: r.name || r.roleName,
            description: r.description,
            status: r.status || (r.active ? 'ACTIVE' : 'INACTIVE'),
            active: r.active !== undefined ? r.active : true,
            permissionCount: r.permissionCount ?? 0,
          })),
          total: Array.isArray(roles) ? roles.length : 0,
        };
      },
      providesTags: (result, error, { organizationId }) => [{ type: 'OrganizationRole', id: organizationId }],
    }),

    // GET /api/sso/admin/organizations/{organizationId}/audit-logs
    getOrganizationAuditLogs: builder.query({
      query: ({ organizationId, ...params }) => ({
        url: `/api/sso/admin/organizations/${organizationId}/audit-logs`,
        method: 'GET',
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? params?.pageSize ?? 20,
        },
      }),
      transformResponse: (response) => {
        const logs = response?.logs || response?.auditLogs || response?.data || (Array.isArray(response) ? response : []);
        return {
          logs: (Array.isArray(logs) ? logs : []).map((l) => ({
            id: l.id,
            actor: l.actor || l.actorName,
            actorRole: l.actorRole,
            action: l.action || l.actionType,
            targetEntity: l.targetEntity || l.entityType,
            targetId: l.targetId || l.entityId,
            organizationId: l.organizationId,
            companyId: l.companyId,
            timestamp: l.timestamp || l.createdAt,
            ip: l.ip || l.ipAddress,
            result: l.result || l.status,
          })),
          pagination: response?.pagination || null,
          total: response?.total || (Array.isArray(logs) ? logs.length : 0),
        };
      },
      providesTags: (result, error, { organizationId }) => [{ type: 'OrganizationAuditLog', id: organizationId }],
    }),

    // GET /api/sso/admin/dashboard
    // Returns PlatformDashboardResponse with: totalOrganizations, activeOrganizations,
    // totalCompanies, totalUsers, activeSubscriptions, recentSupportSessions, recentAuditEvents
    getSystemAdminDashboardOverview: builder.query({
      query: () => ({
        url: '/api/sso/admin/dashboard',
        method: 'GET',
      }),
      transformResponse: (response) => {
        const data = response?.data || response;
        return {
          organizations: {
            total: data?.totalOrganizations ?? data?.organizations?.total ?? null,
            active: data?.activeOrganizations ?? data?.organizations?.active ?? null,
            suspended: data?.suspendedOrganizations ?? data?.organizations?.suspended ?? null,
          },
          companies: {
            total: data?.totalCompanies ?? data?.companies?.total ?? null,
            active: data?.activeCompanies ?? data?.companies?.active ?? null,
          },
          members: {
            total: data?.totalUsers ?? data?.members?.total ?? null,
            active: data?.activeUsers ?? data?.members?.active ?? null,
          },
          modules: {
            total: data?.totalModules ?? data?.modules?.total ?? null,
            active: data?.activeModules ?? data?.modules?.active ?? null,
          },
          sessions: {
            active: data?.recentSupportSessions ?? data?.sessions?.active ?? null,
          },
          systemHealth: {
            api: data?.systemHealth?.api || 'ONLINE',
            database: data?.systemHealth?.database || 'ONLINE',
            integrations: data?.systemHealth?.integrations || 'ONLINE',
          },
        };
      },
      providesTags: ['SystemAdminDashboard'],
    }),

    // GET /api/sso/admin/audit-logs
    getPlatformAuditLogs: builder.query({
      query: (params = { page: 0, size: 20 }) => ({
        url: '/api/sso/admin/audit-logs',
        method: 'GET',
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? params?.pageSize ?? 20,
        },
      }),
      transformResponse: (response) => response?.data || response,
      providesTags: ['PlatformAuditLog'],
    }),

    // GET /api/sso/platform/admins
    getPlatformAdmins: builder.query({
      query: () => ({
        url: '/api/sso/platform/admins',
        method: 'GET',
      }),
      transformResponse: (response) => response?.data || response || [],
      providesTags: ['PlatformAdmin'],
    }),

    // POST /api/sso/platform/admins
    createPlatformAdmin: builder.mutation({
      query: (data) => ({
        url: '/api/sso/platform/admins',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['PlatformAdmin'],
    }),

    // PUT /api/sso/platform/admins/{id}/status
    updatePlatformAdminStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/sso/platform/admins/${id}/status`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['PlatformAdmin'],
    }),

    // PUT /api/sso/platform/admins/{id}/role
    updatePlatformAdminRole: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/sso/platform/admins/${id}/role`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['PlatformAdmin'],
    }),

    // GET /api/sso/admin/support-sessions
    getSupportSessions: builder.query({
      query: () => ({
        url: '/api/sso/admin/support-sessions',
        method: 'GET',
      }),
      transformResponse: (response) => response?.data || response || [],
      providesTags: ['SupportSession'],
    }),

    // POST /api/sso/admin/support-sessions
    createSupportSession: builder.mutation({
      query: (data) => ({
        url: '/api/sso/admin/support-sessions',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['SupportSession'],
    }),

    // POST /api/sso/admin/support-sessions/{id}/revoke
    revokeSupportSession: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/api/sso/admin/support-sessions/${id}/revoke`,
        method: 'POST',
        data: reason ? { reason } : {},
      }),
      invalidatesTags: ['SupportSession'],
    }),

    // POST /api/sso/admin/support-sessions/{id}/mutate
    mutateSupportSession: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/sso/admin/support-sessions/${id}/mutate`,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['SupportSession'],
    }),

    // POST /api/sso/admin/organizations/{organizationId}/members
    addOrganizationMember: builder.mutation({
      query: ({ organizationId, ...data }) => ({
        url: `/api/sso/admin/organizations/${organizationId}/members`,
        method: 'POST',
        data,
      }),
      invalidatesTags: (result, error, { organizationId }) => [
        { type: 'OrganizationMember', id: organizationId },
        'Organization',
      ],
    }),

    // POST /api/sso/admin/organizations/{organizationId}/modules
    assignModuleToOrganization: builder.mutation({
      query: ({ organizationId, ...data }) => ({
        url: `/api/sso/admin/organizations/${organizationId}/modules`,
        method: 'POST',
        data,
      }),
      invalidatesTags: (result, error, { organizationId }) => [
        { type: 'OrganizationModule', id: organizationId },
        'Organization',
      ],
    }),

    // GET /api/sso/organization/members
    getOrgMembers: builder.query({
      query: () => ({
        url: `/api/sso/organization/members`,
        method: 'GET',
      }),
      transformResponse: (response) => {
        const data = response?.data || response || [];
        return Array.isArray(data) ? data : [];
      },
      providesTags: ['OrganizationMembers'],
    }),

    // GET /api/sso/organization/members/{memberId}/companies/access
    getMemberCompanyAccess: builder.query({
      query: (memberId) => ({
        url: `/api/sso/organization/members/${memberId}/companies/access`,
        method: 'GET',
      }),
      transformResponse: (response) => {
        const data = response?.data || response || [];
        return Array.isArray(data) ? data : [];
      },
      providesTags: (result, error, memberId) => [{ type: 'OrganizationMembers', id: memberId }],
    }),

    // GET /api/sso/organization/members/user/{userId}/companies/access
    getUserCompanyAccess: builder.query({
      query: (userId) => ({
        url: `/api/sso/organization/members/user/${userId}/companies/access`,
        method: 'GET',
      }),
      transformResponse: (response) => {
        const data = response?.data || response || [];
        return Array.isArray(data) ? data : [];
      },
      providesTags: (result, error, userId) => [{ type: 'OrganizationMembers', id: userId }],
    }),

    // POST /api/sso/organization/members/{memberId}/companies
    grantMemberCompanyAccess: builder.mutation({
      query: ({ memberId, companyId, roleId }) => ({
        url: `/api/sso/organization/members/${memberId}/companies`,
        method: 'POST',
        body: { companyId, roleId },
      }),
      invalidatesTags: ['OrganizationMembers', 'Organization', 'User'],
    }),

    // PUT /api/sso/organization/members/{memberId}/companies/{companyId}/role
    updateMemberCompanyRole: builder.mutation({
      query: ({ memberId, companyId, roleId }) => ({
        url: `/api/sso/organization/members/${memberId}/companies/${companyId}/role`,
        method: 'PUT',
        body: { data: { roleId } },
      }),
      invalidatesTags: ['OrganizationMembers', 'Organization', 'User'],
    }),

    // DELETE /api/sso/organization/members/{memberId}/companies/{companyId}
    revokeMemberCompanyAccess: builder.mutation({
      query: ({ memberId, companyId }) => ({
        url: `/api/sso/organization/members/${memberId}/companies/${companyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OrganizationMembers', 'Organization', 'User'],
    }),

  }),
});

export const {
  useGetOrganizationsQuery,
  useGetOrganizationByIdQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useUpdateOrganizationStatusMutation,
  useGetOrganizationMembersQuery,
  useGetOrganizationCompaniesQuery,
  useGetOrganizationSubscriptionQuery,
  useGetOrganizationPaymentsQuery,
  useGetOrganizationInvoicesQuery,
  useGetOrganizationModulesQuery,
  useGetOrganizationRolesQuery,
  useGetOrganizationAuditLogsQuery,
  useGetSystemAdminDashboardOverviewQuery,
  useGetPlatformAuditLogsQuery,
  useGetPlatformAdminsQuery,
  useCreatePlatformAdminMutation,
  useUpdatePlatformAdminStatusMutation,
  useUpdatePlatformAdminRoleMutation,
  useGetSupportSessionsQuery,
  useCreateSupportSessionMutation,
  useRevokeSupportSessionMutation,
  useMutateSupportSessionMutation,
  useAddOrganizationMemberMutation,
  useAssignModuleToOrganizationMutation,
  useGetOrgMembersQuery,
  useGetMemberCompanyAccessQuery,
  useGetUserCompanyAccessQuery,
  useGrantMemberCompanyAccessMutation,
  useUpdateMemberCompanyRoleMutation,
  useRevokeMemberCompanyAccessMutation,
} = organizationApiSlice;

export const grantMemberCompanyAccess = async (targetId, companyId, roleId, isUserId = false) => {
  const path = isUserId
    ? `/api/sso/organization/members/user/${targetId}/companies`
    : `/api/sso/organization/members/${targetId}/companies`;
  const res = await apiClient.post(path, { companyId, roleId });
  return res.data;
};

export const updateMemberCompanyRole = async (targetId, companyId, roleId, isUserId = false) => {
  const path = isUserId
    ? `/api/sso/organization/members/user/${targetId}/companies/${companyId}/role`
    : `/api/sso/organization/members/${targetId}/companies/${companyId}/role`;
  const res = await apiClient.put(path, { data: { roleId } });
  return res.data;
};

export const revokeMemberCompanyAccess = async (targetId, companyId, isUserId = false) => {
  const path = isUserId
    ? `/api/sso/organization/members/user/${targetId}/companies/${companyId}`
    : `/api/sso/organization/members/${targetId}/companies/${companyId}`;
  const res = await apiClient.delete(path);
  return res.data;
};

export const getUserCompanyAccess = async (userId) => {
  const res = await apiClient.get(`/api/sso/organization/members/user/${userId}/companies/access`);
  return res.data?.data || res.data || [];
};

export const getMemberCompanyAccess = async (memberId) => {
  const res = await apiClient.get(`/api/sso/organization/members/${memberId}/companies/access`);
  return res.data?.data || res.data || [];
};
