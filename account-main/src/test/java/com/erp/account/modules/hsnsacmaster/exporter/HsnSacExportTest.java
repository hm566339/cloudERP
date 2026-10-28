package com.erp.account.modules.hsnsacmaster.exporter;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.enums.ExportFormat;
import com.erp.account.enums.HsnSacType;
import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterFilterDto;
import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterRequest;
import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponse;
import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponseList;
import com.erp.account.modules.hsnsacmaster.service.HsnSacMasterService;
import com.erp.account.modules.reporting.controller.ReportController;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.CsvGenerator;
import com.erp.account.modules.reporting.service.export.ExcelGenerator;
import com.erp.account.modules.reporting.service.export.PdfGenerator;
import com.erp.account.modules.reporting.service.export.ReportExportManager;
import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HsnSacExportTest {

    private HsnSacDataFetcher hsnSacDataFetcher;
    private ReportExportManager reportExportManager;
    private ReportController reportController;

    private UUID item1Id;
    private UUID item2Id;
    private UUID companyId;

    private static class StubHsnSacMasterService implements HsnSacMasterService {
        private final List<HsnSacMasterResponse> responses;

        StubHsnSacMasterService(List<HsnSacMasterResponse> responses) {
            this.responses = responses;
        }

        @Override
        public HsnSacMasterResponseList getAllHsnSacMasters(HsnSacMasterFilterDto filter, Pageable pageable) {
            return HsnSacMasterResponseList.builder()
                    .hsnSacMasters(responses)
                    .build();
        }

        @Override public PostResponse createHsnSacMaster(RequestWrapper<HsnSacMasterRequest> request) { return null; }
        @Override public PostResponse updateHsnSacMaster(UUID hsnSacId, RequestWrapper<HsnSacMasterRequest> request) { return null; }
        @Override public PostResponse deleteHsnSacMaster(UUID hsnSacId) { return null; }
        @Override public HsnSacMasterResponse getHsnSacMasterById(UUID hsnSacId) { return null; }
        @Override public HsnSacMasterResponse getHsnSacMasterByCode(String code) { return null; }
        @Override public List<HsnSacMasterResponse> generateHsnWiseReport() { return List.of(); }
        @Override public List<HsnSacMasterResponse> generateSacWiseReport() { return List.of(); }
        @Override public void validateTaxApplicability(UUID hsnSacId) {}
    }

    @BeforeEach
    void setUp() {
        item1Id = UUID.randomUUID();
        item2Id = UUID.randomUUID();
        companyId = UUID.randomUUID();

        List<HsnSacMasterResponse> sampleResponses = createSampleResponses();
        HsnSacMasterService stubService = new StubHsnSacMasterService(sampleResponses);

        hsnSacDataFetcher = new HsnSacDataFetcher(stubService);

        PdfGenerator pdfGenerator = new PdfGenerator();
        ExcelGenerator excelGenerator = new ExcelGenerator();
        CsvGenerator csvGenerator = new CsvGenerator();

        reportExportManager = new ReportExportManager(
                List.of(hsnSacDataFetcher),
                pdfGenerator,
                excelGenerator,
                csvGenerator
        );

        reportController = new ReportController(null, null, reportExportManager);
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    private List<HsnSacMasterResponse> createSampleResponses() {
        HsnSacMasterResponse r1 = HsnSacMasterResponse.builder()
                .id(item1Id)
                .code("8471")
                .description("Automatic data processing machines")
                .type(HsnSacType.HSN)
                .cgstRate(new BigDecimal("9.00"))
                .sgstRate(new BigDecimal("9.00"))
                .igstRate(new BigDecimal("18.00"))
                .cessRate(BigDecimal.ZERO)
                .deleted(false)
                .build();

        HsnSacMasterResponse r2 = HsnSacMasterResponse.builder()
                .id(item2Id)
                .code("998314")
                .description("Information technology consulting services")
                .type(HsnSacType.SAC)
                .cgstRate(new BigDecimal("9.00"))
                .sgstRate(new BigDecimal("9.00"))
                .igstRate(new BigDecimal("18.00"))
                .cessRate(BigDecimal.ZERO)
                .deleted(false)
                .build();

        return List.of(r1, r2);
    }

    @Test
    @DisplayName("HsnSacDataFetcher supports 'hsn-sac' and 'hsnpage-export'")
    void testSupports() {
        assertThat(hsnSacDataFetcher.supports("hsn-sac")).isTrue();
        assertThat(hsnSacDataFetcher.supports("HSN-SAC")).isTrue();
        assertThat(hsnSacDataFetcher.supports("hsnpage-export")).isTrue();
        assertThat(hsnSacDataFetcher.supports("other-report")).isFalse();
    }

    @Test
    @DisplayName("HsnSacDataFetcher fetches data with correct headers and rows")
    void testFetchAll() {
        ReportExportRequest request = new ReportExportRequest();
        ReportExportData data = hsnSacDataFetcher.fetch(request);

        assertThat(data.getReportTitle()).isEqualTo("HSN/SAC Master Report");
        assertThat(data.getHeaders()).containsExactly("Code", "Description", "Type", "CGST Rate (%)", "SGST Rate (%)", "IGST Rate (%)", "CESS Rate (%)", "Status");
        assertThat(data.getRows()).hasSize(2);
        assertThat(data.getRows().get(0)).contains("8471", "Automatic data processing machines", "HSN", "Active");
        assertThat(data.getRows().get(1)).contains("998314", "Information technology consulting services", "SAC", "Active");
    }

    @Test
    @DisplayName("HsnSacDataFetcher filters rows by selectedIds when provided")
    void testFetchWithSelectedIds() {
        ReportExportRequest request = new ReportExportRequest();
        request.setFilters(Map.of("selectedIds", List.of(item1Id.toString())));

        ReportExportData data = hsnSacDataFetcher.fetch(request);

        assertThat(data.getRows()).hasSize(1);
        assertThat(data.getRows().get(0).get(0)).isEqualTo("8471");
    }

    @Test
    @DisplayName("Export to PDF succeeds and generates valid PDF binary with %PDF header")
    void testExportPdf() throws IOException {
        ReportExportRequest request = new ReportExportRequest();
        request.setFormat(ExportFormat.PDF);

        MockHttpServletResponse response = new MockHttpServletResponse();
        reportExportManager.exportReport("hsn-sac", request, response);

        assertThat(response.getContentType()).isEqualTo("application/pdf");
        assertThat(response.getHeader("Content-Disposition")).contains("hsn-sac-");
        assertThat(response.getHeader("Content-Disposition")).contains(".pdf");

        byte[] bytes = response.getContentAsByteArray();
        assertThat(bytes.length).isGreaterThan(100);
        // PDF magic bytes %PDF
        assertThat(new String(bytes, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    @DisplayName("Export to Excel (XLSX) succeeds and generates valid spreadsheet binary with PK zip header")
    void testExportExcel() throws IOException {
        ReportExportRequest request = new ReportExportRequest();
        request.setFormat(ExportFormat.XLSX);

        MockHttpServletResponse response = new MockHttpServletResponse();
        reportExportManager.exportReport("hsn-sac", request, response);

        assertThat(response.getContentType()).isEqualTo("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        assertThat(response.getHeader("Content-Disposition")).contains("hsn-sac-");
        assertThat(response.getHeader("Content-Disposition")).contains(".xlsx");

        byte[] bytes = response.getContentAsByteArray();
        assertThat(bytes.length).isGreaterThan(100);
        // Zip magic bytes PK (0x50, 0x4B) for openxml
        assertThat(bytes[0]).isEqualTo((byte) 'P');
        assertThat(bytes[1]).isEqualTo((byte) 'K');
    }

    @Test
    @DisplayName("Export to CSV succeeds and contains headers and row data")
    void testExportCsv() throws IOException {
        ReportExportRequest request = new ReportExportRequest();
        request.setFormat(ExportFormat.CSV);

        MockHttpServletResponse response = new MockHttpServletResponse();
        reportExportManager.exportReport("hsn-sac", request, response);

        assertThat(response.getContentType()).isEqualTo("text/csv");
        assertThat(response.getHeader("Content-Disposition")).contains("hsn-sac-");
        assertThat(response.getHeader("Content-Disposition")).contains(".csv");

        String content = response.getContentAsString();
        assertThat(content).contains("Code,Description,Type,CGST Rate (%),SGST Rate (%),IGST Rate (%),CESS Rate (%),Status");
        assertThat(content).contains("8471");
        assertThat(content).contains("Automatic data processing machines");
        assertThat(content).contains("998314");
    }

    @Test
    @DisplayName("Tenant isolation: Normal user requesting unauthorized company is denied with 403 Forbidden")
    void testCompanyIsolationDeniedForMismatch() {
        // Normal user belonging to userCompany
        UUID userCompany = UUID.randomUUID();
        CurrentUserContext.setCompanyId(userCompany);
        CurrentUserContext.setUserRole("EMPLOYEE");

        UUID unauthorizedCompany = UUID.randomUUID();
        ReportExportRequest req = new ReportExportRequest();
        req.setFormat(ExportFormat.CSV);

        RequestWrapper<ReportExportRequest> wrapper = new RequestWrapper<>();
        wrapper.setData(req);

        MockHttpServletResponse response = new MockHttpServletResponse();

        assertThatThrownBy(() -> reportController.exportReport("hsn-sac", unauthorizedCompany, wrapper, response))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access denied for the requested company resource");
    }

    @Test
    @DisplayName("Tenant isolation: Owner or user accessing own company is granted")
    void testCompanyIsolationAllowedForOwnCompanyOrOwner() throws IOException {
        CurrentUserContext.setCompanyId(companyId);
        CurrentUserContext.setUserRole("OWNER");

        ReportExportRequest req = new ReportExportRequest();
        req.setFormat(ExportFormat.CSV);

        RequestWrapper<ReportExportRequest> wrapper = new RequestWrapper<>();
        wrapper.setData(req);

        MockHttpServletResponse response = new MockHttpServletResponse();
        reportController.exportReport("hsn-sac", companyId, wrapper, response);

        assertThat(response.getContentType()).isEqualTo("text/csv");
        assertThat(response.getContentAsString()).contains("8471");
    }
}
