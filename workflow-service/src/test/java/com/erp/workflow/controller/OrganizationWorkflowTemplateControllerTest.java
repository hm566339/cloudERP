package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiRequest;
import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.request.CreateOrgWorkflowTemplateRequest;
import com.erp.workflow.dto.request.UpdateOrgWorkflowTemplateRequest;
import com.erp.workflow.dto.response.OrgWorkflowProvisionResultDto;
import com.erp.workflow.dto.response.OrgWorkflowTemplateResponse;
import com.erp.workflow.exception.UnauthorizedWorkflowActionException;
import com.erp.workflow.security.CurrentUserContext;
import com.erp.workflow.security.authorization.AuthenticatedUser;
import com.erp.workflow.service.OrganizationWorkflowTemplateService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganizationWorkflowTemplateControllerTest {

    @Mock
    private OrganizationWorkflowTemplateService templateService;

    @InjectMocks
    private OrganizationWorkflowTemplateController controller;

    private UUID organizationId;
    private UUID templateId;

    @BeforeEach
    void setUp() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
        organizationId = UUID.randomUUID();
        templateId = UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String role, UUID orgId) {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("test.user")
                .organizationId(orgId)
                .roles(List.of(role))
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)))
        );
        CurrentUserContext.setOrganizationId(orgId);
        CurrentUserContext.setUserRole("ROLE_" + role);
    }

    @Test
    @DisplayName("Organization Owner can create a default workflow template")
    void testOwnerCanCreateTemplate() {
        authenticateAs("OWNER", organizationId);

        CreateOrgWorkflowTemplateRequest req = CreateOrgWorkflowTemplateRequest.builder()
                .organizationId(organizationId)
                .templateCode("DEFAULT_INVOICE")
                .templateName("Default Invoice Template")
                .moduleName("ACCOUNT")
                .documentType("INVOICE")
                .build();

        OrgWorkflowTemplateResponse mockResponse = OrgWorkflowTemplateResponse.builder()
                .id(templateId)
                .organizationId(organizationId)
                .templateCode("DEFAULT_INVOICE")
                .version(1)
                .build();

        when(templateService.createTemplate(eq(organizationId), any())).thenReturn(mockResponse);

        ApiRequest<CreateOrgWorkflowTemplateRequest> reqWrapper = new ApiRequest<>();
        reqWrapper.setData(req);

        ResponseEntity<ApiResponse<OrgWorkflowTemplateResponse>> response =
                controller.createTemplate(reqWrapper, organizationId, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getTemplateCode()).isEqualTo("DEFAULT_INVOICE");
        verify(templateService).createTemplate(eq(organizationId), any());
    }

    @Test
    @DisplayName("Non-admin/non-owner cannot force-update customized company workflows")
    void testForceUpdate_RestrictedToAdminOrOwner() {
        authenticateAs("EMPLOYEE", organizationId);

        assertThatThrownBy(() -> controller.propagate(templateId, null, true, organizationId, null))
                .isInstanceOf(UnauthorizedWorkflowActionException.class)
                .hasMessageContaining("Only Organization Owners or Admins are authorized");
    }

    @Test
    @DisplayName("Organization Owner CAN perform force-update on customized workflows")
    void testOwnerCanPerformForceUpdate() {
        authenticateAs("OWNER", organizationId);

        OrgWorkflowProvisionResultDto mockResult = OrgWorkflowProvisionResultDto.builder()
                .organizationId(organizationId)
                .templateId(templateId)
                .totalCompanies(2)
                .provisionedCount(2)
                .build();

        when(templateService.propagateTemplate(organizationId, templateId, null, true))
                .thenReturn(mockResult);

        ResponseEntity<ApiResponse<OrgWorkflowProvisionResultDto>> response =
                controller.propagate(templateId, null, true, organizationId, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getProvisionedCount()).isEqualTo(2);
        verify(templateService).propagateTemplate(organizationId, templateId, null, true);
    }
}
