import { baseApi } from '../common/baseApi'
import { isOwnerOrSystemAdminUser } from '../common/roleCompanyContext'

// Customer Master Data — extracted from crm/crmApiSlice.js during API modularization.
// NOTE: backend still exposes customers under /api/account/customers/*, not /api/customer/* — update URL if/when backend is modularized
export const customerApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: `/api/account/customers`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          params,
        };
      },
      providesTags: ['Customer'],
    }),
    createCustomer: builder.mutation({
      query: (payload) => {
        const { companyId, company, includeCompanyId, data: nestedData, ...legacyData } = payload;
        const isPrivileged = isOwnerOrSystemAdminUser();
        return {
          url: '/api/account/customers',
          method: 'POST',
          params: includeCompanyId && companyId && isPrivileged ? { companyId } : undefined,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data: nestedData || legacyData },
        };
      },
      invalidatesTags: ['Customer'],
    }),
    getCustomerById: builder.query({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : (arg?.id || arg?.customerId);
        const companyId = typeof arg === 'object' ? arg?.companyId : undefined;
        return {
          url: `/api/account/customers/${id}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Customer'],
    }),
    updateCustomer: builder.mutation({
      query: (payload) => {
        const { id, companyId, company, ...data } = payload;
        return {
          url: `/api/account/customers/${id}`,
          method: 'PUT',
          headers: { 'X-Company-Id': companyId },
          data: { data },
        };
      },
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/customers/${id}`,
        method: 'DELETE',
        headers: { 'X-Company-Id': companyId }
      }),
      invalidatesTags: ['Customer'],
    }),
    deactivateCustomer: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/customers/${id}/deactivate`,
        method: 'PATCH',
        headers: { 'X-Company-Id': companyId }
      }),
      invalidatesTags: ['Customer'],
    }),
    activateCustomer: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/customers/${id}/activate`,
        method: 'PATCH',
        headers: { 'X-Company-Id': companyId }
      }),
      invalidatesTags: ['Customer'],
    }),
    searchCustomers: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const search = isString ? undefined : (arg?.search || arg?.searchKey);
        const { search: _s, searchKey: _sk, ...rest } = isString ? {} : arg;
        return {
          url: `/api/account/customers`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          params: { ...rest, searchKey: search, isActive: true, size: 50 },
        };
      },
      providesTags: ['Customer'],
    }),
    getActiveCustomers: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: `/api/account/customers`,
          params: { ...params, isActive: true, size: 1000 },
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      providesTags: ['Customer'],
    }),
    getCustomersByCity: builder.query({
      query: ({ city, companyId, ...params }) => ({
        url: `/api/account/customers/city/${city}`,
        headers: { 'X-Company-Id': companyId },
        params,
      }),
      providesTags: ['Customer'],
    }),
    getCustomersByState: builder.query({
      query: ({ state, companyId, ...params }) => ({
        url: `/api/account/customers/state/${state}`,
        headers: { 'X-Company-Id': companyId },
        params,
      }),
      providesTags: ['Customer'],
    }),
    getCustomersByCountry: builder.query({
      query: ({ country, companyId, ...params }) => ({
        url: `/api/account/customers/country/${country}`,
        headers: { 'X-Company-Id': companyId },
        params,
      }),
      providesTags: ['Customer'],
    }),
    getCustomerByCode: builder.query({
      query: ({ customerCode, companyId, ...params }) => ({
        url: `/api/account/customers/code/${customerCode}`,
        headers: { 'X-Company-Id': companyId },
        params,
      }),
      providesTags: ['Customer'],
    }),
    getCustomerByPan: builder.query({
      query: ({ pan, companyId, ...params }) => ({
        url: `/api/account/customers/pan/${pan}`,
        headers: { 'X-Company-Id': companyId },
        params,
      }),
      providesTags: ['Customer'],
    }),
    getCustomerByGstin: builder.query({
      query: ({ gstin, companyId, ...params }) => ({
        url: `/api/account/customers/gstin/${gstin}`,
        headers: { 'X-Company-Id': companyId },
        params,
      }),
      providesTags: ['Customer'],
    }),
    getCustomerLedger: builder.query({
      query: ({ id, companyId, fromDate, toDate }) => ({
        url: `/api/account/customers/${id}/ledger`,
        headers: { 'X-Company-Id': companyId },
        params: { fromDate, toDate }
      }),
      providesTags: ['Customer'],
    }),
    getCustomerTransactions: builder.query({
      query: ({ id, companyId, fromDate, toDate }) => ({
        url: `/api/account/customers/${id}/transactions`,
        headers: { 'X-Company-Id': companyId },
        params: { fromDate, toDate }
      }),
      providesTags: ['Customer'],
    }),
  }),
})

export const {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useDeactivateCustomerMutation,
  useActivateCustomerMutation,
  useSearchCustomersQuery,
  useGetActiveCustomersQuery,
  useGetCustomersByCityQuery,
  useGetCustomersByStateQuery,
  useGetCustomersByCountryQuery,
  useGetCustomerByCodeQuery,
  useGetCustomerByPanQuery,
  useGetCustomerByGstinQuery,
  useGetCustomerLedgerQuery,
  useGetCustomerTransactionsQuery,
} = customerApiSlice
