import { baseApi } from '../common/baseApi'
import {
  isOwnerOrSystemAdminUser,
  getActiveCompanyId,
  buildRoleBasedCompanyParams
} from '../common/roleCompanyContext'

// Helper — extracts a plain UUID string from whatever is passed in
function extractId(arg) {
  if (!arg) return undefined
  if (typeof arg === 'object') return arg.id || arg.companyId
  return arg
}

export const inventoryApiSlice = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // GET /api/inventory/stocks?companyId=<uuid>
    getStocks: builder.query({
      query: (companyIdArg) => {
        const compId = extractId(companyIdArg) || getActiveCompanyId();
        return {
          url: '/api/inventory/inventory-stocks',
          params: buildRoleBasedCompanyParams({}, { companyId: compId }),
        };
      },
      providesTags: ['Inventory'],
    }),
    createStockItem: builder.mutation({
      query: (data) => ({
        url: '/api/inventory/inventory-stocks',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Inventory'],
    }),
    // GET /api/inventory/warehouses?companyId=<uuid>
    getWarehouses: builder.query({
      query: (companyIdArg) => {
        const compId = extractId(companyIdArg) || getActiveCompanyId();
        return {
          url: '/api/inventory/warehouses',
          params: buildRoleBasedCompanyParams({}, { companyId: compId }),
        };
      },
      providesTags: ['Inventory'],
    }),
    createWarehouse: builder.mutation({
      query: (data) => ({
        url: '/api/inventory/warehouses',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Inventory'],
    }),
    // GET /api/inventory/transfers?companyId=<uuid>
    getTransfers: builder.query({
      query: (companyIdArg) => {
        const compId = extractId(companyIdArg) || getActiveCompanyId();
        return {
          url: '/api/inventory/stock-transfers',
          params: buildRoleBasedCompanyParams({}, { companyId: compId }),
        };
      },
      providesTags: ['Inventory'],
    }),
    createTransfer: builder.mutation({
      query: (data) => ({
        url: '/api/inventory/stock-transfers',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Inventory'],
    }),
    // GET /api/inventory/dashboard?companyId=<uuid>&role=<ROLE>
    getInventoryDashboard: builder.query({
      query: ({ companyId, role = 'EMPLOYEE' }) => {
        const compId = companyId || getActiveCompanyId();
        return {
          url: '/api/inventory/dashboard',
          params: buildRoleBasedCompanyParams({ role }, { companyId: compId }),
        };
      },
      providesTags: ['Inventory'],
    }),
    getProducts: builder.query({
      query: (params) => {
        const { isSystemAdmin, companyId, ...restParams } = params || {};
        const isPrivileged = isSystemAdmin || isOwnerOrSystemAdminUser();
        const compId = companyId || getActiveCompanyId();
        return {
          url: '/api/inventory/products',
          params: buildRoleBasedCompanyParams(restParams, { companyId: compId, isPrivileged }),
        };
      },
      providesTags: ['InventoryProducts'],
    }),
    getInventoryStocksByProduct: builder.query({
      query: (params) => {
        const { companyId, productId, ...rest } = params || {};
        const compId = companyId || getActiveCompanyId();
        return {
          url: '/api/inventory/inventory-stocks',
          params: buildRoleBasedCompanyParams({ productId, ...rest }, { companyId: compId }),
          headers: compId ? { 'X-Company-Id': compId } : undefined
        };
      },
      providesTags: ['Inventory'],
    }),
    getWarehouseLocations: builder.query({
      query: (params) => {
        const { isSystemAdmin, companyId, warehouseId, ...rest } = params || {};
        const isPrivileged = isSystemAdmin || isOwnerOrSystemAdminUser();
        const compId = companyId || getActiveCompanyId();
        const initialParams = { ...rest };
        if (warehouseId) initialParams.warehouseId = warehouseId;
        return {
          url: '/api/inventory/warehouse-locations',
          params: buildRoleBasedCompanyParams(initialParams, { companyId: compId, isPrivileged }),
          headers: compId ? { 'X-Company-Id': compId } : undefined
        };
      },
      providesTags: ['Inventory'],
    }),
    getGroupedStock: builder.query({
      query: (params) => {
        const { isSystemAdmin, companyId, productId, ...rest } = params || {};
        const isPrivileged = isSystemAdmin || isOwnerOrSystemAdminUser();
        const compId = companyId || getActiveCompanyId();
        const initialParams = { ...rest };
        if (productId) initialParams.productId = productId;
        return {
          url: '/api/inventory/integration/stock/products',
          params: buildRoleBasedCompanyParams(initialParams, { companyId: compId, isPrivileged }),
          headers: compId ? { 'X-Company-Id': compId } : undefined
        };
      },
      providesTags: ['Inventory'],
    }),
  }),
})

export const {
  useGetStocksQuery,
  useCreateStockItemMutation,
  useGetWarehousesQuery,
  useCreateWarehouseMutation,
  useGetTransfersQuery,
  useCreateTransferMutation,
  useGetInventoryDashboardQuery,
  useGetProductsQuery,
  useGetInventoryStocksByProductQuery,
  useGetWarehouseLocationsQuery,
  useGetGroupedStockQuery,
} = inventoryApiSlice
