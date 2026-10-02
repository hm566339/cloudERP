package com.erp.account.modules.debitnote.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.debitnote.dto.request.DebitNoteFilterDto;
import com.erp.account.modules.debitnote.dto.request.DebitNoteRequest;
import com.erp.account.modules.debitnote.dto.response.DebitNoteResponse;
import com.erp.account.modules.debitnote.service.DebitNoteService;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;

import com.erp.account.modules.debitnote.dto.response.profile.DebitNoteProfileResponse;
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
@RequestMapping("/api/account/debit-notes")
@RequiredArgsConstructor
public class DebitNoteController {

    private final DebitNoteService debitNoteService;

    @PostMapping
    public ResponseEntity<ApiResponse<DebitNoteResponse>> createDebitNote(
            @Valid @RequestBody RequestWrapper<DebitNoteRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        DebitNoteRequest request = requestWrapper.unwrap();
        DebitNoteResponse response = debitNoteService.createDebitNote(companyId, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Debit note created successfully"));
    }

    @GetMapping("/{debitNoteId}")
    public ResponseEntity<ApiResponse<DebitNoteProfileResponse>> getDebitNote(
            @PathVariable UUID debitNoteId) {
        DebitNoteProfileResponse response = debitNoteService.getDebitNoteProfileById(debitNoteId);
        return ResponseEntity.ok(ApiResponse.success(response, "Debit Note retrieved successfully."));
    }

    @PutMapping("/{debitNoteId}")
    public ResponseEntity<ApiResponse<DebitNoteResponse>> updateDebitNote(
            @PathVariable UUID debitNoteId,
            @Valid @RequestBody RequestWrapper<DebitNoteRequest> requestWrapper) {
        DebitNoteResponse response = debitNoteService.updateDebitNote(debitNoteId, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Debit note updated successfully."));
    }

    @DeleteMapping("/{debitNoteId}")
    public ResponseEntity<ApiResponse<Void>> deleteDebitNote(@PathVariable UUID debitNoteId) {
        debitNoteService.deleteDebitNote(debitNoteId);
        return ResponseEntity.ok(ApiResponse.success(null, "Debit note deleted successfully."));
    }

    @PostMapping("/{debitNoteId}/approve")
    public ResponseEntity<ApiResponse<DebitNoteResponse>> approveDebitNote(@PathVariable UUID debitNoteId) {
        DebitNoteResponse response = debitNoteService.approveDebitNote(debitNoteId);
        return ResponseEntity.ok(ApiResponse.success(response, "Debit note approved successfully"));
    }

    @PostMapping("/{debitNoteId}/post")
    public ResponseEntity<ApiResponse<DebitNoteResponse>> postDebitNote(@PathVariable UUID debitNoteId) {
        DebitNoteResponse response = debitNoteService.postDebitNote(debitNoteId);
        return ResponseEntity.ok(ApiResponse.success(response, "Debit note posted successfully"));
    }

    @PostMapping("/{debitNoteId}/reverse")
    public ResponseEntity<ApiResponse<DebitNoteResponse>> reverseDebitNote(@PathVariable UUID debitNoteId) {
        DebitNoteResponse response = debitNoteService.reverseDebitNote(debitNoteId);
        return ResponseEntity.ok(ApiResponse.success(response, "Debit note reversed successfully"));
    }

    @PostMapping("/{debitNoteId}/cancel")
    public ResponseEntity<ApiResponse<DebitNoteResponse>> cancelDebitNote(@PathVariable UUID debitNoteId) {
        DebitNoteResponse response = debitNoteService.cancelDebitNote(debitNoteId);
        return ResponseEntity.ok(ApiResponse.success(response, "Debit note cancelled successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DebitNoteResponse>>> getDebitNotes(
            @ModelAttribute DebitNoteFilterDto filter,
            Pageable pageable) {
        Page<DebitNoteResponse> page = debitNoteService.getAllDebitNotes(filter, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Debit notes retrieved successfully"));
    }
}
