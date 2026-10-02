package com.erp.inventory.modules.stock.mapper;

import com.erp.inventory.modules.stock.dto.request.StockMovementRequest;
import com.erp.inventory.modules.stock.dto.response.StockMovementResponse;
import com.erp.inventory.modules.stock.entity.StockMovement;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StockMovementMapper {

    StockMovementResponse toResponse(StockMovement entity);

    StockMovement toEntity(StockMovementRequest request);

    List<StockMovementResponse> toResponseList(List<StockMovement> entities);

    void updateEntityFromRequest(StockMovementRequest request, @MappingTarget StockMovement entity);
}
