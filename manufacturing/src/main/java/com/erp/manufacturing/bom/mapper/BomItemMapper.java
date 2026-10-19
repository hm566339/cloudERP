package com.erp.manufacturing.bom.mapper;

import com.erp.manufacturing.bom.dto.response.BomItemResponse;
import com.erp.manufacturing.bom.entity.BomItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BomItemMapper {
    @Mapping(target = "bomRevisionId", source = "bomRevision.id")
    BomItemResponse toResponse(BomItem entity);
}
