import { baseApi } from '../common/baseApi'

const cleanChartOfAccountPayload = (payload = {}) => {
  const {
    id,
    company,
    group,
    parentAccount,
    groupName,
    parentAccountCode,
    deleted,
    isDeleted,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    ...rest
  } = payload;

  const data = { ...rest };
  Object.keys(data).forEach((key) => {
    if (data[key] === '' || data[key] === null || data[key] === undefined) {
      delete data[key];
    }
  });

  if (data.openingBalance !== undefined) {
    data.openingBalance = Number(data.openingBalance) || 0;
  }

  return data;
};

export const accountingApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // GL Journals  /api/account/gl/journals
    getJournals: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/gl/journals',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Accounting'],
    }),
    getJournalById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/gl/journals/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Accounting'],
    }),
    createJournal: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: '/api/account/gl/journals',
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Accounting'],
    }),
    updateJournal: builder.mutation({
      query: (payload) => { const { id, companyId, ...data } = payload; return {
        url: `/api/account/gl/journals/${id}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Accounting'],
    }),
    deleteJournal: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/gl/journals/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),
    reverseJournal: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/gl/journals/${id}/reverse`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),
    postJournal: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/gl/journals/${id}/post`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),
    cancelJournal: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/gl/journals/${id}/cancel`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),
    getTrialBalance: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/gl/journals/trial-balance',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Accounting'],
    }),
    getProfitLoss: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/gl/journals/profit-loss',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Accounting'],
    }),
    getGeneralLedger: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/gl/journals/general-ledger',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Accounting'],
    }),
    getBalanceSheet: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/gl/journals/balance-sheet',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Accounting'],
    }),

    // GL Journal Lines  /api/account/gl/journal-lines
    getJournalLines: builder.query({
      query: ({ companyId, journalId, ...params }) => ({
        url: '/api/account/gl/journal-lines',
        params: { journalId, ...params },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Accounting'],
    }),
    getJournalLineById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/gl/journal-lines/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Accounting'],
    }),
    createJournalLine: builder.mutation({
      query: (payload) => { const { companyId, journalId, ...data } = payload; return {
        url: '/api/account/gl/journal-lines',
        method: 'POST',
        params: journalId ? { journalId } : undefined,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Accounting'],
    }),
    updateJournalLine: builder.mutation({
      query: (payload) => { const { id, companyId, ...data } = payload; return {
        url: `/api/account/gl/journal-lines/${id}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Accounting'],
    }),
    deleteJournalLine: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/gl/journal-lines/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),
    getJournalLinesByAccount: builder.query({
      query: ({ accountId, companyId, ...params }) => ({
        url: `/api/account/gl/journal-lines/account/${accountId}`,
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Accounting'],
    }),
    getJournalLinesByJournal: builder.query({
      query: ({ journalId, companyId, ...params }) => ({
        url: `/api/account/gl/journal-lines/journal/${journalId}`,
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Accounting'],
    }),
    getJournalLinesLedger: builder.query({
      query: ({ accountId, companyId, ...params }) => ({
        url: `/api/account/gl/journal-lines/ledger/${accountId}`,
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Accounting'],
    }),

    // Account Categories  /api/account/account-categories
    getAccountCategories: builder.query({
      query: (arg) => {
        if (typeof arg === 'string') {
          return {
            url: '/api/account/account-categories',
            headers: { 'X-Company-Id': arg }
          };
        }
        const { companyId, ...params } = arg;
        return {
          url: '/api/account/account-categories',
          params,
          headers: { 'X-Company-Id': companyId }
        };
      },
      providesTags: ['Accounting'],
    }),
    getAccountCategoryById: builder.query({
      query: (id) => {
        const extractedId = typeof id === 'object' ? id.id || id.id : id;
        const companyId = typeof id === 'object' ? id.companyId : undefined;
        return {
          url: typeof id === 'object' && id.url ? id.url : `/api/account/account-categories/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Accounting'],
    }),
    createAccountCategory: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: `/api/account/account-categories`,
        method: 'POST',
        headers: { 'X-Company-Id': companyId },
        data,
      }; },
      invalidatesTags: ['Accounting'],
    }),
    updateAccountCategory: builder.mutation({
      query: (payload) => { const { id, companyId, ...data } = payload; return {
        url: `/api/account/account-categories/${id}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Accounting'],
    }),
    deleteAccountCategory: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/account-categories/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),
    softDeleteAccountCategory: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/account-categories/${id}`,
        method: 'PATCH',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),

    // Account Groups  /api/account/account-groups
    getAccountGroups: builder.query({
      query: (arg = {}) => {
        if (typeof arg === 'string') {
          return {
            url: '/api/account/account-groups',
            params: { companyId: arg },
            headers: { 'X-Company-Id': arg }
          };
        }
        return {
          url: '/api/account/account-groups',
          params: arg || {},
          headers: arg?.companyId ? { 'X-Company-Id': arg.companyId } : undefined
        };
      },
      providesTags: ['Accounting'],
    }),
    getAccountGroupById: builder.query({
      query: (id) => {
        const extractedId = typeof id === 'object' ? id.id || id.id : id;
        const companyId = typeof id === 'object' ? id.companyId : undefined;
        return {
          url: typeof id === 'object' && id.url ? id.url : `/api/account/account-groups/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Accounting'],
    }),
    createAccountGroup: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: `/api/account/account-groups`,
        method: 'POST',
        headers: { 'X-Company-Id': companyId },
        data: { data },
      }; },
      invalidatesTags: ['Accounting'],
    }),
    updateAccountGroup: builder.mutation({
      query: (payload) => { const { id, companyId, ...data } = payload; return {
        url: `/api/account/account-groups/${id}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data: { data },
      }; },
      invalidatesTags: ['Accounting'],
    }),
    deleteAccountGroup: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/account-groups/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),
    restoreAccountGroup: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/account-groups/${id}/restore`,
        method: 'PATCH',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),

    // GST Slabs /api/account/gst-slabs
    getGstSlabs: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: '/api/account/gst-slabs',
          params,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Accounting'],
    }),
    getGstSlabById: builder.query({
      query: ({ gstSlabId, companyId }) => ({
        url: `/api/account/gst-slabs/${gstSlabId}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Accounting'],
    }),
    createGstSlab: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: '/api/account/gst-slabs',
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Accounting'],
    }),
    updateGstSlab: builder.mutation({
      query: (payload) => { const { gstSlabId, companyId, ...data } = payload; return {
        url: `/api/account/gst-slabs/${gstSlabId}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Accounting'],
    }),
    deleteGstSlab: builder.mutation({
      query: ({ gstSlabId, companyId }) => ({
        url: `/api/account/gst-slabs/${gstSlabId}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),

    // HSN/SAC Master /api/account/hsn-sac
    getHsnSacs: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: '/api/account/hsn-sac',
          params,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Accounting'],
    }),
    getHsnSacById: builder.query({
      query: ({ hsnSacId, companyId }) => ({
        url: `/api/account/hsn-sac/${hsnSacId}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Accounting'],
    }),
    createHsnSac: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: '/api/account/hsn-sac',
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Accounting'],
    }),
    updateHsnSac: builder.mutation({
      query: (payload) => { const { hsnSacId, companyId, ...data } = payload; return {
        url: `/api/account/hsn-sac/${hsnSacId}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Accounting'],
    }),
    deleteHsnSac: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/hsn-sac/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),

    // Chart of Accounts
    getChartOfAccounts: builder.query({
      query: (arg = {}) => {
        const params = typeof arg === 'string' ? { companyId: arg } : { ...(arg || {}) };
        return {
          url: '/api/account/chart-of-accounts',
          params,
          headers: params?.companyId ? { 'X-Company-Id': params.companyId } : undefined,
        };
      },
      providesTags: ['Accounting'],
    }),
    getChartOfAccountById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/chart-of-accounts/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Accounting'],
    }),
    createChartOfAccount: builder.mutation({
      query: (payload) => { const data = cleanChartOfAccountPayload(payload); return {
        url: '/api/account/chart-of-accounts',
        method: 'POST',
        params: payload.companyId ? { companyId: payload.companyId } : undefined,
        headers: payload.companyId ? { 'X-Company-Id': payload.companyId } : undefined,
        data: { data },
      }; },
      invalidatesTags: ['Accounting'],
    }),
    updateChartOfAccount: builder.mutation({
      query: (payload) => { const { id } = payload; const data = cleanChartOfAccountPayload(payload); return {
        url: `/api/account/chart-of-accounts/${id}`,
        method: 'PUT',
        params: payload.companyId ? { companyId: payload.companyId } : undefined,
        headers: payload.companyId ? { 'X-Company-Id': payload.companyId } : undefined,
        data: { data },
      }; },
      invalidatesTags: ['Accounting'],
    }),
    deleteChartOfAccount: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/chart-of-accounts/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),

    // GST State Master
    getGstStates: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : (arg || {});
        return {
          url: '/api/account/gst/master/states',
          params,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Accounting'],
    }),
    getGstStateById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/gst/master/states/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Accounting'],
    }),
    createGstState: builder.mutation({
      query: (payload) => { 
        const { companyId, ...data } = payload; 
        return {
          url: '/api/account/gst/master/states',
          method: 'POST',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        }; 
      },
      invalidatesTags: ['Accounting'],
    }),
    updateGstState: builder.mutation({
      query: (payload) => { 
        const { id, companyId, ...data } = payload; 
        return {
          url: `/api/account/gst/master/states/${id}`,
          method: 'PUT',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        }; 
      },
      invalidatesTags: ['Accounting'],
    }),
    deleteGstState: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/gst/master/states/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Accounting'],
    }),

    // GST Registrations
    getGstRegistrations: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : (arg || {});
        let headers = undefined;
        try {
          const authUser = JSON.parse(localStorage.getItem('auth_user'));
          if (companyId && authUser?.roles?.includes('SYSTEM_ADMIN')) {
            headers = { 'X-Company-Id': companyId };
          }
        } catch (e) {}
        
        return {
          url: '/api/account/gst/master/registrations/company',
          params: { companyId, ...params },
          headers,
        };
      },
      providesTags: ['Accounting'],
    }),
    getGstRegistrationById: builder.query({
      query: (id) => ({
        url: `/api/account/gst/master/registrations/${id}`,
      }),
      providesTags: ['Accounting'],
    }),
    createGstRegistration: builder.mutation({
      query: (payload) => { 
        const { companyId, ...data } = payload; 
        let headers = undefined;
        try {
          const authUser = JSON.parse(localStorage.getItem('auth_user'));
          if (companyId && authUser?.roles?.includes('SYSTEM_ADMIN')) {
            headers = { 'X-Company-Id': companyId };
          }
        } catch (e) {}
        
        return {
          url: '/api/account/gst/master/registrations',
          method: 'POST',
          params: companyId ? { companyId } : undefined,
          headers,
          data: { data },
        }; 
      },
      invalidatesTags: ['Accounting'],
    }),
    updateGstRegistration: builder.mutation({
      query: (payload) => { 
        const { id, companyId, ...data } = payload; 
        let headers = undefined;
        try {
          const authUser = JSON.parse(localStorage.getItem('auth_user'));
          if (companyId && authUser?.roles?.includes('SYSTEM_ADMIN')) {
            headers = { 'X-Company-Id': companyId };
          }
        } catch (e) {}
        
        return {
          url: `/api/account/gst/master/registrations/${id}`,
          method: 'PUT',
          params: companyId ? { companyId } : undefined,
          headers,
          data: { data },
        }; 
      },
      invalidatesTags: ['Accounting'],
    }),
    deleteGstRegistration: builder.mutation({
      query: ({ id, companyId }) => {
        let headers = undefined;
        try {
          const authUser = JSON.parse(localStorage.getItem('auth_user'));
          if (companyId && authUser?.roles?.includes('SYSTEM_ADMIN')) {
            headers = { 'X-Company-Id': companyId };
          }
        } catch (e) {}
        
        return {
          url: `/api/account/gst/master/registrations/${id}`,
          method: 'DELETE',
          headers,
        };
      },
      invalidatesTags: ['Accounting'],
    }),
  }),
})

export const {
  useGetJournalsQuery,
  useGetJournalByIdQuery,
  useCreateJournalMutation,
  useUpdateJournalMutation,
  useDeleteJournalMutation,
  useReverseJournalMutation,
  usePostJournalMutation,
  useCancelJournalMutation,
  useGetTrialBalanceQuery,
  useGetProfitLossQuery,
  useGetGeneralLedgerQuery,
  useGetBalanceSheetQuery,
  useGetJournalLinesQuery,
  useGetJournalLineByIdQuery,
  useCreateJournalLineMutation,
  useUpdateJournalLineMutation,
  useDeleteJournalLineMutation,
  useGetJournalLinesByAccountQuery,
  useGetJournalLinesByJournalQuery,
  useGetJournalLinesLedgerQuery,
  useGetAccountCategoriesQuery,
  useGetAccountCategoryByIdQuery,
  useCreateAccountCategoryMutation,
  useUpdateAccountCategoryMutation,
  useDeleteAccountCategoryMutation,
  useSoftDeleteAccountCategoryMutation,
  useGetAccountGroupsQuery,
  useGetAccountGroupByIdQuery,
  useCreateAccountGroupMutation,
  useUpdateAccountGroupMutation,
  useDeleteAccountGroupMutation,
  useRestoreAccountGroupMutation,
  useGetGstSlabsQuery,
  useGetGstSlabByIdQuery,
  useCreateGstSlabMutation,
  useUpdateGstSlabMutation,
  useDeleteGstSlabMutation,
  useGetHsnSacsQuery,
  useGetHsnSacByIdQuery,
  useCreateHsnSacMutation,
  useUpdateHsnSacMutation,
  useDeleteHsnSacMutation,
  useGetChartOfAccountsQuery,
  useGetChartOfAccountByIdQuery,
  useCreateChartOfAccountMutation,
  useUpdateChartOfAccountMutation,
  useDeleteChartOfAccountMutation,
  useGetGstStatesQuery,
  useGetGstStateByIdQuery,
  useCreateGstStateMutation,
  useUpdateGstStateMutation,
  useDeleteGstStateMutation,
  useGetGstRegistrationsQuery,
  useGetGstRegistrationByIdQuery,
  useCreateGstRegistrationMutation,
  useUpdateGstRegistrationMutation,
  useDeleteGstRegistrationMutation,
} = accountingApiSlice

