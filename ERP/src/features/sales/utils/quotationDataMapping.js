/**
 * Quotation Data Mapping Utilities
 * Provides centralized, consistent data mapping for backend quotation responses,
 * including date formatting (MM/DD/YYYY), currency formatting (INR with ₹ and 2 decimals),
 * tax rate computation, outstanding calculation, and full financial summary derivation.
 */

export const formatDate = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

export const formatCurrency = (amount, currency = 'INR') => {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (currency === 'INR' || !currency) {
    return `₹${formatted}`;
  }
  return `${currency} ${formatted}`;
};

export const getItemTaxRate = (it = {}) => {
  if (it.taxRate != null && it.taxRate !== '') return `${it.taxRate}%`;
  if (it.gstRate != null && it.gstRate !== '') return `${it.gstRate}%`;
  if (it.gstSlab != null && it.gstSlab !== '') return it.gstSlab;
  const igst = Number(it.igstRate || 0);
  const cgst = Number(it.cgstRate || 0);
  const sgst = Number(it.sgstRate || 0);
  const totalRate = igst > 0 ? igst : (cgst + sgst);
  if (totalRate > 0) return `${totalRate}%`;
  const taxable = Number(it.taxableAmount || 0);
  const tax = Number(it.taxAmount || 0);
  if (taxable > 0 && tax > 0) {
    const calculated = (tax / taxable) * 100;
    return `${Number(calculated.toFixed(2))}%`;
  }
  return '—';
};

export const getQuotationOutstanding = (row = {}) => {
  if (row.outstandingAmount != null) return Number(row.outstandingAmount);
  if (row.totalAmount != null) {
    const paid = Number(row.paidAmount || 0);
    return Math.max(0, Number(row.totalAmount) - paid);
  }
  if (row.customer?.outstandingBalance != null) {
    return Number(row.customer.outstandingBalance);
  }
  return 0;
};

export const calculateQuotationSummary = (quote = {}) => {
  const lineItems = quote.items || quote.lineItems || [];
  const taxSummary = quote.taxSummary || {};
  const amtSummary = quote.amountSummary || {};
  const stats = quote.statistics || {};

  const itemTaxableSum = lineItems.reduce((sum, it) => sum + (Number(it.taxableAmount) || 0), 0);
  const itemCgstSum = lineItems.reduce((sum, it) => sum + (Number(it.cgstAmount || it.cgst) || 0), 0);
  const itemSgstSum = lineItems.reduce((sum, it) => sum + (Number(it.sgstAmount || it.sgst) || 0), 0);
  const itemIgstSum = lineItems.reduce((sum, it) => sum + (Number(it.igstAmount || it.igst) || 0), 0);
  const itemTotalTaxSum = lineItems.reduce((sum, it) => sum + (Number(it.taxAmount) || 0), 0);
  const itemDiscountSum = lineItems.reduce((sum, it) => sum + (Number(it.discountAmount) || 0), 0);

  const subtotal = Number(
    quote.subtotal ??
    amtSummary.subtotal ??
    lineItems.reduce((sum, it) => sum + (Number(it.unitPrice || it.rate || it.price || 0) * Number(it.quantity || 0)), 0)
  );

  const discountAmount = Number(
    quote.discountAmount ??
    amtSummary.discountAmount ??
    itemDiscountSum
  );

  const taxableAmount = Number(
    itemTaxableSum > 0
      ? itemTaxableSum
      : (taxSummary.taxableAmount ?? amtSummary.subtotal ?? (subtotal - discountAmount))
  );

  const cgst = Number(quote.cgstAmount ?? taxSummary.cgst ?? taxSummary.cgstAmount ?? itemCgstSum);
  const sgst = Number(quote.sgstAmount ?? taxSummary.sgst ?? taxSummary.sgstAmount ?? itemSgstSum);
  let igst = Number(quote.igstAmount ?? taxSummary.igst ?? taxSummary.igstAmount ?? itemIgstSum);

  const calculatedTaxSum = itemTotalTaxSum > 0 ? itemTotalTaxSum : (cgst + sgst + igst);
  const totalTax = Number(quote.taxAmount ?? taxSummary.totalTax ?? taxSummary.taxAmount ?? calculatedTaxSum);
  if (igst === 0 && cgst === 0 && sgst === 0 && totalTax > 0) {
    igst = totalTax;
  }

  const itemTotalSum = lineItems.reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0);
  const otherCharges = Number(quote.otherCharges ?? 0) + Number(quote.freightCharges ?? 0) + Number(amtSummary.otherCharges ?? 0);
  const roundOff = Number(quote.roundOff ?? amtSummary.roundOff ?? 0);
  const totalAmount = Number(
    quote.totalAmount ??
    amtSummary.totalAmount ??
    (itemTotalSum > 0 ? itemTotalSum : (subtotal - discountAmount + totalTax + otherCharges + roundOff))
  );

  const paidAmount = Number(quote.paidAmount ?? amtSummary.paidAmount ?? amtSummary.receivedAmount ?? 0);
  const outstandingAmount = Number(
    quote.outstandingAmount ??
    amtSummary.outstandingAmount ??
    Math.max(0, totalAmount - paidAmount)
  );

  let paymentPercentage = '—';
  if (quote.paidAmount != null && totalAmount > 0) {
    paymentPercentage = `${Math.round((paidAmount / totalAmount) * 100)}%`;
  } else if (stats.paymentPercentage != null) {
    paymentPercentage = `${stats.paymentPercentage}%`;
  }

  const itemCount = stats.itemCount ?? lineItems.length;

  let daysOutstanding = stats.daysOutstanding;
  if (daysOutstanding == null && quote.quotationDate) {
    const quoteTime = new Date(quote.quotationDate).setHours(0, 0, 0, 0);
    const nowTime = new Date().setHours(0, 0, 0, 0);
    if (!isNaN(quoteTime)) {
      daysOutstanding = Math.max(0, Math.floor((nowTime - quoteTime) / (1000 * 60 * 60 * 24)));
    }
  }
  const daysOutstandingText = daysOutstanding != null ? `${daysOutstanding} days` : '—';

  let agingBucket = stats.agingBucket;
  if (!agingBucket && daysOutstanding != null) {
    if (daysOutstanding <= 30) agingBucket = '0-30 days';
    else if (daysOutstanding <= 60) agingBucket = '31-60 days';
    else if (daysOutstanding <= 90) agingBucket = '61-90 days';
    else agingBucket = '90+ days';
  }
  const agingBucketText = agingBucket || '—';

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalTax,
    otherCharges,
    roundOff,
    totalAmount,
    paidAmount,
    outstandingAmount,
    paymentPercentage,
    itemCount,
    daysOutstanding,
    daysOutstandingText,
    agingBucket: agingBucketText
  };
};
