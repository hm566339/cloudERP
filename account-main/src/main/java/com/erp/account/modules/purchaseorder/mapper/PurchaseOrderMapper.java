package com.erp.account.modules.purchaseorder.mapper;

import com.erp.account.modules.purchaseorder.dto.PurchaseOrderItemResponse;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderResponse;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface PurchaseOrderMapper {

    @Mapping(target = "vendorName", source = "vendor.vendorName")
    @Mapping(target = "vendorGstin", source = "vendor.gstin")
    @Mapping(target = "supplierQuotationNumber", source = "supplierQuotation.quotationNumber")
    @Mapping(target = "rfqNumber", source = "rfq.rfqNumber")
    @Mapping(target = "purchaseRequisitionNumber", source = "purchaseRequisition.requisitionNumber")
    @Mapping(target = "items", source = "items", qualifiedByName = "filterActiveItems")
    PurchaseOrderResponse toResponse(PurchaseOrder po);

    @Mapping(target = "purchaseOrderId", source = "purchaseOrder.id")
    @Mapping(target = "hsnSacId", source = "hsnSacMaster.id")
    @Mapping(target = "hsnSacCode", source = "hsnSacMaster.code")
    PurchaseOrderItemResponse toItemResponse(PurchaseOrderItem item);

    @Named("filterActiveItems")
    default List<PurchaseOrderItemResponse> filterActiveItems(List<PurchaseOrderItem> items) {
        if (items == null) {
            return Collections.emptyList();
        }
        return items.stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .map(this::toItemResponse)
                .collect(Collectors.toList());
    }
}
