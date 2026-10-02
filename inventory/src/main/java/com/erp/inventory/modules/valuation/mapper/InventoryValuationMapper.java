package com.erp.inventory.modules.valuation.mapper;

import com.erp.inventory.modules.valuation.dto.request.InventoryValuationRequest;
import com.erp.inventory.modules.valuation.dto.response.InventoryValuationResponse;
import com.erp.inventory.modules.valuation.entity.InventoryValuation;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InventoryValuationMapper {

    InventoryValuationResponse toResponse(InventoryValuation entity);

    InventoryValuation toEntity(InventoryValuationRequest request);

    List<InventoryValuationResponse> toResponseList(List<InventoryValuation> entities);

    void updateEntityFromRequest(InventoryValuationRequest request, @MappingTarget InventoryValuation entity);
}
