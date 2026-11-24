import { baseApi } from '../common/baseApi';

export const crmApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // -------------------------------------------------------------------------
    // 1. Leads Management (/api/crm/leads)
    // -------------------------------------------------------------------------
    getLeads: builder.query({
      query: (arg) => {
        const params = typeof arg === 'object' ? arg : {};
        const companyId = params.companyId;
        return {
          url: '/api/crm/leads',
          params,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['CRM_LEADS'],
    }),

    getLeadById: builder.query({
      query: (arg) => {
        const id = typeof arg === 'object' && arg !== null ? arg.id : arg;
        const companyId = typeof arg === 'object' && arg !== null ? arg.companyId : undefined;
        return {
          url: `/api/crm/leads/${id}`,
          params: companyId ? { companyId } : undefined,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: (result, error, arg) => {
        const id = typeof arg === 'object' && arg !== null ? arg.id : arg;
        return [{ type: 'CRM_LEADS', id }];
      },
    }),

    createLead: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/leads',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_LEADS', 'CRM_DASHBOARD'],
    }),

    updateLead: builder.mutation({
      query: ({ id, data, companyId }) => ({
        url: `/api/crm/leads/${id}`,
        method: 'PUT',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'CRM_LEADS', id }, 'CRM_LEADS'],
    }),

    updateLeadStatus: builder.mutation({
      query: ({ id, statusId, reasonId, notes, companyId }) => ({
        url: `/api/crm/leads/${id}/status`,
        method: 'PATCH',
        data: { data: { statusId, reasonId, notes } },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'CRM_LEADS', id }, 'CRM_LEADS', 'CRM_DASHBOARD'],
    }),

    assignLead: builder.mutation({
      query: ({ id, targetUserId, reason, companyId }) => ({
        url: `/api/crm/leads/${id}/assign`,
        method: 'POST',
        data: { data: { targetUserId, reason } },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'CRM_LEADS', id }, 'CRM_LEADS'],
    }),

    mergeLeads: builder.mutation({
      query: ({ primaryLeadId, duplicateLeadIds, mergeReason, companyId }) => ({
        url: '/api/crm/leads/merge',
        method: 'POST',
        data: { data: { primaryLeadId, duplicateLeadIds, mergeReason } },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_LEADS'],
    }),

    convertLead: builder.mutation({
      query: ({ id, data, companyId }) => ({
        url: `/api/crm/leads/${id}/convert`,
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_LEADS', 'CRM_ACCOUNTS', 'CRM_OPPORTUNITIES', 'CRM_DASHBOARD'],
    }),

    deleteLead: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/leads/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_LEADS', 'CRM_DASHBOARD'],
    }),

    importLeadsCsv: builder.mutation({
      query: ({ formData, companyId }) => ({
        url: '/api/crm/leads/import',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(companyId ? { 'X-Company-Id': companyId } : {}),
        },
      }),
      invalidatesTags: ['CRM_LEADS', 'CRM_IMPORT_BATCHES'],
    }),

    getLeadImportBatches: builder.query({
      query: (companyId) => ({
        url: '/api/crm/leads/import/batches',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_IMPORT_BATCHES'],
    }),

    // -------------------------------------------------------------------------
    // 2. Accounts & Contacts (/api/crm/accounts, /api/crm/contacts)
    // -------------------------------------------------------------------------
    getCrmAccounts: builder.query({
      query: (params) => ({
        url: '/api/crm/accounts',
        params,
        headers: params?.companyId ? { 'X-Company-Id': params.companyId } : undefined,
      }),
      providesTags: ['CRM_ACCOUNTS'],
    }),

    createCrmAccount: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/accounts',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_ACCOUNTS'],
    }),

    getCrmAccountById: builder.query({
      query: (arg) => {
        const id = typeof arg === 'object' && arg !== null ? arg.id : arg;
        const companyId = typeof arg === 'object' && arg !== null ? arg.companyId : undefined;
        return {
          url: `/api/crm/accounts/${id}`,
          params: companyId ? { companyId } : undefined,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: (result, error, arg) => {
        const id = typeof arg === 'object' && arg !== null ? arg.id : arg;
        return [{ type: 'CRM_ACCOUNTS', id }];
      },
    }),

    onboardAccountToErp: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/accounts/${id}/onboard-erp`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'CRM_ACCOUNTS', id }],
    }),

    getCrmContacts: builder.query({
      query: (params) => ({
        url: '/api/crm/contacts',
        params,
        headers: params?.companyId ? { 'X-Company-Id': params.companyId } : undefined,
      }),
      providesTags: ['CRM_CONTACTS'],
    }),

    createCrmContact: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/contacts',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_CONTACTS'],
    }),

    updateCrmContact: builder.mutation({
      query: ({ id, data, companyId }) => ({
        url: `/api/crm/contacts/${id}`,
        method: 'PUT',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_CONTACTS'],
    }),

    deleteCrmContact: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/contacts/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_CONTACTS'],
    }),

    // -------------------------------------------------------------------------
    // 3. Pipelines, Kanban & Deals (/api/crm/opportunities)
    // -------------------------------------------------------------------------
    getCrmKanban: builder.query({
      query: ({ pipelineId, companyId }) => ({
        url: '/api/crm/opportunities/kanban',
        params: { pipelineId },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_OPPORTUNITIES'],
    }),

    getCrmOpportunities: builder.query({
      query: (params) => ({
        url: '/api/crm/opportunities',
        params,
        headers: params?.companyId ? { 'X-Company-Id': params.companyId } : undefined,
      }),
      providesTags: ['CRM_OPPORTUNITIES'],
    }),

    createCrmOpportunity: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/opportunities',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_OPPORTUNITIES', 'CRM_DASHBOARD'],
    }),

    updateOpportunityStage: builder.mutation({
      query: (arg) => {
        const id = arg?.id;
        const targetStageId = arg?.targetStageId || arg?.stageId || arg?.data?.targetStageId || arg?.data?.stageId;
        const reason = arg?.reason || arg?.data?.reason;
        const companyId = arg?.companyId;
        return {
          url: `/api/crm/opportunities/${id}/stage`,
          method: 'PATCH',
          data: { data: { targetStageId, reason } },
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      invalidatesTags: ['CRM_OPPORTUNITIES', 'CRM_DASHBOARD'],
    }),

    closeOpportunity: builder.mutation({
      query: ({ id, data, companyId }) => ({
        url: `/api/crm/opportunities/${id}/close`,
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_OPPORTUNITIES', 'CRM_DASHBOARD'],
    }),

    // Pipelines (/api/crm/pipelines)
    getCrmPipelines: builder.query({
      query: (companyId) => ({
        url: '/api/crm/pipelines',
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_OPPORTUNITIES'],
    }),

    getCrmPipelineById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/crm/pipelines/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: (result, error, { id }) => [{ type: 'CRM_OPPORTUNITIES', id }],
    }),

    createCrmPipeline: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/pipelines',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_OPPORTUNITIES'],
    }),

    // -------------------------------------------------------------------------
    // 4. Quotations (/api/crm/quotations)
    // -------------------------------------------------------------------------
    getCrmQuotations: builder.query({
      query: (params) => ({
        url: '/api/crm/quotations',
        params,
        headers: params?.companyId ? { 'X-Company-Id': params.companyId } : undefined,
      }),
      providesTags: ['CRM_QUOTATIONS'],
    }),

    getCrmQuotationById: builder.query({
      query: (arg) => {
        const id = typeof arg === 'object' && arg !== null ? arg.id : arg;
        const companyId = typeof arg === 'object' && arg !== null ? arg.companyId : undefined;
        return {
          url: `/api/crm/quotations/${id}`,
          params: companyId ? { companyId } : undefined,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: (result, error, arg) => {
        const id = typeof arg === 'object' && arg !== null ? arg.id : arg;
        return [{ type: 'CRM_QUOTATIONS', id }];
      },
    }),

    createCrmQuotation: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/quotations',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_QUOTATIONS'],
    }),

    submitQuotationApproval: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/quotations/${id}/submit-approval`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_QUOTATIONS'],
    }),

    approveCrmQuotation: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/quotations/${id}/approve`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_QUOTATIONS', 'CRM_DASHBOARD'],
    }),

    rejectCrmQuotation: builder.mutation({
      query: ({ id, companyId, reason }) => ({
        url: `/api/crm/quotations/${id}/reject`,
        method: 'POST',
        params: reason ? { reason } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_QUOTATIONS', 'CRM_DASHBOARD'],
    }),

    convertQuotationToOrder: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/quotations/${id}/convert-to-sales-order`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_QUOTATIONS', 'CRM_OPPORTUNITIES'],
    }),

    // -------------------------------------------------------------------------
    // 5. Tasks & Activities (/api/crm/tasks, /api/crm/activities)
    // -------------------------------------------------------------------------
    getCrmTasks: builder.query({
      query: (params) => ({
        url: '/api/crm/tasks',
        params,
        headers: params?.companyId ? { 'X-Company-Id': params.companyId } : undefined,
      }),
      providesTags: ['CRM_TASKS'],
    }),

    createCrmTask: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/tasks',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_TASKS'],
    }),

    completeCrmTask: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/tasks/${id}/complete`,
        method: 'PATCH',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_TASKS'],
    }),

    getCrmActivities: builder.query({
      query: ({ entityType, entityId, activityType, companyId } = {}) => ({
        url: '/api/crm/activities',
        params: {
          entityType: entityType || undefined,
          entityId: entityId || undefined,
          activityType: activityType || undefined,
          companyId: companyId || undefined,
        },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_ACTIVITIES'],
    }),

    logCrmActivity: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/activities',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_ACTIVITIES'],
    }),

    // -------------------------------------------------------------------------
    // 5b. Omnichannel Communications (/api/crm/communication)
    // -------------------------------------------------------------------------
    sendCrmMessage: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/communication/send',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_COMMUNICATIONS'],
    }),

    getCrmConversationMessages: builder.query({
      query: ({ conversationId, entityType, entityId, companyId } = {}) => ({
        url: '/api/crm/communication/messages',
        params: {
          conversationId: conversationId || undefined,
          entityType: entityType || undefined,
          entityId: entityId || undefined,
          companyId: companyId || undefined,
        },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_COMMUNICATIONS'],
    }),

    logCrmCall: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/communication/telephony/cdr',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_COMMUNICATIONS', 'CRM_ACTIVITIES'],
    }),

    getCrmCalls: builder.query({
      query: ({ entityType, entityId, companyId } = {}) => ({
        url: '/api/crm/communication/calls',
        params: {
          entityType: entityType || undefined,
          entityId: entityId || undefined,
          companyId: companyId || undefined,
        },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_COMMUNICATIONS'],
    }),

    // -------------------------------------------------------------------------
    // 6. Automation & Round Robin (/api/crm/automation)
    // -------------------------------------------------------------------------
    getCrmAutomationRules: builder.query({
      query: (companyId) => ({
        url: '/api/crm/automation/rules',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_AUTOMATION_RULES'],
    }),

    createCrmAutomationRule: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/automation/rules',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_AUTOMATION_RULES'],
    }),

    updateCrmAutomationRule: builder.mutation({
      query: ({ id, data, companyId }) => ({
        url: `/api/crm/automation/rules/${id}`,
        method: 'PUT',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_AUTOMATION_RULES'],
    }),

    deleteCrmAutomationRule: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/automation/rules/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_AUTOMATION_RULES'],
    }),

    getCrmRoundRobinPools: builder.query({
      query: (companyId) => ({
        url: '/api/crm/automation/round-robin-pools',
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_ROUND_ROBIN'],
    }),

    createCrmRoundRobinPool: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/automation/round-robin-pools',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_ROUND_ROBIN'],
    }),

    getCrmAutomationLogs: builder.query({
      query: (params) => ({
        url: '/api/crm/automation/logs',
        params,
        headers: params?.companyId ? { 'X-Company-Id': params.companyId } : undefined,
      }),
      providesTags: ['CRM_AUTOMATION_LOGS'],
    }),

    // -------------------------------------------------------------------------
    // 7. Campaigns & Attribution (/api/crm/campaigns)
    // -------------------------------------------------------------------------
    getCrmCampaigns: builder.query({
      query: (params) => ({
        url: '/api/crm/campaigns',
        params,
        headers: params?.companyId ? { 'X-Company-Id': params.companyId } : undefined,
      }),
      providesTags: ['CRM_CAMPAIGNS'],
    }),

    createCrmCampaign: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/campaigns',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_CAMPAIGNS'],
    }),

    getCrmCampaignPerformance: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/crm/campaigns/${id}/performance`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: (result, error, { id }) => [{ type: 'CRM_CAMPAIGNS', id }],
    }),

    getCrmCampaignAttribution: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/crm/campaigns/${id}/attribution`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: (result, error, { id }) => [{ type: 'CRM_CAMPAIGNS', id }],
    }),

    getCrmMultiTouchAttribution: builder.query({
      query: (params = {}) => {
        const { companyId, model } = params || {};
        return {
          url: '/api/crm/campaigns/attribution/overview',
          params: {
            ...(companyId ? { companyId } : {}),
            ...(model ? { model } : {}),
          },
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['CRM_CAMPAIGNS'],
    }),

    // -------------------------------------------------------------------------
    // 8. Integrations (/api/crm/integrations & /api/admin/integrations)
    // -------------------------------------------------------------------------
    getCrmAvailableProviders: builder.query({
      query: () => ({
        url: '/api/crm/integrations/available',
      }),
      providesTags: ['CRM_INTEGRATION_PROVIDERS'],
    }),

    getCrmIntegrationChannels: builder.query({
      query: () => ({
        url: '/api/crm/integrations/channels',
      }),
      providesTags: ['CRM_INTEGRATIONS'],
    }),

    getCrmTenantIntegrations: builder.query({
      query: (companyId) => ({
        url: '/api/crm/integrations',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_INTEGRATIONS'],
    }),

    connectCrmTenantIntegration: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/integrations/connect',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_INTEGRATIONS'],
    }),

    createCrmTenantIntegration: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/integrations',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_INTEGRATIONS'],
    }),

    deleteCrmTenantIntegration: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/integrations/${id}`,
        method: 'DELETE',
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_INTEGRATIONS'],
    }),

    disconnectCrmTenantIntegration: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/integrations/${id}`,
        method: 'DELETE',
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_INTEGRATIONS'],
    }),

    batchDeleteCrmTenantIntegrations: builder.mutation({
      query: ({ ids, companyId }) => ({
        url: '/api/crm/integrations/batch-delete',
        method: 'POST',
        data: { data: ids },
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_INTEGRATIONS'],
    }),

    testCrmIntegrationConnection: builder.mutation({
      query: (data) => ({
        url: '/api/crm/integrations/test-connection',
        method: 'POST',
        data: { data },
      }),
    }),

    getFacebookOAuthAuthorizeUrl: builder.query({
      query: (params) => {
        const queryParams = typeof params === 'object' ? { ...params } : {};
        const companyId = queryParams.companyId;
        return {
          url: '/api/crm/integrations/oauth/FACEBOOK/authorize',
          params: queryParams,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      transformResponse: (response) => {
        // Handle unwrapped ApiResponse, nested data, or direct { authorizeUrl }
        return response?.data || response;
      },
    }),

    handleFacebookOAuthCallback: builder.mutation({
      query: (data) => ({
        url: '/api/crm/integrations/oauth/FACEBOOK/callback',
        method: 'POST',
        data: { data },
      }),
    }),

    triggerCrmIntegrationSync: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/integrations/${id}/sync`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_INTEGRATIONS'],
    }),

    getAdminIntegrationProviders: builder.query({
      query: () => ({
        url: '/api/crm/integrations/providers',
      }),
      providesTags: ['ADMIN_INTEGRATION_PROVIDERS'],
    }),

    createAdminIntegrationProvider: builder.mutation({
      query: (data) => ({
        url: '/api/crm/integrations/providers',
        method: 'POST',
        data: { data },
      }),
      invalidatesTags: ['ADMIN_INTEGRATION_PROVIDERS', 'CRM_INTEGRATION_PROVIDERS'],
    }),

    updateAdminIntegrationProvider: builder.mutation({
      query: ({ code, data }) => ({
        url: `/api/crm/integrations/providers/${code}`,
        method: 'PUT',
        data: { data },
      }),
      invalidatesTags: ['ADMIN_INTEGRATION_PROVIDERS', 'CRM_INTEGRATION_PROVIDERS'],
    }),

    // -------------------------------------------------------------------------
    // 9. Dashboard & Settings (/api/crm/dashboard, /api/crm/settings)
    // -------------------------------------------------------------------------
    getCrmDashboardSummary: builder.query({
      query: (companyId) => ({
        url: '/api/crm/dashboard',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_DASHBOARD'],
    }),

    getCrmDashboard: builder.query({
      query: (companyId) => ({
        url: '/api/crm/dashboard',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_DASHBOARD'],
    }),

    getCrmCompanySettings: builder.query({
      query: (companyId) => ({
        url: '/api/crm/settings/company',
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_SETTINGS'],
    }),

    updateCrmCompanySettings: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/settings/company',
        method: 'PUT',
        data,
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_SETTINGS'],
    }),

    getCrmLeadStatuses: builder.query({
      query: (companyId) => ({
        url: '/api/crm/settings/lead-statuses',
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_SETTINGS'],
    }),

    getCrmLeadSources: builder.query({
      query: (companyId) => ({
        url: '/api/crm/settings/lead-sources',
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_SETTINGS'],
    }),

    getCrmLostReasons: builder.query({
      query: (companyId) => ({
        url: '/api/crm/settings/lost-reasons',
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_SETTINGS'],
    }),

    getCrmTags: builder.query({
      query: (companyId) => ({
        url: '/api/crm/settings/tags',
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_SETTINGS'],
    }),

    createCrmTag: builder.mutation({
      query: ({ tagName, colorCode, companyId }) => ({
        url: '/api/crm/settings/tags',
        method: 'POST',
        params: { tagName, colorCode, companyId },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_SETTINGS'],
    }),
  }),
});

export const {
  // Leads
  useGetLeadsQuery,
  useGetLeadByIdQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useUpdateLeadStatusMutation,
  useAssignLeadMutation,
  useMergeLeadsMutation,
  useConvertLeadMutation,
  useDeleteLeadMutation,
  useImportLeadsCsvMutation,
  useGetLeadImportBatchesQuery,

  // Accounts & Contacts
  useGetCrmAccountsQuery,
  useCreateCrmAccountMutation,
  useGetCrmAccountByIdQuery,
  useOnboardAccountToErpMutation,
  useGetCrmContactsQuery,
  useCreateCrmContactMutation,
  useUpdateCrmContactMutation,
  useDeleteCrmContactMutation,

  // Pipelines & Deals
  useGetCrmKanbanQuery,
  useGetCrmOpportunitiesQuery,
  useCreateCrmOpportunityMutation,
  useUpdateOpportunityStageMutation,
  useCloseOpportunityMutation,
  useGetCrmPipelinesQuery,
  useGetCrmPipelineByIdQuery,
  useCreateCrmPipelineMutation,

  // Quotations
  useGetCrmQuotationsQuery,
  useGetCrmQuotationByIdQuery,
  useCreateCrmQuotationMutation,
  useSubmitQuotationApprovalMutation,
  useApproveCrmQuotationMutation,
  useRejectCrmQuotationMutation,
  useConvertQuotationToOrderMutation,

  // Tasks & Activities
  useGetCrmTasksQuery,
  useCreateCrmTaskMutation,
  useCompleteCrmTaskMutation,
  useGetCrmActivitiesQuery,
  useLogCrmActivityMutation,

  // Communications
  useSendCrmMessageMutation,
  useGetCrmConversationMessagesQuery,
  useLogCrmCallMutation,
  useGetCrmCallsQuery,

  // Automation
  useGetCrmAutomationRulesQuery,
  useCreateCrmAutomationRuleMutation,
  useUpdateCrmAutomationRuleMutation,
  useDeleteCrmAutomationRuleMutation,
  useGetCrmRoundRobinPoolsQuery,
  useCreateCrmRoundRobinPoolMutation,
  useGetCrmAutomationLogsQuery,

  // Campaigns
  useGetCrmCampaignsQuery,
  useCreateCrmCampaignMutation,
  useGetCrmCampaignPerformanceQuery,
  useGetCrmCampaignAttributionQuery,
  useGetCrmMultiTouchAttributionQuery,

  // Integrations
  useGetCrmAvailableProvidersQuery,
  useGetCrmIntegrationChannelsQuery,
  useGetCrmTenantIntegrationsQuery,
  useConnectCrmTenantIntegrationMutation,
  useCreateCrmTenantIntegrationMutation,
  useDeleteCrmTenantIntegrationMutation,
  useDisconnectCrmTenantIntegrationMutation,
  useBatchDeleteCrmTenantIntegrationsMutation,
  useTestCrmIntegrationConnectionMutation,
  useGetFacebookOAuthAuthorizeUrlQuery,
  useLazyGetFacebookOAuthAuthorizeUrlQuery,
  useHandleFacebookOAuthCallbackMutation,
  useTriggerCrmIntegrationSyncMutation,
  useGetAdminIntegrationProvidersQuery,
  useCreateAdminIntegrationProviderMutation,
  useUpdateAdminIntegrationProviderMutation,

  // Dashboard & Settings
  useGetCrmDashboardQuery,
  useGetCrmDashboardSummaryQuery,
  useGetCrmCompanySettingsQuery,
  useUpdateCrmCompanySettingsMutation,
  useGetCrmLeadStatusesQuery,
  useGetCrmLeadSourcesQuery,
  useGetCrmLostReasonsQuery,
  useGetCrmTagsQuery,
  useCreateCrmTagMutation,
} = crmApiSlice;
