import SortableHeader from '../../../components/common/SortableHeader';
import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import Pagination from '../../../components/common/Pagination'
import { Search, Plus, Filter, FileText } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetInvoiceTaxesQuery } from '../../../api/sales-crm'

export default function InvoiceTaxes() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState(null)
  const [sortOrder, setSortOrder] = useState(null)

  const { data: apiData = [], isLoading } = useGetInvoiceTaxesQuery(companyId)

  const handleSort = (field) => {
    if (sortBy === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else { setSortBy(null); setSortOrder(null); }
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  let filteredData = apiData.filter(d => 
    JSON.stringify(d).toLowerCase().includes(search.toLowerCase())
  )

  if (sortBy) {
    filteredData.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (valA == null) valA = '';
      if (valB == null) valB = '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const [page, setPage] = useState(0)
  const pageSize = 10
  const displayedData = filteredData.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(filteredData.length / pageSize)

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice Taxes</h1>
          <p className="page-subtitle">Manage invoice taxes</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary"><Filter size={15} /> Filter</button>
          <button className="btn-primary"><Plus size={15} /> Add New</button>
        </div>
      </div>

      <div className="card p-4 flex gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className="input-field pl-9"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="erp-table-container">
        {isLoading ? (
          <div className="p-6 w-full"><TableSkeleton columns={5} rows={3} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">S.No.</th>
                  <SortableHeader field="invoiceNumber" label="Invoice No" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader field="taxType" label="Tax Type" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader field="rate" label="Rate (%)" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader field="taxableAmount" label="Taxable Amt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader field="taxAmount" label="Tax Amt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <th></th>
                </tr>
              </thead>
              <tbody className="staggered-list">
                {displayedData.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="text-center font-medium text-zinc-500">{(page * pageSize) + idx + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-zinc-400" />
                        <span className="font-mono text-xs font-semibold text-primary">{item.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="font-medium">{item.taxType}</td>
                    <td className="font-medium">{item.rate}</td>
                    <td className="font-medium">{item.taxableAmount}</td>
                    <td className="font-medium">{item.taxAmount}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="text-xs text-primary hover:underline font-medium">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-zinc-500">No records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination 
              page={page} 
              onPageChange={setPage} 
              totalPages={totalPages}
              totalElements={filteredData.length}
              pageSize={pageSize}
              onPageSizeChange={() => {}} 
            />
          </div>
        )}
      </div>
    </div>
  )
}
