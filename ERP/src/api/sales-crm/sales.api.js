import { baseApi } from '../common/baseApi';

export const salesApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Quotations
    getQuotations: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: "/api/account/v1/quotations",
          params: { companyId, ...params },
        };
      },
      providesTags: ["Sales"],
    }),
    getQuotationById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/quotations/${id}`,
        params: { companyId },
      }),
      providesTags: (result, error, { id }) => [
        { type: "Sales", id },
      ],
    }),
    getQuotationByNumber: builder.query({
      query: ({ quotationNumber, companyId }) => ({
        url: `/api/account/v1/quotations/number/${quotationNumber}`,
        params: { companyId },
      }),
      providesTags: ["Sales"],
    }),
    createQuotation: builder.mutation({
      query: (payload) => {
        const { companyId, ...data } = payload?.data || payload;
        return {
          url: "/api/account/v1/quotations",
          method: "POST",
          params: { companyId },
          data,
        };
      },
      invalidatesTags: ["Sales"],
    }),
    updateQuotation: builder.mutation({
      query: (payload) => {
        const { id, companyId, ...data } = payload?.data || payload;
        return {
          url: `/api/account/v1/quotations/${id}`,
          method: "PUT",
          params: { companyId },
          data,
        };
      },
      invalidatesTags: ["Sales"],
    }),
    updateQuotationStatus: builder.mutation({
      query: ({ id, status, companyId }) => ({
        url: `/api/account/v1/quotations/${id}/status`,
        method: "POST",
        params: { status, companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    deleteQuotation: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/quotations/${id}`,
        method: "DELETE",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    submitQuotationForApproval: builder.mutation({
      query: ({ id, companyId, comments }) => ({
        url: `/api/account/v1/quotations/${id}/submit-approval`,
        method: "POST",
        params: { companyId },
        data: { comments },
      }),
      invalidatesTags: ["Sales"],
    }),
    approveQuotation: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/quotations/${id}/approve`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    getQuotationPdf: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/sales/quotations/${id}/pdf`,
        params: { companyId },
        headers: {
          Accept: "application/pdf",
        },
        responseType: "blob",
      }),
    }),
    sendQuotation: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/quotations/${id}/send`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    sendQuotationEmail: builder.mutation({
      query: ({ id, companyId, data }) => ({
        url: `/api/account/v1/quotations/${id}/send-email`,
        method: "POST",
        params: { companyId },
        data
      }),
      invalidatesTags: ["Sales"],
    }),
    acceptQuotation: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/quotations/${id}/accept`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    acceptQuotationByToken: builder.mutation({
      query: ({ token }) => ({
        url: `/api/account/v1/quotations/public/accept/${token}`,
        method: "POST",
      }),
      invalidatesTags: ["Sales"],
    }),
    rejectQuotation: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/quotations/${id}/reject`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    cancelQuotation: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/quotations/${id}/cancel`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    convertToProformaInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/quotations/${id}/convert-to-proforma-invoice`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    // Proforma Invoices
    getProformaInvoices: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const rawParams = isString ? {} : { ...arg };
        const { page = 0, size = 20, sort = 'createdAt,desc', filter, ...filterParams } = rawParams;
        const params = { companyId, page, size, sort };
        const filterValues = filter || filterParams;

        Object.entries(filterValues).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params[`filter.${key}`] = value;
          }
        });

        return {
          url: "/api/account/v1/proforma-invoices",
          params,
        };
      },
      providesTags: ["Sales"],
    }),
    getProformaInvoiceById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/proforma-invoices/${id}`,
        params: { companyId },
      }),
      providesTags: (result, error, { id }) => [
        { type: "Sales", id },
      ],
    }),
    getProformaInvoiceByNumber: builder.query({
      query: ({ piNumber, companyId }) => ({
        url: `/api/account/v1/proforma-invoices/number/${piNumber}`,
        params: { companyId },
      }),
      providesTags: ["Sales"],
    }),
    createProformaInvoiceFromQuotation: builder.mutation({
      query: (payload) => {
        const { quotationId, companyId, ...data } = payload?.data || payload;
        return {
          url: `/api/account/v1/proforma-invoices/from-quotation/${quotationId}`,
          method: "POST",
          params: { companyId },
          data: { data },
        };
      },
      invalidatesTags: ["Sales"],
    }),
    createDirectProformaInvoice: builder.mutation({
      query: (payload) => {
        const { companyId, ...data } = payload?.data || payload;
        return {
          url: `/api/account/v1/proforma-invoices/direct`,
          method: "POST",
          params: { companyId },
          data: { data },
        };
      },
      invalidatesTags: ["Sales"],
    }),
    updateProformaInvoice: builder.mutation({
      query: (payload) => {
        const { id, companyId, ...data } = payload?.data || payload;
        return {
          url: `/api/account/v1/proforma-invoices/${id}`,
          method: "PUT",
          params: { companyId },
          data: { data },
        };
      },
      invalidatesTags: ["Sales"],
    }),
    deleteProformaInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/proforma-invoices/${id}`,
        method: "DELETE",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    sendProformaInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/proforma-invoices/${id}/send`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    submitProformaInvoiceForApproval: builder.mutation({
      query: ({ id, companyId, comments }) => ({
        url: `/api/account/sales/proforma-invoices/${id}/submit-approval`,
        method: "POST",
        params: { companyId },
        data: { comments },
      }),
      invalidatesTags: ["Sales"],
    }),
    approveProformaInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/sales/proforma-invoices/${id}/approve`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    confirmProformaInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/proforma-invoices/${id}/confirm`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    cancelProformaInvoice: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/proforma-invoices/${id}/cancel`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    createSalesOrderFromProformaInvoice: builder.mutation({
      query: ({ proformaInvoiceId, companyId, data }) => ({
        url: `/api/account/v1/sales-orders/from-proforma-invoice/${proformaInvoiceId}`,
        method: "POST",
        params: { companyId },
        data: { data },
      }),
      invalidatesTags: ["Sales", "Quotations", "ProformaInvoices"],
    }),
    createSalesOrderFromQuotation: builder.mutation({
      query: ({ quotationId, companyId }) => ({
        url: `/api/account/v1/sales-orders/from-quotation/${quotationId}`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales", "Quotations"],
    }),
    getDeliveryChallans: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: "/api/account/v1/delivery-challans",
          params: { companyId, ...params },
        };
      },
      providesTags: ["Sales", "DeliveryChallans"],
    }),
    getDeliveryChallanById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/delivery-challans/${id}`,
        params: { companyId },
      }),
      providesTags: (result, error, { id }) => [{ type: "DeliveryChallans", id }],
    }),
    createDeliveryChallanFromSo: builder.mutation({
      query: ({ data, companyId }) => ({
        url: `/api/account/v1/delivery-challans/from-sales-order`,
        method: "POST",
        params: { companyId },
        data: data?.data ? data : { data },
      }),
      invalidatesTags: ["Sales", "DeliveryChallans", "SalesOrders"],
    }),
    createDeliveryChallanFromReceipt: builder.mutation({
      query: ({ receiptId, data, companyId }) => {
        const body = data?.data || data;
        return {
          url: `/api/account/v1/delivery-challans/from-receipt/${receiptId}`,
          method: "POST",
          params: companyId ? { companyId } : undefined,
          data: body,
        };
      },
      invalidatesTags: ["Sales", "DeliveryChallans", "ReceiptVouchers"],
    }),
    updateDeliveryChallan: builder.mutation({
      query: ({ id, data, companyId }) => ({
        url: `/api/account/v1/delivery-challans/${id}`,
        method: "PUT",
        params: { companyId },
        data: data?.data ? data : { data },
      }),
      invalidatesTags: ["Sales", "DeliveryChallans"],
    }),
    submitDeliveryChallanForApproval: builder.mutation({
      query: ({ id, companyId, comments }) => ({
        url: `/api/account/sales/delivery-challans/${id}/submit-approval`,
        method: "POST",
        params: { companyId },
        data: { comments },
      }),
      invalidatesTags: ["Sales", "DeliveryChallans"],
    }),
    approveDeliveryChallan: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/sales/delivery-challans/${id}/approve`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales", "DeliveryChallans"],
    }),
    confirmDeliveryChallan: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/delivery-challans/${id}/confirm`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales", "DeliveryChallans", "SalesOrders"],
    }),
    cancelDeliveryChallan: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/delivery-challans/${id}/cancel`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales", "DeliveryChallans", "SalesOrders"],
    }),
    generateInvoiceFromDeliveryChallan: builder.mutation({
      query: ({ deliveryChallanId, companyId }) => ({
        url: `/api/account/v1/delivery-challans/${deliveryChallanId}/generate-invoice`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales", "SalesInvoices", "DeliveryChallans"],
    }),
    generateInvoiceFromSalesOrder: builder.mutation({
      query: ({ salesOrderId, companyId }) => ({
        url: `/api/account/v1/sales-orders/${salesOrderId}/generate-invoice`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales", "SalesInvoices"],
    }),
    // Sales Orders
    getSalesOrders: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: "/api/account/v1/sales-orders",
          params: { companyId, ...params },
        };
      },
      providesTags: ["Sales"],
    }),
    getSalesOrderV2ById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/v2/sales-orders/${id}`,
        params: { companyId },
      }),
      providesTags: (result, error, { id }) => [{ type: "Sales", id }],
    }),
    getSalesOrderById: builder.query({
      query: ({ id, companyId }) => ({
        url: `/api/account/v2/sales-orders/${id}`,
        params: { companyId },
      }),
      providesTags: (result, error, { id }) => [{ type: "Sales", id }],
    }),
    createSalesOrder: builder.mutation({
      query: (data) => ({
        url: "/api/sales/sales-orders",
        method: "POST",
        data,
      }),
      invalidatesTags: ["Sales"],
    }),
    submitSalesOrderForApproval: builder.mutation({
      query: ({ id, companyId, comments }) => ({
        url: `/api/account/v1/sales-orders/${id}/submit-approval`,
        method: "POST",
        params: { companyId },
        data: { comments },
      }),
      invalidatesTags: ["Sales", "SalesOrders"],
    }),
    approveSalesOrder: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/sales-orders/${id}/approve`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales", "SalesOrders"],
    }),
    confirmSalesOrder: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/sales-orders/${id}/confirm`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    cancelSalesOrder: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/v1/sales-orders/${id}/cancel`,
        method: "POST",
        params: { companyId },
      }),
      invalidatesTags: ["Sales"],
    }),

    // Sales Invoices  GET /api/account/sales/invoices
    getSalesInvoices: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: "/api/account/sales/invoices",
          headers: { "X-Company-Id": companyId },
          params,
        };
      },
      providesTags: ["Sales"],
    }),
    getSalesInvoiceById: builder.query({
      query: ({ invoiceId, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}`,
        headers: { "X-Company-Id": companyId },
      }),
      providesTags: (result, error, { invoiceId }) => [
        { type: "Sales", id: invoiceId },
      ],
    }),
    getSalesInvoicePdf: builder.query({
      query: ({ invoiceId, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}/pdf`,
        headers: { "X-Company-Id": companyId },
        responseHandler: (response) => response.blob(),
      }),
    }),
    createSalesInvoice: builder.mutation({
      query: (payload) => {
        const body = payload?.data ? payload : { data: payload };
        const { companyId, ...data } = body;
        return {
          url: "/api/account/sales/invoices",
          method: "POST",
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
          data,
        };
      },
      invalidatesTags: ["Sales"],
    }),
    updateSalesInvoice: builder.mutation({
      query: (payload) => {
        const { invoiceId, companyId, ...rest } = payload;
        const data = rest?.data ? rest : { data: rest };
        return {
          url: `/api/account/sales/invoices/${invoiceId}`,
          method: "PUT",
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
          data,
        };
      },
      invalidatesTags: ["Sales"],
    }),
    deleteSalesInvoice: builder.mutation({
      query: ({ invoiceId, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}`,
        method: "DELETE",
        headers: { "X-Company-Id": companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    approveSalesInvoice: builder.mutation({
      query: ({ invoiceId, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}/approve`,
        method: "PUT",
        headers: { "X-Company-Id": companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    rejectSalesInvoice: builder.mutation({
      query: ({ invoiceId, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}/reject`,
        method: "PUT",
        headers: { "X-Company-Id": companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    postSalesInvoice: builder.mutation({
      query: ({ invoiceId, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}/post`,
        method: "PUT",
        headers: { "X-Company-Id": companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    cancelSalesInvoice: builder.mutation({
      query: ({ invoiceId, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}/cancel`,
        method: "PUT",
        headers: { "X-Company-Id": companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    markSalesInvoicePaid: builder.mutation({
      query: ({ invoiceId, paymentAmount, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}/mark-paid`,
        method: "PUT",
        params: { paymentAmount },
        headers: { "X-Company-Id": companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    recordPartialPayment: builder.mutation({
      query: ({ invoiceId, paymentAmount, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}/partial-payment`,
        method: "PUT",
        params: { paymentAmount },
        headers: { "X-Company-Id": companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
    getSalesInvoicesByStatus: builder.query({
      query: ({ status, companyId, ...params }) => ({
        url: `/api/account/sales/invoices/status/${status}`,
        headers: { "X-Company-Id": companyId },
        params,
      }),
      providesTags: ["Sales"],
    }),
    getSalesInvoiceByNumber: builder.query({
      query: ({ invoiceNumber, companyId, ...params }) => ({
        url: `/api/account/sales/invoices/number/${invoiceNumber}`,
        headers: { "X-Company-Id": companyId },
        params,
      }),
      providesTags: ["Sales"],
    }),
    getSalesInvoicesByCustomer: builder.query({
      query: ({ customerId, companyId, ...params }) => ({
        url: `/api/account/sales/invoices/customer/${customerId}`,
        headers: { "X-Company-Id": companyId },
        params,
      }),
      providesTags: ["Sales"],
    }),
    getSalesInvoicesOutstanding: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: "/api/account/sales/invoices/outstanding",
          headers: { "X-Company-Id": companyId },
          params,
        };
      },
      providesTags: ["Sales"],
    }),
    getSalesInvoicesOverdue: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: "/api/account/sales/invoices/overdue",
          headers: { "X-Company-Id": companyId },
          params,
        };
      },
      providesTags: ["Sales"],
    }),
    getSalesInvoicesAging: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: "/api/account/sales/invoices/aging",
          headers: { "X-Company-Id": companyId },
          params,
        };
      },
      providesTags: ["Sales"],
    }),
    getSalesInvoicesSummary: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: "/api/account/sales/invoices/reports/summary",
          headers: { "X-Company-Id": companyId },
          params,
        };
      },
      providesTags: ["Sales"],
    }),
    getCustomerOutstandingBalance: builder.query({
      query: ({ customerId, companyId, ...params }) => ({
        url: `/api/account/sales/invoices/customer/${customerId}/outstanding-balance`,
        headers: { "X-Company-Id": companyId },
        params,
      }),
      providesTags: ["Sales"],
    }),

    // Invoice Taxes  /api/account/sales/invoices/{invoiceId}/taxes
    getInvoiceTaxes: builder.query({
      query: ({ invoiceId, companyId, ...params }) => ({
        url: `/api/account/sales/invoices/${invoiceId}/taxes`,
        headers: { "X-Company-Id": companyId },
        params,
      }),
      providesTags: ["Sales"],
    }),
    getInvoiceTaxById: builder.query({
      query: ({ invoiceId, taxId, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}/taxes/${taxId}`,
        headers: { "X-Company-Id": companyId },
      }),
      providesTags: ["Sales"],
    }),
    createInvoiceTax: builder.mutation({
      query: (payload) => {
        const { invoiceId, companyId, ...data } = payload; return {
          url: `/api/account/sales/invoices/${invoiceId}/taxes`,
          method: "POST",
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
          data,
        };
      },
      invalidatesTags: ["Sales"],
    }),
    updateInvoiceTax: builder.mutation({
      query: (payload) => {
        const { invoiceId, taxId, companyId, ...data } = payload; return {
          url: `/api/account/sales/invoices/${invoiceId}/taxes/${taxId}`,
          method: "PUT",
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
          data,
        };
      },
      invalidatesTags: ["Sales"],
    }),
    deleteInvoiceTax: builder.mutation({
      query: ({ invoiceId, taxId, companyId }) => ({
        url: `/api/account/sales/invoices/${invoiceId}/taxes/${taxId}`,
        method: "DELETE",
        headers: { "X-Company-Id": companyId },
      }),
      invalidatesTags: ["Sales"],
    }),
  }),
});

export const {
  useGetQuotationsQuery,
  useGetQuotationByIdQuery,
  useLazyGetQuotationPdfQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useUpdateQuotationStatusMutation,
  useDeleteQuotationMutation,
  useSubmitQuotationForApprovalMutation,
  useApproveQuotationMutation,
  useSendQuotationMutation,
  useSendQuotationEmailMutation,
  useAcceptQuotationMutation,
  useRejectQuotationMutation,
  useCancelQuotationMutation,
  useConvertToProformaInvoiceMutation,
  useGetProformaInvoicesQuery,
  useGetProformaInvoiceByIdQuery,
  useGetProformaInvoiceByNumberQuery,
  useCreateProformaInvoiceFromQuotationMutation,
  useCreateDirectProformaInvoiceMutation,
  useUpdateProformaInvoiceMutation,
  useDeleteProformaInvoiceMutation,
  useSubmitProformaInvoiceForApprovalMutation,
  useApproveProformaInvoiceMutation,
  useSendProformaInvoiceMutation,
  useConfirmProformaInvoiceMutation,
  useCancelProformaInvoiceMutation,
  useCreateSalesOrderFromProformaInvoiceMutation,
  useCreateSalesOrderFromQuotationMutation,
  useGetDeliveryChallansQuery,
  useGetDeliveryChallanByIdQuery,
  useLazyGetDeliveryChallanByIdQuery,
  useCreateDeliveryChallanFromSoMutation,
  useCreateDeliveryChallanFromReceiptMutation,
  useUpdateDeliveryChallanMutation,
  useSubmitDeliveryChallanForApprovalMutation,
  useApproveDeliveryChallanMutation,
  useConfirmDeliveryChallanMutation,
  useCancelDeliveryChallanMutation,
  useGetSalesOrdersQuery,
  useGetSalesOrderByIdQuery,
  useGetSalesOrderV2ByIdQuery,
  useSubmitSalesOrderForApprovalMutation,
  useApproveSalesOrderMutation,
  useConfirmSalesOrderMutation,
  useCancelSalesOrderMutation,
  useCreateSalesOrderMutation,
  useGetSalesInvoicesQuery,
  useGetSalesInvoiceByIdQuery,
  useGetSalesInvoicePdfQuery,
  useCreateSalesInvoiceMutation,
  useUpdateSalesInvoiceMutation,
  useDeleteSalesInvoiceMutation,
  useApproveSalesInvoiceMutation,
  useRejectSalesInvoiceMutation,
  usePostSalesInvoiceMutation,
  useCancelSalesInvoiceMutation,
  useMarkSalesInvoicePaidMutation,
  useRecordPartialPaymentMutation,
  useGetSalesInvoicesByStatusQuery,
  useGetSalesInvoiceByNumberQuery,
  useGetSalesInvoicesByCustomerQuery,
  useGetSalesInvoicesOutstandingQuery,
  useGetSalesInvoicesOverdueQuery,
  useGetSalesInvoicesAgingQuery,
  useGetSalesInvoicesSummaryQuery,
  useGetCustomerOutstandingBalanceQuery,
  useGetInvoiceTaxesQuery,
  useGetInvoiceTaxByIdQuery,
  useCreateInvoiceTaxMutation,
  useUpdateInvoiceTaxMutation,
  useDeleteInvoiceTaxMutation,
  useGenerateInvoiceFromSalesOrderMutation,
  useGenerateInvoiceFromDeliveryChallanMutation,
  useAcceptQuotationByTokenMutation,
} = salesApiSlice;


