package com.erp.inventory.modules.adjustment.mapper;

import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentRequest;
import com.erp.inventory.modules.adjustment.dto.response.StockAdjustmentResponse;
import com.erp.inventory.modules.adjustment.entity.StockAdjustment;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StockAdjustmentMapper {

    StockAdjustmentResponse toResponse(StockAdjustment entity);

    StockAdjustment toEntity(StockAdjustmentRequest request);

    List<StockAdjustmentResponse> toResponseList(List<StockAdjustment> entities);

    void updateEntityFromRequest(StockAdjustmentRequest request, @MappingTarget StockAdjustment entity);
}
