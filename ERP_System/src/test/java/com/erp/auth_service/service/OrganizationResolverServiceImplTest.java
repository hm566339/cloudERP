package com.erp.auth_service.service;

import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.service.impl.OrganizationResolverServiceImpl;
import com.erp.auth_service.utility.OrganizationStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganizationResolverServiceImplTest {
    @Mock
    private OrganizationRepository organizationRepository;

    @Test
    void resolvesNormalizedActiveOrganization() {
        Organization organization = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("abc-group")
                .displayName("ABC Group")
                .legalName("ABC Group")
                .status(OrganizationStatus.ACTIVE)
                .build();
        when(organizationRepository.findByOrganizationCodeIgnoreCaseAndStatusNot("abc-group", OrganizationStatus.DELETED))
                .thenReturn(Optional.of(organization));

        Organization result = new OrganizationResolverServiceImpl(organizationRepository).resolveByCode("abc-group");

        assertEquals("ABC Group", result.getDisplayName());
    }

    @Test
    void rejectsMalformedCode() {
        assertThrows(BadRequestException.class,
                () -> new OrganizationResolverServiceImpl(organizationRepository).resolveByCode("ABC Group"));
    }

    @Test
    void rejectsMissingOrganization() {
        when(organizationRepository.findByOrganizationCodeIgnoreCaseAndStatusNot("missing", OrganizationStatus.DELETED))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> new OrganizationResolverServiceImpl(organizationRepository).resolveByCode("missing"));
    }
}
