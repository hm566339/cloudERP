import React, { useState } from 'react';
import { Banknote, ShoppingCart, Briefcase, Box, GitBranch, CheckCircle2, Clock, Check } from 'lucide-react';

export default function LandingDemoPreview() {
  const [previewTab, setPreviewTab] = useState('finance');

  return (
    <div className="mt-14 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] p-3 sm:p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] text-left">
        {/* Window Header Mock */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#2A2F3D] text-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 font-mono text-[11px] text-zinc-400 dark:text-[#6B7184]">
              Mark2 ERP Workspace
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5]">
              Interactive Workspace Preview
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#E6E8EE] font-semibold font-mono">
              Company: APEX-INDIA
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold">
              Active Session
            </span>
          </div>
        </div>

        {/* Module Switcher Tabs for Preview (Responsive Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] overflow-x-auto text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setPreviewTab('finance')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${previewTab === 'finance' ? 'bg-zinc-900 text-white dark:bg-[#4C8DFF]' : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1D212C] dark:hover:text-[#E6E8EE]'}`}
          >
            <Banknote size={14} /> Finance & Ledgers
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('sales')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${previewTab === 'sales' ? 'bg-zinc-900 text-white dark:bg-[#4C8DFF]' : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1D212C] dark:hover:text-[#E6E8EE]'}`}
          >
            <ShoppingCart size={14} /> Sales & Invoices
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('purchase')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${previewTab === 'purchase' ? 'bg-zinc-900 text-white dark:bg-[#4C8DFF]' : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1D212C] dark:hover:text-[#E6E8EE]'}`}
          >
            <Briefcase size={14} /> Procurement & POs
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('inventory')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${previewTab === 'inventory' ? 'bg-zinc-900 text-white dark:bg-[#4C8DFF]' : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1D212C] dark:hover:text-[#E6E8EE]'}`}
          >
            <Box size={14} /> Multi-Warehouse Stock
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('workflows')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${previewTab === 'workflows' ? 'bg-zinc-900 text-white dark:bg-[#4C8DFF]' : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#1D212C] dark:hover:text-[#E6E8EE]'}`}
          >
            <GitBranch size={14} /> Approvals & Workflows
          </button>
        </div>

        {/* Tab 1: Finance Preview */}
        {previewTab === 'finance' && (
          <div className="pt-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Monthly Sales Revenue</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">₹ 42,85,600</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">+14.2% from last period</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Accounts Receivable</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">₹ 8,90,400</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">18 open customer balances</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Accounts Payable</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">₹ 6,15,000</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">9 vendor bills pending</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">General Ledger Tally</div>
                <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">Balanced</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">Trial Balance in equilibrium</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-zinc-700 dark:text-[#E6E8EE] pb-2 mb-2 border-b border-zinc-200 dark:border-[#2A2F3D]">
                  <span className="flex items-center gap-1.5"><Banknote size={14} className="text-zinc-500 dark:text-[#A0A6B5]" /> Recent Posted Journal Entries</span>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-[#6B7184]">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">JV-2026-0041</span>
                    <span className="text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[140px] sm:max-w-none">HDFC Bank Operating A/c &rarr; Vendor Settlement</span>
                    <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">₹ 1,84,500</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">Posted</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">JV-2026-0040</span>
                    <span className="text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[140px] sm:max-w-none">Accounts Receivable &rarr; Inter-Company Reconcile</span>
                    <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">₹ 72,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">Posted</span>
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
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Open Quotations</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">14</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">₹ 21,40,000 pending value</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Sales Orders in Progress</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">8 Orders</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">6 ready for dispatch</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Invoiced This Month</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">₹ 38,15,400</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">GST auto-calculated</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Active Customers</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">142</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">Verified GSTIN profiles</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-zinc-700 dark:text-[#E6E8EE] pb-2 mb-2 border-b border-zinc-200 dark:border-[#2A2F3D]">
                  <span className="flex items-center gap-1.5"><ShoppingCart size={14} className="text-zinc-500 dark:text-[#A0A6B5]" /> Recent Sales Invoices & Orders</span>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-[#6B7184]">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">INV-2026-089</span>
                    <span className="text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[140px] sm:max-w-none">Bharat Precision Tools</span>
                    <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">₹ 3,45,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">Paid</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">SO-2026-112</span>
                    <span className="text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[140px] sm:max-w-none">Apex Automotive Components</span>
                    <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">₹ 8,12,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">Dispatched</span>
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
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Open Requisitions</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">7</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">3 pending approval</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">RFQs in Tender</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">4</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Supplier bids compared</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Open Purchase Orders</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">₹ 18,24,350</div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">12 orders awaiting GRN</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Verified GRNs</div>
                <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">98.5%</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">Inspection match rate</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-zinc-700 dark:text-[#E6E8EE] pb-2 mb-2 border-b border-zinc-200 dark:border-[#2A2F3D]">
                  <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-zinc-500 dark:text-[#A0A6B5]" /> Active Purchase Orders & Goods Receipts</span>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-[#6B7184]">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">PO-2026-044</span>
                    <span className="text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[140px] sm:max-w-none">Apex Steel Suppliers Ltd</span>
                    <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">₹ 6,80,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">GRN Inward</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">PR-2026-019</span>
                    <span className="text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[140px] sm:max-w-none">Hydraulic Seals & Bearings</span>
                    <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">₹ 1,20,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">RFQ Sent</span>
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
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Total SKU Items</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">3,420</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">Across 5 regional warehouses</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Stock Valuation</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">₹ 1,18,50,000</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">FIFO valuation method</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Low Stock Alerts</div>
                <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">3 SKUs</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">Under reorder threshold</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Warehouse Transfer Orders</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">4 Active</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">Inter-facility transit</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-zinc-700 dark:text-[#E6E8EE] pb-2 mb-2 border-b border-zinc-200 dark:border-[#2A2F3D]">
                  <span className="flex items-center gap-1.5"><Box size={14} className="text-zinc-500 dark:text-[#A0A6B5]" /> Multi-Warehouse Stock Positions</span>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-[#6B7184]">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">SKU-7721 (CNC Bit)</span>
                    <span className="text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[140px] sm:max-w-none">Central Warehouse (Bhiwandi)</span>
                    <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">840 units</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">Optimal</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">SKU-1094 (Seal Rings)</span>
                    <span className="text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[140px] sm:max-w-none">North Plant Warehouse</span>
                    <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">45 units</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">Reorder Level</span>
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
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Active Workflows</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">12 Rules</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Automated policy checks</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Pending Approvals</div>
                <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">5 Documents</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">Awaiting Manager sign-off</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Average Turnaround</div>
                <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">1.8 Hours</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Automated email prompts</div>
              </div>
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                <div className="text-[11px] text-zinc-500 dark:text-[#A0A6B5] mb-1">Audit Compliance</div>
                <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">100%</div>
                <div className="text-[10px] text-zinc-400 dark:text-[#6B7184] mt-0.5">Immutable audit trail</div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/60 p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-zinc-700 dark:text-[#E6E8EE] pb-2 mb-2 border-b border-zinc-200 dark:border-[#2A2F3D]">
                  <span className="flex items-center gap-1.5"><GitBranch size={14} className="text-zinc-500 dark:text-[#A0A6B5]" /> Live Approval Tasks & Escalations</span>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-[#6B7184]">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-200/50 dark:border-[#2A2F3D]/50 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">REQ-2026-081</span>
                    <span className="text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[140px] sm:max-w-none">PO #044 Value &gt; ₹5,00,000 &rarr; Finance Director</span>
                    <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">Stage 2 of 2</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">Pending Review</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-zinc-800 dark:text-[#E6E8EE]">REQ-2026-080</span>
                    <span className="text-zinc-600 dark:text-[#A0A6B5] truncate max-w-[140px] sm:max-w-none">Credit Note #012 &rarr; Company Admin Authorization</span>
                    <span className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">Approved</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">Completed</span>
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
