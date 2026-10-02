package com.erp.inventory.modules.transfer.mapper;

import com.erp.inventory.modules.transfer.dto.request.StockTransferLineRequest;
import com.erp.inventory.modules.transfer.dto.response.StockTransferLineResponse;
import com.erp.inventory.modules.transfer.entity.StockTransferLine;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StockTransferLineMapper {

    StockTransferLineResponse toResponse(StockTransferLine entity);

    StockTransferLine toEntity(StockTransferLineRequest request);

    List<StockTransferLineResponse> toResponseList(List<StockTransferLine> entities);

    void updateEntityFromRequest(StockTransferLineRequest request, @MappingTarget StockTransferLine entity);
}
