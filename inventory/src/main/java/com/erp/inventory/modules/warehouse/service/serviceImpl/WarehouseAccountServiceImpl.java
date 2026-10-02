package com.erp.inventory.modules.warehouse.service.serviceImpl;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseAccountRequest;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseAccountResponse;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.warehouse.service.WarehouseAccountService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WarehouseAccountServiceImpl implements WarehouseAccountService {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;

    @Override
    public WarehouseAccountResponse getWarehouseAccount(WarehouseAccountRequest request) {

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        WarehouseLocation warehouseLocation = warehouseLocationRepository.findById(request.getWarehouseLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse Location not found"));

        return WarehouseAccountResponse.builder()
                .warehouseId(warehouse.getId())
                .warehouseLocation(warehouseLocation.getId())
                .warehouseName(warehouse.getWarehouseName())
                .warehouseLocationName(warehouseLocation.getLocationName())
                .createdAt(warehouse.getCreatedAt())
                .updatedAt(warehouse.getUpdatedAt())
                .build();

    }

}
