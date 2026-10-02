import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import Modal from '../../../components/common/Modal';
import { FileText, CheckCircle } from 'lucide-react';
import JournalLinesTable from './JournalLinesTable';
import CustomSelect from '../../../components/common/CustomSelect';

export default function JournalEntryForm({
  isOpen,
  onClose,
  initialData,
  fiscalYears = [],
  periods = [],
  accounts = [],
  onSubmit,
  isSubmitting,
  isLoadingFY,
  isLoadingPeriods
}) {
  const dispatch = useAppDispatch();

  const [fiscalYearId, setFiscalYearId] = useState('');
  const [accountingPeriodId, setAccountingPeriodId] = useState('');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [narration, setNarration] = useState('');

  const [lines, setLines] = useState([
    { id: 1, accountId: '', lineDescription: '', debitAmount: '', creditAmount: '' },
    { id: 2, accountId: '', lineDescription: '', debitAmount: '', creditAmount: '' }
  ]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFiscalYearId(initialData.fiscalYearId || '');
        setAccountingPeriodId(initialData.accountingPeriodId || '');
        setVoucherDate(initialData.voucherDate || new Date().toISOString().split('T')[0]);
        setReferenceNo(initialData.referenceNo || '');
        setNarration(initialData.narration || '');
        if (initialData.journalLines?.length > 0) {
          setLines(initialData.journalLines.map((l, i) => ({
            id: i + 1,
            accountId: l.accountId || '',
            lineDescription: l.lineDescription || '',
            debitAmount: l.debitAmount > 0 ? l.debitAmount : '',
            creditAmount: l.creditAmount > 0 ? l.creditAmount : ''
          })));
        }
      } else {
        setFiscalYearId(fiscalYears[0]?.id || fiscalYears[0]?.fiscalYearId || '');
        setAccountingPeriodId(periods[0]?.id || periods[0]?.accountingPeriodId || '');
        setVoucherDate(new Date().toISOString().split('T')[0]);
        setReferenceNo('');
        setNarration('');
        setLines([
          { id: 1, accountId: '', lineDescription: '', debitAmount: '', creditAmount: '' },
          { id: 2, accountId: '', lineDescription: '', debitAmount: '', creditAmount: '' }
        ]);
      }
    }
  }, [isOpen, initialData, fiscalYears, periods]);

  useEffect(() => {
    if (fiscalYears.length > 0 && !fiscalYearId && !initialData) {
      setFiscalYearId(fiscalYears[0].id || fiscalYears[0].fiscalYearId);
    }
  }, [fiscalYears, fiscalYearId, initialData]);

  useEffect(() => {
    if (periods.length > 0 && !accountingPeriodId && !initialData) {
      setAccountingPeriodId(periods[0].id || periods[0].accountingPeriodId);
    }
  }, [periods, accountingPeriodId, initialData]);


  const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBalanced) {
      dispatch(addAlert({ type: 'warning', message: 'Journal entry must be balanced (Total Debit = Total Credit)' }));
      return;
    }

    const payload = {
      data: {
        fiscalYearId,
        accountingPeriodId,
        voucherDate,
        referenceNo,
        narration,
        journalLines: lines.map(l => ({
          accountId: l.accountId,
          lineDescription: l.lineDescription,
          debitAmount: parseFloat(l.debitAmount) || 0,
          creditAmount: parseFloat(l.creditAmount) || 0,
          currencyCode: 'INR',
          exchangeRate: 1
        }))
      }
    };

    await onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? "Edit Journal Entry" : "New Journal Entry"} maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">Fiscal Year *</label>
            <CustomSelect required value={fiscalYearId} onChange={e => setFiscalYearId(e.target.value)} disabled={isLoadingFY || !!initialData}>
              <option value="">Select FY</option>
              {fiscalYears.map(fy => <option key={fy.id || fy.fiscalYearId} value={fy.id || fy.fiscalYearId}>{fy.fiscalYear || fy.name || fy.year || 'Unknown FY'}</option>)}
            </CustomSelect>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">Period *</label>
            <CustomSelect required value={accountingPeriodId} onChange={e => setAccountingPeriodId(e.target.value)} disabled={!fiscalYearId || isLoadingPeriods || !!initialData}>
              <option value="">Select Period</option>
              {periods.map(p => <option key={p.id || p.accountingPeriodId} value={p.id || p.accountingPeriodId}>{p.periodName || p.name || 'Unknown Period'}</option>)}
            </CustomSelect>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">Voucher Date *</label>
            <input type="date" required className="input-field w-full" value={voucherDate} onChange={e => setVoucherDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700">Reference #</label>
            <input type="text" className="input-field w-full font-mono" placeholder="Optional" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700">Narration (Memo) *</label>
          <input type="text" required className="input-field w-full" placeholder="Description of the transaction..." value={narration} onChange={e => setNarration(e.target.value)} />
        </div>

        <div className="pt-2">
          <h4 className="text-sm font-semibold text-zinc-800 mb-2 flex items-center gap-1.5">
            <FileText size={16} className="text-zinc-500" /> Line Items
          </h4>
          
          <JournalLinesTable 
            lines={lines}
            setLines={setLines}
            accounts={accounts}
          />

          {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
            <div className="mt-3 p-3 bg-rose-50 rounded-lg border border-rose-100 flex items-center gap-2 text-sm font-semibold text-rose-800">
              <span>⚠️</span> Out of balance by {Math.abs(totalDebit - totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Debits must equal credits.
            </div>
          )}
          {isBalanced && totalDebit > 0 && (
            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle size={16} /> Entry is balanced and ready to save.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={!isBalanced || isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving...' : (initialData ? 'Update Entry' : 'Save as Draft')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
