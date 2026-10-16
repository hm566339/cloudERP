package com.erp.account.modules.dashboard;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.dashboard.dto.response.DashboardResponse;
import com.erp.account.modules.dashboard.dto.response.DashboardWidget;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hibernate.proxy.HibernateProxy;
import org.hibernate.proxy.LazyInitializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

public class DashboardSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    @DisplayName("Serializing DashboardResponse with AuditLog containing lazy Company proxy must not throw LazyInitializationException")
    void testAuditLogWithLazyCompanyProxySerialization() {
        UUID companyId = UUID.randomUUID();

        // Simulate an uninitialized Hibernate proxy for Company
        Company companyProxy = Mockito.mock(Company.class, Mockito.withSettings().extraInterfaces(HibernateProxy.class));
        LazyInitializer lazyInitializer = Mockito.mock(LazyInitializer.class);
        when(((HibernateProxy) companyProxy).getHibernateLazyInitializer()).thenReturn(lazyInitializer);
        when(lazyInitializer.isUninitialized()).thenReturn(true);
        when(companyProxy.getId()).thenReturn(companyId);
        // Any attempt to call getCompanyCode() on uninitialized proxy outside session throws LazyInitializationException
        when(companyProxy.getCompanyCode()).thenThrow(new org.hibernate.LazyInitializationException("Could not initialize proxy - no session"));

        AuditLog auditLog = AuditLog.builder()
                .id(UUID.randomUUID())
                .company(companyProxy)
                .moduleName("ACCOUNT")
                .entityName("AP_INVOICE")
                .actionType("CREATE")
                .performedByUsername("admin")
                .build();

        DashboardWidget widget = DashboardWidget.builder()
                .id("recent-activities")
                .title("Recent Activities")
                .type("ACTIVITY")
                .data(List.of(auditLog))
                .build();

        DashboardResponse response = DashboardResponse.builder()
                .activities(List.of(widget))
                .build();

        ApiResponse<DashboardResponse> apiResponse = ApiResponse.success(response, "Dashboard fetched successfully");

        // Must serialize without throwing LazyInitializationException or HttpMessageNotWritableException
        String json = assertDoesNotThrow(() -> objectMapper.writeValueAsString(apiResponse));
        assertNotNull(json);
        assertFalse(json.contains("Could not initialize proxy"));
    }

    @Test
    @DisplayName("Serializing DashboardResponse with GlJournalEntry containing lazy Company proxy must not throw LazyInitializationException")
    void testGlJournalEntryWithLazyCompanyProxySerialization() {
        UUID companyId = UUID.randomUUID();

        Company companyProxy = Mockito.mock(Company.class, Mockito.withSettings().extraInterfaces(HibernateProxy.class));
        when(companyProxy.getId()).thenReturn(companyId);
        when(companyProxy.getCompanyCode()).thenThrow(new org.hibernate.LazyInitializationException("Could not initialize proxy - no session"));

        GlJournalEntry journalEntry = GlJournalEntry.builder()
                .id(UUID.randomUUID())
                .company(companyProxy)
                .voucherNo("JV-2026-0001")
                .build();

        DashboardWidget widget = DashboardWidget.builder()
                .id("recent-journals")
                .title("Recent Journals")
                .type("ACTIVITY")
                .data(List.of(journalEntry))
                .build();

        DashboardResponse response = DashboardResponse.builder()
                .activities(List.of(widget))
                .build();

        ApiResponse<DashboardResponse> apiResponse = ApiResponse.success(response, "Dashboard fetched successfully");

        String json = assertDoesNotThrow(() -> objectMapper.writeValueAsString(apiResponse));
        assertNotNull(json);
        assertFalse(json.contains("Could not initialize proxy"));
    }
}
