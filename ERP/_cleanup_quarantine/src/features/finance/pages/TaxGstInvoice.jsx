import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import ExportModal from '../../../components/common/ExportModal'
import Pagination from '../../../components/common/Pagination'
import useUrlFilters from '../../../hooks/useUrlFilters'
import { Download, Search, BadgeCheck, TrendingUp, TrendingDown, Calculator, FileText } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetSalesInvoicesQuery as useGetInvoicesQuery } from '../../../api/sales-crm'
import { useGetAPInvoicesQuery } from '../../../api/purchase'

export default function GSTPage() {
 const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
 const [isExportModalOpen, setIsExportModalOpen] = useState(false);


 const { data: salesData, isLoading: salesLoading } = useGetInvoicesQuery(companyId)
 const { data: purchaseData, isLoading: purchaseLoading } = useGetAPInvoicesQuery(companyId)

 const salesInvoices = Array.isArray(salesData) ? salesData : salesData?.content || salesData?.data || [];
 const apInvoices = Array.isArray(purchaseData) ? purchaseData : purchaseData?.content || purchaseData?.data?.content || purchaseData?.data || [];

 const totalTaxLiability = salesInvoices
    .filter(inv => inv.status !== 'CANCELLED' && inv.status !== 'REVERSED')
    .reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);

 const inputTaxCredit = apInvoices
    .filter(inv => inv.status !== 'CANCELLED' && inv.status !== 'REVERSED')
    .reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);

 const netPayable = totalTaxLiability - inputTaxCredit;

 const records = []; // No GST Filings API exists yet
 const { page, setPage, pageSize } = useUrlFilters({ defaultPageSize: 10 })
 const validRecords = Array.isArray(records) ? records : []
 const displayedRecords = validRecords.slice(page * pageSize, (page + 1) * pageSize)
 const totalPages = Math.ceil(validRecords.length / pageSize)
 const isLoading = salesLoading || purchaseLoading;

 return (
 <div className="animate-fade-in">
 <div className="page-header">
 <div>
 <h1 className="page-title">GST & Tax Returns</h1>
 <p className="page-subtitle">Manage GST filings and compliance</p>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary"><Download size={15} /> Export GSTR</button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  <div className="card p-4 hover:border-zinc-300 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Tax Liability</span>
      <TrendingUp size={16} className="text-zinc-400" />
    </div>
    <p className="text-3xl font-display font-bold text-zinc-900 tracking-tight">
      ₹{totalTaxLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
    <p className="text-[10.4px] text-zinc-500 mt-1 font-medium">From Sales Invoices</p>
  </div>
  
  <div className="card p-4 hover:border-zinc-300 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Input Tax Credit</span>
      <TrendingDown size={16} className="text-zinc-400" />
    </div>
    <p className="text-3xl font-display font-bold text-zinc-900 tracking-tight">
      ₹{inputTaxCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
    <p className="text-[10.4px] text-zinc-500 mt-1 font-medium">From AP Invoices</p>
  </div>
  
  <div className="card p-4 hover:border-zinc-300 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Net Payable</span>
      <Calculator size={16} className="text-zinc-400" />
    </div>
    <p className="text-3xl font-display font-bold text-zinc-900 tracking-tight">
      ₹{Math.max(0, netPayable).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
    <p className="text-[10.4px] text-zinc-500 mt-1 font-medium">Due by 20th</p>
  </div>
 </div>

 <div className="card overflow-hidden">
  <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
    <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
      <FileText size={16} className="text-zinc-500" />
      Recent Filings
    </h3>
    <span className="badge bg-zinc-100 text-zinc-600 border-zinc-200">
      {(Array.isArray(records) ? records.length : 0)} Total
    </span>
  </div>
 {isLoading ? (
 <div className="p-6 w-full"><TableSkeleton columns={5} rows={3} /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="erp-table">
 <thead>
 <tr>
                <th className="w-12 text-center">S.No.</th>
 <th>Return Period</th>
 <th>Type</th>
 <th className="text-right">Taxable Amount (₹)</th>
 <th className="text-right">Tax Amount (₹)</th>
 <th>Status</th>
 <th>Filed On</th>
 <th></th>
 </tr>
 </thead>
 <tbody className="staggered-list">
 {(Array.isArray(records) ? records : []).length === 0 && !isLoading && (
   <tr>
     <td colSpan={8}>
        <div className="p-8 text-center border-2 border-dashed border-zinc-200 m-4 rounded-xl">
          <FileText className="mx-auto text-zinc-300 mb-3" size={28} />
          <p className="text-sm font-medium text-zinc-600">No GST filings found</p>
          <p className="text-xs text-zinc-400 mt-1">Your recent tax return records will appear here.</p>
        </div>
     </td>
   </tr>
 )}
 {displayedRecords.map((rec, i) => (
 <tr key={rec.id || i}>
                    <td className="text-center font-medium text-zinc-500">{i + 1}</td>
 <td className="font-medium">{rec.month}</td>
 <td>
 <div className="flex items-center gap-2">
 <BadgeCheck size={14} className="text-primary" />
 {rec.type}
 </div>
 </td>
 <td className="text-right text-zinc-800 font-medium">₹{rec.sales.toLocaleString()}</td>
 <td className="text-right text-zinc-800 font-medium">₹{rec.tax.toLocaleString()}</td>
 <td>
 <span className={`badge ${rec.status === 'Filed' ? 'badge-success' : 'badge-warning'}`}>
 {rec.status}
 </span>
 </td>
 <td className="text-zinc-500 text-xs">{rec.filedOn}</td>
 <td className="text-right">
  <button className="text-[10.4px] font-semibold text-primary hover:text-indigo-700 transition-colors">
    {rec.status === 'Filed' ? 'Download' : 'File Now'}
  </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 <Pagination 
   page={page} 
   onPageChange={setPage} 
   totalPages={totalPages}
   totalElements={validRecords.length}
   pageSize={pageSize}
   onPageSizeChange={() => {}} 
 />
 </div>
 )}
 </div>
  <ExportModal
    isOpen={isExportModalOpen}
    onClose={() => setIsExportModalOpen(false)}
    reportName="tax-gst-returns"
  />
 </div>
 )
}

