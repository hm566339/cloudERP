package com.erp.inventory.modules.adjustment.mapper;

import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentLineRequest;
import com.erp.inventory.modules.adjustment.dto.response.StockAdjustmentLineResponse;
import com.erp.inventory.modules.adjustment.entity.StockAdjustmentLine;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StockAdjustmentLineMapper {

    StockAdjustmentLineResponse toResponse(StockAdjustmentLine entity);

    StockAdjustmentLine toEntity(StockAdjustmentLineRequest request);

    List<StockAdjustmentLineResponse> toResponseList(List<StockAdjustmentLine> entities);

    void updateEntityFromRequest(StockAdjustmentLineRequest request, @MappingTarget StockAdjustmentLine entity);
}
