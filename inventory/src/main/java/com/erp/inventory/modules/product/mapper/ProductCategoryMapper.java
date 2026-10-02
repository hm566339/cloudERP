package com.erp.inventory.modules.product.mapper;

import com.erp.inventory.modules.product.dto.request.ProductCategoryRequest;
import com.erp.inventory.modules.product.dto.response.ProductCategoryResponse;
import com.erp.inventory.modules.product.entity.ProductCategory;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductCategoryMapper {

    ProductCategoryResponse toResponse(ProductCategory entity);

    ProductCategory toEntity(ProductCategoryRequest request);

    List<ProductCategoryResponse> toResponseList(List<ProductCategory> entities);

    void updateEntityFromRequest(ProductCategoryRequest request, @MappingTarget ProductCategory entity);
}
