import { baseApi } from '../../../api/common/baseApi.js';

export const themeApi = baseApi.enhanceEndpoints({
  addTagTypes: ['OrganizationAppearance'],
}).injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /api/sso/organization/appearance
     * Retrieves the persistent appearance configuration for the active organization.
     */
    getOrganizationAppearance: builder.query({
      query: () => ({
        url: '/api/sso/organization/appearance',
        method: 'GET',
      }),
      providesTags: ['OrganizationAppearance'],
      transformResponse: (response) => response?.data || response,
    }),

    /**
     * PUT /api/sso/organization/appearance
     * Persists updated appearance settings for the active organization.
     * Enforces organization OWNER, ADMIN, or SYSTEM_ADMIN privileges on the server.
     */
    updateOrganizationAppearance: builder.mutation({
      query: (settings) => ({
        url: '/api/sso/organization/appearance',
        method: 'PUT',
        data: settings,
      }),
      invalidatesTags: ['OrganizationAppearance'],
      transformResponse: (response) => response?.data || response,
    }),

    /**
     * POST /api/sso/organization/appearance/reset
     * Resets organization appearance to the default Sage Nature palette.
     */
    resetOrganizationAppearance: builder.mutation({
      query: () => ({
        url: '/api/sso/organization/appearance/reset',
        method: 'POST',
      }),
      invalidatesTags: ['OrganizationAppearance'],
      transformResponse: (response) => response?.data || response,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrganizationAppearanceQuery,
  useUpdateOrganizationAppearanceMutation,
  useResetOrganizationAppearanceMutation,
} = themeApi;
