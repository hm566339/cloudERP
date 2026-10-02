package com.erp.inventory.modules.batch.mapper;

import com.erp.inventory.modules.batch.dto.request.ProductBatchRequest;
import com.erp.inventory.modules.batch.dto.response.ProductBatchResponse;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductBatchMapper {

    ProductBatchResponse toResponse(ProductBatch entity);

    ProductBatch toEntity(ProductBatchRequest request);

    List<ProductBatchResponse> toResponseList(List<ProductBatch> entities);

    void updateEntityFromRequest(ProductBatchRequest request, @MappingTarget ProductBatch entity);
}
