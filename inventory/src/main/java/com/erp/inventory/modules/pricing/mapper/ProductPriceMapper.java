package com.erp.inventory.modules.pricing.mapper;

import com.erp.inventory.modules.pricing.dto.request.ProductPriceRequest;
import com.erp.inventory.modules.pricing.dto.response.ProductPriceResponse;
import com.erp.inventory.modules.pricing.entity.ProductPrice;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductPriceMapper {

    ProductPriceResponse toResponse(ProductPrice entity);

    ProductPrice toEntity(ProductPriceRequest request);

    List<ProductPriceResponse> toResponseList(List<ProductPrice> entities);

    void updateEntityFromRequest(ProductPriceRequest request, @MappingTarget ProductPrice entity);
}
