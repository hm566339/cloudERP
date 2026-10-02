package com.erp.account.modules.gst.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.request.ApiRequest;
import com.erp.account.modules.gst.dto.request.GstRegistrationRequest;
import com.erp.account.modules.gst.dto.request.GstStateRequest;
import com.erp.account.modules.gst.dto.response.GstRegistrationResponse;
import com.erp.account.modules.gst.dto.response.GstStateCodeResponse;
import com.erp.account.modules.gst.service.GstMasterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/gst/master")
@RequiredArgsConstructor
@Tag(name = "GST Master", description = "GST State Codes and Registrations API")
public class GstMasterController {

    private final GstMasterService gstMasterService;

    // --- State Codes ---

    @Operation(summary = "Create GST State Code")
    @PostMapping("/states")
    public ResponseEntity<ApiResponse<GstStateCodeResponse>> createStateCode(
            @Valid @RequestBody ApiRequest<GstStateRequest> request) {
        GstStateCodeResponse response = gstMasterService.createStateCode(request);
        return ResponseEntity.ok(ApiResponse.success(response, "GST State Code created successfully."));
    }

    @Operation(summary = "Update GST State Code")
    @PutMapping("/states/{id}")
    public ResponseEntity<ApiResponse<GstStateCodeResponse>> updateStateCode(@PathVariable UUID id,
            @Valid @RequestBody ApiRequest<GstStateRequest> request) {
        GstStateCodeResponse response = gstMasterService.updateStateCode(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "State code updated successfully"));
    }

    // NOTE: GET /states/{id} is handled by GstStateProfileController
    // which returns the enterprise-grade full profile response.

    @Operation(summary = "Get All GST State Codes")
    @GetMapping("/states")
    public ResponseEntity<ApiResponse<java.util.List<GstStateCodeResponse>>> getAllStateCodes(
            @RequestParam(required = false) String search,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "stateCode", direction = org.springframework.data.domain.Sort.Direction.ASC) org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<GstStateCodeResponse> page = gstMasterService.getAllStateCodesPaginated(search, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "State codes fetched successfully"));
    }

    @Operation(summary = "Delete GST State Code")
    @DeleteMapping("/states/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStateCode(@PathVariable UUID id) {
        gstMasterService.deleteStateCode(id);
        return ResponseEntity.ok(ApiResponse.success(null, "State code deleted successfully"));
    }

    // --- Registrations ---

    @Operation(summary = "Create GST Registration")
    @PostMapping("/registrations")
    public ResponseEntity<ApiResponse<GstRegistrationResponse>> createRegistration(
            @Valid @RequestBody ApiRequest<GstRegistrationRequest> request,
            @RequestParam(required = false) UUID companyId) {
        GstRegistrationResponse response = gstMasterService.createRegistration(request, companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "GST registration created successfully"));
    }

    @Operation(summary = "Update GST Registration")
    @PutMapping("/registrations/{id}")
    public ResponseEntity<ApiResponse<GstRegistrationResponse>> updateRegistration(@PathVariable UUID id,
            @Valid @RequestBody ApiRequest<GstRegistrationRequest> request,
            @RequestParam(required = false) UUID companyId) {
        GstRegistrationResponse response = gstMasterService.updateRegistration(id, request, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "GST registration updated successfully"));
    }

    @Operation(summary = "Get GST Registration by ID")
    @GetMapping("/registrations/{id}")
    public ResponseEntity<ApiResponse<GstRegistrationResponse>> getRegistrationById(@PathVariable UUID id) {
        GstRegistrationResponse response = gstMasterService.getRegistrationById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "GST registration fetched successfully"));
    }

    @Operation(summary = "Get GST Registrations by Company")
    @GetMapping("/registrations/company")
    public ResponseEntity<ApiResponse<List<GstRegistrationResponse>>> getRegistrationsByCompanyId(
            @RequestParam(required = false) UUID companyId) {
        List<GstRegistrationResponse> response = gstMasterService.getRegistrationsByCompanyId(companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "GST registrations fetched successfully"));
    }

    @Operation(summary = "Delete GST Registration")
    @DeleteMapping("/registrations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRegistration(@PathVariable UUID id) {
        gstMasterService.deleteRegistration(id);
        return ResponseEntity.ok(ApiResponse.success(null, "GST registration deleted successfully"));
    }
}
