package com.erp.inventory.modules.warehouse.mapper;

import com.erp.inventory.modules.warehouse.dto.request.WarehouseLocationRequest;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseLocationResponse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WarehouseLocationMapper {

    WarehouseLocationResponse toResponse(WarehouseLocation entity);

    WarehouseLocation toEntity(WarehouseLocationRequest request);

    List<WarehouseLocationResponse> toResponseList(List<WarehouseLocation> entities);

    void updateEntityFromRequest(WarehouseLocationRequest request, @MappingTarget WarehouseLocation entity);
}
