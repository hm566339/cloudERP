package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.OrganizationSignupRequest;
import com.erp.auth_service.dto.response.OrganizationLookupResponse;
import com.erp.auth_service.dto.response.OrganizationSignupResponse;

public interface OrganizationService {
    OrganizationSignupResponse signup(OrganizationSignupRequest request);
    OrganizationLookupResponse lookup(String organizationCode);
}