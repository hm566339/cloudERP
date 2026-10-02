import { baseApi } from '../common/baseApi';

export const hrApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: ({ companyId, page, pageSize, search }) => ({
        url: "/api/account/employees",
        headers: { "X-Company-Id": companyId },
        params: { page, pageSize, search }
      }),
      transformResponse: (response) => {
        const employees = response?.data?.content || response?.content || response?.data || response || [];
        return {
          employees: Array.isArray(employees) ? employees : [],
          totalPages: response?.totalPages || response?.data?.totalPages || 1
        };
      },
      providesTags: ["HR"],
    }),
    createEmployee: builder.mutation({
      query: (data) => ({
        url: '/api/hr/employees',
        method: 'POST',
        data,
      }),
      invalidatesTags: ["HR"],
    }),
    getAttendance: builder.query({
      query: (companyIdArg) => {
        const extractedId = typeof companyIdArg === 'object' ? companyIdArg.id || companyIdArg.companyId : companyIdArg;
        const companyId = typeof companyIdArg === 'object' ? companyIdArg.companyId : undefined;typeof companyId === 'object' ? companyId.companyId : undefined;
        return {
          url: typeof companyIdArg === 'object' && companyIdArg.url ? companyIdArg.url : `/api/hr/attendance/company/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ["HR"],
    }),
    getLeaveRequests: builder.query({
      query: (companyIdArg) => {
        const extractedId = typeof companyIdArg === 'object' ? companyIdArg.id || companyIdArg.companyId : companyIdArg;
        const companyId = typeof companyIdArg === 'object' ? companyIdArg.companyId : undefined;typeof companyId === 'object' ? companyId.companyId : undefined;
        return {
          url: typeof companyIdArg === 'object' && companyIdArg.url ? companyIdArg.url : `/api/hr/leave-requests/company/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ["HR"],
    }),
    getPayroll: builder.query({
      query: (companyIdArg) => {
        const extractedId = typeof companyIdArg === 'object' ? companyIdArg.id || companyIdArg.companyId : companyIdArg;
        const companyId = typeof companyIdArg === 'object' ? companyIdArg.companyId : undefined;typeof companyId === 'object' ? companyId.companyId : undefined;
        return {
          url: typeof companyIdArg === 'object' && companyIdArg.url ? companyIdArg.url : `/api/hr/payroll/company/${extractedId}`,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ["HR"],
    }),
    processPayroll: builder.mutation({
      query: (data) => ({
        url: '/api/hr/payroll/process',
        method: 'POST',
        data,
      }),
      invalidatesTags: ["HR"],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useGetAttendanceQuery,
  useGetLeaveRequestsQuery,
  useGetPayrollQuery,
  useProcessPayrollMutation,
} = hrApiSlice;

