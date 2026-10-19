package com.erp.manufacturing.integration.accounting.client;

import com.erp.manufacturing.integration.accounting.dto.AccountingJournalRequest;
import com.erp.manufacturing.integration.accounting.dto.AccountingJournalResponse;
import com.erp.manufacturing.integration.inventory.config.FeignClientConfig;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "accountingFeignClient", url = "${service.api.account:http://localhost:8081}", configuration = FeignClientConfig.class)
public interface AccountingFeignClient {
    @PostMapping("/api/account/integration/manufacturing/journals")
    ResponseEntity<InventoryApiResponse<AccountingJournalResponse>> postManufacturingJournal(
            @RequestBody AccountingJournalRequest request);
}
