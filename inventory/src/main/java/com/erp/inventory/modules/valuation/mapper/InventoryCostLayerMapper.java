package com.erp.inventory.modules.valuation.mapper;

import com.erp.inventory.modules.valuation.dto.request.InventoryCostLayerRequest;
import com.erp.inventory.modules.valuation.dto.response.InventoryCostLayerResponse;
import com.erp.inventory.modules.valuation.entity.InventoryCostLayer;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InventoryCostLayerMapper {

    InventoryCostLayerResponse toResponse(InventoryCostLayer entity);

    InventoryCostLayer toEntity(InventoryCostLayerRequest request);

    List<InventoryCostLayerResponse> toResponseList(List<InventoryCostLayer> entities);

    void updateEntityFromRequest(InventoryCostLayerRequest request, @MappingTarget InventoryCostLayer entity);
}
