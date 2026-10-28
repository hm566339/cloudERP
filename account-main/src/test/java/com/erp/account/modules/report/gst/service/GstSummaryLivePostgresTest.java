package com.erp.account.modules.report.gst.service;

import com.erp.account.modules.report.gst.dto.ChartsDto;
import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import com.erp.account.modules.report.gst.dto.GstSummaryDto;
import com.erp.account.modules.report.gst.dto.MonthlyTaxTrendPoint;
import com.erp.account.modules.report.gst.dto.SupplySummaryDto;
import com.erp.account.modules.report.gst.dto.TaxSummaryDto;
import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional(readOnly = true)
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5432/account",
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.datasource.username=postgres",
        "spring.datasource.password=mohit",
        "spring.jpa.hibernate.ddl-auto=none"
})
class GstSummaryLivePostgresTest {

    @Autowired
    private GstSummaryService gstSummaryService;

    private static final UUID COMPANY_ID = UUID.fromString("8794358f-3b1a-40be-9d13-afb51b449862");
    private static final LocalDate FROM_DATE = LocalDate.of(2026, 4, 1);
    private static final LocalDate TO_DATE = LocalDate.of(2027, 3, 31);

    @BeforeEach
    void setUp() {
        CurrentUserContext.clearAll();
        SecurityContextHolder.clearContext();

        // Run as System Admin to validate data extraction cleanly across Postgres
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("SYSTEM_ADMIN");
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clearAll();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GST Summary queries execute successfully without c.country error for FY 2026-04-01 to 2027-03-31")
    void testGstSummaryReportExecution() {
        GstReportFilterDto filter = new GstReportFilterDto();
        filter.setCompanyId(COMPANY_ID);
        filter.setFromDate(FROM_DATE);
        filter.setToDate(TO_DATE);
        filter.setInvoiceType("ALL");

        GstSummaryDto summary = gstSummaryService.getSummary(filter);

        assertThat(summary).isNotNull();

        // 1. Verify Supply Summary
        SupplySummaryDto supply = summary.getSupplySummary();
        assertThat(supply).isNotNull();
        assertThat(supply.getTaxableSupply()).isEqualByComparingTo(new BigDecimal("841500.00"));
        assertThat(supply.getInterstateSupply()).isEqualByComparingTo(new BigDecimal("45000.00"));
        assertThat(supply.getIntrastateSupply()).isEqualByComparingTo(new BigDecimal("796500.00"));

        // 2. Verify Tax Summary
        TaxSummaryDto tax = summary.getTaxSummary();
        assertThat(tax).isNotNull();
        assertThat(tax.getTaxableAmount()).isEqualByComparingTo(new BigDecimal("841500.00"));
        assertThat(tax.getTotalTax()).isEqualByComparingTo(new BigDecimal("151470.00"));
        assertThat(tax.getCgst()).isEqualByComparingTo(new BigDecimal("71685.00"));
        assertThat(tax.getSgst()).isEqualByComparingTo(new BigDecimal("71685.00"));
        assertThat(tax.getIgst()).isEqualByComparingTo(new BigDecimal("8100.00"));
        assertThat(tax.getCess()).isEqualByComparingTo(BigDecimal.ZERO);

        // 3. Verify Monthly Tax Trend Query
        ChartsDto charts = summary.getCharts();
        assertThat(charts).isNotNull();
        List<MonthlyTaxTrendPoint> trends = charts.getMonthlyTaxTrend();
        assertThat(trends).isNotEmpty();
        assertThat(trends).hasSize(2);

        MonthlyTaxTrendPoint aug = trends.stream().filter(t -> "2026-08".equals(t.getMonth())).findFirst().orElse(null);
        assertThat(aug).isNotNull();
        assertThat(aug.getTaxableAmount()).isEqualByComparingTo(new BigDecimal("346500.00"));
        assertThat(aug.getCgst()).isEqualByComparingTo(new BigDecimal("31185.00"));
        assertThat(aug.getSgst()).isEqualByComparingTo(new BigDecimal("31185.00"));
        assertThat(aug.getIgst()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(aug.getTotalTax()).isEqualByComparingTo(new BigDecimal("62370.00"));

        MonthlyTaxTrendPoint sep = trends.stream().filter(t -> "2026-09".equals(t.getMonth())).findFirst().orElse(null);
        assertThat(sep).isNotNull();
        assertThat(sep.getTaxableAmount()).isEqualByComparingTo(new BigDecimal("495000.00"));
        assertThat(sep.getCgst()).isEqualByComparingTo(new BigDecimal("40500.00"));
        assertThat(sep.getSgst()).isEqualByComparingTo(new BigDecimal("40500.00"));
        assertThat(sep.getIgst()).isEqualByComparingTo(new BigDecimal("8100.00"));
        assertThat(sep.getTotalTax()).isEqualByComparingTo(new BigDecimal("89100.00"));
    }
}
