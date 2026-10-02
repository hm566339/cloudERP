package com.erp.manufacturing.bom.mapper;

import com.erp.manufacturing.bom.dto.response.BomOutputResponse;
import com.erp.manufacturing.bom.entity.BomOutput;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BomOutputMapper {
    @Mapping(target = "bomRevisionId", source = "bomRevision.id")
    BomOutputResponse toResponse(BomOutput entity);
}
