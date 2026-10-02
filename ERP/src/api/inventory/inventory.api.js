import { baseApi } from '../common/baseApi'

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
      query: (companyIdArg) => ({
        url: '/api/inventory/inventory-stocks',
        params: { companyId: extractId(companyIdArg) },
      }),
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
      query: (companyIdArg) => ({
        url: '/api/inventory/warehouses',
        params: { companyId: extractId(companyIdArg) },
      }),
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
      query: (companyIdArg) => ({
        url: '/api/inventory/stock-transfers',
        params: { companyId: extractId(companyIdArg) },
      }),
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
      query: ({ companyId, role = 'EMPLOYEE' }) => ({
        url: '/api/inventory/dashboard',
        params: { companyId, role },
      }),
      providesTags: ['Inventory'],
    }),
    getProducts: builder.query({
      query: (params) => {
        const { isSystemAdmin, companyId, ...restParams } = params || {};
        const finalParams = { ...restParams };
        if (isSystemAdmin && companyId) {
          finalParams.companyId = companyId;
        }
        return {
          url: '/api/inventory/products',
          params: finalParams,
        };
      },
      providesTags: ['InventoryProducts'],
    }),
    getInventoryStocksByProduct: builder.query({
      query: (params) => {
        const { companyId, productId, ...rest } = params || {};
        const finalParams = { productId, ...rest };
        if (companyId) {
          finalParams.companyId = companyId;
        }
        return {
          url: '/api/inventory/inventory-stocks',
          params: finalParams,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Inventory'],
    }),
    getWarehouseLocations: builder.query({
      query: (params) => {
        const { isSystemAdmin, companyId, warehouseId, ...rest } = params || {};
        const finalParams = { ...rest };

        if (isSystemAdmin && companyId) {
          finalParams.companyId = companyId;
        }
        if (warehouseId) {
          finalParams.warehouseId = warehouseId;
        }

        return {
          url: '/api/inventory/warehouse-locations',
          params: finalParams,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
        };
      },
      providesTags: ['Inventory'],
    }),
    getGroupedStock: builder.query({
      query: (params) => {
        const { isSystemAdmin, companyId, productId, ...rest } = params || {};
        const finalParams = { ...rest };
        
        if (companyId) {
          finalParams.companyId = companyId;
        }
        if (productId) {
          finalParams.productId = productId;
        }
        
        return {
          url: '/api/inventory/integration/stock/products',
          params: finalParams,
          headers: companyId ? { 'X-Company-Id': companyId } : undefined
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
