import { baseApi } from '../common/baseApi';

export const companyApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCompanies: builder.query({
      query: (params) => {
        const safeParams = {
          page: params?.page ?? 0,
          pageSize: params?.pageSize ?? 200,
        };
        if (params?.search) safeParams.search = params.search;
        if (params?.active !== undefined) safeParams.active = params.active;
        return {
          url: "/api/sso/company",
          method: "GET",
          params: safeParams,
        };
      },
      transformResponse: (response) => {
        let companies = [];
        if (Array.isArray(response)) companies = response;
        else if (Array.isArray(response?.companies))
          companies = response.companies;
        else if (Array.isArray(response?.data)) companies = response.data;
        else companies = response?.company || response?.content || [];

        const mappedCompanies = companies.map((c) => ({
          ...c,
          id: c.id || c.companyId,
          name: c.companyName || c.name,
          code: c.companyCode || c.code,
          legalName: c.legalName || "",
          companyType: c.companyType || "",
          gstin: c.gstin || "",
          pan: c.pan || "",
          email: c.email || "",
          phone: c.phone || "",
          website: c.website || "",
          address: c.addressLine1 || "",
          addressLine2: c.addressLine2 || "",
          city: c.city || "",
          state: c.state || "",
          country: c.country || "",
          postalCode: c.postalCode || "",
          baseCurrency: c.baseCurrency || "INR",
          logoUrl: c.logoUrl || "",
          active: c.active !== undefined ? c.active : true,
          domain: c.email && c.email.includes("@") ? c.email.split("@")[1] : "kasdenge.com",
          created: c.createdAt ? c.createdAt.split("T")[0] : "",
          updated: c.updatedAt ? c.updatedAt.split("T")[0] : "",
        }));

        return {
          companies: mappedCompanies,
          pagination: response._pageInfo || response.pagination || null,
          totalPages: response._pageInfo?.totalPages || response.pagination?.totalPages || response?.totalPages || 1,
          size: response._pageInfo?.size || response.pagination?.size || response?.size || 10,
          number: response._pageInfo?.number || response.pagination?.number || response?.number || 0,
          totalElements: response._pageInfo?.totalElements || response.pagination?.totalElements || response?.totalElements || mappedCompanies.length,
          totalCount: response._pageInfo?.totalElements || response.pagination?.totalElements || response?.totalElements || mappedCompanies.length
        };
      },
      providesTags: ["Company"],
    }),
    getOpenCompanies: builder.query({
      query: () => ({
        url: "/api/sso/company/open",
        method: "GET",
      }),
      transformResponse: (response) => {
        let companies = [];
        if (Array.isArray(response)) companies = response;
        else if (Array.isArray(response?.data)) companies = response.data;
        
        return companies
          .filter((c) => {
            // Exclude internal system company from user-facing lists
            const code = c.companyCode || c.code || '';
            return code !== '00000';
          })
          .map((c) => ({
            ...c,
            id: c.companyCode,
            name: c.companyName || c.name,
            code: c.companyCode || c.code,
          }));
      },
      providesTags: ["Company"],
    }),
    getCompanyById: builder.query({
      query: (id) => ({
        url: `/api/sso/company/${id}`,
        method: "GET",
      }),
      transformResponse: (response) => {
        // response is the company object after client.js unwraps {success, data}
        const c = response;
        return c
          ? {
              ...c,
              name: c.companyName || c.name,
              code: c.companyCode || c.code,
              legalName: c.legalName || "",
              companyType: c.companyType || "",
              gstin: c.gstin || "",
              pan: c.pan || "",
              email: c.email || "",
              phone: c.phone || "",
              website: c.website || "",
              address: c.addressLine1 || "",
              addressLine2: c.addressLine2 || "",
              city: c.city || "",
              state: c.state || "",
              country: c.country || "",
              postalCode: c.postalCode || "",
              baseCurrency: c.baseCurrency || "INR",
              logoUrl: c.logoUrl || "",
              active: c.active !== undefined ? c.active : true,
              domain: c.email && c.email.includes("@") ? c.email.split("@")[1] : "kasdenge.com",
              created: c.createdAt ? c.createdAt.split("T")[0] : "",
              updated: c.updatedAt ? c.updatedAt.split("T")[0] : "",
            }
          : null;
      },
      providesTags: (result, error, id) => [{ type: "Company", id }],
    }),
    getCompanyByCode: builder.query({
      query: (companyCode) => ({
        url: `/api/sso/company/code/${companyCode}`,
        method: "GET",
      }),
      transformResponse: (response) => {
        const c = response;
        return c
          ? {
              ...c,
              name: c.companyName || c.name,
              code: c.companyCode || c.code,
              legalName: c.legalName || "",
              companyType: c.companyType || "",
              gstin: c.gstin || "",
              pan: c.pan || "",
              email: c.email || "",
              phone: c.phone || "",
              website: c.website || "",
              address: c.addressLine1 || "",
              addressLine2: c.addressLine2 || "",
              city: c.city || "",
              state: c.state || "",
              country: c.country || "",
              postalCode: c.postalCode || "",
              baseCurrency: c.baseCurrency || "INR",
              logoUrl: c.logoUrl || "",
              active: c.active !== undefined ? c.active : true,
              domain: c.email && c.email.includes("@") ? c.email.split("@")[1] : "kasdenge.com",
              created: c.createdAt ? c.createdAt.split("T")[0] : "",
              updated: c.updatedAt ? c.updatedAt.split("T")[0] : "",
            }
          : null;
      },
      providesTags: ["Company"],
    }),
    createCompany: builder.mutation({
      query: (data) => {
        const payload = {
          companyCode: data.code,
          companyName: data.name,
          modulesid: data.modulesid,
          legalName: data.legalName,
          companyType: data.companyType,
          gstin: data.gstin,
          pan: data.pan,
          active: data.active ?? true,
          email: data.email || (data.domain ? `admin@${data.domain}` : undefined),
          phone: data.phone,
          website: data.website,
          addressLine1: data.address,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          country: data.country,
          baseCurrency: data.baseCurrency || "INR",
          postalCode: data.postalCode,
        };

        const formData = new FormData();
        const requestBlob = new Blob([JSON.stringify({ data: payload })], {
          type: "application/json"
        });
        formData.append("request", requestBlob);

        if (data.logo) {
          formData.append("logo", data.logo);
        }

        return {
          url: "/api/sso/company",
          method: "POST",
          data: formData,
        };
      },
      transformResponse: (response) => response,
      invalidatesTags: ["Company"],
    }),
    updateCompany: builder.mutation({
      query: (payload_arg) => { 
        const { id, ...data } = payload_arg; 
        
        const payload = {
          companyCode: data.code || data.companyCode,
          companyName: data.name || data.companyName,
          modulesid: data.modulesid,
          legalName: data.legalName,
          companyType: data.companyType,
          gstin: data.gstin,
          pan: data.pan,
          active: data.active,
          email: data.email || (data.domain ? `admin@${data.domain}` : undefined),
          phone: data.phone,
          website: data.website,
          addressLine1: data.address,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          country: data.country,
          baseCurrency: data.baseCurrency || "INR",
          postalCode: data.postalCode,
        };

        const formData = new FormData();
        const requestBlob = new Blob([JSON.stringify({ data: payload })], {
          type: "application/json"
        });
        formData.append("request", requestBlob);

        if (data.logo) {
          // Send logo only if it is a File object (meaning it was updated)
          if (data.logo instanceof File || data.logo instanceof Blob) {
             formData.append("logo", data.logo);
          }
        }
        
        return {
          url: `/api/sso/company/${id}`,
          method: "PUT",
          data: formData,
        }; 
      },
      transformResponse: (response) => response,
      invalidatesTags: (result, error, { id }) => [
        { type: "Company", id },
        "Company",
      ],
    }),
    deleteCompany: builder.mutation({
      query: (id) => ({
        url: `/api/sso/company/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response,
      invalidatesTags: ["Company"],
    }),
    getAccountCompanies: builder.query({
      query: (params) => ({
        url: '/api/account/companies',
        params,
      }),
      providesTags: ["Company"],
    }),
    createAccountCompany: builder.mutation({
      query: (payload) => ({
        url: '/api/account/companies',
        method: "POST",
        data: payload,
      }),
      invalidatesTags: ["Company"],
    }),
    getAccountCompanyById: builder.query({
      query: (id) => {
        const extractedId = typeof id === 'object' ? id.id || id.id : id;
        const companyId = typeof id === 'object' ? id.companyId : undefined;
        return {
          url: typeof id === 'object' && id.url ? id.url : `/api/account/companies/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ["Company"],
    }),
    updateAccountCompany: builder.mutation({
      query: (payload) => { 
        const { id, ...data } = payload; 
        return {
          url: `/api/account/companies/${id}`,
          method: "PUT",
          data: data, // Send only the fields without the id in the body
        }; 
      },
      invalidatesTags: ["Company"],
    }),
    deleteAccountCompany: builder.mutation({
      query: (id) => ({
        url: `/api/account/companies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Company"],
    }),
    updateCompanyStatus: builder.mutation({
      query: ({ id, active }) => ({
        url: `/api/sso/company/${id}/status`,
        method: "PATCH",
        params: { active },
      }),
      transformResponse: (response) => response,
      invalidatesTags: (result, error, { id }) => [
        { type: "Company", id },
        "Company",
      ],
    }),
  }),
});

export const {
  useGetCompaniesQuery,
  useGetOpenCompaniesQuery,
  useGetCompanyByIdQuery,
  useGetCompanyByCodeQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useGetAccountCompaniesQuery,
  useCreateAccountCompanyMutation,
  useGetAccountCompanyByIdQuery,
  useUpdateAccountCompanyMutation,
  useDeleteAccountCompanyMutation,
  useUpdateCompanyStatusMutation,
} = companyApiSlice;
