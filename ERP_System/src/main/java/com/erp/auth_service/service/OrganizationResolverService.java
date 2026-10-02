package com.erp.auth_service.service;

import com.erp.auth_service.model.Organization;

public interface OrganizationResolverService {
    Organization resolveByCode(String organizationCode);
}