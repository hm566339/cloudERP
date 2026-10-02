import React from 'react';
import { Tag, Download, Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiQuery } from '../../../hooks/useApi';
import { hsnSacMasterApi } from '../../../api/account';
import useUrlFilters from '../../../hooks/useUrlFilters';

import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import Pagination from '../../../components/common/Pagination';
import { useRoutePath } from "../../../hooks/useRoutePath";

const SacReport = () => {
  const { buildPath } = useRoutePath();
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;

  const {
    filters,
    handleFilterChange,
    handleSort,
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  } = useUrlFilters({
    defaultSortBy: 'createdAt',
    defaultSortDir: 'desc'
  });

  const { data: resData, isLoading } = useApiQuery(hsnSacMasterApi.getSacReport, {
    companyId,
    searchKey: filters.searchKey,
    page,
    size: pageSize,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir
  }, {
    enabled: !!companyId
  });

  const dataList = Array.isArray(resData?.data) ? resData.data : (resData || []);
  const pageInfo = resData?.pagination || resData?.data?.pagination || {};

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link to={buildPath('/accounts/masters/hsn-sac')} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-zinc-500" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Tag size={22} className="text-purple-600" />
              SAC Report
            </h1>
            <p className="page-subtitle">Services specific report</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> Print
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 print:hidden">
          <input
            type="text"
            placeholder="Search code, description..."
            value={filters.searchKey || ''}
            onChange={(e) => handleFilterChange('searchKey', e.target.value)}
            className="input-field max-w-sm w-full"
          />
        </div>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="erp-table print:text-xs">
            <thead>
              <tr>
                <th className="w-12 text-center">S.No.</th>
                <th>Code</th>
                <th>Description</th>
                <th>GST Slab</th>
                <th className="text-right">CGST</th>
                <th className="text-right">SGST</th>
                <th className="text-right">IGST</th>
                <th className="text-right">CESS</th>
                <th className="text-right">Tax Txns</th>
              </tr>
            </thead>
            <tbody className="staggered-list">
              {isLoading ? (
                <TableRowSkeleton columns={9} />
              ) : dataList.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="p-8 text-center text-zinc-500">
                      No SAC records found
                    </div>
                  </td>
                </tr>
              ) : (
                dataList.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="text-center text-zinc-500">{(page * (pageSize || 10)) + idx + 1}</td>
                    <td className="font-mono text-primary font-semibold">{item.code}</td>
                    <td>{item.description}</td>
                    <td>{item.gstSlabName || 'N/A'}</td>
                    <td className="text-right">{item.cgstRate != null ? `${item.cgstRate}%` : '-'}</td>
                    <td className="text-right">{item.sgstRate != null ? `${item.sgstRate}%` : '-'}</td>
                    <td className="text-right font-semibold">{item.igstRate != null ? `${item.igstRate}%` : '-'}</td>
                    <td className="text-right">{item.cessRate != null ? `${item.cessRate}%` : '-'}</td>
                    <td className="text-right">{item.taxTransactionCount || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && dataList.length > 0 && (
            <div className="p-4 border-t border-zinc-100 bg-white rounded-b-xl print:hidden">
              <Pagination
                page={pageInfo.page || page || 0}
                pageSize={pageInfo.size || pageSize || 10}
                totalPages={pageInfo.totalPages || 1}
                totalElements={pageInfo.totalElements || dataList.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                itemName="records"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SacReport;
