package com.erp.inventory.modules.product.mapper;

import com.erp.inventory.modules.product.dto.request.UnitOfMeasureRequest;
import com.erp.inventory.modules.product.dto.response.UnitOfMeasureResponse;
import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UnitOfMeasureMapper {

    UnitOfMeasureResponse toResponse(UnitOfMeasure entity);

    UnitOfMeasure toEntity(UnitOfMeasureRequest request);

    List<UnitOfMeasureResponse> toResponseList(List<UnitOfMeasure> entities);

    void updateEntityFromRequest(UnitOfMeasureRequest request, @MappingTarget UnitOfMeasure entity);
}
