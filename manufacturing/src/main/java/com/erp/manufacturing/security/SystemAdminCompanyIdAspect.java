package com.erp.manufacturing.security;

import com.erp.manufacturing.util.CurrentUserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Optional;
import java.util.UUID;

@Aspect
@Component
@Order(0)
@Slf4j
@RequiredArgsConstructor
public class SystemAdminCompanyIdAspect {

    @Around("(@within(org.springframework.web.bind.annotation.RestController) || @within(org.springframework.stereotype.Controller)) && execution(public * *(..))")
    public Object auditSystemAdminCompanyId(ProceedingJoinPoint joinPoint) throws Throwable {
        if (!CurrentUserContext.isSystemAdmin()) {
            return joinPoint.proceed();
        }

        RequestCompanyContext.clear();

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        Optional<CompanyIdExtractor.FoundCompanyId> companyId = CompanyIdExtractor.extract(method, joinPoint.getArgs());

        if (companyId.isPresent()) {
            Object cIdObj = companyId.get().companyId();
            UUID cId = null;
            if (cIdObj instanceof UUID u) {
                cId = u;
            } else if (cIdObj instanceof String s) {
                try {
                    cId = UUID.fromString(s);
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (cId != null) {
                RequestCompanyContext.setCompanyId(cId);
                log.debug("SYSTEM_ADMIN active company context set to [{}] from source [{}]",
                        cId, companyId.get().source());
            }
        }

        return joinPoint.proceed();
    }
}
