package com.erp.workflow.security;

import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component("workflowAuditorAware")
public class WorkflowAuditorAware implements AuditorAware<UUID> {

    @Override
    public Optional<UUID> getCurrentAuditor() {
        return SecurityUtils.getCurrentUserId();
    }
}
