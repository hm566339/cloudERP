# Reusable Generic DataTable Component System

A modular, production-ready, enterprise-grade `DataTable` system for React.

## Key Features

- **Domain-Agnostic**: Contains zero entity-specific logic; works for Customers, Vendors, Accounts, Products, Orders, Invoices, Users, etc.
- **Config-Driven Columns**: Define keys (`id` or `key`), labels, custom `render(value, row, index)` renderers, alignment (`left`, `center`, `right`), and sortability.
- **Search & Filter Toolbar**: Built-in quick search (with clear button & quick action dropdown), custom basic filters, reset button, and column visibility selector.
- **Expandable Advanced Filters**: Grouped filter fields (e.g. Identification, Location, Dates) with active count badges.
- **Server-Side & Client-Side**: Controlled callbacks (`onSortChange`, `onPageChange`, `onFilterChange`, `onSearchChange`) fit any REST or GraphQL backend.
- **Row Actions**: Contextual right-aligned action buttons (View, Edit, Delete, Toggle Status) with tooltips, permission control (`RequirePermission`), and danger variants.
- **Sub-row Expansion**: Flexible `renderExpandedRow(row, index)` drawer for detailed entity overview cards.
- **Loading & Empty States**: Polished animated skeleton rows and clean empty state with reset trigger.
- **Pagination**: Enterprise-grade pagination bar with rows-per-page selector, record count range, and page numbers.
- **Responsive**: Smooth horizontal table scrolling, sticky action columns, and mobile-friendly filter collapsing.

---

## Component API Reference

```jsx
import DataTable, { DataTableStatusBadge } from '@/components/data-table';

<DataTable
  // Data
  columns={columns}                  // Array of column definitions
  data={items}                       // Array of data records
  rowKey="id"                        // Primary key field (default: 'id')
  loading={isLoading}                // Shows animated skeleton rows
  isRefreshing={isFetching}          // Spins refresh icon in toolbar

  // Search
  searchable                         // Enables search input
  searchValue={searchValue}          // Controlled search value
  searchPlaceholder="Search..."      // Custom placeholder
  onSearchChange={handleSearchChange}// Search callback (e.g. debounced or immediate)
  searchAction={(term) => JSX}       // Optional quick dropdown action

  // Basic Filters
  filters={basicFilters}             // Inline toolbar filters (select, text, number, date)
  filterValues={filterValues}        // Key-value map of active filter values
  onFilterChange={(key, val) => ...} // Filter update handler

  // Advanced Filters
  advancedFilters={groupedFilters}   // Collapsible grouped filter drawer configuration

  // Toolbar Actions
  onReset={handleReset}              // Reset all filters callback
  onRefresh={handleRefresh}          // Refetch data callback
  onExport={handleExport}            // Export trigger callback
  headerActions={JSX}                // Optional extra toolbar controls

  // Column Visibility
  visibleColumns={visibleColumns}    // Array of active column IDs
  onVisibleColumnsChange={setCols}   // Column visibility update handler

  // Sorting
  sort={{ key: sortBy, direction }}  // Active sort state: 'asc' | 'desc'
  onSortChange={({ key }) => ...}    // Sort request handler

  // Row Actions
  rowActions={rowActions}            // Contextual row action buttons

  // Sub-row Expansion
  expandedRowId={expandedId}         // ID of currently expanded row
  onToggleExpand={(id) => ...}       // Expansion toggle callback
  renderExpandedRow={(row) => JSX}   // Custom sub-row drawer content

  // Pagination
  pagination={{
    page: 0,
    pageSize: 10,
    totalPages: 5,
    totalElements: 50
  }}
  pageIndexBase={0}                  // 0 for 0-indexed APIs, 1 for 1-indexed APIs
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  itemName="records"                 // Text in "Showing 1 to 10 of 50 records"

  // Empty State
  emptyMessage="No records found"
  emptyDescription="Try adjusting your search keywords or filter criteria."
/>
```

---

## Practical Examples Across the Application

### 1. Customer Management Example

```jsx
const customerColumns = [
  {
    id: 'customerCode',
    label: 'Code',
    sortable: true,
    render: (val, row) => (
      <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
        {row.customerCode || '-'}
      </span>
    )
  },
  { id: 'customerName', label: 'Customer Name', sortable: true },
  {
    id: 'contact',
    label: 'Contact',
    render: (val, row) => (
      <div className="flex flex-col">
        <span className="text-zinc-800 font-medium">{row.email || '-'}</span>
        <span className="text-zinc-500 text-xs">{row.phone || '-'}</span>
      </div>
    )
  },
  {
    id: 'outstandingBalance',
    label: 'Outstanding',
    sortable: true,
    align: 'right',
    render: (val, row) => (
      <span className={`font-mono font-medium ${row.outstandingBalance > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
        ₹{row.outstandingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
      </span>
    )
  },
  {
    id: 'status',
    label: 'Status',
    sortable: true,
    sortKey: 'isActive',
    align: 'center',
    render: (val, row) => <DataTableStatusBadge status={row.isActive} />
  }
];
```

---

### 2. Vendor Management Example

```jsx
const vendorColumns = [
  {
    id: 'vendorCode',
    label: 'Code',
    sortable: true,
    render: (val, row) => (
      <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
        {row.vendorCode || '-'}
      </span>
    )
  },
  { id: 'vendorName', label: 'Vendor Name', sortable: true },
  {
    id: 'contact',
    label: 'Contact',
    render: (val, row) => (
      <div className="flex flex-col">
        <span className="text-zinc-800 font-medium">{row.email || '-'}</span>
        <span className="text-zinc-500 text-xs">{row.phone || '-'}</span>
      </div>
    )
  },
  {
    id: 'creditLimit',
    label: 'Credit Limit',
    sortable: true,
    align: 'right',
    render: (val, row) => (
      <span className="font-mono text-zinc-900 font-medium">
        {row.creditLimit ? `₹${row.creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
      </span>
    )
  },
  {
    id: 'outstandingBalance',
    label: 'Outstanding',
    sortable: true,
    align: 'right',
    render: (val, row) => (
      <span className={`font-medium font-mono ${row.outstandingBalance > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
        {row.outstandingBalance ? `₹${row.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₹0.00'}
      </span>
    )
  },
  {
    id: 'status',
    label: 'Status',
    sortable: true,
    sortKey: 'isActive',
    align: 'center',
    render: (val, row) => <DataTableStatusBadge status={row.isActive} />
  }
];
```

---

### 3. Chart of Accounts Example

```jsx
const accountColumns = [
  {
    id: 'accountCode',
    label: 'Code',
    sortable: true,
    render: (val, row) => (
      <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-800 font-bold border border-zinc-200/60">
        {row.accountCode || '-'}
      </span>
    )
  },
  { id: 'accountName', label: 'Account Name', sortable: true },
  { id: 'groupName', label: 'Group Name', sortable: true },
  {
    id: 'parentAccount',
    label: 'Parent Account',
    render: (val, row) => <span className="text-zinc-500 text-xs">{row.parentAccountName || '-'}</span>
  },
  {
    id: 'accountType',
    label: 'Type',
    sortable: true,
    render: (val, row) => (
      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-blue-50 text-blue-700 border-blue-200">
        {row.accountType || '-'}
      </span>
    )
  },
  {
    id: 'openingBalance',
    label: 'Balance',
    sortable: true,
    align: 'right',
    render: (val, row) => (
      <span className="font-mono text-zinc-900 font-semibold">
        ₹{(row.currentBalance ?? row.openingBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </span>
    )
  },
  {
    id: 'postingAllowed',
    label: 'Posting',
    sortable: true,
    align: 'center',
    render: (val, row) => (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${row.postingAllowed ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-50 text-zinc-400'}`}>
        {row.postingAllowed ? 'Yes' : 'No'}
      </span>
    )
  },
  {
    id: 'isActive',
    label: 'Status',
    sortable: true,
    align: 'center',
    render: (val, row) => <DataTableStatusBadge status={row.isActive} />
  }
];
```

---

### 4. Account Groups Example (with Table/Tree View Support)

```jsx
const groupColumns = [
  {
    id: 'code',
    label: 'Code',
    sortable: true,
    render: (val, row) => (
      <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-800 font-semibold border border-zinc-200/60">
        {row.code || '-'}
      </span>
    )
  },
  { id: 'name', label: 'Group Name', sortable: true },
  { id: 'categoryName', label: 'Category', sortable: true },
  {
    id: 'parentGroupName',
    label: 'Parent Group',
    sortable: true,
    render: (val, row) => (
      row.parentGroupName ? (
        <span className="text-zinc-700">{row.parentGroupName}</span>
      ) : (
        <span className="text-zinc-400 italic text-xs">Root</span>
      )
    )
  },
  {
    id: 'deleted',
    label: 'Status',
    sortable: true,
    align: 'center',
    render: (val, row) => (
      <DataTableStatusBadge status={!row.deleted} activeLabel="Active" inactiveLabel="Deleted" />
    )
  }
];
```

---

### 5. Account Categories Example

```jsx
const categoryColumns = [
  {
    id: 'code',
    label: 'Code',
    sortable: true,
    render: (val, row) => (
      <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-800 font-semibold border border-zinc-200/60">
        {row.code || '-'}
      </span>
    )
  },
  { id: 'name', label: 'Category Name', sortable: true },
  {
    id: 'nature',
    label: 'Nature',
    sortable: true,
    render: (val, row) => (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${row.nature === 'DEBIT' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
        {row.nature || '-'}
      </span>
    )
  },
  {
    id: 'createdAt',
    label: 'Created At',
    sortable: true,
    render: (val, row) => (
      <span className="text-zinc-600 text-xs">
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
      </span>
    )
  },
  {
    id: 'isDeleted',
    label: 'Status',
    sortable: true,
    align: 'center',
    render: (val, row) => (
      <DataTableStatusBadge status={!row.isDeleted} activeLabel="Active" inactiveLabel="Deleted" />
    )
  }
];
```

---

### 6. Accounting Periods Example

```jsx
const periodColumns = [
  {
    id: 'periodNumber',
    label: 'No.',
    sortable: true,
    align: 'center',
    render: (val, row) => (
      <span className="font-mono text-xs text-zinc-500 font-semibold">
        #{row.periodNumber ?? '-'}
      </span>
    )
  },
  { id: 'periodName', label: 'Period Name', sortable: true },
  {
    id: 'periodType',
    label: 'Type',
    sortable: true,
    render: (val, row) => (
      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-zinc-50 text-zinc-700 border-zinc-200">
        {row.periodType || '-'}
      </span>
    )
  },
  { id: 'startDate', label: 'Start Date', sortable: true },
  { id: 'endDate', label: 'End Date', sortable: true },
  {
    id: 'status',
    label: 'Status',
    sortable: true,
    align: 'center',
    render: (val, row) => {
      const isOpen = row.status === 'OPEN';
      const isLocked = row.status === 'LOCKED';
      return (
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 ${
          isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          isLocked ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-zinc-100 text-zinc-600 border-zinc-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : isLocked ? 'bg-red-500' : 'bg-zinc-400'}`} />
          {row.status}
        </span>
      );
    }
  }
];
```

---

### 7. Fiscal Years Example

```jsx
const fiscalYearColumns = [
  {
    id: 'fiscalYear',
    label: 'Fiscal Year',
    sortable: true,
    render: (val, row) => (
      <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
        <Calendar size={13} className="text-zinc-400" />
        {row.fiscalYear || '-'}
      </span>
    )
  },
  { id: 'companyName', label: 'Company Name', sortable: true },
  { id: 'startDate', label: 'Start Date', sortable: true },
  { id: 'endDate', label: 'End Date', sortable: true },
  {
    id: 'isClosed',
    label: 'Status',
    sortable: true,
    align: 'center',
    render: (val, row) => (
      <DataTableStatusBadge status={!row.isClosed} activeLabel="Open" inactiveLabel="Closed" />
    )
  },
  {
    id: 'duration',
    label: 'Duration',
    render: (val, row) => (
      <span className="text-xs text-zinc-500 font-medium">
        {getDuration(row.startDate, row.endDate)}
      </span>
    )
  }
];
```

---

### 8. Expense Categories Example

```jsx
const expenseCategoryColumns = [
  {
    id: 'categoryCode',
    label: 'Code',
    sortable: true,
    render: (val, row) => (
      <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
        {row.categoryCode || '-'}
      </span>
    )
  },
  {
    id: 'categoryName',
    label: 'Name',
    sortable: true,
    render: (val, row) => (
      <span className="font-semibold text-zinc-900">{row.categoryName || '-'}</span>
    )
  },
  {
    id: 'description',
    label: 'Description',
    sortable: false,
    render: (val, row) => (
      <span className="text-zinc-600 truncate max-w-xs block" title={row.description || ''}>
        {row.description || '-'}
      </span>
    )
  },
  {
    id: 'status',
    label: 'Status',
    sortable: true,
    align: 'center',
    render: (val, row) => (
      <DataTableStatusBadge
        status={row.isActive ? 'ACTIVE' : 'INACTIVE'}
      />
    )
  }
];
```

---

## Row Selection & Selected Export

The DataTable features an enterprise-grade row selection system supporting single row selection, current-page bulk selection with an indeterminate checkbox, cross-page selection persistence, and selective export.

### Selection Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `selectable` | `boolean` | `false` | Enables selection checkbox column on the left of the table. |
| `rowKey` | `string \| function` | `'id'` | Unique key field on each row object or function `(row, index) => string`. |
| `selectedRows` | `string[]` | `[]` | Controlled array of selected row IDs. |
| `onSelectionChange` | `(keys, objects) => void` | `undefined` | Callback fired when selection changes with updated keys and row objects. |
| `bulkActions` | `Array` | `[]` | Optional bulk action buttons displayed in the toolbar when rows are selected. |

### Features

1. **Compact Enterprise Checkboxes**:
   - 16px square checkboxes with subtle rounded corners and accessible ARIA labels.
   - Always visible on the left; **never** hidden by the Column Visibility menu.
   - Selection column clicks stop event propagation to avoid accidental row expansion or row navigation.

2. **Select All with Indeterminate State**:
   - Checkbox in the table header selects or deselects all visible rows on the **current page**.
   - If some visible rows are selected, the header checkbox enters the standard HTML5 `indeterminate` state.
   - Preserves selections made on other pages when paginating.

3. **Selection Summary & Clear**:
   - When 1 or more rows are selected, a sleek `X selected` indicator badge appears in the toolbar with a quick clear (✕) button.

4. **Export Selected Records**:
   - The toolbar Export button dynamically indicates selected count (e.g. `Export (3)`).
   - Seamlessly integrates with `<ExportModal />`:
     ```jsx
     <ExportModal
       isOpen={isExportModalOpen}
       onClose={() => setIsExportModalOpen(false)}
       reportName="customermanagement-export"
       selectedIds={selectedRows}
       selectedCount={selectedRows.length}
     />
     ```
   - When rows are selected, the modal scope clearly indicates `{selectedCount} records selected only` and the export payload sends `selectedIds: [...]`.
   - When 0 rows are selected, normal full dataset export executes.

### Complete Example

```jsx
import React, { useState } from 'react';
import DataTable from '@/components/data-table';
import ExportModal from '@/components/common/ExportModal';

export default function CustomerManagement() {
  const [selectedRows, setSelectedRows] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div>
      <DataTable
        selectable
        rowKey="id"
        selectedRows={selectedRows}
        onSelectionChange={(keys, objects) => {
          setSelectedRows(keys);
        }}
        columns={columns}
        data={customers}
        onExport={() => setIsExportModalOpen(true)}
        bulkActions={[
          {
            key: 'delete',
            label: 'Delete Selected',
            icon: <Trash2 size={14} />,
            onClick: (keys) => handleBulkDelete(keys),
            className: 'text-red-600 hover:bg-red-50 border-red-200'
          }
        ]}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="customers-export"
        selectedIds={selectedRows}
        selectedCount={selectedRows.length}
      />
    </div>
  );
}
```


