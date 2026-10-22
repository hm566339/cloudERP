import React, { useState, useMemo } from 'react';
import Modal from '../../../components/common/Modal';
import { useApiQuery } from '../../../hooks/useApi';
import { apPaymentsApi } from '../../../api/account/apPayments';
import { vendorsApi } from '../../../api/account/vendors';
import CustomSelect from '../../../components/common/CustomSelect';
import { formatCurrency } from '../../../utils/formatters';
import { format } from 'date-fns';
import { Printer, Download, BookOpen } from 'lucide-react';

export default function VendorLedgerModal({ isOpen, onClose, initialVendorId = '' }) {
  const [vendorId, setVendorId] = useState(initialVendorId);
  const [fromDate, setFromDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Data Fetching
  const { data: vendorsData } = useApiQuery(vendorsApi.getVendors, { size: 1000 }, { skip: !isOpen });
  
  const vendorOptions = useMemo(() => {
    const list = Array.isArray(vendorsData) ? vendorsData : vendorsData?.data?.content || vendorsData?.content || [];
    return list.map(v => ({ value: v.id, label: v.vendorName }));
  }, [vendorsData]);

  const canFetch = !!vendorId && !!fromDate && !!toDate;
  
  const { data: ledgerResponse, loading: isLoadingLedger, execute: fetchLedger } = useApiQuery(
    apPaymentsApi.getLedger,
    { vendorId, params: { fromDate, toDate } },
    { skip: !canFetch }
  );

  const ledger = ledgerResponse?.data || ledgerResponse;
  const ledgerLines = ledger?.ledgerLines || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Date', 'Invoice Amount', 'Payment Amount', 'Balance'];
    const rows = ledgerLines.map(line => [
      line.transactionDate ? format(new Date(line.transactionDate), 'yyyy-MM-dd') : '-',
      line.invoiceAmount || 0,
      line.paymentAmount || 0,
      line.balance || 0
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vendor_Ledger_${vendorId}_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vendor Ledger"
      size="5xl"
    >
      <div className="space-y-6">
        
        {/* Filters */}
        <div className="bg-zinc-50 dark:bg-[#1D212C] p-4 rounded-lg border border-zinc-200 dark:border-[#2A2F3D] grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <CustomSelect
              label="Select Vendor *"
              value={vendorId}
              options={vendorOptions}
              onChange={(e) => setVendorId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">From Date *</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-2 border border-zinc-300 dark:border-[#2A2F3D] rounded focus:ring-zinc-900/10 dark:focus:ring-white/10 bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">To Date *</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full p-2 border border-zinc-300 dark:border-[#2A2F3D] rounded focus:ring-zinc-900/10 dark:focus:ring-white/10 bg-white dark:bg-[#161922] text-zinc-900 dark:text-[#E6E8EE]"
            />
          </div>
        </div>

        {/* Action Bar */}
        {canFetch && ledger && !isLoadingLedger && (
          <div className="flex justify-end gap-2">
            <button 
              onClick={handleExport}
              className="flex items-center px-3 py-2 bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736]"
            >
              <Download size={16} className="mr-2" /> Export CSV
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center px-3 py-2 bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#222736]"
            >
              <Printer size={16} className="mr-2" /> Print
            </button>
          </div>
        )}

        {isLoadingLedger ? (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center">
            <span className="animate-spin w-8 h-8 border-4 border-zinc-900 dark:border-[#4C8DFF] border-t-transparent rounded-full mb-4"></span>
            Loading ledger data...
          </div>
        ) : !canFetch ? (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
            <BookOpen className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p>Select a Vendor and Date Range to view the ledger.</p>
          </div>
        ) : ledger ? (
          <div className="space-y-6">
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Opening Balance</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] mt-1">{formatCurrency(ledger.openingBalance || 0)}</p>
              </div>
              <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Invoices</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] mt-1">{formatCurrency(ledger.totalInvoices || 0)}</p>
              </div>
              <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Payments</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] mt-1">{formatCurrency(ledger.totalPayments || 0)}</p>
              </div>
              <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 shadow-sm">
                <p className="text-sm text-blue-700 dark:text-blue-400">Closing Balance</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">{formatCurrency(ledger.closingBalance || 0)}</p>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden print-friendly">
              <div className="p-4 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]">
                <h3 className="font-semibold text-zinc-900 dark:text-[#E6E8EE]">Ledger Statement: {ledger.vendorName}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">({ledger.vendorCode}) • From {format(new Date(fromDate), 'dd MMM yyyy')} to {format(new Date(toDate), 'dd MMM yyyy')}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
                  <thead className="bg-zinc-50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D] text-xs uppercase text-zinc-700 dark:text-zinc-300 font-semibold">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Invoice Amount</th>
                      <th className="px-4 py-3 text-right">Payment Amount</th>
                      <th className="px-4 py-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-[#2A2F3D]">
                    <tr className="bg-zinc-50 dark:bg-[#1D212C]/50">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-[#E6E8EE] italic">Opening Balance</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-[#E6E8EE]">{formatCurrency(ledger.openingBalance || 0)}</td>
                    </tr>
                    {ledgerLines.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                          No transactions found for the selected date range.
                        </td>
                      </tr>
                    ) : (
                      ledgerLines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#222736]/50">
                          <td className="px-4 py-3">
                            {line.transactionDate ? format(new Date(line.transactionDate), 'dd MMM yyyy') : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-900 dark:text-[#E6E8EE]">
                            {line.invoiceAmount > 0 ? formatCurrency(line.invoiceAmount) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-blue-600 dark:text-[#4C8DFF]">
                            {line.paymentAmount > 0 ? formatCurrency(line.paymentAmount) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-[#E6E8EE]">
                            {formatCurrency(line.balance)}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-zinc-50 dark:bg-[#1D212C]/50 border-t-2 border-zinc-300 dark:border-[#2A2F3D]">
                      <td className="px-4 py-3 font-bold text-zinc-900 dark:text-[#E6E8EE] text-right">Closing Balance</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-400">{formatCurrency(ledger.closingBalance || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
            Failed to load ledger data.
          </div>
        )}
      </div>
      
      <div className="flex justify-end pt-6 border-t border-zinc-200 dark:border-[#2A2F3D] mt-8">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#1D212C] border border-zinc-300 dark:border-[#2A2F3D] rounded hover:bg-zinc-50 dark:hover:bg-[#222736]"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
