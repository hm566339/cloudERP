import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, User, MapPin, CreditCard, Activity, CheckCircle, AlertCircle,
  MoreVertical, Printer, Download, FileText, Plus, ExternalLink, Calendar,
  Receipt, ShoppingCart, ArrowRightLeft, FileSearch, Building2, Phone, Mail, FileCheck2,
  ChevronDown, Building, Hash, Shield, Clock, IndianRupee, LayoutDashboard, BookOpen, PackageOpen
} from 'lucide-react';
import { vendorsApi } from '../../../api/account';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';
import KPICard from '../../../components/common/KPICard';
import VendorFormModal from '../components/VendorFormModal';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import { Trash2 } from 'lucide-react';
import { useRoutePath } from '../../../hooks/useRoutePath';
import EntityHeader from '../../../components/common/EntityHeader';
import InfoCard, { InfoField } from '../../../components/common/InfoCard';
import QuickActionsCard from '../../../components/common/QuickActionsCard';

export default function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  const paginate = (array) => {
    if (!array) return [];
    return array.slice(page * pageSize, (page + 1) * pageSize);
  };

  const fetchVendor = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vendorsApi.getVendorById(id);
      const data = response?.data || response?.content || response;
      setVendor(data);
    } catch (err) {
      console.error("Failed to fetch vendor details:", err);
      setError(err.response?.status === 404 ? "Vendor Not Found" : "Failed to load vendor details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVendor();
    }
  }, [id]);

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: 'Delete Vendor',
      message: 'Are you sure you want to delete this vendor? This action cannot be undone.',
    });

    if (confirmed) {
      try {
        await vendorsApi.deleteVendor(id);
        dispatch(addAlert({ type: 'success', message: 'Vendor deleted successfully' }));
        navigate(buildPath('/accounts/masters/vendors'));
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete vendor' }));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-md animate-spin"></div>
          <p className="text-sm font-medium text-zinc-500">Loading comprehensive profile...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-8 mt-6 max-w-lg mx-auto bg-white rounded-md border border-rose-200 shadow-sm text-center animate-fade-in">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-md flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">{error || "Vendor Not Found"}</h2>
        <p className="text-sm text-zinc-500 mb-6">We couldn't find the requested vendor record.</p>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-sm font-semibold transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'ledger', label: 'Ledger', icon: BookOpen },
    { id: 'purchase-bills', label: 'Purchase Bills', icon: FileText },
    { id: 'payments', label: 'Payments', icon: Receipt },
    { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'grn', label: 'GRN', icon: PackageOpen },
    { id: 'debit-notes', label: 'Debit Notes', icon: FileCheck2 },
    { id: 'credit-notes', label: 'Credit Notes', icon: FileSearch },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    { id: 'contacts', label: 'Contacts', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'audit', label: 'Audit Log', icon: Shield },
  ];

  const ledgerInfo = vendor.ledgerInformation || {};
  const stats = vendor.statistics || {};
  const outstanding = vendor.outstandingPayables || vendor.outstandingDetails || {};
  const purchaseBills = vendor.purchaseBills || [];
  const payments = vendor.payments || [];
  const orders = vendor.purchaseOrders || [];
  const grn = vendor.grn || [];
  const creditNotes = vendor.creditNotes || [];
  const debitNotes = vendor.debitNotes || [];
  const transactions = vendor.recentTransactions || [];
  const ledgerEntries = vendor.ledgerEntries || [];
  const contacts = vendor.contacts || [];
  const addresses = vendor.addresses || [];

  const kpiStrip = (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 xl:gap-4 pb-6">
      <KPICard 
        title="Outst. Payables" 
        value={formatCurrency(outstanding.totalOutstanding || outstanding.totalPayable)} 
        valueClass={(outstanding.totalOutstanding || outstanding.totalPayable) > 0 ? "text-rose-600" : "text-emerald-600"}
        icon={AlertCircle}
      />
      <KPICard 
        title="Credit Limit" 
        value={formatCurrency(ledgerInfo.creditLimit || vendor.creditLimit)} 
        icon={Shield}
      />
      <KPICard 
        title="Available Credit" 
        value={formatCurrency(ledgerInfo.availableCredit || vendor.availableCredit)} 
        valueClass="text-emerald-600"
        icon={CheckCircle}
      />
      <KPICard 
        title="Total Purchases" 
        value={formatCurrency(stats.totalPurchases || stats.totalPurchaseAmount)} 
        icon={IndianRupee}
      />
      <KPICard 
        title="Purchase Bills" 
        value={stats.totalBills || stats.totalPurchaseBills || '0'} 
        subtitle={`Last: ${stats.lastPurchaseDate || 'N/A'}`}
        icon={FileText}
      />
    </div>
  );

  const headerActions = [
    {
      label: 'Edit Vendor',
      icon: Edit2,
      variant: 'secondary',
      permission: { module: 'VENDORS', action: 'UPDATE', behavior: 'disable' },
      onClick: () => setIsEditModalOpen(true)
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'danger',
      permission: { module: 'VENDORS', action: 'DELETE', behavior: 'hide' },
      onClick: handleDelete
    },
    {
      label: 'More Actions',
      type: 'dropdown',
      variant: 'primary',
      items: [
        {
          label: 'Create Purchase Bill',
          icon: FileText,
          permission: { module: 'AP_BILLS', action: 'CREATE', behavior: 'hide' },
          onClick: () => navigate(buildPath('/accounts/finance/ap-bills/new'), { state: { vendorId: vendor.id } })
        },
        {
          label: 'Record Payment',
          icon: Receipt,
          permission: { module: 'PAYMENTS', action: 'CREATE', behavior: 'hide' },
          onClick: () => navigate(buildPath('/accounts/finance/payments/new'), { state: { vendorId: vendor.id } })
        },
        { type: 'divider' },
        { label: 'Print Statement', icon: Printer, onClick: () => window.print() },
        { label: 'Export PDF', icon: Download, onClick: () => window.print() }
      ]
    }
  ];

  const headerMetadata = [
    { icon: Hash, label: vendor.vendorCode || 'N/A' },
    { icon: Building, label: vendor.companyName || 'N/A' },
    { icon: Clock, label: `Updated ${vendor.updatedAt ? new Date(vendor.updatedAt).toLocaleDateString() : 'N/A'}` }
  ];

  const quickActions = [
    {
      label: 'Create Purchase Bill',
      icon: FileText,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trailingIcon: Plus,
      permission: { module: 'AP_BILLS', action: 'CREATE' },
      onClick: () => navigate(buildPath('/accounts/finance/ap-bills/new'), { state: { vendorId: vendor.id } })
    },
    {
      label: 'Record Payment',
      icon: Receipt,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trailingIcon: Plus,
      permission: { module: 'PAYMENTS', action: 'CREATE' },
      onClick: () => navigate(buildPath('/accounts/finance/payments/new'), { state: { vendorId: vendor.id } })
    },
    {
      label: 'View Ledger',
      icon: BookOpen,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trailingIcon: ExternalLink,
      onClick: () => setActiveTab('ledger')
    }
  ];

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      
      <EntityHeader
        onBack={() => navigate(-1)}
        title={vendor.vendorName}
        badge={{ isActive: vendor.isActive }}
        metadata={headerMetadata}
        actions={headerActions}
        bottomSlot={kpiStrip}
        sticky
      />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR (30%) */}
          <div className="w-full lg:w-[30%] space-y-5">
            <InfoCard title="Vendor Details" icon={User} iconBg="bg-blue-50" iconColor="text-blue-600">
              <div className="space-y-4">
                <InfoField label="Vendor Code" value={vendor.vendorCode} mono />
                <InfoField label="Company Name" value={vendor.companyName} />
                <InfoField label="Phone" value={vendor.phone} />
                <InfoField label="Email" value={vendor.email} />
                <InfoField label="Website" value={vendor.website} />
              </div>
            </InfoCard>

            <InfoCard title="Tax & Compliance" icon={FileCheck2} iconBg="bg-emerald-50" iconColor="text-emerald-600">
              <div className="space-y-4">
                <InfoField label="GSTIN" value={vendor.gstin} mono highlight />
                <InfoField label="PAN Number" value={vendor.panNo} mono />
                
                <div>
                  <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">TDS Info</p>
                  <div className="bg-zinc-50/50 p-2.5 rounded-md border border-zinc-200/60">
                    <div className="flex justify-between items-center text-sm mb-1.5">
                      <span className="text-zinc-500 font-medium">Applicable</span>
                      <span className="text-zinc-900 font-bold">{vendor.isTdsApplicable ? 'Yes' : 'No'}</span>
                    </div>
                    {vendor.isTdsApplicable && (
                      <>
                        <div className="flex justify-between items-center text-sm mb-1.5">
                          <span className="text-zinc-500 font-medium">Section</span>
                          <span className="text-zinc-900 font-bold">{vendor.tdsSection || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500 font-medium">Rate</span>
                          <span className="text-zinc-900 font-bold">{vendor.tdsRate ? `${vendor.tdsRate}%` : 'N/A'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <InfoField 
                  label="Payable Account" 
                  value={vendor.payableAccountCode ? `${vendor.payableAccountCode} - ${vendor.payableAccountName || ''}` : 'N/A'} 
                />
              </div>
            </InfoCard>

            <QuickActionsCard title="Quick Actions" actions={quickActions} />
          </div>

          {/* RIGHT TABS AREA (70%) */}
          <div className="w-full lg:w-[70%]">
            <div className="bg-zinc-100/50 p-1.5 rounded-lg border border-zinc-200/50 overflow-x-auto mb-6">
              <div className="flex items-center min-w-max gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-2 py-2 text-xs xl:text-sm font-semibold rounded-md transition-all outline-none ${
                      activeTab === tab.id 
                        ? 'bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-zinc-200/60' 
                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/80 border border-transparent'
                    }`}
                  >
                    <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? "text-zinc-900" : "text-zinc-400"} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[400px]">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-6">
                  {/* Ledger Summary Visual */}
                  <div className="bg-white p-6 rounded-md border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-800 mb-6 flex items-center gap-2">
                      <Activity size={16} className="text-zinc-500" /> Credit Utilization
                    </h3>
                    
                    <div className="relative pt-2">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-md text-rose-600 bg-rose-100">
                            Outstanding: {formatCurrency(outstanding.totalOutstanding || outstanding.totalPayable)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-md text-zinc-600 bg-zinc-100">
                            Limit: {formatCurrency(ledgerInfo.creditLimit || vendor.creditLimit)}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-md bg-emerald-100">
                        <div style={{ width: `${Math.min(100, (((outstanding.totalOutstanding || outstanding.totalPayable) || 0) / ((ledgerInfo.creditLimit || vendor.creditLimit) || 1)) * 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-500 transition-all duration-1000"></div>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        <span>0%</span>
                        <span>Available: <span className="text-emerald-600">{formatCurrency(ledgerInfo.availableCredit || vendor.availableCredit)}</span></span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-zinc-100">
                       <div>
                         <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Opening Balance</p>
                         <p className="text-lg font-black text-zinc-900 mt-1">{formatCurrency(ledgerInfo.openingBalance)}</p>
                       </div>
                       <div>
                         <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Current Balance</p>
                         <p className="text-lg font-black text-zinc-900 mt-1">{formatCurrency(ledgerInfo.currentBalance)}</p>
                       </div>
                       <div>
                         <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Overdue Amount</p>
                         <p className="text-lg font-black text-rose-600 mt-1">{formatCurrency(outstanding.overdueAmount)}</p>
                       </div>
                       <div>
                         <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Not Yet Due</p>
                         <p className="text-lg font-black text-zinc-900 mt-1">{formatCurrency(outstanding.notYetDueAmount)}</p>
                       </div>
                    </div>
                  </div>

                  {/* Ageing Summary */}
                  <div className="bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                        <Calendar size={16} className="text-zinc-500" /> Ageing Summary
                      </h3>
                    </div>
                    <div className="p-6">
                      {Object.keys(outstanding.ageingSummary || {}).length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                           {Object.entries(outstanding.ageingSummary).map(([key, val]) => (
                             <div key={key} className="p-3 bg-zinc-50 border border-zinc-100 rounded-md">
                               <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">{key}</p>
                               <p className="text-sm font-bold text-zinc-900 mt-1">{formatCurrency(val)}</p>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <EmptyState icon={Calendar} title="No ageing records" description="No ageing data available." />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PURCHASE BILLS TAB */}
              {activeTab === 'purchase-bills' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Purchase Bills</h3>
                    <span className="text-xs font-bold bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md">{purchaseBills.length} Total</span>
                  </div>
                  {purchaseBills.length > 0 ? (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-white border-b border-zinc-200 text-[8.8px] uppercase tracking-wider text-zinc-500 font-bold">
                            <tr>
                              <th className="px-6 py-4">Invoice No</th>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Due Date</th>
                              <th className="px-6 py-4 text-right">Amount</th>
                              <th className="px-6 py-4 text-right">Pending</th>
                              <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {paginate(purchaseBills).map((bill, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-zinc-900">{bill.invoiceNumber || bill.billNumber}</td>
                                <td className="px-6 py-4 font-medium text-zinc-600">{bill.invoiceDate || bill.billDate}</td>
                                <td className="px-6 py-4 font-medium text-zinc-600">{bill.dueDate}</td>
                                <td className="px-6 py-4 font-bold text-zinc-900 text-right">{formatCurrency(bill.invoiceAmount || bill.amount)}</td>
                                <td className="px-6 py-4 font-bold text-rose-600 text-right">{formatCurrency(bill.pendingAmount)}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex px-2.5 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider border ${bill.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                                    {bill.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Pagination 
                        page={page}
                        totalPages={Math.ceil(purchaseBills.length / pageSize)}
                        totalElements={purchaseBills.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                        itemName="purchase bills"
                      />
                    </div>
                  ) : (
                    <EmptyState icon={FileText} title="No purchase bills" description="This vendor does not have any purchase bills." />
                  )}
                </div>
              )}

              {/* PAYMENTS TAB */}
              {activeTab === 'payments' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Payments</h3>
                    <span className="text-xs font-bold bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md">{payments.length} Total</span>
                  </div>
                  {payments.length > 0 ? (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-white border-b border-zinc-200 text-[8.8px] uppercase tracking-wider text-zinc-500 font-bold">
                            <tr>
                              <th className="px-6 py-4">Payment No</th>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4 text-right">Amount</th>
                              <th className="px-6 py-4">Mode</th>
                              <th className="px-6 py-4">Reference</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {paginate(payments).map((pmt, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-zinc-900">{pmt.paymentNumber}</td>
                                <td className="px-6 py-4 font-medium text-zinc-600">{pmt.paymentDate}</td>
                                <td className="px-6 py-4 font-bold text-emerald-600 text-right">{formatCurrency(pmt.amount)}</td>
                                <td className="px-6 py-4 font-medium text-zinc-700">{pmt.paymentMode}</td>
                                <td className="px-6 py-4 font-mono text-zinc-500 text-xs">{pmt.referenceNumber || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Pagination 
                        page={page}
                        totalPages={Math.ceil(payments.length / pageSize)}
                        totalElements={payments.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                        itemName="payments"
                      />
                    </div>
                  ) : (
                    <EmptyState icon={Receipt} title="No payments" description="There are no payments recorded for this vendor." />
                  )}
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Purchase Orders</h3>
                  </div>
                  {orders.length > 0 ? (
                    <div className="p-6">Table goes here</div>
                  ) : (
                    <EmptyState icon={ShoppingCart} title="No purchase orders" description="There are no purchase orders recorded for this vendor." />
                  )}
                </div>
              )}

              {/* GRN TAB */}
              {activeTab === 'grn' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Goods Receipt Notes (GRN)</h3>
                  </div>
                  {grn.length > 0 ? (
                    <div className="p-6">Table goes here</div>
                  ) : (
                    <EmptyState icon={PackageOpen} title="No GRN" description="There are no goods receipt notes recorded for this vendor." />
                  )}
                </div>
              )}
              
              {/* CREDIT NOTES TAB */}
              {activeTab === 'credit-notes' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Credit Notes</h3>
                  </div>
                  {creditNotes.length > 0 ? (
                    <div className="p-6">Table goes here</div>
                  ) : (
                    <EmptyState icon={FileSearch} title="No credit notes" description="There are no credit notes recorded for this vendor." />
                  )}
                </div>
              )}

              {/* DEBIT NOTES TAB */}
              {activeTab === 'debit-notes' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Debit Notes</h3>
                  </div>
                  {debitNotes.length > 0 ? (
                    <div className="p-6">Table goes here</div>
                  ) : (
                    <EmptyState icon={FileCheck2} title="No debit notes" description="There are no debit notes recorded for this vendor." />
                  )}
                </div>
              )}

              {/* TRANSACTIONS TAB */}
              {activeTab === 'transactions' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Recent Transactions</h3>
                  </div>
                  {transactions.length > 0 ? (
                    <div className="p-0">
                       <ul className="divide-y divide-zinc-100">
                         {paginate(transactions).map((tx, idx) => (
                           <li key={idx} className="p-6 hover:bg-zinc-50 transition-colors flex items-start gap-4">
                             <div className={`p-3 rounded-md border shadow-sm ${tx.transactionType === 'INVOICE' || tx.transactionType === 'BILL' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                {tx.transactionType === 'INVOICE' || tx.transactionType === 'BILL' ? <FileText size={20} /> : <Receipt size={20} />}
                             </div>
                             <div className="flex-1">
                               <div className="flex justify-between items-start">
                                 <div>
                                   <p className="text-sm font-bold text-zinc-900">{tx.transactionType} <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded-md text-xs ml-2 border border-zinc-200">{tx.referenceNumber}</span></p>
                                   <p className="text-xs font-semibold text-zinc-500 mt-1">{tx.date}</p>
                                 </div>
                                 <div className="text-right">
                                   <p className="text-base font-black text-zinc-900">{formatCurrency(tx.amount)}</p>
                                   <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider ${tx.status === 'DRAFT' ? 'bg-zinc-100 text-zinc-600' : 'bg-emerald-100 text-emerald-700'}`}>{tx.status}</span>
                                 </div>
                               </div>
                             </div>
                           </li>
                         ))}
                       </ul>
                       <Pagination 
                         page={page}
                         totalPages={Math.ceil(transactions.length / pageSize)}
                         totalElements={transactions.length}
                         pageSize={pageSize}
                         onPageChange={setPage}
                         onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                         itemName="transactions"
                       />
                    </div>
                  ) : (
                    <EmptyState icon={ArrowRightLeft} title="No recent transactions" description="No transactions have been logged recently." />
                  )}
                </div>
              )}

              {/* LEDGER TAB */}
              {activeTab === 'ledger' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Account Ledger</h3>
                  </div>
                  {ledgerEntries.length > 0 ? (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-white border-b border-zinc-200 text-[8.8px] uppercase tracking-wider text-zinc-500 font-bold">
                            <tr>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Voucher</th>
                              <th className="px-6 py-4">Reference</th>
                              <th className="px-6 py-4 text-right">Debit</th>
                              <th className="px-6 py-4 text-right">Credit</th>
                              <th className="px-6 py-4 text-right text-zinc-900">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {paginate(ledgerEntries).map((entry, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-zinc-600">{entry.date}</td>
                                <td className="px-6 py-4 font-bold text-zinc-800">{entry.voucherType}</td>
                                <td className="px-6 py-4 font-mono font-medium text-zinc-500">{entry.voucherNumber}</td>
                                <td className="px-6 py-4 font-bold text-zinc-900 text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                                <td className="px-6 py-4 font-bold text-zinc-900 text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                                <td className="px-6 py-4 font-black text-zinc-900 text-right bg-zinc-50/50">{formatCurrency(entry.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Pagination 
                        page={page}
                        totalPages={Math.ceil(ledgerEntries.length / pageSize)}
                        totalElements={ledgerEntries.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                        itemName="ledger entries"
                      />
                    </div>
                  ) : (
                    <EmptyState icon={BookOpen} title="Ledger is empty" description="No ledger entries have been posted." />
                  )}
                </div>
              )}
              
              {/* CONTACTS TAB */}
              {activeTab === 'contacts' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Contacts</h3>
                  </div>
                  {contacts.length > 0 ? (
                    <div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {paginate(contacts).map((contact, idx) => (
                          <div key={idx} className="border border-zinc-200 rounded-md p-5 bg-zinc-50/50">
                            <h4 className="font-bold text-zinc-900 mb-4">{contact.contactPerson || contact.name}</h4>
                            <div className="space-y-2">
                               <p className="text-sm font-medium text-zinc-700 flex items-center gap-2"><Mail size={14} className="text-zinc-400" /> {contact.email || 'N/A'}</p>
                               <p className="text-sm font-medium text-zinc-700 flex items-center gap-2"><Phone size={14} className="text-zinc-400" /> {contact.phone || contact.mobile || 'N/A'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Pagination 
                        page={page}
                        totalPages={Math.ceil(contacts.length / pageSize)}
                        totalElements={contacts.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                        itemName="contacts"
                      />
                    </div>
                  ) : (
                    <EmptyState icon={User} title="No contacts" description="There are no contacts recorded for this vendor." />
                  )}
                </div>
              )}
              
              {/* ADDRESSES TAB */}
              {activeTab === 'addresses' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Addresses</h3>
                  </div>
                  {addresses.length > 0 ? (
                    <div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {paginate(addresses).map((address, idx) => (
                          <div key={idx} className="border border-zinc-200 rounded-md p-5 bg-zinc-50/50">
                            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2"><MapPin size={14} /> {address.type || address.addressType || 'ADDRESS'}</p>
                            <div className="space-y-1">
                               <p className="text-sm font-medium text-zinc-900">{address.addressLine1}</p>
                               {address.addressLine2 && <p className="text-sm font-medium text-zinc-900">{address.addressLine2}</p>}
                               <p className="text-sm font-medium text-zinc-900">{address.city}, {address.state}</p>
                               <p className="text-sm font-medium text-zinc-900">{address.country} {address.pinCode ? `- ${address.pinCode}` : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Pagination 
                        page={page}
                        totalPages={Math.ceil(addresses.length / pageSize)}
                        totalElements={addresses.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
                        itemName="addresses"
                      />
                    </div>
                  ) : (
                    <EmptyState icon={MapPin} title="No addresses" description="There are no additional addresses recorded." />
                  )}
                </div>
              )}

              {/* AUDIT TAB */}
              {activeTab === 'audit' && (
                <div className="animate-fade-in bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <h3 className="text-sm font-bold text-zinc-800">Audit Log</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="border border-zinc-200 rounded-md p-5 bg-zinc-50/50">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2"><Plus size={14} /> Created Record</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 font-semibold mb-1">Created By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 bg-white inline-block px-2 py-1 rounded-md border border-zinc-200">{vendor.auditInformation?.createdBy || vendor.createdBy || 'System'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 font-semibold mb-1">Created At</p>
                               <p className="text-sm font-bold text-zinc-900">{vendor.auditInformation?.createdAt || vendor.createdAt || 'N/A'}</p>
                             </div>
                          </div>
                       </div>
                       <div className="border border-zinc-200 rounded-md p-5 bg-zinc-50/50">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2"><Edit2 size={14} /> Last Updated</p>
                          <div className="space-y-4">
                             <div>
                               <p className="text-xs text-zinc-500 font-semibold mb-1">Updated By</p>
                               <p className="text-sm font-mono font-bold text-zinc-900 bg-white inline-block px-2 py-1 rounded-md border border-zinc-200">{vendor.auditInformation?.updatedBy || vendor.updatedBy || 'System'}</p>
                             </div>
                             <div>
                               <p className="text-xs text-zinc-500 font-semibold mb-1">Updated At</p>
                               <p className="text-sm font-bold text-zinc-900">{vendor.auditInformation?.updatedAt || vendor.updatedAt || 'N/A'}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isEditModalOpen && (
        <VendorFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={vendor}
          onSubmit={async (payload) => {
            try {
              await vendorsApi.updateVendor(id, payload);
              dispatch(addAlert({ type: 'success', message: 'Vendor updated successfully' }));
              setIsEditModalOpen(false);
              fetchVendor();
            } catch (err) {
              dispatch(addAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update vendor' }));
            }
          }}
        />
      )}
    </div>
  );
}
