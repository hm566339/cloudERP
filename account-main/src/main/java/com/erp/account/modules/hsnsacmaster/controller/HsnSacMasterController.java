package com.erp.account.modules.hsnsacmaster.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponse;
import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterRequest;
import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterFilterDto;
import com.erp.account.enums.HsnSacType;
import com.erp.account.modules.hsnsacmaster.service.HsnSacMasterService;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.ModelAttribute;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/account/hsn-sac")
@AllArgsConstructor
@Slf4j
public class HsnSacMasterController {

    private final HsnSacMasterService hsnSacMasterService;

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createHsnSacMaster(
            @RequestBody @Valid RequestWrapper<HsnSacMasterRequest> requestWrapper) {
        HsnSacMasterRequest request = requestWrapper.unwrap();
        log.info("Creating HSN/SAC master record code={} type={}", request.getCode(), request.getType());
        PostResponse response = hsnSacMasterService.createHsnSacMaster(requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "HSN/SAC master created successfully"));
    }

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @PutMapping("/{hsnSacId}")
    public ResponseEntity<ApiResponse<PostResponse>> updateHsnSacMaster(
            @PathVariable UUID hsnSacId,
            @RequestBody @Valid RequestWrapper<HsnSacMasterRequest> requestWrapper) {
        HsnSacMasterRequest request = requestWrapper.unwrap();
        log.info("Updating HSN/SAC master id={} code={}", hsnSacId, request.getCode());
        PostResponse response = hsnSacMasterService.updateHsnSacMaster(hsnSacId, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "HSN/SAC master updated successfully"));
    }

    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @DeleteMapping("/{hsnSacId}")
    public ResponseEntity<ApiResponse<PostResponse>> deleteHsnSacMaster(
            @PathVariable UUID hsnSacId) {
        log.info("Deleting HSN/SAC master id={}", hsnSacId);
        PostResponse response = hsnSacMasterService.deleteHsnSacMaster(hsnSacId);
        return ResponseEntity.ok(ApiResponse.success(response, "HSN/SAC master deleted successfully"));
    }

    @GetMapping("/{hsnSacId}")
    public ResponseEntity<ApiResponse<HsnSacMasterResponse>> getHsnSacMasterById(
            @PathVariable UUID hsnSacId) {
        log.info("Retrieving HSN/SAC master id={}", hsnSacId);
        HsnSacMasterResponse response = hsnSacMasterService.getHsnSacMasterById(hsnSacId);
        return ResponseEntity.ok(ApiResponse.success(response, "HSN/SAC master retrieved successfully"));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<HsnSacMasterResponse>> getHsnSacMasterByCode(
            @PathVariable String code) {
        log.info("Retrieving HSN/SAC master code={}", code);
        HsnSacMasterResponse response = hsnSacMasterService.getHsnSacMasterByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response, "HSN/SAC master retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<HsnSacMasterResponseList>> getAllHsnSacMasters(
            @ModelAttribute HsnSacMasterFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        log.info("Searching HSN/SAC master with pagination");

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, resolvedSortBy));

        HsnSacMasterResponseList response = hsnSacMasterService.getAllHsnSacMasters(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "HSN/SAC masters retrieved successfully"));
    }

    @GetMapping("/reports/hsn")
    public ResponseEntity<ApiResponse<List<HsnSacMasterResponse>>> getHsnWiseReport() {
        log.info("Generating HSN-wise report");
        List<HsnSacMasterResponse> response = hsnSacMasterService.generateHsnWiseReport();
        return ResponseEntity.ok(ApiResponse.success(response, "HSN-wise report generated successfully"));
    }

    @GetMapping("/reports/sac")
    public ResponseEntity<ApiResponse<List<HsnSacMasterResponse>>> getSacWiseReport() {
        log.info("Generating SAC-wise report");
        List<HsnSacMasterResponse> response = hsnSacMasterService.generateSacWiseReport();
        return ResponseEntity.ok(ApiResponse.success(response, "SAC-wise report generated successfully"));
    }
}
