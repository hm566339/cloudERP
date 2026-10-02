package com.erp.account.modules.company.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.erp.account.modules.company.dto.clientdto.CompanyResponseClient;
import com.erp.account.modules.company.dto.response.CompanyResponse;
import com.erp.account.modules.company.dto.response.CompanyResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.company.dto.request.CompanyFilterDto;
import com.erp.account.modules.company.dto.request.CompanyRequest;
import com.erp.account.modules.company.service.CompanyService;
import com.erp.account.modules.company.service.CompanyServiceSys;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.ModelAttribute;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.erp.account.modules.company.entity.Company;

@RestController
@RequestMapping("/api/account/companies")
@Slf4j
@AllArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final CompanyServiceSys companyServiceSys;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createCompany(
            @RequestBody @Valid RequestWrapper<CompanyRequest> companyRequest) {

        log.info("Received request to create company");

        PostResponse response = companyService.createCompany(companyRequest);

        log.info("Company created successfully");

        return ResponseEntity.ok(ApiResponse.success(response, "Company created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> updateCompany(
            @Valid @RequestBody RequestWrapper<CompanyRequest> companyRequestWrapper,
            @PathVariable UUID id) {

        log.info("Received request to update company with id: {}", id);

        PostResponse response = companyService.updateCompany(companyRequestWrapper, id);

        log.info("Company updated successfully with id: {}", id);
        return ResponseEntity.ok(ApiResponse.success(response, "Company updated successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompany(@PathVariable UUID id) {

        log.info("Received request to get company with id: {}", id);

        CompanyResponse response = companyService.getCompany(id);
        log.info("Company retrieved successfully with id: {}", id);
        return ResponseEntity.ok(ApiResponse.success(response, "Company retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CompanyResponseList>> getAllCompany(
            @ModelAttribute CompanyFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {

        log.info("Received request to get all companies with pagination");

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, resolvedSortBy));

        CompanyResponseList response = companyService.getAllCompany(filter, pageable);

        return ResponseEntity.ok(ApiResponse.success(response, "Companies retrieved successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> deleteCompany(@PathVariable UUID id) {

        log.info("Received request to delete company with id: {}", id);

        PostResponse response = companyService.deleteCompany(id);
        log.info("Company deleted successfully with id: {}", id);
        return ResponseEntity.ok(ApiResponse.success(response, "Company deleted successfully"));
    }

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<CompanyResponseClient>> verifyCompany(
            @RequestParam(required = false) UUID id,
            @RequestParam(required = false) String companyCode,
            @RequestHeader("Authorization") String token) {

        CompanyResponseClient response = companyServiceSys.verifyCompany(id, companyCode, token);
        return ResponseEntity.ok(ApiResponse.success(response, "Company verified successfully"));
    }
}
