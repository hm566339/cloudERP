package com.erp.account.modules.goodsreceipt.mapper;

import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptItemResponse;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptResponse;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptItem;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class GoodsReceiptMapper {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.erp.account.common.service.WarehouseLookupService warehouseLookupService;

    public void setWarehouseLookupService(com.erp.account.common.service.WarehouseLookupService warehouseLookupService) {
        this.warehouseLookupService = warehouseLookupService;
    }

    public GoodsReceiptResponse toResponse(GoodsReceipt grn) {
        if (grn == null) {
            return null;
        }

        List<GoodsReceiptItemResponse> itemResponses = grn.getItems() != null
                ? grn.getItems().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .map(this::toItemResponse)
                .collect(Collectors.toList())
                : Collections.emptyList();

        String whName = null;
        if (warehouseLookupService != null && grn.getWarehouseId() != null) {
            whName = warehouseLookupService.resolveWarehouseName(grn.getWarehouseId());
        }

        return GoodsReceiptResponse.builder()
                .id(grn.getId())
                .companyId(grn.getCompanyId())
                .vendorId(grn.getVendorId())
                .vendorName(grn.getVendor() != null ? grn.getVendor().getVendorName() : null)
                .purchaseOrderId(grn.getPurchaseOrderId())
                .poNumber(grn.getPurchaseOrder() != null ? grn.getPurchaseOrder().getPoNumber() : null)
                .grnNumber(grn.getGrnNumber())
                .grnDate(grn.getGrnDate())
                .warehouseId(grn.getWarehouseId())
                .warehouseName(whName)
                .deliveryNoteNumber(grn.getDeliveryNoteNumber())
                .deliveryNoteDate(grn.getDeliveryNoteDate())
                .vehicleNumber(grn.getVehicleNumber())
                .transporterName(grn.getTransporterName())
                .notes(grn.getNotes())
                .status(grn.getStatus())
                .verifiedBy(grn.getVerifiedBy())
                .verifiedAt(grn.getVerifiedAt())
                .postedBy(grn.getPostedBy())
                .postedAt(grn.getPostedAt())
                .confirmedBy(grn.getConfirmedBy())
                .confirmedAt(grn.getConfirmedAt())
                .cancelledBy(grn.getCancelledBy())
                .cancelledAt(grn.getCancelledAt())
                .cancellationReason(grn.getCancellationReason())
                .createdAt(grn.getCreatedAt())
                .createdBy(grn.getCreatedBy())
                .updatedAt(grn.getUpdatedAt())
                .updatedBy(grn.getUpdatedBy())
                .items(itemResponses)
                .build();
    }

    public GoodsReceiptItemResponse toItemResponse(GoodsReceiptItem item) {
        if (item == null) {
            return null;
        }

        com.erp.account.common.dto.WarehouseLocationNameDto whLoc = null;
        if (warehouseLookupService != null && item.getWarehouseId() != null) {
            whLoc = warehouseLookupService.resolveWarehouseAndLocation(item.getWarehouseId(), item.getLocationId());
        }

        return GoodsReceiptItemResponse.builder()
                .id(item.getId())
                .companyId(item.getCompanyId())
                .goodsReceiptId(item.getGoodsReceipt() != null ? item.getGoodsReceipt().getId() : null)
                .purchaseOrderItemId(item.getPurchaseOrderItemId())
                .itemId(item.getItemId())
                .itemName(item.getItemName())
                .description(item.getDescription())
                .unit(item.getUnit())
                .itemType(item.getItemType())
                .orderedQuantity(item.getOrderedQuantity())
                .previouslyReceivedQuantity(item.getPreviouslyReceivedQuantity())
                .receivedQuantity(item.getReceivedQuantity())
                .acceptedQuantity(item.getAcceptedQuantity())
                .rejectedQuantity(item.getRejectedQuantity())
                .rejectionReason(item.getRejectionReason())
                .pendingQuantity(item.getPendingQuantity())
                .unitPrice(item.getUnitPrice())
                .batchNumber(item.getBatchNumber())
                .serialNumber(item.getSerialNumber())
                .expiryDate(item.getExpiryDate())
                .warehouseId(item.getWarehouseId())
                .warehouseName(whLoc != null ? whLoc.getWarehouseName() : null)
                .locationId(item.getLocationId())
                .locationName(whLoc != null ? whLoc.getLocationName() : null)
                .notes(item.getNotes())
                .build();
    }
}
