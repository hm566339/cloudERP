package com.erp.inventory.modules.transfer.mapper;

import com.erp.inventory.modules.transfer.dto.request.StockTransferRequest;
import com.erp.inventory.modules.transfer.dto.response.StockTransferResponse;
import com.erp.inventory.modules.transfer.entity.StockTransfer;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StockTransferMapper {

    StockTransferResponse toResponse(StockTransfer entity);

    StockTransfer toEntity(StockTransferRequest request);

    List<StockTransferResponse> toResponseList(List<StockTransfer> entities);

    void updateEntityFromRequest(StockTransferRequest request, @MappingTarget StockTransfer entity);
}
