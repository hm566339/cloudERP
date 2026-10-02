import { baseApi } from '../common/baseApi'

export const bankingApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Bank Accounts  /api/account/bank-accounts
    getBankAccounts: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const { companyId: _, ...restParams } = isString ? {} : arg || {};
        const params = isString ? {} : restParams;
        return {
          url: '/api/account/bank-accounts',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Banking'],
    }),
    getBankAccountById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/bank-accounts/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Banking'],
    }),
    createBankAccount: builder.mutation({
      query: (payload) => { 
        const { companyId, company, ...data } = payload;
        return {
          url: '/api/account/bank-accounts',
          method: 'POST',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        }; 
      },
      invalidatesTags: ['Banking'],
    }),
    updateBankAccount: builder.mutation({
      query: (payload) => { 
        const { id, companyId, company, ...data } = payload;
        return {
          url: `/api/account/bank-accounts/${id}`,
          method: 'PUT',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        }; 
      },
      invalidatesTags: ['Banking'],
    }),
    deleteBankAccount: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/bank-accounts/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Banking'],
    }),
    deactivateBankAccount: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/bank-accounts/${id}/deactivate`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Banking'],
    }),
    activateBankAccount: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/bank-accounts/${id}/activate`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Banking'],
    }),
    getBankAccountByNumber: builder.query({
      query: (accountNumber) => {
        const extractedId = typeof accountNumber === 'object' ? accountNumber.id || accountNumber.accountNumber : accountNumber;
        const companyId = typeof accountNumber === 'object' ? accountNumber.companyId : undefined;
        return {
          url: typeof accountNumber === 'object' && accountNumber.url ? accountNumber.url : `/api/account/bank-accounts/number/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Banking'],
    }),
    getBankAccountLedger: builder.query({
      query: ({ id, companyId, ...params }) => ({
        url: `/api/account/bank-accounts/${id}/ledger`,
        params: { ...params },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Banking'],
    }),
    getBankAccountReconciliation: builder.query({
      query: ({ id, companyId, ...params }) => ({
        url: `/api/account/bank-accounts/${id}/reconciliation`,
        params: { ...params },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Banking'],
    }),

    // Bank Transactions  /api/account/bank-transactions
    getBankTransactions: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const { companyId: _, ...restParams } = isString ? {} : arg || {};
        const params = isString ? {} : restParams;
        return {
          url: '/api/account/bank-transactions',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Banking'],
    }),
    getTransactionById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/bank-transactions/${id}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Banking'],
    }),
    createBankTransaction: builder.mutation({
      query: (payload) => { return {
        url: '/api/account/bank-transactions',
        method: 'POST',
        headers: payload.companyId ? { 'X-Company-Id': payload.companyId } : undefined,
        data: payload,
      }; },
      invalidatesTags: ['Banking'],
    }),
    updateTransaction: builder.mutation({
      query: (payload) => { return {
        url: `/api/account/bank-transactions/${payload.id}`,
        method: 'PUT',
        headers: payload.companyId ? { 'X-Company-Id': payload.companyId } : undefined,
        data: payload,
      }; },
      invalidatesTags: ['Banking'],
    }),
    deleteTransaction: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/bank-transactions/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Banking'],
    }),
    reconcileTransaction: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/bank-transactions/${id}/reconcile`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Banking'],
    }),
    unreconcileTransaction: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/bank-transactions/${id}/unreconcile`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: ['Banking'],
    }),
    reverseTransaction: builder.mutation({
      query: ({ id, companyId, narration }) => ({
        url: `/api/account/bank-transactions/${id}/reverse`,
        method: 'PUT',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        params: narration ? { narration } : undefined,
      }),
      invalidatesTags: ['Banking'],
    }),
    getBankTransactionsByAccount: builder.query({
      query: ({ bankAccountId, companyId, ...params }) => ({
        url: `/api/account/bank-transactions/bank-account/${bankAccountId}`,
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      providesTags: ['Banking'],
    }),
    getBankTransactionsUnreconciled: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/bank-transactions/unreconciled',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Banking'],
    }),
    getBankTransactionsReconciled: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/bank-transactions/reconciled',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Banking'],
    }),
    getBankTransactionsReconciliationSummary: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/bank-transactions/reconciliation-summary',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Banking'],
    }),
    getBankTransactionsLedger: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/bank-transactions/ledger',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Banking'],
    }),
    getBankTransactionsLedgerDateRange: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: '/api/account/bank-transactions/ledger/date-range',
        params,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
        };
      },
      providesTags: ['Banking'],
    }),
  }),
})

export const {
  useGetBankAccountsQuery,
  useGetBankAccountByIdQuery,
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation,
  useDeactivateBankAccountMutation,
  useActivateBankAccountMutation,
  useGetBankAccountByNumberQuery,
  useGetBankAccountLedgerQuery,
  useGetBankAccountReconciliationQuery,
  useGetBankTransactionsQuery,
  useGetTransactionByIdQuery,
  useCreateBankTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useReconcileTransactionMutation,
  useUnreconcileTransactionMutation,
  useReverseTransactionMutation,
  useGetBankTransactionsByAccountQuery,
  useGetBankTransactionsUnreconciledQuery,
  useGetBankTransactionsReconciledQuery,
  useGetBankTransactionsReconciliationSummaryQuery,
  useGetBankTransactionsLedgerQuery,
  useGetBankTransactionsLedgerDateRangeQuery,
} = bankingApiSlice

