import { TableRowSkeleton } from '../../../components/common/SkeletonLoader';
import Pagination from '../../../components/common/Pagination';
import React, { useState } from 'react';
import { formatDate } from '../../../utils/dateFormatter';
import { CreditCard, Plus, Clock, Edit, Trash2, CheckCircle, XCircle, ArrowRightCircle, CheckSquare, RefreshCw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { 
  vendorApiSlice,
  useCreateAPInvoiceMutation,
  useGetAPInvoicesQuery
} from '../../../api/purchase';
import APInvoiceFormModal from '../../purchase/components/APInvoiceFormModal';
import usePermission from '../../../hooks/usePermission';
import RequirePermission from '../../../components/common/RequirePermission';
import { confirmDialog } from '../../../utils/confirmDialog';
import { FILTER_CONFIGS } from '../../../constants/filterConfigs';
import useApiFilters from '../../../hooks/useApiFilters';
import ApiFilterBar from '../../../components/common/ApiFilterBar';
import TableRowActions from '../../../components/common/TableRowActions';
import UpdateModal from '../../../components/common/UpdateModal';

import SortableHeader from '../../../components/common/SortableHeader';
export default function AccountsPayable() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;;
  const dispatch = useAppDispatch();
  const canUpdate = usePermission('PURCHASE_INVOICES', 'UPDATE');
  const canDelete = usePermission('PURCHASE_INVOICES', 'DELETE');
  const canApprove = usePermission('PURCHASE_INVOICES', 'APPROVE');
  
    const { filterBarProps, apiParams, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.apInvoices);
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };


  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: apiData = [], isLoading, refetch } = useGetAPInvoicesQuery({ companyId, ...apiParams });
  const bills = Array.isArray(apiData) ? apiData : apiData?.data?.content || apiData?.content || [];
  const pageInfo = apiData?._pageInfo || apiData?.pagination;

  const [createInvoice] = useCreateAPInvoiceMutation();
  const [updateInvoice, { isLoading: isUpdating }] = vendorApiSlice.useUpdateAPInvoiceMutation();

  const handleCreateBill = async (data) => {
    try {
      await createInvoice({ companyId, ...data }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Bill generated successfully' }));
      setIsFormOpen(false);
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to generate bill' }));
    }
  };

  const handleUpdateBill = async (data) => {
    try {
      await updateInvoice({ id: selectedInvoice.id, companyId, ...data }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Bill updated successfully' }));
      setIsUpdateModalOpen(false);
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to update bill' }));
    }
  };

  const handleDelete = async (record) => {
    const id = typeof record === "object" ? record.id : record;
    if (!(await confirmDialog({ message: 'Are you sure you want to delete this bill?', info: typeof record === "object" ? record : null }))) return;
    try {
      await dispatch(vendorApiSlice.endpoints.deleteAPInvoice.initiate({ id, companyId })).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Bill deleted successfully' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to delete bill' }));
    }
  };

  const handleAction = async (actionEndpoint, id, successMsg) => {
    try {
      await dispatch(actionEndpoint({ id, companyId })).unwrap();
      dispatch(addAlert({ type: 'success', message: successMsg }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Action failed' }));
    }
  };

  const handlePartialPayment = async (id) => {
    const amt = window.prompt("Enter amount to pay:");
    if (!amt) return;
    const numAmt = parseFloat(amt);
    if (isNaN(numAmt) || numAmt <= 0) return alert("Invalid amount");

    try {
      await dispatch(vendorApiSlice.endpoints.recordPartialPaymentAP.initiate({ id, companyId, paymentAmount: numAmt })).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Payment recorded successfully' }));
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to record payment' }));
    }
  };
  
  // Calculate totals from real data (this would ideally be backend summaries in a real app, but ok for now)
  const totalOutstanding = bills.filter(b => b.status !== 'PAID' && b.status !== 'CANCELLED').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalOverdue = bills.filter(b => b.status === 'OVERDUE').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CreditCard size={22} className="text-blue-600" />
            Accounts Payable
          </h1>
          <p className="page-subtitle">Track and manage outgoing payments to vendors and suppliers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
          <RequirePermission module="PURCHASE_INVOICES" action="CREATE" behavior="disable">
            <button onClick={() => { setSelectedInvoice(null); setIsFormOpen(true); }} className="btn-primary flex items-center gap-2">
              <Plus size={15} /> New Bill
            </button>
          </RequirePermission>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <span className="text-[9.6px] font-bold uppercase tracking-wider">Total Outstanding</span>
          </div>
          <p className="font-mono text-2xl font-semibold text-rose-600">₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <span className="text-[9.6px] font-bold uppercase tracking-wider">Overdue Payments</span>
          </div>
          <p className="font-mono text-2xl font-semibold text-rose-800">₹{totalOverdue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <span className="text-[9.6px] font-bold uppercase tracking-wider">Total Paid</span>
          </div>
          <p className="font-mono text-2xl font-semibold text-emerald-600">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <ApiFilterBar {...filterBarProps} />
      <div className="card overflow-hidden mt-4">

        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="w-12 text-center">S.No.</th>
                <th className="w-[12%]">Bill ID</th>
                <th className="w-[20%]">Vendor</th>
                <th className="w-[15%]">PO Number</th>
                <SortableHeader field="totalAmount" label="Amount" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} className="w-[15%] text-right" />
                <SortableHeader label="Due Date" field="dueDate" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} width="12%" />
                <th className="w-[10%] text-center">Status</th>
                <th className="w-[16%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="staggered-list">
              {isLoading ? (
                <TableRowSkeleton columns={8} />
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="p-12 text-center border-2 border-dashed border-zinc-200 m-4 rounded-xl">
                      <CreditCard className="mx-auto text-zinc-300 mb-3" size={28} />
                      <p className="text-sm font-medium text-zinc-600">No AP Invoices found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bills.map((bill, index) => (
                  <tr key={bill.id}>
                    <td className="text-center font-medium text-zinc-500">{(page * (pageSize || 10)) + index + 1}</td>
                    <td>
                      <span className="text-sm font-mono text-zinc-700 font-medium">{bill.invoiceNo}</span>
                    </td>
                    <td>
                      <div className="font-semibold text-sm text-zinc-800">{bill.vendorName || 'Unknown Vendor'}</div>
                    </td>
                    <td>
                      <span className="text-sm text-zinc-500 font-mono">-</span>
                    </td>
                    <td className="text-right">
                      <span className="font-mono text-sm text-zinc-900 font-semibold">
                        ₹{(bill.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className={bill.status === 'OVERDUE' ? 'text-rose-500' : 'text-zinc-400'} />
                        <span className={`text-sm font-mono ${bill.status === 'OVERDUE' ? 'text-rose-600 font-medium' : 'text-zinc-600'}`}>
                          {formatDate(bill.dueDate)}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border ${
                        bill.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        bill.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        bill.status === 'DRAFT' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>
                      <TableRowActions
                        onView={() => window.open(`${location.pathname}/${bill.id}`, '_self')}
                        onEdit={(bill.status === 'DRAFT' || bill.status === 'PENDING_APPROVAL') && canUpdate ? () => { 
                          setSelectedInvoice({
                            ...bill,
                            invoiceNumber: bill.invoiceNo,
                            customerName: bill.vendorName,
                            customerId: bill.vendorId || 'VENDOR'
                          }); 
                          setIsUpdateModalOpen(true); 
                        } : undefined}
                        onDelete={bill.status === 'DRAFT' && canDelete ? () => handleDelete(bill.id) : undefined}
                        extraActions={[
                          ...(bill.status === 'PENDING_APPROVAL' && canApprove ? [
                            {
                              icon: <CheckCircle size={16} />,
                              tooltip: "Approve",
                              onClick: () => handleAction(vendorApiSlice.endpoints.approveAPInvoice.initiate, bill.id, 'Invoice approved'),
                              className: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            },
                            {
                              icon: <XCircle size={16} />,
                              tooltip: "Reject",
                              onClick: () => handleAction(vendorApiSlice.endpoints.rejectAPInvoice.initiate, bill.id, 'Invoice rejected'),
                              className: "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            }
                          ] : []),
                          ...(bill.status === 'APPROVED' && canUpdate ? [
                            {
                              icon: <ArrowRightCircle size={16} />,
                              tooltip: "Post to GL",
                              onClick: () => handleAction(vendorApiSlice.endpoints.postAPInvoice.initiate, bill.id, 'Invoice posted to GL'),
                              className: "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                            }
                          ] : []),
                          ...((bill.status === 'POSTED' || bill.status === 'PARTIAL_PAID' || bill.status === 'OUTSTANDING') && canUpdate && bill.outstandingAmount > 0 ? [
                            {
                              icon: <span className="text-[8.8px] font-bold px-1">PAY</span>,
                              tooltip: "Record Partial Payment",
                              onClick: () => handlePartialPayment(bill.id),
                              className: "text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-200"
                            },
                            {
                              icon: <CheckSquare size={16} />,
                              tooltip: "Mark Fully Paid",
                              onClick: () => handleAction(vendorApiSlice.endpoints.markAPInvoicePaid.initiate, bill.id, 'Bill marked as fully paid'),
                              className: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            }
                          ] : []),
                          ...(bill.status !== 'PAID' && bill.status !== 'CANCELLED' && bill.status !== 'REJECTED' && canUpdate ? [
                            {
                              icon: <XCircle size={16} />,
                              tooltip: "Cancel Invoice",
                              onClick: async () => {
                                if (await confirmDialog({
                                  title: 'Cancel Invoice',
                                  message: 'Are you sure you want to cancel this invoice? This action cannot be undone.',
                                  info: bill,
                                  isDestructive: true
                                })) {
                                  handleAction(vendorApiSlice.endpoints.cancelAPInvoice.initiate, bill.id, 'Invoice cancelled');
                                }
                              },
                              className: "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            }
                          ] : [])
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && pageInfo && (
            <div className="p-4 border-t border-zinc-100">
              <Pagination
                page={paginationProps.page}
                totalPages={pageInfo.totalPages}
                totalElements={pageInfo.totalElements}
                pageSize={paginationProps.pageSize}
                onPageChange={paginationProps.onPageChange}
                onPageSizeChange={paginationProps.onPageSizeChange}
                itemName="bills"
              />
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <APInvoiceFormModal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setSelectedInvoice(null); }}
          onSubmit={handleCreateBill}
          companyId={companyId}
        />
      )}

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Edit AP Invoice"
        fields={FILTER_CONFIGS.apInvoices.updateConfig.fields}
        initialData={selectedInvoice}
        onSubmit={handleUpdateBill}
        isSubmitting={isUpdating}
      />
    </div>
  );
}

