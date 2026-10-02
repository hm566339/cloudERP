import { baseApi } from '../common/baseApi';

// NOTE: This file was cleaned up during the API modularization refactor.
// It now contains ONLY endpoints unique to the Finance module:
// - Expenses (/api/expenses/*)
// - Receipts (/api/account/receipts/*)
// - Finance Dashboard (/api/account/dashboard/finance)
//
// Endpoints that were previously here but belong to other modules:
// - Sales invoices → src/api/sales/salesApiSlice.js
// - GST slabs, HSN/SAC → src/api/accounting/accountingApiSlice.js
// - Credit/debit notes → src/api/notes/notesApiSlice.js
// - General ledger reports → src/api/reports/reportsApiSlice.js

export const financeApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Finance Dashboard
    // NOTE: backend still exposes this under /api/account/*, not /api/finance/* — update URL if/when backend is modularized
    getFinanceDashboard: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: "/api/account/dashboard/finance",
          params,
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      providesTags: ["Finance"],
    }),

    // Expenses (not in official backend spec yet, kept for future)
    // NOTE: backend endpoint /api/expenses/* — update URL if/when backend is modularized
    getExpenses: builder.query({
      query: (companyId) => ({
        url: "/api/expenses/company/" + companyId,
        headers: { "X-Company-Id": companyId },
      }),
      providesTags: ["Finance"],
    }),
    createExpense: builder.mutation({
      query: (data) => ({
        url: "/api/expenses",
        method: "POST",
        data,
      }),
      invalidatesTags: ["Finance"],
    }),

    // Receipts
    // NOTE: backend still exposes this under /api/account/receipts/*, not /api/finance/receipts/* — update URL if/when backend is modularized
    getReceipts: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: "/api/account/receipts",
        params,
        headers: { "X-Company-Id": companyId },
        };
      },
      providesTags: ["Finance"],
    }),
    getReceiptById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/receipts/${id}`,
        headers: { "X-Company-Id": companyId },
      }),
      providesTags: ["Finance"],
    }),
    createReceipt: builder.mutation({
      query: (payload) => {
        const { companyId, ...data } = payload;
        return {
          url: "/api/account/receipts",
          method: "POST",
          headers: { "X-Company-Id": companyId },
          data,
        };
      },
      invalidatesTags: ["Finance"],
    }),
    deleteReceipt: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/receipts/${id}`,
        method: "DELETE",
        headers: { "X-Company-Id": companyId },
      }),
      invalidatesTags: ["Finance"],
    }),
  }),
});

export const {
  useGetFinanceDashboardQuery,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useGetReceiptsQuery,
  useGetReceiptByIdQuery,
  useCreateReceiptMutation,
  useDeleteReceiptMutation,
} = financeApiSlice;

// ──────────────────────────────────────────────────────────
export const financeApi = financeApiSlice;
