package com.erp.account.common.service.impl;

import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.WarehouseLocationKey;
import com.erp.account.common.dto.WarehouseLocationNameDto;
import com.erp.account.common.dto.inventory.request.WarehouseAccountRequest;
import com.erp.account.common.dto.inventory.response.WarehouseAccountResponse;
import com.erp.account.common.dto.request.ApiRequest;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.service.WarehouseLookupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarehouseLookupServiceImpl implements WarehouseLookupService {

    private final InventoryClient inventoryClient;
    private final Map<WarehouseLocationKey, WarehouseLocationNameDto> cache = new ConcurrentHashMap<>();

    @Override
    public WarehouseLocationNameDto resolveWarehouseAndLocation(UUID warehouseId, UUID locationId) {
        if (warehouseId == null) {
            return new WarehouseLocationNameDto(null, null);
        }

        WarehouseLocationKey key = new WarehouseLocationKey(warehouseId, locationId);
        if (cache.containsKey(key)) {
            return cache.get(key);
        }

        try {
            ApiRequest<WarehouseAccountRequest> request = new ApiRequest<>();
            request.setData(WarehouseAccountRequest.builder()
                    .warehouseId(warehouseId)
                    .warehouseLocationId(locationId)
                    .build());

            ResponseEntity<ApiResponse<WarehouseAccountResponse>> responseEntity = inventoryClient.getWarehouseAccount(request);
            if (responseEntity != null && responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                ApiResponse<WarehouseAccountResponse> body = responseEntity.getBody();
                if (body.isSuccess() && body.getData() != null) {
                    WarehouseAccountResponse data = body.getData();
                    WarehouseLocationNameDto dto = WarehouseLocationNameDto.builder()
                            .warehouseName(data.getWarehouseName())
                            .locationName(data.getWarehouseLocationName())
                            .build();

                    cache.put(key, dto);
                    if (locationId != null && data.getWarehouseName() != null) {
                        cache.putIfAbsent(new WarehouseLocationKey(warehouseId, null),
                                WarehouseLocationNameDto.builder().warehouseName(data.getWarehouseName()).build());
                    }
                    return dto;
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch warehouse/location names from Inventory MS for warehouseId={}, locationId={}: {}",
                    warehouseId, locationId, e.getMessage());
        }

        WarehouseLocationNameDto fallback = new WarehouseLocationNameDto(null, null);
        return fallback;
    }

    @Override
    public Map<WarehouseLocationKey, WarehouseLocationNameDto> resolveAll(Collection<WarehouseLocationKey> keys) {
        if (keys == null || keys.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<WarehouseLocationKey, WarehouseLocationNameDto> result = new HashMap<>();
        for (WarehouseLocationKey key : keys) {
            if (key == null || key.getWarehouseId() == null) {
                continue;
            }
            WarehouseLocationNameDto dto = resolveWarehouseAndLocation(key.getWarehouseId(), key.getLocationId());
            if (dto != null && (dto.getWarehouseName() != null || dto.getLocationName() != null)) {
                result.put(key, dto);
            }
        }
        return result;
    }

    @Override
    public String resolveWarehouseName(UUID warehouseId) {
        if (warehouseId == null) {
            return null;
        }
        WarehouseLocationNameDto dto = resolveWarehouseAndLocation(warehouseId, null);
        return dto != null ? dto.getWarehouseName() : null;
    }

    @Override
    public void clearCache() {
        cache.clear();
    }
}
