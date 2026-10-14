import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { useCreateProformaInvoiceFromQuotationMutation } from '../../../api/sales-crm/sales.api';
import { useGetBankAccountsQuery } from '../../../api/account/banking.api';
import { useGetChartOfAccountsQuery } from '../../../api/account/accounting.api';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import CustomSelect from '../../../components/common/CustomSelect';

export default function ProformaInvoiceFromQuotationModal({
  isOpen,
  onClose,
  companyId,
  quotation,
  onSuccess
}) {
  const dispatch = useAppDispatch();
  const [createPI, { isLoading }] = useCreateProformaInvoiceFromQuotationMutation();

  const { data: bankAccountsResponse, isLoading: banksLoading } = useGetBankAccountsQuery(
    { companyId, page: 0, size: 100 },
    { skip: !isOpen }
  );

  const { data: chartOfAccountsData, isLoading: accountsLoading } = useGetChartOfAccountsQuery(
    { companyId, page: 0, size: 1000 },
    { skip: !isOpen }
  );

  const rawAccounts = chartOfAccountsData?.data?.data || chartOfAccountsData?.data?.content || chartOfAccountsData?.content || chartOfAccountsData?.data || [];
  const chartOfAccounts = Array.isArray(rawAccounts) ? rawAccounts : [];

  const bankAccounts = useMemo(() => {
    if (Array.isArray(bankAccountsResponse)) return bankAccountsResponse;
    if (bankAccountsResponse?.data?.content) return bankAccountsResponse.data.content;
    if (bankAccountsResponse?.data) return bankAccountsResponse.data;
    if (bankAccountsResponse?.content) return bankAccountsResponse.content;
    return [];
  }, [bankAccountsResponse]);

  const [piDate, setPiDate] = useState(new Date().toISOString().split('T')[0]);
  const [piValidTill, setPiValidTill] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentCondition, setPaymentCondition] = useState('');
  const [receivableAccountId, setReceivableAccountId] = useState('');
  const [receiptAccountId, setReceiptAccountId] = useState('');

  useEffect(() => {
    if (isOpen && quotation) {
      setPiValidTill(quotation.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setPaymentCondition(quotation.paymentTerms || '');
    }
  }, [isOpen, quotation]);

  const items = useMemo(() => quotation?.items || [], [quotation]);

  const calculatedTotals = useMemo(() => {
    if (!quotation) return null;
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let cess = 0;

    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const discPct = parseFloat(item.discountPercent) || 0;

      const grossAmount = qty * price;
      const discAmt = (grossAmount * discPct) / 100;
      const taxable = grossAmount - discAmt;

      subtotal += grossAmount;
      discount += discAmt;

      const cgstAmt = (taxable * (parseFloat(item.cgstRate) || 0)) / 100;
      const sgstAmt = (taxable * (parseFloat(item.sgstRate) || 0)) / 100;
      const igstAmt = (taxable * (parseFloat(item.igstRate) || 0)) / 100;
      const cessAmt = (taxable * (parseFloat(item.cessRate) || 0)) / 100;

      cgst += cgstAmt;
      sgst += sgstAmt;
      igst += igstAmt;
      cess += cessAmt;
      tax += (cgstAmt + sgstAmt + igstAmt + cessAmt);
    });

    const freight = parseFloat(quotation.freightCharges) || 0;
    const other = parseFloat(quotation.otherCharges) || 0;

    const totalBeforeRoundOff = (subtotal - discount) + freight + other + tax;
    const grandTotal = Math.round(totalBeforeRoundOff);
    const roundOff = grandTotal - totalBeforeRoundOff;

    return {
      subtotal,
      discount,
      taxableAmount: subtotal - discount,
      cgst,
      sgst,
      igst,
      cess,
      tax,
      freight,
      other,
      roundOff,
      grandTotal
    };
  }, [quotation, items]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!piDate) return dispatch(addAlert({ type: 'error', message: 'PI Date is required.' }));
    if (!piValidTill) return dispatch(addAlert({ type: 'error', message: 'PI Valid Till is required.' }));
    if (piValidTill < piDate) return dispatch(addAlert({ type: 'error', message: 'PI Valid Till cannot be before PI Date.' }));

    const isAdvanceRequired = Number(advanceAmount) > 0;

    try {
      const payload = {
        quotationId: quotation.id,
        companyId,
        piDate,
        piValidTill,
        advanceRequired: isAdvanceRequired,
        advanceAmount: isAdvanceRequired ? (parseFloat(advanceAmount) || 0) : 0,
        bankAccountId: bankAccountId || null,
        paymentCondition: paymentCondition || null,
        paymentMode: paymentMode || null,
        receivableAccountId: receivableAccountId || null,
        receiptAccountId: receiptAccountId || null
      };

      const response = await createPI({ data: payload }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Proforma Invoice created successfully.' }));

      if (onSuccess) onSuccess(response?.data?.id || response?.id, response?.data?.piNumber || response?.piNumber);

    } catch (error) {
      console.error(error);
      dispatch(addAlert({ type: 'error', message: error?.data?.message || 'An error occurred while creating Proforma Invoice.' }));
    }
  };

  if (!isOpen || !quotation) return null;

  const currency = quotation.quotationCurrency || 'INR';

  return createPortal(
    <>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
        <div className="bg-white shadow-2xl w-full h-full flex flex-col overflow-hidden">

          <div className="flex flex-col flex-none">
            <div className="flex justify-between items-center p-4 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-base font-bold text-zinc-800">Create Proforma Invoice</h2>
              <div className="text-xs text-zinc-500 font-medium ml-4 truncate">Create a proforma invoice from quotation</div>
              <button type="button" onClick={onClose} className="p-1.5 ml-auto text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          <form id="pi-form" onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden text-xs min-h-0">
            {/* ── MAIN WORKSPACE: LEFT FORM (31%) | RIGHT ITEMS (69%) ── */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 bg-white">

              {/* ── LEFT COLUMN ── */}
              <div className="w-full lg:w-[31%] flex-none p-2 bg-zinc-50/40 overflow-y-auto overflow-x-hidden flex flex-col gap-2">
                {/* SOURCE DOCUMENT CARD */}
                <div className="flex-none border border-zinc-200 rounded-lg bg-white shadow-2xs overflow-hidden">
                  <div className="p-2.5 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <div className="text-[8px] text-zinc-500 font-semibold uppercase">Source Quotation</div>
                        <div className="font-mono text-xs font-bold text-zinc-900 flex items-center gap-1.5 mt-0.5">
                          <FileText size={12} className="text-zinc-400" />
                          {quotation.quotationNumber}
                        </div>
                      </div>
                      <div className="hidden sm:block h-6 w-px bg-zinc-200"></div>
                      <div>
                        <div className="text-[8px] text-zinc-500 font-semibold uppercase">Date</div>
                        <div className="mt-0.5 font-medium text-xs text-zinc-700">
                          {quotation.quotationDate}
                        </div>
                      </div>
                      <div className="hidden sm:block h-6 w-px bg-zinc-200"></div>
                      <div>
                        <div className="text-[8px] text-zinc-500 font-semibold uppercase">Status</div>
                        <div className="mt-0.5">
                          <span className="px-2 py-0.5 text-[8px] font-semibold rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
                            {quotation.status}
                          </span>
                        </div>
                      </div>
                      <div className="hidden sm:block h-6 w-px bg-zinc-200"></div>
                      <div>
                        <div className="text-[8px] text-zinc-500 font-semibold uppercase">Total</div>
                        <div className="mt-0.5 font-bold text-xs text-zinc-900">
                          {calculatedTotals ? new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.grandTotal) : ''}
                        </div>
                      </div>
                    </div>
                    <div>
                      <button type="button" onClick={() => window.open(`/accounts/transactions/quotations/${quotation.id}`, '_blank')} className="px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </div>

                {/* CUSTOMER DETAILS */}
                <div className="flex-none border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                    <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Customer Details</h3>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Customer *</label>
                      <input
                        type="text"
                        className="input-field w-full h-8 text-[8.8px] bg-zinc-50 border-transparent text-zinc-700 cursor-not-allowed font-medium"
                        value={quotation.customerName || quotation.customerId || ''}
                        readOnly
                      />
                    </div>
                    {quotation.billingAddressId && (
                      <div className="text-[8.8px] text-zinc-600">
                        <span className="font-semibold block mb-0.5 text-[8px] text-zinc-500">Billing Address</span>
                        <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">Inherited from Quotation</div>
                      </div>
                    )}
                    {quotation.deliveryAddressId && (
                      <div className="text-[8.8px] text-zinc-600">
                        <span className="font-semibold block mb-0.5 text-[8px] text-zinc-500">Delivery Address</span>
                        <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">Inherited from Quotation</div>
                      </div>
                    )}
                    {quotation.placeOfSupplyStateId && (
                      <div className="text-[8.8px] text-zinc-600">
                        <span className="font-semibold block mb-0.5 text-[8px] text-zinc-500">Place of Supply</span>
                        <div className="p-1.5 bg-zinc-50 rounded border border-zinc-100">Inherited from Quotation</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PROFORMA INVOICE DETAILS */}
                <div className="flex-none border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                    <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Proforma Invoice Details</h3>
                  </div>
                  <div className="space-y-2 pt-1">

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-semibold text-zinc-700 block mb-1">PI Date *</label>
                        <input
                          type="date"
                          className="input-field w-full h-8 text-[8.8px]"
                          value={piDate}
                          onChange={(e) => setPiDate(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-semibold text-zinc-700 block mb-1">PI Valid Till *</label>
                        <input
                          type="date"
                          className="input-field w-full h-8 text-[8.8px]"
                          value={piValidTill}
                          onChange={(e) => setPiValidTill(e.target.value)}
                          required
                          min={piDate}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ADVANCE PAYMENT */}


                {/* PAYMENT TERMS */}
                <div className="flex-none border border-zinc-200 rounded-lg p-2.5 bg-white shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                    <h3 className="text-[8px] font-bold text-zinc-800 uppercase tracking-wider">Payment Terms</h3>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[8px] font-semibold text-zinc-700 block mb-1">Payment Condition</label>
                      <input
                        type="text"
                        className="input-field w-full h-8 text-[8.8px]"
                        value={paymentCondition}
                        onChange={(e) => setPaymentCondition(e.target.value)}
                        placeholder="e.g. 50% Advance"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="w-full flex-1 flex flex-col overflow-y-auto min-h-0 bg-white">



                <div className="px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 flex justify-between items-center flex-none sticky top-0 z-20">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Items</h3>
                    <span className="text-[8.8px] font-medium text-zinc-500 bg-white px-2 py-0.5 rounded-full border border-zinc-200">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                <div className="w-full text-left bg-zinc-100 text-zinc-600 border-b border-zinc-200 sticky top-[36px] z-10 flex-none pr-1">
                  <div className="grid grid-cols-[20%_20%_9%_9%_12%_9%_9%_12%] w-full min-w-0">
                    <div className="p-1.5 font-semibold truncate text-[8.8px]">Item</div>
                    <div className="p-1.5 font-semibold truncate text-[8.8px]">Description</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Qty</div>
                    <div className="p-1.5 font-semibold text-center truncate text-[8.8px]">Unit</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Rate</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Disc %</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Tax</div>
                    <div className="p-1.5 font-semibold text-right truncate text-[8.8px]">Line Total</div>
                  </div>
                </div>

                <div className="flex-none min-h-[112px]">
                  <div className="flex flex-col divide-y divide-zinc-100">
                    {items.map((item) => {
                      const qty = parseFloat(item.quantity) || 0;
                      const price = parseFloat(item.unitPrice) || 0;
                      const discPct = parseFloat(item.discountPercent) || 0;
                      const grossAmount = qty * price;
                      const discAmt = (grossAmount * discPct) / 100;
                      const taxable = grossAmount - discAmt;
                      const totalTaxRate = (parseFloat(item.cgstRate) || 0) + (parseFloat(item.sgstRate) || 0) + (parseFloat(item.igstRate) || 0) + (parseFloat(item.cessRate) || 0);
                      const taxAmt = (taxable * totalTaxRate) / 100;
                      const lineTotal = taxable + taxAmt;

                      return (
                        <div key={item.id} className="grid grid-cols-[20%_20%_9%_9%_12%_9%_9%_12%] w-full bg-white min-w-0 border-b border-zinc-100 last:border-0 box-border items-center py-2">
                          <div className="p-1.5 min-w-0 font-medium text-zinc-900 truncate text-[8.8px]" title={item.itemName}>{item.itemName}</div>
                          <div className="p-1.5 min-w-0 text-zinc-500 truncate text-[8.8px]" title={item.description}>{item.description || '—'}</div>
                          <div className="p-1.5 min-w-0 text-right text-zinc-800 font-bold text-[8.8px]">{item.quantity}</div>
                          <div className="p-1.5 min-w-0 text-center text-zinc-600 text-[8.8px] uppercase">{item.unit || 'PCS'}</div>
                          <div className="p-1.5 min-w-0 text-right text-zinc-700 text-[8.8px]">{item.unitPrice}</div>
                          <div className="p-1.5 min-w-0 text-right text-zinc-600 text-[8.8px]">{item.discountPercent || 0}</div>
                          <div className="p-1.5 min-w-0 text-right text-zinc-700 text-[8.8px]">{taxAmt.toFixed(2)}</div>
                          <div className="p-1.5 min-w-0 text-right font-semibold text-zinc-900 text-[8.8px]">{lineTotal.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PI SUMMARY */}
                {calculatedTotals && (
                  <div className="p-4 border-t border-zinc-200 bg-zinc-50/40 mt-auto flex-none">
                    <div className="bg-white p-3.5 rounded-xl border border-zinc-200 flex flex-col justify-between shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                        <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Proforma Invoice Summary</h3>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9.6px]">
                          <span className="text-zinc-600 font-medium">Sub Total</span>
                          <span className="font-semibold text-zinc-800">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.subtotal)}
                          </span>
                        </div>

                        {calculatedTotals.discount > 0 && (
                          <div className="flex justify-between items-center text-[9.6px]">
                            <span className="text-emerald-600 font-medium">Discount</span>
                            <span className="font-semibold text-emerald-600">
                              -{new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.discount)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[9.6px]">
                          <span className="text-zinc-600 font-medium">Taxable Amount</span>
                          <span className="font-semibold text-zinc-800">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.taxableAmount)}
                          </span>
                        </div>

                        {calculatedTotals.cgst > 0 && (
                          <div className="flex justify-between items-center text-[9.6px]">
                            <span className="text-zinc-500 font-medium ml-4">CGST</span>
                            <span className="font-semibold text-zinc-600">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.cgst)}
                            </span>
                          </div>
                        )}

                        {calculatedTotals.sgst > 0 && (
                          <div className="flex justify-between items-center text-[9.6px]">
                            <span className="text-zinc-500 font-medium ml-4">SGST</span>
                            <span className="font-semibold text-zinc-600">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.sgst)}
                            </span>
                          </div>
                        )}

                        {calculatedTotals.igst > 0 && (
                          <div className="flex justify-between items-center text-[9.6px]">
                            <span className="text-zinc-500 font-medium ml-4">IGST</span>
                            <span className="font-semibold text-zinc-600">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.igst)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[9.6px]">
                          <span className="text-zinc-600 font-medium">Freight Charges</span>
                          <span className="font-semibold text-zinc-800">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.freight)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[9.6px]">
                          <span className="text-zinc-600 font-medium">Other Charges</span>
                          <span className="font-semibold text-zinc-800">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.other)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[9.6px]">
                          <span className="text-zinc-600 font-medium">Round Off</span>
                          <span className="text-zinc-700 font-medium">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.roundOff)}
                          </span>
                        </div>

                        <div className="pt-2.5 border-t border-zinc-200 flex justify-between items-center">
                          <span className="text-sm font-bold text-zinc-900">Grand Total</span>
                          <span className="text-base font-black text-primary">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(calculatedTotals.grandTotal)}
                          </span>
                        </div>

                        <div className="pt-2 pb-1 mt-2">
                          <div className="flex items-center justify-between text-[9.6px]">
                            <span className="text-emerald-600 font-bold">Advance Payment</span>
                            <div className="flex items-center justify-end gap-2 shrink-0">
                              <CustomSelect
                                className="w-28 h-8 text-[8.8px] border border-emerald-200 text-emerald-700 bg-white focus:border-emerald-500 focus:ring-emerald-500 rounded-md outline-none"
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value)}
                              >
                                <option value="">Mode</option>
                                <option value="CASH">CASH</option>
                                <option value="BANK_TRANSFER">BANK</option>
                                <option value="UPI">UPI</option>
                                <option value="CHEQUE">CHEQUE</option>
                                <option value="RTGS">RTGS</option>
                                <option value="NEFT">NEFT</option>
                                <option value="IMPS">IMPS</option>
                                <option value="CARD">CARD</option>
                              </CustomSelect>
                              <span className="text-emerald-600 font-bold whitespace-nowrap">- ₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-28 h-8 text-[8.8px] text-right font-semibold border border-emerald-200 text-zinc-700 bg-white focus:border-emerald-500 focus:ring-emerald-500 rounded-md px-2 outline-none"
                                value={advanceAmount}
                                onChange={(e) => setAdvanceAmount(e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {Number(advanceAmount) > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-emerald-100/50">
                              <div>
                                <CustomSelect
                                  className="w-full h-7 text-[8px] bg-emerald-50/30 border-emerald-100"
                                  value={bankAccountId}
                                  onChange={(e) => setBankAccountId(e.target.value)}
                                >
                                  <option value="">Bank...</option>
                                  {banksLoading ? (
                                    <option disabled>Loading...</option>
                                  ) : (
                                    bankAccounts.map(b => (
                                      <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                                    ))
                                  )}
                                </CustomSelect>
                              </div>
                              <div>
                                <CustomSelect
                                  className="w-full h-7 text-[8px] bg-emerald-50/30 border-emerald-100"
                                  value={receivableAccountId}
                                  onChange={(e) => setReceivableAccountId(e.target.value)}
                                >
                                  <option value="">Receivable...</option>
                                  {accountsLoading ? (
                                    <option disabled>Loading...</option>
                                  ) : (
                                    chartOfAccounts
                                      .filter(a => a.postingAllowed !== false && (a.groupName === 'Accounts Receivable' || a.accountName?.toLowerCase().includes('receivable')))
                                      .map(a => (
                                      <option key={a.id} value={a.id}>{a.accountName} ({a.accountCode})</option>
                                    ))
                                  )}
                                </CustomSelect>
                              </div>
                              <div>
                                <CustomSelect
                                  className="w-full h-7 text-[8px] bg-emerald-50/30 border-emerald-100"
                                  value={receiptAccountId}
                                  onChange={(e) => setReceiptAccountId(e.target.value)}
                                >
                                  <option value="">Receipt...</option>
                                  {accountsLoading ? (
                                    <option disabled>Loading...</option>
                                  ) : (
                                    chartOfAccounts
                                      .filter(a => a.postingAllowed !== false && (a.groupName === 'Cash & Cash Equivalent' || a.groupName === 'Bank Accounts' || a.accountName?.toLowerCase().includes('cash') || a.accountName?.toLowerCase().includes('bank')))
                                      .map(a => (
                                      <option key={a.id} value={a.id}>{a.accountName} ({a.accountCode})</option>
                                    ))
                                  )}
                                </CustomSelect>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="pt-2 mt-2 border-t border-zinc-200 flex justify-between items-center bg-zinc-50/80 -mx-3.5 -mb-3.5 p-3.5 rounded-b-xl">
                          <span className="text-[10.4px] font-bold text-zinc-900 uppercase tracking-wider">Balance Due</span>
                          <span className="text-[12px] font-black text-red-600">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Math.max(0, calculatedTotals.grandTotal - (Number(advanceAmount) || 0)))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </form>

          {/* ── BOTTOM FIXED FOOTER ── */}
          <div className="flex justify-between items-center p-3 border-t border-zinc-200 bg-zinc-100 flex-none">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                form="pi-form"
                disabled={isLoading}
                className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Create Proforma Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>, document.body
  );
}
