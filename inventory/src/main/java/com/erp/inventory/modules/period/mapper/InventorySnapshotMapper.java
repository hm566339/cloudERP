package com.erp.inventory.modules.period.mapper;

import com.erp.inventory.modules.period.dto.request.InventorySnapshotRequest;
import com.erp.inventory.modules.period.dto.response.InventorySnapshotResponse;
import com.erp.inventory.modules.period.entity.InventorySnapshot;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InventorySnapshotMapper {

    InventorySnapshotResponse toResponse(InventorySnapshot entity);

    InventorySnapshot toEntity(InventorySnapshotRequest request);

    List<InventorySnapshotResponse> toResponseList(List<InventorySnapshot> entities);

    void updateEntityFromRequest(InventorySnapshotRequest request, @MappingTarget InventorySnapshot entity);
}
