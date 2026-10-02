package com.erp.inventory.modules.product.mapper;

import com.erp.inventory.modules.product.dto.request.ProductRequest;
import com.erp.inventory.modules.product.dto.response.ProductResponse;
import com.erp.inventory.modules.product.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductMapper {

    ProductResponse toResponse(Product entity);

    Product toEntity(ProductRequest request);

    List<ProductResponse> toResponseList(List<Product> entities);

    void updateEntityFromRequest(ProductRequest request, @MappingTarget Product entity);
}
