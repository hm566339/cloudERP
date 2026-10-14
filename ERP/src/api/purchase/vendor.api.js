import { baseApi } from '../common/baseApi'

// Vendor Master Data, AP Invoices, AP Payments, Payment Vouchers
// Extracted from purchase/purchaseApiSlice.js during API modularization.

export const vendorApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Vendors
    getVendors: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: "/api/account/v1/vendors",
          params,
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      providesTags: ["Vendor"],
    }),
    getVendorById: builder.query({
      query: ({ vendorId, companyId }) => ({
        url: `/api/account/v1/vendors/${vendorId}`,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),
    createVendor: builder.mutation({
      query: (payload) => { 
        const { companyId, company, ...data } = payload; 
        return {
          url: "/api/account/v1/vendors",
          method: "POST",
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
          data: { data },
        }; 
      },
      invalidatesTags: ["Vendor"],
    }),
    updateVendor: builder.mutation({
      query: (payload) => { 
        const { id, companyId, company, ...data } = payload; 
        return {
          url: `/api/account/v1/vendors/${id}`,
          method: "PUT",
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
          data: { data },
        }; 
      },
      invalidatesTags: ["Vendor"],
    }),
    deleteVendor: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/vendors/${id}`,
        method: "DELETE",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    deactivateVendor: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/vendors/${id}/deactivate`,
        method: "PUT",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    activateVendor: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/vendors/${id}/activate`,
        method: "PUT",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    searchVendors: builder.query({
      query: ({ companyId, search }) => ({
        url: "/api/account/v1/vendors/search",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
        params: { query: search },
      }),
      providesTags: ["Vendor"],
    }),
    getVendorsByCity: builder.query({
      query: ({ companyId, city, ...params }) => ({
        url: `/api/account/v1/vendors/city/${city}`,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
        params,
      }),
      providesTags: ["Vendor"],
    }),
    getVendorsByState: builder.query({
      query: ({ companyId, state, ...params }) => ({
        url: `/api/account/v1/vendors/state/${state}`,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
        params,
      }),
      providesTags: ["Vendor"],
    }),
    getVendorsByCountry: builder.query({
      query: ({ companyId, country, ...params }) => ({
        url: `/api/account/v1/vendors/country/${country}`,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
        params,
      }),
      providesTags: ["Vendor"],
    }),
    getVendorByPan: builder.query({
      query: ({ companyId, pan, ...params }) => ({
        url: `/api/account/v1/vendors/pan/${pan}`,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
        params,
      }),
      providesTags: ["Vendor"],
    }),
    getVendorByGstin: builder.query({
      query: ({ companyId, gstin, ...params }) => ({
        url: `/api/account/v1/vendors/gstin/${gstin}`,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
        params,
      }),
      providesTags: ["Vendor"],
    }),
    getActiveVendors: builder.query({
      query: (companyId) => ({
        url: "/api/account/v1/vendors/active",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),
    getVendorLedger: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/vendors/${id}/ledger`,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),
    getVendorTransactions: builder.query({
      query: ({ id, fromDate, toDate, companyId }) => ({
        url: `/api/account/v1/vendors/${id}/transactions`,
        params: { fromDate, toDate },
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),

    // AP Invoices  /api/account/invoices
    getAPInvoices: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: "/api/account/invoices",
          params,
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      providesTags: ["Vendor"],
    }),
    getAPInvoiceById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/invoices/${id}`,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),
    createAPInvoice: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: "/api/account/invoices",
        method: "POST",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
        data,
      }; },
      invalidatesTags: ["Vendor"],
    }),
    updateAPInvoice: builder.mutation({
      query: (payload) => { const { id, companyId, ...data } = payload; return {
        url: `/api/account/invoices/${id}`,
        method: "PUT",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
        data,
      }; },
      invalidatesTags: ["Vendor"],
    }),
    deleteAPInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/invoices/${id}`,
        method: "DELETE",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    approveAPInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/invoices/${id}/approve`,
        method: "PUT",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    rejectAPInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/invoices/${id}/reject`,
        method: "PUT",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    postAPInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/invoices/${id}/post`,
        method: "PUT",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    cancelAPInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/invoices/${id}/cancel`,
        method: "PUT",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    recordPartialPaymentAP: builder.mutation({
      query: ({ id, paymentAmount, companyId }) => ({
        url: `/api/account/invoices/${id}/partial-payment`,
        method: "POST",
        params: { paidAmount: paymentAmount },
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    markAPInvoicePaid: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/invoices/${id}/mark-paid`,
        method: "PUT",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    getAPInvoiceByNumber: builder.query({
      query: ({ invoiceNumber, companyId, ...params }) => ({
        url: `/api/account/invoices/number/${invoiceNumber}`,
        params,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),
    getAPInvoicesByVendor: builder.query({
      query: ({ vendorId, companyId, ...params }) => ({
        url: `/api/account/invoices/vendor/${vendorId}`,
        params,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),
    getAPInvoicesByStatus: builder.query({
      query: ({ status, companyId, ...params }) => ({
        url: `/api/account/invoices/status/${status}`,
        params,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),
    getAPInvoicesAging: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: "/api/account/invoices/aging",
          params,
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      providesTags: ["Vendor"],
    }),
    getAPInvoicesOutstanding: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: "/api/account/invoices/outstanding",
          params,
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      providesTags: ["Vendor"],
    }),
    searchAPInvoices: builder.query({
      query: ({ companyId, search, ...params }) => ({
        url: "/api/account/invoices/search",
        headers: { "X-Company-Id": companyId },
        params: { query: search, ...params },
      }),
      providesTags: ["Vendor"],
    }),

    // AP Payments (mapped to /api/account/payment-vouchers to resolve companyId for SYSTEM_ADMIN)
    getApPayments: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : (arg || {});
        return {
          url: "/api/account/payment-vouchers",
          params: companyId ? { ...params, companyId } : params,
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      transformResponse: (response) => {
        const rawList = Array.isArray(response)
          ? response
          : (response?.data?.content || response?.content || response?.data || []);
        const transformed = rawList.map(item => ({
          ...item,
          paymentNo: item.paymentNo || item.voucherNo,
          paymentDate: item.paymentDate || item.voucherDate,
        }));
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          return {
            ...response,
            data: transformed,
          };
        }
        return transformed;
      },
      providesTags: ["Vendor"],
    }),
    getApPaymentById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/payment-vouchers/${id}`,
        params: companyId ? { companyId } : undefined,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      transformResponse: (response) => {
        const item = response?.data || response;
        if (!item) return response;
        const transformed = {
          ...item,
          paymentNo: item.paymentNo || item.voucherNo,
          paymentDate: item.paymentDate || item.voucherDate,
        };
        if (response?.data) {
          return { ...response, data: transformed };
        }
        return transformed;
      },
      providesTags: ["Vendor"],
    }),
    createApPayment: builder.mutation({
      query: (payload) => {
        const { companyId, ...data } = payload;
        return {
          url: "/api/account/payment-vouchers",
          method: "POST",
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
          data,
        };
      },
      invalidatesTags: ["Vendor"],
    }),
    updateApPayment: builder.mutation({
      query: (payload) => {
        const { id, companyId, ...data } = payload;
        return {
          url: `/api/account/payment-vouchers/${id}`,
          method: "PUT",
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
          data,
        };
      },
      invalidatesTags: ["Vendor"],
    }),
    deleteApPayment: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/payment-vouchers/${id}`,
        method: "DELETE",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    reverseApPayment: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/payment-vouchers/${id}/reverse`,
        method: "POST",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    postApPayment: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/payment-vouchers/${id}/post`,
        method: "POST",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),

    // Payment Vouchers  /api/account/payment-vouchers
    getPaymentVouchers: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : (arg || {});
        return {
          url: "/api/account/payment-vouchers",
          params: companyId ? { ...params, companyId } : params,
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      providesTags: ["Vendor"],
    }),
    getPaymentVoucherById: builder.query({
      query: ({ voucherId, companyId }) => ({
        url: `/api/account/payment-vouchers/${voucherId}`,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),
    createPaymentVoucher: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: "/api/account/payment-vouchers",
        method: "POST",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
        data,
      }; },
      invalidatesTags: ["Vendor"],
    }),
    updatePaymentVoucher: builder.mutation({
      query: (payload) => { const { voucherId, companyId, ...data } = payload; return {
        url: `/api/account/payment-vouchers/${voucherId}`,
        method: "PUT",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
        data,
      }; },
      invalidatesTags: ["Vendor"],
    }),
    deletePaymentVoucher: builder.mutation({
      query: ({ voucherId, companyId }) => ({
        url: `/api/account/payment-vouchers/${voucherId}`,
        method: "DELETE",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    approvePaymentVoucher: builder.mutation({
      query: ({ voucherId, companyId }) => ({
        url: `/api/account/payment-vouchers/${voucherId}/approve`,
        method: "POST",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    cancelPaymentVoucher: builder.mutation({
      query: ({ voucherId, companyId }) => ({
        url: `/api/account/payment-vouchers/${voucherId}/cancel`,
        method: "POST",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    postPaymentVoucher: builder.mutation({
      query: ({ voucherId, companyId }) => ({
        url: `/api/account/payment-vouchers/${voucherId}/post`,
        method: "POST",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    reversePaymentVoucher: builder.mutation({
      query: ({ voucherId, companyId }) => ({
        url: `/api/account/payment-vouchers/${voucherId}/reverse`,
        method: "POST",
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      invalidatesTags: ["Vendor"],
    }),
    getPaymentVouchersByVendor: builder.query({
      query: ({ vendorId, companyId, ...params }) => ({
        url: `/api/account/payment-vouchers/vendor/${vendorId}`,
        params,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),
    getPaymentVouchersByStatus: builder.query({
      query: ({ status, companyId, ...params }) => ({
        url: `/api/account/payment-vouchers/status/${status}`,
        params,
        headers: companyId ? { "X-Company-Id": companyId } : undefined,
      }),
      providesTags: ["Vendor"],
    }),

    // Approvals — returns AP invoices with PENDING status
    getApprovals: builder.query({
      query: (arg) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: "/api/account/invoices/status/PENDING",
          params,
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      providesTags: ["Vendor"],
    }),
  }),
})

export const {
  useGetVendorsQuery,
  useGetVendorByIdQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useDeactivateVendorMutation,
  useActivateVendorMutation,
  useSearchVendorsQuery,
  useGetVendorsByCityQuery,
  useGetVendorsByStateQuery,
  useGetVendorsByCountryQuery,
  useGetVendorByPanQuery,
  useGetVendorByGstinQuery,
  useGetActiveVendorsQuery,
  useGetVendorLedgerQuery,
  useGetVendorTransactionsQuery,
  
  useGetAPInvoicesQuery,
  useGetAPInvoiceByIdQuery,
  useCreateAPInvoiceMutation,
  useUpdateAPInvoiceMutation,
  useDeleteAPInvoiceMutation,
  useApproveAPInvoiceMutation,
  useRejectAPInvoiceMutation,
  usePostAPInvoiceMutation,
  useCancelAPInvoiceMutation,
  useRecordPartialPaymentAPMutation,
  useMarkAPInvoicePaidMutation,
  useGetAPInvoiceByNumberQuery,
  useGetAPInvoicesByVendorQuery,
  useGetAPInvoicesByStatusQuery,
  useGetAPInvoicesAgingQuery,
  useGetAPInvoicesOutstandingQuery,
  useSearchAPInvoicesQuery,
  
  useGetApPaymentsQuery,
  useGetApPaymentByIdQuery,
  useCreateApPaymentMutation,
  useUpdateApPaymentMutation,
  useDeleteApPaymentMutation,
  useReverseApPaymentMutation,
  usePostApPaymentMutation,
  
  useGetPaymentVouchersQuery,
  useGetPaymentVoucherByIdQuery,
  useCreatePaymentVoucherMutation,
  useUpdatePaymentVoucherMutation,
  useDeletePaymentVoucherMutation,
  useApprovePaymentVoucherMutation,
  useCancelPaymentVoucherMutation,
  usePostPaymentVoucherMutation,
  useReversePaymentVoucherMutation,
  useGetPaymentVouchersByVendorQuery,
  useGetPaymentVouchersByStatusQuery,
  
  useGetApprovalsQuery,
} = vendorApiSlice
