import { baseApi } from '../common/baseApi'

// CRM — Leads & Opportunities only.
// Customer master data has been moved to: src/api/customer/customerApiSlice.js
export const crmApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getLeads: builder.query({
      query: (companyIdArg) => {
        const extractedId = typeof companyIdArg === 'object' ? companyIdArg.id || companyIdArg.companyId : companyIdArg;
        const companyId = typeof companyIdArg === 'object' ? companyIdArg.companyId : undefined;typeof companyId === 'object' ? companyId.companyId : undefined;
        return {
          url: typeof companyIdArg === 'object' && companyIdArg.url ? companyIdArg.url : `/api/leads/company/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['CRM'],
    }),
    createLead: builder.mutation({
      query: (data) => ({
        url: '/api/leads',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['CRM'],
    }),
    updateLeadStatus: builder.mutation({
      query: ({ id, ...changes }) => ({
        url: `/api/leads/${id}`,
        method: 'PUT',
        data: changes,
      }),
      invalidatesTags: ['CRM'],
    }),
  }),
})

export const {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadStatusMutation,
} = crmApiSlice

// ──────────────────────────────────────────────────────────
