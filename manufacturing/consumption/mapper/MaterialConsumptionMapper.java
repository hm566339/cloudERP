package com.erp.manufacturing.consumption.mapper;

import com.erp.manufacturing.consumption.entity.MaterialConsumption;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MaterialConsumptionMapper {
    MaterialConsumption copy(MaterialConsumption source);
}
