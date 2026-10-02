/**
 * @fileoverview Validation and payload transformation utilities for
 * Delivery Challan generation from Sales Order.
 */

/**
 * Validates whether a given string is a valid UUID format (v1-v5).
 * Rejects empty strings, placeholders, and malformed strings.
 *
 * @param {any} val
 * @returns {boolean}
 */
export function isUuid(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  // Reject zero/empty placeholder UUID
  if (trimmed === '00000000-0000-0000-0000-000000000000') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
}

/**
 * Filter warehouse locations belonging to the given warehouse ID.
 *
 * @param {Array} locations
 * @param {string} warehouseId
 * @returns {Array}
 */
export function filterLocationsByWarehouse(locations, warehouseId) {
  if (!Array.isArray(locations) || !warehouseId) return [];
  return locations.filter(loc => loc && (loc.warehouseId === warehouseId || !loc.warehouseId));
}

/**
 * Validates Delivery Challan submission inputs according to business and API rules.
 *
 * @param {Object} params
 * @param {string} params.warehouseId - Selected warehouse ID
 * @param {Array} params.items - Dispatch item rows
 * @param {Array} [params.availableLocations=[]] - Locations available for the selected warehouse
 * @param {boolean} [params.isStatusConfirmed=true] - Whether the Sales Order is CONFIRMED
 * @returns {{ isValid: boolean, errors: string[], fieldErrors: Object }}
 */
export function validateDeliveryChallanSubmission({
  warehouseId,
  items = [],
  availableLocations = [],
  isStatusConfirmed = true,
}) {
  const errors = [];
  const fieldErrors = {
    warehouseId: null,
    items: {},
  };

  // 1. Order Status validation
  if (!isStatusConfirmed) {
    errors.push('Only CONFIRMED Sales Orders can generate Delivery Challans.');
  }

  // 2. Warehouse validation
  if (!warehouseId || !isUuid(warehouseId)) {
    const msg = 'Warehouse selection is mandatory.';
    errors.push(msg);
    fieldErrors.warehouseId = msg;
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('No items available for dispatch.');
    return { isValid: false, errors, fieldErrors };
  }

  // 3. Dispatch items validation
  let positiveDispatches = 0;
  const validLocationIds = new Set(availableLocations.map(l => l.id));
  const requiresLocation = availableLocations.length > 0;

  items.forEach((item, index) => {
    const key = item.sourceSalesOrderItemId || index;
    const qty = Number(item.quantityToDispatch) || 0;
    const available = Number(item.available) || 0;

    const rowErrors = [];

    if (qty < 0) {
      rowErrors.push('Dispatch quantity cannot be negative.');
    }

    if (available <= 0 && qty > 0) {
      rowErrors.push('This item has already been fully dispatched or reserved.');
    } else if (qty > available) {
      rowErrors.push(`Dispatch quantity (${qty}) exceeds remaining open quantity (${available}).`);
    }

    if (item.availableStock !== undefined && item.availableStock !== null && qty > Number(item.availableStock)) {
      rowErrors.push(`Dispatch quantity (${qty}) exceeds available stock (${item.availableStock}).`);
    }

    if (qty > 0) {
      positiveDispatches++;

      // Location validation if warehouse has locations
      const locId = item.warehouseLocationId || item.locationId;
      if (requiresLocation) {
        if (!locId) {
          rowErrors.push('Warehouse location is required for this dispatch item.');
        } else if (!validLocationIds.has(locId)) {
          rowErrors.push('Selected warehouse location does not belong to the selected warehouse.');
        }
      }
    }

    if (rowErrors.length > 0) {
      fieldErrors.items[key] = rowErrors;
      errors.push(...rowErrors);
    }
  });

  if (positiveDispatches === 0) {
    errors.push('At least one item must have a dispatch quantity greater than zero.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

/**
 * Builds the exact API payload contract for Delivery Challan creation from Sales Order.
 *
 * Contract:
 * POST /api/account/v1/delivery-challans/from-sales-order?companyId={companyId}
 * {
 *   "data": {
 *     "sourceSalesOrderId": "UUID",
 *     "warehouseId": "UUID",
 *     "items": [
 *       {
 *         "sourceSalesOrderItemId": "UUID",
 *         "warehouseLocationId": "UUID",
 *         "locationId": "UUID",
 *         "quantityToDispatch": 1
 *       }
 *     ]
 *   }
 * }
 *
 * @param {Object} params
 * @param {string} params.sourceSalesOrderId
 * @param {string} params.warehouseId
 * @param {Array} params.items
 * @param {string} [params.companyId]
 * @returns {{ data: { sourceSalesOrderId: string, warehouseId: string, items: Array }, companyId?: string }}
 */
export function buildDeliveryChallanPayload({
  sourceSalesOrderId,
  warehouseId,
  items = [],
  companyId,
}) {
  if (!isUuid(sourceSalesOrderId)) {
    throw new Error(`Invalid sourceSalesOrderId: ${sourceSalesOrderId}`);
  }
  if (!isUuid(warehouseId)) {
    throw new Error(`Invalid warehouseId: ${warehouseId}`);
  }

  const payloadItems = items
    .filter(it => (Number(it.quantityToDispatch) || 0) > 0)
    .map(it => {
      if (!isUuid(it.sourceSalesOrderItemId)) {
        throw new Error(`Invalid sourceSalesOrderItemId: ${it.sourceSalesOrderItemId}`);
      }

      const itemPayload = {
        sourceSalesOrderItemId: it.sourceSalesOrderItemId,
        quantityToDispatch: Number(it.quantityToDispatch),
      };

      const locId = it.warehouseLocationId || it.locationId;
      // Only attach warehouseLocationId / locationId if valid UUID is present
      if (locId && isUuid(locId)) {
        itemPayload.warehouseLocationId = locId;
        itemPayload.locationId = locId;
      }

      return itemPayload;
    });

  if (payloadItems.length === 0) {
    throw new Error('Cannot build payload without at least one positive dispatch item.');
  }

  const result = {
    data: {
      sourceSalesOrderId,
      warehouseId,
      items: payloadItems,
    },
  };

  if (companyId) {
    result.companyId = companyId;
  }

  return result;
}
