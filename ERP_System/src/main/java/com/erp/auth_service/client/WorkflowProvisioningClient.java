package com.erp.auth_service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * REST Client for provisioning and reconciling default workflows with workflow-service.
 */
@Component
@Slf4j
public class WorkflowProvisioningClient {

    private final RestTemplate restTemplate;

    public WorkflowProvisioningClient() {
        this.restTemplate = new RestTemplate();
    }

    public WorkflowProvisioningClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate != null ? restTemplate : new RestTemplate();
    }

    @Value("${workflow.service.url:http://localhost:8083}")
    private String workflowServiceUrl;

    @Value("${workflow.provisioning.enabled:true}")
    private boolean provisioningEnabled;

    /**
     * Automatically provisions the organization's default workflow for a company.
     *
     * @param organizationId Organization owning the company and default workflow
     * @param companyId Newly created or targeted company ID
     * @param roleNameToIdMap Role name to company role ID mapping
     * @param authToken Optional JWT authorization token
     * @return true if provisioning succeeded or was skipped gracefully, false on error
     */
    public boolean provisionCompanyWorkflow(UUID organizationId, UUID companyId,
                                           Map<String, UUID> roleNameToIdMap, String authToken) {
        if (!provisioningEnabled) {
            log.info("[WF_CLIENT] Workflow provisioning is disabled by configuration");
            return true;
        }

        try {
            String url = workflowServiceUrl + "/api/v1/workflow/organization-templates/provision-company";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (authToken != null && !authToken.isBlank()) {
                String bearer = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;
                headers.set("Authorization", bearer);
            }
            if (organizationId != null) {
                headers.set("X-Organization-Id", organizationId.toString());
            }
            if (companyId != null) {
                headers.set("X-Company-Id", companyId.toString());
            }

            Map<String, Object> requestData = new HashMap<>();
            requestData.put("organizationId", organizationId);
            requestData.put("companyId", companyId);
            requestData.put("roleNameToIdMap", roleNameToIdMap != null ? roleNameToIdMap : Collections.emptyMap());
            requestData.put("forceUpdateCustomized", false);

            Map<String, Object> body = Map.of("data", requestData);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            log.info("[WF_CLIENT] Calling workflow-service at {} to provision companyId={} for organizationId={}",
                    url, companyId, organizationId);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[WF_CLIENT] Successfully provisioned workflow for companyId={} under organizationId={}",
                        companyId, organizationId);
                return true;
            } else {
                log.warn("[WF_CLIENT] Workflow provisioning returned status: {}", response.getStatusCode());
                return false;
            }
        } catch (Exception ex) {
            log.warn("[WF_CLIENT] Failed to provision default workflow for companyId={} (non-blocking): {}",
                    companyId, ex.getMessage());
            return false;
        }
    }

    /**
     * Reconciles missing default workflows for all companies under an organization.
     */
    public boolean reconcileOrganizationWorkflows(UUID organizationId, List<UUID> companyIds,
                                                  boolean forceUpdateCustomized, String authToken) {
        if (!provisioningEnabled) {
            return true;
        }

        try {
            String url = workflowServiceUrl + "/api/v1/workflow/organization-templates/reconcile?forceUpdateCustomized="
                    + forceUpdateCustomized;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (authToken != null && !authToken.isBlank()) {
                String bearer = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;
                headers.set("Authorization", bearer);
            }
            if (organizationId != null) {
                headers.set("X-Organization-Id", organizationId.toString());
            }

            HttpEntity<List<UUID>> entity = new HttpEntity<>(companyIds, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception ex) {
            log.warn("[WF_CLIENT] Failed to reconcile workflows for organizationId={}: {}",
                    organizationId, ex.getMessage());
            return false;
        }
    }
}

