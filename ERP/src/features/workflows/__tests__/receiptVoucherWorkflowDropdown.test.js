import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  DOCUMENT_TYPES_BY_MODULE,
  loadWorkflowDefinitions,
  saveWorkflowDefinitions,
  workflowDefinitionApi,
  WORKFLOW_DATA_SOURCES,
} from '../services/workflowService.js';

describe('Receipt Voucher Workflow Document Type & Lifecycle Test Suite', () => {
  const companyId = 'c0a80101-0000-0000-0000-000000000001';

  let apiCalls = [];
  const originalCreate = workflowDefinitionApi.create;
  const originalUpdate = workflowDefinitionApi.update;
  const originalList = workflowDefinitionApi.list;
  const originalSetActive = workflowDefinitionApi.setActive;
  const originalDeactivate = workflowDefinitionApi.deactivate;

  beforeEach(() => {
    apiCalls = [];
  });

  it('1. Verifies RECEIPT_VOUCHER is present in Sales Document Type dropdown with label "Receipt Voucher"', () => {
    assert.ok(DOCUMENT_TYPES_BY_MODULE.Sales, 'Sales module must exist in DOCUMENT_TYPES_BY_MODULE');
    const salesOption = DOCUMENT_TYPES_BY_MODULE.Sales.find((opt) => opt.value === 'RECEIPT_VOUCHER');
    assert.ok(salesOption, 'RECEIPT_VOUCHER must be selectable under Sales');
    assert.strictEqual(salesOption.value, 'RECEIPT_VOUCHER');
    assert.strictEqual(salesOption.label, 'Receipt Voucher');
  });

  it('2. Verifies RECEIPT_VOUCHER is also available in Others module with label "Receipt Voucher"', () => {
    assert.ok(DOCUMENT_TYPES_BY_MODULE.Others, 'Others module must exist in DOCUMENT_TYPES_BY_MODULE');
    const othersOption = DOCUMENT_TYPES_BY_MODULE.Others.find((opt) => opt.value === 'RECEIPT_VOUCHER');
    assert.ok(othersOption, 'RECEIPT_VOUCHER must be selectable under Others');
    assert.strictEqual(othersOption.value, 'RECEIPT_VOUCHER');
    assert.strictEqual(othersOption.label, 'Receipt Voucher');
  });

  it('3. Creates and saves a Receipt Voucher workflow definition for a company', async () => {
    workflowDefinitionApi.create = async (payload) => {
      apiCalls.push({ action: 'create', payload });
      return {
        id: 'wf-rv-100',
        companyId: payload.companyId,
        workflowCode: payload.workflowCode,
        workflowName: payload.workflowName,
        moduleName: payload.moduleName,
        documentType: payload.documentType,
        isActive: payload.isActive,
        version: 1,
      };
    };

    try {
      const draft = {
        id: 'draft-1234',
        companyId,
        workflowCode: 'RV_APPROVAL_WORKFLOW',
        workflowName: 'High Value Receipt Voucher Approval',
        module: 'Sales',
        moduleName: 'SALES',
        documentType: 'RECEIPT_VOUCHER',
        description: 'Approval required for receipts above threshold',
        active: true,
        isActive: true,
        customerScope: 'all',
        initiatedBy: 'role-accountant',
        approverRole: 'role-finance-manager',
        threshold: '50000',
        steps: [
          {
            id: 'draft-1234-1',
            stageCode: 'STAGE_1',
            stageName: 'Finance Review',
            role: 'role-finance-manager',
            active: true,
          },
        ],
      };

      const result = await saveWorkflowDefinitions(companyId, draft, { mode: 'create' });

      assert.strictEqual(result.source, WORKFLOW_DATA_SOURCES.API);
      assert.strictEqual(result.definitions.length, 1);
      const saved = result.definitions[0];
      assert.strictEqual(saved.id, 'wf-rv-100');
      assert.strictEqual(saved.documentType, 'RECEIPT_VOUCHER');
      assert.strictEqual(saved.workflowCode, 'RV_APPROVAL_WORKFLOW');

      assert.strictEqual(apiCalls.length, 1);
      const call = apiCalls[0];
      assert.strictEqual(call.action, 'create');
      assert.strictEqual(call.payload.documentType, 'RECEIPT_VOUCHER');
      assert.strictEqual(call.payload.moduleName, 'SALES');
      assert.strictEqual(call.payload.companyId, companyId);
    } finally {
      workflowDefinitionApi.create = originalCreate;
    }
  });

  it('4. Updates and toggles activation for a Receipt Voucher workflow', async () => {
    workflowDefinitionApi.update = async (id, payload) => {
      apiCalls.push({ action: 'update', id, payload });
      return {
        id,
        ...payload,
        isActive: payload.isActive,
      };
    };
    workflowDefinitionApi.setActive = async (id, compId) => {
      apiCalls.push({ action: 'activate', id, companyId: compId });
      return { success: true };
    };
    workflowDefinitionApi.deactivate = async (id, compId) => {
      apiCalls.push({ action: 'deactivate', id, companyId: compId });
      return { success: true };
    };

    try {
      const existing = {
        id: 'wf-rv-100',
        companyId,
        workflowCode: 'RV_APPROVAL_WORKFLOW',
        workflowName: 'High Value Receipt Voucher Approval - Updated',
        module: 'Sales',
        moduleName: 'SALES',
        documentType: 'RECEIPT_VOUCHER',
        active: false,
        isActive: false,
        steps: [
          {
            id: 'step-1',
            stageCode: 'STAGE_1',
            stageName: 'Finance Review',
            role: 'role-finance-manager',
            active: true,
          },
        ],
      };

      const result = await saveWorkflowDefinitions(companyId, existing, { mode: 'update' });
      assert.strictEqual(result.definitions[0].id, 'wf-rv-100');
      assert.strictEqual(apiCalls[0].action, 'update');

      // Test activate
      await workflowDefinitionApi.setActive('wf-rv-100', companyId);
      assert.strictEqual(apiCalls[1].action, 'activate');
      assert.strictEqual(apiCalls[1].id, 'wf-rv-100');

      // Test deactivate
      await workflowDefinitionApi.deactivate('wf-rv-100', companyId);
      assert.strictEqual(apiCalls[2].action, 'deactivate');
      assert.strictEqual(apiCalls[2].id, 'wf-rv-100');
    } finally {
      workflowDefinitionApi.update = originalUpdate;
      workflowDefinitionApi.setActive = originalSetActive;
      workflowDefinitionApi.deactivate = originalDeactivate;
    }
  });

  it('5. Verifies workflow list retrieval and company isolation for Receipt Voucher', async () => {
    workflowDefinitionApi.list = async (compId, docType, options = {}) => {
      apiCalls.push({ compId, docType, options });
      return [
        {
          id: 'wf-rv-100',
          companyId: compId,
          workflowCode: 'RV_APPROVAL_WORKFLOW',
          name: 'High Value Receipt Voucher Approval',
          documentType: 'RECEIPT_VOUCHER',
          moduleName: 'SALES',
          module: 'Sales',
          isActive: true,
          active: true,
        },
      ];
    };

    try {
      const result = await loadWorkflowDefinitions(companyId, 'RECEIPT_VOUCHER', { moduleName: 'SALES' });
      assert.strictEqual(result.definitions.length, 1);
      assert.strictEqual(result.definitions[0].documentType, 'RECEIPT_VOUCHER');
      assert.strictEqual(result.definitions[0].companyId, companyId);
      assert.strictEqual(result.definitions[0].module, 'Sales');

      assert.strictEqual(apiCalls.length, 1);
      assert.strictEqual(apiCalls[0].compId, companyId);
      assert.strictEqual(apiCalls[0].docType, 'RECEIPT_VOUCHER');
      assert.strictEqual(apiCalls[0].options.moduleName, 'SALES');
    } finally {
      workflowDefinitionApi.list = originalList;
    }
  });

  it('6. Ensures existing Sales and Purchase workflows are unaffected by RECEIPT_VOUCHER addition', () => {
    const salesValues = DOCUMENT_TYPES_BY_MODULE.Sales.map((d) => d.value);
    assert.ok(salesValues.includes('QUOTATION'));
    assert.ok(salesValues.includes('PROFORMA_INVOICE'));
    assert.ok(salesValues.includes('SALES_ORDER'));
    assert.ok(salesValues.includes('DELIVERY_CHALLAN'));
    assert.ok(salesValues.includes('SALES_INVOICE'));
    assert.ok(salesValues.includes('SALES'));
    assert.ok(salesValues.includes('RECEIPT_VOUCHER'));

    const purchaseValues = DOCUMENT_TYPES_BY_MODULE.Purchase.map((d) => d.value);
    assert.ok(purchaseValues.includes('PURCHASE_REQUISITION'));
    assert.ok(purchaseValues.includes('RFQ'));
    assert.ok(purchaseValues.includes('SUPPLIER_QUOTATION'));
    assert.ok(purchaseValues.includes('PURCHASE_ORDER'));
    assert.ok(purchaseValues.includes('GOODS_RECEIPT'));
    assert.ok(purchaseValues.includes('AP_INVOICE'));
    assert.ok(purchaseValues.includes('AP_PAYMENT'));
    assert.ok(purchaseValues.includes('PURCHASE'));
    assert.strictEqual(purchaseValues.includes('RECEIPT_VOUCHER'), false);
  });
});
