package com.erp.manufacturing.outbox.mapper;

import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ManufacturingOutboxMapper {
    ManufacturingOutbox copy(ManufacturingOutbox source);
}
