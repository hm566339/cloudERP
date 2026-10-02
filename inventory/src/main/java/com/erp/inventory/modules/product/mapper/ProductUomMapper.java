package com.erp.inventory.modules.product.mapper;

import com.erp.inventory.modules.product.dto.request.ProductUomRequest;
import com.erp.inventory.modules.product.dto.response.ProductUomResponse;
import com.erp.inventory.modules.product.entity.ProductUom;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductUomMapper {

    ProductUomResponse toResponse(ProductUom entity);

    ProductUom toEntity(ProductUomRequest request);

    List<ProductUomResponse> toResponseList(List<ProductUom> entities);

    void updateEntityFromRequest(ProductUomRequest request, @MappingTarget ProductUom entity);
}
