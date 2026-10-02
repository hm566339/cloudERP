package com.erp.account.modules.report.gst.service.impl;

import com.erp.account.modules.report.gst.dto.Gstr2bReconciliationDto;
import com.erp.account.modules.report.gst.dto.Gstr2bReconciliationRequest;
import com.erp.account.modules.report.gst.dto.Gstr2bReconciliationRequest.Gstr2bPortalEntry;
import com.erp.account.modules.report.gst.service.Gstr2bReconciliationService;
import com.erp.account.util.TenantUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import com.erp.account.modules.report.gst.gstr2b.repository.Gstr2bReconciliationRepository;
import com.erp.account.modules.report.gst.gstr2b.entity.Gstr2bReconciliation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class Gstr2bReconciliationServiceImpl implements Gstr2bReconciliationService {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private Gstr2bReconciliationRepository gstr2bReconciliationRepository;

    @Override
    public Gstr2bReconciliationDto reconcileGstr2b(Gstr2bReconciliationRequest request) {
        UUID companyId = TenantUtils.resolveCompanyIdForQuery(request.getCompanyId());
        log.info("Performing GSTR-2B Reconciliation for companyId={}", companyId);

        List<Gstr2bPortalEntry> portalEntries = request.getPortalEntries() != null ? request.getPortalEntries() : Collections.emptyList();
        
        // Query AP Invoices from Books
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT a.id, a.invoice_number, a.invoice_date, v.vendor_name, v.gstin, ")
           .append("COALESCE(a.subtotal, 0), COALESCE(a.tax_amount, 0) ")
           .append("FROM ap_invoice a ")
           .append("LEFT JOIN vendor v ON a.vendor_id = v.id ")
           .append("WHERE a.invoice_date BETWEEN :fromDate AND :toDate ")
           .append("AND (a.is_deleted = false OR a.is_deleted IS NULL) ");
        if (companyId != null) {
            sql.append("AND a.company_id = :companyId ");
        }

        Query query = entityManager.createNativeQuery(sql.toString());
        query.setParameter("fromDate", request.getFromDate());
        query.setParameter("toDate", request.getToDate());
        if (companyId != null) {
            query.setParameter("companyId", companyId);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> bookRows = query.getResultList();

        Map<String, Object[]> booksByInvNo = new HashMap<>();
        for (Object[] row : bookRows) {
            String invNo = row[1] != null ? normalizeInvNo(row[1].toString()) : "";
            if (!invNo.isEmpty()) {
                booksByInvNo.put(invNo, row);
            }
        }

        Set<String> matchedInvNos = new HashSet<>();
        List<Gstr2bReconciliationDto.Gstr2bItemDto> items = new ArrayList<>();

        long matchedCount = 0;
        BigDecimal matchedTaxable = BigDecimal.ZERO;
        long mismatchedCount = 0;
        BigDecimal mismatchedTaxable = BigDecimal.ZERO;
        long missingInBooksCount = 0;
        BigDecimal missingInBooksTaxable = BigDecimal.ZERO;
        long missingIn2bCount = 0;
        BigDecimal missingIn2bTaxable = BigDecimal.ZERO;

        for (Gstr2bPortalEntry portal : portalEntries) {
            String invNoKey = normalizeInvNo(portal.getInvoiceNumber());
            Object[] bookRow = booksByInvNo.get(invNoKey);

            if (bookRow != null) {
                matchedInvNos.add(invNoKey);
                BigDecimal booksTaxable = toBigDecimal(bookRow[5]);
                BigDecimal booksTax = toBigDecimal(bookRow[6]);

                BigDecimal portalTaxable = portal.getTaxableValue() != null ? portal.getTaxableValue() : BigDecimal.ZERO;
                BigDecimal portalTax = (portal.getCgst() != null ? portal.getCgst() : BigDecimal.ZERO)
                        .add(portal.getSgst() != null ? portal.getSgst() : BigDecimal.ZERO)
                        .add(portal.getIgst() != null ? portal.getIgst() : BigDecimal.ZERO)
                        .add(portal.getCess() != null ? portal.getCess() : BigDecimal.ZERO);

                BigDecimal diff = booksTaxable.subtract(portalTaxable).abs();
                boolean isMatch = diff.compareTo(new BigDecimal("1.00")) <= 0;

                if (isMatch) {
                    matchedCount++;
                    matchedTaxable = matchedTaxable.add(booksTaxable);
                    items.add(Gstr2bReconciliationDto.Gstr2bItemDto.builder()
                            .gstin(portal.getGstin())
                            .supplierName(portal.getSupplierName())
                            .invoiceNumber(portal.getInvoiceNumber())
                            .invoiceDate(portal.getInvoiceDate())
                            .booksTaxableValue(booksTaxable)
                            .portalTaxableValue(portalTaxable)
                            .booksTaxAmount(booksTax)
                            .portalTaxAmount(portalTax)
                            .differenceAmount(diff)
                            .status("MATCHED")
                            .remarks("Invoice and tax amounts match portal entry.")
                            .build());

                    gstr2bReconciliationRepository.save(Gstr2bReconciliation.builder()
                            .companyId(companyId)
                            .supplierGstin(portal.getGstin())
                            .invoiceNumber(portal.getInvoiceNumber())
                            .taxableValue(booksTaxable)
                            .taxAmount(booksTax)
                            .matchStatus("MATCHED")
                            .remarks("Invoice and tax amounts match portal entry.")
                            .reconciliationDate(java.time.LocalDateTime.now())
                            .build());
                } else {
                    mismatchedCount++;
                    mismatchedTaxable = mismatchedTaxable.add(booksTaxable);
                    items.add(Gstr2bReconciliationDto.Gstr2bItemDto.builder()
                            .gstin(portal.getGstin())
                            .supplierName(portal.getSupplierName())
                            .invoiceNumber(portal.getInvoiceNumber())
                            .invoiceDate(portal.getInvoiceDate())
                            .booksTaxableValue(booksTaxable)
                            .portalTaxableValue(portalTaxable)
                            .booksTaxAmount(booksTax)
                            .portalTaxAmount(portalTax)
                            .differenceAmount(diff)
                            .status("MISMATCHED_AMOUNT")
                            .remarks("Taxable or tax amount mismatch between Books and 2B.")
                            .build());
                }
            } else {
                missingInBooksCount++;
                BigDecimal portalTaxable = portal.getTaxableValue() != null ? portal.getTaxableValue() : BigDecimal.ZERO;
                missingInBooksTaxable = missingInBooksTaxable.add(portalTaxable);
                items.add(Gstr2bReconciliationDto.Gstr2bItemDto.builder()
                        .gstin(portal.getGstin())
                        .supplierName(portal.getSupplierName())
                        .invoiceNumber(portal.getInvoiceNumber())
                        .invoiceDate(portal.getInvoiceDate())
                        .booksTaxableValue(BigDecimal.ZERO)
                        .portalTaxableValue(portalTaxable)
                        .booksTaxAmount(BigDecimal.ZERO)
                        .portalTaxAmount((portal.getCgst() != null ? portal.getCgst() : BigDecimal.ZERO)
                                .add(portal.getSgst() != null ? portal.getSgst() : BigDecimal.ZERO)
                                .add(portal.getIgst() != null ? portal.getIgst() : BigDecimal.ZERO))
                        .differenceAmount(portalTaxable)
                        .status("MISSING_IN_BOOKS")
                        .remarks("Present in GSTR-2B but missing in Purchase Register.")
                        .build());
            }
        }

        // Find Invoices in Books missing in 2B
        for (Map.Entry<String, Object[]> entry : booksByInvNo.entrySet()) {
            if (!matchedInvNos.contains(entry.getKey())) {
                Object[] bookRow = entry.getValue();
                missingIn2bCount++;
                BigDecimal booksTaxable = toBigDecimal(bookRow[5]);
                missingIn2bTaxable = missingIn2bTaxable.add(booksTaxable);

                items.add(Gstr2bReconciliationDto.Gstr2bItemDto.builder()
                        .gstin(bookRow[4] != null ? bookRow[4].toString() : null)
                        .supplierName(bookRow[3] != null ? bookRow[3].toString() : null)
                        .invoiceNumber(bookRow[1] != null ? bookRow[1].toString() : null)
                        .invoiceDate(toLocalDate(bookRow[2]))
                        .booksTaxableValue(booksTaxable)
                        .portalTaxableValue(BigDecimal.ZERO)
                        .booksTaxAmount(toBigDecimal(bookRow[6]))
                        .portalTaxAmount(BigDecimal.ZERO)
                        .differenceAmount(booksTaxable)
                        .status("MISSING_IN_2B")
                        .remarks("Present in Purchase Register but missing in GSTR-2B.")
                        .build());
            }
        }

        Gstr2bReconciliationDto.Gstr2bSummaryDto summary = Gstr2bReconciliationDto.Gstr2bSummaryDto.builder()
                .matchedCount(matchedCount)
                .matchedTaxableAmount(matchedTaxable)
                .mismatchedCount(mismatchedCount)
                .mismatchedTaxableAmount(mismatchedTaxable)
                .missingIn2bCount(missingIn2bCount)
                .missingIn2bTaxableAmount(missingIn2bTaxable)
                .missingInBooksCount(missingInBooksCount)
                .missingInBooksTaxableAmount(missingInBooksTaxable)
                .build();

        return Gstr2bReconciliationDto.builder()
                .summary(summary)
                .items(items)
                .build();
    }

    private String normalizeInvNo(String invNo) {
        return invNo == null ? "" : invNo.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal) return (BigDecimal) val;
        try {
            return new BigDecimal(val.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private LocalDate toLocalDate(Object val) {
        if (val == null) return null;
        if (val instanceof java.sql.Date) return ((java.sql.Date) val).toLocalDate();
        if (val instanceof LocalDate) return (LocalDate) val;
        return null;
    }
}
