import { baseApi } from '../common/baseApi'

export const periodsApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Fiscal Years  /api/account/fiscal-years
    getFiscalYears: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/fiscal-years',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Periods'],
    }),
    getFiscalYearById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/fiscal-years/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Periods'],
    }),
    createFiscalYear: builder.mutation({
      query: (payload) => { const { companyId, ...payloadData } = payload; return {
        url: '/api/account/fiscal-years',
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data: { data: payloadData },
      }; },
      invalidatesTags: ['Periods'],
    }),
    updateFiscalYear: builder.mutation({
      query: (payload) => { const { id, companyId, ...payloadData } = payload; return {
        url: `/api/account/fiscal-years/${id}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data: { data: payloadData },
      }; },
      invalidatesTags: ['Periods'],
    }),
    deleteFiscalYear: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/fiscal-years/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Periods'],
    }),
    toggleFiscalYearStatus: builder.mutation({
      query: ({ id, companyId, status }) => ({
        url: `/api/account/fiscal-years/${id}/status`,
        method: 'PATCH',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        params: { status },
      }),
      invalidatesTags: ['Periods'],
    }),

    // Accounting Periods  /api/account/accounting-periods
    getAccountingPeriods: builder.query({
      query: (arg) => {
        if (typeof arg === 'string') {
          return {
            url: `/api/account/accounting-periods/fiscal-years/${arg}`,
            headers: {}
          };
        }
        const { fiscalYearId, companyId, ...params } = arg;
        return {
          url: `/api/account/accounting-periods/fiscal-years/${fiscalYearId}`,
          params,
          headers: companyId ? { 'X-Company-Id': companyId } : {}
        };
      },
      providesTags: ['Periods'],
    }),
    getAccountingPeriodById: builder.query({
      query: (id) => {
        const extractedId = typeof id === 'object' ? id.id || id.id : id;
        const companyId = typeof id === 'object' ? id.companyId : undefined;
        return {
          url: typeof id === 'object' && id.url ? id.url : `/api/account/accounting-periods/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Periods'],
    }),
    createAccountingPeriod: builder.mutation({
      query: (payload) => { const { fiscalYearId, companyId, ...payloadData } = payload; return {
        url: `/api/account/accounting-periods/${fiscalYearId}`,
        method: 'POST',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data: { data: payloadData },
      }; },
      invalidatesTags: ['Periods'],
    }),
    updateAccountingPeriod: builder.mutation({
      query: (payload) => { const { id, companyId, ...payloadData } = payload; return {
        url: `/api/account/accounting-periods/${id}`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        data: { data: payloadData },
      }; },
      invalidatesTags: ['Accounting'],
    }),
    deleteAccountingPeriod: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/accounting-periods/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Periods'],
    }),
    toggleAccountingPeriodStatus: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/accounting-periods/${id}/toggle-status`,
        method: 'PATCH',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Periods'],
    }),
  }),
})

export const {
  useGetFiscalYearsQuery,
  useGetFiscalYearByIdQuery,
  useCreateFiscalYearMutation,
  useUpdateFiscalYearMutation,
  useDeleteFiscalYearMutation,
  useToggleFiscalYearStatusMutation,
  useGetAccountingPeriodsQuery,
  useGetAccountingPeriodByIdQuery,
  useCreateAccountingPeriodMutation,
  useUpdateAccountingPeriodMutation,
  useDeleteAccountingPeriodMutation,
  useToggleAccountingPeriodStatusMutation,
} = periodsApiSlice


export const periodsApi = periodsApiSlice;
