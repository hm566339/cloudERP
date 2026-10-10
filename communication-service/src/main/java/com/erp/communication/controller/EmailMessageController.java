package com.erp.communication.controller;

import com.erp.communication.dto.request.SendEmailRequest;
import com.erp.communication.dto.response.CommunicationResponse;
import com.erp.communication.service.CommunicationDispatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/communication/v1/messages/email")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Email Communication", description = "Centralized Email Dispatch API for Mark2 ERP")
public class EmailMessageController {

    private final CommunicationDispatchService dispatchService;

    @PostMapping
    @Operation(summary = "Send email", description = "Dispatches an email synchronously or asynchronously using configured SMTP provider")
    public ResponseEntity<CommunicationResponse> sendEmail(@Valid @RequestBody SendEmailRequest request) {
        log.info("REST: Received email dispatch request | companyId={} | recipient={} | template={}",
                request.getCompanyId(), request.getRecipient(), request.getTemplateCode());
        CommunicationResponse response = dispatchService.dispatchEmail(request);
        return ResponseEntity.ok(response);
    }
}
