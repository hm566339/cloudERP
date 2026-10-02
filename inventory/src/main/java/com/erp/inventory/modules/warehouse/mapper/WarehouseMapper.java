package com.erp.inventory.modules.warehouse.mapper;

import com.erp.inventory.modules.warehouse.dto.request.WarehouseRequest;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseResponse;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WarehouseMapper {

    WarehouseResponse toResponse(Warehouse entity);

    Warehouse toEntity(WarehouseRequest request);

    List<WarehouseResponse> toResponseList(List<Warehouse> entities);

    void updateEntityFromRequest(WarehouseRequest request, @MappingTarget Warehouse entity);
}
