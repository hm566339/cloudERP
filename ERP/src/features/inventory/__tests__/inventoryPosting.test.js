import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getSerialNumber, getSerialNumberRange } from '../../../utils/serialNumberHelper.js';

describe('Inventory Posting & Dashboard Standardization Suite', () => {
  const mockStock = [
    {
      id: 'stk-1',
      productId: 'p-1',
      productName: 'Cold Rolled Steel Sheet 1mm',
      sku: '193b5ef2',
      warehouseName: 'Central Logistics Hub - Bhiwandi',
      quantity: 198,
      inStock: 198,
      availableQuantity: 198,
      reorderLevel: 20,
    },
    {
      id: 'stk-2',
      productId: 'p-2',
      productName: 'Cold Rolled Steel Sheet 1mm',
      sku: '4dfea61d',
      warehouseName: 'North Distribution Center - Manesar',
      quantity: 198,
      inStock: 198,
      availableQuantity: 198,
      reorderLevel: 20,
    },
    {
      id: 'stk-3',
      productId: 'p-3',
      productName: 'Copper Wire 2.5mm',
      sku: 'cp-25',
      warehouse: 'Primary Warehouse A',
      quantity: 5,
      inStock: 5,
      availableQuantity: 5,
      reorderLevel: 10, // Low stock
    },
    {
      id: 'stk-4',
      productId: 'p-4',
      productName: 'Aluminum Ingot',
      sku: 'al-ingot',
      warehouseId: 'Warehouse B Depot',
      quantity: 0,
      inStock: 0,
      availableQuantity: 0,
      reorderLevel: 5, // Out of stock
    },
  ];

  it('1. Warehouse options extract dynamically from stock items without clipping', () => {
    const list = [{ value: 'all', label: 'All Warehouses' }];
    const known = new Set();

    mockStock.forEach((item) => {
      const name = item.warehouseName || item.warehouse || item.warehouseId;
      if (name && !known.has(name)) {
        known.add(name);
        list.push({ value: name, label: name });
      }
    });

    ['Primary Warehouse A', 'Warehouse B Depot'].forEach((w) => {
      if (!known.has(w)) {
        known.add(w);
        list.push({ value: w, label: w });
      }
    });

    assert.strictEqual(list.length, 5, 'Should contain all unique warehouses + All Warehouses option');
    assert.ok(list.some((w) => w.value === 'all'));
    assert.ok(list.some((w) => w.value === 'Central Logistics Hub - Bhiwandi'));
    assert.ok(list.some((w) => w.value === 'North Distribution Center - Manesar'));
    assert.ok(list.some((w) => w.value === 'Primary Warehouse A'));
    assert.ok(list.some((w) => w.value === 'Warehouse B Depot'));
  });

  it('2. Warehouse filtering correctly filters across warehouseName, warehouse, and warehouseId', () => {
    const filterStock = (activeWarehouse) => {
      if (activeWarehouse === 'all') return mockStock;
      return mockStock.filter((item) => {
        const w = item.warehouseName || item.warehouse || item.warehouseId;
        return w === activeWarehouse;
      });
    };

    assert.strictEqual(filterStock('all').length, 4);
    assert.strictEqual(filterStock('Central Logistics Hub - Bhiwandi').length, 1);
    assert.strictEqual(filterStock('Primary Warehouse A').length, 1);
    assert.strictEqual(filterStock('Nonexistent Warehouse').length, 0);
  });

  it('3. Metric card normalization avoids single-card empty space layout', () => {
    const computeMetricCards = (rawMetrics, stock) => {
      const lowStockItems = stock.filter((i) => {
        const qty = i.inStock ?? i.availableQuantity ?? i.quantity ?? 0;
        const min = i.reorderLevel ?? i.reorderPoint ?? 10;
        return qty <= min;
      });

      const inStockCount = stock.filter((s) => {
        const qty = s.inStock ?? s.availableQuantity ?? s.quantity ?? 0;
        const min = s.reorderLevel ?? s.reorderPoint ?? 10;
        return qty > min;
      }).length;

      const outOfStockCount = stock.filter((s) => (s.inStock ?? s.availableQuantity ?? s.quantity ?? 0) === 0).length;

      const s = new Set();
      stock.forEach((i) => {
        const w = i.warehouseName || i.warehouse || i.warehouseId;
        if (w) s.add(w);
      });
      const uniqueWarehousesCount = s.size;

      if (rawMetrics.length === 0) {
        return [
          { label: 'Total Items', value: stock.length },
          { label: 'In Stock', value: inStockCount },
          { label: 'Low Stock', value: lowStockItems.length },
          { label: 'Out of Stock', value: outOfStockCount },
        ];
      }
      if (rawMetrics.length === 1) {
        return [
          rawMetrics[0],
          { label: 'In Stock Items', value: inStockCount },
          { label: 'Low Stock Items', value: lowStockItems.length },
          { label: 'Active Warehouses', value: uniqueWarehousesCount || 1 },
        ];
      }
      return rawMetrics;
    };

    // Case 1: Backend only provided single metric "MY PRODUCTS: 5"
    const singleBackendMetric = [{ label: 'MY PRODUCTS', value: 5, icon: 'package' }];
    const cards = computeMetricCards(singleBackendMetric, mockStock);
    assert.strictEqual(cards.length, 4, 'Should fill all 4 grid columns to avoid layout imbalance');
    assert.strictEqual(cards[0].label, 'MY PRODUCTS');
    assert.strictEqual(cards[0].value, 5);
    assert.strictEqual(cards[1].label, 'In Stock Items');
    assert.strictEqual(cards[1].value, 2);
    assert.strictEqual(cards[2].label, 'Low Stock Items');
    assert.strictEqual(cards[2].value, 2);
    assert.strictEqual(cards[3].label, 'Active Warehouses');
    assert.strictEqual(cards[3].value, 4);

    // Case 2: Multi-metric backend response
    const multiBackendMetrics = [
      { label: 'Metric A', value: 10 },
      { label: 'Metric B', value: 20 },
      { label: 'Metric C', value: 30 },
      { label: 'Metric D', value: 40 },
    ];
    const multiCards = computeMetricCards(multiBackendMetrics, mockStock);
    assert.strictEqual(multiCards.length, 4);
    assert.strictEqual(multiCards[0].label, 'Metric A');
  });

  it('4. Pagination calculations match Account Groups DataTablePagination contract', () => {
    const page = 0;
    const pageSize = 10;
    const total = mockStock.length; // 4
    const { from, to } = getSerialNumberRange({ page, pageSize, total, pageBase: 0 });

    assert.strictEqual(from, 1);
    assert.strictEqual(to, 4);

    // Row serial numbers
    assert.strictEqual(getSerialNumber({ page: 0, pageSize: 10, rowIndex: 0, pageBase: 0 }), 1);
    assert.strictEqual(getSerialNumber({ page: 0, pageSize: 10, rowIndex: 1, pageBase: 0 }), 2);
    assert.strictEqual(getSerialNumber({ page: 1, pageSize: 2, rowIndex: 0, pageBase: 0 }), 3);
  });
});
