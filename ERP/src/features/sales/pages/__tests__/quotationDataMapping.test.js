import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const quotationsPagePath = path.resolve(__dirname, '../QuotationsPage.jsx');
const quotationDetailsPath = path.resolve(__dirname, '../QuotationDetails.jsx');

import {
  formatDate,
  formatCurrency,
  getItemTaxRate,
  getQuotationOutstanding,
  calculateQuotationSummary
} from '../../utils/quotationDataMapping.js';

describe('Quotation API Data Mapping Test Suite', () => {
  const quotationsPageCode = fs.readFileSync(quotationsPagePath, 'utf-8');
  const quotationDetailsCode = fs.readFileSync(quotationDetailsPath, 'utf-8');

  describe('1. Currency & Date Formatting Helpers', () => {
    it('formats dates consistently in MM/DD/YYYY format', () => {
      assert.strictEqual(formatDate('2026-10-31'), '10/31/2026');
      assert.strictEqual(formatDate('2024-05-15T10:30:00Z'), '05/15/2024');
      assert.strictEqual(formatDate(null), '—');
      assert.strictEqual(formatDate(undefined), '—');
      assert.strictEqual(formatDate(''), '—');
    });

    it('formats currency with ₹ symbol and 2 decimal places for INR', () => {
      assert.strictEqual(formatCurrency(3200), '₹3,200.00');
      assert.strictEqual(formatCurrency(160), '₹160.00');
      assert.strictEqual(formatCurrency(3360), '₹3,360.00');
      assert.strictEqual(formatCurrency(0), '₹0.00');
      assert.strictEqual(formatCurrency(1234567.89), '₹12,34,567.89');
    });

    it('formats foreign currency properly with currency code prefix', () => {
      assert.strictEqual(formatCurrency(3200, 'USD'), 'USD 3,200.00');
    });
  });

  describe('2. Tax Rate Calculation Helper (getItemTaxRate)', () => {
    it('returns IGST rate when igstRate is present', () => {
      const item = { igstRate: 5, taxableAmount: 3200, taxAmount: 160 };
      assert.strictEqual(getItemTaxRate(item), '5%');
    });

    it('returns combined CGST + SGST rate when intra-state sale', () => {
      const item = { cgstRate: 9, sgstRate: 9, taxableAmount: 1000, taxAmount: 180 };
      assert.strictEqual(getItemTaxRate(item), '18%');
    });

    it('calculates tax rate from taxAmount and taxableAmount when rates are absent', () => {
      const item = { taxableAmount: 3200, taxAmount: 160 };
      assert.strictEqual(getItemTaxRate(item), '5%');
    });

    it('falls back to explicit taxRate or gstRate strings if present', () => {
      assert.strictEqual(getItemTaxRate({ taxRate: 12 }), '12%');
      assert.strictEqual(getItemTaxRate({ gstRate: 18 }), '18%');
    });

    it('returns — when no tax information is available', () => {
      assert.strictEqual(getItemTaxRate({}), '—');
    });
  });

  describe('3. Outstanding Amount Helper (getQuotationOutstanding)', () => {
    it('uses row.outstandingAmount directly when present', () => {
      const row = { outstandingAmount: 500, totalAmount: 1000, paidAmount: 500 };
      assert.strictEqual(getQuotationOutstanding(row), 500);
    });

    it('calculates totalAmount - paidAmount when outstandingAmount is null', () => {
      const row = { totalAmount: 3360, paidAmount: 0 };
      assert.strictEqual(getQuotationOutstanding(row), 3360);
    });

    it('falls back to customer.outstandingBalance if totalAmount is missing', () => {
      const row = { customer: { outstandingBalance: 1250 } };
      assert.strictEqual(getQuotationOutstanding(row), 1250);
    });

    it('defaults to 0 if no fields exist', () => {
      assert.strictEqual(getQuotationOutstanding({}), 0);
    });
  });

  describe('4. Quotation Financial Summary Derivation (calculateQuotationSummary)', () => {
    it('correctly maps user quotation API response scenario (subtotal 3200, IGST 160, total 3360)', () => {
      const apiQuotation = {
        quotationNumber: 'QUO-2026-001',
        quotationDate: '2026-10-31',
        validUntil: '2026-11-30',
        subtotal: 3200,
        discountAmount: 0,
        taxAmount: 160,
        totalAmount: 3360,
        paidAmount: 0,
        items: [
          {
            itemName: 'Consulting Service',
            hsnSacMaster: { code: '998313' },
            quantity: 1,
            unitPrice: 3200,
            taxableAmount: 3200,
            igstRate: 5,
            igstAmount: 160,
            cgstAmount: 0,
            sgstAmount: 0,
            taxAmount: 160,
            totalAmount: 3360
          }
        ]
      };

      const summary = calculateQuotationSummary(apiQuotation);

      assert.strictEqual(summary.subtotal, 3200);
      assert.strictEqual(summary.taxableAmount, 3200);
      assert.strictEqual(summary.igst, 160);
      assert.strictEqual(summary.cgst, 0);
      assert.strictEqual(summary.sgst, 0);
      assert.strictEqual(summary.totalAmount, 3360);
      assert.strictEqual(summary.outstandingAmount, 3360);
      assert.strictEqual(summary.itemCount, 1);
    });

    it('derives totals when subtotal and taxes are only present on items', () => {
      const apiQuotation = {
        items: [
          { quantity: 2, unitPrice: 500, taxableAmount: 1000, cgstAmount: 90, sgstAmount: 90, totalAmount: 1180 }
        ]
      };

      const summary = calculateQuotationSummary(apiQuotation);
      assert.strictEqual(summary.subtotal, 1000);
      assert.strictEqual(summary.cgst, 90);
      assert.strictEqual(summary.sgst, 90);
      assert.strictEqual(summary.igst, 0);
      assert.strictEqual(summary.totalAmount, 1180);
    });
  });

  describe('5. Quotation Listing Table Mapping (QuotationsPage.jsx)', () => {
    it('maps Quote No, Customer, Date, Valid Until, Total Amount, Outstanding, and Status', () => {
      assert.ok(quotationsPageCode.includes("key: 'quotationNumber'"), 'Must contain quote number column');
      assert.ok(quotationsPageCode.includes("key: 'customerName'"), 'Must contain customer column');
      assert.ok(quotationsPageCode.includes("key: 'quotationDate'"), 'Must contain quotation date column');
      assert.ok(quotationsPageCode.includes("key: 'validUntil'"), 'Must contain valid until column');
      assert.ok(quotationsPageCode.includes("key: 'totalAmount'"), 'Must contain total amount column');
      assert.ok(quotationsPageCode.includes("key: 'outstanding'"), 'Must contain outstanding column');
      assert.ok(quotationsPageCode.includes("key: 'status'"), 'Must contain status column');
    });

    it('formats date columns with formatDate (MM/DD/YYYY)', () => {
      assert.ok(quotationsPageCode.includes('formatDate(row.quotationDate || val)'), 'quotationDate formatted with formatDate');
      assert.ok(quotationsPageCode.includes('formatDate(row.validUntil || val)'), 'validUntil formatted with formatDate');
    });

    it('formats amounts with formatCurrency and handles outstanding logic', () => {
      assert.ok(quotationsPageCode.includes('formatCurrency(row.totalAmount ?? val, row.quotationCurrency || row.currency)'), 'totalAmount formatted with formatCurrency');
      assert.ok(quotationsPageCode.includes('formatCurrency(getQuotationOutstanding(row), row.quotationCurrency || row.currency)'), 'outstanding formatted with getQuotationOutstanding');
    });

    it('supports API response shapes with content[] array directly and inside data envelope', () => {
      assert.ok(quotationsPageCode.includes('apiResponse?.data?.content || apiResponse?.content'), 'Extracts content[] array properly');
    });
  });

  describe('6. Expandable Quotation Details Mapping (QuotationOverview)', () => {
    it('uses calculateQuotationSummary to resolve financial totals and suppress zero taxes', () => {
      assert.ok(quotationsPageCode.includes('calculateQuotationSummary(quote)'), 'Uses calculateQuotationSummary');
    });

    it('includes all 7 Summary Cards: Grand Total, Outstanding, Payment %, Item Count, Days Outstanding, Aging Bucket, Currency', () => {
      assert.ok(quotationsPageCode.includes('Grand Total'), 'Has Grand Total card');
      assert.ok(quotationsPageCode.includes('Outstanding'), 'Has Outstanding card');
      assert.ok(quotationsPageCode.includes('Payment %'), 'Has Payment % card');
      assert.ok(quotationsPageCode.includes('Item Count'), 'Has Item Count card');
      assert.ok(quotationsPageCode.includes('Days Outstanding'), 'Has Days Outstanding card');
      assert.ok(quotationsPageCode.includes('Aging Bucket'), 'Has Aging Bucket card');
      assert.ok(quotationsPageCode.includes('Currency'), 'Has Currency card');
    });

    it('includes HSN Code column in items table mapping hsnSacMaster.code', () => {
      assert.ok(quotationsPageCode.includes('HSN Code'), 'Header has HSN Code');
      assert.ok(quotationsPageCode.includes('it.hsnSacMaster?.code'), 'Maps it.hsnSacMaster?.code');
    });

    it('conditionally suppresses zero-tax CGST and SGST and displays non-zero tax (IGST)', () => {
      assert.ok(quotationsPageCode.includes('cgst > 0 &&'), 'Suppresses CGST when 0');
      assert.ok(quotationsPageCode.includes('sgst > 0 &&'), 'Suppresses SGST when 0');
      assert.ok(quotationsPageCode.includes('igst > 0 &&'), 'Displays IGST when > 0');
    });

    it('maps Additional Details: Payment Terms, Delivery Terms, Warranty Terms, Created/Updated audit info', () => {
      assert.ok(quotationsPageCode.includes('Payment Terms'), 'Contains Payment Terms');
      assert.ok(quotationsPageCode.includes('Delivery Terms'), 'Contains Delivery Terms');
      assert.ok(quotationsPageCode.includes('Warranty Terms'), 'Contains Warranty Terms');
      assert.ok(quotationsPageCode.includes('Created By'), 'Contains Created By');
      assert.ok(quotationsPageCode.includes('Created Date'), 'Contains Created Date');
      assert.ok(quotationsPageCode.includes('Updated Date'), 'Contains Updated Date');
      assert.ok(quotationsPageCode.includes('Notes'), 'Contains Notes');
      assert.ok(quotationsPageCode.includes('Terms & Conditions'), 'Contains Terms & Conditions');
    });
  });

  describe('7. Standalone Quotation Details Page (QuotationDetails.jsx)', () => {
    it('uses calculateQuotationSummary for subtotal, totalAmount, taxableAmount, and totalTax', () => {
      assert.ok(quotationDetailsCode.includes('calculateQuotationSummary(quotation)'), 'Uses calculateQuotationSummary in QuotationDetails');
    });

    it('formats dates consistently with formatDate', () => {
      assert.ok(quotationDetailsCode.includes('formatDate(quotation.quotationDate)'), 'Formats quotationDate');
      assert.ok(quotationDetailsCode.includes('formatDate(quotation.validUntil)'), 'Formats validUntil');
    });

    it('maps line items HSN code and GST rate properly', () => {
      assert.ok(quotationDetailsCode.includes('item.hsnSacMaster?.code'), 'Maps line item hsnSacMaster.code');
      assert.ok(quotationDetailsCode.includes('getItemTaxRate(item)'), 'Maps line item tax rate with getItemTaxRate');
    });

    it('conditionally hides zero taxes in Tax Summary amount summary', () => {
      assert.ok(quotationDetailsCode.includes('cgst > 0 &&'), 'Suppresses zero CGST in details');
      assert.ok(quotationDetailsCode.includes('sgst > 0 &&'), 'Suppresses zero SGST in details');
      assert.ok(quotationDetailsCode.includes('igst > 0 &&'), 'Displays non-zero IGST in details');
    });
  });
});
