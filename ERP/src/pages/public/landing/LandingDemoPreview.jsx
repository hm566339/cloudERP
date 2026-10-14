import React, { useState } from 'react';
import { Banknote, ShoppingCart, Briefcase, Box, GitBranch, CheckCircle2, Clock, Check } from 'lucide-react';

export default function LandingDemoPreview() {
  const [previewTab, setPreviewTab] = useState('finance');

  return (
    <div className="mt-14 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3 sm:p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] text-left">
        {/* Window Header Mock */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-zinc-100 text-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 font-mono text-[11px] text-zinc-400">
              Mark2 ERP Workspace
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600">
              Interactive Workspace Preview
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-semibold font-mono">
              Company: APEX-INDIA
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
              Active Session
            </span>
          </div>
        </div>

        {/* Module Switcher Tabs for Preview (Responsive Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 py-3 border-b border-zinc-100 overflow-x-auto text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setPreviewTab('finance')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${previewTab === 'finance' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            <Banknote size={14} /> Finance & Ledgers
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('sales')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${previewTab === 'sales' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            <ShoppingCart size={14} /> Sales & Invoices
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('purchase')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${previewTab === 'purchase' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            <Briefcase size={14} /> Procurement & POs
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('inventory')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${previewTab === 'inventory' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            <Box size={14} /> Multi-Warehouse Stock
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('workflows')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${previewTab === 'workflows' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            <GitBranch size={14} /> Approvals & Workflows
          </button>
        </div>

        {/* Tab 1: Finance Preview */}
        {previewTab === 'finance' && (
          <div className="pt-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Monthly Sales Revenue</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">₹ 42,85,600</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">+14.2% from last period</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Accounts Receivable</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">₹ 8,90,400</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">18 open customer balances</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Accounts Payable</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">₹ 6,15,000</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">9 vendor bills pending</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">General Ledger Tally</div>
                <div className="text-base sm:text-lg font-bold text-emerald-600">Balanced</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Trial Balance in equilibrium</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-zinc-700 pb-2 mb-2 border-b border-zinc-200">
                  <span className="flex items-center gap-1.5"><Banknote size={14} className="text-zinc-500" /> Recent Posted Journal Entries</span>
                  <span className="text-[10px] font-mono text-zinc-400">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800">JV-2026-0041</span>
                    <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">HDFC Bank Operating A/c &rarr; Vendor Settlement</span>
                    <span className="font-semibold text-zinc-900">₹ 1,84,500</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Posted</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800">JV-2026-0040</span>
                    <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">Accounts Receivable &rarr; Inter-Company Reconcile</span>
                    <span className="font-semibold text-zinc-900">₹ 72,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Posted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sales Preview */}
        {previewTab === 'sales' && (
          <div className="pt-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Open Quotations</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">14</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">₹ 21,40,000 pending value</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Sales Orders in Progress</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">8 Orders</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">6 ready for dispatch</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Invoiced This Month</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">₹ 38,15,400</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">GST auto-calculated</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Active Customers</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">142</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Verified GSTIN profiles</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-zinc-700 pb-2 mb-2 border-b border-zinc-200">
                  <span className="flex items-center gap-1.5"><ShoppingCart size={14} className="text-zinc-500" /> Recent Sales Invoices & Orders</span>
                  <span className="text-[10px] font-mono text-zinc-400">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800">INV-2026-089</span>
                    <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">Bharat Precision Tools</span>
                    <span className="font-semibold text-zinc-900">₹ 3,45,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Paid</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800">SO-2026-112</span>
                    <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">Apex Automotive Components</span>
                    <span className="font-semibold text-zinc-900">₹ 8,12,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">Dispatched</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Procurement Preview */}
        {previewTab === 'purchase' && (
          <div className="pt-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Open Requisitions</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">7</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">3 pending approval</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">RFQs in Tender</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">4</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Supplier bids compared</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Open Purchase Orders</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">₹ 18,24,350</div>
                <div className="text-[10px] text-amber-600 font-semibold mt-0.5">12 orders awaiting GRN</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Verified GRNs</div>
                <div className="text-base sm:text-lg font-bold text-emerald-600">98.5%</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Inspection match rate</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-zinc-700 pb-2 mb-2 border-b border-zinc-200">
                  <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-zinc-500" /> Active Purchase Orders & Goods Receipts</span>
                  <span className="text-[10px] font-mono text-zinc-400">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800">PO-2026-044</span>
                    <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">Apex Steel Suppliers Ltd</span>
                    <span className="font-semibold text-zinc-900">₹ 6,80,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">GRN Inward</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800">PR-2026-019</span>
                    <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">Hydraulic Seals & Bearings</span>
                    <span className="font-semibold text-zinc-900">₹ 1,20,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">RFQ Sent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Inventory Preview */}
        {previewTab === 'inventory' && (
          <div className="pt-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Total SKU Items</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">3,420</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Across 5 regional warehouses</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Stock Valuation</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">₹ 1,18,50,000</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">FIFO valuation method</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Low Stock Alerts</div>
                <div className="text-base sm:text-lg font-bold text-amber-600">3 SKUs</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Under reorder threshold</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Warehouse Transfer Orders</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">4 Active</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Inter-facility transit</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-zinc-700 pb-2 mb-2 border-b border-zinc-200">
                  <span className="flex items-center gap-1.5"><Box size={14} className="text-zinc-500" /> Multi-Warehouse Stock Positions</span>
                  <span className="text-[10px] font-mono text-zinc-400">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800">SKU-7721 (CNC Bit)</span>
                    <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">Central Warehouse (Bhiwandi)</span>
                    <span className="font-semibold text-zinc-900">840 units</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Optimal</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800">SKU-1094 (Seal Rings)</span>
                    <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">North Plant Warehouse</span>
                    <span className="font-semibold text-zinc-900">45 units</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">Reorder Level</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Workflows & Approvals Preview */}
        {previewTab === 'workflows' && (
          <div className="pt-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Active Workflows</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">12 Rules</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Automated policy checks</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Pending Approvals</div>
                <div className="text-base sm:text-lg font-bold text-amber-600">5 Documents</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Awaiting Manager sign-off</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Average Turnaround</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900">1.8 Hours</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Automated email prompts</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                <div className="text-[11px] text-zinc-500 mb-1">Audit Compliance</div>
                <div className="text-base sm:text-lg font-bold text-emerald-600">100%</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Immutable audit trail</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-zinc-700 pb-2 mb-2 border-b border-zinc-200">
                  <span className="flex items-center gap-1.5"><GitBranch size={14} className="text-zinc-500" /> Live Approval Tasks & Escalations</span>
                  <span className="text-[10px] font-mono text-zinc-400">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800">REQ-2026-081</span>
                    <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">PO #044 Value &gt; ₹5,00,000 &rarr; Finance Director</span>
                    <span className="font-semibold text-zinc-900">Stage 2 of 2</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">Pending Review</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800">REQ-2026-080</span>
                    <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">Credit Note #012 &rarr; Company Admin Authorization</span>
                    <span className="font-semibold text-zinc-900">Approved</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
