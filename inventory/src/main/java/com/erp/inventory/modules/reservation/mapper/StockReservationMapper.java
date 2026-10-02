package com.erp.inventory.modules.reservation.mapper;

import com.erp.inventory.modules.reservation.dto.request.StockReservationRequest;
import com.erp.inventory.modules.reservation.dto.response.StockReservationResponse;
import com.erp.inventory.modules.reservation.entity.StockReservation;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StockReservationMapper {

    StockReservationResponse toResponse(StockReservation entity);

    StockReservation toEntity(StockReservationRequest request);

    List<StockReservationResponse> toResponseList(List<StockReservation> entities);

    void updateEntityFromRequest(StockReservationRequest request, @MappingTarget StockReservation entity);
}
