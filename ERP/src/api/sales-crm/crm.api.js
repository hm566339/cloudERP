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
      query: ({ id, companyId }) => ({
        url: `/api/crm/leads/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: (result, error, { id }) => [{ type: 'CRM_LEADS', id }],
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
      query: ({ id, companyId }) => ({
        url: `/api/crm/accounts/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: (result, error, { id }) => [{ type: 'CRM_ACCOUNTS', id }],
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
      query: ({ id, targetStageId, reason, companyId }) => ({
        url: `/api/crm/opportunities/${id}/stage`,
        method: 'PATCH',
        data: { data: { targetStageId, reason } },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
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
      query: ({ id, companyId }) => ({
        url: `/api/crm/quotations/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: (result, error, { id }) => [{ type: 'CRM_QUOTATIONS', id }],
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

    // -------------------------------------------------------------------------
    // 8. Integrations (/api/crm/integrations)
    // -------------------------------------------------------------------------
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

    createCrmTenantIntegration: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/integrations',
        method: 'POST',
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_INTEGRATIONS'],
    }),

    triggerCrmIntegrationSync: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/crm/integrations/${id}/sync`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_INTEGRATIONS'],
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
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_SETTINGS'],
    }),

    updateCrmCompanySettings: builder.mutation({
      query: ({ data, companyId }) => ({
        url: '/api/crm/settings/company',
        method: 'PUT',
        data,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['CRM_SETTINGS'],
    }),

    getCrmLeadStatuses: builder.query({
      query: (companyId) => ({
        url: '/api/crm/settings/lead-statuses',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_SETTINGS'],
    }),

    getCrmLeadSources: builder.query({
      query: (companyId) => ({
        url: '/api/crm/settings/lead-sources',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_SETTINGS'],
    }),

    getCrmLostReasons: builder.query({
      query: (companyId) => ({
        url: '/api/crm/settings/lost-reasons',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['CRM_SETTINGS'],
    }),

    getCrmTags: builder.query({
      query: (companyId) => ({
        url: '/api/crm/settings/tags',
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

  // Integrations
  useGetCrmIntegrationChannelsQuery,
  useGetCrmTenantIntegrationsQuery,
  useCreateCrmTenantIntegrationMutation,
  useTriggerCrmIntegrationSyncMutation,

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
