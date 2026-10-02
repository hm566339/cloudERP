package com.erp.inventory.modules.openingstock.mapper;

import com.erp.inventory.modules.openingstock.dto.request.OpeningStockRequest;
import com.erp.inventory.modules.openingstock.dto.response.OpeningStockResponse;
import com.erp.inventory.modules.openingstock.entity.OpeningStock;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OpeningStockMapper {

    OpeningStockResponse toResponse(OpeningStock entity);

    OpeningStock toEntity(OpeningStockRequest request);

    List<OpeningStockResponse> toResponseList(List<OpeningStock> entities);

    void updateEntityFromRequest(OpeningStockRequest request, @MappingTarget OpeningStock entity);
}
