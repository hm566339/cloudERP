package com.erp.account.modules.report.gst.service;

import com.erp.account.modules.report.gst.dto.Gstr2bReconciliationDto;
import com.erp.account.modules.report.gst.dto.Gstr2bReconciliationRequest;
import com.erp.account.modules.report.gst.dto.Gstr2bReconciliationRequest.Gstr2bPortalEntry;
import com.erp.account.modules.report.gst.gstr2b.repository.Gstr2bReconciliationRepository;
import com.erp.account.modules.report.gst.service.impl.Gstr2bReconciliationServiceImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class Gstr2bReconciliationServiceTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query query;

    @Mock
    private Gstr2bReconciliationRepository gstr2bReconciliationRepository;

    @InjectMocks
    private Gstr2bReconciliationServiceImpl reconciliationService;

    private UUID companyId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        ReflectionTestUtils.setField(reconciliationService, "entityManager", entityManager);
        ReflectionTestUtils.setField(reconciliationService, "gstr2bReconciliationRepository", gstr2bReconciliationRepository);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
    }

    @Test
    @DisplayName("Two different suppliers with the same invoice number should not collide")
    void testTwoDifferentSuppliers_SameInvoiceNumber_NoCollision() {
        // Books: Supplier A and Supplier B both have invoice "INV-100"
        List<Object[]> bookRows = new ArrayList<>();
        bookRows.add(new Object[]{
                UUID.randomUUID(), "INV-100", Date.valueOf("2026-04-10"), "Supplier Alpha", "27AAAAA0000A1Z5",
                new BigDecimal("5000.00"), new BigDecimal("900.00")
        });
        bookRows.add(new Object[]{
                UUID.randomUUID(), "INV-100", Date.valueOf("2026-04-12"), "Supplier Beta", "29BBBBB0000B1Z5",
                new BigDecimal("8000.00"), new BigDecimal("1440.00")
        });
        when(query.getResultList()).thenReturn(bookRows);

        // GSTR-2B Portal: Entries for both suppliers
        List<Gstr2bPortalEntry> portalEntries = List.of(
                Gstr2bPortalEntry.builder()
                        .gstin("27AAAAA0000A1Z5")
                        .supplierName("Supplier Alpha")
                        .invoiceNumber("INV-100")
                        .taxableValue(new BigDecimal("5000.00"))
                        .cgst(new BigDecimal("450.00"))
                        .sgst(new BigDecimal("450.00"))
                        .build(),
                Gstr2bPortalEntry.builder()
                        .gstin("29BBBBB0000B1Z5")
                        .supplierName("Supplier Beta")
                        .invoiceNumber("INV-100")
                        .taxableValue(new BigDecimal("8000.00"))
                        .igst(new BigDecimal("1440.00"))
                        .build()
        );

        Gstr2bReconciliationRequest request = Gstr2bReconciliationRequest.builder()
                .companyId(companyId)
                .fromDate(LocalDate.of(2026, 4, 1))
                .toDate(LocalDate.of(2026, 4, 30))
                .portalEntries(portalEntries)
                .build();

        Gstr2bReconciliationDto result = reconciliationService.reconcileGstr2b(request);

        assertEquals(2, result.getSummary().getMatchedCount());
        assertEquals(0, result.getSummary().getMismatchedCount());
        assertEquals(0, result.getSummary().getMissingInBooksCount());
        assertEquals(0, result.getSummary().getMissingIn2bCount());
        assertEquals(2, result.getItems().size());
        assertTrue(result.getItems().stream().allMatch(i -> "MATCHED".equals(i.getStatus())));
    }

    @Test
    @DisplayName("Same supplier and invoice with matching amounts")
    void testSameSupplierAndInvoice_MatchingAmounts() {
        List<Object[]> bookRows = Collections.singletonList(new Object[]{
                UUID.randomUUID(), "INV-001", Date.valueOf("2026-04-05"), "Vendor One", "27AAAAA0000A1Z5",
                new BigDecimal("10000.00"), new BigDecimal("1800.00")
        });
        when(query.getResultList()).thenReturn(bookRows);

        List<Gstr2bPortalEntry> portalEntries = List.of(
                Gstr2bPortalEntry.builder()
                        .gstin("27AAAAA0000A1Z5")
                        .supplierName("Vendor One")
                        .invoiceNumber("INV-001")
                        .taxableValue(new BigDecimal("10000.00"))
                        .cgst(new BigDecimal("900.00"))
                        .sgst(new BigDecimal("900.00"))
                        .build()
        );

        Gstr2bReconciliationRequest request = Gstr2bReconciliationRequest.builder()
                .companyId(companyId)
                .fromDate(LocalDate.of(2026, 4, 1))
                .toDate(LocalDate.of(2026, 4, 30))
                .portalEntries(portalEntries)
                .build();

        Gstr2bReconciliationDto result = reconciliationService.reconcileGstr2b(request);

        assertEquals(1, result.getSummary().getMatchedCount());
        assertEquals(0, new BigDecimal("10000.00").compareTo(result.getSummary().getMatchedTaxableAmount()));
        assertEquals("MATCHED", result.getItems().get(0).getStatus());
    }

    @Test
    @DisplayName("Same supplier and invoice with different amounts should be flagged as MISMATCHED_AMOUNT")
    void testSameSupplierAndInvoice_MismatchedAmounts() {
        List<Object[]> bookRows = Collections.singletonList(new Object[]{
                UUID.randomUUID(), "INV-002", Date.valueOf("2026-04-06"), "Vendor Two", "27BBBBB0000B1Z5",
                new BigDecimal("12000.00"), new BigDecimal("2160.00")
        });
        when(query.getResultList()).thenReturn(bookRows);

        List<Gstr2bPortalEntry> portalEntries = List.of(
                Gstr2bPortalEntry.builder()
                        .gstin("27BBBBB0000B1Z5")
                        .supplierName("Vendor Two")
                        .invoiceNumber("INV-002")
                        .taxableValue(new BigDecimal("10000.00")) // difference of 2000 > 1.00 tolerance
                        .cgst(new BigDecimal("900.00"))
                        .sgst(new BigDecimal("900.00"))
                        .build()
        );

        Gstr2bReconciliationRequest request = Gstr2bReconciliationRequest.builder()
                .companyId(companyId)
                .fromDate(LocalDate.of(2026, 4, 1))
                .toDate(LocalDate.of(2026, 4, 30))
                .portalEntries(portalEntries)
                .build();

        Gstr2bReconciliationDto result = reconciliationService.reconcileGstr2b(request);

        assertEquals(0, result.getSummary().getMatchedCount());
        assertEquals(1, result.getSummary().getMismatchedCount());
        assertEquals("MISMATCHED_AMOUNT", result.getItems().get(0).getStatus());
        assertEquals(0, new BigDecimal("2000.00").compareTo(result.getItems().get(0).getDifferenceAmount()));
    }

    @Test
    @DisplayName("Invoice present only in Books should be reported as MISSING_IN_2B")
    void testInvoicePresentOnlyInBooks() {
        List<Object[]> bookRows = Collections.singletonList(new Object[]{
                UUID.randomUUID(), "INV-BOOKS-ONLY", Date.valueOf("2026-04-07"), "Vendor Three", "27CCCCC0000C1Z5",
                new BigDecimal("15000.00"), new BigDecimal("2700.00")
        });
        when(query.getResultList()).thenReturn(bookRows);

        Gstr2bReconciliationRequest request = Gstr2bReconciliationRequest.builder()
                .companyId(companyId)
                .fromDate(LocalDate.of(2026, 4, 1))
                .toDate(LocalDate.of(2026, 4, 30))
                .portalEntries(Collections.emptyList())
                .build();

        Gstr2bReconciliationDto result = reconciliationService.reconcileGstr2b(request);

        assertEquals(0, result.getSummary().getMatchedCount());
        assertEquals(1, result.getSummary().getMissingIn2bCount());
        assertEquals("MISSING_IN_2B", result.getItems().get(0).getStatus());
        assertEquals(0, new BigDecimal("15000.00").compareTo(result.getSummary().getMissingIn2bTaxableAmount()));
    }

    @Test
    @DisplayName("Invoice present only in GSTR-2B should be reported as MISSING_IN_BOOKS")
    void testInvoicePresentOnlyInGstr2b() {
        when(query.getResultList()).thenReturn(Collections.emptyList());

        List<Gstr2bPortalEntry> portalEntries = List.of(
                Gstr2bPortalEntry.builder()
                        .gstin("27DDDDD0000D1Z5")
                        .supplierName("Vendor Four")
                        .invoiceNumber("INV-PORTAL-ONLY")
                        .taxableValue(new BigDecimal("20000.00"))
                        .cgst(new BigDecimal("1800.00"))
                        .sgst(new BigDecimal("1800.00"))
                        .build()
        );

        Gstr2bReconciliationRequest request = Gstr2bReconciliationRequest.builder()
                .companyId(companyId)
                .fromDate(LocalDate.of(2026, 4, 1))
                .toDate(LocalDate.of(2026, 4, 30))
                .portalEntries(portalEntries)
                .build();

        Gstr2bReconciliationDto result = reconciliationService.reconcileGstr2b(request);

        assertEquals(0, result.getSummary().getMatchedCount());
        assertEquals(1, result.getSummary().getMissingInBooksCount());
        assertEquals("MISSING_IN_BOOKS", result.getItems().get(0).getStatus());
        assertEquals(0, new BigDecimal("20000.00").compareTo(result.getSummary().getMissingInBooksTaxableAmount()));
    }

    @Test
    @DisplayName("Invoice numbers differing only by whitespace or letter case should match correctly")
    void testInvoiceNumbersDifferingOnlyByWhitespaceOrLetterCase() {
        // Books: lowercase with leading/trailing spaces and hyphen spacing
        List<Object[]> bookRows = Collections.singletonList(new Object[]{
                UUID.randomUUID(), " inv - 005 ", Date.valueOf("2026-04-08"), "Vendor Five", " 27EEEEE0000E1Z5 ",
                new BigDecimal("7500.00"), new BigDecimal("1350.00")
        });
        when(query.getResultList()).thenReturn(bookRows);

        // GSTR-2B Portal: uppercase without spaces
        List<Gstr2bPortalEntry> portalEntries = List.of(
                Gstr2bPortalEntry.builder()
                        .gstin("27EEEEE0000E1Z5")
                        .supplierName("Vendor Five")
                        .invoiceNumber("INV-005")
                        .taxableValue(new BigDecimal("7500.00"))
                        .cgst(new BigDecimal("675.00"))
                        .sgst(new BigDecimal("675.00"))
                        .build()
        );

        Gstr2bReconciliationRequest request = Gstr2bReconciliationRequest.builder()
                .companyId(companyId)
                .fromDate(LocalDate.of(2026, 4, 1))
                .toDate(LocalDate.of(2026, 4, 30))
                .portalEntries(portalEntries)
                .build();

        Gstr2bReconciliationDto result = reconciliationService.reconcileGstr2b(request);

        assertEquals(1, result.getSummary().getMatchedCount());
        assertEquals("MATCHED", result.getItems().get(0).getStatus());
    }

    @Test
    @DisplayName("Duplicate invoices in GSTR-2B portal and missing GSTIN handling")
    void testDuplicateInvoicesAndMissingGstin() {
        // Books: 1 invoice
        List<Object[]> bookRows = Collections.singletonList(new Object[]{
                UUID.randomUUID(), "INV-DUP-01", Date.valueOf("2026-04-09"), "Vendor Six", "27FFFFFF0000F1Z5",
                new BigDecimal("4000.00"), new BigDecimal("720.00")
        });
        when(query.getResultList()).thenReturn(bookRows);

        // Portal: 1st entry is valid match, 2nd entry is duplicate of the first, 3rd entry has missing GSTIN
        List<Gstr2bPortalEntry> portalEntries = List.of(
                Gstr2bPortalEntry.builder()
                        .gstin("27FFFFFF0000F1Z5")
                        .supplierName("Vendor Six")
                        .invoiceNumber("INV-DUP-01")
                        .taxableValue(new BigDecimal("4000.00"))
                        .cgst(new BigDecimal("360.00"))
                        .sgst(new BigDecimal("360.00"))
                        .build(),
                Gstr2bPortalEntry.builder()
                        .gstin("27FFFFFF0000F1Z5")
                        .supplierName("Vendor Six")
                        .invoiceNumber("INV-DUP-01")
                        .taxableValue(new BigDecimal("4000.00"))
                        .cgst(new BigDecimal("360.00"))
                        .sgst(new BigDecimal("360.00"))
                        .build(),
                Gstr2bPortalEntry.builder()
                        .gstin(null) // Missing GSTIN
                        .supplierName("Unknown Vendor")
                        .invoiceNumber("INV-NO-GSTIN")
                        .taxableValue(new BigDecimal("3000.00"))
                        .cgst(new BigDecimal("270.00"))
                        .sgst(new BigDecimal("270.00"))
                        .build()
        );

        Gstr2bReconciliationRequest request = Gstr2bReconciliationRequest.builder()
                .companyId(companyId)
                .fromDate(LocalDate.of(2026, 4, 1))
                .toDate(LocalDate.of(2026, 4, 30))
                .portalEntries(portalEntries)
                .build();

        Gstr2bReconciliationDto result = reconciliationService.reconcileGstr2b(request);

        // 1 matched, 2 non-matching (1 duplicate + 1 missing GSTIN)
        assertEquals(1, result.getSummary().getMatchedCount());
        assertEquals(2, result.getSummary().getMismatchedCount());

        assertEquals("MATCHED", result.getItems().get(0).getStatus());
        assertEquals("DUPLICATE", result.getItems().get(1).getStatus());
        assertEquals("AMBIGUOUS", result.getItems().get(2).getStatus());
    }
}
