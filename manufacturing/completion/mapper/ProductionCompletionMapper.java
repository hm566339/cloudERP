package com.erp.manufacturing.completion.mapper;

import com.erp.manufacturing.completion.entity.*;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductionCompletionMapper {
    ProductionCompletion copy(ProductionCompletion source);
    ProductionCompletionLine copy(ProductionCompletionLine source);
}
