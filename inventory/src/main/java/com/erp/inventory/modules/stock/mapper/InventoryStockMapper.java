package com.erp.inventory.modules.stock.mapper;

import com.erp.inventory.modules.stock.dto.request.InventoryStockRequest;
import com.erp.inventory.modules.stock.dto.response.InventoryStockResponse;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InventoryStockMapper {

    @org.mapstruct.Mapping(target = "productName", source = "product.productName")
    @org.mapstruct.Mapping(target = "warehouseName", source = "warehouse.warehouseName")
    @org.mapstruct.Mapping(target = "locationName", source = "location.locationName")
    @org.mapstruct.Mapping(target = "batchCode", source = "batch.batchNumber")
    InventoryStockResponse toResponse(InventoryStock entity);

    InventoryStock toEntity(InventoryStockRequest request);

    List<InventoryStockResponse> toResponseList(List<InventoryStock> entities);

    void updateEntityFromRequest(InventoryStockRequest request, @MappingTarget InventoryStock entity);
}
