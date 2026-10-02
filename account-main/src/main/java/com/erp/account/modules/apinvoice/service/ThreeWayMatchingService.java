package com.erp.account.modules.apinvoice.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceItemRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.entity.ApInvoiceItem;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptItem;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderItem;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThreeWayMatchingService {

    // Default tolerances (zero-tolerance by default unless configured or explicitly authorized)
    private static final BigDecimal DEFAULT_QTY_TOLERANCE_PERCENT = BigDecimal.ZERO;
    private static final BigDecimal DEFAULT_PRICE_TOLERANCE_PERCENT = BigDecimal.ZERO;

    /**
     * Performs 3-way matching validation on an AP Invoice request against its linked PO and GRN.
     */
    public void validateThreeWayMatch(ApInvoiceRequest request, PurchaseOrder po, GoodsReceipt grn) {
        if (request == null || (po == null && grn == null)) {
            return;
        }

        List<ApInvoiceItemRequest> invoiceItems = request.getItems();
        if (invoiceItems == null || invoiceItems.isEmpty()) {
            return;
        }

        BigDecimal qtyTolerance = DEFAULT_QTY_TOLERANCE_PERCENT;
        BigDecimal priceTolerance = DEFAULT_PRICE_TOLERANCE_PERCENT;

        List<String> discrepancies = new ArrayList<>();

        Map<UUID, BigDecimal> invoiceQuantities = new LinkedHashMap<>();
        Map<UUID, String> invoiceDescriptions = new HashMap<>();
        for (ApInvoiceItemRequest invoiceItem : invoiceItems) {
            UUID productId = invoiceItem.getItemId();
            if (productId == null) {
                continue;
            }
            invoiceQuantities.merge(productId,
                    invoiceItem.getQuantity() != null ? invoiceItem.getQuantity() : BigDecimal.ZERO,
                    BigDecimal::add);
            invoiceDescriptions.putIfAbsent(productId, invoiceItem.getDescription());

            List<GoodsReceiptItem> matchingGrnItems = findGrnItems(grn, productId);
            List<PurchaseOrderItem> matchingPoItems = findPoItems(po, productId);
            if (matchingGrnItems.isEmpty() && matchingPoItems.isEmpty()) {
                discrepancies.add(String.format("Invoice item '%s' (ID: %s) does not exist in the linked PO or GRN",
                        invoiceItem.getDescription(), productId));
            }
        }

        for (Map.Entry<UUID, BigDecimal> entry : invoiceQuantities.entrySet()) {
            UUID productId = entry.getKey();
            BigDecimal invoiceQty = entry.getValue();
            List<GoodsReceiptItem> matchingGrnItems = findGrnItems(grn, productId);
            if (grn != null && matchingGrnItems.isEmpty()) {
                discrepancies.add(String.format("Invoice item '%s' (ID: %s) does not exist in the linked GRN",
                        invoiceDescriptions.get(productId), productId));
            } else if (!matchingGrnItems.isEmpty()) {
                BigDecimal netAcceptedQty = matchingGrnItems.stream()
                        .map(GoodsReceiptItem::getNetAcceptedQuantity)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal allowedMaxQty = netAcceptedQty.multiply(
                        BigDecimal.ONE.add(qtyTolerance.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)));
                if (invoiceQty.compareTo(allowedMaxQty) > 0) {
                    discrepancies.add(String.format(
                            "Item '%s' (ID: %s) aggregated invoice quantity (%s) exceeds net GRN accepted quantity (%s). Allowed max: %s",
                            invoiceDescriptions.get(productId), productId, invoiceQty, netAcceptedQty, allowedMaxQty));
                }
            }

            List<PurchaseOrderItem> matchingPoItems = findPoItems(po, productId);
            if (po != null && matchingPoItems.isEmpty()) {
                discrepancies.add(String.format("Invoice item '%s' (ID: %s) does not exist in the linked PO",
                        invoiceDescriptions.get(productId), productId));
            }
            for (ApInvoiceItemRequest invoiceItem : invoiceItems) {
                if (!productId.equals(invoiceItem.getItemId()) || matchingPoItems.isEmpty()) continue;
                BigDecimal invoicePrice = invoiceItem.getUnitPrice() != null ? invoiceItem.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal poPrice = matchingPoItems.get(0).getUnitPrice() != null
                        ? matchingPoItems.get(0).getUnitPrice() : BigDecimal.ZERO;
                BigDecimal allowedMaxPrice = poPrice.multiply(
                        BigDecimal.ONE.add(priceTolerance.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)));
                if (invoicePrice.compareTo(allowedMaxPrice) > 0) {
                    discrepancies.add(String.format(
                            "Item '%s' (ID: %s) invoice unit price (%s) exceeds PO unit price (%s). Allowed max: %s",
                            invoiceItem.getDescription(), productId, invoicePrice, poPrice, allowedMaxPrice));
                }
            }
        }

        if (!discrepancies.isEmpty()) {
            boolean isAuthorized = isAuthorizedForVariance();
            if (isAuthorized && Boolean.TRUE.equals(request.getAllowVariance())) {
                log.info("Variance allowed by authorized user {} for invoice. Discrepancies: {}",
                        CurrentUserContext.getUserId(), discrepancies);
                return;
            }

            String fullError = "3-Way matching failed:\n - " + String.join("\n - ", discrepancies);
            throw new BadRequestException(fullError, "THREE_WAY_MATCH_FAILED");
        }
    }

    /**
     * Validates 3-way match on an existing ApInvoice entity before approval.
     */
    public void validateThreeWayMatchOnApproval(ApInvoice invoice, PurchaseOrder po, GoodsReceipt grn) {
        if (invoice == null || (po == null && grn == null)) {
            return;
        }

        List<ApInvoiceItem> invoiceItems = invoice.getItems();
        if (invoiceItems == null || invoiceItems.isEmpty()) {
            return;
        }

        List<String> discrepancies = new ArrayList<>();

        Map<UUID, BigDecimal> invoiceQuantities = new LinkedHashMap<>();
        Map<UUID, String> descriptions = new HashMap<>();
        for (ApInvoiceItem invoiceItem : invoiceItems) {
            if (invoiceItem.getItemId() == null) continue;
            invoiceQuantities.merge(invoiceItem.getItemId(),
                    invoiceItem.getQuantity() != null ? invoiceItem.getQuantity() : BigDecimal.ZERO,
                    BigDecimal::add);
            descriptions.putIfAbsent(invoiceItem.getItemId(), invoiceItem.getDescription());
        }
        for (Map.Entry<UUID, BigDecimal> entry : invoiceQuantities.entrySet()) {
            UUID productId = entry.getKey();
            List<GoodsReceiptItem> matchingGrnItems = findGrnItems(grn, productId);
            List<PurchaseOrderItem> matchingPoItems = findPoItems(po, productId);
            if (matchingGrnItems.isEmpty() && matchingPoItems.isEmpty()) {
                discrepancies.add(String.format("Invoice item '%s' (ID: %s) does not exist in the linked PO or GRN",
                        descriptions.get(productId), productId));
            }
            if (grn != null && matchingGrnItems.isEmpty()) {
                discrepancies.add(String.format("Invoice item '%s' (ID: %s) does not exist in the linked GRN",
                        descriptions.get(productId), productId));
            } else if (!matchingGrnItems.isEmpty()) {
                BigDecimal netAcceptedQty = matchingGrnItems.stream().map(GoodsReceiptItem::getNetAcceptedQuantity)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                if (entry.getValue().compareTo(netAcceptedQty) > 0) {
                    discrepancies.add(String.format(
                            "Item '%s' aggregated invoice quantity (%s) exceeds net GRN accepted quantity (%s)",
                            descriptions.get(productId), entry.getValue(), netAcceptedQty));
                }
            }
            if (po != null && matchingPoItems.isEmpty()) {
                discrepancies.add(String.format("Invoice item '%s' (ID: %s) does not exist in the linked PO",
                        descriptions.get(productId), productId));
            }
            if (!matchingPoItems.isEmpty()) {
                BigDecimal poPrice = matchingPoItems.get(0).getUnitPrice() != null
                        ? matchingPoItems.get(0).getUnitPrice() : BigDecimal.ZERO;
                for (ApInvoiceItem invoiceItem : invoiceItems) {
                    if (productId.equals(invoiceItem.getItemId())
                            && invoiceItem.getUnitPrice() != null && invoiceItem.getUnitPrice().compareTo(poPrice) > 0) {
                        discrepancies.add(String.format("Item '%s' invoice unit price (%s) exceeds PO unit price (%s)",
                                invoiceItem.getDescription(), invoiceItem.getUnitPrice(), poPrice));
                    }
                }
            }
        }

        if (!discrepancies.isEmpty() && !isAuthorizedForVariance()) {
            throw new BadRequestException("Cannot approve invoice due to 3-way match discrepancies:\n - "
                    + String.join("\n - ", discrepancies), "THREE_WAY_MATCH_APPROVAL_BLOCKED");
        }
    }

    private boolean isAuthorizedForVariance() {
        if (TenantUtils.isSystemAdmin()) {
            return true;
        }
        String role = CurrentUserContext.getUserRole();
        return "ROLE_ADMIN".equalsIgnoreCase(role)
                || "ROLE_PURCHASE_MANAGER".equalsIgnoreCase(role)
                || "ROLE_FINANCE_MANAGER".equalsIgnoreCase(role);
    }

    private List<GoodsReceiptItem> findGrnItems(GoodsReceipt grn, UUID productId) {
        if (grn == null || grn.getItems() == null) return Collections.emptyList();
        return grn.getItems().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()) && productId.equals(item.getItemId()))
                .toList();
    }

    private List<PurchaseOrderItem> findPoItems(PurchaseOrder po, UUID productId) {
        if (po == null || po.getItems() == null) return Collections.emptyList();
        return po.getItems().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()) && productId.equals(item.getItemId()))
                .toList();
    }
}
