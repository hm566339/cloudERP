package com.erp.inventory.common.security;

import java.lang.reflect.Method;
import java.util.Optional;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
public class SystemAdminCompanyIdAspect {

    private static final Logger log = LoggerFactory.getLogger(SystemAdminCompanyIdAspect.class);

    @Around("(@within(org.springframework.web.bind.annotation.RestController) || @within(org.springframework.stereotype.Controller)) && execution(public * *(..))")
    public Object auditSystemAdminCompanyId(ProceedingJoinPoint joinPoint) throws Throwable {
        if (!CurrentUserContext.isSystemAdmin()) {
            return joinPoint.proceed();
        }

        RequestCompanyContext.clear();

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String controllerName = method.getDeclaringClass().getSimpleName();
        String methodName = method.getName();
        String username = extractUsername();

        HttpServletRequest request = resolveHttpServletRequest();
        String apiUri = request != null ? request.getRequestURI() : "UNKNOWN_URI";
        String httpMethod = request != null ? request.getMethod() : "UNKNOWN_METHOD";

        Optional<CompanyIdExtractor.FoundCompanyId> companyId = CompanyIdExtractor.extract(method, joinPoint.getArgs());

        if (companyId.isPresent()) {
            CompanyIdExtractor.FoundCompanyId found = companyId.get();
            Object cIdObj = found.companyId();
            UUID cId = null;
            if (cIdObj instanceof UUID u) {
                cId = u;
            } else if (cIdObj instanceof String s) {
                try {
                    cId = UUID.fromString(s);
                } catch (IllegalArgumentException e) {
                    log.warn("Extracted companyId is not a valid UUID string: {}", s);
                }
            }

            RequestCompanyContext.setCompanyId(cId);
            log.info(
                    "SYSTEM_ADMIN request detected: api=[{} {}] controller=[{}.{}] username=[{}] source=[{}] fieldPath=[{}] companyId=[{}]",
                    httpMethod,
                    apiUri,
                    controllerName,
                    methodName,
                    username,
                    found.source(),
                    found.fieldPath(),
                    cId);
        } else {
            log.warn(
                    "SYSTEM_ADMIN request without companyId: api=[{} {}] controller=[{}.{}] username=[{}] message=[SYSTEM_ADMIN request without companyId]",
                    httpMethod,
                    apiUri,
                    controllerName,
                    methodName,
                    username);
        }

        return joinPoint.proceed();
    }

    private HttpServletRequest resolveHttpServletRequest() {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (requestAttributes instanceof ServletRequestAttributes servletAttributes) {
            return servletAttributes.getRequest();
        }
        return null;
    }

    private String extractUsername() {
        try {
            return CurrentUserContext.isAuthenticated() ? CurrentUserContext.getUserId().toString() : "anonymous";
        } catch (Exception ex) {
            log.debug("Unable to resolve username for system admin audit", ex);
            return "unknown";
        }
    }
}
