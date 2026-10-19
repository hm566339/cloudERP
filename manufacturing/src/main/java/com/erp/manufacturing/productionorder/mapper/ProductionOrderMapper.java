package com.erp.manufacturing.productionorder.mapper;

import com.erp.manufacturing.productionorder.entity.*;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductionOrderMapper {
    ProductionOrder copy(ProductionOrder source);
    ProductionOrderMaterial copy(ProductionOrderMaterial source);
    ProductionOrderOutput copy(ProductionOrderOutput source);
    ProductionOrderBomSnapshot copy(ProductionOrderBomSnapshot source);
    ProductionOrderMaterialSnapshot copy(ProductionOrderMaterialSnapshot source);
}
