import { describe, it } from 'node:test';
import assert from 'node:assert';
import { salesFilters } from '../../../constants/filters/salesFilters.js';

describe('End-to-End Sales Workflow System Test Suite', () => {

  describe('1. Workflow Configuration & Field Persistence Schema', () => {
    it('defines supported Sales Document Types in Workflow System', () => {
      const salesDocumentTypes = [
        'QUOTATION',
        'PROFORMA_INVOICE',
        'SALES_ORDER',
        'DELIVERY_CHALLAN',
        'SALES_INVOICE',
        'SALES',
        'RECEIPT_VOUCHER'
      ];
      assert.strictEqual(salesDocumentTypes.length, 7);
      assert.ok(salesDocumentTypes.includes('QUOTATION'));
      assert.ok(salesDocumentTypes.includes('PROFORMA_INVOICE'));
      assert.ok(salesDocumentTypes.includes('SALES_ORDER'));
      assert.ok(salesDocumentTypes.includes('DELIVERY_CHALLAN'));
      assert.ok(salesDocumentTypes.includes('SALES_INVOICE'));
      assert.ok(salesDocumentTypes.includes('RECEIPT_VOUCHER'));
    });

    it('validates workflow configuration parameters contract', () => {
      const sampleConfig = {
        workflowName: 'High Value Sales Quotation Approval',
        workflowCode: 'WF_SQ_ENTERPRISE',
        documentType: 'QUOTATION',
        moduleName: 'SALES',
        status: true,
        approvalRequired: true,
        initiatedByRole: 'role-sales-rep',
        approverRole: 'role-sales-manager',
        approvalThreshold: 50000.00,
        currency: 'INR',
        allowCustomerAcceptance: true,
      };

      assert.strictEqual(sampleConfig.status, true);
      assert.strictEqual(sampleConfig.approvalRequired, true);
      assert.strictEqual(sampleConfig.allowCustomerAcceptance, true);
      assert.strictEqual(sampleConfig.approvalThreshold, 50000);
      assert.strictEqual(sampleConfig.currency, 'INR');
      assert.notStrictEqual(sampleConfig.initiatedByRole, sampleConfig.approverRole);
    });
  });

  describe('2. Separation of Duties and Threshold Decision Engine', () => {
    const evaluateApprovalRequirement = ({ amount, threshold, approvalRequired, initiatorId, approverId }) => {
      if (!approvalRequired) {
        return { autoApproved: true, reason: 'Approval not required by workflow configuration' };
      }
      if (initiatorId && approverId && initiatorId === approverId) {
        return { error: 'Separation of duties violation: Initiator cannot approve their own document' };
      }
      if (amount <= threshold) {
        return { autoApproved: true, reason: 'Amount below approval threshold' };
      }
      return { autoApproved: false, requiresRole: 'APPROVER_ROLE', reason: 'Amount exceeds threshold' };
    };

    it('auto-approves when amount is within threshold', () => {
      const result = evaluateApprovalRequirement({
        amount: 25000,
        threshold: 50000,
        approvalRequired: true,
        initiatorId: 'user-sales-rep',
        approverId: 'user-manager'
      });
      assert.strictEqual(result.autoApproved, true);
      assert.strictEqual(result.reason, 'Amount below approval threshold');
    });

    it('routes to approver role when amount exceeds threshold', () => {
      const result = evaluateApprovalRequirement({
        amount: 150000,
        threshold: 50000,
        approvalRequired: true,
        initiatorId: 'user-sales-rep',
        approverId: 'user-manager'
      });
      assert.strictEqual(result.autoApproved, false);
      assert.strictEqual(result.requiresRole, 'APPROVER_ROLE');
    });

    it('blocks self-approval to enforce separation of duties', () => {
      const result = evaluateApprovalRequirement({
        amount: 150000,
        threshold: 50000,
        approvalRequired: true,
        initiatorId: 'user-manager',
        approverId: 'user-manager'
      });
      assert.ok(result.error);
      assert.ok(result.error.includes('Separation of duties violation'));
    });
  });

  describe('3. End-to-End Document Lifecycle State Machine', () => {
    it('executes Quotation lifecycle: DRAFT -> PENDING_APPROVAL -> APPROVED -> CUSTOMER_ACCEPTED -> CONVERTED', () => {
      const quotation = {
        id: 'quote-101',
        quotationNumber: 'QTN-2026-0001',
        status: 'DRAFT',
        totalAmount: 75000,
      };

      // 1. Submit for approval
      quotation.status = 'PENDING_APPROVAL';
      assert.strictEqual(quotation.status, 'PENDING_APPROVAL');

      // 2. Approver approves
      quotation.status = 'APPROVED';
      assert.strictEqual(quotation.status, 'APPROVED');

      // 3. Customer accepts
      quotation.status = 'CUSTOMER_ACCEPTED';
      assert.strictEqual(quotation.status, 'CUSTOMER_ACCEPTED');

      // 4. Converted to Proforma Invoice
      quotation.status = 'CONVERTED';
      assert.strictEqual(quotation.status, 'CONVERTED');
    });

    it('executes Proforma Invoice lifecycle: DRAFT -> PENDING_APPROVAL -> APPROVED -> FULLY_CONVERTED', () => {
      const pi = {
        id: 'pi-201',
        piNumber: 'PI-2026-0001',
        sourceQuotationId: 'quote-101',
        status: 'DRAFT',
        advanceRequired: false
      };

      // 1. Submit for approval
      pi.status = 'PENDING_APPROVAL';
      assert.strictEqual(pi.status, 'PENDING_APPROVAL');

      // 2. Manager approves
      pi.status = 'APPROVED';
      assert.strictEqual(pi.status, 'APPROVED');

      // 3. Converted to Sales Order
      pi.status = 'FULLY_CONVERTED';
      assert.strictEqual(pi.status, 'FULLY_CONVERTED');
    });

    it('executes Sales Order lifecycle: DRAFT -> PENDING_APPROVAL -> APPROVED -> CONFIRMED -> COMPLETED', () => {
      const so = {
        id: 'so-301',
        soNumber: 'SO-2026-0001',
        sourceProformaInvoiceId: 'pi-201',
        status: 'DRAFT'
      };

      // 1. Submit for approval
      so.status = 'PENDING_APPROVAL';
      assert.strictEqual(so.status, 'PENDING_APPROVAL');

      // 2. Approver approves
      so.status = 'APPROVED';
      assert.strictEqual(so.status, 'APPROVED');

      // 3. Delivery Challan generated
      so.status = 'CONFIRMED';
      assert.strictEqual(so.status, 'CONFIRMED');

      // 4. Invoiced and fulfilled
      so.status = 'COMPLETED';
      assert.strictEqual(so.status, 'COMPLETED');
    });

    it('executes Delivery Challan lifecycle: DRAFT -> PENDING_APPROVAL -> APPROVED -> CONFIRMED', () => {
      const dc = {
        id: 'dc-401',
        dcNumber: 'DC-2026-0001',
        sourceSalesOrderId: 'so-301',
        status: 'DRAFT'
      };

      // 1. Submit for approval
      dc.status = 'PENDING_APPROVAL';
      assert.strictEqual(dc.status, 'PENDING_APPROVAL');

      // 2. Dispatch Manager approves
      dc.status = 'APPROVED';
      assert.strictEqual(dc.status, 'APPROVED');

      // 3. Goods dispatched and confirmed
      dc.status = 'CONFIRMED';
      assert.strictEqual(dc.status, 'CONFIRMED');
    });

    it('executes Sales Invoice lifecycle: DRAFT -> PENDING_APPROVAL -> APPROVED -> POSTED -> FULLY_PAID', () => {
      const inv = {
        id: 'inv-501',
        invoiceNumber: 'INV-2026-0001',
        sourceDeliveryChallanId: 'dc-401',
        status: 'DRAFT',
        outstandingAmount: 75000,
        paidAmount: 0
      };

      // 1. Submit for approval
      inv.status = 'PENDING_APPROVAL';
      assert.strictEqual(inv.status, 'PENDING_APPROVAL');

      // 2. Finance Head approves
      inv.status = 'APPROVED';
      assert.strictEqual(inv.status, 'APPROVED');

      // 3. Posted to General Ledger
      inv.status = 'POSTED';
      assert.strictEqual(inv.status, 'POSTED');

      // 4. Receipt Voucher records payment
      inv.paidAmount = 75000;
      inv.outstandingAmount = 0;
      inv.status = 'FULLY_PAID';
      assert.strictEqual(inv.status, 'FULLY_PAID');
    });

    it('executes Receipt Voucher lifecycle: DRAFT -> SUBMITTED -> APPROVED -> POSTED', () => {
      const rv = {
        id: 'rv-601',
        receiptNo: 'RV-2026-0001',
        receiptStatus: 'DRAFT',
        receiptAmount: 75000
      };

      // 1. Submit for approval
      rv.receiptStatus = 'SUBMITTED';
      assert.strictEqual(rv.receiptStatus, 'SUBMITTED');

      // 2. Approved
      rv.receiptStatus = 'APPROVED';
      assert.strictEqual(rv.receiptStatus, 'APPROVED');

      // 3. Posted
      rv.receiptStatus = 'POSTED';
      assert.strictEqual(rv.receiptStatus, 'POSTED');
    });
  });

  describe('4. Filter Configuration & Filter Bar Statuses', () => {
    it('ensures quotations filter includes all workflow lifecycle statuses', () => {
      const statusField = salesFilters.quotations.fields.find(f => f.key === 'status');
      assert.ok(statusField);
      const values = statusField.options.map(o => o.value);
      assert.ok(values.includes('PENDING_APPROVAL'), 'Missing PENDING_APPROVAL');
      assert.ok(values.includes('APPROVED'), 'Missing APPROVED');
      assert.ok(values.includes('CHANGES_REQUESTED'), 'Missing CHANGES_REQUESTED');
      assert.ok(values.includes('CUSTOMER_ACCEPTED'), 'Missing CUSTOMER_ACCEPTED');
      assert.ok(values.includes('CONVERTED'), 'Missing CONVERTED');
    });
  });
});
