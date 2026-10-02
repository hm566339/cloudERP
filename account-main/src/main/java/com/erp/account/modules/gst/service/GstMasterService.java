package com.erp.account.modules.gst.service;

import com.erp.account.common.dto.request.ApiRequest;
import com.erp.account.modules.gst.dto.request.GstRegistrationRequest;
import com.erp.account.modules.gst.dto.request.GstStateRequest;
import com.erp.account.modules.gst.dto.response.GstRegistrationResponse;
import com.erp.account.modules.gst.dto.response.GstStateCodeResponse;

import java.util.List;
import java.util.UUID;

public interface GstMasterService {
    // State Code Methods
    GstStateCodeResponse createStateCode(ApiRequest<GstStateRequest> request);

    GstStateCodeResponse updateStateCode(UUID id, ApiRequest<GstStateRequest> request);

    GstStateCodeResponse getStateCodeById(UUID id);

    GstStateCodeResponse getStateCodeByCode(String stateCode);

    List<GstStateCodeResponse> getAllStateCodes();

    org.springframework.data.domain.Page<GstStateCodeResponse> getAllStateCodesPaginated(String search, org.springframework.data.domain.Pageable pageable);

    void deleteStateCode(UUID id);

    // Registration Methods
    GstRegistrationResponse createRegistration(ApiRequest<GstRegistrationRequest> request, UUID companyId);

    GstRegistrationResponse updateRegistration(UUID id, ApiRequest<GstRegistrationRequest> request, UUID companyId);

    GstRegistrationResponse getRegistrationById(UUID id);

    List<GstRegistrationResponse> getRegistrationsByCompanyId(UUID companyId);

    GstRegistrationResponse getDefaultRegistrationByCompanyId(UUID companyId);

    void deleteRegistration(UUID id);
}
