package com.erp.inventory.modules.warehouse.service;

import java.util.UUID;

import com.erp.inventory.modules.warehouse.dto.request.WarehouseAccountRequest;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseAccountResponse;

public interface WarehouseAccountService {

    public WarehouseAccountResponse getWarehouseAccount(WarehouseAccountRequest request);

}
