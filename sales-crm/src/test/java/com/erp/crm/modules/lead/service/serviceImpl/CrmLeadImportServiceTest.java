package com.erp.crm.modules.lead.service.serviceImpl;

import com.erp.crm.common.exception.BadRequestException;
import com.erp.crm.modules.integration.entity.CrmLeadImportBatch;
import com.erp.crm.modules.integration.repository.CrmLeadImportBatchRepository;
import com.erp.crm.modules.lead.dto.importbatch.LeadImportSummaryResponse;
import com.erp.crm.modules.lead.entity.CrmLead;
import com.erp.crm.modules.lead.repository.CrmLeadRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmLeadImportServiceTest {

    @Mock
    private CrmLeadImportBatchRepository importBatchRepository;

    @Mock
    private CrmLeadRepository leadRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private CrmLeadImportServiceImpl leadImportService;

    private UUID companyId;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        com.erp.crm.common.security.CurrentUserContext.setCompanyId(companyId);
        com.erp.crm.common.security.CurrentUserContext.setUserId(UUID.randomUUID());
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        com.erp.crm.common.security.CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Should successfully import valid CSV leads and normalize E.164 phone numbers")
    void testValidCsvImportSuccess() {
        String csvContent = "First Name,Last Name,Company,Email,Phone,State,GSTIN\n" +
                "Ramesh,Kumar,Kumar Industries,ramesh@kumarind.com,+91 98220 12345,Maharashtra,27AABCK1234A1Z5\n" +
                "Sunil,Mehta,Mehta Tech,sunil@mehta.com,9823098765,Gujarat,24AAACM5678B1Z2\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "leads_valid.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        when(importBatchRepository.save(any(CrmLeadImportBatch.class))).thenAnswer(i -> {
            CrmLeadImportBatch b = i.getArgument(0);
            if (b.getId() == null) b.setId(UUID.randomUUID());
            return b;
        });

        when(leadRepository.findByCompanyIdAndNormalizedPhoneAndIsDeletedFalse(any(), any())).thenReturn(Optional.empty());
        when(leadRepository.findByCompanyIdAndNormalizedEmailAndIsDeletedFalse(any(), any())).thenReturn(Optional.empty());
        when(leadRepository.save(any(CrmLead.class))).thenAnswer(i -> i.getArgument(0));

        LeadImportSummaryResponse summary = leadImportService.importLeadsCsv(file, companyId);

        assertNotNull(summary);
        assertEquals(2, summary.getTotalRecords());
        assertEquals(2, summary.getImportedCount());
        assertEquals(0, summary.getDuplicateCount());
        assertEquals(0, summary.getFailedCount());
        assertEquals("COMPLETED", summary.getStatus());

        ArgumentCaptor<CrmLead> leadCaptor = ArgumentCaptor.forClass(CrmLead.class);
        verify(leadRepository, times(2)).save(leadCaptor.capture());

        CrmLead firstLead = leadCaptor.getAllValues().get(0);
        assertEquals("Ramesh", firstLead.getFirstName());
        assertEquals("+919822012345", firstLead.getNormalizedPhone());
        assertEquals("ramesh@kumarind.com", firstLead.getNormalizedEmail());
        assertEquals("Kumar Industries", firstLead.getOrganizationName());
    }

    @Test
    @DisplayName("Should sanitize CSV formula injection payloads on imported fields")
    void testCsvFormulaInjectionSanitization() {
        String maliciousCsv = "Name,Company,Email,Phone\n" +
                "=cmd|' /C calc'!A0,Safe Corp,test@safecorp.com,+919988776655\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "malicious.csv", "text/csv", maliciousCsv.getBytes(StandardCharsets.UTF_8));

        when(importBatchRepository.save(any(CrmLeadImportBatch.class))).thenAnswer(i -> {
            CrmLeadImportBatch b = i.getArgument(0);
            if (b.getId() == null) b.setId(UUID.randomUUID());
            return b;
        });
        when(leadRepository.save(any(CrmLead.class))).thenAnswer(i -> i.getArgument(0));

        leadImportService.importLeadsCsv(file, companyId);

        ArgumentCaptor<CrmLead> leadCaptor = ArgumentCaptor.forClass(CrmLead.class);
        verify(leadRepository).save(leadCaptor.capture());

        CrmLead saved = leadCaptor.getValue();
        // Formula injection prefix '=' must be sanitized with leading apostrophe
        assertTrue(saved.getFirstName().startsWith("'="), "Formula injection starting with '=' must be escaped with single quote");
    }

    @Test
    @DisplayName("Should detect and skip duplicate leads without failing the entire batch")
    void testDuplicateDetectionInCsv() {
        String csvContent = "First Name,Company,Email,Phone\n" +
                "Aarav,Sharma Corp,aarav@sharma.in,+919876543210\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "leads_dup.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        when(importBatchRepository.save(any(CrmLeadImportBatch.class))).thenAnswer(i -> {
            CrmLeadImportBatch b = i.getArgument(0);
            if (b.getId() == null) b.setId(UUID.randomUUID());
            return b;
        });

        // Simulate duplicate exists in DB
        when(leadRepository.findByCompanyIdAndNormalizedPhoneAndIsDeletedFalse(companyId, "+919876543210"))
                .thenReturn(Optional.of(new CrmLead()));

        LeadImportSummaryResponse summary = leadImportService.importLeadsCsv(file, companyId);

        assertEquals(1, summary.getTotalRecords());
        assertEquals(0, summary.getImportedCount());
        assertEquals(1, summary.getDuplicateCount());
        verify(leadRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should track partial row failures when mandatory contact fields are absent")
    void testPartialRowFailureTracking() {
        // Row 1 has valid lead. Row 2 is missing both phone and email.
        String csvContent = "First Name,Company,Email,Phone\n" +
                "Valid User,Valid Corp,valid@corp.com,+919876543210\n" +
                "Invalid User,Invalid Corp,,\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "partial.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        when(importBatchRepository.save(any(CrmLeadImportBatch.class))).thenAnswer(i -> {
            CrmLeadImportBatch b = i.getArgument(0);
            if (b.getId() == null) b.setId(UUID.randomUUID());
            return b;
        });
        when(leadRepository.save(any(CrmLead.class))).thenAnswer(i -> i.getArgument(0));

        LeadImportSummaryResponse summary = leadImportService.importLeadsCsv(file, companyId);

        assertEquals(2, summary.getTotalRecords());
        assertEquals(1, summary.getImportedCount());
        assertEquals(1, summary.getFailedCount());
        assertEquals("PARTIALLY_COMPLETED", summary.getStatus());
        assertEquals(1, summary.getErrors().size());
        assertEquals(3, summary.getErrors().get(0).getRowNumber()); // Line 3 (Header is 1, Row 1 is 2, Row 2 is 3)
    }

    @Test
    @DisplayName("Should reject empty CSV file with BadRequestException")
    void testEmptyFileRejection() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.csv", "text/csv", new byte[0]);

        assertThrows(BadRequestException.class, () -> leadImportService.importLeadsCsv(emptyFile, companyId));
    }
}
