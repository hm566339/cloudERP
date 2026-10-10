package com.erp.communication.controller;

import com.erp.communication.dto.request.SendChannelMessageRequest;
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
@RequestMapping("/api/communication/v1/messages")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Channel Communication", description = "Generic multi-channel dispatch API for Mark2 ERP")
public class CommunicationMessageController {

    private final CommunicationDispatchService dispatchService;

    @PostMapping
    @Operation(summary = "Send channel message", description = "Dispatches a message across supported communication channels. Returns CHANNEL_NOT_SUPPORTED for unimplemented channels.")
    public ResponseEntity<CommunicationResponse> sendMessage(@Valid @RequestBody SendChannelMessageRequest request) {
        log.info("REST: Received channel message request | channel={} | companyId={}",
                request.getChannel(), request.getCompanyId());
        CommunicationResponse response = dispatchService.dispatchChannelMessage(request);
        return ResponseEntity.ok(response);
    }
}
