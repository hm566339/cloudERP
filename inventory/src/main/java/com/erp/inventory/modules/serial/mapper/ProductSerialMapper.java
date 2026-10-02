package com.erp.inventory.modules.serial.mapper;

import com.erp.inventory.modules.serial.dto.request.ProductSerialRequest;
import com.erp.inventory.modules.serial.dto.response.ProductSerialResponse;
import com.erp.inventory.modules.serial.entity.ProductSerial;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductSerialMapper {

    ProductSerialResponse toResponse(ProductSerial entity);

    ProductSerial toEntity(ProductSerialRequest request);

    List<ProductSerialResponse> toResponseList(List<ProductSerial> entities);

    void updateEntityFromRequest(ProductSerialRequest request, @MappingTarget ProductSerial entity);
}
