/**
 * @fileoverview Delivery Challan TypeScript interfaces and types.
 * Defines models for Sales Order to Delivery Challan conversion,
 * warehouse and warehouse location structures, payload contracts, and modal props.
 */

export interface WarehouseOption {
  id: string;
  warehouseCode?: string;
  warehouseName?: string;
  name?: string;
  warehouseType?: string;
  status?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
}

export interface WarehouseLocationOption {
  id: string;
  warehouseId: string;
  locationCode?: string;
  locationName?: string;
  name?: string;
  isActive?: boolean;
}

export interface DispatchItemRow {
  sourceSalesOrderItemId: string;
  itemName: string;
  description?: string;
  ordered: number;
  delivered: number;
  available: number;
  quantityToDispatch: number | string;
  warehouseLocationId?: string;
}

/**
 * Expected backend request payload item for Delivery Challan conversion.
 */
export interface DeliveryChallanFromSoItemRequest {
  sourceSalesOrderItemId: string;
  warehouseLocationId?: string;
  quantityToDispatch: number;
}

/**
 * Expected backend request body for Delivery Challan conversion from Sales Order.
 * POST /api/account/v1/delivery-challans/from-sales-order?companyId={companyId}
 */
export interface DeliveryChallanFromSoPayload {
  data: {
    sourceSalesOrderId: string;
    warehouseId: string;
    items: DeliveryChallanFromSoItemRequest[];
  };
}

export interface DeliveryChallanMutationArg {
  data: DeliveryChallanFromSoPayload | DeliveryChallanFromSoPayload['data'];
  companyId: string;
}

export interface DeliveryChallanFromSoModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  salesOrder?: {
    id: string;
    soNumber?: string;
    orderNumber?: string;
    customerName?: string;
    customer?: {
      name?: string;
      customerName?: string;
    };
    soDate?: string;
    orderDate?: string;
    date?: string;
    status?: string;
    warehouseId?: string;
    items?: Array<{
      id: string;
      itemName?: string;
      productName?: string;
      name?: string;
      description?: string;
      quantity?: number;
      orderedQuantity?: number;
      deliveredQuantity?: number;
      dispatchedQuantity?: number;
      item?: {
        name?: string;
      };
    }>;
  };
  receipt?: {
    id: string;
    receiptNo?: string;
    receiptDate?: string;
    date?: string;
    customerName?: string;
    customer?: {
      name?: string;
      customerName?: string;
    };
    receiptStatus?: string;
    status?: string;
    allocations?: Array<{
      salesInvoiceId?: string;
      invoiceNumber?: string;
      allocatedAmount?: number;
      invoiceAmount?: number;
    }>;
  };
  onSuccess?: (result: any) => void;
}

