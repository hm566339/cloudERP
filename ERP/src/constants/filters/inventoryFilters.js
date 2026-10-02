/**
 * Filter Configurations — API-driven filter/sort/pagination configs for every list endpoint.
 *
 * Each key maps a resource name to:
 *   - fields[]:        filter controls rendered in the filter bar
 *   - sortFields[]:    sort dropdown options
 *   - pagination:      how this endpoint's pagination/sort query params are named
 *   - viewConfig:      field display config for View Details modal
 *   - updateConfig:    field config for Update modal form
 *   - endpoints:       route helpers for get-by-id / update
 *
 * Field types: 'text' | 'select' | 'date' | 'boolean' | 'number'
 * Sort styles: 'spring' (single `sort=field,dir`) | 'explicit' (separate sortBy + direction params)
 */

// ─── Pagination Presets ──────────────────────────────────────────────
const SPRING_PAGEABLE = { pageParam: 'page', sizeParam: 'size', sortStyle: 'spring', sortParam: 'sort' };
const EXPLICIT_PAGE_SIZE = (sortByParam = 'sortBy', dirParam = 'sortDirection') => ({
  pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam, dirParam,
});
// Type B variant: page+size+sortBy+sortDir (flat)
const FLAT_PAGE_SIZE_SORT = (sortByParam = 'sortBy', dirParam = 'sortDir') => ({
  pageParam: 'page', sizeParam: 'size', sortStyle: 'explicit', sortByParam, dirParam,
});
// Type C: page+pageSize only, no sort (server decides)
const PAGESIZE_NOSORT = { pageParam: 'page', sizeParam: 'pageSize' };

// ─── Helper: format enum values for display ──────────────────────────
const enumOptions = (values) => values.map(v => ({ label: v.replace(/_/g, ' '), value: v }));

// ─── FILTER CONFIGS ──────────────────────────────────────────────────



export const inventoryFilters = {
  // ━━━ Warehouses ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  warehouses: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' }
        ]
      },
      {
        key: 'type', label: 'Type', type: 'select', priority: true,
        options: [
          { label: 'Main', value: 'Main' },
          { label: 'Branch', value: 'Branch' },
          { label: 'Storage', value: 'Storage' }
        ]
      }
    ],
    sortFields: [
      { label: 'Name', value: 'name' },
      { label: 'Code', value: 'code' },
      { label: 'Capacity', value: 'capacity' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

  // ━━━ Stocks ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  stocks: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'In Stock', value: 'In Stock' },
          { label: 'Low Stock', value: 'Low Stock' },
          { label: 'Out of Stock', value: 'Out of Stock' }
        ]
      },
      { key: 'category', label: 'Category', type: 'select', options: [] }
    ],
    sortFields: [
      { label: 'Name', value: 'name' },
      { label: 'Stock', value: 'stock' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

  // ━━━ Stock Transfers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  stockTransfers: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Draft', value: 'Draft' },
          { label: 'In Transit', value: 'In Transit' },
          { label: 'Completed', value: 'Completed' }
        ]
      }
    ],
    sortFields: [
      { label: 'Date', value: 'date' },
      { label: 'Quantity', value: 'quantity' },
      { label: 'Item', value: 'item' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

  // ━━━ Low Stock Alerts ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  lowStockAlerts: {
    searchParam: 'search',
    fields: [],
    sortFields: [
      { label: 'Quantity', value: 'quantity' },
      { label: 'Name', value: 'name' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

};
