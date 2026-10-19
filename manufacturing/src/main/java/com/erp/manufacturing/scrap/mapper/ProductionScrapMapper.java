package com.erp.manufacturing.scrap.mapper;

import com.erp.manufacturing.scrap.entity.ProductionScrap;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductionScrapMapper {
    ProductionScrap copy(ProductionScrap source);
}
