import { baseApi } from '../common/baseApi';

export const salesSettingsApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Payment Terms
    getPaymentTerms: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const documentType = isString ? arg : arg?.documentType;
        const companyId = isString ? null : arg?.companyId;
        const params = { documentType };
        return {
          url: '/api/account/v1/settings/payment-terms',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          params,
        };
      },
      providesTags: (result, error, arg) => {
        const documentType = typeof arg === 'string' ? arg : arg?.documentType;
        return [{ type: 'SalesSettings', id: `PaymentTerms-${documentType}` }];
      },
    }),
    createPaymentTerm: builder.mutation({
      query: (payload) => {
        const { companyId, ...data } = payload?.data || payload;
        return {
          url: '/api/account/v1/settings/payment-terms',
          method: 'POST',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        };
      },
      invalidatesTags: (result, error, arg) => {
        const data = arg?.data || arg;
        const documentType = data?.documentType;
        return [{ type: 'SalesSettings', id: `PaymentTerms-${documentType}` }];
      },
    }),
    updatePaymentTerm: builder.mutation({
      query: (payload) => {
        const { id, companyId, ...data } = payload?.data || payload;
        return {
          url: `/api/account/v1/settings/payment-terms/${id}`,
          method: 'PUT',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        };
      },
      invalidatesTags: (result, error, arg) => {
        const data = arg?.data || arg;
        const documentType = data?.documentType;
        return [{ type: 'SalesSettings', id: `PaymentTerms-${documentType}` }];
      },
    }),
    deletePaymentTerm: builder.mutation({
      query: ({ id, companyId, documentType }) => ({
        url: `/api/account/v1/settings/payment-terms/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: (result, error, { documentType }) => [
        { type: 'SalesSettings', id: `PaymentTerms-${documentType}` },
      ],
    }),

    // Terms & Conditions
    getTermsConditions: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const documentType = isString ? arg : arg?.documentType;
        const companyId = isString ? null : arg?.companyId;
        const params = { documentType };
        return {
          url: '/api/account/v1/settings/terms-conditions',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          params,
        };
      },
      providesTags: (result, error, arg) => {
        const documentType = typeof arg === 'string' ? arg : arg?.documentType;
        return [{ type: 'SalesSettings', id: `TermsConditions-${documentType}` }];
      },
    }),
    createTermsCondition: builder.mutation({
      query: (payload) => {
        const { companyId, ...data } = payload?.data || payload;
        return {
          url: '/api/account/v1/settings/terms-conditions',
          method: 'POST',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        };
      },
      invalidatesTags: (result, error, arg) => {
        const data = arg?.data || arg;
        const documentType = data?.documentType;
        return [{ type: 'SalesSettings', id: `TermsConditions-${documentType}` }];
      },
    }),
    updateTermsCondition: builder.mutation({
      query: (payload) => {
        const { id, companyId, ...data } = payload?.data || payload;
        return {
          url: `/api/account/v1/settings/terms-conditions/${id}`,
          method: 'PUT',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        };
      },
      invalidatesTags: (result, error, arg) => {
        const data = arg?.data || arg;
        const documentType = data?.documentType;
        return [{ type: 'SalesSettings', id: `TermsConditions-${documentType}` }];
      },
    }),
    deleteTermsCondition: builder.mutation({
      query: ({ id, companyId, documentType }) => ({
        url: `/api/account/v1/settings/terms-conditions/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: (result, error, { documentType }) => [
        { type: 'SalesSettings', id: `TermsConditions-${documentType}` },
      ],
    }),

    // Delivery Terms
    getDeliveryTerms: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const documentType = isString ? arg : arg?.documentType;
        const companyId = isString ? null : arg?.companyId;
        const params = { documentType };
        return {
          url: '/api/account/v1/settings/delivery-terms',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          params,
        };
      },
      providesTags: (result, error, arg) => {
        const documentType = typeof arg === 'string' ? arg : arg?.documentType;
        return [{ type: 'SalesSettings', id: `DeliveryTerms-${documentType}` }];
      },
    }),
    createDeliveryTerm: builder.mutation({
      query: (payload) => {
        const { companyId, ...data } = payload?.data || payload;
        return {
          url: '/api/account/v1/settings/delivery-terms',
          method: 'POST',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        };
      },
      invalidatesTags: (result, error, arg) => {
        const data = arg?.data || arg;
        const documentType = data?.documentType;
        return [{ type: 'SalesSettings', id: `DeliveryTerms-${documentType}` }];
      },
    }),
    updateDeliveryTerm: builder.mutation({
      query: (payload) => {
        const { id, companyId, ...data } = payload?.data || payload;
        return {
          url: `/api/account/v1/settings/delivery-terms/${id}`,
          method: 'PUT',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        };
      },
      invalidatesTags: (result, error, arg) => {
        const data = arg?.data || arg;
        const documentType = data?.documentType;
        return [{ type: 'SalesSettings', id: `DeliveryTerms-${documentType}` }];
      },
    }),
    deleteDeliveryTerm: builder.mutation({
      query: ({ id, companyId, documentType }) => ({
        url: `/api/account/v1/settings/delivery-terms/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: (result, error, { documentType }) => [
        { type: 'SalesSettings', id: `DeliveryTerms-${documentType}` },
      ],
    }),

    // Warranty Terms
    getWarrantyTerms: builder.query({
      query: (arg) => {
        const isString = typeof arg === 'string';
        const documentType = isString ? arg : arg?.documentType;
        const companyId = isString ? null : arg?.companyId;
        const params = { documentType };
        return {
          url: '/api/account/v1/settings/warranty-terms',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          params,
        };
      },
      providesTags: (result, error, arg) => {
        const documentType = typeof arg === 'string' ? arg : arg?.documentType;
        return [{ type: 'SalesSettings', id: `WarrantyTerms-${documentType}` }];
      },
    }),
    createWarrantyTerm: builder.mutation({
      query: (payload) => {
        const { companyId, ...data } = payload?.data || payload;
        return {
          url: '/api/account/v1/settings/warranty-terms',
          method: 'POST',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        };
      },
      invalidatesTags: (result, error, arg) => {
        const data = arg?.data || arg;
        const documentType = data?.documentType;
        return [{ type: 'SalesSettings', id: `WarrantyTerms-${documentType}` }];
      },
    }),
    updateWarrantyTerm: builder.mutation({
      query: (payload) => {
        const { id, companyId, ...data } = payload?.data || payload;
        return {
          url: `/api/account/v1/settings/warranty-terms/${id}`,
          method: 'PUT',
          headers: companyId ? { 'X-Company-Id': companyId } : undefined,
          data: { data },
        };
      },
      invalidatesTags: (result, error, arg) => {
        const data = arg?.data || arg;
        const documentType = data?.documentType;
        return [{ type: 'SalesSettings', id: `WarrantyTerms-${documentType}` }];
      },
    }),
    deleteWarrantyTerm: builder.mutation({
      query: ({ id, companyId, documentType }) => ({
        url: `/api/account/v1/settings/warranty-terms/${id}`,
        method: 'DELETE',
        headers: companyId ? { 'X-Company-Id': companyId } : undefined,
      }),
      invalidatesTags: (result, error, { documentType }) => [
        { type: 'SalesSettings', id: `WarrantyTerms-${documentType}` },
      ],
    }),
  }),
});

export const {
  useGetPaymentTermsQuery,
  useCreatePaymentTermMutation,
  useUpdatePaymentTermMutation,
  useDeletePaymentTermMutation,
  useGetTermsConditionsQuery,
  useCreateTermsConditionMutation,
  useUpdateTermsConditionMutation,
  useDeleteTermsConditionMutation,
  useGetDeliveryTermsQuery,
  useCreateDeliveryTermMutation,
  useUpdateDeliveryTermMutation,
  useDeleteDeliveryTermMutation,
  useGetWarrantyTermsQuery,
  useCreateWarrantyTermMutation,
  useUpdateWarrantyTermMutation,
  useDeleteWarrantyTermMutation,
} = salesSettingsApiSlice;
