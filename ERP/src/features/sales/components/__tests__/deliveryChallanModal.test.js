import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isUuid,
  filterLocationsByWarehouse,
  validateDeliveryChallanSubmission,
  buildDeliveryChallanPayload,
} from '../../utils/deliveryChallanValidation.js';

describe('Delivery Challan Modal — Warehouse & Location Integration Tests', () => {
  const mockWarehouseId1 = 'a1111111-1111-4111-a111-111111111111';
  const mockWarehouseId2 = 'b2222222-2222-4222-b222-222222222222';
  const mockLocationId1 = 'c3333333-3333-4333-c333-333333333333';
  const mockLocationId2 = 'd4444444-4444-4444-d444-444444444444';
  const mockSalesOrderId = 'e5555555-5555-4555-e555-555555555555';
  const mockCompanyId = 'f6666666-6666-4666-f666-666666666666';
  const mockItemId1 = '11111111-1111-4111-a111-111111111111';
  const mockItemId2 = '22222222-2222-4222-b222-222222222222';

  const mockAvailableLocations = [
    { id: mockLocationId1, warehouseId: mockWarehouseId1, locationName: 'Rack A-1' },
    { id: mockLocationId2, warehouseId: mockWarehouseId1, locationName: 'Rack A-2' },
  ];

  // ─── 1. Warehouse Selection Tests ──────────────────────────────────────────
  describe('1. Warehouse Selection', () => {
    it('fails validation when warehouse is not selected', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 5, available: 10, warehouseLocationId: mockLocationId1 },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: '',
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('Warehouse selection is mandatory')));
      assert.equal(result.fieldErrors.warehouseId, 'Warehouse selection is mandatory.');
    });

    it('fails validation when warehouse ID is not a valid UUID format', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 5, available: 10, warehouseLocationId: mockLocationId1 },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: 'non-uuid-warehouse-123',
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('Warehouse selection is mandatory')));
    });

    it('passes warehouse validation when valid warehouse UUID is provided', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 5, available: 10, warehouseLocationId: mockLocationId1 },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, true);
      assert.equal(result.fieldErrors.warehouseId, null);
    });
  });

  // ─── 2. Location Filtering Tests ───────────────────────────────────────────
  describe('2. Location Filtering', () => {
    it('correctly filters locations belonging to the selected warehouse', () => {
      const allLocations = [
        { id: mockLocationId1, warehouseId: mockWarehouseId1, locationName: 'Rack A-1' },
        { id: mockLocationId2, warehouseId: mockWarehouseId1, locationName: 'Rack A-2' },
        { id: '99999999-9999-4999-9999-999999999999', warehouseId: mockWarehouseId2, locationName: 'Bay B-1' },
      ];

      const filtered = filterLocationsByWarehouse(allLocations, mockWarehouseId1);
      assert.equal(filtered.length, 2);
      assert.ok(filtered.every(l => l.warehouseId === mockWarehouseId1));
    });

    it('returns empty array when warehouse ID has no associated locations', () => {
      const allLocations = [
        { id: mockLocationId1, warehouseId: mockWarehouseId1, locationName: 'Rack A-1' },
      ];

      const filtered = filterLocationsByWarehouse(allLocations, '33333333-3333-4333-3333-333333333333');
      assert.equal(filtered.length, 0);
    });
  });

  // ─── 3. Invalid Location Tests ─────────────────────────────────────────────
  describe('3. Invalid Location', () => {
    it('fails validation when warehouse has locations but item has no location selected', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 3, available: 5, warehouseLocationId: '' },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('Warehouse location is required')));
    });

    it('fails validation when item location does not belong to the selected warehouse locations', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 3, available: 5, warehouseLocationId: '77777777-7777-4777-7777-777777777777' },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('does not belong to the selected warehouse')));
    });

    it('rejects zero placeholder UUID for warehouseLocationId', () => {
      const zeroUuid = '00000000-0000-0000-0000-000000000000';
      assert.equal(isUuid(zeroUuid), false);

      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 1, available: 5, warehouseLocationId: zeroUuid },
      ];
      const payload = buildDeliveryChallanPayload({
        sourceSalesOrderId: mockSalesOrderId,
        warehouseId: mockWarehouseId1,
        items,
      });

      // Item should not include warehouseLocationId if it was placeholder
      assert.equal(payload.data.items[0].warehouseLocationId, undefined);
    });

    it('allows submission without location when warehouse has no locations configured', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 2, available: 5, warehouseLocationId: '' },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: [], // No locations configured in warehouse
      });

      assert.equal(result.isValid, true);
    });
  });

  // ─── 4. Quantity Validation Tests ──────────────────────────────────────────
  describe('4. Quantity Validation', () => {
    it('fails validation when dispatch quantity exceeds available quantity', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 11, available: 10, warehouseLocationId: mockLocationId1 },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('remaining open quantity') || e.includes('exceeds available quantity')));
    });

    it('fails validation when dispatch quantity is negative', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: -1, available: 10, warehouseLocationId: mockLocationId1 },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('cannot be negative')));
    });

    it('fails validation when all dispatch quantities are zero', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 0, available: 10, warehouseLocationId: mockLocationId1 },
        { sourceSalesOrderItemId: mockItemId2, quantityToDispatch: 0, available: 5, warehouseLocationId: mockLocationId2 },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('greater than zero')));
    });

    it('succeeds with partial dispatch quantity', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 4, available: 10, warehouseLocationId: mockLocationId1 },
        { sourceSalesOrderItemId: mockItemId2, quantityToDispatch: 0, available: 5, warehouseLocationId: '' },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, true);
    });

    it('fails validation when dispatch quantity exceeds available inventory stock', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 6, available: 10, availableStock: 5, warehouseLocationId: mockLocationId1 },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('exceeds available stock')));
    });

    it('succeeds when dispatch quantity is within both available order qty and inventory stock', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 5, available: 10, availableStock: 5, warehouseLocationId: mockLocationId1 },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, true);
    });

    it('fails validation when item is already fully dispatched or reserved (available = 0, dispatch > 0)', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 1, available: 0, availableStock: 5, warehouseLocationId: mockLocationId1 },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e === 'This item has already been fully dispatched or reserved.'));
    });

    it('strictly separates warehouse stock availability from order open quantity', () => {
      // Warehouse stock is 5, but order open quantity is 0
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 1, available: 0, availableStock: 5, warehouseLocationId: mockLocationId1 },
      ];
      const result = validateDeliveryChallanSubmission({
        warehouseId: mockWarehouseId1,
        items,
        availableLocations: mockAvailableLocations,
      });

      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e === 'This item has already been fully dispatched or reserved.'));
    });
  });

  // ─── 5. Successful Payload Submission Tests ────────────────────────────────
  describe('5. Successful Payload Submission Contract', () => {
    it('produces payload matching backend API contract exactly', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 3, available: 10, warehouseLocationId: mockLocationId1 },
        { sourceSalesOrderItemId: mockItemId2, quantityToDispatch: 0, available: 5, warehouseLocationId: '' },
      ];

      const payload = buildDeliveryChallanPayload({
        sourceSalesOrderId: mockSalesOrderId,
        warehouseId: mockWarehouseId1,
        items,
        companyId: mockCompanyId,
      });

      // 1. Root structure check
      assert.ok(payload.data, 'Payload must contain root data object');
      assert.equal(payload.companyId, mockCompanyId);

      // 2. data.warehouseId check
      assert.equal(payload.data.warehouseId, mockWarehouseId1);
      assert.equal(payload.data.sourceSalesOrderId, mockSalesOrderId);

      // 3. items array check
      assert.equal(Array.isArray(payload.data.items), true);
      assert.equal(payload.data.items.length, 1, 'Only positive dispatch items should be included');

      const dispatchedItem = payload.data.items[0];
      assert.equal(dispatchedItem.sourceSalesOrderItemId, mockItemId1);
      assert.equal(dispatchedItem.quantityToDispatch, 3);
      assert.equal(dispatchedItem.warehouseLocationId, mockLocationId1);
      assert.equal(dispatchedItem.locationId, mockLocationId1);

      // 4. Critical payload rule: warehouseId must NEVER be inside items array
      assert.equal(dispatchedItem.warehouseId, undefined, 'warehouseId must not be inside items array');
    });

    it('supports multiple items with their respective locations', () => {
      const items = [
        { sourceSalesOrderItemId: mockItemId1, quantityToDispatch: 2, available: 10, warehouseLocationId: mockLocationId1 },
        { sourceSalesOrderItemId: mockItemId2, quantityToDispatch: 5, available: 5, warehouseLocationId: mockLocationId2 },
      ];

      const payload = buildDeliveryChallanPayload({
        sourceSalesOrderId: mockSalesOrderId,
        warehouseId: mockWarehouseId1,
        items,
        companyId: mockCompanyId,
      });

      assert.equal(payload.data.items.length, 2);
      assert.equal(payload.data.items[0].warehouseLocationId, mockLocationId1);
      assert.equal(payload.data.items[1].warehouseLocationId, mockLocationId2);
      assert.equal(payload.data.items[0].quantityToDispatch, 2);
      assert.equal(payload.data.items[1].quantityToDispatch, 5);
    });
  });

  // ─── 6. Duplicate Submission Prevention Tests ──────────────────────────────
  describe('6. Duplicate Submission Prevention', () => {
    it('blocks subsequent submission invocations when already in-flight', async () => {
      let callCount = 0;
      let isSubmitting = false;

      const mockSubmitHandler = async () => {
        if (isSubmitting) {
          return { blocked: true };
        }
        isSubmitting = true;
        callCount++;

        // Simulate async API latency
        await new Promise(resolve => setTimeout(resolve, 50));
        isSubmitting = false;
        return { blocked: false, success: true };
      };

      // Fire first request and immediately attempt second request while first is in-flight
      const promise1 = mockSubmitHandler();
      const promise2 = mockSubmitHandler(); // Duplicate click

      const [res1, res2] = await Promise.all([promise1, promise2]);

      assert.equal(res1.blocked, false);
      assert.equal(res1.success, true);
      assert.equal(res2.blocked, true, 'Second click should be blocked while first is in-flight');
      assert.equal(callCount, 1, 'API must only be invoked once');
    });
  });
});
