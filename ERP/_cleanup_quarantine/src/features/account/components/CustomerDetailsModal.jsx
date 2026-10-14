import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import { X, User, Phone, Mail, MapPin, CreditCard, Activity, ArrowRightLeft, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { 
  useGetCustomerTransactionsQuery,
  useGetCustomerLedgerQuery
} from '../../../api/sales-crm'
import { useParams } from 'react-router-dom'

export default function CustomerDetailsModal({ isOpen, onClose, customer }) {
  const [activeTab, setActiveTab] = useState('overview')
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const today = new Date().toISOString().split('T')[0];
  const lastYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];

  const { data: transactionsData, isLoading: isLoadingTransactions } = useGetCustomerTransactionsQuery(
    { id: customer?.id, companyId, fromDate: lastYear, toDate: today }, 
    { skip: !isOpen || !customer?.id || !companyId || activeTab !== 'transactions' }
  )

  const { data: ledgerData, isLoading: isLoadingLedger } = useGetCustomerLedgerQuery(
    { id: customer?.id, companyId, fromDate: lastYear, toDate: today }, 
    { skip: !isOpen || !customer?.id || !companyId || activeTab !== 'ledger' }
  )

  if (!isOpen || !customer) return null

  // Usually transactions and ledger might be paginated or an array
  const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData?.content || [])
  const txSummary = (transactionsData && !Array.isArray(transactionsData) && transactionsData.closingBalance !== undefined) ? transactionsData : null
  const ledger = Array.isArray(ledgerData) ? ledgerData : (ledgerData?.content || [])
  const ledgerSummary = (ledgerData && !Array.isArray(ledgerData) && ledgerData.closingBalance !== undefined) ? ledgerData : null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-md shadow-2xl ring-1 ring-zinc-200 animate-fade-in-up flex flex-col my-auto max-h-[90vh] overflow-hidden relative">
        
        {/* Header Decor (Black & White) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900" />

        {/* Header */}
        <div className="flex justify-between items-start p-6 md:p-8 border-b border-zinc-200 bg-white relative z-10">
          <div className="flex gap-4 md:gap-5 items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-900 text-white rounded-md flex items-center justify-center text-2xl font-extrabold shadow-sm shrink-0">
              {customer.customerName?.charAt(0)?.toUpperCase() || <User />}
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1.5">
                <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">{customer.customerName}</h2>
                <span className={`w-fit inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[8px] font-bold uppercase tracking-wider border ${customer.isActive ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white text-zinc-600 px-2 py-0.5 rounded-sm font-mono text-[8.8px] font-semibold border border-zinc-200">
                  {customer.customerCode || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-sm transition-colors border border-transparent hover:border-zinc-200">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 md:px-8 border-b border-zinc-200 bg-zinc-50/50 gap-6 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <User size={16} strokeWidth={2.5} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'transactions' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <ArrowRightLeft size={16} strokeWidth={2.5} /> Transactions
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'ledger' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <FileText size={16} strokeWidth={2.5} /> Ledger
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 overflow-y-auto bg-zinc-50 flex-1 relative">
          
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              {/* Left Column */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-[8.8px] font-extrabold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <User size={14} /> Contact Information
                  </h3>
                  <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm space-y-5">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-zinc-50 rounded-sm text-zinc-900 border border-zinc-200 shrink-0">
                        <Mail size={16} />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Email Address</p>
                        <p className="text-[11.2px] font-semibold text-zinc-900 mt-0.5">{customer.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="w-full h-px bg-zinc-100"></div>
                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-zinc-50 rounded-sm text-zinc-900 border border-zinc-200 shrink-0">
                        <Phone size={16} />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Phone Number</p>
                        <p className="text-[11.2px] font-semibold text-zinc-900 mt-0.5">{customer.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[8.8px] font-extrabold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Address Details
                  </h3>
                  <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-300"></div>
                    <div className="pl-2">
                      <p className="text-sm font-semibold text-zinc-900">{customer.addressLine1 || 'No street address'}</p>
                      <p className="text-sm text-zinc-500 font-medium mt-1">
                        {[customer.city, customer.state, customer.country].filter(Boolean).join(', ') || 'No city/state/country'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-[8.8px] font-extrabold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CreditCard size={14} /> Financial & Tax
                  </h3>
                  <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-900"></div>
                    <div className="grid grid-cols-2 gap-6 pl-2">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">GSTIN</p>
                        <p className="text-sm font-mono font-bold text-zinc-900 mt-1">{customer.gstin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">PAN No</p>
                        <p className="text-sm font-mono font-bold text-zinc-900 mt-1">{customer.panNo || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[8.8px] font-extrabold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={14} /> Account Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-300"></div>
                      <div className="pl-1">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Credit Limit</p>
                        <p className="text-xl font-black text-zinc-900 tracking-tight mt-1">
                          ₹{(customer.creditLimit || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-900"></div>
                      <div className="pl-1">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-900">Outstanding Balance</p>
                        <p className="text-xl font-black text-zinc-900 tracking-tight mt-1">
                          ₹{(customer.outstandingBalance || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="animate-fade-in space-y-6">
              {isLoadingTransactions ? (
                <div className="w-full bg-white rounded-md p-6 border border-zinc-200 shadow-sm"><TableSkeleton columns={4} rows={3} /></div>
              ) : (
                <>
                  {txSummary ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-300"></div>
                        <div className="pl-1">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Opening Balance</p>
                          <p className="text-xl font-black text-zinc-900 tracking-tight mt-1">₹{(txSummary.openingBalance || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-500"></div>
                        <div className="pl-1">
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">Invoice Amount</p>
                          <p className="text-xl font-black text-zinc-900 tracking-tight mt-1">₹{(txSummary.invoiceAmount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-700"></div>
                        <div className="pl-1">
                          <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-wider">Receipt Amount</p>
                          <p className="text-xl font-black text-zinc-900 tracking-tight mt-1">₹{(txSummary.receiptAmount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-900"></div>
                        <div className="pl-1">
                          <p className="text-[8px] font-bold text-zinc-900 uppercase tracking-wider">Closing Balance</p>
                          <p className="text-xl font-black text-zinc-900 tracking-tight mt-1">₹{(txSummary.closingBalance || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-100/50 border-b border-zinc-200">
                          <tr>
                <th className="w-12 text-center">S.No.</th>
                            <th className="px-5 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Date</th>
                            <th className="px-5 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Reference</th>
                            <th className="px-5 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Type</th>
                            <th className="px-5 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {transactions.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                    <td className="text-center font-medium text-zinc-500">{idx + 1}</td>
                              <td className="px-5 py-4 text-zinc-600 font-medium">{tx.date || tx.createdAt}</td>
                              <td className="px-5 py-4 font-mono text-zinc-900 font-semibold">{tx.referenceNo || tx.id}</td>
                              <td className="px-5 py-4">
                                <span className="inline-flex px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider border border-zinc-200 bg-white text-zinc-800">
                                  {tx.type || 'TX'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right font-bold text-zinc-900">
                                ₹{(tx.amount || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-16 border border-dashed border-zinc-300 rounded-md bg-white">
                      <div className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-md flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <ArrowRightLeft className="h-6 w-6 text-zinc-900" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">No transactions yet</p>
                      <p className="text-sm text-zinc-500 mt-1">This customer hasn't made any transactions.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="animate-fade-in space-y-6">
              {isLoadingLedger ? (
                <div className="w-full bg-white rounded-md p-6 border border-zinc-200 shadow-sm"><TableSkeleton columns={4} rows={3} /></div>
              ) : (
                <>
                  {/* Summary Cards */}
                  {ledgerSummary ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-300"></div>
                        <div className="pl-1">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Opening Balance</p>
                          <p className="text-xl font-black text-zinc-900 tracking-tight mt-1">₹{(ledgerSummary.openingBalance || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-500"></div>
                        <div className="pl-1">
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">Invoice Amount</p>
                          <p className="text-xl font-black text-zinc-900 tracking-tight mt-1">₹{(ledgerSummary.invoiceAmount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-700"></div>
                        <div className="pl-1">
                          <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-wider">Receipt Amount</p>
                          <p className="text-xl font-black text-zinc-900 tracking-tight mt-1">₹{(ledgerSummary.receiptAmount || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-md p-5 border border-zinc-200 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[2.4px] bg-zinc-900"></div>
                        <div className="pl-1">
                          <p className="text-[8px] font-bold text-zinc-900 uppercase tracking-wider">Closing Balance</p>
                          <p className="text-xl font-black text-zinc-900 tracking-tight mt-1">₹{(ledgerSummary.closingBalance || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : ledger.length > 0 ? (
                    <div className="bg-white border border-zinc-200 rounded-md shadow-sm overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-100/50 border-b border-zinc-200">
                          <tr>
                <th className="w-12 text-center">S.No.</th>
                            <th className="px-5 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Date</th>
                            <th className="px-5 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500">Description</th>
                            <th className="px-5 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Debit</th>
                            <th className="px-5 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Credit</th>
                            <th className="px-5 py-3 text-[8.8px] font-bold uppercase tracking-wider text-zinc-500 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {ledger.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="text-center font-medium text-zinc-500">{idx + 1}</td>
                              <td className="px-5 py-4 text-zinc-600 font-medium">{entry.date}</td>
                              <td className="px-5 py-4 font-semibold text-zinc-900">{entry.description}</td>
                              <td className="px-5 py-4 text-right font-bold text-zinc-600">{entry.debit ? `₹${entry.debit.toLocaleString()}` : '-'}</td>
                              <td className="px-5 py-4 text-right font-bold text-zinc-900">{entry.credit ? `₹${entry.credit.toLocaleString()}` : '-'}</td>
                              <td className="px-5 py-4 text-right font-black text-zinc-900 tracking-tight">₹{(entry.balance || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-16 border border-dashed border-zinc-300 rounded-md bg-white">
                      <div className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-md flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <FileText className="h-6 w-6 text-zinc-900" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">No ledger entries</p>
                      <p className="text-sm text-zinc-500 mt-1">This customer's ledger is empty.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
