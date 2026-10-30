import React, { useState } from 'react';
import { Banknote, ShoppingCart, Briefcase, Box, GitBranch } from 'lucide-react';

export default function LandingDemoPreview() {
  const [previewTab, setPreviewTab] = useState('finance');

  return (
    <div className="mt-14 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-[#D5D8CA] bg-[#F7F7F0] p-3 sm:p-5 shadow-[0_20px_50px_-20px_rgba(46,61,40,0.12)] text-left">
        {/* Window Header Mock */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#D5D8CA] text-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E57373]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFB74D]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#81C784]" />
            <span className="ml-2 font-mono text-[11px] text-[#485942]">
              Mark2 ERP Workspace
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EDEEE4] text-[#485942] border border-[#D5D8CA]">
              Interactive Workspace Preview
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-[#EDEEE4] text-[#2E3D28] font-semibold font-mono border border-[#D5D8CA]">
              Company: APEX-INDIA
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#DCE2CF] text-[#2E3D28] font-bold border border-[#A9B887]/50">
              Active Session
            </span>
          </div>
        </div>

        {/* Module Switcher Tabs for Preview (Responsive Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 py-3 border-b border-[#D5D8CA] overflow-x-auto text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setPreviewTab('finance')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'finance'
                ? 'bg-[#2E3D28] text-white shadow-xs'
                : 'text-[#485942] hover:bg-[#EDEEE4] hover:text-[#2E3D28]'
            }`}
          >
            <Banknote size={14} /> Finance & Ledgers
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('sales')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'sales'
                ? 'bg-[#2E3D28] text-white shadow-xs'
                : 'text-[#485942] hover:bg-[#EDEEE4] hover:text-[#2E3D28]'
            }`}
          >
            <ShoppingCart size={14} /> Sales & Invoices
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('purchase')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'purchase'
                ? 'bg-[#2E3D28] text-white shadow-xs'
                : 'text-[#485942] hover:bg-[#EDEEE4] hover:text-[#2E3D28]'
            }`}
          >
            <Briefcase size={14} /> Procurement & POs
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('inventory')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'inventory'
                ? 'bg-[#2E3D28] text-white shadow-xs'
                : 'text-[#485942] hover:bg-[#EDEEE4] hover:text-[#2E3D28]'
            }`}
          >
            <Box size={14} /> Multi-Warehouse Stock
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('workflows')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              previewTab === 'workflows'
                ? 'bg-[#2E3D28] text-white shadow-xs'
                : 'text-[#485942] hover:bg-[#EDEEE4] hover:text-[#2E3D28]'
            }`}
          >
            <GitBranch size={14} /> Approvals & Workflows
          </button>
        </div>

        {/* Tab 1: Finance Preview */}
        {previewTab === 'finance' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Monthly Sales Revenue</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">₹ 42,85,600</div>
                <div className="text-[10px] text-[#2E3D28] font-semibold mt-0.5">+14.2% from last period</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Accounts Receivable</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">₹ 8,90,400</div>
                <div className="text-[10px] text-[#485942] mt-0.5">18 open customer balances</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Accounts Payable</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">₹ 6,15,000</div>
                <div className="text-[10px] text-[#485942] mt-0.5">9 vendor bills pending</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">General Ledger Tally</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">Balanced</div>
                <div className="text-[10px] text-[#485942] mt-0.5">Trial Balance in equilibrium</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#D5D8CA] bg-[#EDEEE4] p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-[#2E3D28] pb-2 mb-2 border-b border-[#D5D8CA]">
                  <span className="flex items-center gap-1.5"><Banknote size={14} className="text-[#485942]" /> Recent Posted Journal Entries</span>
                  <span className="text-[10px] font-mono text-[#485942]">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-[#D5D8CA]/60 text-[11px]">
                    <span className="font-mono font-medium text-[#2E3D28]">JV-2026-0041</span>
                    <span className="text-[#485942] truncate max-w-[140px] sm:max-w-none">HDFC Bank Operating A/c &rarr; Vendor Settlement</span>
                    <span className="font-semibold text-[#2E3D28]">₹ 1,84,500</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/50">Posted</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-[#2E3D28]">JV-2026-0040</span>
                    <span className="text-[#485942] truncate max-w-[140px] sm:max-w-none">Accounts Receivable &rarr; Inter-Company Reconcile</span>
                    <span className="font-semibold text-[#2E3D28]">₹ 72,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/50">Posted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sales Preview */}
        {previewTab === 'sales' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Open Quotations</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">14</div>
                <div className="text-[10px] text-[#2E3D28] font-semibold mt-0.5">₹ 21,40,000 pending value</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Sales Orders in Progress</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">8 Orders</div>
                <div className="text-[10px] text-[#2E3D28] font-semibold mt-0.5">6 ready for dispatch</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Invoiced This Month</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">₹ 38,15,400</div>
                <div className="text-[10px] text-[#485942] mt-0.5">GST auto-calculated</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Active Customers</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">142</div>
                <div className="text-[10px] text-[#485942] mt-0.5">Verified GSTIN profiles</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#D5D8CA] bg-[#EDEEE4] p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-[#2E3D28] pb-2 mb-2 border-b border-[#D5D8CA]">
                  <span className="flex items-center gap-1.5"><ShoppingCart size={14} className="text-[#485942]" /> Recent Sales Invoices & Orders</span>
                  <span className="text-[10px] font-mono text-[#485942]">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-[#D5D8CA]/60 text-[11px]">
                    <span className="font-mono font-medium text-[#2E3D28]">INV-2026-089</span>
                    <span className="text-[#485942] truncate max-w-[140px] sm:max-w-none">Bharat Precision Tools</span>
                    <span className="font-semibold text-[#2E3D28]">₹ 3,45,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/50">Paid</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-[#2E3D28]">SO-2026-112</span>
                    <span className="text-[#485942] truncate max-w-[140px] sm:max-w-none">Apex Automotive Components</span>
                    <span className="font-semibold text-[#2E3D28]">₹ 8,12,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/50">Dispatched</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Procurement Preview */}
        {previewTab === 'purchase' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Open Requisitions</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">7</div>
                <div className="text-[10px] text-[#485942] mt-0.5">3 pending approval</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">RFQs in Tender</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">4</div>
                <div className="text-[10px] text-[#2E3D28] font-semibold mt-0.5">Supplier bids compared</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Open Purchase Orders</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">₹ 18,24,350</div>
                <div className="text-[10px] text-[#485942] mt-0.5">12 orders awaiting GRN</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Verified GRNs</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">98.5%</div>
                <div className="text-[10px] text-[#485942] mt-0.5">Inspection match rate</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#D5D8CA] bg-[#EDEEE4] p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-[#2E3D28] pb-2 mb-2 border-b border-[#D5D8CA]">
                  <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-[#485942]" /> Active Purchase Orders & Goods Receipts</span>
                  <span className="text-[10px] font-mono text-[#485942]">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-[#D5D8CA]/60 text-[11px]">
                    <span className="font-mono font-medium text-[#2E3D28]">PO-2026-044</span>
                    <span className="text-[#485942] truncate max-w-[140px] sm:max-w-none">Apex Steel Suppliers Ltd</span>
                    <span className="font-semibold text-[#2E3D28]">₹ 6,80,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/50">GRN Inward</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-[#2E3D28]">PR-2026-019</span>
                    <span className="text-[#485942] truncate max-w-[140px] sm:max-w-none">Hydraulic Seals & Bearings</span>
                    <span className="font-semibold text-[#2E3D28]">₹ 1,20,000</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/50">RFQ Sent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Inventory Preview */}
        {previewTab === 'inventory' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Total SKU Items</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">3,420</div>
                <div className="text-[10px] text-[#485942] mt-0.5">Across 5 regional warehouses</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Stock Valuation</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">₹ 1,18,50,000</div>
                <div className="text-[10px] text-[#2E3D28] font-semibold mt-0.5">FIFO valuation method</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Low Stock Alerts</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">3 SKUs</div>
                <div className="text-[10px] text-[#485942] mt-0.5">Under reorder threshold</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Warehouse Transfer Orders</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">4 Active</div>
                <div className="text-[10px] text-[#485942] mt-0.5">Inter-facility transit</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#D5D8CA] bg-[#EDEEE4] p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-[#2E3D28] pb-2 mb-2 border-b border-[#D5D8CA]">
                  <span className="flex items-center gap-1.5"><Box size={14} className="text-[#485942]" /> Multi-Warehouse Stock Positions</span>
                  <span className="text-[10px] font-mono text-[#485942]">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-[#D5D8CA]/60 text-[11px]">
                    <span className="font-mono font-medium text-[#2E3D28]">SKU-7721 (CNC Bit)</span>
                    <span className="text-[#485942] truncate max-w-[140px] sm:max-w-none">Central Warehouse (Bhiwandi)</span>
                    <span className="font-semibold text-[#2E3D28]">840 units</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/50">Optimal</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-[#2E3D28]">SKU-1094 (Seal Rings)</span>
                    <span className="text-[#485942] truncate max-w-[140px] sm:max-w-none">North Plant Warehouse</span>
                    <span className="font-semibold text-[#2E3D28]">45 units</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/50">Reorder Level</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Workflows & Approvals Preview */}
        {previewTab === 'workflows' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Active Workflows</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">12 Rules</div>
                <div className="text-[10px] text-[#2E3D28] font-semibold mt-0.5">Automated policy checks</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Pending Approvals</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">5 Documents</div>
                <div className="text-[10px] text-[#485942] mt-0.5">Awaiting Manager sign-off</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Average Turnaround</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">1.8 Hours</div>
                <div className="text-[10px] text-[#485942] mt-0.5">Automated email prompts</div>
              </div>
              <div className="p-3.5 rounded-xl border border-[#D5D8CA] bg-white">
                <div className="text-[11px] text-[#485942] mb-1">Audit Compliance</div>
                <div className="text-base sm:text-lg font-bold text-[#2E3D28]">100%</div>
                <div className="text-[10px] text-[#485942] mt-0.5">Immutable audit trail</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#D5D8CA] bg-[#EDEEE4] p-3 sm:p-4 text-xs overflow-x-auto">
              <div className="min-w-[380px] sm:min-w-0">
                <div className="flex items-center justify-between font-semibold text-[#2E3D28] pb-2 mb-2 border-b border-[#D5D8CA]">
                  <span className="flex items-center gap-1.5"><GitBranch size={14} className="text-[#485942]" /> Live Approval Tasks & Escalations</span>
                  <span className="text-[10px] font-mono text-[#485942]">Sample Records</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between py-1 border-b border-[#D5D8CA]/60 text-[11px]">
                    <span className="font-mono font-medium text-[#2E3D28]">REQ-2026-081</span>
                    <span className="text-[#485942] truncate max-w-[140px] sm:max-w-none">PO #044 Value &gt; ₹5,00,000 &rarr; Finance Director</span>
                    <span className="font-semibold text-[#2E3D28]">Stage 2 of 2</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/50">Pending Review</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-[11px]">
                    <span className="font-mono font-medium text-[#2E3D28]">REQ-2026-080</span>
                    <span className="text-[#485942] truncate max-w-[140px] sm:max-w-none">Credit Note #012 &rarr; Company Admin Authorization</span>
                    <span className="font-semibold text-[#2E3D28]">Approved</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#DCE2CF] text-[#2E3D28] border border-[#A9B887]/50">Completed</span>
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
