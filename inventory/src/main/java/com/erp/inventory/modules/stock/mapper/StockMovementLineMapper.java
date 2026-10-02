package com.erp.inventory.modules.stock.mapper;

import com.erp.inventory.modules.stock.dto.request.StockMovementLineRequest;
import com.erp.inventory.modules.stock.dto.response.StockMovementLineResponse;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StockMovementLineMapper {

    StockMovementLineResponse toResponse(StockMovementLine entity);

    StockMovementLine toEntity(StockMovementLineRequest request);

    List<StockMovementLineResponse> toResponseList(List<StockMovementLine> entities);

    void updateEntityFromRequest(StockMovementLineRequest request, @MappingTarget StockMovementLine entity);
}
