package com.erp.manufacturing.genealogy.mapper;

import com.erp.manufacturing.genealogy.entity.ProductionGenealogy;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductionGenealogyMapper {
    ProductionGenealogy copy(ProductionGenealogy source);
}
