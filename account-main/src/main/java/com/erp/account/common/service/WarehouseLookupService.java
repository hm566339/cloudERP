package com.erp.account.common.service;

import com.erp.account.common.dto.WarehouseLocationKey;
import com.erp.account.common.dto.WarehouseLocationNameDto;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

public interface WarehouseLookupService {

    /**
     * Resolves warehouse name and location name for the given IDs.
     * Guaranteed never to throw exceptions; returns a DTO with null fields if not found or on error.
     */
    WarehouseLocationNameDto resolveWarehouseAndLocation(UUID warehouseId, UUID locationId);

    /**
     * Batch resolves warehouse and location names for multiple keys.
     */
    Map<WarehouseLocationKey, WarehouseLocationNameDto> resolveAll(Collection<WarehouseLocationKey> keys);

    /**
     * Resolves only warehouse name for the given warehouse ID.
     */
    String resolveWarehouseName(UUID warehouseId);

    /**
     * Clears internal lookup cache.
     */
    void clearCache();
}
