import { baseApi } from '../common/baseApi';

export const purchaseApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // ==========================================
    // Purchase Orders
    // ==========================================
    getPurchaseOrders: builder.query({
      query: (arg = {}) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: "/api/account/purchase-orders",
          params,
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      providesTags: ["Purchase"],
    }),
    getPurchaseOrderById: builder.query({
      query: (id) => {
        const extractedId = typeof id === 'object' ? id.id : id;
        const companyId = typeof id === 'object' ? id.companyId : undefined;
        return {
          url: typeof id === 'object' && id.url ? id.url : `/api/account/purchase-orders/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ["Purchase"],
    }),
    createPurchaseOrder: builder.mutation({
      query: (data) => ({
        url: "/api/account/purchase-orders",
        method: "POST",
        data: { data },
        params: data?.companyId ? { companyId: data.companyId } : undefined,
      }),
      invalidatesTags: ["Purchase"],
    }),
    updatePurchaseOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/account/purchase-orders/${id}`,
        method: "PUT",
        data: { data },
      }),
      invalidatesTags: ["Purchase"],
    }),
    submitPurchaseOrder: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/purchase-orders/${id}/submit`,
        method: "POST",
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["Purchase"],
    }),
    approvePurchaseOrder: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/purchase-orders/${id}/approve`,
        method: "POST",
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["Purchase"],
    }),
    rejectPurchaseOrder: builder.mutation({
      query: ({ id, reason, companyId }) => ({
        url: `/api/account/purchase-orders/${id}/reject`,
        method: "POST",
        data: { reason },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["Purchase"],
    }),
    sendPurchaseOrder: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/purchase-orders/${id}/send`,
        method: "POST",
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["Purchase"],
    }),
    cancelPurchaseOrder: builder.mutation({
      query: ({ id, reason, companyId }) => ({
        url: `/api/account/purchase-orders/${id}/cancel`,
        method: "POST",
        data: { reason },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["Purchase"],
    }),
    closePurchaseOrder: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/purchase-orders/${id}/close`,
        method: "POST",
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["Purchase"],
    }),
        updatePurchaseOrderAdvanceRequirement: builder.mutation({
      query: ({ id, companyId, ...data }) => ({
        url: `/api/account/purchase-orders/${id}/advance-requirement`,
        method: "PATCH",
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["Purchase"],
    }),
    createPurchaseOrderAdvancePayment: builder.mutation({
      query: ({ id, companyId, ...data }) => ({
        url: `/api/account/purchase-orders/${id}/advance-payment`,
        method: "POST",
        data: { data },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["Purchase"],
    }),

    // ==========================================
    // Goods Receipts (GRN)
    // ==========================================
    getGoodsReceipts: builder.query({
      query: (arg = {}) => {
        const { companyId, ...params } = typeof arg === 'string' ? { companyId: arg } : arg;
        return {
          url: "/api/account/goods-receipts",
          params,
          headers: companyId ? { "X-Company-Id": companyId } : undefined,
        };
      },
      providesTags: ["GoodsReceipt", "Purchase"],
    }),
    getGoodsReceiptById: builder.query({
      query: (id) => {
        const extractedId = typeof id === 'object' ? id.id : id;
        const companyId = typeof id === 'object' ? id.companyId : undefined;
        return {
          url: `/api/account/goods-receipts/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ["GoodsReceipt"],
    }),
    getGoodsReceiptsByPurchaseOrder: builder.query({
      query: ({ poId, companyId }) => ({
        url: `/api/account/goods-receipts/by-purchase-order/${poId}`,
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      providesTags: ["GoodsReceipt"],
    }),
    createGoodsReceiptFromPO: builder.mutation({
      query: ({ poId, companyId, ...rest }) => {
        const payloadData = rest?.data ? rest.data : rest;
        return {
          url: `/api/account/goods-receipts/from-po/${poId}`,
          method: "POST",
          data: { data: payloadData },
          params: companyId ? { companyId } : undefined,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      invalidatesTags: ["GoodsReceipt", "Purchase"],
    }),
    confirmGoodsReceipt: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `/api/account/goods-receipts/${id}/confirm`,
        method: "POST",
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["GoodsReceipt", "Purchase"],
    }),
    cancelGoodsReceipt: builder.mutation({
      query: ({ id, reason, companyId }) => ({
        url: `/api/account/goods-receipts/${id}/cancel`,
        method: "POST",
        data: { reason },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["GoodsReceipt", "Purchase"],
    }),
    reverseGoodsReceipt: builder.mutation({
      query: ({ id, reason, companyId }) => ({
        url: `/api/account/goods-receipts/${id}/reverse`,
        method: "POST",
        data: { reason },
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["GoodsReceipt", "Purchase"],
    }),
    createInvoiceFromGrn: builder.mutation({
      query: ({ grnId, companyId }) => ({
        url: `/api/account/invoices/from-grn/${grnId}`,
        method: "POST",
        headers: companyId ? { 'X-Company-Id': companyId } : undefined
      }),
      invalidatesTags: ["Purchase", "Invoice"],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useSubmitPurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useRejectPurchaseOrderMutation,
  useSendPurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useClosePurchaseOrderMutation,
  useUpdatePurchaseOrderAdvanceRequirementMutation,
  useCreatePurchaseOrderAdvancePaymentMutation,
  useGetGoodsReceiptsQuery,
  useGetGoodsReceiptByIdQuery,
  useGetGoodsReceiptsByPurchaseOrderQuery,
  useCreateGoodsReceiptFromPOMutation,
  useConfirmGoodsReceiptMutation,
  useCancelGoodsReceiptMutation,
  useReverseGoodsReceiptMutation,
  useCreateInvoiceFromGrnMutation,
} = purchaseApiSlice;


