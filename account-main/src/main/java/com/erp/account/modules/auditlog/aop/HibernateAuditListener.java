package com.erp.account.modules.auditlog.aop;

import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.auditlog.repository.AuditLogRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.TenantUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.event.spi.*;
import org.hibernate.persister.entity.EntityPersister;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class HibernateAuditListener implements PostInsertEventListener, PostUpdateEventListener, PostDeleteEventListener {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final CompanyRepository companyRepository;

    @Override
    public void onPostInsert(PostInsertEvent event) {
        handleAudit(event.getEntity(), event.getPersister(), "CREATE", null, event.getState(), event.getPersister().getPropertyNames());
    }

    @Override
    public void onPostUpdate(PostUpdateEvent event) {
        handleAudit(event.getEntity(), event.getPersister(), "UPDATE", event.getOldState(), event.getState(), event.getPersister().getPropertyNames());
    }

    @Override
    public void onPostDelete(PostDeleteEvent event) {
        handleAudit(event.getEntity(), event.getPersister(), "DELETE", event.getDeletedState(), null, event.getPersister().getPropertyNames());
    }

    private void handleAudit(Object entity, EntityPersister persister, String action, Object[] oldState, Object[] newState, String[] propertyNames) {
        String entityName = entity.getClass().getSimpleName();

        // Ignore AuditLog and other core non-business entities
        if ("AuditLog".equals(entityName) || "Company".equals(entityName) || "User".equals(entityName)) {
            return;
        }

        UUID entityId = extractId(entity);
        if (entityId == null) return;

        String deduplicationKey = entityName + "-" + entityId + "-" + action;
        if (AuditContextHolder.isEntityProcessed(deduplicationKey)) {
            return;
        }
        AuditContextHolder.addProcessedEntity(deduplicationKey);

        AuditContextHolder.AuditContext context = AuditContextHolder.getContext();
        
        UUID companyId = null;
        UUID userId = null;
        String ipAddress = null;
        String userAgent = null;

        if (context != null) {
            companyId = context.getCompanyId();
            userId = context.getUserId();
            ipAddress = context.getIpAddress();
            userAgent = context.getUserAgent();
        }

        if (companyId == null) {
            try { companyId = TenantUtils.getCurrentCompanyId(); } catch(Exception e) {}
        }
        if (userId == null) {
            try { userId = CurrentUserContext.getUserId(); } catch(Exception e) {}
        }
        
        String username = null;
        try {
            username = CurrentUserContext.getUsername();
        } catch (Exception e) {}

        Company company = null;
        if (companyId != null) {
            company = companyRepository.findById(companyId).orElse(null);
        }

        ObjectNode diffNode = objectMapper.createObjectNode();
        boolean hasChanges = false;

        if (propertyNames != null) {
            for (int i = 0; i < propertyNames.length; i++) {
                String propName = propertyNames[i];
                Object oldVal = oldState != null ? oldState[i] : null;
                Object newVal = newState != null ? newState[i] : null;

                // Skip audit fields
                if (propName.equals("createdAt") || propName.equals("updatedAt") || propName.equals("createdBy") || propName.equals("updatedBy") || propName.equals("createdByUsername") || propName.equals("updatedByUsername")) {
                    continue;
                }

                if ((oldVal == null && newVal != null) || (oldVal != null && !oldVal.equals(newVal))) {
                    hasChanges = true;
                    ObjectNode fieldChange = objectMapper.createObjectNode();
                    
                    if (oldVal != null) {
                        try { fieldChange.set("old", objectMapper.valueToTree(oldVal.toString())); } 
                        catch (Exception e) { fieldChange.put("old", oldVal.toString()); }
                    } else {
                        fieldChange.putNull("old");
                    }

                    if (newVal != null) {
                        try { fieldChange.set("new", objectMapper.valueToTree(newVal.toString())); } 
                        catch (Exception e) { fieldChange.put("new", newVal.toString()); }
                    } else {
                        fieldChange.putNull("new");
                    }
                    
                    diffNode.set(propName, fieldChange);
                }
            }
        }

        if (action.equals("UPDATE") && !hasChanges) {
            return; // No meaningful business changes to audit
        }

        AuditLog audit = AuditLog.builder()
                .company(company)
                .moduleName(detectModule(entityName))
                .entityName(entityName)
                .entityId(entityId)
                .actionType(action)
                .oldValue(diffNode.isEmpty() ? null : diffNode) // Storing diff here for now, or just use newValue if you prefer
                .newValue(diffNode.isEmpty() ? null : diffNode)
                .performedBy(userId)
                .performedByUsername(username)
                .performedAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        // Save synchronously using a stateless session to avoid flush cycle conflicts, 
        // but within the SAME database transaction.
        try {
            org.hibernate.StatelessSession session = persister.getFactory().openStatelessSession();
            try {
                session.joinTransaction(); // Join the current Spring transaction
                session.insert(audit);
            } finally {
                session.close();
            }
        } catch (Exception e) {
            log.error("Failed to save audit log synchronously", e);
        }
    }

    private java.util.Map<String, Object> buildStateMap(String[] propertyNames, Object[] state) {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        for (int i = 0; i < propertyNames.length; i++) {
            if (state[i] != null && !isProxyOrCollection(state[i])) {
                map.put(propertyNames[i], state[i]);
            }
        }
        return map;
    }

    private boolean isProxyOrCollection(Object obj) {
        if (obj instanceof org.hibernate.proxy.HibernateProxy) return true;
        if (obj instanceof org.hibernate.collection.spi.PersistentCollection) {
            return !((org.hibernate.collection.spi.PersistentCollection<?>) obj).wasInitialized();
        }
        return false;
    }

    private UUID extractId(Object entity) {
        try {
            java.lang.reflect.Method getId = entity.getClass().getMethod("getId");
            Object id = getId.invoke(entity);
            if (id instanceof UUID) return (UUID) id;
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    private String detectModule(String entityName) {
        if (entityName.contains("GlJournal")) return "GL";
        if (entityName.contains("Sales")) return "SALES";
        if (entityName.contains("Purchase") || entityName.contains("ApInvoice")) return "PURCHASE";
        if (entityName.contains("Gst")) return "GST";
        if (entityName.contains("Vendor")) return "VENDOR";
        if (entityName.contains("Customer")) return "CUSTOMER";
        if (entityName.contains("Budget")) return "BUDGET";
        if (entityName.contains("Payment")) return "PAYMENT";
        if (entityName.contains("Receipt")) return "RECEIPT";
        return "GENERAL";
    }

    @Override
    public boolean requiresPostCommitHandling(EntityPersister persister) {
        return false;
    }
}
