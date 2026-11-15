package com.erp.crm.modules.account.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.account.dto.request.ContactCreateRequest;
import com.erp.crm.modules.account.dto.response.ContactResponse;
import com.erp.crm.modules.account.service.CrmContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm/contacts")
@RequiredArgsConstructor
@Tag(name = "Contact Management", description = "Endpoints for Decision Makers, Stakeholders & Multi-Account Contacts")
public class CrmContactController {

    private final CrmContactService contactService;

    @PostMapping
    @Operation(summary = "Create Contact")
    public ResponseEntity<ApiResponse<ContactResponse>> createContact(
            @RequestBody @Valid ApiRequest<ContactCreateRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ContactResponse response = contactService.createContact(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Contact created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Contact Details by ID")
    public ResponseEntity<ApiResponse<ContactResponse>> getContactById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ContactResponse response = contactService.getContactById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "List Contacts (Paginated)")
    public ResponseEntity<ApiResponse<List<ContactResponse>>> getContacts(
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        if (accountId != null) {
            List<ContactResponse> list = contactService.getContactsByAccountId(accountId, companyId);
            return ResponseEntity.ok(ApiResponse.success(list));
        }
        Page<ContactResponse> page = contactService.getAllContacts(companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Contacts fetched successfully"));
    }
}

