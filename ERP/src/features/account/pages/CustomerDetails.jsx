import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, MapPin, Activity, AlertCircle,
  FileText, Receipt, ShoppingCart, ArrowRightLeft, FileSearch, FileCheck2,
  Download, Shield, Clock, IndianRupee, CheckCircle,
  Calendar, Hash, Building, Edit2, Trash2, Printer, BookOpen,
  Plus, ExternalLink, LayoutDashboard,
} from 'lucide-react';
import { customersApi } from '../../../api/account';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';
import KPICard from '../../../components/common/KPICard';
import RequirePermission from '../../../components/common/RequirePermission';
import EntityHeader from '../../../components/common/EntityHeader';
import InfoCard, { InfoField } from '../../../components/common/InfoCard';
import QuickActionsCard from '../../../components/common/QuickActionsCard';
import CustomerFormModal from '../components/CustomerFormModal';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { PageLoader } from '../../../components/common/SkeletonLoader';

/* ─────────────────────────────────────────────────────────────────
   Detail tabs definition (local — not routing-based)
───────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'overview',      label: 'Overview',     icon: LayoutDashboard },
  { id: 'ledger',        label: 'Ledger',        icon: BookOpen },
  { id: 'invoices',      label: 'Invoices',      icon: FileText },
  { id: 'receipts',      label: 'Receipts',      icon: Receipt },
  { id: 'orders',        label: 'Orders',        icon: ShoppingCart },
  { id: 'credit-notes',  label: 'Credit Notes',  icon: FileSearch },
  { id: 'debit-notes',   label: 'Debit Notes',   icon: FileCheck2 },
  { id: 'transactions',  label: 'Transactions',  icon: ArrowRightLeft },
  { id: 'documents',     label: 'Documents',     icon: Download },
  { id: 'audit',         label: 'Audit Log',     icon: Shield },
];

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */
function formatCurrency(amount) {
  return `₹${(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ─────────────────────────────────────────────────────────────────
   Credit utilization progress bar (local — ledger-specific UI)
───────────────────────────────────────────────────────────────── */
function CreditUtilizationSection({ outstanding, ledgerInfo }) {
  const used = outstanding.totalOutstanding || 0;
  const limit = ledgerInfo.creditLimit || 0;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
      <h3 className="text-sm font-bold text-zinc-800 mb-5 flex items-center gap-2">
        <Activity size={15} className="text-zinc-500" />
        Credit Utilization
      </h3>

      {/* Progress bar */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold py-1 px-2 uppercase rounded-lg text-rose-600 bg-rose-100">
            Outstanding: {formatCurrency(used)}
          </span>
          <span className="text-xs font-semibold py-1 px-2 uppercase rounded-lg text-zinc-600 bg-zinc-100">
            Limit: {formatCurrency(limit)}
          </span>
        </div>
        <div className="overflow-hidden h-3 rounded-full bg-emerald-100">
          <div
            style={{ width: `${pct}%` }}
            className="h-full bg-rose-500 rounded-full transition-all duration-1000"
          />
        </div>
        <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider mt-2">
          <span>0%</span>
          <span>
            Available:{' '}
            <span className="text-emerald-600">
              {formatCurrency(ledgerInfo.availableCredit)}
            </span>
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Balance metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-zinc-100">
        {[
          { label: 'Opening Balance',  value: formatCurrency(ledgerInfo.openingBalance),      color: 'text-zinc-900' },
          { label: 'Current Balance',  value: formatCurrency(ledgerInfo.currentBalance),      color: 'text-zinc-900' },
          { label: 'Overdue Amount',   value: formatCurrency(outstanding.overdueAmount),      color: 'text-rose-600' },
          { label: 'Not Yet Due',      value: formatCurrency(outstanding.notYetDueAmount),    color: 'text-zinc-900' },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">
              {m.label}
            </p>
            <p className={`text-lg font-black mt-1 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Inline detail tabs navigation (grid-style, in-page — not routing)
───────────────────────────────────────────────────────────────── */
function DetailTabs({ activeTab, onChange }) {
  return (
    <div className="bg-zinc-50/80 rounded-lg shadow-sm border border-zinc-200/80 p-1.5 sticky top-[192px] z-30">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center justify-center gap-2 px-2 py-2 text-xs xl:text-sm font-semibold rounded-lg transition-all outline-none ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/80 border border-transparent'
              }`}
            >
              <Icon
                size={14}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? 'text-zinc-900' : 'text-zinc-400'}
              />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Simple tab content card wrapper (replaces repeated inline pattern)
───────────────────────────────────────────────────────────────── */
function TabCard({ title, count, children }) {
  return (
    <div className="animate-fade-in bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
        <h3 className="text-sm font-bold text-zinc-800">{title}</h3>
        {count != null && (
          <span className="text-xs font-bold bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg">
            {count} Total
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════ */
export default function CustomerDetails() {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const { buildPath }   = useRoutePath();
  const dispatch        = useAppDispatch();

  const [customer,         setCustomer]         = useState(null);
  const [loading,          setLoading]           = useState(true);
  const [error,            setError]             = useState(null);
  const [activeTab,        setActiveTab]         = useState('overview');
  const [page,             setPage]              = useState(0);
  const [pageSize,         setPageSize]          = useState(10);
  const [isEditModalOpen,  setIsEditModalOpen]   = useState(false);

  /* Reset page when tab changes */
  useEffect(() => { setPage(0); }, [activeTab]);

  /* Client-side paginator */
  const paginate = (arr) => (arr || []).slice(page * pageSize, (page + 1) * pageSize);

  /* ── Data fetching ── */
  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersApi.getById(id);
      setCustomer(response?.data || response?.content || response);
    } catch (err) {
      console.error('Failed to fetch customer details:', err);
      setError(
        err.response?.status === 404
          ? 'Customer Not Found'
          : 'Failed to load customer details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchCustomer(); }, [id]);

  /* ── Delete handler ── */
  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title:   'Delete Customer',
      message: 'Are you sure you want to delete this customer? This action cannot be undone.',
    });
    if (!confirmed) return;
    try {
      await customersApi.delete(id);
      dispatch(addAlert({ type: 'success', message: 'Customer deleted successfully' }));
      navigate(buildPath('/accounts/masters/customers'));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete customer' }));
    }
  };

  /* ── Loading state ── */
  if (loading) return <PageLoader />;

  /* ── Error / not-found state ── */
  if (error || !customer) {
    return (
      <div className="p-8 mt-6 max-w-lg mx-auto bg-white rounded-xl border border-rose-200 shadow-sm text-center animate-fade-in">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">{error || 'Customer Not Found'}</h2>
        <p className="text-sm text-zinc-500 mb-6">We couldn't find the requested customer record.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  /* ── Derived data ── */
  const ledgerInfo   = customer.ledgerInformation || {};
  const stats        = customer.statistics        || {};
  const outstanding  = customer.outstandingDetails || {};
  const invoices     = customer.salesInvoices      || [];
  const receipts     = customer.receipts           || [];
  const orders       = customer.salesOrders        || [];
  const creditNotes  = customer.creditNotes        || [];
  const debitNotes   = customer.debitNotes         || [];
  const transactions = customer.recentTransactions || [];
  const ledgerEntries = customer.ledgerEntries     || [];

  /* ── KPI card strip (rendered inside EntityHeader's bottomSlot) ── */
  const kpiStrip = (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 xl:gap-4 pb-6">
      <KPICard
        title="Outstanding"
        value={formatCurrency(outstanding.totalOutstanding)}
        valueClass={outstanding.totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}
        icon={AlertCircle}
      />
      <KPICard
        title="Credit Limit"
        value={formatCurrency(ledgerInfo.creditLimit)}
        icon={Shield}
      />
      <KPICard
        title="Available Credit"
        value={formatCurrency(ledgerInfo.availableCredit)}
        valueClass="text-emerald-600"
        icon={CheckCircle}
      />
      <KPICard
        title="Total Sales"
        value={formatCurrency(stats.totalSales)}
        icon={IndianRupee}
      />
      <KPICard
        title="Invoices"
        value={stats.totalInvoices || '0'}
        subtitle={`Last: ${stats.lastInvoiceDate || 'N/A'}`}
        icon={FileText}
      />
      <KPICard
        title="Receipts"
        value={stats.totalReceipts || '0'}
        subtitle={`Avg Days: ${stats.averagePaymentDays || '0'}`}
        icon={Receipt}
      />
      <KPICard
        title="Pending"
        value={formatCurrency(stats.totalPending)}
        valueClass="text-amber-600"
        icon={Clock}
      />
    </div>
  );

  /* ── Header actions config ── */
  const headerActions = [
    {
      label:     'Edit',
      icon:      Edit2,
      variant:   'secondary',
      permission: { module: 'CUSTOMERS', action: 'UPDATE', behavior: 'disable' },
      onClick:   () => setIsEditModalOpen(true),
    },
    {
      label:     'Delete',
      icon:      Trash2,
      variant:   'danger',
      permission: { module: 'CUSTOMERS', action: 'DELETE', behavior: 'hide' },
      onClick:   handleDelete,
    },
    {
      label:  'More Actions',
      type:   'dropdown',
      variant: 'primary',
      items: [
        {
          label: 'Create Invoice',
          icon:  FileText,
          permission: { module: 'SALES_INVOICES', action: 'CREATE' },
          onClick: () => navigate(buildPath('/sales/invoices'), { state: { customerId: customer.id, openCreate: true } }),
        },
        {
          label: 'Record Receipt',
          icon:  Receipt,
          permission: { module: 'RECEIPTS', action: 'CREATE' },
          onClick: () => navigate(buildPath('/accounts/finance/receipts/new'), { state: { customerId: customer.id } }),
        },
        { type: 'divider' },
        {
          label:   'Print Statement',
          icon:    Printer,
          onClick: () => window.print(),
        },
        {
          label:   'Export PDF',
          icon:    Download,
          onClick: () => window.print(),
        },
      ],
    },
  ];

  /* ── Header metadata chips ── */
  const headerMetadata = [
    { icon: Hash,     label: customer.customerCode || 'N/A' },
    { icon: Building, label: customer.companyName  || 'N/A' },
    {
      icon:  Clock,
      label: `Updated ${customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : 'N/A'}`,
    },
  ];

  /* ── Quick Actions config ── */
  const quickActions = [
    {
      label:       'Create Invoice',
      icon:        FileText,
      iconBg:      'bg-blue-50',
      iconColor:   'text-blue-600',
      trailingIcon: Plus,
      onClick: () => navigate(buildPath('/sales/invoices'), { state: { customerId: customer.id, openCreate: true } }),
    },
    {
      label:       'Record Receipt',
      icon:        Receipt,
      iconBg:      'bg-emerald-50',
      iconColor:   'text-emerald-600',
      trailingIcon: Plus,
      onClick: () => navigate(buildPath('/accounts/finance/receipts/new'), { state: { customerId: customer.id } }),
    },
    {
      label:       'View Ledger',
      icon:        BookOpen,
      iconBg:      'bg-purple-50',
      iconColor:   'text-purple-600',
      trailingIcon: ExternalLink,
      onClick: () => setActiveTab('ledger'),
    },
  ];

  /* ════════════════════════════════════
     Render
  ════════════════════════════════════ */
  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">

      {/* ── EntityHeader (sticky) ── */}
      <EntityHeader
        onBack={() => navigate(-1)}
        title={customer.customerName}
        badge={{ isActive: customer.isActive }}
        metadata={headerMetadata}
        actions={headerActions}
        bottomSlot={kpiStrip}
        sticky
      />

      {/* ── Page body ── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left sidebar (30%) ── */}
          <div className="w-full lg:w-[30%] space-y-5">

            {/* Customer Details */}
            <InfoCard
              title="Customer Details"
              icon={User}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            >
              <div className="space-y-4">
                <InfoField label="Email Address" value={customer.email} />
                <InfoField label="Phone Number"  value={customer.phone} />
                <InfoField label="GSTIN"         value={customer.gstin}  mono highlight />
                <InfoField label="PAN Number"    value={customer.panNo}  mono />
                <div>
                  <p className="text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Account Status
                  </p>
                  <RequirePermission module="CUSTOMERS" action="UPDATE" behavior="disable">
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={customer.isActive}
                        onChange={async (e) => {
                          const newStatus = e.target.checked;
                          try {
                            if (newStatus) {
                              await customersApi.activate(customer.id);
                            } else {
                              await customersApi.deactivate(customer.id);
                            }
                            setCustomer((prev) => ({ ...prev, isActive: newStatus }));
                            dispatch(addAlert({
                              type: 'success',
                              message: `Customer ${newStatus ? 'activated' : 'deactivated'} successfully`,
                            }));
                          } catch (err) {
                            dispatch(addAlert({
                              type: 'error',
                              message: err?.response?.data?.message || 'Failed to update status',
                            }));
                          }
                        }}
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.6px] after:left-[1.6px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                      <span className="ml-2 text-sm font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </RequirePermission>
                </div>
              </div>
            </InfoCard>

            {/* Billing Address */}
            <InfoCard
              title="Billing Address"
              icon={MapPin}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-900">
                  {customer.addressLine1 || 'No address line 1'}
                </p>
                <p className="text-sm font-medium text-zinc-900">
                  {[customer.city, customer.state].filter(Boolean).join(', ') || 'N/A'}
                </p>
                <p className="text-sm font-medium text-zinc-900">
                  {customer.country || 'N/A'}
                </p>
              </div>
            </InfoCard>

            {/* Quick Actions — reusable generic component */}
            <QuickActionsCard title="Quick Actions" actions={quickActions} />
          </div>

          {/* ── Right content (70%) ── */}
          <div className="w-full lg:w-[70%] space-y-5">

            {/* Detail tabs */}
            <DetailTabs activeTab={activeTab} onChange={setActiveTab} />

            {/* Tab content panels */}
            <div className="min-h-[400px]">

              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-5">
                  <CreditUtilizationSection
                    outstanding={outstanding}
                    ledgerInfo={ledgerInfo}
                  />

                  {/* Ageing Summary */}
                  <InfoCard
                    title="Ageing Summary"
                    icon={Calendar}
                    iconBg="bg-zinc-100"
                    iconColor="text-zinc-500"
                    noPadding
                  >
                    {Object.keys(outstanding.ageingSummary || {}).length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5">
                        {/* Render ageing buckets when available */}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Calendar}
                        title="No ageing records"
                        description="There are currently no outstanding invoices with ageing data."
                      />
                    )}
                  </InfoCard>
                </div>
              )}

              {/* INVOICES */}
              {activeTab === 'invoices' && (
                <TabCard title="Sales Invoices" count={invoices.length}>
                  {invoices.length > 0 ? (
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
                            {paginate(invoices).map((inv, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-zinc-900">{inv.invoiceNumber}</td>
                                <td className="px-6 py-4 font-medium text-zinc-600">{inv.invoiceDate}</td>
                                <td className="px-6 py-4 font-medium text-zinc-600">{inv.dueDate}</td>
                                <td className="px-6 py-4 font-bold text-zinc-900 text-right">{formatCurrency(inv.invoiceAmount)}</td>
                                <td className="px-6 py-4 font-bold text-rose-600 text-right">{formatCurrency(inv.pendingAmount)}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider border ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Pagination
                        page={page}
                        totalPages={Math.ceil(invoices.length / pageSize)}
                        totalElements={invoices.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
                        itemName="invoices"
                      />
                    </div>
                  ) : (
                    <EmptyState icon={FileText} title="No invoices found" description="This customer does not have any sales invoices yet." />
                  )}
                </TabCard>
              )}

              {/* RECEIPTS */}
              {activeTab === 'receipts' && (
                <TabCard title="Receipts">
                  {receipts.length > 0 ? (
                    <div className="p-6">Table goes here</div>
                  ) : (
                    <EmptyState icon={Receipt} title="No receipts found" description="There are no payment receipts recorded for this customer." />
                  )}
                </TabCard>
              )}

              {/* ORDERS */}
              {activeTab === 'orders' && (
                <TabCard title="Sales Orders">
                  {orders.length > 0 ? (
                    <div className="p-6">Table goes here</div>
                  ) : (
                    <EmptyState icon={ShoppingCart} title="No sales orders" description="There are no sales orders recorded for this customer." />
                  )}
                </TabCard>
              )}

              {/* CREDIT NOTES */}
              {activeTab === 'credit-notes' && (
                <TabCard title="Credit Notes">
                  {creditNotes.length > 0 ? (
                    <div className="p-6">Table goes here</div>
                  ) : (
                    <EmptyState icon={FileSearch} title="No credit notes" description="There are no credit notes recorded for this customer." />
                  )}
                </TabCard>
              )}

              {/* DEBIT NOTES */}
              {activeTab === 'debit-notes' && (
                <TabCard title="Debit Notes">
                  {debitNotes.length > 0 ? (
                    <div className="p-6">Table goes here</div>
                  ) : (
                    <EmptyState icon={FileCheck2} title="No debit notes" description="There are no debit notes recorded for this customer." />
                  )}
                </TabCard>
              )}

              {/* TRANSACTIONS */}
              {activeTab === 'transactions' && (
                <TabCard title="Recent Transactions">
                  {transactions.length > 0 ? (
                    <div>
                      <ul className="divide-y divide-zinc-100">
                        {paginate(transactions).map((tx, idx) => (
                          <li key={idx} className="p-6 hover:bg-zinc-50 transition-colors flex items-start gap-4">
                            <div className={`p-3 rounded-lg border shadow-sm ${tx.transactionType === 'INVOICE' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                              {tx.transactionType === 'INVOICE' ? <FileText size={20} /> : <Receipt size={20} />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-bold text-zinc-900">
                                    {tx.transactionType}{' '}
                                    <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded-lg text-xs ml-2 border border-zinc-200">
                                      {tx.referenceNumber}
                                    </span>
                                  </p>
                                  <p className="text-xs font-semibold text-zinc-500 mt-1">{tx.date}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-base font-black text-zinc-900">{formatCurrency(tx.amount)}</p>
                                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider ${tx.status === 'DRAFT' ? 'bg-zinc-100 text-zinc-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {tx.status}
                                  </span>
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
                        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
                        itemName="transactions"
                      />
                    </div>
                  ) : (
                    <EmptyState icon={ArrowRightLeft} title="No recent transactions" description="No transactions have been logged recently." />
                  )}
                </TabCard>
              )}

              {/* LEDGER */}
              {activeTab === 'ledger' && (
                <TabCard title="Account Ledger">
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
                                <td className="px-6 py-4 font-bold text-zinc-900 text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '–'}</td>
                                <td className="px-6 py-4 font-bold text-zinc-900 text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '–'}</td>
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
                        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
                        itemName="ledger entries"
                      />
                    </div>
                  ) : (
                    <EmptyState icon={BookOpen} title="Ledger is empty" description="No ledger entries have been posted." />
                  )}
                </TabCard>
              )}

              {/* DOCUMENTS */}
              {activeTab === 'documents' && (
                <TabCard title="Documents">
                  <EmptyState icon={Download} title="No documents" description="There are no documents uploaded for this customer." />
                </TabCard>
              )}

              {/* AUDIT LOG */}
              {activeTab === 'audit' && (
                <TabCard title="Audit Log">
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                          <Plus size={14} /> Created Record
                        </p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-zinc-500 font-semibold mb-1">Created By</p>
                            <p className="text-sm font-mono font-bold text-zinc-900 bg-white inline-block px-2 py-1 rounded-lg border border-zinc-200">
                              {customer.auditInformation?.createdBy || customer.createdBy || 'System'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 font-semibold mb-1">Created At</p>
                            <p className="text-sm font-bold text-zinc-900">
                              {customer.auditInformation?.createdAt || customer.createdAt || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                          <Edit2 size={14} /> Last Updated
                        </p>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-zinc-500 font-semibold mb-1">Updated By</p>
                            <p className="text-sm font-mono font-bold text-zinc-900 bg-white inline-block px-2 py-1 rounded-lg border border-zinc-200">
                              {customer.auditInformation?.updatedBy || customer.updatedBy || 'System'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 font-semibold mb-1">Updated At</p>
                            <p className="text-sm font-bold text-zinc-900">
                              {customer.auditInformation?.updatedAt || customer.updatedAt || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabCard>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {isEditModalOpen && (
        <CustomerFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={customer}
          onSubmit={async (payload) => {
            try {
              await customersApi.update(payload);
              dispatch(addAlert({ type: 'success', message: 'Customer updated successfully' }));
              setIsEditModalOpen(false);
              fetchCustomer();
            } catch (err) {
              dispatch(addAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update customer' }));
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}
