package com.erp.account.modules.auditlog.aop;

import lombok.Builder;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public class AuditContextHolder {

    private static final ThreadLocal<AuditContext> contextHolder = new ThreadLocal<>();

    @Data
    @Builder
    public static class AuditContext {
        private String ipAddress;
        private String userAgent;
        private UUID companyId;
        private UUID userId;
        private String requestUri;
        private String httpMethod;
        @Builder.Default
        private Set<String> processedEntities = new HashSet<>();
    }

    public static void setContext(AuditContext context) {
        contextHolder.set(context);
    }

    public static AuditContext getContext() {
        return contextHolder.get();
    }

    public static void clearContext() {
        contextHolder.remove();
    }

    public static void addProcessedEntity(String entityKey) {
        AuditContext ctx = getContext();
        if (ctx != null) {
            ctx.getProcessedEntities().add(entityKey);
        }
    }

    public static boolean isEntityProcessed(String entityKey) {
        AuditContext ctx = getContext();
        return ctx != null && ctx.getProcessedEntities().contains(entityKey);
    }
}
