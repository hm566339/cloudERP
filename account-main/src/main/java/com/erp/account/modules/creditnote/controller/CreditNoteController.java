package com.erp.account.modules.creditnote.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.creditnote.dto.request.CreditNoteFilterDto;
import com.erp.account.modules.creditnote.dto.request.CreditNoteRequest;
import com.erp.account.modules.creditnote.dto.response.CreditNoteResponse;
import com.erp.account.modules.creditnote.service.CreditNoteService;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/credit-notes")
@RequiredArgsConstructor
public class CreditNoteController {

    private final CreditNoteService creditNoteService;

    @PostMapping
    public ResponseEntity<ApiResponse<CreditNoteResponse>> createCreditNote(
            @Valid @RequestBody RequestWrapper<CreditNoteRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        CreditNoteRequest request = requestWrapper.unwrap();
        CreditNoteResponse response = creditNoteService.createCreditNote(companyId, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Credit note created successfully"));
    }

    @GetMapping("/{creditNoteId}")
    public ResponseEntity<ApiResponse<com.erp.account.modules.creditnote.dto.response.profile.CreditNoteProfileResponse>> getCreditNote(
            @PathVariable UUID creditNoteId) {
        com.erp.account.modules.creditnote.dto.response.profile.CreditNoteProfileResponse response = creditNoteService
                .getCreditNoteProfileById(creditNoteId);
        return ResponseEntity.ok(ApiResponse.success(response, "Credit note retrieved successfully"));
    }

    @PutMapping("/{creditNoteId}")
    public ResponseEntity<ApiResponse<CreditNoteResponse>> updateCreditNote(
            @PathVariable UUID creditNoteId,
            @Valid @RequestBody RequestWrapper<CreditNoteRequest> requestWrapper) {
        CreditNoteResponse response = creditNoteService.updateCreditNote(creditNoteId, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Credit note updated successfully"));
    }

    @DeleteMapping("/{creditNoteId}")
    public ResponseEntity<ApiResponse<Void>> deleteCreditNote(@PathVariable UUID creditNoteId) {
        creditNoteService.deleteCreditNote(creditNoteId);
        return ResponseEntity.ok(ApiResponse.success(null, "Credit note deleted successfully"));
    }

    @PostMapping("/{creditNoteId}/submit")
    public ResponseEntity<java.util.Map<String, Object>> submitCreditNote(@PathVariable UUID creditNoteId) {
        creditNoteService.submitCreditNote(creditNoteId);
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Credit Note submitted successfully."));
    }

    @PostMapping("/{creditNoteId}/approve")
    public ResponseEntity<java.util.Map<String, Object>> approveCreditNote(@PathVariable UUID creditNoteId) {
        creditNoteService.approveCreditNote(creditNoteId);
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Credit Note approved successfully."));
    }

    @PostMapping("/{creditNoteId}/reject")
    public ResponseEntity<java.util.Map<String, Object>> rejectCreditNote(@PathVariable UUID creditNoteId) {
        creditNoteService.rejectCreditNote(creditNoteId);
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Credit Note rejected successfully."));
    }

    @PostMapping("/{creditNoteId}/post")
    public ResponseEntity<java.util.Map<String, Object>> postCreditNote(@PathVariable UUID creditNoteId) {
        creditNoteService.postCreditNote(creditNoteId);
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Credit Note posted successfully."));
    }

    @PostMapping("/{creditNoteId}/reverse")
    public ResponseEntity<java.util.Map<String, Object>> reverseCreditNote(@PathVariable UUID creditNoteId) {
        creditNoteService.reverseCreditNote(creditNoteId);
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Credit Note reversed successfully."));
    }

    @PostMapping("/{creditNoteId}/cancel")
    public ResponseEntity<java.util.Map<String, Object>> cancelCreditNote(@PathVariable UUID creditNoteId) {
        creditNoteService.cancelCreditNote(creditNoteId);
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Credit Note cancelled successfully."));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CreditNoteResponse>>> getCreditNotes(
            @ModelAttribute CreditNoteFilterDto filter,
            Pageable pageable) {
        Page<CreditNoteResponse> page = creditNoteService.getAllCreditNotes(filter, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Credit notes retrieved successfully"));
    }
}
