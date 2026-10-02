import { baseApi } from '../common/baseApi'

export const manufacturingApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getProductionSchedules: builder.query({
      query: (companyIdArg) => {
        const extractedId = typeof companyIdArg === 'object' ? companyIdArg.id || companyIdArg.companyId : companyIdArg;
        const companyId = typeof companyIdArg === 'object' ? companyIdArg.companyId : undefined;typeof companyId === 'object' ? companyId.companyId : undefined;
        return {
          url: typeof companyIdArg === 'object' && companyIdArg.url ? companyIdArg.url : `/api/manufacturing/production-schedules/company/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Manufacturing'],
    }),
    createProductionSchedule: builder.mutation({
      query: (data) => ({
        url: '/api/manufacturing/production-schedules',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Manufacturing'],
    }),
    updateProductionScheduleStatus: builder.mutation({
      query: ({ id, ...changes }) => ({
        url: `/api/manufacturing/production-schedules/${id}`,
        method: 'PUT',
        data: changes,
      }),
      invalidatesTags: ['Manufacturing'],
    }),
    getBatches: builder.query({
      query: (companyIdArg) => {
        const extractedId = typeof companyIdArg === 'object' ? companyIdArg.id || companyIdArg.companyId : companyIdArg;
        const companyId = typeof companyIdArg === 'object' ? companyIdArg.companyId : undefined;typeof companyId === 'object' ? companyId.companyId : undefined;
        return {
          url: typeof companyIdArg === 'object' && companyIdArg.url ? companyIdArg.url : `/api/manufacturing/batches/company/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Manufacturing'],
    }),
  }),
})

export const {
  useGetProductionSchedulesQuery,
  useCreateProductionScheduleMutation,
  useUpdateProductionScheduleStatusMutation,
  useGetBatchesQuery,
} = manufacturingApiSlice

