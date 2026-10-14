import React from 'react'
import { Pencil, Trash2, Copy, CheckCircle2, XCircle, Power, PowerOff } from 'lucide-react'
import SortableHeader from '../../../../components/common/SortableHeader'
import { copyToClipboard } from '../../../utils/clipboard'

export default function CustomerTable({ 
  customers = [], 
  loading = false, 
  onEdit, 
  onDelete, 
  onView, 
  onToggleStatus, 
  onSort,
  sortBy,
  sortOrder,
  page = 0,
  pageSize = 10
}) {
  const handleSort = (field) => {
    if (!onSort) return;
    onSort(field);
  };

  const handleCopyCell = async (e, text) => {
    e.stopPropagation();
    try {
      await copyToClipboard(text);
    } catch (error) {
      // Clipboard unavailable in this context; ignore silently.
    }
  };

  const renderRows = () => {
    if (loading) {
      return [...Array(8)].map((_, idx) => (
        <tr key={idx} className="animate-pulse">
          <td className="text-center font-medium text-zinc-500">{(page * pageSize) + idx + 1}</td>
          {[...Array(9)].map((__ , cell) => (
            <td key={cell} className="px-4 py-3 h-14 bg-zinc-100 rounded-md border-b border-zinc-200" />
          ))}
        </tr>
      ))
    }

    if (customers.length === 0) {
      return (
        <tr>
          <td className="text-center font-medium text-zinc-500">1</td>
          <td colSpan={10} className="px-6 py-12 text-center text-zinc-500 font-medium">
            No customers found. Try adjusting your filters.
          </td>
        </tr>
      );
    }

    return customers.map((customer, index) => (
      <tr 
        key={customer.id} 
        className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors group cursor-pointer"
        onClick={() => onView(customer)}
      >
        <td className="text-center font-medium text-zinc-500">{(page * pageSize) + index + 1}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-zinc-700">{customer.customerCode}</span>
            <button 
              onClick={(e) => handleCopyCell(e, customer.customerCode)}
              className="text-zinc-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              title="Copy Code"
            >
              <Copy size={14} />
            </button>
          </div>
        </td>
        <td className="px-4 py-3 text-sm font-medium text-zinc-900 truncate max-w-[160px]">
          {customer.customerName}
          <div className="text-xs text-zinc-500 font-normal mt-0.5">{customer.email || customer.phone || 'No Contact Info'}</div>
        </td>
        <td className="px-4 py-3 text-sm text-zinc-600 uppercase">
          {customer.gstin || customer.panNo || '—'}
        </td>
        <td className="px-4 py-3 text-sm text-zinc-600">
          {customer.city ? `${customer.city}${customer.state ? `, ${customer.state}` : ''}` : '—'}
        </td>
        <td className="px-4 py-3 text-sm font-mono text-right text-zinc-600">
          {customer.creditLimit != null ? `₹${Number(customer.creditLimit).toLocaleString()}` : '—'}
        </td>
        <td className="px-4 py-3 text-sm font-mono text-right font-medium text-zinc-900">
          {customer.outstandingBalance != null ? `₹${Number(customer.outstandingBalance).toLocaleString()}` : '0'}
        </td>
        <td className="px-4 py-3 text-sm font-mono text-right font-medium text-green-600">
          {customer.availableCredit != null ? `₹${Number(customer.availableCredit).toLocaleString()}` : '0'}
        </td>
        <td className="px-4 py-3">
          <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
            customer.isActive 
              ? 'bg-green-50 text-green-700 border border-green-200/50' 
              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
          }`}>
            {customer.isActive ? <CheckCircle2 size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
            {customer.isActive ? 'Active' : 'Inactive'}
          </div>
        </td>
        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onToggleStatus(customer)} className={`p-1.5 rounded-md transition-colors ${customer.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`} title={customer.isActive ? "Deactivate" : "Activate"}>
              {customer.isActive ? <PowerOff size={16} /> : <Power size={16} />}
            </button>
            <button onClick={() => onEdit(customer)} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors" title="Edit">
              <Pencil size={16} />
            </button>
            <button onClick={() => onDelete(customer)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    ))
  }

  return (
    <div className="erp-table-container">
      <table className="erp-table">
        <thead className="bg-zinc-50 border-b border-zinc-200">
          <tr>
                <th className="w-12 text-center">S.No.</th>
            <SortableHeader field="customerCode" label="Code" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            <SortableHeader field="customerName" label="Customer" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            <SortableHeader field="gstin" label="Tax IDs" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            <SortableHeader field="city" label="Location" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            <SortableHeader field="creditLimit" label="Credit Limit" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="right" />
            <SortableHeader field="outstandingBalance" label="Outstanding" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="right" />
            <SortableHeader field="availableCredit" label="Available" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="right" />
            <SortableHeader field="isActive" label="Status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            <th className="px-4 py-3 w-32"></th>
          </tr>
        </thead>
        <tbody className="staggered-list">{renderRows()}</tbody>
      </table>
    </div>
  )
}
