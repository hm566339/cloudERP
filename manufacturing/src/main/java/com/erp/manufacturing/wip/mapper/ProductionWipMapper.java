package com.erp.manufacturing.wip.mapper;

import com.erp.manufacturing.wip.entity.ProductionWip;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductionWipMapper {
    ProductionWip copy(ProductionWip source);
}
