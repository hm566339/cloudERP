import React from 'react';
import { Truck, QrCode } from 'lucide-react';

export default function SalesInvoiceOverviewTab({
  inv,
  companyInfo = {},
  customerInfo = {},
  deliveryInfo = {},
  eInvoiceInfo = {},
  curr = '₹',
  fmt,
  StatusBadge,
  totalAmount = 0,
  outstandingAmount = 0
}) {
  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
          <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Invoice Information</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            ['Invoice Number', inv.invoiceNumber || inv.invoiceNo],
            ['Invoice Date', inv.invoiceDate],
            ['Due Date', inv.dueDate],
            ['Status', <StatusBadge key="sb1" status={inv.status} />],
            ['Payment Status', <StatusBadge key="sb2" status={inv.paymentStatus || (outstandingAmount === 0 ? 'PAID' : 'UNPAID')} />],
            ['Currency', curr],
            ['Exchange Rate', inv.exchangeRate || 1],
            ['Base Currency Amount', `${inv.companyBaseCurrency || curr} ${fmt(inv.baseCurrencyAmount || totalAmount)}`],
            ['Place of Supply', inv.placeOfSupplyDisplayName
              || (inv.placeOfSupplyStateCode
                ? `${inv.placeOfSupplyStateCode} - ${inv.placeOfSupply || ''}`
                : (inv.placeOfSupply || '-'))],
            ['GL Posting Status', <StatusBadge key="glps" status={inv.glPostingStatus || inv.status || 'DRAFT'} />],
            ['Reference Number', inv.referenceNumber],
            ['Business Description', inv.businessDescription],
            ['Remarks', inv.remarks],
          ].map(([label, val]) => (
            <div key={label} className="flex flex-col gap-1">
              <p className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">{label}</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{val || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
          <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Company Information</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            ['Company Name', companyInfo.companyName || inv.companyName],
            ['Company Code', companyInfo.companyCode || inv.companyCode],
            ['GSTIN', companyInfo.gstin || inv.companyGstin],
            ['PAN', companyInfo.pan || inv.companyPan],
            ['Address', companyInfo.address || inv.companyAddress],
            ['Contact Details', companyInfo.phone || companyInfo.email || '-'],
            ['Base Currency', companyInfo.baseCurrency || inv.companyBaseCurrency || 'INR'],
          ].map(([label, val]) => (
            <div key={label} className="flex flex-col gap-1">
              <p className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">{label}</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{val || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
          <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider">Customer Information</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            ['Customer Code', customerInfo.customerCode || inv.customerCode],
            ['Customer Name', customerInfo.customerName || inv.customerName],
            ['GSTIN', customerInfo.gstin || inv.customerGstin],
            ['PAN', customerInfo.pan || inv.customerPan],
            ['Email', customerInfo.email || inv.customerEmail],
            ['Phone', customerInfo.phone || inv.customerPhone],
            ['Billing Address', customerInfo.billingAddress || inv.billingAddress],
            ['Shipping Address', customerInfo.shippingAddress || inv.shippingAddress],
            ['Credit Limit', customerInfo.creditLimit ? `₹${fmt(customerInfo.creditLimit)}` : '-'],
            ['Outstanding Balance', customerInfo.outstandingBalance ? `₹${fmt(customerInfo.outstandingBalance)}` : '-'],
            ['Available Credit', customerInfo.availableCredit ? `₹${fmt(customerInfo.availableCredit)}` : '-'],
            ['Payment Terms', customerInfo.paymentTerms || inv.paymentTerms],
          ].map(([label, val]) => (
            <div key={label} className="flex flex-col gap-1">
              <p className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">{label}</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-[#E6E8EE]">{val || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transport & Delivery Information */}
      {(inv.deliveryAddressLine1 || inv.deliveryCity || inv.deliveryState || inv.transporter || inv.transportDocNo || inv.vehicleNo || deliveryInfo.transporter) && (
        <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
            <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-2">
              <Truck size={15} className="text-zinc-500 dark:text-[#6B7184]" /> Delivery & Transport Details
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(inv.deliveryAddressLine1 || inv.deliveryCity || inv.deliveryState) && (
              <div>
                <p className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider mb-2">Delivery Address</p>
                <address className="not-italic text-sm font-medium text-zinc-900 dark:text-[#E6E8EE] leading-6">
                  {inv.deliveryAddressLine1 && <span className="block">{inv.deliveryAddressLine1}</span>}
                  {inv.deliveryAddressLine2 && <span className="block">{inv.deliveryAddressLine2}</span>}
                  {inv.deliveryCity && <span className="block">{inv.deliveryCity}{inv.deliveryState ? `, ${inv.deliveryState}` : ''}{inv.deliveryPostalCode ? ` ${inv.deliveryPostalCode}` : ''}</span>}
                  {inv.deliveryCountry && <span className="block text-zinc-500 dark:text-[#6B7184]">{inv.deliveryCountry}</span>}
                </address>
              </div>
            )}
            <div>
              <p className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider mb-2">Transport Information</p>
              <dl className="space-y-2">
                <div>
                  <dt className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase">Transporter</dt>
                  <dd className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE]">{inv.transporter || deliveryInfo.transporter || '-'}</dd>
                </div>
                <div>
                  <dt className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase">Transport Doc No</dt>
                  <dd className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE]">{inv.transportDocNo || deliveryInfo.lrNumber || deliveryInfo.transportDocNo || '-'}</dd>
                </div>
                <div>
                  <dt className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase">Vehicle No</dt>
                  <dd className="text-sm font-semibold text-zinc-800 dark:text-[#E6E8EE]">{inv.vehicleNo || deliveryInfo.vehicleNumber || '-'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* E-Invoice & E-Way Bill */}
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center justify-between">
          <h3 className="text-[10.4px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-2">
            <QrCode size={16} className="text-blue-600 dark:text-[#4C8DFF]" /> E-Invoice & E-Way Bill Information
          </h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            ['IRN', eInvoiceInfo.irn],
            ['Ack Number', eInvoiceInfo.ackNumber || eInvoiceInfo.ackNo],
            ['Ack Date', eInvoiceInfo.ackDate || inv.ackDate],
            ['E-Way Bill Number', eInvoiceInfo.ewbNumber || inv.ewbNumber],
            ['E-Way Bill Validity', eInvoiceInfo.ewbValidity || inv.ewbValidity],
          ].map(([label, val]) => (
            <div key={label} className="flex flex-col gap-1">
              <p className="text-[8.8px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">{label}</p>
              <p className="text-sm font-mono font-medium text-zinc-900 dark:text-[#E6E8EE]">{val || '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
