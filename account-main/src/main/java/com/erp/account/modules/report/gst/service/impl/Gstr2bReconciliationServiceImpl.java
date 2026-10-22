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

        Map<String, List<Object[]>> booksByKey = new LinkedHashMap<>();
        for (Object[] row : bookRows) {
            String invNo = row[1] != null ? row[1].toString() : "";
            String gstin = row[4] != null ? row[4].toString() : "";
            String key = buildCompositeKey(gstin, invNo);
            if (!key.equals("_")) {
                booksByKey.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
            }
        }

        Set<Object> matchedBookRowIds = new HashSet<>();
        Set<String> matchedKeys = new HashSet<>();
        Set<String> seenPortalKeys = new HashSet<>();
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
            String pGstin = portal.getGstin();
            String pInvNo = portal.getInvoiceNumber();
            String pNormGstin = normalizeGstin(pGstin);
            String pNormInvNo = normalizeInvNo(pInvNo);
            String key = pNormGstin + "_" + pNormInvNo;

            BigDecimal portalTaxable = portal.getTaxableValue() != null ? portal.getTaxableValue() : BigDecimal.ZERO;
            BigDecimal portalTax = (portal.getCgst() != null ? portal.getCgst() : BigDecimal.ZERO)
                    .add(portal.getSgst() != null ? portal.getSgst() : BigDecimal.ZERO)
                    .add(portal.getIgst() != null ? portal.getIgst() : BigDecimal.ZERO)
                    .add(portal.getCess() != null ? portal.getCess() : BigDecimal.ZERO);

            if (pNormGstin.isEmpty()) {
                mismatchedCount++;
                mismatchedTaxable = mismatchedTaxable.add(portalTaxable);
                items.add(Gstr2bReconciliationDto.Gstr2bItemDto.builder()
                        .gstin(pGstin)
                        .supplierName(portal.getSupplierName())
                        .invoiceNumber(pInvNo)
                        .invoiceDate(portal.getInvoiceDate())
                        .booksTaxableValue(BigDecimal.ZERO)
                        .portalTaxableValue(portalTaxable)
                        .booksTaxAmount(BigDecimal.ZERO)
                        .portalTaxAmount(portalTax)
                        .differenceAmount(portalTaxable)
                        .status("AMBIGUOUS")
                        .remarks("Missing supplier GSTIN in GSTR-2B; cannot verify supplier without GSTIN.")
                        .build());
                continue;
            }

            List<Object[]> candidateBookRows = booksByKey.get(key);
            Object[] matchedBookRow = null;

            if (candidateBookRows != null) {
                for (Object[] candidate : candidateBookRows) {
                    Object rowId = candidate[0];
                    if (!matchedBookRowIds.contains(rowId)) {
                        matchedBookRow = candidate;
                        break;
                    }
                }
            }

            if (matchedBookRow != null) {
                Object rowId = matchedBookRow[0];
                matchedBookRowIds.add(rowId);
                matchedKeys.add(key);
                seenPortalKeys.add(key);

                BigDecimal booksTaxable = toBigDecimal(matchedBookRow[5]);
                BigDecimal booksTax = toBigDecimal(matchedBookRow[6]);

                BigDecimal diff = booksTaxable.subtract(portalTaxable).abs();
                BigDecimal taxDiff = booksTax.subtract(portalTax).abs();
                boolean isMatch = diff.compareTo(new BigDecimal("1.00")) <= 0 && taxDiff.compareTo(new BigDecimal("1.00")) <= 0;

                BigDecimal reportDiff = diff.compareTo(BigDecimal.ZERO) > 0 ? diff : taxDiff;

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
                            .differenceAmount(reportDiff)
                            .status("MATCHED")
                            .remarks("Invoice and tax amounts match portal entry.")
                            .build());

                    if (gstr2bReconciliationRepository != null) {
                        try {
                            String saveGstin = pNormGstin.isEmpty() ? "UNKNOWN" : portal.getGstin().trim();
                            UUID saveCompanyId = companyId != null ? companyId : UUID.fromString("00000000-0000-0000-0000-000000000000");
                            gstr2bReconciliationRepository.save(Gstr2bReconciliation.builder()
                                    .companyId(saveCompanyId)
                                    .supplierGstin(saveGstin)
                                    .invoiceNumber(portal.getInvoiceNumber() != null ? portal.getInvoiceNumber() : "")
                                    .invoiceDate(portal.getInvoiceDate())
                                    .taxableValue(booksTaxable)
                                    .taxAmount(booksTax)
                                    .matchStatus("MATCHED")
                                    .remarks("Invoice and tax amounts match portal entry.")
                                    .reconciliationDate(java.time.LocalDateTime.now())
                                    .build());
                        } catch (Exception e) {
                            log.warn("Failed to persist reconciliation audit record: {}", e.getMessage());
                        }
                    }
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
                            .differenceAmount(reportDiff)
                            .status("MISMATCHED_AMOUNT")
                            .remarks("Taxable or tax amount mismatch between Books and 2B.")
                            .build());
                }
            } else {
                if (seenPortalKeys.contains(key)) {
                    mismatchedCount++;
                    mismatchedTaxable = mismatchedTaxable.add(portalTaxable);
                    items.add(Gstr2bReconciliationDto.Gstr2bItemDto.builder()
                            .gstin(portal.getGstin())
                            .supplierName(portal.getSupplierName())
                            .invoiceNumber(portal.getInvoiceNumber())
                            .invoiceDate(portal.getInvoiceDate())
                            .booksTaxableValue(BigDecimal.ZERO)
                            .portalTaxableValue(portalTaxable)
                            .booksTaxAmount(BigDecimal.ZERO)
                            .portalTaxAmount(portalTax)
                            .differenceAmount(portalTaxable)
                            .status("DUPLICATE")
                            .remarks("Duplicate invoice in GSTR-2B; portal entry already reconciled.")
                            .build());
                } else {
                    missingInBooksCount++;
                    missingInBooksTaxable = missingInBooksTaxable.add(portalTaxable);
                    items.add(Gstr2bReconciliationDto.Gstr2bItemDto.builder()
                            .gstin(portal.getGstin())
                            .supplierName(portal.getSupplierName())
                            .invoiceNumber(portal.getInvoiceNumber())
                            .invoiceDate(portal.getInvoiceDate())
                            .booksTaxableValue(BigDecimal.ZERO)
                            .portalTaxableValue(portalTaxable)
                            .booksTaxAmount(BigDecimal.ZERO)
                            .portalTaxAmount(portalTax)
                            .differenceAmount(portalTaxable)
                            .status("MISSING_IN_BOOKS")
                            .remarks("Present in GSTR-2B but missing in Purchase Register.")
                            .build());
                }
            }
        }

        // Find Invoices in Books missing in 2B (or duplicate book records)
        for (Map.Entry<String, List<Object[]>> entry : booksByKey.entrySet()) {
            String key = entry.getKey();
            boolean keyWasMatched = matchedKeys.contains(key);
            for (Object[] bookRow : entry.getValue()) {
                Object rowId = bookRow[0];
                if (!matchedBookRowIds.contains(rowId)) {
                    missingIn2bCount++;
                    BigDecimal booksTaxable = toBigDecimal(bookRow[5]);
                    missingIn2bTaxable = missingIn2bTaxable.add(booksTaxable);

                    boolean isDuplicateInBooks = keyWasMatched;
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
                            .status(isDuplicateInBooks ? "DUPLICATE" : "MISSING_IN_2B")
                            .remarks(isDuplicateInBooks ?
                                    "Duplicate invoice in Purchase Register; additional entry not found in GSTR-2B." :
                                    "Present in Purchase Register but missing in GSTR-2B.")
                            .build());
                }
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

    private String normalizeGstin(String gstin) {
        if (gstin == null) return "";
        return gstin.trim().replaceAll("\\s+", "").toUpperCase();
    }

    private String normalizeInvNo(String invNo) {
        if (invNo == null) return "";
        return invNo.trim().replaceAll("\\s+", "").toUpperCase();
    }

    private String buildCompositeKey(String gstin, String invNo) {
        return normalizeGstin(gstin) + "_" + normalizeInvNo(invNo);
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
