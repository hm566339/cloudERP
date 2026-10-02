import React, { useState, useMemo } from "react";
import { Activity, Download, ArrowUpRight, ArrowDownRight, DollarSign, Loader2, PieChart as PieChartIcon } from "lucide-react";
import { useParams } from "react-router-dom";
import { useCashFlow } from "../../../hooks/reports/useCashFlow";
import { useReportExports } from "../../../hooks/reports/useReportExports";
import useApiFilters from "../../../hooks/useApiFilters";
import { FILTER_CONFIGS } from "../../../constants/filterConfigs";
import ReportDateFilter from "../../../components/reports/ReportDateFilter";
import ApiFilterBar from "../../../components/common/ApiFilterBar";
import Pagination from "../../../components/common/Pagination";
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import SortableHeader from '../../../components/common/SortableHeader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import ExportModal from '../../../components/common/ExportModal';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function CashFlowReport() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyId;
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const { filterBarProps, apiParams, page, pageSize, handleColumnSort, sortBy, sortOrder } = useApiFilters(FILTER_CONFIGS.cashFlow);

  const { data: rawReportData, isLoading, isFetching } = useCashFlow(
    { companyId, startDate, endDate, ...apiParams },
    { skip: !startDate || !endDate || !companyId }
  );

  const { exportCashFlowPdf, isExportingPdf } = useReportExports();

  const handleDownloadPdf = () => {
    exportCashFlowPdf({ companyId, startDate, endDate, ...apiParams }, `Cash_Flow_${startDate}_to_${endDate}.pdf`);
  };

  const reportData = rawReportData?.data || rawReportData || {};
  const lines = reportData?.lines || [];
  const pagination = rawReportData?.pagination || reportData?.pagination || {};

  const finalFilterBarProps = {
    ...filterBarProps,
    filters: filterBarProps.filters.map(f => {
      if (f.key === 'category') {
        const uniqueCategories = Array.from(new Set(lines.map(l => l.category).filter(Boolean)));
        return { ...f, options: uniqueCategories.map(c => ({ label: c, value: c })) };
      }
      return f;
    })
  };
  // Chart Data Prep
  const overviewChartData = useMemo(() => {
    return [
      { name: 'Operating', in: reportData.operatingCashIn || 0, out: reportData.operatingCashOut || 0 },
      { name: 'Investing', in: reportData.investingCashIn || 0, out: reportData.investingCashOut || 0 },
      { name: 'Financing', in: reportData.financingCashIn || 0, out: reportData.financingCashOut || 0 },
    ];
  }, [reportData]);

  const categoryChartData = useMemo(() => {
    const categories = {};
    lines.forEach(line => {
      if (!categories[line.category]) categories[line.category] = 0;
      categories[line.category] += Math.abs(line.amount);
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [lines]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="page-title flex items-center gap-2"><Activity size={24} className="text-primary"/> Cash Flow Statement</h1>
          <p className="page-subtitle">Analyze operating, investing, and financing cash flows</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ReportDateFilter fromDate={startDate} toDate={endDate} onChange={(start, end) => { setStartDate(start); setEndDate(end); }} />
          <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary py-1.5 text-xs flex items-center gap-1">
            <Download size={14} /> Export
          </button>
          
          <button 
            onClick={handleDownloadPdf}
            disabled={isExportingPdf || isLoading}
            className="btn-secondary py-1.5 text-xs flex items-center gap-1 disabled:opacity-50"
            title="Download PDF"
          >
            {isExportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block">Net Operating Cash</span>
          <p className={`text-xl font-bold mt-1.5 ${(reportData?.operatingCashIn - reportData?.operatingCashOut) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{((reportData?.operatingCashIn || 0) - (reportData?.operatingCashOut || 0)).toLocaleString()}
          </p>
          <div className="flex justify-between text-[8px] text-zinc-500 mt-2 pt-2 border-t border-zinc-100">
            <span className="flex items-center gap-1 text-emerald-600"><ArrowDownRight size={12}/> In: {(reportData?.operatingCashIn || 0).toLocaleString()}</span>
            <span className="flex items-center gap-1 text-rose-600"><ArrowUpRight size={12}/> Out: {(reportData?.operatingCashOut || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="card p-4">
          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block">Net Investing Cash</span>
          <p className={`text-xl font-bold mt-1.5 ${(reportData?.investingCashIn - reportData?.investingCashOut) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{((reportData?.investingCashIn || 0) - (reportData?.investingCashOut || 0)).toLocaleString()}
          </p>
          <div className="flex justify-between text-[8px] text-zinc-500 mt-2 pt-2 border-t border-zinc-100">
            <span className="flex items-center gap-1 text-emerald-600"><ArrowDownRight size={12}/> In: {(reportData?.investingCashIn || 0).toLocaleString()}</span>
            <span className="flex items-center gap-1 text-rose-600"><ArrowUpRight size={12}/> Out: {(reportData?.investingCashOut || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="card p-4">
          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block">Net Financing Cash</span>
          <p className={`text-xl font-bold mt-1.5 ${(reportData?.financingCashIn - reportData?.financingCashOut) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{((reportData?.financingCashIn || 0) - (reportData?.financingCashOut || 0)).toLocaleString()}
          </p>
          <div className="flex justify-between text-[8px] text-zinc-500 mt-2 pt-2 border-t border-zinc-100">
            <span className="flex items-center gap-1 text-emerald-600"><ArrowDownRight size={12}/> In: {(reportData?.financingCashIn || 0).toLocaleString()}</span>
            <span className="flex items-center gap-1 text-rose-600"><ArrowUpRight size={12}/> Out: {(reportData?.financingCashOut || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="card p-4 bg-zinc-900 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={64} className="text-white"/>
          </div>
          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block relative z-10">Total Net Cash Flow</span>
          <p className={`text-2xl font-bold mt-1.5 relative z-10 ${(reportData?.netCashFlow || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₹{(reportData?.netCashFlow || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-4 h-[256px] flex flex-col">
            <h3 className="text-sm font-bold text-zinc-800 mb-4 shrink-0 flex items-center gap-2">Cash In vs Out</h3>
            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={overviewChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="in" name="Cash In" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="out" name="Cash Out" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4 h-[256px] flex flex-col">
            <h3 className="text-sm font-bold text-zinc-800 mb-4 shrink-0 flex items-center gap-2"><PieChartIcon size={16} className="text-primary"/> Category Breakdown</h3>
            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }} formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <ApiFilterBar 
        config={FILTER_CONFIGS.cashFlow} 
        {...finalFilterBarProps} 
      />

      {isLoading ? (
        <div className="p-6 w-full"><TableSkeleton columns={3} rows={5} /></div>
      ) : (
        <div className="erp-table-container">
          <div className="bg-zinc-50 border-b border-zinc-200 p-4">
            <h3 className="font-bold text-zinc-800 text-sm">Detailed Cash Flow Breakdown</h3>
          </div>
          <div className="overflow-x-auto relative">
            <table className="erp-table min-w-[480px]">
              <thead className="sticky top-0 z-10 bg-white">
                <tr>
                  <th className="w-12 text-center">S.No.</th>
                  <SortableHeader field="category" label="Category" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} className="w-[144px]" />
                  <SortableHeader field="description" label="Description" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <SortableHeader field="amount" label="Amount (₹)" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} className="text-right w-[120px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 relative">
                {isFetching && (
                   <tr className="absolute inset-0 bg-white/50 backdrop-blur-sm z-30 flex items-center justify-center">
                     <td colSpan={4}><Loader2 className="animate-spin text-primary w-8 h-8"/></td>
                   </tr>
                )}
                {lines.map((line, idx) => (
                  <tr key={idx} className={`${line.amount < 0 ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'bg-emerald-50/20 hover:bg-emerald-50/40'} transition-colors`}>
                    <td className="text-center font-medium text-zinc-500">{(page * (pageSize || 10)) + idx + 1}</td>
                    <td className="border-r border-zinc-100">
                      <span className="badge badge-draft font-mono text-[8px] uppercase bg-white border border-zinc-200">{line.category}</span>
                    </td>
                    <td className="font-medium text-zinc-700 border-r border-zinc-100">{line.description}</td>
                    <td className={`text-right font-bold font-mono ${line.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {line.amount > 0 ? '+' : ''}{line.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-zinc-500">
                      No transactions found for this period or filter combination.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {pagination && pagination.totalPages > 0 && (
            <div className="p-4 border-t border-zinc-100">
              <Pagination
                page={pagination.currentPage !== undefined ? pagination.currentPage + 1 : 1}
                totalPages={pagination.totalPages || 1}
                totalElements={pagination.totalElements || lines.length}
                pageSize={pagination.pageSize || 10}
                onPageChange={paginationProps.onPageChange}
                onPageSizeChange={paginationProps.onPageSizeChange}
                itemName="records"
              />
            </div>
          )}
        </div>
      )}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="cash-flow"
      />
    </div>
  );
}
