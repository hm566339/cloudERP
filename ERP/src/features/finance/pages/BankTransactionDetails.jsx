import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Calendar, FileText, CheckCircle, XCircle, Clock, 
  RotateCcw, RefreshCw, Edit, Trash2, Hash, BookOpen
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { bankTransactionsApi } from '../../../api/account';
import { DetailsSkeleton } from '../../../components/common/SkeletonLoader';
import { confirmDialog } from '../../../utils/confirmDialog';
import Modal from '../../../components/common/Modal';
import CustomSelect from '../../../components/common/CustomSelect';
import { accountHttpClient } from '../../../api/common/client';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function BankTransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();

  const { data, isLoading, error, refetch } = useApiQuery(bankTransactionsApi.getBankTransactionById, id);
  const record = data?.data || data;

  const updateMutation = useApiMutation(bankTransactionsApi.updateBankTransaction);
  const deleteMutation = useApiMutation(bankTransactionsApi.deleteBankTransaction);
  const reconcileMutation = useApiMutation(bankTransactionsApi.reconcileTransaction);
  const unreconcileMutation = useApiMutation(bankTransactionsApi.unreconcileTransaction);
  const reverseMutation = useApiMutation(bankTransactionsApi.reverseTransaction);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reverseNarration, setReverseNarration] = useState('');
  const [formData, setFormData] = useState({});

  const { data: bankAccountsData } = useApiQuery(() => accountHttpClient.get('/api/account/bank-accounts', { params: { size: 1000 } }).catch(() => ({ data: [] })));
  const raw_bankAccountsList = bankAccountsData?.data?.content || bankAccountsData?.data || [];
  const bankAccountsList = Array.isArray(raw_bankAccountsList) ? raw_bankAccountsList : [];

  if (isLoading) return <DetailsSkeleton />;

  if (error || !record) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2>Failed to load Bank Transaction details.</h2>
        <p className="text-sm mt-2">{error?.response?.data?.message || error?.message || 'Unknown error occurred.'}</p>
        <button onClick={() => refetch()} className="btn-secondary mt-4">Retry</button>
      </div>
    );
  }

  const handleOpenEditModal = () => {
    setFormData({
      bankAccountId: record.bankAccount?.id || record.bankAccountId || '',
      transactionDate: record.transactionDate ? record.transactionDate.split('T')[0] : '',
      transactionType: record.transactionType || 'DEPOSIT',
      referenceNo: record.referenceNo || '',
      utrNo: record.utrNo || '',
      debitAmount: record.debitAmount || '',
      creditAmount: record.creditAmount || '',
      narration: record.narration || '',
      reconciled: record.reconciled || false
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateEditForm = () => {
    const debit = parseFloat(formData.debitAmount || 0);
    const credit = parseFloat(formData.creditAmount || 0);
    if (debit > 0 && credit > 0) return "Either Debit OR Credit must contain a value. Both cannot contain values.";
    if (debit <= 0 && credit <= 0) return "Amount must be greater than zero.";
    return null;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateEditForm();
    if (errorMsg) {
      alert(errorMsg);
      return;
    }

    try {
      const payload = {
        data: {
          bankAccountId: formData.bankAccountId,
          transactionDate: formData.transactionDate,
          transactionType: formData.transactionType,
          referenceNo: formData.referenceNo?.trim() || null,
          utrNo: formData.utrNo?.trim() || null,
          debitAmount: parseFloat(formData.debitAmount || 0),
          creditAmount: parseFloat(formData.creditAmount || 0),
          narration: formData.narration?.trim() || null,
          reconciled: formData.reconciled
        }
      };

      await updateMutation.mutateAsync({ id: record.id, data: payload.data });
      setIsEditModalOpen(false);
      refetch();
    } catch (err) {
      alert(`Error: ${err?.response?.data?.message || err?.message || 'Validation failed'}`);
    }
  };

  const handleDelete = async () => {
    if (await confirmDialog({ message: `Are you sure you want to delete this transaction?`, info: record })) {
      try {
        await deleteMutation.mutateAsync(record.id);
        navigate(buildPath('/accounts/transactions/bank-transactions'));
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to delete transaction');
      }
    }
  };

  const handleReconcile = async () => {
    if (await confirmDialog({ message: `Are you sure you want to reconcile this transaction?`, info: record })) {
      try {
        await reconcileMutation.mutateAsync(record.id);
        refetch();
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to reconcile transaction');
      }
    }
  };

  const handleUnreconcile = async () => {
    if (await confirmDialog({ message: `Are you sure you want to unreconcile this transaction?`, info: record })) {
      try {
        await unreconcileMutation.mutateAsync(record.id);
        refetch();
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to unreconcile transaction');
      }
    }
  };

  const handleReverseSubmit = async (e) => {
    e.preventDefault();
    if (!reverseNarration.trim()) {
      alert("Narration is required to reverse a transaction.");
      return;
    }

    try {
      await reverseMutation.mutateAsync({ id: record.id, narration: reverseNarration.trim() });
      setIsReverseModalOpen(false);
      refetch();
    } catch (err) {
      alert(`Error: ${err?.response?.data?.message || err?.message || 'Failed to reverse transaction'}`);
    }
  };

  const typeColors = {
    DEPOSIT: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
    WITHDRAWAL: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
    TRANSFER: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
    PAYMENT: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={buildPath("/accounts/transactions/bank-transactions")} className="p-2 hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-full transition-colors">
            <ArrowLeft size={20} className="text-zinc-500 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Building2 size={22} className="text-blue-600 dark:text-[#4C8DFF]" />
              Transaction Details
            </h1>
            <p className="page-subtitle">Ref: {record.referenceNo || 'N/A'} • {new Date(record.transactionDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {record.reconciled ? (
            <button onClick={handleUnreconcile} className="btn-secondary text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <XCircle size={15} /> Unreconcile
            </button>
          ) : (
            <button onClick={handleReconcile} className="btn-secondary text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle size={15} /> Reconcile
            </button>
          )}
          
          <button onClick={() => { setReverseNarration(''); setIsReverseModalOpen(true); }} className="btn-secondary text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <RotateCcw size={15} /> Reverse
          </button>
          <button onClick={handleOpenEditModal} className="btn-secondary flex items-center gap-2">
            <Edit size={15} /> Edit
          </button>
          <button onClick={handleDelete} className="btn-secondary text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction Summary Card */}
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#1D212C] dark:to-[#161922] border-blue-100 dark:border-[#2A2F3D] md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${
              record.debitAmount > 0 ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
            }`}>
              <Building2 size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-1">Transaction Amount</p>
              <h2 className={`text-4xl font-bold ${record.debitAmount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {record.transactionAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
              </h2>
              <p className="text-sm font-medium text-blue-600 dark:text-[#4C8DFF] mt-1">
                Running Balance: {record.runningBalance?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className={`px-4 py-2 rounded-xl border flex flex-col items-center justify-center ${typeColors[record.transactionType] || 'bg-white dark:bg-[#1D212C] border-zinc-200 dark:border-[#2A2F3D]'}`}>
              <span className="text-xs uppercase tracking-wider opacity-70">Type</span>
              <span className="font-bold">{record.transactionType}</span>
            </div>
            <div className={`px-4 py-2 rounded-xl border flex flex-col items-center justify-center ${
              record.reconciled ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400'
            }`}>
              <span className="text-xs uppercase tracking-wider opacity-70">Status</span>
              <span className="font-bold flex items-center gap-1">
                {record.reconciled ? <CheckCircle size={14} /> : <Clock size={14} />}
                {record.reconciled ? 'Reconciled' : 'Unreconciled'}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2">
            <Building2 size={18} className="text-blue-600 dark:text-[#4C8DFF]" />
            Bank Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Bank Name</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{record.bankAccount?.bankName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Branch</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{record.bankAccount?.branchName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Account Number</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{record.bankAccount?.accountNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">IFSC Code</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{record.bankAccount?.ifscCode || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Account Type</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{record.bankAccount?.accountType || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Transaction Information */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2">
            <FileText size={18} className="text-blue-600 dark:text-[#4C8DFF]" />
            Transaction Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{new Date(record.transactionDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Reference No</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{record.referenceNo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">UTR No</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{record.utrNo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Transaction Type</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{record.transactionType}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Debit</p>
              <p className="font-medium text-rose-600 dark:text-rose-400">
                {record.debitAmount > 0 ? record.debitAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Credit</p>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                {record.creditAmount > 0 ? record.creditAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Narration</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE] bg-zinc-50 dark:bg-[#1D212C] p-2 rounded border border-zinc-200 dark:border-[#2A2F3D] mt-1">
                {record.narration || 'No narration provided'}
              </p>
            </div>
          </div>
        </div>

        {/* GL & Ledger Information */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2">
            <BookOpen size={18} className="text-blue-600 dark:text-[#4C8DFF]" />
            GL & Ledger Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">GL Status</p>
              <p className={`font-medium ${record.glStatus === 'POSTED' ? 'text-blue-600 dark:text-[#4C8DFF]' : 'text-zinc-600 dark:text-zinc-400'}`}>
                {record.glStatus || 'PENDING'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">GL Account</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">
                {record.bankAccount?.glAccountName 
                  ? `${record.bankAccount.glAccountCode} - ${record.bankAccount.glAccountName}` 
                  : 'N/A'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ledger Account</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{record.bankAccount?.ledgerAccountName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Audit Information */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-200 dark:border-[#2A2F3D] pb-2">
            <Clock size={18} className="text-blue-600 dark:text-[#4C8DFF]" />
            Audit Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Created At</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{new Date(record.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Updated At</p>
              <p className="font-medium text-zinc-900 dark:text-[#E6E8EE]">{new Date(record.updatedAt).toLocaleString()}</p>
            </div>
            {record.reconciledDate && (
              <div className="col-span-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Reconciled On</p>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">{new Date(record.reconciledDate).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Bank Transaction"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Bank Account *</label>
              <CustomSelect
                options={bankAccountsList.map(a => ({ value: a.id, label: `${a.bankName} - ${a.accountNumber} (${a.accountType})` }))}
                value={formData.bankAccountId}
                onChange={(e) => handleEditChange({ target: { name: 'bankAccountId', value: e.target.value } })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Transaction Date *</label>
              <input
                type="date"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleEditChange}
                className="input-field w-full"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Transaction Type *</label>
              <CustomSelect
                options={[
                  { value: 'DEPOSIT', label: 'Deposit' },
                  { value: 'WITHDRAWAL', label: 'Withdrawal' },
                  { value: 'TRANSFER', label: 'Transfer' },
                  { value: 'PAYMENT', label: 'Payment' }
                ]}
                value={formData.transactionType}
                onChange={(e) => handleEditChange({ target: { name: 'transactionType', value: e.target.value } })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Reference Number</label>
              <input
                type="text"
                name="referenceNo"
                value={formData.referenceNo}
                onChange={handleEditChange}
                className="input-field w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">UTR Number</label>
              <input
                type="text"
                name="utrNo"
                value={formData.utrNo}
                onChange={handleEditChange}
                className="input-field w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Debit Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="debitAmount"
                  value={formData.debitAmount}
                  onChange={handleEditChange}
                  className="input-field pl-8 w-full"
                  disabled={formData.creditAmount > 0}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Credit Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="creditAmount"
                  value={formData.creditAmount}
                  onChange={handleEditChange}
                  className="input-field pl-8 w-full"
                  disabled={formData.debitAmount > 0}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Narration</label>
              <textarea
                name="narration"
                value={formData.narration}
                onChange={handleEditChange}
                className="input-field w-full h-20 resize-none"
              ></textarea>
            </div>
            
            <div className="space-y-1.5 md:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                name="reconciled"
                id="reconciled-edit"
                checked={formData.reconciled}
                onChange={handleEditChange}
                className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-zinc-900/10"
              />
              <label htmlFor="reconciled-edit" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Mark as Reconciled
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reverse Modal */}
      <Modal
        isOpen={isReverseModalOpen}
        onClose={() => setIsReverseModalOpen(false)}
        title="Reverse Bank Transaction"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReverseSubmit} className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-sm flex gap-3 mb-4">
            <RotateCcw size={20} className="shrink-0 mt-0.5" />
            <p>Reversing a transaction creates a mirrored entry to cancel its effect. This action cannot be undone.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Reason for Reversal *</label>
            <textarea
              value={reverseNarration}
              onChange={(e) => setReverseNarration(e.target.value)}
              className="input-field w-full h-24 resize-none"
              placeholder="Please provide a clear reason for reversing this transaction..."
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button type="button" onClick={() => setIsReverseModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={reverseMutation.isPending} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors">
              {reverseMutation.isPending ? 'Reversing...' : 'Confirm Reversal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
