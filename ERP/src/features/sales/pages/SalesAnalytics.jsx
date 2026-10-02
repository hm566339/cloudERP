import React from 'react';
import { LineChart, BarChart3, TrendingUp, Download, Calendar, Target, AlertTriangle } from 'lucide-react';
import { TableRowSkeleton, TableSkeleton, ListSkeleton, PageLoader } from '../../../components/common/SkeletonLoader';
import { useGetSalesInvoicesSummaryQuery } from '../../../api/sales-crm';

export default function SalesAnalytics() {
  const { data: summaryData, isLoading } = useGetSalesInvoicesSummaryQuery();

  const totalAmount = summaryData?.totalAmount || 0;
  const paidAmount = summaryData?.paidAmount || 0;
  const outstandingAmount = summaryData?.outstandingAmount || 0;
  const overdueAmount = summaryData?.overdueAmount || 0;

  const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const overduePercentage = totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0;
  
  const statusCounts = summaryData?.statusCounts || {};
  const totalInvoices = summaryData?.totalInvoices || 0;

  return (
    <div className="space-y-6 animate-fade-in p-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            <LineChart className="text-indigo-500" />
            Sales Analytics
          </h1>
          <p className="text-xs text-zinc-500">Deep dive into sales performance, revenue collection, and outstanding amounts.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 card p-3 text-sm">
            <Calendar size={14} className="text-zinc-400" />
            <span className="font-semibold text-zinc-700">All Time</span>
          </div>
          <button className="btn-secondary"><Download size={16} /> Export</button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader message="Loading sales data…" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 border-t-2 border-t-indigo-500">
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Invoiced</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-zinc-900"> ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="card p-4 border-t-2 border-t-emerald-500">
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Collected</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-emerald-600"> ₹{paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="card p-4 border-t-2 border-t-amber-500">
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Outstanding</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-amber-600"> ₹{outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="card p-4 border-t-2 border-t-rose-500">
              <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <AlertTriangle size={12} className="text-rose-500" /> Overdue Amount
              </p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-rose-600"> ₹{overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="card p-3 bg-zinc-50 border-zinc-200">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Invoices</p>
              <p className="text-xl font-bold text-zinc-800">{totalInvoices}</p>
            </div>
            <div className="card p-3 bg-zinc-50 border-zinc-200">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Draft</p>
              <p className="text-xl font-bold text-zinc-800">{statusCounts.DRAFT || 0}</p>
            </div>
            <div className="card p-3 bg-zinc-50 border-zinc-200">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pending Approval</p>
              <p className="text-xl font-bold text-amber-600">{statusCounts.PENDING_APPROVAL || 0}</p>
            </div>
            <div className="card p-3 bg-zinc-50 border-zinc-200">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Approved</p>
              <p className="text-xl font-bold text-emerald-600">{statusCounts.APPROVED || 0}</p>
            </div>
            <div className="card p-3 bg-zinc-50 border-zinc-200">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Posted</p>
              <p className="text-xl font-bold text-blue-600">{statusCounts.POSTED || 0}</p>
            </div>
            <div className="card p-3 bg-zinc-50 border-zinc-200">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Paid</p>
              <p className="text-xl font-bold text-emerald-600">{statusCounts.PAID || 0}</p>
            </div>
            <div className="card p-3 bg-zinc-50 border-zinc-200">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Partially Paid</p>
              <p className="text-xl font-bold text-teal-600">{statusCounts.PARTIALLY_PAID || 0}</p>
            </div>
            <div className="card p-3 bg-zinc-50 border-zinc-200">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Cancelled</p>
              <p className="text-xl font-bold text-zinc-500">{statusCounts.CANCELLED || 0}</p>
            </div>
            <div className="card p-3 bg-zinc-50 border-zinc-200">
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Rejected</p>
              <p className="text-xl font-bold text-rose-600">{statusCounts.REJECTED || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-4 h-[320px] flex flex-col">
              <h3 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
                <Target size={16} className="text-indigo-500" /> Collection Performance
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center relative space-y-8">
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-xs font-bold text-zinc-700">
                    <span>Collected Revenue</span>
                    <span>{paidPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${paidPercentage}%` }} />
                  </div>
                </div>
                
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-xs font-bold text-zinc-700">
                    <span>Overdue Revenue</span>
                    <span className="text-rose-600">{overduePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${overduePercentage}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4 h-[320px] flex flex-col">
              <h3 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-500" /> Summary Breakdown
              </h3>
              <div className="flex-1 border border-dashed border-zinc-200 rounded-lg bg-zinc-50 flex items-center justify-center relative overflow-hidden">
                 <p className="text-zinc-400 text-sm font-bold z-10">Advanced charts require a visualization library.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
