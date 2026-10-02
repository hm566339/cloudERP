package com.erp.inventory.modules.openingstock.mapper;

import com.erp.inventory.modules.openingstock.dto.request.OpeningStockLineRequest;
import com.erp.inventory.modules.openingstock.dto.response.OpeningStockLineResponse;
import com.erp.inventory.modules.openingstock.entity.OpeningStockLine;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OpeningStockLineMapper {

    OpeningStockLineResponse toResponse(OpeningStockLine entity);

    OpeningStockLine toEntity(OpeningStockLineRequest request);

    List<OpeningStockLineResponse> toResponseList(List<OpeningStockLine> entities);

    void updateEntityFromRequest(OpeningStockLineRequest request, @MappingTarget OpeningStockLine entity);
}
