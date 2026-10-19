package com.erp.manufacturing.cost.mapper;

import com.erp.manufacturing.cost.entity.ProductionCost;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductionCostMapper {
    ProductionCost copy(ProductionCost source);
}
