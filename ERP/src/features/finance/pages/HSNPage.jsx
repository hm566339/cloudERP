import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import Pagination from '../../../components/common/Pagination'
import { Download, Search, Plus, Filter, FileText } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetHsnSacsQuery as useGetHsnCodesQuery } from '../../../api/account'
import ApiFilterBar from '../../../components/common/ApiFilterBar'
import SortableHeader from '../../../components/common/SortableHeader'
import useApiFilters from '../../../hooks/useApiFilters'
import FILTER_CONFIGS from '../../../constants/filterConfigs'
import ExportModal from '../../../components/common/ExportModal';

export default function HSNPage() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.hsnCodes, { defaultPageSize: 10, defaultSortBy: 'code-asc' });

  const search = filterBarProps.searchTerm || '';
  
  

  const { data: apiData = [], isLoading, refetch } = useGetHsnCodesQuery(companyId)

  const filteredData = (Array.isArray(apiData) ? apiData : []).filter(d => 
    JSON.stringify(d).toLowerCase().includes(search.toLowerCase()) &&
    (!filters.category || d.category === filters.category)
  )

  const sortedData = [...filteredData].sort((a, b) => {
    const valA = sortBy === 'code' ? a.code : a.gstRate;
    const valB = sortBy === 'code' ? b.code : b.gstRate;
    
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const displayedData = sortedData.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(sortedData.length / pageSize)

  const finalFilterBarProps = {
    ...filterBarProps,
    filters: filterBarProps.filters.map(f => {
      if (f.key === 'category') {
        const uniqueCategories = Array.from(new Set((Array.isArray(apiData) ? apiData : []).map(e => e.category).filter(Boolean)));
        return { ...f, options: uniqueCategories.map(c => ({ label: c, value: c })) };
      }
      return f;
    })
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">HSN / SAC Codes</h1>
          <p className="page-subtitle">Manage HSN/SAC codes</p>
        </div>
        <div className="flex items-center gap-2">
            
          
            
            
          <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary flex items-center gap-1.5 h-9 px-3 text-[10.4px] bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="h-9 px-4 text-[10.4px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"><Plus size={15} /> Add New</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <ApiFilterBar 
          {...finalFilterBarProps}
          onRefresh={refetch}
          isLoading={isLoading}
        />

        {isLoading ? (
          <div className="p-6 w-full"><TableSkeleton columns={5} rows={3} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                <th className="w-12 text-center">S.No.</th>
                  <SortableHeader field="code" label="HSN Code" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <th>Description</th>
                  <SortableHeader field="gstRate" label="GST Rate (%)" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <th>Category</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="staggered-list">
                {displayedData.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="text-center font-medium text-zinc-500">{idx + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-zinc-400" />
                        <span className="font-mono text-xs font-semibold text-primary">{item.code}</span>
                      </div>
                    </td>
                    <td className="font-medium">{item.description}</td>
                    <td className="font-medium">{item.gstRate}</td>
                    <td className="font-medium">{item.category}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="text-xs text-primary hover:underline font-medium">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="p-8 text-center border-2 border-dashed border-zinc-200 m-4 rounded-xl">
                        <FileText className="mx-auto text-zinc-300 mb-3" size={28} />
                        <p className="text-sm font-medium text-zinc-600">No HSN/SAC codes found</p>
                        <p className="text-xs text-zinc-400 mt-1">Add new HSN/SAC codes to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination 
              {...paginationProps}
              totalPages={totalPages}
              totalElements={filteredData.length}
              itemName="HSN/SAC codes"
            />
          </div>
        )}
      </div>
    
      

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="hsn-sac" 
      />
</div>
  )
}
