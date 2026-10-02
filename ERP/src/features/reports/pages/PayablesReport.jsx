import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState, useEffect } from "react";
import Pagination from '../../../components/common/Pagination';
import useUrlFilters from '../../../hooks/useUrlFilters';
import { Search, Filter, FileText } from "lucide-react";
import { useParams } from "react-router-dom";
import { reportsApi } from '../../../api/account';
import SortableHeader from '../../../components/common/SortableHeader';

export default function PayablesReport() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyId;;
  const { 
    page, setPage, pageSize,
    searchTerm: search, setSearchTerm: setSearch, debouncedSearch,
    sortBy, sortOrder, handleColumnSort
  } = useUrlFilters({ defaultPageSize: 10 });

  const [apiData, setApiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await reportsApi.getFinancialReports(companyId);
        setApiData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [companyId]);

  let filteredData = apiData.filter((d) =>
    JSON.stringify(d).toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  if (sortBy) {
    filteredData.sort((a, b) => {
      const aVal = a[sortBy] ?? '';
      const bVal = b[sortBy] ?? '';
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const displayedData = filteredData.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const getStatusBadge = (status) => {
    if (!status) return "badge-draft";
    const s = status.toString().toLowerCase();
    if (s.includes("ready") || s.includes("filed")) return "badge-success";
    if (s.includes("proc")) return "badge-warning";
    if (s.includes("fail")) return "badge-danger";
    return "badge-draft";
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payables Report</h1>
          <p className="page-subtitle">View financial reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Filter size={15} /> Filter
          </button>
        </div>
      </div>

      <div className="card p-4 flex gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            className="input-field pl-9"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                  <SortableHeader field="id" label="Report ID" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <SortableHeader field="name" label="Name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <SortableHeader field="type" label="Type" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <SortableHeader field="lastGenerated" label="Last Generated" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <SortableHeader field="period" label="Period" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <SortableHeader field="status" label="Status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
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
                        <span className="font-mono text-xs font-semibold text-primary">
                          {item.id}
                        </span>
                      </div>
                    </td>
                    <td className="font-medium">{item.name}</td>
                    <td className="font-medium">{item.type}</td>
                    <td className="font-medium">{item.lastGenerated}</td>
                    <td className="font-medium">{item.period}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button className="text-xs text-primary hover:underline font-medium">
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-zinc-500">
                      No records found.
                    </td>
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
  );
}
