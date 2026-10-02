package com.erp.inventory.modules.period.mapper;

import com.erp.inventory.modules.period.dto.request.InventoryPeriodRequest;
import com.erp.inventory.modules.period.dto.response.InventoryPeriodResponse;
import com.erp.inventory.modules.period.entity.InventoryPeriod;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InventoryPeriodMapper {

    InventoryPeriodResponse toResponse(InventoryPeriod entity);

    InventoryPeriod toEntity(InventoryPeriodRequest request);

    List<InventoryPeriodResponse> toResponseList(List<InventoryPeriod> entities);

    void updateEntityFromRequest(InventoryPeriodRequest request, @MappingTarget InventoryPeriod entity);
}
