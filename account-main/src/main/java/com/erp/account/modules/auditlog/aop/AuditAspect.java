package com.erp.account.modules.auditlog.aop;

import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.TenantUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashSet;
import java.util.UUID;

@Aspect
@Component
public class AuditAspect {

    @Around("@within(org.springframework.web.bind.annotation.RestController)")
    public Object populateAuditContext(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                
                String uri = request.getRequestURI();
                // Ignore audit logging for specific endpoints
                if (uri.contains("/audit") || uri.contains("/login") || uri.contains("/logout") || uri.contains("/health") || uri.contains("/static")) {
                    return joinPoint.proceed();
                }

                String ipAddress = request.getHeader("X-Forwarded-For");
                if (ipAddress == null || ipAddress.isEmpty()) {
                    ipAddress = request.getRemoteAddr();
                }

                String userAgent = request.getHeader("User-Agent");
                UUID companyId = null;
                try {
                    companyId = TenantUtils.getCurrentCompanyId();
                } catch (Exception e) {
                    // Ignore, might not be set yet
                }
                
                UUID userId = null;
                try {
                    userId = CurrentUserContext.getUserId();
                } catch (Exception e) {
                    // Ignore
                }

                AuditContextHolder.AuditContext context = AuditContextHolder.AuditContext.builder()
                        .ipAddress(ipAddress)
                        .userAgent(userAgent)
                        .companyId(companyId)
                        .userId(userId)
                        .requestUri(uri)
                        .httpMethod(request.getMethod())
                        .processedEntities(new HashSet<>())
                        .build();

                AuditContextHolder.setContext(context);
            }

            return joinPoint.proceed();

        } finally {
            AuditContextHolder.clearContext();
        }
    }
}
