import { baseApi } from '../common/baseApi'

export const notesApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Credit Notes
    getCreditNotes: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: `/api/account/credit-notes`,
        params,
        headers: { "X-Company-Id": companyId },
        };
      },
      providesTags: ['Notes'],
    }),
    getCreditNoteById: builder.query({
      query: (id) => {
        const extractedId = typeof id === 'object' ? id.id || id.id : id;
        const companyId = typeof id === 'object' ? id.companyId : undefined;
        return {
          url: typeof id === 'object' && id.url ? id.url : `/api/account/credit-notes/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Notes'],
    }),
    createCreditNote: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: '/api/account/credit-notes',
        method: 'POST',
        headers: { "X-Company-Id": companyId },
        data,
      }; },
      invalidatesTags: ['Notes'],
    }),
    updateCreditNote: builder.mutation({
      query: (payload) => { const { id, companyId, ...data } = payload; return {
        url: `/api/account/credit-notes/${id}`,
        method: 'PUT',
        params: { companyId },
        data,
      }; },
      invalidatesTags: ['Notes'],
    }),
    deleteCreditNote: builder.mutation({
      query: (id) => ({
        url: `/api/account/credit-notes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notes'],
    }),
    approveCreditNote: builder.mutation({
      query: (id) => ({
        url: `/api/account/credit-notes/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Notes'],
    }),
    cancelCreditNote: builder.mutation({
      query: (id) => ({
        url: `/api/account/credit-notes/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Notes'],
    }),
    postCreditNote: builder.mutation({
      query: (id) => ({
        url: `/api/account/credit-notes/${id}/post`,
        method: 'POST',
      }),
      invalidatesTags: ['Notes'],
    }),
    reverseCreditNote: builder.mutation({
      query: (id) => ({
        url: `/api/account/credit-notes/${id}/reverse`,
        method: 'POST',
      }),
      invalidatesTags: ['Notes'],
    }),

    getDebitNotes: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const companyId = isString ? arg : arg?.companyId;
        const params = isString ? { companyId } : { ...arg };
        return {
          url: `/api/account/debit-notes`,
        params,
        headers: { "X-Company-Id": companyId },
        };
      },
      providesTags: ['Notes'],
    }),
    getDebitNoteById: builder.query({
      query: (id) => {
        const extractedId = typeof id === 'object' ? id.id || id.id : id;
        const companyId = typeof id === 'object' ? id.companyId : undefined;
        return {
          url: typeof id === 'object' && id.url ? id.url : `/api/account/debit-notes/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Notes'],
    }),
    createDebitNote: builder.mutation({
      query: (payload) => { const { companyId, ...data } = payload; return {
        url: '/api/account/debit-notes',
        method: 'POST',
        headers: { "X-Company-Id": companyId },
        data,
      }; },
      invalidatesTags: ['Notes'],
    }),
    updateDebitNote: builder.mutation({
      query: (payload) => { const { id, companyId, ...data } = payload; return {
        url: `/api/account/debit-notes/${id}`,
        method: 'PUT',
        params: { companyId },
        data,
      }; },
      invalidatesTags: ['Notes'],
    }),
    deleteDebitNote: builder.mutation({
      query: (id) => ({
        url: `/api/account/debit-notes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notes'],
    }),
    approveDebitNote: builder.mutation({
      query: (id) => ({
        url: `/api/account/debit-notes/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Notes'],
    }),
    cancelDebitNote: builder.mutation({
      query: (id) => ({
        url: `/api/account/debit-notes/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Notes'],
    }),
    postDebitNote: builder.mutation({
      query: (id) => ({
        url: `/api/account/debit-notes/${id}/post`,
        method: 'POST',
      }),
      invalidatesTags: ['Notes'],
    }),
    reverseDebitNote: builder.mutation({
      query: (id) => ({
        url: `/api/account/debit-notes/${id}/reverse`,
        method: 'POST',
      }),
      invalidatesTags: ['Notes'],
    }),
  }),
})

export const {
  useGetCreditNotesQuery,
  useGetCreditNoteByIdQuery,
  useCreateCreditNoteMutation,
  useUpdateCreditNoteMutation,
  useDeleteCreditNoteMutation,
  useApproveCreditNoteMutation,
  useCancelCreditNoteMutation,
  usePostCreditNoteMutation,
  useReverseCreditNoteMutation,

  useGetDebitNotesQuery,
  useGetDebitNoteByIdQuery,
  useCreateDebitNoteMutation,
  useUpdateDebitNoteMutation,
  useDeleteDebitNoteMutation,
  useApproveDebitNoteMutation,
  useCancelDebitNoteMutation,
  usePostDebitNoteMutation,
  useReverseDebitNoteMutation,
} = notesApiSlice

