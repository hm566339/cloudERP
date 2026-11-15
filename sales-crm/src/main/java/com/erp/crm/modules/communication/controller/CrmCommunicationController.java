package com.erp.crm.modules.communication.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.communication.dto.CallLogRequest;
import com.erp.crm.modules.communication.dto.CallLogResponse;
import com.erp.crm.modules.communication.dto.MessageResponse;
import com.erp.crm.modules.communication.dto.SendMessageRequest;
import com.erp.crm.modules.communication.service.CrmCommunicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm/communication")
@RequiredArgsConstructor
@Tag(name = "Omnichannel Communication", description = "Endpoints for WhatsApp, SMS, Email Threads & Cloud Telephony CDRs")
public class CrmCommunicationController {

    private final CrmCommunicationService communicationService;

    @PostMapping("/send")
    @Operation(summary = "Send Message via WhatsApp / SMS / Email")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @RequestBody @Valid ApiRequest<SendMessageRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        MessageResponse response = communicationService.sendMessage(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Message dispatched successfully"));
    }

    @GetMapping("/messages")
    @Operation(summary = "Get Messages for Conversation Thread")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getConversationMessages(
            @RequestParam UUID conversationId,
            @RequestParam(required = false) UUID companyId) {
        List<MessageResponse> messages = communicationService.getConversationMessages(conversationId, companyId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/telephony/cdr")
    @Operation(summary = "Ingest Cloud Telephony CDR (Exotel / Ozonetel / Asterisk)")
    public ResponseEntity<ApiResponse<CallLogResponse>> logCall(
            @RequestBody @Valid ApiRequest<CallLogRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        CallLogResponse response = communicationService.logCall(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Call CDR logged successfully"));
    }

    @GetMapping("/calls")
    @Operation(summary = "Get Call History for an Entity")
    public ResponseEntity<ApiResponse<List<CallLogResponse>>> getCalls(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            @RequestParam(required = false) UUID companyId) {
        List<CallLogResponse> calls = communicationService.getCallsForEntity(entityType, entityId, companyId);
        return ResponseEntity.ok(ApiResponse.success(calls));
    }
}

