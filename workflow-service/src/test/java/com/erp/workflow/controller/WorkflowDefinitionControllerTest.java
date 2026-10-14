package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.security.CurrentUserContext;
import com.erp.workflow.security.authorization.AuthenticatedUser;
import com.erp.workflow.service.WorkflowDefinitionService;
import com.erp.workflow.service.WorkflowFormSchemaService;
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
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class WorkflowDefinitionControllerTest {

    @Mock
    private WorkflowDefinitionService definitionService;

    @Mock
    private WorkflowFormSchemaService formSchemaService;

    @InjectMocks
    private WorkflowDefinitionController controller;

    @BeforeEach
    void setUp() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("OWNER with query param companyId successfully activates workflow definition")
    void testOwnerActivatesWorkflowWithQueryParam() {
        UUID orgId = UUID.randomUUID();
        UUID selectedCompanyId = UUID.fromString("ea811382-0afc-4908-a209-9bedcc63c445");
        UUID workflowId = UUID.fromString("7ac31517-e9b0-46ff-8164-3b6a62c8a977");

        AuthenticatedUser owner = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("owner.user")
                .organizationId(orgId)
                .roles(List.of("OWNER"))
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(owner, null, List.of(new SimpleGrantedAuthority("ROLE_OWNER")))
        );
        CurrentUserContext.setOrganizationId(orgId);

        ResponseEntity<ApiResponse<Void>> response = controller.activateDefinition(workflowId, selectedCompanyId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).isEqualTo("Workflow definition activated");
        verify(definitionService).activateDefinition(workflowId, selectedCompanyId);
    }

    @Test
    @DisplayName("OWNER without query param falls back to CurrentUserContext companyId from X-Company-Id")
    void testOwnerActivatesWorkflowWithContextCompanyId() {
        UUID orgId = UUID.randomUUID();
        UUID selectedCompanyId = UUID.fromString("ea811382-0afc-4908-a209-9bedcc63c445");
        UUID workflowId = UUID.fromString("7ac31517-e9b0-46ff-8164-3b6a62c8a977");

        AuthenticatedUser owner = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("owner.user")
                .organizationId(orgId)
                .roles(List.of("OWNER"))
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(owner, null, List.of(new SimpleGrantedAuthority("ROLE_OWNER")))
        );
        CurrentUserContext.setOrganizationId(orgId);
        CurrentUserContext.setCompanyId(selectedCompanyId);

        ResponseEntity<ApiResponse<Void>> response = controller.activateDefinition(workflowId, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(definitionService).activateDefinition(workflowId, selectedCompanyId);
    }

    @Test
    @DisplayName("Activation fails when companyId cannot be resolved")
    void testActivationFailsWhenCompanyIdMissing() {
        UUID workflowId = UUID.randomUUID();

        assertThatThrownBy(() -> controller.activateDefinition(workflowId, null))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("Company ID is required to activate workflow definition");
    }

    @Test
    @DisplayName("Deactivate workflow definition succeeds with valid company context")
    void testDeactivateDefinitionSuccess() {
        UUID selectedCompanyId = UUID.randomUUID();
        UUID workflowId = UUID.randomUUID();

        ResponseEntity<ApiResponse<Void>> response = controller.deactivateDefinition(workflowId, selectedCompanyId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).isEqualTo("Workflow definition deactivated");
        verify(definitionService).deactivateDefinition(workflowId, selectedCompanyId);
    }

    @Test
    @DisplayName("Delete workflow definition succeeds with valid company context")
    void testDeleteDefinitionSuccess() {
        UUID selectedCompanyId = UUID.randomUUID();
        UUID workflowId = UUID.randomUUID();

        ResponseEntity<ApiResponse<Void>> response = controller.deleteDefinition(workflowId, selectedCompanyId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).isEqualTo("Workflow definition deleted");
        verify(definitionService).deleteDefinition(workflowId, selectedCompanyId);
    }

    @Test
    @DisplayName("Delete fails when companyId cannot be resolved")
    void testDeleteFailsWhenCompanyIdMissing() {
        UUID workflowId = UUID.randomUUID();

        assertThatThrownBy(() -> controller.deleteDefinition(workflowId, null))
                .isInstanceOf(WorkflowValidationException.class)
                .hasMessageContaining("Company ID is required to delete workflow definition");
    }
}
