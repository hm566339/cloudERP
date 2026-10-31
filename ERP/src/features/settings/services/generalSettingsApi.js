import { baseApi } from '../../../api/common/baseApi.js';

export const generalSettingsApi = baseApi.enhanceEndpoints({
  addTagTypes: ['GeneralSettings', 'OrganizationSettings', 'LocalizationSettings'],
}).injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /api/settings/general
     * Retrieves all general settings (Organization details + Localization preferences).
     */
    getGeneralSettings: builder.query({
      query: () => ({
        url: '/api/settings/general',
        method: 'GET',
      }),
      providesTags: ['GeneralSettings'],
      transformResponse: (response) => response?.data || response,
    }),

    /**
     * PUT /api/settings/general
     * Updates all general settings in one combined payload.
     */
    updateGeneralSettings: builder.mutation({
      query: (settings) => ({
        url: '/api/settings/general',
        method: 'PUT',
        data: settings,
      }),
      invalidatesTags: ['GeneralSettings', 'OrganizationSettings', 'LocalizationSettings'],
      transformResponse: (response) => response?.data || response,
    }),

    /**
     * GET /api/settings/organization
     * Retrieves organization information (companyName, contactEmail).
     */
    getOrganizationSettings: builder.query({
      query: () => ({
        url: '/api/settings/organization',
        method: 'GET',
      }),
      providesTags: ['OrganizationSettings'],
      transformResponse: (response) => response?.data || response,
    }),

    /**
     * PUT /api/settings/organization
     * Updates organization information (companyName, contactEmail).
     */
    updateOrganizationSettings: builder.mutation({
      query: (orgData) => ({
        url: '/api/settings/organization',
        method: 'PUT',
        data: orgData,
      }),
      invalidatesTags: ['OrganizationSettings', 'GeneralSettings'],
      transformResponse: (response) => response?.data || response,
    }),

    /**
     * GET /api/settings/localization
     * Retrieves localization settings (defaultCurrency, timezone, dateFormat, timeFormat).
     */
    getLocalizationSettings: builder.query({
      query: () => ({
        url: '/api/settings/localization',
        method: 'GET',
      }),
      providesTags: ['LocalizationSettings'],
      transformResponse: (response) => response?.data || response,
    }),

    /**
     * PUT /api/settings/localization
     * Updates localization settings.
     */
    updateLocalizationSettings: builder.mutation({
      query: (locData) => ({
        url: '/api/settings/localization',
        method: 'PUT',
        data: locData,
      }),
      invalidatesTags: ['LocalizationSettings', 'GeneralSettings'],
      transformResponse: (response) => response?.data || response,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetGeneralSettingsQuery,
  useUpdateGeneralSettingsMutation,
  useGetOrganizationSettingsQuery,
  useUpdateOrganizationSettingsMutation,
  useGetLocalizationSettingsQuery,
  useUpdateLocalizationSettingsMutation,
} = generalSettingsApi;
