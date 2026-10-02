package com.erp.account.modules.gstslab.controller;

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
import org.springframework.web.bind.annotation.ModelAttribute;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.erp.account.modules.gstslab.dto.response.GstSlabResponse;
import com.erp.account.modules.gstslab.dto.response.GstSlabResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.gstslab.dto.request.GstSlabFilterDto;
import com.erp.account.modules.gstslab.dto.request.GstSlabRequest;
import com.erp.account.modules.gstslab.service.GstSlabService;
import com.erp.account.util.TenantUtils;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/account/gst-slabs")
@AllArgsConstructor
@Slf4j
public class GstSlabController {

    private final GstSlabService gstSlabService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createGstSlab(
            @Valid @RequestBody RequestWrapper<GstSlabRequest> requestWrapper) {
        log.info("Received request to create GST slab");
        PostResponse response = gstSlabService.createGstSlab(requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "GST slab created successfully"));
    }

    @PutMapping("/{gstSlabId}")
    public ResponseEntity<ApiResponse<PostResponse>> updateGstSlab(
            @Valid @RequestBody RequestWrapper<GstSlabRequest> requestWrapper,
            @PathVariable UUID gstSlabId) {

        GstSlabRequest request = requestWrapper.unwrap();
        log.info("Received request to update GST slab id={}", gstSlabId);
        PostResponse response = gstSlabService.updateGstSlab(requestWrapper, gstSlabId);
        return ResponseEntity.ok(ApiResponse.success(response, "GST slab updated successfully"));
    }

    @GetMapping("/{gstSlabId}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Get GST slab by ID with full profile")
    public ResponseEntity<ApiResponse<com.erp.account.modules.gstslab.dto.response.GstSlabProfileResponse>> getGstSlabById(
            @PathVariable UUID gstSlabId) {
        log.info("Received request to fetch GST slab with ID: {}", gstSlabId);

        com.erp.account.modules.gstslab.dto.response.GstSlabProfileResponse response = gstSlabService
                .getGstSlabById(gstSlabId);
        return ResponseEntity.ok(ApiResponse.success(response, "GST slab retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<GstSlabResponseList>> getAllGstSlabs(
            @ModelAttribute GstSlabFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {

        log.info("Received request to list GST slabs with pagination");

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, resolvedSortBy));

        GstSlabResponseList response = gstSlabService.getAllGstSlabs(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "GST slabs retrieved successfully"));
    }

    @DeleteMapping("/{gstSlabId}")
    public ResponseEntity<ApiResponse<PostResponse>> deleteGstSlab(
            @PathVariable UUID gstSlabId) {

        log.info("Received request to delete GST slab id={}", gstSlabId);
        PostResponse response = gstSlabService.deleteGstSlab(gstSlabId);
        return ResponseEntity.ok(ApiResponse.success(response, "GST slab deleted successfully"));
    }
}
