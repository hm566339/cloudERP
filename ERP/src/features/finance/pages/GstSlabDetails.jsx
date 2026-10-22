import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Download, FileText, ShoppingCart, 
  Package, LayoutList, History, Activity, BadgeCheck, CheckCircle, Percent
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { gstSlabsApi } from '../../../api/account';
import Modal from '../../../components/common/Modal';
import GstSlabFormModal from '../components/GstSlabFormModal';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useRoutePath } from '../../../hooks/useRoutePath';
import ExportModal from '../../../components/common/ExportModal';

export default function GstSlabDetails() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch the GST Slab details by ID
  const { data: response, isLoading, error, refetch } = useApiQuery(
    (id) => gstSlabsApi.getGstSlabById(id),
    id,
    { enabled: !!id }
  );

  const slab = response?.data || response;

  const updateMutation = useApiMutation(
    (data) => gstSlabsApi.updateGstSlab(id, data), 
    {
      onSuccess: () => {
        setIsEditModalOpen(false);
        refetch();
      }
    }
  );

  if (isLoading) {
    return <PageLoader message="Loading GST Slab details..." />;
  }

  if (error || !slab) {
    return (
      <ErrorState 
        title="GST Slab Not Found" 
        message={error?.message || "The requested GST Slab could not be found or you do not have permission to view it."} 
        onRetry={refetch} 
      />
    );
  }

  const handleEditSubmit = async (payload) => {
    await updateMutation.mutateAsync(payload);
  };

  const totalRate = (slab.cgstRate || 0) + (slab.sgstRate || 0) + (slab.igstRate || 0) + (slab.cessRate || 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutList size={16} /> },
    { id: 'products', label: 'Linked Products', icon: <Package size={16} /> },
    { id: 'sales', label: 'Sales Transactions', icon: <ShoppingCart size={16} /> },
    { id: 'purchases', label: 'Purchase Transactions', icon: <FileText size={16} /> },
    { id: 'summary', label: 'GST Summary', icon: <BadgeCheck size={16} /> },
    { id: 'recent', label: 'Recent Transactions', icon: <Activity size={16} /> },
    { id: 'audit', label: 'Audit Log', icon: <History size={16} /> }
  ];

  // Safely extract collections
  const linkedProducts = slab.linkedProducts || [];
  const salesTransactions = slab.salesTransactions || [];
  const purchaseTransactions = slab.purchaseTransactions || [];
  const recentTransactions = slab.recentTransactions || [];
  const gstSummary = slab.gstSummary || {};
  const taxConfiguration = slab.taxConfiguration || {};

  return (
    <>
    <div className="animate-fade-in pb-12 bg-zinc-50/30 dark:bg-[#0F1117] min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] shadow-sm pt-4 pb-0 mb-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(buildPath('/accounts/masters/gst-slabs'))} 
                className="p-2.5 bg-zinc-50 dark:bg-[#1D212C] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#222736] hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg transition-colors shrink-0 shadow-sm"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                    <Percent size={24} className="text-blue-600 dark:text-blue-400" />
                    {slab.slabName}
                  </h1>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-md border bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 inline-flex items-center gap-1.5 shadow-sm">
                    Total {totalRate}%
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-sm font-bold text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">Effective: {slab.effectiveFrom ? new Date(slab.effectiveFrom).toLocaleDateString() : '-'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                  <span className="flex items-center gap-1.5">GST Type: {slab.gstType || 'Standard'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736] hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-200 focus:outline-none">
                <Edit size={16} /> Edit Slab
              </button>
              
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-blue-600 text-white hover:bg-zinc-800 dark:hover:bg-blue-700 rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-zinc-900 focus:outline-none">
                <Printer size={16} /> Print
              </button>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 xl:gap-4 pb-6">
            <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
              <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total GST Rate</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalRate}%</p>
            </div>
            <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
              <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Taxable Value</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">₹{(gstSummary.totalTaxableValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
            <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
              <p className="text-[8.8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Total GST Collected</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">₹{(gstSummary.totalGstCollected || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
            <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
              <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Net Liability</p>
              <p className={`text-lg font-bold ${(slab.netGstLiability || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                ₹{Math.abs(slab.netGstLiability || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </p>
            </div>
            <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
              <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Linked Products</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{slab.totalLinkedProducts || 0}</p>
            </div>
            <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm flex flex-col justify-center">
              <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Sales / Purchases</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{slab.totalSalesInvoices || 0} / {slab.totalPurchaseBills || 0}</p>
            </div>
          </div>
          
          {/* Tabs Grid */}
          <div className="bg-zinc-50/80 dark:bg-[#1D212C] rounded-lg shadow-sm border border-zinc-200/80 dark:border-[#2A2F3D] p-1.5 mb-0 translate-y-3 mx-auto w-full max-w-full overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-2 py-2 text-xs xl:text-[10.4px] font-semibold rounded-lg transition-all outline-none ${
                    activeTab === tab.id 
                      ? 'bg-white dark:bg-[#161922] text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/60 dark:border-[#2A2F3D]' 
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-[#222736]'
                  }`}
                >
                  {tab.icon}
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-8">

            {activeTab === 'overview' && (
              <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2">
                
                <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Tax Configuration</h3>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">GST Type</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{taxConfiguration.gstType || slab.gstType || 'Standard'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Intra-State Tax</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">CGST + SGST</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Inter-State Tax</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">IGST</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Reverse Charge</span>
                        {taxConfiguration.reverseCharge ? (
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-bold border border-blue-100 dark:border-blue-800">Applicable</span>
                        ) : (
                          <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs font-bold border border-zinc-200 dark:border-[#2A2F3D]">N/A</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Composition Scheme</span>
                        {taxConfiguration.compositionApplicable ? (
                          <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded text-xs font-bold border border-emerald-100 dark:border-emerald-800">Applicable</span>
                        ) : (
                          <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs font-bold border border-zinc-200 dark:border-[#2A2F3D]">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'summary' && (
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden animate-in fade-in">
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">GST Summary</h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                    <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total Taxable Value</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">₹{(gstSummary.totalTaxableValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                    <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total CGST Collected</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">₹{(gstSummary.totalCgstCollected || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                    <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total SGST Collected</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">₹{(gstSummary.totalSgstCollected || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                    <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total IGST Collected</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{(gstSummary.totalIgstCollected || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-[#1D212C] rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                    <p className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total CESS Collected</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">₹{(gstSummary.totalCessCollected || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-[8.8px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Total GST Amount</p>
                    <p className="text-xl font-bold text-blue-800 dark:text-blue-200">₹{(gstSummary.totalGstAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden animate-in fade-in">
                {linkedProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="erp-table">
                      <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                        <tr>
                          <th className="p-4">Item Code</th>
                          <th className="p-4">Item Name</th>
                          <th className="p-4">HSN/SAC</th>
                          <th className="p-4">Unit</th>
                          <th className="p-4 text-right">Purchase Price</th>
                          <th className="p-4 text-right">Selling Price</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-right sticky right-0 bg-zinc-50 dark:bg-[#1D212C] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                        {linkedProducts.map((prod, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]/50">
                            <td className="p-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">{prod.itemCode}</td>
                            <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{prod.itemName}</td>
                            <td className="p-4 text-zinc-600 dark:text-zinc-400">{prod.hsnSac || '-'}</td>
                            <td className="p-4 text-zinc-600 dark:text-zinc-400">{prod.unit || '-'}</td>
                            <td className="p-4 text-right font-medium text-zinc-900 dark:text-zinc-100">₹{(prod.purchasePrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right font-medium text-emerald-600 dark:text-emerald-400">₹{(prod.sellingPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-center">
                              {prod.isActive !== false ? <span className="badge badge-success">Active</span> : <span className="badge badge-error">Inactive</span>}
                            </td>
                            <td className="p-4 text-right sticky right-0 bg-white dark:bg-[#161922] shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                              <button className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 text-xs">View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center">
                    <Package size={48} className="mb-4 text-zinc-200 dark:text-zinc-700" />
                    <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">No Linked Products</p>
                    <p className="text-sm mt-1">There are no products currently associated with this GST Slab.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden animate-in fade-in">
                {salesTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="erp-table">
                      <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                        <tr>
                          <th className="p-4">Invoice Number</th>
                          <th className="p-4">Invoice Date</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4 text-right">Taxable Amount</th>
                          <th className="p-4 text-right">CGST</th>
                          <th className="p-4 text-right">SGST</th>
                          <th className="p-4 text-right">IGST</th>
                          <th className="p-4 text-right">Total Tax</th>
                          <th className="p-4 text-right">Invoice Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                        {salesTransactions.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]/50">
                            <td className="p-4 font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{inv.invoiceNumber}</td>
                            <td className="p-4 text-zinc-600 dark:text-zinc-400">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                            <td className="p-4 text-zinc-900 dark:text-zinc-100">{inv.customerName}</td>
                            <td className="p-4 text-right text-zinc-900 dark:text-zinc-100">₹{(inv.taxableAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right text-zinc-600 dark:text-zinc-400">₹{(inv.cgst || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right text-zinc-600 dark:text-zinc-400">₹{(inv.sgst || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right text-emerald-600 dark:text-emerald-400">₹{(inv.igst || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right font-medium text-zinc-900 dark:text-zinc-100">₹{(inv.totalTax || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right font-bold text-zinc-900 dark:text-zinc-100">₹{(inv.invoiceTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center">
                    <ShoppingCart size={48} className="mb-4 text-zinc-200 dark:text-zinc-700" />
                    <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">No Sales Transactions</p>
                    <p className="text-sm mt-1">There are no sales invoices currently utilizing this GST Slab.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'purchases' && (
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden animate-in fade-in">
                {purchaseTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="erp-table">
                      <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[8.8px]">
                        <tr>
                          <th className="p-4">Invoice Number</th>
                          <th className="p-4">Invoice Date</th>
                          <th className="p-4">Vendor</th>
                          <th className="p-4 text-right">Taxable Amount</th>
                          <th className="p-4 text-right">CGST</th>
                          <th className="p-4 text-right">SGST</th>
                          <th className="p-4 text-right">IGST</th>
                          <th className="p-4 text-right">Total Tax</th>
                          <th className="p-4 text-right">Invoice Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
                        {purchaseTransactions.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-[#222736]/50">
                            <td className="p-4 font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{inv.invoiceNumber}</td>
                            <td className="p-4 text-zinc-600 dark:text-zinc-400">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                            <td className="p-4 text-zinc-900 dark:text-zinc-100">{inv.vendorName}</td>
                            <td className="p-4 text-right text-zinc-900 dark:text-zinc-100">₹{(inv.taxableAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right text-zinc-600 dark:text-zinc-400">₹{(inv.cgst || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right text-zinc-600 dark:text-zinc-400">₹{(inv.sgst || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right text-emerald-600 dark:text-emerald-400">₹{(inv.igst || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right font-medium text-zinc-900 dark:text-zinc-100">₹{(inv.totalTax || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            <td className="p-4 text-right font-bold text-zinc-900 dark:text-zinc-100">₹{(inv.invoiceTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center">
                    <FileText size={48} className="mb-4 text-zinc-200 dark:text-zinc-700" />
                    <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">No Purchase Transactions</p>
                    <p className="text-sm mt-1">There are no purchase bills currently utilizing this GST Slab.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recent' && (
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden animate-in fade-in">
                {recentTransactions.length > 0 ? (
                  <div className="p-6">
                    <div className="relative border-l-2 border-zinc-100 dark:border-[#2A2F3D] ml-4 space-y-8">
                      {recentTransactions.map((txn, idx) => (
                        <div key={idx} className="relative pl-6">
                          <div className="absolute -left-[7.2px] top-1 h-4 w-4 rounded-full bg-white dark:bg-[#161922] border-2 border-zinc-300 dark:border-zinc-600"></div>
                          <div className="mb-1 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{txn.transactionType || 'Transaction'} <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-2">{txn.invoiceNumber}</span></h4>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{txn.date ? new Date(txn.date).toLocaleDateString() : '-'}</span>
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">{txn.partyName || 'Unknown Party'}</p>
                          <div className="flex gap-4 mb-2">
                            <span className="text-xs font-semibold px-2 py-1 bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-zinc-300 rounded">Taxable: ₹{(txn.taxableAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            <span className="text-xs font-semibold px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-800">Tax: ₹{(txn.totalTax || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            <span className="text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-[#1D212C] text-zinc-900 dark:text-zinc-100 rounded">Total: ₹{(txn.invoiceTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center">
                    <Activity size={48} className="mb-4 text-zinc-200 dark:text-zinc-700" />
                    <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">No Recent Transactions</p>
                    <p className="text-sm mt-1">There are no recent transactions utilizing this GST Slab.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden animate-in fade-in">
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">Audit Trail</h3>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Created Information</dt>
                      <dd className="bg-zinc-50 dark:bg-[#1D212C] p-4 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">By: {slab.createdBy || 'System'}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">At: {slab.createdAt ? new Date(slab.createdAt).toLocaleString() : '-'}</p>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[8.8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Last Updated Information</dt>
                      <dd className="bg-zinc-50 dark:bg-[#1D212C] p-4 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">By: {slab.updatedBy || 'System'}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">At: {slab.updatedAt ? new Date(slab.updatedAt).toLocaleString() : '-'}</p>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

          </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit GST Slab">
        <GstSlabFormModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={slab}
          onSubmit={handleEditSubmit} 
        />
      </Modal>
    
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="gst-slabs" 
      />
    </>
  );
}
