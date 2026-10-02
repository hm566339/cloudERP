package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.CompanyModuleRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.request.UpdateComapnyModule;
import com.erp.auth_service.dto.response.CompanyModuleResponse;
import com.erp.auth_service.dto.response.CompanyModuleResponseList;
import com.erp.auth_service.dto.response.CompanyModulesResposnse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.service.CompanyModuleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/company-modules")
@RequiredArgsConstructor
public class CompanyModuleController {

        private final CompanyModuleService companyModuleService;

        @PostMapping
        public ResponseEntity<ResponseWrapper<Map<String, String>>> createCompanyModule(
                        @Valid @RequestBody RequestWrapper<CompanyModuleRequest> companyModule) {

                return new ResponseEntity<>(
                                ResponseWrapper.success(companyModuleService.createCompanyModule(companyModule.getData())),
                                HttpStatus.CREATED);
        }

        @PutMapping("/{id}")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> updateCompanyModule(
                        @PathVariable UUID id,
                        @Valid @RequestBody RequestWrapper<UpdateComapnyModule> companyModule) {
                                
                return ResponseEntity.ok(
                                ResponseWrapper.success(companyModuleService.updateCompanyModule(id, companyModule.getData())));
        }

        @GetMapping("/company/{companyId}")
        public ResponseEntity<ResponseWrapper<List<CompanyModulesResposnse>>> getCompanyModulesByCompany(
                        @PathVariable UUID companyId,
                        @RequestParam(required = false) Boolean active) {

                return ResponseEntity.ok(
                                ResponseWrapper.success(companyModuleService.getCompanyModulesByCompany(
                                                companyId,
                                                active)));
        }

        @GetMapping("/{id}")
        public ResponseEntity<ResponseWrapper<CompanyModuleResponse>> getCompanyModuleById(
                        @PathVariable UUID id) {
                CompanyModuleResponse response = companyModuleService.getCompanyModuleById(id);
                return ResponseEntity.ok(ResponseWrapper.success(response));
        }

        @GetMapping
        public ResponseEntity<ResponseWrapper<CompanyModuleResponseList>> getAllCompanyModules(
                        @RequestParam int page,
                        @RequestParam int pageSize,
                        @RequestParam(required = false) Boolean active) {

                return ResponseEntity.ok(
                                ResponseWrapper.success(companyModuleService.getAllCompanyModules(
                                                page,
                                                pageSize,
                                                active)));
        }

        @PatchMapping("/{id}/status")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> changeStatus(
                        @PathVariable UUID id,
                        @RequestParam Boolean active) {

                return ResponseEntity.ok(
                                ResponseWrapper.success(companyModuleService.changeStatus(id, active)));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<ResponseWrapper<Map<String, String>>> deleteCompanyModule(
                        @PathVariable UUID id) {

                companyModuleService.deleteCompanyModule(id);

                return ResponseEntity.ok(
                                ResponseWrapper.success(Map.of("message", "Company Module deleted successfully")));
        }
}