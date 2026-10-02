package com.erp.auth_service.controller.platform;

import com.erp.auth_service.dto.platform.*;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.model.Invoice;
import com.erp.auth_service.model.Payment;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.service.platform.PlatformOrganizationService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.OrganizationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/admin/organizations")
@RequiredArgsConstructor
public class PlatformOrganizationController {

        private final PlatformOrganizationService platformOrganizationService;

        @GetMapping
        public ResponseEntity<ResponseWrapper<Page<PlatformOrganizationSummaryResponse>>> listOrganizations(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(required = false) String search,
                        @RequestParam(required = false) OrganizationStatus status,
                        @RequestParam(required = false) AccessMode accessMode) {

                Page<PlatformOrganizationSummaryResponse> result = platformOrganizationService.listOrganizations(
                                PageRequest.of(page, size), search, status, accessMode);
                return ResponseEntity.ok(ResponseWrapper.success(result));
        }

        @GetMapping("/{organizationId}")
        public ResponseEntity<ResponseWrapper<PlatformOrganizationDetailResponse>> getOrganization(
                        @PathVariable UUID organizationId) {

                return ResponseEntity.ok(ResponseWrapper.success(
                                platformOrganizationService.getOrganizationDetail(organizationId)));
        }

        @GetMapping("/{organizationId}/members")
        public ResponseEntity<ResponseWrapper<List<PlatformMemberSummaryResponse>>> getMembers(
                        @PathVariable UUID organizationId) {

                return ResponseEntity.ok(ResponseWrapper.success(
                                platformOrganizationService.getOrganizationMembers(organizationId)));
        }

        @GetMapping("/{organizationId}/companies")
        public ResponseEntity<ResponseWrapper<List<PlatformCompanySummaryResponse>>> getCompanies(
                        @PathVariable UUID organizationId) {

                return ResponseEntity.ok(ResponseWrapper.success(
                                platformOrganizationService.getOrganizationCompanies(organizationId)));
        }

        @GetMapping("/{organizationId}/subscription")
        public ResponseEntity<ResponseWrapper<Subscription>> getSubscription(
                        @PathVariable UUID organizationId) {

                return ResponseEntity.ok(ResponseWrapper.success(
                                platformOrganizationService.getOrganizationSubscription(organizationId)));
        }

        @GetMapping("/{organizationId}/payments")
        public ResponseEntity<ResponseWrapper<List<Payment>>> getPayments(
                        @PathVariable UUID organizationId) {

                return ResponseEntity.ok(ResponseWrapper.success(
                                platformOrganizationService.getOrganizationPayments(organizationId)));
        }

        @GetMapping("/{organizationId}/invoices")
        public ResponseEntity<ResponseWrapper<List<Invoice>>> getInvoices(
                        @PathVariable UUID organizationId) {

                return ResponseEntity.ok(ResponseWrapper.success(
                                platformOrganizationService.getOrganizationInvoices(organizationId)));
        }
}
