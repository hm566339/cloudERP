import { baseApi } from '../common/baseApi';

export const companyModuleApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCompanyModules: builder.query({
      async queryFn(arg, queryApi, extraOptions, baseQuery) {
        let allModules = [];
        let page = 1;
        let totalPages = 1;
        let fullResponse = null;

        while (page <= totalPages) {
          const result = await baseQuery({
            url: "/api/sso/company-modules",
            method: "GET",
            params: { ...arg, page, pageSize: arg?.pageSize || 1000, size: arg?.pageSize || 1000 }
          });

          if (result.error) {
            return { error: result.error };
          }

          const responseData = result.data;
          fullResponse = responseData;
          
          const innerData = responseData?.data || responseData || {};
          let items = [];
          if (Array.isArray(responseData)) items = responseData;
          else if (Array.isArray(innerData)) items = innerData;
          else if (Array.isArray(innerData.companyModuleResponse)) items = innerData.companyModuleResponse;
          else if (Array.isArray(innerData.content)) items = innerData.content;
          else if (Array.isArray(innerData.modules)) items = innerData.modules;
          
          allModules = [...allModules, ...items];
          totalPages = innerData.pagination?.totalPages || 1;
          page++;
        }

        const innerData = fullResponse?.data || fullResponse || {};
        const finalData = { 
          companyModuleResponse: allModules, 
          modules: allModules, 
          ...fullResponse, 
          ...innerData 
        };

        return { data: finalData };
      },
      providesTags: ["CompanyModule"],
    }),
    getCompanyModulesByCompany: builder.query({
      query: ({ companyId, active = true }) => ({
        url: `/api/sso/company-modules/company/${companyId}`,
        method: "GET",
        params: { active: active === true ? 'true' : active },
      }),
      transformResponse: (response) => {
        const modules = response?.data || response || [];
        const items = Array.isArray(modules) ? modules : [];
        return items.filter((mod) => mod?.status === true);
      },
      providesTags: (result, error, { companyId }) => [
        { type: "CompanyModule", id: `company-${companyId}` },
      ],
    }),
    getCompanyModulesByCompanyId: builder.query({
      query: ({ companyId, active }) => {
        const params = {};
        if (active !== undefined) params.active = active;
        return {
          url: `/api/sso/company-modules/company/${companyId}`,
          method: "GET",
          params,
        };
      },
      transformResponse: (response) => {
        // Handle different response formats
        if (response?.data) {
          return Array.isArray(response.data) ? response.data : [response.data];
        }
        return Array.isArray(response) ? response : [];
      },
      providesTags: (result, error, { companyId }) => [
        { type: "CompanyModule", id: `company-${companyId}` },
      ],
    }),
    getCompanyModuleById: builder.query({
      query: (id) => ({
        url: `/api/sso/company-modules/${id}`,
        method: "GET",
      }),
      transformResponse: (response) => response,
      providesTags: (result, error, id) => [{ type: "CompanyModule", id }],
    }),
    createCompanyModule: builder.mutation({
      query: (payload) => ({
        url: "/api/sso/company-modules",
        method: "POST",
        data: { 
          data: {
            company: payload.company || payload.companyId,
            module: payload.module || payload.moduleId
          }
        },
      }),
      transformResponse: (response) => response,
      invalidatesTags: ["CompanyModule"],
    }),
    updateCompanyModule: builder.mutation({
      query: (payload) => { 
        const { id, ...rest } = payload; 
        return {
          url: `/api/sso/company-modules/${id}`,
          method: "PUT",
          data: { 
            data: {
              company: rest.company || rest.companyId,
              module: rest.module || rest.moduleId,
              ...rest
            } 
          },
        }; 
      },
      transformResponse: (response) => response,
      invalidatesTags: (result, error, { id }) => [
        { type: "CompanyModule", id },
        "CompanyModule",
      ],
    }),
    updateCompanyModuleStatus: builder.mutation({
      query: ({ id, active }) => {
        const url = `/api/sso/company-modules/${id}/status?active=${active === true ? 'true' : 'false'}`;
        return {
          url,
          method: "PATCH",
          headers: {
            'Content-Type': 'application/json',
          },
        };
      },
      transformResponse: (response) => response,
      invalidatesTags: [
        "CompanyModule",
      ],
    }),
    deleteCompanyModule: builder.mutation({
      query: (id) => ({
        url: `/api/sso/company-modules/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response,
      invalidatesTags: ["CompanyModule"],
    }),
  }),
});

export const {
  useGetCompanyModulesQuery,
  useGetCompanyModulesByCompanyQuery,
  useLazyGetCompanyModulesByCompanyQuery,
  useGetCompanyModulesByCompanyIdQuery,
  useGetCompanyModuleByIdQuery,
  useCreateCompanyModuleMutation,
  useUpdateCompanyModuleMutation,
  useUpdateCompanyModuleStatusMutation,
  useDeleteCompanyModuleMutation,
} = companyModuleApiSlice;

