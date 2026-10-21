package com.erp.account.modules.receiptvoucher.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherFilterDto;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherRequest;
import com.erp.account.modules.receiptvoucher.dto.response.ReceiptVoucherResponse;
import com.erp.account.modules.receiptvoucher.dto.response.profile.ReceiptVoucherProfileResponse;
import com.erp.account.modules.receiptvoucher.service.ReceiptVoucherService;
import jakarta.validation.Valid;

import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account/receipts")
@RequiredArgsConstructor
public class ReceiptVoucherController {

    private final ReceiptVoucherService service;

    @PostMapping
    public ResponseEntity<java.util.Map<String, Object>> create(
            @Valid @RequestBody RequestWrapper<ReceiptVoucherRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        ReceiptVoucherResponse response = service.createReceipt(companyId, requestWrapper);
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("success", true);
        result.put("message", "Receipt created successfully.");
        result.put("id", response.getId());
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReceiptVoucherResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ReceiptVoucherRequest> requestWrapper) {
        return ResponseEntity.ok(service.updateReceipt(id, requestWrapper));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceiptVoucherProfileResponse> getById(@PathVariable UUID id) {
        UUID companyId = com.erp.account.util.TenantUtils.getCurrentCompanyId();
        return ResponseEntity.ok(service.getReceiptProfile(companyId, id));
    }

    @GetMapping
    public ResponseEntity<Page<ReceiptVoucherResponse>> list(@ModelAttribute ReceiptVoucherFilterDto filter,
            Pageable pageable) {
        return ResponseEntity.ok(service.getReceipts(filter, pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UUID companyId = com.erp.account.util.TenantUtils.getCurrentCompanyId();
        service.deleteReceipt(companyId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping({ "/{id}/submit", "/{id}/submit-approval", "/{id}/submit-for-approval" })
    public ResponseEntity<Map<String, Object>> submit(
            @PathVariable UUID id,
            @RequestParam(required = false) String comments,
            @RequestBody(required = false) Map<String, String> body) {
        String effectiveComments = comments != null ? comments : (body != null ? body.get("comments") : null);
        service.submitForApproval(id, effectiveComments);
        return ResponseEntity.ok(Map.of("success", true, "message", "Receipt submitted successfully."));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approve(@PathVariable UUID id) {
        service.approveReceipt(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Receipt approved successfully."));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> reject(@PathVariable UUID id) {
        service.rejectReceipt(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Receipt rejected successfully."));
    }

    @PostMapping("/{id}/post")
    public ResponseEntity<Map<String, Object>> post(@PathVariable UUID id) {
        service.postReceipt(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Receipt posted successfully."));
    }

    @PostMapping("/{id}/reverse")
    public ResponseEntity<Map<String, Object>> reverse(@PathVariable UUID id) {
        service.reverseReceipt(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Receipt reversed successfully."));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancel(@PathVariable UUID id) {
        service.cancelReceipt(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Receipt cancelled successfully."));
    }
}
