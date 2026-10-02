import { baseApi } from '../common/baseApi'

export const budgetingApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Budget Headers  /api/account/budget-headers
    getBudgetHeaders: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/budget-headers',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Budgeting'],
    }),
    getBudgetHeaderById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/budget-headers/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Budgeting'],
    }),
    createBudgetHeader: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: '/api/account/budget-headers',
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Budgeting'],
    }),
    updateBudgetHeader: builder.mutation({
      query: (payload) => { const { id, companyId, ...data } = payload; return {
        url: `/api/account/budget-headers/${id}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Budgeting'],
    }),
    deleteBudgetHeader: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/budget-headers/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Budgeting'],
    }),
    getBudgetHeaderLines: builder.query({
      query: ({ budgetHeaderId, companyId }) => ({
        url: `/api/account/budget-headers/${budgetHeaderId}/lines`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Budgeting'],
    }),
    addBudgetHeaderLine: builder.mutation({
      query: (payload) => { const { budgetHeaderId, companyId, ...data } = payload; return {
        url: `/api/account/budget-headers/${budgetHeaderId}/lines`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Budgeting'],
    }),
    updateBudgetHeaderLine: builder.mutation({
      query: (payload) => { const { lineId, companyId, ...data } = payload; return {
        url: `/api/account/budget-headers/lines/${lineId}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Budgeting'],
    }),
    deleteBudgetHeaderLine: builder.mutation({
      query: ({ lineId, companyId }) => ({
        url: `/api/account/budget-headers/lines/${lineId}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Budgeting'],
    }),

    // Budget Lines  /api/account/budget-lines
    getBudgetLines: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/budget-lines',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Budgeting'],
    }),
    getBudgetLineById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/budget-lines/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Budgeting'],
    }),
    createBudgetLine: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: '/api/account/budget-lines',
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Budgeting'],
    }),
    updateBudgetLine: builder.mutation({
      query: (payload) => { const { id, companyId, ...data } = payload; return {
        url: `/api/account/budget-lines/${id}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data,
      }; },
      invalidatesTags: ['Budgeting'],
    }),
    deleteBudgetLine: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/budget-lines/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Budgeting'],
    }),
    refreshBudgetLineUtilization: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/budget-lines/${id}/utilization`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Budgeting'],
    }),
    getBudgetLinesSummary: builder.query({
      query: (companyId) => ({
        url: '/api/account/budget-lines/summary',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Budgeting'],
    }),
    getBudgetLinesVarianceReport: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/budget-lines/variance-report',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Budgeting'],
    }),
    getBudgetLinesByHeader: builder.query({
      query: ({ budgetHeaderId, companyId, ...params }) => ({
        url: `/api/account/budget-headers/${budgetHeaderId}/lines`,
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Budgeting'],
    }),
    getBudgetLinesByAccount: builder.query({
      query: ({ accountId, companyId, ...params }) => ({
        url: `/api/account/budget-lines/account/${accountId}`,
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Budgeting'],
    }),
  }),
})

export const {
  useGetBudgetHeadersQuery,
  useGetBudgetHeaderByIdQuery,
  useCreateBudgetHeaderMutation,
  useUpdateBudgetHeaderMutation,
  useDeleteBudgetHeaderMutation,
  useGetBudgetHeaderLinesQuery,
  useAddBudgetHeaderLineMutation,
  useUpdateBudgetHeaderLineMutation,
  useDeleteBudgetHeaderLineMutation,
  useGetBudgetLinesQuery,
  useGetBudgetLineByIdQuery,
  useCreateBudgetLineMutation,
  useUpdateBudgetLineMutation,
  useDeleteBudgetLineMutation,
  useRefreshBudgetLineUtilizationMutation,
  useGetBudgetLinesSummaryQuery,
  useGetBudgetLinesVarianceReportQuery,
  useGetBudgetLinesByHeaderQuery,
  useGetBudgetLinesByAccountQuery,
} = budgetingApiSlice

