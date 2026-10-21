import { baseApi } from '../common/baseApi'

function extractId(arg) {
  if (!arg) return undefined
  if (typeof arg === 'object') return arg.id || arg.companyId
  return arg
}

export const manufacturingApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getProductionSchedules: builder.query({
      query: (companyIdArg) => {
        const extractedId = extractId(companyIdArg)
        const companyId = typeof companyIdArg === 'object' ? companyIdArg.companyId : extractedId
        return {
          url: typeof companyIdArg === 'object' && companyIdArg.url 
            ? companyIdArg.url 
            : (extractedId ? `/api/manufacturing/production-orders/company/${extractedId}` : '/api/manufacturing/production-orders'),
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        }
      },
      transformResponse: (res) => {
        if (!res) return []
        if (Array.isArray(res)) return res
        if (Array.isArray(res.data)) return res.data
        return []
      },
      providesTags: ['Manufacturing'],
    }),

    getProductionOrders: builder.query({
      query: (companyIdArg) => {
        const extractedId = extractId(companyIdArg)
        const companyId = typeof companyIdArg === 'object' ? companyIdArg.companyId : extractedId
        return {
          url: extractedId ? `/api/manufacturing/production-orders/company/${extractedId}` : '/api/manufacturing/production-orders',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        }
      },
      transformResponse: (res) => {
        if (!res) return []
        if (Array.isArray(res)) return res
        if (Array.isArray(res.data)) return res.data
        return []
      },
      providesTags: ['Manufacturing'],
    }),

    getProductionOrderById: builder.query({
      query: (id) => ({
        url: `/api/manufacturing/production-orders/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Manufacturing', id }],
    }),

    createProductionSchedule: builder.mutation({
      query: (data) => ({
        url: '/api/manufacturing/production-orders',
        method: 'POST',
        data,
        headers: data?.companyId ? { 'X-Company-Id': data.companyId } : undefined,
      }),
      invalidatesTags: ['Manufacturing'],
    }),

    createProductionOrder: builder.mutation({
      query: (data) => ({
        url: '/api/manufacturing/production-orders',
        method: 'POST',
        data,
        headers: data?.companyId ? { 'X-Company-Id': data.companyId } : undefined,
      }),
      invalidatesTags: ['Manufacturing'],
    }),

    submitProductionOrder: builder.mutation({
      query: ({ id, comments }) => ({
        url: `/api/manufacturing/production-orders/${id}/submit`,
        method: 'POST',
        data: comments ? { comments } : {},
      }),
      invalidatesTags: ['Manufacturing'],
    }),

    approveProductionOrder: builder.mutation({
      query: (id) => ({
        url: `/api/manufacturing/production-orders/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Manufacturing'],
    }),

    releaseProductionOrder: builder.mutation({
      query: (id) => ({
        url: `/api/manufacturing/production-orders/${id}/release`,
        method: 'POST',
      }),
      invalidatesTags: ['Manufacturing'],
    }),

    rejectProductionOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/api/manufacturing/production-orders/${id}/reject`,
        method: 'POST',
        data: reason ? { reason } : {},
      }),
      invalidatesTags: ['Manufacturing'],
    }),

    updateProductionScheduleStatus: builder.mutation({
      query: ({ id, status, ...rest }) => {
        const norm = (status || '').toUpperCase()
        if (norm === 'RELEASED' || norm === 'IN PROGRESS' || norm === 'IN_PROGRESS') {
          return {
            url: `/api/manufacturing/production-orders/${id}/release`,
            method: 'POST',
          }
        }
        if (norm === 'SUBMITTED' || norm === 'PENDING_APPROVAL') {
          return {
            url: `/api/manufacturing/production-orders/${id}/submit`,
            method: 'POST',
          }
        }
        if (norm === 'APPROVED') {
          return {
            url: `/api/manufacturing/production-orders/${id}/approve`,
            method: 'POST',
          }
        }
        // Fallback for generic updates if supported
        return {
          url: `/api/manufacturing/production-orders/${id}`,
          method: 'POST',
          data: { status, ...rest },
        }
      },
      invalidatesTags: ['Manufacturing'],
    }),

    getBoms: builder.query({
      query: (companyIdArg) => {
        const compId = extractId(companyIdArg)
        return {
          url: '/api/manufacturing/boms',
          headers: compId ? { 'X-Company-Id': compId } : undefined,
        }
      },
      transformResponse: (res) => {
        if (!res) return []
        if (Array.isArray(res)) return res
        if (Array.isArray(res.data)) return res.data
        return []
      },
      providesTags: ['Manufacturing'],
    }),

    getBomById: builder.query({
      query: (id) => ({
        url: `/api/manufacturing/boms/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: 'Manufacturing', id }],
    }),

    createBom: builder.mutation({
      query: (data) => ({
        url: '/api/manufacturing/boms',
        method: 'POST',
        data,
        headers: data?.companyId ? { 'X-Company-Id': data.companyId } : undefined,
      }),
      invalidatesTags: ['Manufacturing'],
    }),

    submitBom: builder.mutation({
      query: ({ id, comments }) => ({
        url: `/api/manufacturing/boms/${id}/submit`,
        method: 'POST',
        data: comments ? { comments } : {},
      }),
      invalidatesTags: ['Manufacturing'],
    }),

    // Real batch tracking query backed by Inventory service where batches exist
    getBatches: builder.query({
      query: (companyIdArg) => {
        const compId = extractId(companyIdArg)
        return {
          url: '/api/inventory/product-batches',
          params: compId ? { companyId: compId } : undefined,
        }
      },
      transformResponse: (res) => {
        if (!res) return []
        if (Array.isArray(res.data)) return res.data
        if (Array.isArray(res)) return res
        return []
      },
      providesTags: ['Manufacturing', 'Inventory'],
    }),

    getMaterialAvailability: builder.query({
      query: (productionOrderId) => ({
        url: `/api/manufacturing/production-orders/${productionOrderId}/material-availability`,
      }),
      providesTags: ['Manufacturing'],
    }),

    reserveMaterials: builder.mutation({
      query: (productionOrderId) => ({
        url: `/api/manufacturing/production-orders/${productionOrderId}/reserve`,
        method: 'POST',
      }),
      invalidatesTags: ['Manufacturing'],
    }),

    consumeMaterial: builder.mutation({
      query: ({ productionOrderId, ...data }) => ({
        url: `/api/manufacturing/production-orders/${productionOrderId}/consume-material`,
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Manufacturing'],
    }),
  }),
})

export const {
  useGetProductionSchedulesQuery,
  useGetProductionOrdersQuery,
  useGetProductionOrderByIdQuery,
  useCreateProductionScheduleMutation,
  useCreateProductionOrderMutation,
  useSubmitProductionOrderMutation,
  useApproveProductionOrderMutation,
  useReleaseProductionOrderMutation,
  useRejectProductionOrderMutation,
  useUpdateProductionScheduleStatusMutation,
  useGetBomsQuery,
  useGetBomByIdQuery,
  useCreateBomMutation,
  useSubmitBomMutation,
  useGetBatchesQuery,
  useGetMaterialAvailabilityQuery,
  useReserveMaterialsMutation,
  useConsumeMaterialMutation,
} = manufacturingApiSlice
