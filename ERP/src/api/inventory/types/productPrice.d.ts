/**
 * Product Price Types & Interfaces
 * Matches backend Spring Boot DTOs:
 * - ProductPriceRequest (com.erp.inventory.modules.pricing.dto.request.ProductPriceRequest)
 * - ProductPriceResponse (com.erp.inventory.modules.pricing.dto.response.ProductPriceResponse)
 * - ProductPriceFilterRequest (com.erp.inventory.modules.pricing.dto.request.ProductPriceFilterRequest)
 * - PriceType (com.erp.inventory.modules.product.enums.PriceType)
 * - PriceStatus (com.erp.inventory.modules.product.enums.PriceStatus)
 */

export type PriceType = 
  | 'PURCHASE'
  | 'SELLING'
  | 'MRP'
  | 'WHOLESALE'
  | 'RETAIL'
  | 'STANDARD';

export type PriceStatus = 
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DRAFT'
  | 'EXPIRED';

export interface ProductPriceRequest {
  productId: string;           // UUID, required
  priceType: PriceType;        // Enum, required
  price: number;               // BigDecimal, >= 0, required
  currencyCode: string;        // ISO-4217, max 255 chars, required (e.g. "INR")
  minQuantity: number;         // BigDecimal, >= 0, required (default 1)
  effectiveFrom: string;       // LocalDateTime (ISO string, e.g. "2026-08-21T00:00:00")
  effectiveTo?: string | null; // LocalDateTime (ISO string or null for Indefinite)
  status: string;              // "ACTIVE" | "INACTIVE" | "DRAFT"
}

export interface ProductPriceResponse {
  id: string;                  // UUID
  companyId: string;           // UUID
  productId: string;           // UUID
  priceType: PriceType;
  price: number;               // Numeric amount
  currencyCode: string;        // e.g. "INR"
  minQuantity: number;         // Minimum quantity
  effectiveFrom: string;       // ISO timestamp
  effectiveTo: string | null;  // ISO timestamp or null
  status: string;              // Status string
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  isDeleted?: boolean;
  version?: number;
}

export interface ProductPriceFilterRequest {
  companyId?: string;
  productId?: string;
  priceType?: PriceType;
  status?: string;
  currencyCode?: string;
  searchKey?: string;
  minQuantity?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  ids?: string[];
}
