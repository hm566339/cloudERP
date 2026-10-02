package com.erp.account.modules.fiscalyear.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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

import com.erp.account.modules.fiscalyear.dto.response.FiscalYearResponse;
import com.erp.account.modules.fiscalyear.dto.response.FiscalYearProfileResponse;
import com.erp.account.modules.fiscalyear.dto.response.FiscalYearResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.fiscalyear.dto.request.FiscalYearFilterDto;
import com.erp.account.modules.fiscalyear.dto.request.FiscalYearRequest;
import com.erp.account.modules.fiscalyear.service.FiscalYearService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/account/fiscal-years")
@AllArgsConstructor
@Slf4j
public class FiscalYearController {

        private final FiscalYearService fiscalYearService;

        @PostMapping
        public ResponseEntity<ApiResponse<PostResponse>> createFiscalYear(
                        @Valid @RequestBody RequestWrapper<FiscalYearRequest> requestWrapper,
                        @RequestParam(required = false) UUID companyId) {
                FiscalYearRequest fiscalYearRequest = requestWrapper.unwrap();

                log.info("Received request to create fiscal year");

                PostResponse response = fiscalYearService.createFiscalYear(requestWrapper, companyId);

                log.info("Fiscal year created successfully");

                return ResponseEntity.ok(ApiResponse.success(response, "Fiscal year created successfully"));
        }

        @PutMapping("/{id}")
        public ResponseEntity<ApiResponse<PostResponse>> updateFiscalYear(
                        @Valid @RequestBody RequestWrapper<FiscalYearRequest> requestWrapper,
                        @PathVariable UUID id) {

                FiscalYearRequest fiscalYearRequest = requestWrapper.unwrap();

                log.info("Received request to update fiscal year with id: {}", id);

                PostResponse response = fiscalYearService.updateFiscalYear(requestWrapper, id);

                log.info("Fiscal year updated successfully with id: {}", id);

                return ResponseEntity.ok(ApiResponse.success(response, "Fiscal year updated successfully"));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<ApiResponse<PostResponse>> deleteFiscalYear(@PathVariable UUID id) {

                log.info("Received request to delete fiscal year with id: {}", id);

                PostResponse response = fiscalYearService.deleteFiscalYear(id);

                log.info("Fiscal year deleted successfully with id: {}", id);

                return ResponseEntity.ok(ApiResponse.success(response, "Fiscal year deleted successfully"));
        }

        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<FiscalYearProfileResponse>> getFiscalYearById(@PathVariable UUID id) {

                log.info("Received request to get fiscal year profile with id: {}", id);

                FiscalYearProfileResponse response = fiscalYearService.getFiscalYearById(id);

                log.info("Fiscal year profile retrieved successfully with id: {}", id);

                return ResponseEntity.ok(ApiResponse.success(response, "Fiscal year profile retrieved successfully"));
        }

        @GetMapping
        public ResponseEntity<ApiResponse<FiscalYearResponseList>> getAllFiscalYears(
                        @ModelAttribute FiscalYearFilterDto filter,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(name = "size", defaultValue = "10") int size,
                        @RequestParam(required = false) String sortBy,
                        @RequestParam(required = false, defaultValue = "desc") String sortDir,
                        @RequestParam(required = false) UUID companyId) {

                log.info("Received request to get all fiscal years with pagination");

                Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
                String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
                Pageable pageable = PageRequest.of(page, size, Sort.by(direction, resolvedSortBy));

                var response = fiscalYearService.getAllFiscalYears(filter, pageable, companyId);

                return ResponseEntity.ok(ApiResponse.success(response, "Fiscal years retrieved successfully"));
        }

        @PatchMapping("/{id}/status")
        public ResponseEntity<ApiResponse<PostResponse>> changeIsClose(
                        @RequestParam boolean status,
                        @PathVariable UUID id) {

                log.info("Received request to change fiscal year status with id: {}, status: {}", id, status);

                PostResponse response = fiscalYearService.changeIsClose(status, id);

                log.info("Fiscal year status changed successfully with id: {}, status: {}", id, status);

                return ResponseEntity.ok(ApiResponse.success(response, "Fiscal year status changed successfully"));
        }

}
