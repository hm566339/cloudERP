package com.erp.auth_service.service.impl;

import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.service.OrganizationResolverService;
import com.erp.auth_service.utility.OrganizationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class OrganizationResolverServiceImpl implements OrganizationResolverService {
    private final OrganizationRepository organizationRepository;

    @Override
    @Transactional(readOnly = true)
    public Organization resolveByCode(String organizationCode) {
        if (organizationCode == null || !organizationCode.matches("[a-z0-9]+(?:-[a-z0-9]+)*")) {
            throw new BadRequestException("Invalid organization code");
        }
        return organizationRepository
                .findByOrganizationCodeIgnoreCaseAndStatusNot(organizationCode.toLowerCase(Locale.ROOT), OrganizationStatus.DELETED)
                .filter(organization -> organization.getStatus() == OrganizationStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
    }
}