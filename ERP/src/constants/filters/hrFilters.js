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



export const hrFilters = {
  // ━━━ Employees ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  employees: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'On Leave', value: 'On Leave' },
          { label: 'Inactive', value: 'Inactive' }
        ]
      },
      { key: 'department', label: 'Department', type: 'select', options: [] },
      { key: 'designation', label: 'Designation', type: 'select', options: [] }
    ],
    sortFields: [
      { label: 'Name', value: 'name' },
      { label: 'Join Date', value: 'joinDate' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

  // ━━━ Attendance ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  attendance: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Present', value: 'Present' },
          { label: 'Absent', value: 'Absent' },
          { label: 'Half Day', value: 'Half Day' },
          { label: 'On Leave', value: 'On Leave' }
        ]
      }
    ],
    sortFields: [
      { label: 'Name', value: 'name' },
      { label: 'Total Hours', value: 'hours' },
      { label: 'Check In', value: 'checkIn' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

  // ━━━ Leave Requests ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  leaveRequests: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Pending', value: 'Pending' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Rejected', value: 'Rejected' }
        ]
      },
      {
        key: 'type', label: 'Type', type: 'select', priority: true,
        options: [
          { label: 'Sick Leave', value: 'Sick Leave' },
          { label: 'Casual Leave', value: 'Casual Leave' },
          { label: 'Annual Leave', value: 'Annual Leave' }
        ]
      }
    ],
    sortFields: [
      { label: 'Employee', value: 'employee' },
      { label: 'Days', value: 'days' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

  // ━━━ Payroll ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  payroll: {
    searchParam: 'search',
    fields: [
      {
        key: 'status', label: 'Status', type: 'select', priority: true,
        options: [
          { label: 'Processed', value: 'Processed' },
          { label: 'Pending', value: 'Pending' }
        ]
      }
    ],
    sortFields: [
      { label: 'Name', value: 'name' },
      { label: 'Net Salary', value: 'net' }
    ],
    pagination: { pageParam: 'page', sizeParam: 'pageSize', sortStyle: 'explicit', sortByParam: 'sortBy', dirParam: 'sortDirection' },
  },

};
