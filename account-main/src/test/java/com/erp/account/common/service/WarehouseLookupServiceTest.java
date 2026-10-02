package com.erp.account.common.service;

import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.WarehouseLocationKey;
import com.erp.account.common.dto.WarehouseLocationNameDto;
import com.erp.account.common.dto.inventory.response.WarehouseAccountResponse;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.service.impl.WarehouseLookupServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WarehouseLookupServiceTest {

    @Mock
    private InventoryClient inventoryClient;

    @InjectMocks
    private WarehouseLookupServiceImpl lookupService;

    private UUID warehouseId;
    private UUID locationId;

    @BeforeEach
    void setUp() {
        warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID();
        lookupService.clearCache();
    }

    @Test
    void resolveWarehouseAndLocation_nullWarehouseId_returnsEmptyDto() {
        WarehouseLocationNameDto result = lookupService.resolveWarehouseAndLocation(null, locationId);
        assertNotNull(result);
        assertNull(result.getWarehouseName());
        assertNull(result.getLocationName());
        verifyNoInteractions(inventoryClient);
    }

    @Test
    void resolveWarehouseAndLocation_success_fetchesAndCaches() {
        WarehouseAccountResponse respData = WarehouseAccountResponse.builder()
                .warehouseId(warehouseId)
                .warehouseName("Central Warehouse")
                .warehouseLocation(locationId)
                .warehouseLocationName("Bay 12")
                .build();

        ApiResponse<WarehouseAccountResponse> apiResponse = ApiResponse.success(respData, "Success");
        when(inventoryClient.getWarehouseAccount(any()))
                .thenReturn(new ResponseEntity<>(apiResponse, HttpStatus.OK));

        // First call: calls client
        WarehouseLocationNameDto dto1 = lookupService.resolveWarehouseAndLocation(warehouseId, locationId);
        assertNotNull(dto1);
        assertEquals("Central Warehouse", dto1.getWarehouseName());
        assertEquals("Bay 12", dto1.getLocationName());
        verify(inventoryClient, times(1)).getWarehouseAccount(any());

        // Second call: returns from cache without calling client again
        WarehouseLocationNameDto dto2 = lookupService.resolveWarehouseAndLocation(warehouseId, locationId);
        assertNotNull(dto2);
        assertEquals("Central Warehouse", dto2.getWarehouseName());
        assertEquals("Bay 12", dto2.getLocationName());
        verify(inventoryClient, times(1)).getWarehouseAccount(any());

        // Call resolveWarehouseName on same warehouseId: should also use primed cache
        String whName = lookupService.resolveWarehouseName(warehouseId);
        assertEquals("Central Warehouse", whName);
        verify(inventoryClient, times(1)).getWarehouseAccount(any());
    }

    @Test
    void resolveWarehouseAndLocation_exceptionInClient_returnsFallbackWithoutThrowing() {
        when(inventoryClient.getWarehouseAccount(any()))
                .thenThrow(new RuntimeException("Inventory MS connection timeout"));

        WarehouseLocationNameDto result = lookupService.resolveWarehouseAndLocation(warehouseId, locationId);
        assertNotNull(result);
        assertNull(result.getWarehouseName());
        assertNull(result.getLocationName());
    }

    @Test
    void resolveAll_resolvesMultipleEntries() {
        UUID wh2 = UUID.randomUUID();
        UUID loc2 = UUID.randomUUID();

        WarehouseAccountResponse resp1 = WarehouseAccountResponse.builder()
                .warehouseId(warehouseId)
                .warehouseName("WH 1")
                .warehouseLocation(locationId)
                .warehouseLocationName("LOC 1")
                .build();

        WarehouseAccountResponse resp2 = WarehouseAccountResponse.builder()
                .warehouseId(wh2)
                .warehouseName("WH 2")
                .warehouseLocation(loc2)
                .warehouseLocationName("LOC 2")
                .build();

        when(inventoryClient.getWarehouseAccount(any()))
                .thenReturn(new ResponseEntity<>(ApiResponse.success(resp1, "OK"), HttpStatus.OK))
                .thenReturn(new ResponseEntity<>(ApiResponse.success(resp2, "OK"), HttpStatus.OK));

        WarehouseLocationKey key1 = new WarehouseLocationKey(warehouseId, locationId);
        WarehouseLocationKey key2 = new WarehouseLocationKey(wh2, loc2);
        WarehouseLocationKey keyNull = new WarehouseLocationKey(null, null);

        Map<WarehouseLocationKey, WarehouseLocationNameDto> resultMap = lookupService.resolveAll(List.of(key1, key2, keyNull));

        assertEquals(2, resultMap.size());
        assertTrue(resultMap.containsKey(key1));
        assertEquals("WH 1", resultMap.get(key1).getWarehouseName());
        assertEquals("LOC 1", resultMap.get(key1).getLocationName());
        assertTrue(resultMap.containsKey(key2));
        assertEquals("WH 2", resultMap.get(key2).getWarehouseName());
        assertEquals("LOC 2", resultMap.get(key2).getLocationName());
    }

    @Test
    void clearCache_evictsEntries() {
        WarehouseAccountResponse respData = WarehouseAccountResponse.builder()
                .warehouseId(warehouseId)
                .warehouseName("Central Warehouse")
                .warehouseLocation(locationId)
                .warehouseLocationName("Bay 12")
                .build();

        when(inventoryClient.getWarehouseAccount(any()))
                .thenReturn(new ResponseEntity<>(ApiResponse.success(respData, "OK"), HttpStatus.OK));

        lookupService.resolveWarehouseAndLocation(warehouseId, locationId);
        verify(inventoryClient, times(1)).getWarehouseAccount(any());

        lookupService.clearCache();

        lookupService.resolveWarehouseAndLocation(warehouseId, locationId);
        verify(inventoryClient, times(2)).getWarehouseAccount(any());
    }
}
