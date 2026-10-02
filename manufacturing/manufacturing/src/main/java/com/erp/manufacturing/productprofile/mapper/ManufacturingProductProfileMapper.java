package com.erp.manufacturing.productprofile.mapper;

import com.erp.manufacturing.productprofile.entity.ManufacturingProductProfile;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ManufacturingProductProfileMapper {
    ManufacturingProductProfile copy(ManufacturingProductProfile source);
}
