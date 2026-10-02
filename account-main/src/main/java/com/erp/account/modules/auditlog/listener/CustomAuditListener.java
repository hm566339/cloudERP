package com.erp.account.modules.auditlog.listener;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.security.CurrentUserContext;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.UUID;

public class CustomAuditListener {

    @PrePersist
    public void setCreatedOn(BaseEntity entity) {
        UUID currentUserId = CurrentUserContext.getUserId();
        String currentUsername = getCurrentUsername();
        
        // Don't overwrite if already set (e.g. by a data migration script)
        if (entity.getCreatedBy() == null) {
            entity.setCreatedBy(currentUserId);
        }
        if (entity.getCreatedByUsername() == null) {
            entity.setCreatedByUsername(currentUsername);
        }
        
        // Also set updated fields on creation
        entity.setUpdatedBy(currentUserId);
        entity.setUpdatedByUsername(currentUsername);
    }

    @PreUpdate
    public void setUpdatedOn(BaseEntity entity) {
        UUID currentUserId = CurrentUserContext.getUserId();
        String currentUsername = getCurrentUsername();
        
        // Handle normal updates (never overwrite createdBy)
        entity.setUpdatedBy(currentUserId);
        entity.setUpdatedByUsername(currentUsername);
        
        // Handle soft deletes (assuming isDeleted transitions to true)
        if (Boolean.TRUE.equals(entity.getIsDeleted()) && entity.getDeletedAt() == null) {
            entity.setDeletedBy(currentUserId);
            entity.setDeletedByUsername(currentUsername);
            entity.setDeletedAt(LocalDateTime.now());
        }
    }

    private String getCurrentUsername() {
        String username = CurrentUserContext.getUsername();
        if (username != null && !username.isBlank()) {
            return username;
        }
        return "system"; // Fallback for background tasks or anonymous
    }
}
