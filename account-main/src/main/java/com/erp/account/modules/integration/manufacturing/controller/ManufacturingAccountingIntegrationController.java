package com.erp.account.modules.integration.manufacturing.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.integration.manufacturing.dto.ManufacturingJournalRequest;
import com.erp.account.modules.integration.manufacturing.dto.ManufacturingJournalResponse;
import com.erp.account.modules.integration.manufacturing.service.ManufacturingAccountingIntegrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account/integration/manufacturing")
@RequiredArgsConstructor
public class ManufacturingAccountingIntegrationController {
    private final ManufacturingAccountingIntegrationService service;

    @PostMapping("/journals")
    public ResponseEntity<ApiResponse<ManufacturingJournalResponse>> postJournal(
            @Valid @RequestBody ManufacturingJournalRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.post(request),
                "Manufacturing journal posted successfully"));
    }
}
