package com.erp.manufacturing.bom.mapper;

import com.erp.manufacturing.bom.dto.request.BomCreateRequest;
import com.erp.manufacturing.bom.dto.request.BomUpdateRequest;
import com.erp.manufacturing.bom.dto.response.BomResponse;
import com.erp.manufacturing.bom.entity.Bom;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface BomMapper {
    BomResponse toResponse(Bom entity);
    Bom toEntity(BomCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(BomUpdateRequest request, @MappingTarget Bom entity);
}
