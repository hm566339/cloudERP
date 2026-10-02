package com.erp.manufacturing.bom.mapper;

import com.erp.manufacturing.bom.dto.response.BomRevisionResponse;
import com.erp.manufacturing.bom.entity.BomRevision;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BomRevisionMapper {
    @Mapping(target = "bomId", source = "bom.id")
    BomRevisionResponse toResponse(BomRevision entity);
}
