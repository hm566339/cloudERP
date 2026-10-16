import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CreditCard, Building2, Calendar, Edit, XCircle, 
  CheckCircle, FileText, Activity, Power, Trash2, Send
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { apPaymentsApi } from '../../../api/account/apPayments';
import { TableSkeleton } from '../../../components/common/SkeletonLoader';
import { formatCurrency } from '../../../utils/formatters';
import { format } from 'date-fns';
import Modal from '../../../components/common/Modal';
import { confirmDialog } from '../../../utils/confirmDialog';
import ApPaymentForm from '../components/ApPaymentForm';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function ApPaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // API calls
  const { data: apiData, loading, error, execute: refetch } = useApiQuery(
    apPaymentsApi.getById,
    id,
    { skip: !id }
  );

  const { execute: updatePayment, loading: isUpdating } = useApiMutation(apPaymentsApi.update);
  const { execute: deletePayment } = useApiMutation(apPaymentsApi.delete);
  const { execute: postPayment } = useApiMutation(apPaymentsApi.postToGL);
  const { execute: reversePayment } = useApiMutation(apPaymentsApi.reverse);

  const payment = apiData?.data || apiData;
  const allocations = payment?.allocations || [];

  if (loading) {
    return <div className="p-8"><TableSkeleton columns={2} rows={5} /></div>;
  }

  if (error || !payment) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-zinc-200 mt-4 mx-4">
        <h2 className="text-xl font-bold text-zinc-900">AP Payment not found</h2>
        <p className="text-zinc-500 mt-2">{error?.message}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium">
          Go Back
        </button>
      </div>
    );
  }

  const handleEditSubmit = async (formData) => {
    try {
      await updatePayment({ id, data: formData });
      setIsEditModalOpen(false);
      refetch();
    } catch (err) {
      console.error("Failed to update AP payment", err);
      throw err;
    }
  };

  const handleDelete = async () => {
    if (await confirmDialog({ message: "Are you sure you want to delete this payment? This cannot be undone." })) {
      try {
        await deletePayment(id);
        navigate(buildPath('/accounts/transactions/ap-payments'));
      } catch (err) {
        console.error("Failed to delete payment:", err);
      }
    }
  };

  const handlePost = async () => {
    if (await confirmDialog({ title: 'Post to GL', message: "Are you sure you want to post this payment to the General Ledger?" })) {
      try {
        await postPayment(id);
        refetch();
      } catch (err) {
        console.error("Failed to post payment:", err);
      }
    }
  };

  const handleReverse = async () => {
    if (await confirmDialog({ title: 'Reverse Payment', message: "Are you sure you want to reverse this payment's GL postings?" })) {
      try {
        await reversePayment(id);
        refetch();
      } catch (err) {
        console.error("Failed to reverse payment:", err);
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'allocations', label: `Allocations (${allocations.length})`, icon: CreditCard }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="h-2 bg-zinc-900" />
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-4 items-center">
            <button onClick={() => navigate(-1)} className="p-2 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0">
              <CreditCard />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900">{payment.paymentNo}</h1>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  payment.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                  payment.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800' :
                  payment.paymentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {payment.paymentStatus}
                </span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  payment.glPostingStatus === 'POSTED' ? 'bg-blue-100 text-blue-800' :
                  payment.glPostingStatus === 'REVERSED' ? 'bg-orange-100 text-orange-800' :
                  payment.glPostingStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                  'bg-zinc-100 text-zinc-800'
                }`}>
                  GL: {payment.glPostingStatus}
                </span>
              </div>
              <p className="text-zinc-500 mt-1 flex items-center gap-2">
                <span>{payment.vendorName}</span>
                <span>•</span>
                <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded text-sm">{payment.vendorCode}</span>
                <span>•</span>
                <span>{payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMM yyyy') : '-'}</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {payment.glPostingStatus === 'DRAFT' && (
              <>
                <button 
                  onClick={handlePost}
                  className="flex items-center px-3 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
                >
                  <Send size={16} className="mr-2" />
                  Post to GL
                </button>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center px-3 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium"
                >
                  <Edit size={16} className="mr-2 text-blue-600" />
                  Edit
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex items-center px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </button>
              </>
            )}
            
            {payment.glPostingStatus === 'POSTED' && (
              <button 
                onClick={handleReverse}
                className="flex items-center px-3 py-2 bg-white border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium"
              >
                <Power size={16} className="mr-2" />
                Reverse Payment
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-zinc-200 flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-zinc-900 text-blue-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                }`}
              >
                <Icon size={18} className={`mr-2 ${isActive ? 'text-blue-600' : 'text-zinc-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Financial Details */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                Financial Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-zinc-500">Payment Amount</p>
                  <p className="text-2xl font-bold text-zinc-900">{formatCurrency(payment.paymentAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Allocated Amount</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(payment.totalAllocatedAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">TDS Amount</p>
                  <p className="text-lg font-medium text-zinc-700">{formatCurrency(payment.tdsAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Vendor Outstanding</p>
                  <p className="text-lg font-medium text-zinc-700">{formatCurrency(payment.vendorOutstandingBalance)}</p>
                </div>
              </div>
            </div>

            {/* Vendor & Bank Info */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                Payment Details
              </h3>
              <dl className="grid grid-cols-2 gap-y-4 gap-x-4 pt-2 text-sm">
                <div>
                  <dt className="text-zinc-500">Vendor</dt>
                  <dd className="font-medium text-zinc-900 mt-1">{payment.vendorName}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Payment Mode</dt>
                  <dd className="font-medium text-zinc-900 mt-1">{payment.paymentMode}</dd>
                </div>
                {payment.bankName && (
                  <>
                    <div>
                      <dt className="text-zinc-500">Bank Name</dt>
                      <dd className="font-medium text-zinc-900 mt-1">{payment.bankName}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Bank Account</dt>
                      <dd className="font-mono text-zinc-900 mt-1">{payment.bankAccountNumber}</dd>
                    </div>
                  </>
                )}
                {payment.remarks && (
                  <div className="col-span-2">
                    <dt className="text-zinc-500">Remarks</dt>
                    <dd className="font-medium text-zinc-900 mt-1">{payment.remarks}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Reference Info */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                References
              </h3>
              <dl className="grid grid-cols-2 gap-4 pt-2 text-sm">
                <div>
                  <dt className="text-zinc-500">Reference No</dt>
                  <dd className="font-medium text-zinc-900 mt-1">{payment.referenceNo || '-'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Transaction ID</dt>
                  <dd className="font-mono text-zinc-900 mt-1">{payment.transactionId || '-'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Cheque Number</dt>
                  <dd className="font-mono text-zinc-900 mt-1">{payment.chequeNumber || '-'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Cheque Date</dt>
                  <dd className="font-medium text-zinc-900 mt-1">{payment.chequeDate ? format(new Date(payment.chequeDate), 'dd MMM yyyy') : '-'}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">UTR Number</dt>
                  <dd className="font-mono text-zinc-900 mt-1">{payment.utrNumber || '-'}</dd>
                </div>
              </dl>
            </div>

            {/* Audit Info */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 border-b pb-2 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-orange-600" />
                Audit Information
              </h3>
              <dl className="grid grid-cols-2 gap-4 pt-2 text-sm">
                <div>
                  <dt className="text-zinc-500">Created At</dt>
                  <dd className="font-medium text-zinc-900 mt-1">
                    {payment.createdAt ? format(new Date(payment.createdAt), 'PPpp') : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Updated At</dt>
                  <dd className="font-medium text-zinc-900 mt-1">
                    {payment.updatedAt ? format(new Date(payment.updatedAt), 'PPpp') : '-'}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-zinc-500">GL Posting Time</dt>
                  <dd className="font-medium text-zinc-900 mt-1">
                    {payment.glPostingTime ? format(new Date(payment.glPostingTime), 'PPpp') : '-'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* ALLOCATIONS TAB */}
        {activeTab === 'allocations' && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h3 className="text-lg font-medium text-zinc-900">Invoice Allocations</h3>
              <div className="text-sm">
                <span className="text-zinc-500 mr-2">Total Allocated:</span>
                <span className="font-bold text-zinc-900">{formatCurrency(payment.totalAllocatedAmount)}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-700 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Invoice No</th>
                    <th className="px-4 py-3 text-right">Invoice Total</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-right">Allocated Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {allocations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-12 text-center text-zinc-500">
                        No invoices allocated for this payment.
                      </td>
                    </tr>
                  ) : (
                    allocations.map((alloc, idx) => (
                      <tr key={alloc.id || idx} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{alloc.invoiceNo}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(alloc.invoiceTotalAmount)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(alloc.invoiceOutstandingAmount)}</td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">{formatCurrency(alloc.allocatedAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            alloc.invoiceStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                            alloc.invoiceStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800' :
                            'bg-zinc-100 text-zinc-800'
                          }`}>
                            {alloc.invoiceStatus || 'UNKNOWN'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit AP Payment"
        size="4xl"
      >
        <ApPaymentForm
          initialData={payment}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={isUpdating}
        />
      </Modal>

    </div>
  );
}
