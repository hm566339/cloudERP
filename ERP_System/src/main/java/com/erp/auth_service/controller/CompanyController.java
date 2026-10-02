package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.CompanyRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.response.ComapanyOpenResponse;
import com.erp.auth_service.dto.response.CompanyListResponse;
import com.erp.auth_service.dto.response.CompanyResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/company")
@RequiredArgsConstructor
public class CompanyController {

        private final CompanyService companyService;

        @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
        public ResponseEntity<ResponseWrapper<Map<String, String>>> createCompany(
                        @RequestHeader("Authorization") String token,
                        @RequestPart("request") @Valid RequestWrapper<CompanyRequest> request,
                        @RequestPart(value = "logo", required = false) MultipartFile logo) {

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(ResponseWrapper.success(
                                                companyService.createCompany(request.getData(), logo, token)));
        }

        @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
        public ResponseEntity<ResponseWrapper<Map<String, String>>> updateCompany(
                        @PathVariable UUID id,
                        @RequestPart("request") @Valid RequestWrapper<CompanyRequest> request,
                        @RequestPart(value = "logo", required = false) MultipartFile logo) {

                return ResponseEntity
                                .ok(ResponseWrapper.success(companyService.updateCompany(id, request.getData(), logo)));
        }

        @GetMapping("/{id}")
        public ResponseEntity<ResponseWrapper<CompanyResponse>> getCompanyById(
                        @PathVariable UUID id) {

                return ResponseEntity.ok(ResponseWrapper.success(companyService.getCompanyById(id)));
        }

        @GetMapping("/code/{companyCode}")
        public ResponseEntity<ResponseWrapper<CompanyResponse>> getCompanyByCode(
                        @PathVariable String companyCode) {

                return ResponseEntity.ok(ResponseWrapper.success(companyService.getCompanyByCode(companyCode)));
        }

        @GetMapping
        public ResponseEntity<ResponseWrapper<CompanyListResponse>> getAllCompanies(

                        @RequestParam int page,

                        @RequestParam int pageSize,

                        @RequestParam(required = false) String search,

                        @RequestParam(required = false) Boolean active) {

                return ResponseEntity.ok(ResponseWrapper.success(
                                companyService.getAllCompanies(
                                                page,
                                                pageSize,
                                                search,
                                                active)));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<ResponseWrapper<Map<String, Object>>> deleteCompany(
                        @PathVariable UUID id) {

                companyService.deleteCompany(id);

                return ResponseEntity.ok(ResponseWrapper.success(Map.of()));
        }

        @PatchMapping("/{id}/status")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> changeStatus(
                        @PathVariable UUID id,
                        @RequestParam Boolean active) {

                return ResponseEntity.ok(ResponseWrapper.success(companyService.changeStatus(id, active)));
        }

        @GetMapping("/open")
        public ResponseEntity<ResponseWrapper<List<ComapanyOpenResponse>>> getCompanyOpenByCode() {
                return ResponseEntity.ok(ResponseWrapper.success(companyService.getCompanyOpenByCode()));
        }

        @GetMapping("/company-verify")
        public ResponseEntity<ResponseWrapper<CompanyResponse>> verifyCompany(
                        @RequestParam(required = false) UUID id,
                        @RequestParam(required = false) String companyCode) {

                return ResponseEntity.ok(
                                ResponseWrapper.success(companyService.verifyCompany(id, companyCode)));
        }
}