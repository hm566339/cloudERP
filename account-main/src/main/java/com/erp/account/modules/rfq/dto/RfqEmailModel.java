package com.erp.account.modules.rfq.dto;

import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.rfq.entity.Rfq;
import com.erp.account.modules.rfq.entity.RfqItem;
import com.erp.account.modules.vendor.entity.Vendor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfqEmailModel {

    private UUID rfqId;
    private String rfqNumber;
    private String prNumber;
    private PurchaseRequisitionRef purchaseRequisition;
    private LocalDate issueDate;
    private LocalDate quotationDeadline;
    private LocalDate expectedDeliveryDate;
    private String terms;
    private String notes;
    private String status;

    private String vendorName;
    private String vendorEmail;

    @Builder.Default
    private List<RfqEmailItemModel> items = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseRequisitionRef {
        private UUID id;
        private String prNumber;
        private String requisitionNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RfqEmailItemModel {
        private UUID id;
        private String itemName;
        private String description;
        private String specifications;
        private String itemType;
        private BigDecimal quantity;
        private String quantityDisplay;
        private String unit;
        private String unitDisplay;
        private LocalDate requiredDate;
    }

    public static RfqEmailModel from(Rfq rfq, Vendor vendor, Company company) {
        return from(rfq, vendor, company, null);
    }

    public static RfqEmailModel from(Rfq rfq, Vendor vendor, Company company, com.erp.account.modules.unit.service.UnitService unitService) {
        if (rfq == null) {
            return null;
        }

        String prNum = null;
        PurchaseRequisitionRef prRef = null;
        if (rfq.getPurchaseRequisition() != null) {
            prNum = rfq.getPurchaseRequisition().getRequisitionNumber();
            prRef = PurchaseRequisitionRef.builder()
                    .id(rfq.getPurchaseRequisition().getId())
                    .prNumber(prNum)
                    .requisitionNumber(prNum)
                    .build();
        }

        List<RfqEmailItemModel> itemModels = new ArrayList<>();
        if (rfq.getItems() != null) {
            for (RfqItem item : rfq.getItems()) {
                String qtyDisplay = null;
                String uomDisplay = null;

                if (unitService != null) {
                    com.erp.account.modules.unit.entity.Unit resolvedUnit = unitService.resolveUnit(item.getUnit());
                    qtyDisplay = unitService.formatQuantity(item.getQuantity(), resolvedUnit);
                    uomDisplay = unitService.getUnitDisplay(resolvedUnit, item.getUnit());
                } else {
                    if (item.getQuantity() != null) {
                        BigDecimal stripped = item.getQuantity().stripTrailingZeros();
                        qtyDisplay = (stripped.scale() < 0 ? stripped.setScale(0) : stripped).toPlainString();
                    } else {
                        qtyDisplay = "-";
                    }
                    uomDisplay = item.getUnit() != null ? item.getUnit() : "PIECE";
                }

                itemModels.add(RfqEmailItemModel.builder()
                        .id(item.getId())
                        .itemName(item.getItemName())
                        .description(item.getDescription())
                        .specifications(item.getSpecifications())
                        .itemType(item.getItemType() != null ? item.getItemType().name() : null)
                        .quantity(item.getQuantity())
                        .quantityDisplay(qtyDisplay)
                        .unit(item.getUnit())
                        .unitDisplay(uomDisplay)
                        .requiredDate(item.getRequiredDate())
                        .build());
            }
        }

        return RfqEmailModel.builder()
                .rfqId(rfq.getId())
                .rfqNumber(rfq.getRfqNumber())
                .prNumber(prNum)
                .purchaseRequisition(prRef)
                .issueDate(rfq.getIssueDate())
                .quotationDeadline(rfq.getQuotationDeadline())
                .expectedDeliveryDate(rfq.getExpectedDeliveryDate())
                .terms(rfq.getTerms())
                .notes(rfq.getNotes())
                .status(rfq.getStatus() != null ? rfq.getStatus().name() : null)
                .vendorName(vendor != null ? vendor.getVendorName() : null)
                .vendorEmail(vendor != null ? vendor.getEmail() : null)
                .items(itemModels)
                .build();
    }
}
