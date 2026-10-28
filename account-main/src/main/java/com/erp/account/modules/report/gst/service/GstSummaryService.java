package com.erp.account.modules.report.gst.service;

import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.modules.report.gst.calculator.TaxCalculationEngine;
import com.erp.account.modules.report.gst.dto.*;
import com.erp.account.modules.report.gst.enums.ReportType;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.TenantUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Enterprise GST Summary Dashboard service.
 *
 * <p>Computes a structured dashboard (summary, taxSummary, itcSummary, gstLiability,
 * supplySummary, statistics, charts, exportOptions, audit) from a small set of
 * optimized aggregation queries. Entities are never exposed; all rows are projected
 * into lightweight DTOs. Responses are cached per filter combination.</p>
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class GstSummaryService {

    public static final String REPORT_NAME = "GST Summary Dashboard";
    public static final String REPORT_VERSION = "1.0.0";

    private static final List<String> INDIAN_COUNTRY_KEYS =
            List.of("IN", "INDIA", "BHARAT", "IND", "INR");

    private final TaxCalculationEngine calculationEngine;

    @PersistenceContext
    private EntityManager entityManager;

    public GstSummaryService(TaxCalculationEngine calculationEngine) {
        this.calculationEngine = calculationEngine;
    }

    @Cacheable(value = "gstSummaryReportCache", key = "#root.target.buildCacheKey(#filter)")
    public GstSummaryDto getSummary(GstReportFilterDto filter) {
        LocalDateTime generatedAt = LocalDateTime.now();
        String generatedBy = resolveGeneratedBy();

        UUID companyId = TenantUtils.resolveCompanyIdForQuery(filter.getCompanyId());
        UUID branchId = filter.getBranchId();
        UUID gstRegistrationId = resolveDefaultGstRegistration(filter.getGstRegistrationId(), companyId);

        log.info("Generating GST Summary Dashboard for Company: {} branch: {} gstRegistration: {} from {} to {}",
                companyId, branchId, gstRegistrationId, filter.getFromDate(), filter.getToDate());

        // ============================================================
        // VALIDATION
        // ============================================================
        validateCompanyExists(companyId);
        validateBranchOwnership(branchId, companyId);
        validateGstRegistrationOwnership(gstRegistrationId, companyId, branchId);

        FiscalYearInfo fiscalYear = resolveFiscalYear(filter.getFinancialYearId(), companyId);
        validateFiscalYear(filter.getFinancialYearId(), fiscalYear);

        LocalDate fromDate = filter.getFromDate();
        LocalDate toDate = filter.getToDate();
        if (fromDate == null && toDate == null && fiscalYear != null) {
            fromDate = fiscalYear.startDate();
            toDate = fiscalYear.endDate();
        }

        GstSummaryDto dto = new GstSummaryDto();

        ReportMetadata metadata = loadReportMetadata(
                companyId, branchId, gstRegistrationId, fiscalYear,
                fromDate, toDate, generatedAt, generatedBy);
        dto.setSummary(metadata.reportSummary());
        dto.setAudit(AuditDto.builder()
                .generatedAt(generatedAt)
                .generatedBy(generatedBy)
                .reportVersion(REPORT_VERSION)
                .build());
        dto.setExportOptions(ExportOptionsDto.builder()
                .pdfAvailable(true)
                .excelAvailable(true)
                .csvAvailable(true)
                .printAvailable(true)
                .build());

        if (!isValidDateRange(fromDate, toDate)) {
            // No usable period -> structured zero dashboard (backward compatible)
            return attachStructuredSections(dto, fromDate, toDate);
        }

        QueryScope scope = new QueryScope(
                companyId, branchId, gstRegistrationId,
                fromDate, toDate,
                trimToNull(filter.getStateCode()),
                filter.getCustomerId(),
                filter.getVendorId(),
                trimToNull(filter.getHsn()),
                filter.getGstRate() != null ? BigDecimal.valueOf(filter.getGstRate()) : null);

        String invoiceType = normalizeInvoiceType(filter.getInvoiceType());
        boolean salesSide = invoiceType == null || "ALL".equals(invoiceType) || "SALES".equals(invoiceType)
                || "CREDIT_NOTE".equals(invoiceType);
        boolean purchaseSide = invoiceType == null || "ALL".equals(invoiceType) || "PURCHASE".equals(invoiceType)
                || "DEBIT_NOTE".equals(invoiceType);
        boolean countCreditNotes = invoiceType == null || "ALL".equals(invoiceType)
                || "CREDIT_NOTE".equals(invoiceType) || "SALES".equals(invoiceType);
        boolean countDebitNotes = invoiceType == null || "ALL".equals(invoiceType)
                || "DEBIT_NOTE".equals(invoiceType) || "PURCHASE".equals(invoiceType);

        // ============================================================
        // 1. OUTWARD / INWARD AGGREGATES
        // ============================================================
        SalesAggregate sales = salesSide ? querySalesAggregate(scope) : SalesAggregate.empty();
        PurchaseAggregate purchase = purchaseSide ? queryPurchaseAggregate(scope) : PurchaseAggregate.empty();
        SalesAggregate creditNoteAggregate = countCreditNotes ? queryCreditNoteAggregate(scope) : SalesAggregate.empty();
        PurchaseAggregate debitNoteAggregate = countDebitNotes ? queryDebitNoteAggregate(scope) : PurchaseAggregate.empty();

        BigDecimal taxableAmount = sales.taxable().subtract(creditNoteAggregate.taxable()).max(BigDecimal.ZERO);
        BigDecimal cgst = sales.cgst().subtract(creditNoteAggregate.cgst()).max(BigDecimal.ZERO);
        BigDecimal sgst = sales.sgst().subtract(creditNoteAggregate.sgst()).max(BigDecimal.ZERO);
        BigDecimal igst = sales.igst().subtract(creditNoteAggregate.igst()).max(BigDecimal.ZERO);
        BigDecimal cess = sales.cess().subtract(creditNoteAggregate.cess()).max(BigDecimal.ZERO);
        BigDecimal totalTax = cgst.add(sgst).add(igst).add(cess);
        BigDecimal outputGst = totalTax;

        BigDecimal inputCgst = purchase.cgst().subtract(debitNoteAggregate.cgst()).max(BigDecimal.ZERO);
        BigDecimal inputSgst = purchase.sgst().subtract(debitNoteAggregate.sgst()).max(BigDecimal.ZERO);
        BigDecimal inputIgst = purchase.igst().subtract(debitNoteAggregate.igst()).max(BigDecimal.ZERO);
        BigDecimal inputCess = purchase.cess().subtract(debitNoteAggregate.cess()).max(BigDecimal.ZERO);
        BigDecimal inputGst = inputCgst.add(inputSgst).add(inputIgst).add(inputCess);

        BigDecimal reverseCharge = queryReverseCharge(scope);
        BigDecimal interest = BigDecimal.ZERO;
        BigDecimal lateFee = BigDecimal.ZERO;

        BigDecimal openingItc = queryOpeningItc(companyId, branchId);
        BigDecimal availableItc = inputGst;
        BigDecimal eligibleItc = availableItc;
        BigDecimal blockedItc = BigDecimal.ZERO;
        BigDecimal reversedItc = BigDecimal.ZERO;
        // Component-wise ITC set-off against forward-charge output liability under GST Rule 88A
        TaxCalculationEngine.Rule88aSetoffResult setoff = calculationEngine != null
                ? calculationEngine.calculateRule88aSetoff(
                        igst, cgst, sgst, cess,
                        inputIgst, inputCgst, inputSgst, inputCess,
                        reverseCharge, interest, lateFee)
                : null;

        BigDecimal utilizedItc = setoff != null ? setoff.getTotalUtilizedItc() : inputGst.min(outputGst);
        BigDecimal closingItc = openingItc.add(availableItc).subtract(utilizedItc).max(BigDecimal.ZERO);
        BigDecimal forwardChargePayable = setoff != null ? setoff.getForwardCashPayable() : outputGst.subtract(utilizedItc).max(BigDecimal.ZERO);
        // Net GST Liability = Forward charge cash payable + RCM cash liability + Interest + Late fee
        // RCM cannot be offset using ITC (Section 49(4) of CGST Act)
        BigDecimal netGstLiability = setoff != null ? setoff.getTotalCashPayable() : forwardChargePayable.add(reverseCharge).add(interest).add(lateFee);

        // ============================================================
        // 2. SUPPLY SUMMARY
        // ============================================================
        SupplyBucket supply = salesSide ? querySupplySummary(scope) : SupplyBucket.empty();

        // ============================================================
        // 3. STATISTICS
        // ============================================================
        Statistics stats = queryStatistics(scope, salesSide, purchaseSide, countCreditNotes, countDebitNotes);

        // ============================================================
        // 4. CHARTS
        // ============================================================
        List<MonthlyTaxTrendPoint> monthlyTaxTrend = salesSide ? queryMonthlyTaxTrend(scope) : new ArrayList<>();
        List<MonthlyItcTrendPoint> monthlyItcTrend = purchaseSide ? queryMonthlyItcTrend(scope, openingItc, outputGst) : new ArrayList<>();
        List<MonthlyLiabilityTrendPoint> monthlyLiabilityTrend =
                buildLiabilityTrend(monthlyTaxTrend, monthlyItcTrend);

        ChartsDto charts = ChartsDto.builder()
                .monthlyTaxTrend(monthlyTaxTrend)
                .monthlyITCTrend(monthlyItcTrend)
                .monthlyLiabilityTrend(monthlyLiabilityTrend)
                .gstDistribution(buildGstDistribution(cgst, sgst, igst, cess))
                .stateWiseTax(salesSide ? queryStateWiseTax(scope) : new ArrayList<>())
                .hsnWiseTax(salesSide ? queryHsnWiseTax(scope) : new ArrayList<>())
                .build();

        // ============================================================
        // 5. ASSEMBLE
        // ============================================================
        dto.setTaxableAmount(taxableAmount);
        dto.setCgst(cgst);
        dto.setSgst(sgst);
        dto.setIgst(igst);
        dto.setCess(cess);
        dto.setTotalTax(totalTax);
        dto.setOutputGst(outputGst);
        dto.setInputGst(inputGst);
        dto.setAvailableItc(availableItc);
        dto.setUtilizedItc(utilizedItc);
        dto.setNetGstLiability(netGstLiability);
        dto.setReverseCharge(reverseCharge);
        dto.setZeroRatedSupply(supply.zeroRated());
        dto.setNilRatedSupply(supply.nilRated());
        dto.setExemptSupply(supply.exempt());

        dto.setTaxSummary(TaxSummaryDto.builder()
                .taxableAmount(taxableAmount)
                .cgst(cgst)
                .sgst(sgst)
                .igst(igst)
                .cess(cess)
                .totalTax(totalTax)
                .taxCollected(outputGst)
                .taxPaid(inputGst.add(reverseCharge).add(interest).add(lateFee))
                .build());

        dto.setItcSummary(ItcSummaryDto.builder()
                .openingITC(openingItc)
                .availableITC(availableItc)
                .eligibleITC(eligibleItc)
                .blockedITC(blockedItc)
                .reversedITC(reversedItc)
                .utilizedITC(utilizedItc)
                .closingITC(closingItc)
                .build());

        dto.setGstLiability(GstLiabilityDto.builder()
                .outputGST(outputGst)
                .inputGST(inputGst)
                .reverseCharge(reverseCharge)
                .interest(interest)
                .lateFee(lateFee)
                .netGSTLiability(netGstLiability)
                .build());

        dto.setSupplySummary(SupplySummaryDto.builder()
                .taxableSupply(supply.taxable())
                .zeroRatedSupply(supply.zeroRated())
                .nilRatedSupply(supply.nilRated())
                .exemptSupply(supply.exempt())
                .exportSupply(supply.export())
                .importSupply(supply.importValue())
                .sezSupply(supply.sez())
                .interstateSupply(supply.interState())
                .intrastateSupply(supply.intraState())
                .build());

        dto.setStatistics(StatisticsDto.builder()
                .salesInvoiceCount(stats.salesInvoiceCount())
                .purchaseInvoiceCount(stats.purchaseInvoiceCount())
                .creditNoteCount(stats.creditNoteCount())
                .debitNoteCount(stats.debitNoteCount())
                .customerCount(stats.customerCount())
                .vendorCount(stats.vendorCount())
                .totalTransactions(stats.totalTransactions())
                .build());

        dto.setCharts(charts);

        return dto;
    }

    // ============================================================
    // CACHE KEY
    // ============================================================

    public String buildCacheKey(GstReportFilterDto filter) {
        return new StringBuilder()
                .append(filter.getCompanyId()).append('|')
                .append(filter.getBranchId()).append('|')
                .append(filter.getGstRegistrationId()).append('|')
                .append(filter.getFinancialYearId()).append('|')
                .append(filter.getFromDate()).append('|')
                .append(filter.getToDate()).append('|')
                .append(normalize(filter.getInvoiceType())).append('|')
                .append(normalize(filter.getStateCode())).append('|')
                .append(filter.getGstRate()).append('|')
                .append(normalize(filter.getHsn())).append('|')
                .append(filter.getCustomerId()).append('|')
                .append(filter.getVendorId()).append('|')
                .append(CurrentUserContext.getUserId())
                .toString();
    }

    // ============================================================
    // AGGREGATION QUERIES
    // ============================================================

    private SalesAggregate querySalesAggregate(QueryScope s) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT COALESCE(SUM(s.subtotal),0), COALESCE(SUM(s.tax_amount),0), ")
                .append("COALESCE(SUM(si.cgst_amount),0), COALESCE(SUM(si.sgst_amount),0), ")
                .append("COALESCE(SUM(si.igst_amount),0), COALESCE(SUM(si.cess_amount),0) ")
                .append("FROM sales_invoice s ")
                .append("LEFT JOIN sales_invoice_item si ON si.sales_invoice_id = s.id AND (si.is_deleted = false OR si.is_deleted IS NULL) ")
                .append("LEFT JOIN hsn_sac_master h ON si.hsn_sac_id = h.id ")
                .append("LEFT JOIN gst_slab g ON h.gst_slab_id = g.id ")
                .append(salesItemWhere(s));
        Query q = entityManager.createNativeQuery(sql.toString());
        bindSales(q, s);
        bindSalesItemFilters(q, s);
        Object[] row = singleRow(q, "Sales aggregate");
        if (row == null) {
            return SalesAggregate.empty();
        }
        return new SalesAggregate(
                toBigDecimal(row[0]),
                toBigDecimal(row[1]),
                toBigDecimal(row[2]),
                toBigDecimal(row[3]),
                toBigDecimal(row[4]),
                toBigDecimal(row[5]));
    }

    private PurchaseAggregate queryPurchaseAggregate(QueryScope s) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT COALESCE(SUM(a.subtotal),0), COALESCE(SUM(a.cgst_amount),0), ")
                .append("COALESCE(SUM(a.sgst_amount),0), COALESCE(SUM(a.igst_amount),0), ")
                .append("COALESCE(SUM(a.cess_amount),0), COALESCE(SUM(a.tax_amount),0) ")
                .append("FROM ap_invoice a ")
                .append(purchaseWhere(s));
        Query q = entityManager.createNativeQuery(sql.toString());
        bindPurchase(q, s);
        Object[] row = singleRow(q, "Purchase aggregate");
        if (row == null) {
            return PurchaseAggregate.empty();
        }
        return new PurchaseAggregate(
                toBigDecimal(row[0]),
                toBigDecimal(row[1]),
                toBigDecimal(row[2]),
                toBigDecimal(row[3]),
                toBigDecimal(row[4]),
                toBigDecimal(row[5]));
    }

    private List<MonthlyTaxTrendPoint> queryMonthlyTaxTrend(QueryScope s) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT TO_CHAR(DATE_TRUNC('month', s.invoice_date), 'YYYY-MM') AS month, ")
                .append("COALESCE(SUM(si.taxable_amount),0), COALESCE(SUM(si.cgst_amount),0), ")
                .append("COALESCE(SUM(si.sgst_amount),0), COALESCE(SUM(si.igst_amount),0), ")
                .append("COALESCE(SUM(si.cess_amount),0) ")
                .append("FROM sales_invoice s ")
                .append("LEFT JOIN sales_invoice_item si ON si.sales_invoice_id = s.id AND (si.is_deleted = false OR si.is_deleted IS NULL) ")
                .append("LEFT JOIN hsn_sac_master h ON si.hsn_sac_id = h.id ")
                .append("LEFT JOIN gst_slab g ON h.gst_slab_id = g.id ")
                .append(salesItemWhere(s))
                .append(" GROUP BY 1 ORDER BY 1");
        Query q = entityManager.createNativeQuery(sql.toString());
        bindSales(q, s);
        bindSalesItemFilters(q, s);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<MonthlyTaxTrendPoint> points = new ArrayList<>();
        for (Object[] row : rows) {
            BigDecimal cgst = toBigDecimal(row[2]);
            BigDecimal sgst = toBigDecimal(row[3]);
            BigDecimal igst = toBigDecimal(row[4]);
            BigDecimal cess = toBigDecimal(row[5]);
            points.add(MonthlyTaxTrendPoint.builder()
                    .month(row[0] != null ? row[0].toString() : "")
                    .taxableAmount(toBigDecimal(row[1]))
                    .cgst(cgst)
                    .sgst(sgst)
                    .igst(igst)
                    .cess(cess)
                    .totalTax(cgst.add(sgst).add(igst).add(cess))
                    .build());
        }
        return points;
    }

    private List<MonthlyItcTrendPoint> queryMonthlyItcTrend(QueryScope s, BigDecimal openingItc, BigDecimal periodOutputGst) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT TO_CHAR(DATE_TRUNC('month', a.invoice_date), 'YYYY-MM') AS month, ")
                .append("COALESCE(SUM(a.subtotal),0), COALESCE(SUM(a.cgst_amount),0), ")
                .append("COALESCE(SUM(a.sgst_amount),0), COALESCE(SUM(a.igst_amount),0), ")
                .append("COALESCE(SUM(a.cess_amount),0) ")
                .append("FROM ap_invoice a ")
                .append(purchaseWhere(s))
                .append(" GROUP BY 1 ORDER BY 1");
        Query q = entityManager.createNativeQuery(sql.toString());
        bindPurchase(q, s);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        BigDecimal runningItc = openingItc;
        BigDecimal runningUtilized = BigDecimal.ZERO;
        BigDecimal remainingOutput = periodOutputGst;
        List<MonthlyItcTrendPoint> points = new ArrayList<>();
        for (Object[] row : rows) {
            BigDecimal inputTax = toBigDecimal(row[2]).add(toBigDecimal(row[3]))
                    .add(toBigDecimal(row[4])).add(toBigDecimal(row[5]));
            BigDecimal utilized = inputTax.min(remainingOutput);
            runningUtilized = runningUtilized.add(utilized);
            remainingOutput = remainingOutput.subtract(utilized).max(BigDecimal.ZERO);
            runningItc = runningItc.add(inputTax).subtract(utilized);
            points.add(MonthlyItcTrendPoint.builder()
                    .month(row[0] != null ? row[0].toString() : "")
                    .inputTax(inputTax)
                    .availableItc(inputTax)
                    .utilizedItc(utilized)
                    .closingItc(runningItc)
                    .build());
        }
        return points;
    }

    private List<MonthlyLiabilityTrendPoint> buildLiabilityTrend(
            List<MonthlyTaxTrendPoint> taxTrend, List<MonthlyItcTrendPoint> itcTrend) {
        Map<String, MonthlyTaxTrendPoint> taxByMonth = new LinkedHashMap<>();
        for (MonthlyTaxTrendPoint p : taxTrend) {
            taxByMonth.put(p.getMonth(), p);
        }
        List<MonthlyLiabilityTrendPoint> points = new ArrayList<>();
        for (MonthlyItcTrendPoint itc : itcTrend) {
            MonthlyTaxTrendPoint tax = taxByMonth.get(itc.getMonth());
            BigDecimal outputGst = tax != null ? tax.getTotalTax() : BigDecimal.ZERO;
            points.add(MonthlyLiabilityTrendPoint.builder()
                    .month(itc.getMonth())
                    .outputGst(outputGst)
                    .inputGst(itc.getInputTax())
                    .netGstLiability(outputGst.subtract(itc.getInputTax()).max(BigDecimal.ZERO))
                    .build());
        }
        // Include months present only in the sales trend (no ITC booked)
        for (Map.Entry<String, MonthlyTaxTrendPoint> entry : taxByMonth.entrySet()) {
            boolean covered = points.stream().anyMatch(p -> entry.getKey().equals(p.getMonth()));
            if (!covered) {
                points.add(MonthlyLiabilityTrendPoint.builder()
                        .month(entry.getKey())
                        .outputGst(entry.getValue().getTotalTax())
                        .inputGst(BigDecimal.ZERO)
                        .netGstLiability(entry.getValue().getTotalTax())
                        .build());
            }
        }
        points.sort((a, b) -> a.getMonth().compareTo(b.getMonth()));
        return points;
    }

    private SupplyBucket querySupplySummary(QueryScope s) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ")
                .append("COALESCE(SUM(si.taxable_amount),0), ")
                .append("COALESCE(SUM(CASE WHEN si.igst_amount IS NOT NULL AND si.igst_amount > 0 THEN si.taxable_amount ELSE 0 END),0), ")
                .append("COALESCE(SUM(CASE WHEN (COALESCE(si.igst_amount,0) = 0) AND (COALESCE(si.cgst_amount,0) + COALESCE(si.sgst_amount,0)) > 0 THEN si.taxable_amount ELSE 0 END),0), ")
                .append("COALESCE(SUM(CASE WHEN (COALESCE(si.cgst_amount,0) + COALESCE(si.sgst_amount,0) + COALESCE(si.igst_amount,0) + COALESCE(si.cess_amount,0)) = 0 ")
                .append("AND UPPER(COALESCE(s.billing_country,'IN')) NOT IN (:in1,:in2,:in3,:in4,:in5) THEN si.taxable_amount ELSE 0 END),0), ")
                .append("COALESCE(SUM(CASE WHEN (COALESCE(si.cgst_amount,0) + COALESCE(si.sgst_amount,0) + COALESCE(si.igst_amount,0) + COALESCE(si.cess_amount,0)) = 0 ")
                .append("AND UPPER(COALESCE(s.billing_country,'IN')) IN (:in1,:in2,:in3,:in4,:in5) AND COALESCE(g.igst_rate,-1) = 0 THEN si.taxable_amount ELSE 0 END),0), ")
                .append("COALESCE(SUM(CASE WHEN (COALESCE(si.cgst_amount,0) + COALESCE(si.sgst_amount,0) + COALESCE(si.igst_amount,0) + COALESCE(si.cess_amount,0)) = 0 ")
                .append("AND UPPER(COALESCE(s.billing_country,'IN')) IN (:in1,:in2,:in3,:in4,:in5) AND g.igst_rate IS NULL THEN si.taxable_amount ELSE 0 END),0) ")
                .append("FROM sales_invoice_item si ")
                .append("JOIN sales_invoice s ON si.sales_invoice_id = s.id ")
                .append("LEFT JOIN hsn_sac_master h ON si.hsn_sac_id = h.id ")
                .append("LEFT JOIN gst_slab g ON h.gst_slab_id = g.id ")
                .append(salesItemWhere(s));
        Query q = entityManager.createNativeQuery(sql.toString());
        bindSales(q, s);
        bindSalesItemFilters(q, s);
        bindCountryKeys(q);

        Object[] row = singleRow(q, "Supply summary");
        if (row == null) {
            return SupplyBucket.empty();
        }
        BigDecimal taxable = toBigDecimal(row[0]);
        BigDecimal interstate = toBigDecimal(row[1]);
        BigDecimal intrastate = toBigDecimal(row[2]);
        BigDecimal export = toBigDecimal(row[3]);
        BigDecimal nilRated = toBigDecimal(row[4]);
        BigDecimal exempt = toBigDecimal(row[5]);
        BigDecimal sez = BigDecimal.ZERO;
        BigDecimal importValue = BigDecimal.ZERO;
        BigDecimal zeroRated = export.add(sez);
        return new SupplyBucket(taxable, interstate, intrastate, export, sez, nilRated, exempt, importValue, zeroRated);
    }

    private List<StateWiseTaxPoint> queryStateWiseTax(QueryScope s) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT s.place_of_supply_state_code, ")
                .append("COALESCE(SUM(si.taxable_amount),0), ")
                .append("COALESCE(SUM(si.cgst_amount),0) + COALESCE(SUM(si.sgst_amount),0) + COALESCE(SUM(si.igst_amount),0) + COALESCE(SUM(si.cess_amount),0) ")
                .append("FROM sales_invoice s ")
                .append("LEFT JOIN sales_invoice_item si ON si.sales_invoice_id = s.id AND (si.is_deleted = false OR si.is_deleted IS NULL) ")
                .append("LEFT JOIN hsn_sac_master h ON si.hsn_sac_id = h.id ")
                .append("LEFT JOIN gst_slab g ON h.gst_slab_id = g.id ")
                .append(salesItemWhere(s))
                .append(" AND s.place_of_supply_state_code IS NOT NULL AND s.place_of_supply_state_code <> '' ")
                .append("GROUP BY s.place_of_supply_state_code ")
                .append("ORDER BY COALESCE(SUM(si.taxable_amount),0) DESC");
        Query q = entityManager.createNativeQuery(sql.toString());
        bindSales(q, s);
        bindSalesItemFilters(q, s);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<StateWiseTaxPoint> points = new ArrayList<>();
        for (Object[] row : rows) {
            String code = row[0] != null ? row[0].toString() : "";
            points.add(StateWiseTaxPoint.builder()
                    .stateCode(code)
                    .stateName(code)
                    .taxableAmount(toBigDecimal(row[1]))
                    .totalTax(toBigDecimal(row[2]))
                    .build());
        }
        return points;
    }

    private List<HsnWiseTaxPoint> queryHsnWiseTax(QueryScope s) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT h.code, h.description, ")
                .append("COALESCE(SUM(si.taxable_amount),0), ")
                .append("COALESCE(SUM(si.cgst_amount),0) + COALESCE(SUM(si.sgst_amount),0) + COALESCE(SUM(si.igst_amount),0) + COALESCE(SUM(si.cess_amount),0) ")
                .append("FROM sales_invoice_item si ")
                .append("JOIN sales_invoice s ON si.sales_invoice_id = s.id ")
                .append("LEFT JOIN hsn_sac_master h ON si.hsn_sac_id = h.id ")
                .append("LEFT JOIN gst_slab g ON h.gst_slab_id = g.id ")
                .append(salesItemWhere(s))
                .append(" AND h.code IS NOT NULL ")
                .append("GROUP BY h.code, h.description ")
                .append("ORDER BY COALESCE(SUM(si.taxable_amount),0) DESC");
        Query q = entityManager.createNativeQuery(sql.toString());
        bindSales(q, s);
        bindSalesItemFilters(q, s);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        List<HsnWiseTaxPoint> points = new ArrayList<>();
        for (Object[] row : rows) {
            points.add(HsnWiseTaxPoint.builder()
                    .hsnCode(row[0] != null ? row[0].toString() : "")
                    .description(row[1] != null ? row[1].toString() : "")
                    .taxableAmount(toBigDecimal(row[2]))
                    .totalTax(toBigDecimal(row[3]))
                    .build());
        }
        return points;
    }

    private Statistics queryStatistics(QueryScope s, boolean salesSide, boolean purchaseSide,
                                       boolean countCreditNotes, boolean countDebitNotes) {
        long salesCount = 0L;
        long customerCount = 0L;
        if (salesSide) {
            StringBuilder sql = new StringBuilder("SELECT COUNT(s.id), COUNT(DISTINCT s.customer_id) FROM sales_invoice s ")
                    .append(salesWhere(s));
            Query q = entityManager.createNativeQuery(sql.toString());
            bindSales(q, s);
            Object[] row = singleRow(q, "Sales statistics");
            if (row != null) {
                salesCount = toLong(row[0]);
                customerCount = toLong(row[1]);
            }
        }

        long purchaseCount = 0L;
        long vendorCount = 0L;
        if (purchaseSide) {
            StringBuilder sql = new StringBuilder("SELECT COUNT(a.id), COUNT(DISTINCT a.vendor_id) FROM ap_invoice a ")
                    .append(purchaseWhere(s));
            Query q = entityManager.createNativeQuery(sql.toString());
            bindPurchase(q, s);
            Object[] row = singleRow(q, "Purchase statistics");
            if (row != null) {
                purchaseCount = toLong(row[0]);
                vendorCount = toLong(row[1]);
            }
        }

        long creditNoteCount = countCreditNotes ? queryCreditNoteCount(s) : 0L;
        long debitNoteCount = countDebitNotes ? queryDebitNoteCount(s) : 0L;

        long total = salesCount + purchaseCount + creditNoteCount + debitNoteCount;
        return new Statistics(salesCount, purchaseCount, creditNoteCount, debitNoteCount,
                customerCount, vendorCount, total);
    }

    private long queryCreditNoteCount(QueryScope s) {
        if (!tableExists("credit_note")) return 0L;
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT COUNT(cn.id) FROM credit_note cn ")
                    .append("JOIN sales_invoice s ON cn.sales_invoice_id = s.id ")
                    .append("WHERE cn.note_date BETWEEN :fromDate AND :toDate ")
                    .append("AND (cn.is_deleted = false OR cn.is_deleted IS NULL) ")
                    .append("AND (cn.status IS NULL OR cn.status NOT IN ('CANCELLED','REJECTED','VOIDED')) ");
            if (s.companyId() != null) sql.append("AND cn.company_id = :companyId ");
            Query q = entityManager.createNativeQuery(sql.toString());
            bindNote(q, s);
            return toLong(safeScalar(q));
        } catch (Exception e) {
            log.debug("Credit note count query failed: {}", e.getMessage());
            return 0L;
        }
    }

    private long queryDebitNoteCount(QueryScope s) {
        if (!tableExists("debit_note")) return 0L;
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT COUNT(dn.id) FROM debit_note dn ")
                    .append("JOIN ap_invoice a ON dn.ap_invoice_id = a.id ")
                    .append("WHERE dn.note_date BETWEEN :fromDate AND :toDate ")
                    .append("AND (dn.is_deleted = false OR dn.is_deleted IS NULL) ")
                    .append("AND (dn.status IS NULL OR dn.status NOT IN ('CANCELLED','REJECTED','VOIDED')) ");
            if (s.companyId() != null) sql.append("AND dn.company_id = :companyId ");
            Query q = entityManager.createNativeQuery(sql.toString());
            bindNote(q, s);
            return toLong(safeScalar(q));
        } catch (Exception e) {
            log.debug("Debit note count query failed: {}", e.getMessage());
            return 0L;
        }
    }

    private SalesAggregate queryCreditNoteAggregate(QueryScope s) {
        if (!tableExists("credit_note")) return SalesAggregate.empty();
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT COALESCE(SUM(cn.amount),0), COALESCE(SUM(cn.gst_amount),0), ")
                    .append("COALESCE(SUM(CASE WHEN si.output_igst_account_id IS NOT NULL THEN 0 ELSE cn.gst_amount / 2 END), 0), ")
                    .append("COALESCE(SUM(CASE WHEN si.output_igst_account_id IS NOT NULL THEN 0 ELSE cn.gst_amount / 2 END), 0), ")
                    .append("COALESCE(SUM(CASE WHEN si.output_igst_account_id IS NOT NULL THEN cn.gst_amount ELSE 0 END), 0), 0 ")
                    .append("FROM credit_note cn ")
                    .append("JOIN sales_invoice si ON cn.sales_invoice_id = si.id ")
                    .append("WHERE cn.note_date BETWEEN :fromDate AND :toDate ")
                    .append("AND (cn.is_deleted = false OR cn.is_deleted IS NULL) ")
                    .append("AND (cn.status IS NULL OR cn.status NOT IN ('CANCELLED','REJECTED','VOIDED')) ");
            if (s.companyId() != null) sql.append("AND cn.company_id = :companyId ");
            Query q = entityManager.createNativeQuery(sql.toString());
            bindNote(q, s);
            Object[] row = singleRow(q, "Credit note aggregate");
            if (row == null) {
                return SalesAggregate.empty();
            }
            return new SalesAggregate(
                    toBigDecimal(row[0]),
                    toBigDecimal(row[1]),
                    toBigDecimal(row[2]),
                    toBigDecimal(row[3]),
                    toBigDecimal(row[4]),
                    BigDecimal.ZERO);
        } catch (Exception e) {
            log.debug("Credit note aggregate query failed: {}", e.getMessage());
            return SalesAggregate.empty();
        }
    }

    private PurchaseAggregate queryDebitNoteAggregate(QueryScope s) {
        if (!tableExists("debit_note")) return PurchaseAggregate.empty();
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT COALESCE(SUM(dn.amount),0), ")
                    .append("COALESCE(SUM(CASE WHEN ai.igst_amount > 0 THEN 0 ELSE dn.gst_amount / 2 END), 0), ")
                    .append("COALESCE(SUM(CASE WHEN ai.igst_amount > 0 THEN 0 ELSE dn.gst_amount / 2 END), 0), ")
                    .append("COALESCE(SUM(CASE WHEN ai.igst_amount > 0 THEN dn.gst_amount ELSE 0 END), 0), 0, COALESCE(SUM(dn.gst_amount),0) ")
                    .append("FROM debit_note dn ")
                    .append("JOIN ap_invoice ai ON dn.ap_invoice_id = ai.id ")
                    .append("WHERE dn.note_date BETWEEN :fromDate AND :toDate ")
                    .append("AND (dn.is_deleted = false OR dn.is_deleted IS NULL) ")
                    .append("AND (dn.status IS NULL OR dn.status NOT IN ('CANCELLED','REJECTED','VOIDED')) ");
            if (s.companyId() != null) sql.append("AND dn.company_id = :companyId ");
            Query q = entityManager.createNativeQuery(sql.toString());
            bindNote(q, s);
            Object[] row = singleRow(q, "Debit note aggregate");
            if (row == null) {
                return PurchaseAggregate.empty();
            }
            return new PurchaseAggregate(
                    toBigDecimal(row[0]),
                    toBigDecimal(row[1]),
                    toBigDecimal(row[2]),
                    toBigDecimal(row[3]),
                    BigDecimal.ZERO,
                    toBigDecimal(row[5]));
        } catch (Exception e) {
            log.debug("Debit note aggregate query failed: {}", e.getMessage());
            return PurchaseAggregate.empty();
        }
    }

    // ============================================================
    // ITC / LIABILITY LEDGER SOURCES (optional tables)
    // ============================================================

    private BigDecimal queryOpeningItc(UUID companyId, UUID branchId) {
        if (companyId == null || !tableExists("gst_itc")) {
            return BigDecimal.ZERO;
        }
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT COALESCE(SUM(COALESCE(g.balance_cgst,0) + COALESCE(g.balance_sgst,0) + COALESCE(g.balance_igst,0)),0) ")
                    .append("FROM gst_itc g WHERE g.company_id = :companyId ");
            if (branchId != null) sql.append("AND g.branch_id = :branchId ");
            Query q = entityManager.createNativeQuery(sql.toString());
            q.setParameter("companyId", companyId);
            if (branchId != null) q.setParameter("branchId", branchId);
            return toBigDecimal(safeScalar(q));
        } catch (Exception e) {
            log.debug("gst_itc ledger not available, defaulting opening ITC to zero: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal queryReverseCharge(QueryScope s) {
        if (s.companyId() == null || !tableExists("gst_output_tax")) {
            return BigDecimal.ZERO;
        }
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT COALESCE(SUM(COALESCE(o.total_tax_amount,0)),0) ")
                    .append("FROM gst_output_tax o ")
                    .append("WHERE o.is_reverse_charge = true ")
                    .append("AND o.invoice_date BETWEEN :fromDate AND :toDate ")
                    .append("AND o.company_id = :companyId ");
            if (s.branchId() != null) sql.append("AND o.branch_id = :branchId ");
            Query q = entityManager.createNativeQuery(sql.toString());
            q.setParameter("fromDate", s.fromDate());
            q.setParameter("toDate", s.toDate());
            q.setParameter("companyId", s.companyId());
            if (s.branchId() != null) q.setParameter("branchId", s.branchId());
            return toBigDecimal(safeScalar(q));
        } catch (Exception e) {
            log.debug("gst_output_tax ledger not available, defaulting reverse charge to zero: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    // ============================================================
    // METADATA
    // ============================================================

    private ReportMetadata loadReportMetadata(UUID companyId, UUID branchId, UUID gstRegistrationId,
                                              FiscalYearInfo fiscalYear, LocalDate fromDate, LocalDate toDate,
                                              LocalDateTime generatedAt, String generatedBy) {
        String companyName = "";
        String companyCode = "";
        String companyGstin = "";
        String baseCurrency = "";
        if (companyId != null) {
            try {
                Query q = entityManager.createNativeQuery(
                        "SELECT company_code, company_name, gstin, base_currency FROM company WHERE id = :companyId");
                q.setParameter("companyId", companyId);
                Object[] row = singleRow(q, "Company metadata");
                if (row != null) {
                    companyCode = row[0] != null ? row[0].toString() : "";
                    companyName = row[1] != null ? row[1].toString() : "";
                    companyGstin = row[2] != null ? row[2].toString() : "";
                    baseCurrency = row[3] != null ? row[3].toString() : "";
                }
            } catch (Exception e) {
                log.debug("Company metadata unavailable: {}", e.getMessage());
            }
        }

        String branchName = "";
        if (branchId != null) {
            branchName = queryBranchName(branchId);
        }

        String gstin = companyGstin;
        if (gstRegistrationId != null && tableExists("gst_registration")) {
            try {
                Query q = entityManager.createNativeQuery(
                        "SELECT gstin, legal_name FROM gst_registration WHERE id = :gstRegistrationId");
                q.setParameter("gstRegistrationId", gstRegistrationId);
                Object[] row = singleRow(q, "GST registration metadata");
                if (row != null && row[0] != null) {
                    gstin = row[0].toString();
                }
            } catch (Exception e) {
                log.debug("GST registration metadata unavailable: {}", e.getMessage());
            }
        }

        String financialYear = fiscalYear != null ? fiscalYear.name() : "";
        String financialYearName = fiscalYear != null ? "FY " + fiscalYear.name() : "";

        ReportSummaryDto summary = ReportSummaryDto.builder()
                .companyId(companyId)
                .companyName(companyName)
                .companyCode(companyCode)
                .branchId(branchId)
                .branchName(branchName)
                .gstRegistrationId(gstRegistrationId)
                .gstin(gstin)
                .financialYear(financialYear)
                .financialYearName(financialYearName)
                .reportName(REPORT_NAME)
                .reportType(ReportType.SUMMARY.name())
                .reportGeneratedAt(generatedAt)
                .generatedBy(generatedBy)
                .fromDate(fromDate)
                .toDate(toDate)
                .baseCurrency(baseCurrency)
                .build();

        return new ReportMetadata(summary);
    }

    private String queryBranchName(UUID branchId) {
        if (!tableExists("branch")) {
            return "";
        }
        for (String column : new String[]{"branch_name", "name"}) {
            try {
                Query q = entityManager.createNativeQuery(
                        "SELECT " + column + " FROM branch WHERE id = :branchId");
                q.setParameter("branchId", branchId);
                q.setMaxResults(1);
                java.util.List<?> list = q.getResultList();
                if (list != null && !list.isEmpty() && list.get(0) != null) {
                    return list.get(0).toString();
                }
            } catch (Exception ignored) {
                // try next column name
            }
        }
        return "";
    }

    private FiscalYearInfo resolveFiscalYear(UUID financialYearId, UUID companyId) {
        if (!tableExists("fiscal_year")) {
            return null;
        }
        try {
            StringBuilder sql = new StringBuilder("SELECT id, fiscal_year, start_date, end_date FROM fiscal_year WHERE company_id = :companyId");
            if (financialYearId != null) {
                sql.append(" AND id = :financialYearId");
            } else {
                sql.append(" AND is_closed = false"); // OPEN status
            }
            Query q = entityManager.createNativeQuery(sql.toString());
            q.setParameter("companyId", companyId);
            if (financialYearId != null) {
                q.setParameter("financialYearId", financialYearId);
            }
            
            q.setMaxResults(1);
            
            Object[] row = singleRow(q, "Fiscal year");
            if (row == null) {
                return null;
            }
            
            UUID resolvedId = row[0] != null ? UUID.fromString(row[0].toString()) : financialYearId;
            LocalDate startDate = toLocalDate(row[2]);
            LocalDate endDate = toLocalDate(row[3]);
            return new FiscalYearInfo(resolvedId,
                    row[1] != null ? row[1].toString() : "",
                    startDate, endDate);
        } catch (Exception e) {
            log.debug("Fiscal year metadata unavailable: {}", e.getMessage());
            return null;
        }
    }

    private void validateFiscalYear(UUID financialYearId, FiscalYearInfo fiscalYear) {
        if (financialYearId != null && fiscalYear == null) {
            throw new ValidationException("Financial year does not exist or does not belong to the requested company",
                    "FINANCIAL_YEAR_NOT_FOUND");
        }
    }

    private UUID resolveDefaultGstRegistration(UUID gstRegistrationId, UUID companyId) {
        if (gstRegistrationId != null) {
            return gstRegistrationId;
        }
        if (companyId == null || !tableExists("gst_registration")) {
            return null;
        }
        try {
            Query q = entityManager.createNativeQuery(
                    "SELECT id FROM gst_registration WHERE company_id = :companyId AND is_default = true AND is_deleted = false");
            q.setParameter("companyId", companyId);
            q.setMaxResults(1);
            Object[] row = singleRow(q, "Default GST Registration");
            if (row != null && row[0] != null) {
                return UUID.fromString(row[0].toString());
            }
            return null;
        } catch (Exception e) {
            log.debug("Default GST Registration unavailable: {}", e.getMessage());
            return null;
        }
    }

    // ============================================================
    // VALIDATION
    // ============================================================

    private void validateCompanyExists(UUID companyId) {
        if (companyId == null) {
            return;
        }
        try {
            Query q = entityManager.createNativeQuery("SELECT COUNT(1) FROM company c WHERE c.id = :companyId");
            q.setParameter("companyId", companyId);
            Number count = (Number) q.getSingleResult();
            if (count.longValue() == 0L) {
                throw new ValidationException("Company does not exist", "COMPANY_NOT_FOUND");
            }

            // Tenant isolation & company access validation
            if (!CurrentUserContext.isSystemAdmin()) {
                UUID orgId = CurrentUserContext.getOrganizationId();
                String role = CurrentUserContext.getUserRole();

                // Retrieve stored organizationId for the requested company
                Query storedOrgQuery = entityManager.createNativeQuery(
                        "SELECT c.organization_id FROM company c WHERE c.id = :companyId");
                storedOrgQuery.setParameter("companyId", companyId);
                List<?> results = storedOrgQuery.getResultList();
                Object storedOrgObj = (results != null && !results.isEmpty()) ? results.get(0) : null;
                UUID storedOrgId = null;
                if (storedOrgObj instanceof UUID) {
                    storedOrgId = (UUID) storedOrgObj;
                } else if (storedOrgObj != null) {
                    storedOrgId = UUID.fromString(storedOrgObj.toString());
                }

                log.info("Company validation: requested companyId={}, authenticated orgId={}, role={}, storedOrgId={}",
                        companyId, orgId, role, storedOrgId);

                if (CurrentUserContext.isOwner()) {
                    if (orgId != null) {
                        if (storedOrgId == null || !orgId.equals(storedOrgId)) {
                            log.warn("Access denied: companyId={} storedOrgId={} does not match authorized orgId={}",
                                    companyId, storedOrgId, orgId);
                            throw new ForbiddenException(
                                    "Access denied: Company does not belong to authorized organization",
                                    "COMPANY_ACCESS_DENIED");
                        }
                    }
                } else {
                    UUID assignedCompanyId = CurrentUserContext.getCompanyId();
                    if (assignedCompanyId != null && !assignedCompanyId.equals(companyId)) {
                        throw new ForbiddenException(
                                "Access denied for the requested company resource",
                                "COMPANY_ACCESS_DENIED");
                    }
                }
            }
        } catch (ValidationException | ForbiddenException ex) {
            throw ex;
        } catch (Exception e) {
            log.debug("Company validation unavailable: {}", e.getMessage());
        }
    }

    private void validateBranchOwnership(UUID branchId, UUID companyId) {
        if (branchId == null || !tableExists("branch")) {
            return;
        }
        try {
            StringBuilder sql = new StringBuilder("SELECT COUNT(1) FROM branch b WHERE b.id = :branchId");
            if (companyId != null) {
                sql.append(" AND b.company_id = :companyId");
            }
            Query q = entityManager.createNativeQuery(sql.toString());
            q.setParameter("branchId", branchId);
            if (companyId != null) {
                q.setParameter("companyId", companyId);
            }
            Number count = (Number) q.getSingleResult();
            if (count.longValue() == 0L) {
                throw new ForbiddenException("Branch does not belong to the requested company or does not exist",
                        "BRANCH_COMPANY_MISMATCH");
            }
        } catch (ForbiddenException fe) {
            throw fe;
        } catch (Exception ignored) {
            // skip strict validation when metadata is unavailable
        }
    }

    private void validateGstRegistrationOwnership(UUID gstRegistrationId, UUID companyId, UUID branchId) {
        if (gstRegistrationId == null || !tableExists("gst_registration")) {
            return;
        }
        try {
            StringBuilder sql = new StringBuilder("SELECT COUNT(1) FROM gst_registration g WHERE g.id = :gstRegistrationId");
            if (companyId != null) {
                sql.append(" AND g.company_id = :companyId");
            }
            if (branchId != null) {
                sql.append(" AND g.branch_id = :branchId");
            }
            Query q = entityManager.createNativeQuery(sql.toString());
            q.setParameter("gstRegistrationId", gstRegistrationId);
            if (companyId != null) {
                q.setParameter("companyId", companyId);
            }
            if (branchId != null) {
                q.setParameter("branchId", branchId);
            }
            Number count = (Number) q.getSingleResult();
            if (count.longValue() == 0L) {
                throw new ForbiddenException(
                        "GST registration does not belong to the requested company/branch or does not exist",
                        "GST_REGISTRATION_MISMATCH");
            }
        } catch (ForbiddenException fe) {
            throw fe;
        } catch (Exception ignored) {
            // skip strict validation when metadata is unavailable
        }
    }

    // ============================================================
    // WHERE CLAUSE BUILDERS
    // ============================================================

    private String salesWhere(QueryScope s) {
        StringBuilder w = new StringBuilder()
                .append(" WHERE s.invoice_date BETWEEN :fromDate AND :toDate ")
                .append(" AND (s.is_deleted = false OR s.is_deleted IS NULL) ")
                .append(" AND s.status IN ('POSTED','APPROVED') ");
        if (s.companyId() != null) w.append(" AND s.company_id = :companyId ");
        if (s.stateCode() != null) w.append(" AND s.place_of_supply_state_code = :stateCode ");
        if (s.customerId() != null) w.append(" AND s.customer_id = :customerId ");
        return w.toString();
    }

    private String salesItemWhere(QueryScope s) {
        StringBuilder w = new StringBuilder(salesWhere(s));
        if (s.hsn() != null) w.append(" AND h.code = :hsn ");
        if (s.gstRate() != null) w.append(" AND g.igst_rate = :gstRate ");
        return w.toString();
    }

    private String purchaseWhere(QueryScope s) {
        StringBuilder w = new StringBuilder()
                .append(" WHERE a.invoice_date BETWEEN :fromDate AND :toDate ")
                .append(" AND (a.is_deleted = false OR a.is_deleted IS NULL) ");
        if (s.companyId() != null) w.append(" AND a.company_id = :companyId ");
        if (s.vendorId() != null) w.append(" AND a.vendor_id = :vendorId ");
        return w.toString();
    }

    private void bindSales(Query q, QueryScope s) {
        q.setParameter("fromDate", s.fromDate());
        q.setParameter("toDate", s.toDate());
        if (s.companyId() != null) q.setParameter("companyId", s.companyId());
        if (s.stateCode() != null) q.setParameter("stateCode", s.stateCode());
        if (s.customerId() != null) q.setParameter("customerId", s.customerId());
    }

    private void bindSalesItemFilters(Query q, QueryScope s) {
        if (s.hsn() != null) q.setParameter("hsn", s.hsn());
        if (s.gstRate() != null) q.setParameter("gstRate", s.gstRate());
    }

    private void bindPurchase(Query q, QueryScope s) {
        q.setParameter("fromDate", s.fromDate());
        q.setParameter("toDate", s.toDate());
        if (s.companyId() != null) q.setParameter("companyId", s.companyId());
        if (s.vendorId() != null) q.setParameter("vendorId", s.vendorId());
    }

    private void bindNote(Query q, QueryScope s) {
        q.setParameter("fromDate", s.fromDate());
        q.setParameter("toDate", s.toDate());
        if (s.companyId() != null) q.setParameter("companyId", s.companyId());
    }

    private void bindCountryKeys(Query q) {
        for (int i = 0; i < INDIAN_COUNTRY_KEYS.size(); i++) {
            q.setParameter("in" + (i + 1), INDIAN_COUNTRY_KEYS.get(i));
        }
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private GstSummaryDto attachStructuredSections(GstSummaryDto dto, LocalDate fromDate, LocalDate toDate) {
        BigDecimal zero = BigDecimal.ZERO;
        dto.setTaxableAmount(zero);
        dto.setCgst(zero);
        dto.setSgst(zero);
        dto.setIgst(zero);
        dto.setCess(zero);
        dto.setTotalTax(zero);
        dto.setOutputGst(zero);
        dto.setInputGst(zero);
        dto.setAvailableItc(zero);
        dto.setUtilizedItc(zero);
        dto.setNetGstLiability(zero);
        dto.setReverseCharge(zero);
        dto.setZeroRatedSupply(zero);
        dto.setNilRatedSupply(zero);
        dto.setExemptSupply(zero);

        dto.setTaxSummary(TaxSummaryDto.builder().build());
        dto.setItcSummary(ItcSummaryDto.builder().build());
        dto.setGstLiability(GstLiabilityDto.builder().build());
        dto.setSupplySummary(SupplySummaryDto.builder().build());
        dto.setStatistics(StatisticsDto.builder().build());
        dto.setCharts(ChartsDto.builder().build());
        return dto;
    }

    private List<GstDistributionSlice> buildGstDistribution(BigDecimal cgst, BigDecimal sgst, BigDecimal igst, BigDecimal cess) {
        List<GstDistributionSlice> slices = new ArrayList<>();
        slices.add(GstDistributionSlice.builder().name("CGST").value(cgst).build());
        slices.add(GstDistributionSlice.builder().name("SGST").value(sgst).build());
        slices.add(GstDistributionSlice.builder().name("IGST").value(igst).build());
        slices.add(GstDistributionSlice.builder().name("CESS").value(cess).build());
        return slices;
    }

    private String resolveGeneratedBy() {
        UUID userId = CurrentUserContext.getUserId();
        return userId != null ? userId.toString() : "SYSTEM";
    }

    private String normalizeInvoiceType(String invoiceType) {
        if (invoiceType == null || invoiceType.isBlank()) {
            return "ALL";
        }
        return invoiceType.trim().toUpperCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isValidDateRange(LocalDate fromDate, LocalDate toDate) {
        return fromDate != null && toDate != null && !fromDate.isAfter(toDate);
    }

    private Object[] singleRow(Query query, String context) {
        try {
            java.util.List<?> list = query.getResultList();
            if (list == null || list.isEmpty()) {
                return null;
            }
            Object result = list.get(0);
            if (result instanceof Object[]) {
                return (Object[]) result;
            }
            return new Object[]{result};
        } catch (Exception e) {
            log.debug("{} query failed: {}", context, e.getMessage());
            return null;
        }
    }

    /**
     * Checks whether a table exists in the current database schema using
     * information_schema (which never throws for missing tables).
     */
    private boolean tableExists(String tableName) {
        try {
            Query q = entityManager.createNativeQuery(
                    "SELECT COUNT(1) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = :tableName");
            q.setParameter("tableName", tableName);
            Number count = (Number) q.getSingleResult();
            return count != null && count.longValue() > 0;
        } catch (Exception e) {
            log.debug("Table existence check failed for {}: {}", tableName, e.getMessage());
            return false;
        }
    }

    /**
     * Safely gets a single scalar value from a query without using getSingleResult().
     */
    private Object safeScalar(Query query) {
        try {
            query.setMaxResults(1);
            java.util.List<?> list = query.getResultList();
            if (list == null || list.isEmpty()) {
                return null;
            }
            return list.get(0);
        } catch (Exception e) {
            log.debug("Safe scalar query failed: {}", e.getMessage());
            return null;
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        }
        try {
            return new BigDecimal(value.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (Exception e) {
            return 0L;
        }
    }

    private LocalDate toLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof java.sql.Date) {
            return ((java.sql.Date) value).toLocalDate();
        }
        if (value instanceof LocalDate) {
            return (LocalDate) value;
        }
        try {
            return LocalDate.parse(value.toString());
        } catch (Exception e) {
            return null;
        }
    }

    // ============================================================
    // VALUE HOLDERS
    // ============================================================

    private record QueryScope(UUID companyId, UUID branchId, UUID gstRegistrationId,
                              LocalDate fromDate, LocalDate toDate,
                              String stateCode, UUID customerId, UUID vendorId,
                              String hsn, BigDecimal gstRate) {
    }

    private record SalesAggregate(BigDecimal taxable, BigDecimal headerTax,
                                  BigDecimal cgst, BigDecimal sgst, BigDecimal igst, BigDecimal cess) {

        BigDecimal totalTax() {
            return cgst.add(sgst).add(igst).add(cess);
        }

        static SalesAggregate empty() {
            BigDecimal z = BigDecimal.ZERO;
            return new SalesAggregate(z, z, z, z, z, z);
        }
    }

    private record PurchaseAggregate(BigDecimal subtotal, BigDecimal cgst, BigDecimal sgst,
                                     BigDecimal igst, BigDecimal cess, BigDecimal tax) {

        static PurchaseAggregate empty() {
            BigDecimal z = BigDecimal.ZERO;
            return new PurchaseAggregate(z, z, z, z, z, z);
        }
    }

    private record SupplyBucket(BigDecimal taxable, BigDecimal interState, BigDecimal intraState,
                                BigDecimal export, BigDecimal sez, BigDecimal nilRated,
                                BigDecimal exempt, BigDecimal importValue, BigDecimal zeroRated) {

        static SupplyBucket empty() {
            BigDecimal z = BigDecimal.ZERO;
            return new SupplyBucket(z, z, z, z, z, z, z, z, z);
        }
    }

    private record Statistics(long salesInvoiceCount, long purchaseInvoiceCount,
                              long creditNoteCount, long debitNoteCount,
                              long customerCount, long vendorCount, long totalTransactions) {
    }

    private record FiscalYearInfo(UUID id, String name, LocalDate startDate, LocalDate endDate) {
    }

    private record ReportMetadata(ReportSummaryDto reportSummary) {
    }
}
