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



export const adminFilters = {
// ━━━ Modules ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  modules: {
    searchParam: 'search',
    fields: [
      { key: 'status', label: 'Status', type: 'select', priority: true,
        options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] },
    ],
    sortFields: [],
    pagination: PAGESIZE_NOSORT,
  },

// ━━━ Roles ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  roles: {
    searchParam: 'search',
    fields: [
      { key: 'status', label: 'Status', type: 'select', priority: true,
        options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] },
    ],
    sortFields: [
      { label: 'Role Name', value: 'name' },
      { label: 'Created At', value: 'createdAt' }
    ],
    pagination: SPRING_PAGEABLE,
  },

  // ━━━ System Logs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  auditLogs: {
    searchParam: 'searchKey',
    fields: [
      { key: 'moduleName', label: 'Module Name', type: 'select', options: [] },
      { key: 'entityName', label: 'Entity Name', type: 'text' },
      { key: 'entityId', label: 'Entity ID', type: 'text' },
      { key: 'actionType', label: 'Action Type', type: 'select', options: [] },
      { key: 'performedBy', label: 'Performed By', type: 'text' },
      { key: 'ipAddress', label: 'IP Address', type: 'text' },
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' },
      { key: 'isDeleted', label: 'Is Deleted', type: 'select', options: [{label: 'Yes', value: true}, {label: 'No', value: false}] }
    ],
    sortFields: [
      { label: 'Timestamp', value: 'performedAt' },
      { label: 'Action Type', value: 'actionType' },
      { label: 'User', value: 'performedBy' }
    ],
    pagination: SPRING_PAGEABLE,
  },
  systemLogs: {
    searchParam: 'search',
    fields: [
      { key: 'level', label: 'Level', type: 'select', priority: true,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Debug', value: 'debug' },
          { label: 'Info', value: 'info' },
          { label: 'Warn', value: 'warn' },
          { label: 'Error', value: 'error' },
          { label: 'Fatal', value: 'fatal' }
        ] }
    ],
    sortFields: [
      { label: 'Timestamp', value: 'timestamp' },
      { label: 'Level', value: 'level' },
      { label: 'Context', value: 'context' }
    ],
    pagination: SPRING_PAGEABLE,
  },
  sessions: {
    searchParam: 'search',
    fields: [],
    sortFields: [
      { label: 'Username', value: 'name' },
      { label: 'IP Address', value: 'ip' }
    ],
    pagination: SPRING_PAGEABLE,
  },
  portalAccess: {
    searchParam: 'search',
    fields: [
      { key: 'status', label: 'Status', type: 'select', priority: true,
        options: [{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }] },
    ],
    sortFields: [
      { label: 'Date', value: 'createdAt' },
      { label: 'Username', value: 'username' },
      { label: 'Module', value: 'moduleName' }
    ],
    pagination: SPRING_PAGEABLE,
  },
  users: {
    searchParam: 'search',
    fields: [
      { key: 'status', label: 'Status', type: 'select', priority: true,
        options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }, { label: 'Blocked', value: 'BLOCKED' }] },
      { key: 'role', label: 'Role', type: 'select', options: [] }, // Options populated dynamically in UserList.jsx
    ],
    sortFields: [
      { label: 'Name', value: 'name' },
      { label: 'Created At', value: 'created' }
    ],
    pagination: SPRING_PAGEABLE,
    viewConfig: { 
      hiddenKeys: ['id', 'companyId', 'password', 'authorities', 'credentialsNonExpired', 'accountNonExpired', 'accountNonLocked', 'name', 'active', 'created', 'permissions'] 
    },
    updateConfig: {
      fields: [
        { key: 'fullName', label: 'Full Name', type: 'text', required: true, pattern: '^[a-zA-Z\\s\'-]+$', title: 'Letters, spaces, hyphens, and apostrophes only' },
        { key: 'username', label: 'Username', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'text', required: true },
        { key: 'empId', label: 'Employee ID', type: 'text', required: true },
        { key: 'accountStatus', label: 'Account Status', type: 'select', options: [{label: 'ACTIVE', value: 'ACTIVE'}, {label: 'INACTIVE', value: 'INACTIVE'}, {label: 'BLOCKED', value: 'BLOCKED'}] },
        { key: 'emailStatus', label: 'Email Status', type: 'select', options: [{label: 'VERIFIED', value: 'VERIFIED'}, {label: 'UNVERIFIED', value: 'UNVERIFIED'}] },
      ]
    },
    endpoints: {
      getById: (id) => `/api/sso/user/${id}`,
      update: (id) => `/api/sso/user/${id}`,
      updateMethod: 'PUT',
      idField: 'id',
    },
  },

  // ━━━ Companies ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  companies: {
    searchParam: 'search',
    fields: [
      { key: 'status', label: 'Status', type: 'select', priority: true,
        options: [{ label: 'Active', value: 'Active' }, { label: 'Suspended', value: 'Suspended' }] },
    ],
    sortFields: [
      { label: 'Name', value: 'companyName' },
      { label: 'Date Joined', value: 'createdAt' }
    ],
    pagination: EXPLICIT_PAGE_SIZE(),
    viewConfig: { hiddenKeys: ['id', 'isDeleted'] },
    updateConfig: {
      fields: [
        { key: 'companyName', label: 'Company Name', type: 'text', required: true },
        { key: 'companyCode', label: 'Company Code', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'phone', label: 'Phone', type: 'text' },
        { key: 'gstin', label: 'GSTIN', type: 'text' },
        { key: 'baseCurrency', label: 'Base Currency', type: 'text' },
        { key: 'address', label: 'Address', type: 'text' },
        { key: 'active', label: 'Active', type: 'boolean' },
      ],
    },
    endpoints: {
      getById: (id) => `/api/account/companies/${id}`,
      update: (id) => `/api/account/companies/${id}`,
      updateMethod: 'PUT',
      idField: 'id',
    },
  },

};
