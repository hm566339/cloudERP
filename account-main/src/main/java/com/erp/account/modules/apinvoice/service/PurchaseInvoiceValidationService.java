package com.erp.account.modules.apinvoice.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.enums.GstTreatment;
import com.erp.account.enums.ItcEligibility;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.PurchaseDocumentType;
import com.erp.account.enums.PurchaseNature;
import com.erp.account.enums.PurchaseSource;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseInvoiceValidationService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;

    private static final Set<PurchaseOrderStatus> VALID_PO_INVOICE_STATUSES = EnumSet.of(
            PurchaseOrderStatus.APPROVED,
            PurchaseOrderStatus.SENT,
            PurchaseOrderStatus.PARTIALLY_RECEIVED,
            PurchaseOrderStatus.RECEIVED
    );

    public void normalizeAndValidateClassification(ApInvoiceRequest request) {
        PurchaseSource source = request.getPurchaseSource();
        if (source == null) {
            source = request.getGoodsReceiptId() != null ? PurchaseSource.GRN
                    : request.getPurchaseOrderId() != null ? PurchaseSource.PO : PurchaseSource.DIRECT_LOCAL_PURCHASE;
            request.setPurchaseSource(source);
        }

        if (source == PurchaseSource.DIRECT_LOCAL_PURCHASE
                && (request.getPurchaseOrderId() != null || request.getGoodsReceiptId() != null)) {
            throw new BadRequestException("Direct local purchase cannot reference a PO or GRN", "INVALID_PURCHASE_SOURCE");
        }
        if (source == PurchaseSource.PO
                && (request.getPurchaseOrderId() == null || request.getGoodsReceiptId() != null)) {
            throw new BadRequestException("PO source requires only a purchase order reference", "INVALID_PURCHASE_SOURCE");
        }
        if (source == PurchaseSource.GRN && request.getGoodsReceiptId() == null) {
            throw new BadRequestException("GRN source requires a goods receipt reference", "INVALID_PURCHASE_SOURCE");
        }

        if (request.getDocumentType() == null) {
            request.setDocumentType(PurchaseDocumentType.TAX_INVOICE);
        }
        if (request.getPurchaseNature() == null) {
            boolean hasProduct = request.getItems() != null && request.getItems().stream()
                    .anyMatch(item -> item.getItemType() == com.erp.account.enums.ItemType.PRODUCT);
            request.setPurchaseNature(hasProduct ? PurchaseNature.STOCK : PurchaseNature.EXPENSE);
        }
        if (request.getPaymentType() == null) {
            request.setPaymentType(PaymentType.CREDIT);
        }
        if (request.getGstTreatment() == null) {
            request.setGstTreatment(request.getTaxAmount() != null && request.getTaxAmount().signum() > 0
                    ? GstTreatment.GST_APPLICABLE : GstTreatment.GST_NOT_APPLICABLE);
        }
        if (request.getItcEligibility() == null) {
            if (request.getTaxAmount() == null || request.getTaxAmount().signum() == 0) {
                request.setItcEligibility(ItcEligibility.NOT_APPLICABLE);
            } else {
                request.setItcEligibility(request.getDocumentType() == PurchaseDocumentType.TAX_INVOICE
                        ? ItcEligibility.ITC_ELIGIBLE : ItcEligibility.ITC_NOT_ELIGIBLE);
            }
        }

        if (request.getDocumentType() != PurchaseDocumentType.TAX_INVOICE
                && request.getItcEligibility() == ItcEligibility.ITC_ELIGIBLE) {
            throw new BadRequestException("This document type cannot be marked ITC eligible", "INVALID_ITC_ELIGIBILITY");
        }
        if (request.getDocumentType() == PurchaseDocumentType.NO_INVOICE
                && request.getItcEligibility() == ItcEligibility.ITC_ELIGIBLE) {
            throw new BadRequestException("A no-invoice purchase cannot be ITC eligible", "INVALID_ITC_ELIGIBILITY");
        }
        if (request.getItcEligibility() == ItcEligibility.ITC_ELIGIBLE
                && request.getGstTreatment() == GstTreatment.GST_NOT_APPLICABLE) {
            throw new BadRequestException("ITC eligible purchases require a GST treatment", "INVALID_ITC_ELIGIBILITY");
        }

        boolean hasProduct = request.getItems() != null && request.getItems().stream()
                .anyMatch(item -> item.getItemType() == com.erp.account.enums.ItemType.PRODUCT);
        if (request.getPurchaseNature() == PurchaseNature.STOCK && !hasProduct) {
            throw new BadRequestException("Stock purchases require at least one product item", "INVALID_PURCHASE_NATURE");
        }
        if (request.getPurchaseNature() == PurchaseNature.EXPENSE && hasProduct) {
            throw new BadRequestException("Expense purchases cannot contain product items", "INVALID_PURCHASE_NATURE");
        }
    }

    public void validateCalculatedTaxTreatment(ApInvoiceRequest request, java.math.BigDecimal calculatedTax) {
        java.math.BigDecimal tax = calculatedTax == null ? java.math.BigDecimal.ZERO : calculatedTax;
        if (request.getGstTreatment() == GstTreatment.GST_NOT_APPLICABLE && tax.signum() > 0) {
            throw new BadRequestException("GST not applicable purchases cannot contain calculated GST", "INVALID_GST_TREATMENT");
        }
        if (request.getItcEligibility() == ItcEligibility.ITC_ELIGIBLE && tax.signum() == 0) {
            throw new BadRequestException("ITC eligible purchases must contain calculated GST", "INVALID_ITC_ELIGIBILITY");
        }
    }

    /**
     * Validates procurement references (PO and GRN) supplied on an AP Invoice request.
     * Prevents loose/fake UUIDs, ensures company tenant isolation, vendor consistency,
     * status validity, and PO-GRN relationship integrity.
     */
    public ValidatedProcurementReferences validateProcurementReferences(UUID companyId, ApInvoiceRequest request) {
        PurchaseOrder purchaseOrder = null;
        GoodsReceipt goodsReceipt = null;

        UUID poId = request.getPurchaseOrderId();
        UUID grnId = request.getGoodsReceiptId();
        UUID vendorId = request.getVendorId();

        // 1. Validate Goods Receipt if supplied
        if (grnId != null) {
            goodsReceipt = goodsReceiptRepository.findByIdAndIsDeletedFalse(grnId)
                    .orElseThrow(() -> new BadRequestException(
                            "Goods Receipt not found for ID: " + grnId, "GRN_NOT_FOUND"));

            UUID grnCompanyId = goodsReceipt.getCompany() != null ? goodsReceipt.getCompany().getId() : goodsReceipt.getCompanyId();
            if (companyId != null && grnCompanyId != null && !companyId.equals(grnCompanyId)) {
                log.error("Cross-company GRN access attempted. Request company: {}, GRN company: {}", companyId, grnCompanyId);
                throw new BadRequestException("Goods Receipt does not belong to the current company", "CROSS_COMPANY_ACCESS");
            }

            if (goodsReceipt.getStatus() != GoodsReceiptStatus.CONFIRMED && goodsReceipt.getStatus() != GoodsReceiptStatus.POSTED) {
                log.error("GRN {} is not confirmed or posted. Current status: {}", goodsReceipt.getGrnNumber(), goodsReceipt.getStatus());
                throw new BadRequestException("Goods Receipt must be CONFIRMED or POSTED to link to an invoice. Current status: "
                        + goodsReceipt.getStatus(), "GRN_NOT_CONFIRMED");
            }

            UUID grnVendorId = goodsReceipt.getVendor() != null ? goodsReceipt.getVendor().getId() : null;
            if (vendorId != null && grnVendorId != null && !vendorId.equals(grnVendorId)) {
                log.error("Vendor mismatch. Invoice vendor: {}, GRN vendor: {}", vendorId, grnVendorId);
                throw new BadRequestException("Invoice vendor does not match Goods Receipt vendor", "VENDOR_MISMATCH");
            }

            // Verify PO-GRN relationship
            if (poId != null) {
                if (goodsReceipt.getPurchaseOrderId() != null && !poId.equals(goodsReceipt.getPurchaseOrderId())) {
                    log.error("GRN {} belongs to PO {}, but invoice specified PO {}",
                            goodsReceipt.getGrnNumber(), goodsReceipt.getPurchaseOrderId(), poId);
                    throw new BadRequestException("Goods Receipt does not belong to the specified Purchase Order",
                            "GRN_PO_MISMATCH");
                }
            } else if (goodsReceipt.getPurchaseOrderId() != null) {
                // Auto-populate purchaseOrderId from GRN if omitted
                poId = goodsReceipt.getPurchaseOrderId();
                request.setPurchaseOrderId(poId);
            }
        }

        final UUID effectivePoId = poId;
        // 2. Validate Purchase Order if supplied or derived
        if (effectivePoId != null) {
            purchaseOrder = purchaseOrderRepository.findByIdAndIsDeletedFalse(effectivePoId)
                    .orElseThrow(() -> new BadRequestException(
                            "Purchase Order not found for ID: " + effectivePoId, "PO_NOT_FOUND"));

            UUID poCompanyId = purchaseOrder.getCompany() != null ? purchaseOrder.getCompany().getId() : purchaseOrder.getCompanyId();
            if (companyId != null && poCompanyId != null && !companyId.equals(poCompanyId)) {
                log.error("Cross-company PO access attempted. Request company: {}, PO company: {}", companyId, poCompanyId);
                throw new BadRequestException("Purchase Order does not belong to the current company", "CROSS_COMPANY_ACCESS");
            }

            UUID poVendorId = purchaseOrder.getVendor() != null ? purchaseOrder.getVendor().getId() : null;
            if (vendorId != null && poVendorId != null && !vendorId.equals(poVendorId)) {
                log.error("Vendor mismatch. Invoice vendor: {}, PO vendor: {}", vendorId, poVendorId);
                throw new BadRequestException("Invoice vendor does not match Purchase Order vendor", "VENDOR_MISMATCH");
            }

            if (!VALID_PO_INVOICE_STATUSES.contains(purchaseOrder.getStatus())) {
                log.error("PO {} is in invalid status: {}", purchaseOrder.getPoNumber(), purchaseOrder.getStatus());
                throw new BadRequestException("Purchase Order is in invalid status for invoicing: "
                        + purchaseOrder.getStatus(), "PO_INVALID_STATUS");
            }
        }

        return new ValidatedProcurementReferences(purchaseOrder, goodsReceipt);
    }

    public record ValidatedProcurementReferences(PurchaseOrder purchaseOrder, GoodsReceipt goodsReceipt) {}
}
