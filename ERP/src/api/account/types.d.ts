/**
 * TypeScript definitions for Supplier Quotations to Purchase Order conversion.
 */

export interface CreatePurchaseOrderResponse {
  success: boolean;
  message: string;
  data: PurchaseOrder;
  errors?: string[];
  status?: number;
  timestamp?: string;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  vendorGstin: string;
  poNumber: string;
  poDate: string;
  expectedDeliveryDate: string;
  currency: string;
  exchangeRate: number;
  supplierQuotationId: string;
  supplierQuotationNumber?: string;
  rfqId: string;
  rfqNumber?: string;
  purchaseRequisitionId: string;
  purchaseRequisitionNumber?: string;
  paymentTerms: string;
  deliveryTerms: string;
  termsAndConditions: string;
  notes: string;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  taxAmount: number;
  freightCharges: number;
  otherCharges: number;
  totalBeforeRoundOff: number;
  roundOff: number;
  totalAmount: number;
  status: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  itemId: string;
  itemName: string;
  description: string;
  hsnSacId: string;
  hsnSacCode: string;
  unit: string;
  itemType: string;
  orderedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessRate: number;
  cessAmount: number;
  taxAmount: number;
  totalAmount: number;
  warehouseId: string;
  locationId: string;
  notes: string;
}
