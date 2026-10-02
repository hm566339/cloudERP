package com.erp.account.modules.report.gst.util;

import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class ReportAuditAspect {

    @Around("execution(* com.erp.account.modules.report.gst.facade.GstReportFacade.*(..)) && args(filter,..)")
    public Object logReportExecution(ProceedingJoinPoint joinPoint, GstReportFilterDto filter) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().getName();
        
        log.info("START Audit: Generating Report {} for Company {}", methodName, filter.getCompanyId());
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            // In a real application, save to AuditLog table.
            log.info("END Audit: Report {} generated successfully in {} ms. Filter: {}", methodName, executionTime, filter);
            return result;
        } catch (Exception e) {
            log.error("ERROR Audit: Report {} failed. Reason: {}", methodName, e.getMessage());
            throw e;
        }
    }
}
