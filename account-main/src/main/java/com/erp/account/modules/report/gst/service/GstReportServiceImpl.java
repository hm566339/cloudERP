package com.erp.account.modules.report.gst.service;

import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.modules.report.gst.dto.*;
import com.erp.account.util.TenantUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GstReportServiceImpl implements GstReportService {

    @PersistenceContext
    private EntityManager entityManager;

    // single source of truth for summary
    private final GstSummaryService gstSummaryService;

    @Override
    public GstSummaryDto getGstSummary(GstReportFilterDto filter) {
        // Delegate to GstSummaryService (single source of truth)
        return gstSummaryService.getSummary(filter);
    }

    @Override
    public List<Gstr1Dto> getGstr1(GstReportFilterDto filter) {
        UUID companyId = TenantUtils.resolveCompanyIdForQuery(filter.getCompanyId());
        resolveDatesAndDefaults(filter, companyId);
        
        UUID branchId = filter.getBranchId();
        UUID gstRegistrationId = filter.getGstRegistrationId();

        if (branchId != null) {
            validateBranchOwnership(branchId, companyId);
        }
        if (gstRegistrationId != null) {
            validateGstRegistrationOwnership(gstRegistrationId, companyId, branchId);
        }

        log.info("Generating GSTR-1 for Company: {}", companyId);

        if (!isValidDateRange(filter.getFromDate(), filter.getToDate())) {
            return Collections.emptyList();
        }
        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append("SELECT s.id, s.invoice_number, s.invoice_date, c.customer_name, c.gstin, s.place_of_supply_state_code, ")
                .append("COALESCE(SUM(i.taxable_amount),0) as taxable, ")
                .append("COALESCE(SUM(i.cgst_amount),0) as cgst, ")
                .append("COALESCE(SUM(i.sgst_amount),0) as sgst, ")
                .append("COALESCE(SUM(i.igst_amount),0) as igst, ")
                .append("COALESCE(SUM(i.cess_amount),0) as cess, ")
                .append("MAX(s.total_amount) as total_amount, MAX(h.code) as hsn_code, MAX(g.igst_rate) as gst_rate ")
                .append("FROM sales_invoice s ")
                .append("LEFT JOIN customer c ON s.customer_id = c.id ")
                .append("LEFT JOIN sales_invoice_item i ON i.sales_invoice_id = s.id AND (i.is_deleted = false OR i.is_deleted IS NULL) ")
                .append("LEFT JOIN hsn_sac_master h ON i.hsn_sac_id = h.id ")
                .append("LEFT JOIN gst_slab g ON h.gst_slab_id = g.id ")
                .append("WHERE s.invoice_date BETWEEN :fromDate AND :toDate ")
                .append("AND (s.is_deleted = false OR s.is_deleted IS NULL) ")
                .append("AND s.status IN ('POSTED','APPROVED') ");

        if (companyId != null) {
            sqlBuilder.append("AND s.company_id = :companyId ");
        }

        sqlBuilder.append("GROUP BY s.id, s.invoice_number, s.invoice_date, c.customer_name, c.gstin, s.place_of_supply_state_code ")
                .append("ORDER BY s.invoice_date DESC");

        Query query = entityManager.createNativeQuery(sqlBuilder.toString());
        query.setParameter("fromDate", filter.getFromDate());
        query.setParameter("toDate", filter.getToDate());
        if (companyId != null) {
            query.setParameter("companyId", companyId);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();
        List<Gstr1Dto> dtoList = new ArrayList<>();

        for (Object[] row : results) {
            Gstr1Dto dto = new Gstr1Dto();
            dto.setInvoiceNumber(row[1] != null ? row[1].toString() : null);
            if (row[2] instanceof java.time.LocalDate) dto.setInvoiceDate((java.time.LocalDate) row[2]);
            else if (row[2] instanceof java.sql.Date) dto.setInvoiceDate(((java.sql.Date) row[2]).toLocalDate());
            dto.setCustomerName(row[3] != null ? row[3].toString() : null);
            dto.setGstin(row[4] != null ? row[4].toString() : null);
            dto.setPlaceOfSupply(row[5] != null ? row[5].toString() : null);
            dto.setTaxableAmount(toBigDecimal(row[6]));
            dto.setCgst(toBigDecimal(row[7]));
            dto.setSgst(toBigDecimal(row[8]));
            dto.setIgst(toBigDecimal(row[9]));
            dto.setCess(toBigDecimal(row[10]));
            dto.setTotalInvoiceValue(toBigDecimal(row[11]));
            dto.setHsn(row[12] != null ? row[12].toString() : null);
            dto.setGstRate(toBigDecimal(row[13]));
            dtoList.add(dto);
        }
        return dtoList;
    }

    @Override
    public Gstr3bDto getGstr3b(GstReportFilterDto filter) {
        UUID companyId = TenantUtils.resolveCompanyIdForQuery(filter.getCompanyId());
        resolveDatesAndDefaults(filter, companyId);
        
        UUID branchId = filter.getBranchId();
        UUID gstRegistrationId = filter.getGstRegistrationId();

        if (branchId != null) {
            validateBranchOwnership(branchId, companyId);
        }
        if (gstRegistrationId != null) {
            validateGstRegistrationOwnership(gstRegistrationId, companyId, branchId);
        }

        log.info("Generating GSTR-3B for Company: {}", companyId);

        if (!isValidDateRange(filter.getFromDate(), filter.getToDate())) {
            return new Gstr3bDto();
        }

        Object[] salesAggregate = executeAggregateQuery("sales_invoice", companyId, branchId, gstRegistrationId, filter.getFromDate(), filter.getToDate());
        Object[] purchaseAggregate = executeAggregateQuery("ap_invoice", companyId, branchId, gstRegistrationId, filter.getFromDate(), filter.getToDate());

        BigDecimal outwardTaxable = BigDecimal.ZERO;
        BigDecimal outwardCgst = BigDecimal.ZERO;
        BigDecimal outwardSgst = BigDecimal.ZERO;
        BigDecimal outwardIgst = BigDecimal.ZERO;
        BigDecimal outwardCess = BigDecimal.ZERO;
        BigDecimal purchaseCgst = BigDecimal.ZERO;
        BigDecimal purchaseSgst = BigDecimal.ZERO;
        BigDecimal purchaseIgst = BigDecimal.ZERO;
        BigDecimal purchaseCess = BigDecimal.ZERO;

        if (salesAggregate != null) {
            outwardTaxable = toBigDecimal(salesAggregate[0]);
            outwardCgst = toBigDecimal(salesAggregate[1]);
            outwardSgst = toBigDecimal(salesAggregate[2]);
            outwardIgst = toBigDecimal(salesAggregate[3]);
            outwardCess = toBigDecimal(salesAggregate[4]);
        }

        if (purchaseAggregate != null) {
            purchaseCgst = toBigDecimal(purchaseAggregate[1]);
            purchaseSgst = toBigDecimal(purchaseAggregate[2]);
            purchaseIgst = toBigDecimal(purchaseAggregate[3]);
            purchaseCess = toBigDecimal(purchaseAggregate[4]);
        }

        Gstr3bDto dto = new Gstr3bDto();
        
        dto.getReportInfo().setReportName("GSTR-3B Summary");
        dto.getReportInfo().setReportingPeriod(filter.getFromDate() + " to " + filter.getToDate());
        dto.getReportInfo().setGeneratedAt(java.time.Instant.now().toString());

        dto.getOutwardSupplies().setTaxableAmount(outwardTaxable);
        dto.getOutwardSupplies().setCgst(outwardCgst);
        dto.getOutwardSupplies().setSgst(outwardSgst);
        dto.getOutwardSupplies().setIgst(outwardIgst);
        dto.getOutwardSupplies().setCess(outwardCess);

        // 0. Calculate Reverse Charge (RCM)
        Object[] rcmAggregates = executeRcmQuery(companyId, branchId, gstRegistrationId, filter.getFromDate(), filter.getToDate());
        
        BigDecimal rcmIgst = toBigDecimal(rcmAggregates[0]);
        BigDecimal rcmCgst = toBigDecimal(rcmAggregates[1]);
        BigDecimal rcmSgst = toBigDecimal(rcmAggregates[2]);
        BigDecimal rcmCess = toBigDecimal(rcmAggregates[3]);
        BigDecimal rcmTaxable = toBigDecimal(rcmAggregates[4]);

        dto.getInwardReverseChargeSupplies().setTaxableAmount(rcmTaxable);
        dto.getInwardReverseChargeSupplies().setIgst(rcmIgst);
        dto.getInwardReverseChargeSupplies().setCgst(rcmCgst);
        dto.getInwardReverseChargeSupplies().setSgst(rcmSgst);
        dto.getInwardReverseChargeSupplies().setCess(rcmCess);

        dto.getInputTaxCredit().getInwardReverseChargeItc().setIgst(rcmIgst);
        dto.getInputTaxCredit().getInwardReverseChargeItc().setCgst(rcmCgst);
        dto.getInputTaxCredit().getInwardReverseChargeItc().setSgst(rcmSgst);
        dto.getInputTaxCredit().getInwardReverseChargeItc().setCess(rcmCess);

        // Deduct RCM from AllOtherItc to prevent double claiming, since purchaseAggregate included ALL purchases
        dto.getInputTaxCredit().getAllOtherItc().setCgst(purchaseCgst.subtract(rcmCgst).max(BigDecimal.ZERO));
        dto.getInputTaxCredit().getAllOtherItc().setSgst(purchaseSgst.subtract(rcmSgst).max(BigDecimal.ZERO));
        dto.getInputTaxCredit().getAllOtherItc().setIgst(purchaseIgst.subtract(rcmIgst).max(BigDecimal.ZERO));
        dto.getInputTaxCredit().getAllOtherItc().setCess(purchaseCess.subtract(rcmCess).max(BigDecimal.ZERO));

        dto.getInputTaxCredit().getTotalItc().setCgst(purchaseCgst);
        dto.getInputTaxCredit().getTotalItc().setSgst(purchaseSgst);
        dto.getInputTaxCredit().getTotalItc().setIgst(purchaseIgst);
        dto.getInputTaxCredit().getTotalItc().setCess(purchaseCess);

        // 1. Calculate ITC Reversals (Section 17(5) and Rule 42/43)
        Object[] reversalAggregates = executeItcReversalQuery(companyId, branchId, gstRegistrationId, filter.getFromDate(), filter.getToDate());
        
        BigDecimal rule42ReversalIgst = toBigDecimal(reversalAggregates[0]);
        BigDecimal rule42ReversalCgst = toBigDecimal(reversalAggregates[1]);
        BigDecimal rule42ReversalSgst = toBigDecimal(reversalAggregates[2]);
        BigDecimal rule42ReversalCess = toBigDecimal(reversalAggregates[3]);

        BigDecimal sec175ReversalIgst = toBigDecimal(reversalAggregates[4]);
        BigDecimal sec175ReversalCgst = toBigDecimal(reversalAggregates[5]);
        BigDecimal sec175ReversalSgst = toBigDecimal(reversalAggregates[6]);
        BigDecimal sec175ReversalCess = toBigDecimal(reversalAggregates[7]);

        dto.getInputTaxCredit().getItcReversed().setRule42And43(rule42ReversalIgst.add(rule42ReversalCgst).add(rule42ReversalSgst).add(rule42ReversalCess));
        dto.getInputTaxCredit().getItcReversed().setSection175(sec175ReversalIgst.add(sec175ReversalCgst).add(sec175ReversalSgst).add(sec175ReversalCess));
        dto.getInputTaxCredit().getItcReversed().setOthers(BigDecimal.ZERO);

        // 2. Calculate Net ITC Available
        BigDecimal netItcIgst = purchaseIgst.subtract(rule42ReversalIgst).max(BigDecimal.ZERO);
        BigDecimal netItcCgst = purchaseCgst.subtract(rule42ReversalCgst).max(BigDecimal.ZERO);
        BigDecimal netItcSgst = purchaseSgst.subtract(rule42ReversalSgst).max(BigDecimal.ZERO);
        BigDecimal netItcCess = purchaseCess.subtract(rule42ReversalCess).max(BigDecimal.ZERO);

        dto.getInputTaxCredit().getNetItcAvailable().setIgst(netItcIgst);
        dto.getInputTaxCredit().getNetItcAvailable().setCgst(netItcCgst);
        dto.getInputTaxCredit().getNetItcAvailable().setSgst(netItcSgst);
        dto.getInputTaxCredit().getNetItcAvailable().setCess(netItcCess);

        // 3. Electronic Credit Ledger Set-Off Rules (Net Liability)
        BigDecimal liabilityIgst = outwardIgst;
        BigDecimal liabilityCgst = outwardCgst;
        BigDecimal liabilitySgst = outwardSgst;
        BigDecimal liabilityCess = outwardCess;

        // Rule 1: Set off IGST Credit
        BigDecimal igstCreditUsedForIgst = netItcIgst.min(liabilityIgst);
        liabilityIgst = liabilityIgst.subtract(igstCreditUsedForIgst);
        BigDecimal remainingIgstCredit = netItcIgst.subtract(igstCreditUsedForIgst);
        
        BigDecimal igstCreditUsedForCgst = remainingIgstCredit.min(liabilityCgst);
        liabilityCgst = liabilityCgst.subtract(igstCreditUsedForCgst);
        remainingIgstCredit = remainingIgstCredit.subtract(igstCreditUsedForCgst);
        
        BigDecimal igstCreditUsedForSgst = remainingIgstCredit.min(liabilitySgst);
        liabilitySgst = liabilitySgst.subtract(igstCreditUsedForSgst);

        // Rule 2: Set off CGST Credit
        BigDecimal cgstCreditUsedForCgst = netItcCgst.min(liabilityCgst);
        liabilityCgst = liabilityCgst.subtract(cgstCreditUsedForCgst);
        BigDecimal remainingCgstCredit = netItcCgst.subtract(cgstCreditUsedForCgst);
        
        BigDecimal cgstCreditUsedForIgst = remainingCgstCredit.min(liabilityIgst);
        liabilityIgst = liabilityIgst.subtract(cgstCreditUsedForIgst);

        // Rule 3: Set off SGST Credit
        BigDecimal sgstCreditUsedForSgst = netItcSgst.min(liabilitySgst);
        liabilitySgst = liabilitySgst.subtract(sgstCreditUsedForSgst);
        BigDecimal remainingSgstCredit = netItcSgst.subtract(sgstCreditUsedForSgst);
        
        BigDecimal sgstCreditUsedForIgst = remainingSgstCredit.min(liabilityIgst);
        liabilityIgst = liabilityIgst.subtract(sgstCreditUsedForIgst);

        // Rule 4: Cess Set off
        BigDecimal cessCreditUsedForCess = netItcCess.min(liabilityCess);
        liabilityCess = liabilityCess.subtract(cessCreditUsedForCess);

        dto.getNetLiability().setIgst(liabilityIgst);
        dto.getNetLiability().setCgst(liabilityCgst);
        dto.getNetLiability().setSgst(liabilitySgst);
        dto.getNetLiability().setCess(liabilityCess);

        return dto;
    }

    @Override
    public HsnSummaryResponse getHsnSummary(GstReportRequest request) {
        GstReportFilterDto filter = request.getFilters();
        UUID companyId = TenantUtils.resolveCompanyIdForQuery(filter.getCompanyId());
        resolveDatesAndDefaults(filter, companyId);
        
        UUID branchId = filter.getBranchId();
        UUID gstRegistrationId = filter.getGstRegistrationId();

        if (branchId != null) {
            validateBranchOwnership(branchId, companyId);
        }
        if (gstRegistrationId != null) {
            validateGstRegistrationOwnership(gstRegistrationId, companyId, branchId);
        }

        log.info("Generating HSN Summary for Company: {}", companyId);

        if (!isValidDateRange(filter.getFromDate(), filter.getToDate())) {
            return new HsnSummaryResponse();
        }

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT h.code, h.description, COALESCE(SUM(i.quantity), 0), ")
           .append("COALESCE(SUM(i.taxable_amount), 0), COALESCE(SUM(i.cgst_amount), 0), ")
           .append("COALESCE(SUM(i.sgst_amount), 0), COALESCE(SUM(i.igst_amount), 0), ")
           .append("COALESCE(SUM(i.cess_amount), 0) ")
           .append("FROM sales_invoice_item i ")
           .append("JOIN sales_invoice s ON i.sales_invoice_id = s.id ")
           .append("JOIN hsn_sac_master h ON i.hsn_sac_id = h.id ")
           .append("WHERE s.invoice_date BETWEEN :fromDate AND :toDate ");

        if (companyId != null) {
            sql.append("AND s.company_id = :companyId ");
        }
        if (filter.getHsn() != null && !filter.getHsn().isBlank()) {
            sql.append("AND h.code = :hsn ");
        }
        sql.append("GROUP BY h.code, h.description ORDER BY h.code");

        Query query = entityManager.createNativeQuery(sql.toString());
        query.setParameter("fromDate", filter.getFromDate());
        query.setParameter("toDate", filter.getToDate());
        if (companyId != null) {
            query.setParameter("companyId", companyId);
        }
        if (filter.getHsn() != null && !filter.getHsn().isBlank()) {
            query.setParameter("hsn", filter.getHsn());
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<HsnSummaryDto> summaryList = new ArrayList<>();
        
        HsnAggregateSummaryDto agg = new HsnAggregateSummaryDto();
        
        for (Object[] row : rows) {
            HsnSummaryDto dto = new HsnSummaryDto();
            dto.setHsnCode(row[0] != null ? row[0].toString() : null);
            dto.setDescription(row[1] != null ? row[1].toString() : null);
            dto.setQuantity(toBigDecimal(row[2]));
            dto.setTaxableValue(toBigDecimal(row[3]));
            dto.setCgst(toBigDecimal(row[4]));
            dto.setSgst(toBigDecimal(row[5]));
            dto.setIgst(toBigDecimal(row[6]));
            dto.setCess(toBigDecimal(row[7]));
            summaryList.add(dto);
            
            agg.setTotalQuantity(agg.getTotalQuantity().add(dto.getQuantity()));
            agg.setTotalTaxableValue(agg.getTotalTaxableValue().add(dto.getTaxableValue()));
            agg.setTotalCgst(agg.getTotalCgst().add(dto.getCgst()));
            agg.setTotalSgst(agg.getTotalSgst().add(dto.getSgst()));
            agg.setTotalIgst(agg.getTotalIgst().add(dto.getIgst()));
            agg.setTotalCess(agg.getTotalCess().add(dto.getCess()));
        }
        
        agg.setTotalHsnCodes(summaryList.size());
        
        int page = request.getPagination() != null ? request.getPagination().getPage() : 1;
        int size = request.getPagination() != null ? request.getPagination().getSize() : 100;
        
        int start = Math.min((page - 1) * size, summaryList.size());
        int startSafe = Math.max(0, start);
        int end = Math.min(startSafe + size, summaryList.size());
        List<HsnSummaryDto> pagedRecords = summaryList.subList(startSafe, end);
        
        HsnSummaryResponse response = new HsnSummaryResponse();
        response.setRecords(pagedRecords);
        response.setSummary(agg);
        
        Gstr3bDto.ReportInfo reportInfo = new Gstr3bDto.ReportInfo();
        reportInfo.setReportName("HSN Summary");
        reportInfo.setReportingPeriod(filter.getFromDate() + " to " + filter.getToDate());
        reportInfo.setGeneratedAt(java.time.Instant.now().toString());
        response.setReportInfo(reportInfo);
        
        com.erp.account.common.dto.response.PaginationResponse pagination = com.erp.account.common.dto.response.PaginationResponse.builder()
            .page(page)
            .size(size)
            .totalElements((long) summaryList.size())
            .totalPages((int) Math.ceil((double) summaryList.size() / size))
            .hasNext(end < summaryList.size())
            .hasPrevious(page > 1)
            .build();
        response.setPagination(pagination);
        
        return response;
    }

    @Override
    public ItcReportDto getItcReport(GstReportRequest request) {
        GstReportFilterDto filter = request.getFilters();
        UUID companyId = TenantUtils.resolveCompanyIdForQuery(filter.getCompanyId());
        resolveDatesAndDefaults(filter, companyId);
        
        UUID branchId = filter.getBranchId();
        UUID gstRegistrationId = filter.getGstRegistrationId();

        if (branchId != null) {
            validateBranchOwnership(branchId, companyId);
        }
        if (gstRegistrationId != null) {
            validateGstRegistrationOwnership(gstRegistrationId, companyId, branchId);
        }

        log.info("Generating ITC Report for Company: {}", companyId);

        if (!isValidDateRange(filter.getFromDate(), filter.getToDate())) {
            return new ItcReportDto();
        }

        Object[] purchaseAggregate = executeAggregateQuery("ap_invoice", companyId, branchId, gstRegistrationId, filter.getFromDate(), filter.getToDate());
        BigDecimal inputCgst = BigDecimal.ZERO;
        BigDecimal inputSgst = BigDecimal.ZERO;
        BigDecimal inputIgst = BigDecimal.ZERO;
        BigDecimal inputCess = BigDecimal.ZERO;

        if (purchaseAggregate != null) {
            inputCgst = toBigDecimal(purchaseAggregate[1]);
            inputSgst = toBigDecimal(purchaseAggregate[2]);
            inputIgst = toBigDecimal(purchaseAggregate[3]);
            inputCess = toBigDecimal(purchaseAggregate[4]);
        }

        BigDecimal openingItc = BigDecimal.ZERO;
        BigDecimal utilizedItc = inputCgst.add(inputSgst).add(inputIgst).add(inputCess);
        BigDecimal closingItc = openingItc.add(utilizedItc).subtract(utilizedItc); // stub logic

        ItcReportDto dto = new ItcReportDto();
        
        Gstr3bDto.ReportInfo reportInfo = new Gstr3bDto.ReportInfo();
        reportInfo.setReportName("Input Tax Credit (ITC) Report");
        reportInfo.setReportingPeriod(filter.getFromDate() + " to " + filter.getToDate());
        reportInfo.setGeneratedAt(java.time.Instant.now().toString());
        dto.setReportInfo(reportInfo);

        dto.setOpeningBalance(openingItc);

        dto.getItcAvailed().setCgst(inputCgst);
        dto.getItcAvailed().setSgst(inputSgst);
        dto.getItcAvailed().setIgst(inputIgst);
        dto.getItcAvailed().setCess(inputCess);
        
        dto.getItcUtilized().setCgst(inputCgst); // mock utilized
        dto.getItcUtilized().setSgst(inputSgst);
        dto.getItcUtilized().setIgst(inputIgst);
        dto.getItcUtilized().setCess(inputCess);

        dto.getSummary().setTotalItcAvailed(inputCgst.add(inputSgst).add(inputIgst).add(inputCess));
        dto.getSummary().setTotalItcUtilized(utilizedItc);
        dto.getSummary().setNetItcAvailable(dto.getSummary().getTotalItcAvailed().subtract(utilizedItc));
        dto.getSummary().setClosingBalance(closingItc);

        return dto;
    }

    private Object[] executeAggregateQuery(String tableName, UUID companyId, UUID branchId, UUID gstRegistrationId, LocalDate fromDate, LocalDate toDate) {
        StringBuilder sqlBuilder = new StringBuilder();
        if ("sales_invoice".equals(tableName)) {
            sqlBuilder.append("SELECT COALESCE(SUM(si.taxable_amount), 0), COALESCE(SUM(si.cgst_amount), 0), ")
                      .append("COALESCE(SUM(si.sgst_amount), 0), COALESCE(SUM(si.igst_amount), 0), ")
                      .append("COALESCE(SUM(si.cess_amount), 0), COALESCE(SUM(si.tax_amount), 0) ")
                      .append("FROM sales_invoice s ")
                      .append("LEFT JOIN sales_invoice_item si ON si.sales_invoice_id = s.id AND (si.is_deleted = false OR si.is_deleted IS NULL) ")
                      .append("WHERE s.invoice_date BETWEEN :fromDate AND :toDate ")
                      .append("AND (s.is_deleted = false OR s.is_deleted IS NULL) ");
        } else {
            sqlBuilder.append("SELECT COALESCE(SUM(a.subtotal), 0), COALESCE(SUM(a.cgst_amount), 0), ")
                      .append("COALESCE(SUM(a.sgst_amount), 0), COALESCE(SUM(a.igst_amount), 0), ")
                      .append("COALESCE(SUM(a.cess_amount), 0), COALESCE(SUM(a.tax_amount), 0) ")
                      .append("FROM ap_invoice a WHERE a.invoice_date BETWEEN :fromDate AND :toDate ");
        }

        String alias = "sales_invoice".equals(tableName) ? "s" : "a";
        
        if (companyId != null) {
            sqlBuilder.append("AND ").append(alias).append(".company_id = :companyId ");
        }

        Query query = entityManager.createNativeQuery(sqlBuilder.toString());
        query.setParameter("fromDate", fromDate);
        query.setParameter("toDate", toDate);
        if (companyId != null) {
            query.setParameter("companyId", companyId);
        }

        Object[] row = singleRow(query, "Aggregate Query");
        return row;
    }

    private Object[] executeItcReversalQuery(UUID companyId, UUID branchId, UUID gstRegistrationId, LocalDate fromDate, LocalDate toDate) {
        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append("SELECT ")
                  // Rule 42/43
                  .append("COALESCE(SUM(CASE WHEN i.reversal_type IN ('RULE_42', 'RULE_43') THEN a.igst_amount ELSE 0 END), 0), ")
                  .append("COALESCE(SUM(CASE WHEN i.reversal_type IN ('RULE_42', 'RULE_43') THEN a.cgst_amount ELSE 0 END), 0), ")
                  .append("COALESCE(SUM(CASE WHEN i.reversal_type IN ('RULE_42', 'RULE_43') THEN a.sgst_amount ELSE 0 END), 0), ")
                  .append("COALESCE(SUM(CASE WHEN i.reversal_type IN ('RULE_42', 'RULE_43') THEN a.cess_amount ELSE 0 END), 0), ")
                  // Section 17(5) or is_blocked_itc
                  .append("COALESCE(SUM(CASE WHEN a.is_blocked_itc = true OR i.reversal_type = 'SECTION_17_5' THEN a.igst_amount ELSE 0 END), 0), ")
                  .append("COALESCE(SUM(CASE WHEN a.is_blocked_itc = true OR i.reversal_type = 'SECTION_17_5' THEN a.cgst_amount ELSE 0 END), 0), ")
                  .append("COALESCE(SUM(CASE WHEN a.is_blocked_itc = true OR i.reversal_type = 'SECTION_17_5' THEN a.sgst_amount ELSE 0 END), 0), ")
                  .append("COALESCE(SUM(CASE WHEN a.is_blocked_itc = true OR i.reversal_type = 'SECTION_17_5' THEN a.cess_amount ELSE 0 END), 0) ")
                  .append("FROM ap_invoice_item i ")
                  .append("JOIN ap_invoice a ON i.ap_invoice_id = a.id ")
                  .append("WHERE a.invoice_date BETWEEN :fromDate AND :toDate ");

        if (companyId != null) {
            sqlBuilder.append("AND a.company_id = :companyId ");
        }

        Query query = entityManager.createNativeQuery(sqlBuilder.toString());
        query.setParameter("fromDate", fromDate);
        query.setParameter("toDate", toDate);
        if (companyId != null) query.setParameter("companyId", companyId);

        Object[] result = singleRow(query, "ITC Reversal Query");
        return result != null ? result : new Object[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO};
    }

    private Object[] executeRcmQuery(UUID companyId, UUID branchId, UUID gstRegistrationId, LocalDate fromDate, LocalDate toDate) {
        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append("SELECT ")
                  .append("COALESCE(SUM(a.igst_amount), 0), ")
                  .append("COALESCE(SUM(a.cgst_amount), 0), ")
                  .append("COALESCE(SUM(a.sgst_amount), 0), ")
                  .append("COALESCE(SUM(a.cess_amount), 0), ")
                  .append("COALESCE(SUM(a.subtotal), 0) ")
                  .append("FROM ap_invoice a ")
                  .append("WHERE a.is_reverse_charge = true ")
                  .append("AND a.invoice_date BETWEEN :fromDate AND :toDate ");

        if (companyId != null) {
            sqlBuilder.append("AND a.company_id = :companyId ");
        }

        Query query = entityManager.createNativeQuery(sqlBuilder.toString());
        query.setParameter("fromDate", fromDate);
        query.setParameter("toDate", toDate);
        if (companyId != null) query.setParameter("companyId", companyId);

        Object[] row = singleRow(query, "RCM Query");
        return row != null ? row : new Object[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO};
    }

    private void validateBranchOwnership(UUID branchId, UUID companyId) {
        try {
            StringBuilder sql = new StringBuilder("SELECT COUNT(1) FROM branch b WHERE b.id = :branchId");
            if (companyId != null) {
                sql.append(" AND b.company_id = :companyId");
            }
            Query query = entityManager.createNativeQuery(sql.toString());
            query.setParameter("branchId", branchId);
            if (companyId != null) {
                query.setParameter("companyId", companyId);
            }
            Number count = (Number) query.getSingleResult();
            if (count.longValue() == 0L) {
                throw new ForbiddenException("Branch does not belong to the requested company or does not exist", "BRANCH_COMPANY_MISMATCH");
            }
        } catch (ForbiddenException fe) {
            throw fe;
        } catch (Exception ignored) {
            // skip strict validation when metadata is unavailable
        }
    }

    private void validateGstRegistrationOwnership(UUID gstRegistrationId, UUID companyId, UUID branchId) {
        try {
            StringBuilder sql = new StringBuilder("SELECT COUNT(1) FROM gst_registration g WHERE g.id = :gstRegistrationId");
            if (companyId != null) {
                sql.append(" AND g.company_id = :companyId");
            }
            if (branchId != null) {
                sql.append(" AND g.branch_id = :branchId");
            }
            Query query = entityManager.createNativeQuery(sql.toString());
            query.setParameter("gstRegistrationId", gstRegistrationId);
            if (companyId != null) {
                query.setParameter("companyId", companyId);
            }
            if (branchId != null) {
                query.setParameter("branchId", branchId);
            }
            Number count = (Number) query.getSingleResult();
            if (count.longValue() == 0L) {
                throw new ForbiddenException("GST registration does not belong to the requested company/branch or does not exist", "GST_REGISTRATION_MISMATCH");
            }
        } catch (ForbiddenException fe) {
            throw fe;
        } catch (Exception ignored) {
            // skip strict validation when metadata is unavailable
        }
    }

    private boolean isValidDateRange(LocalDate fromDate, LocalDate toDate) {
        return fromDate != null && toDate != null && !fromDate.isAfter(toDate);
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
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private void resolveDatesAndDefaults(GstReportFilterDto filter, UUID companyId) {
        if (filter.getGstRegistrationId() == null && companyId != null) {
            try {
                Query q = entityManager.createNativeQuery(
                        "SELECT id FROM gst_registration WHERE company_id = :companyId AND is_default = true AND is_deleted = false");
                q.setParameter("companyId", companyId);
                q.setMaxResults(1);
                Object[] row = singleRow(q, "Default GST Registration");
                if (row != null && row[0] != null) {
                    filter.setGstRegistrationId(UUID.fromString(row[0].toString()));
                }
            } catch (Exception e) {
                log.debug("Default GST Registration unavailable: {}", e.getMessage());
            }
        }

        if (filter.getFromDate() == null && filter.getToDate() == null) {
            try {
                StringBuilder sql = new StringBuilder("SELECT start_date, end_date FROM fiscal_year WHERE company_id = :companyId");
                if (filter.getFinancialYearId() != null) {
                    sql.append(" AND id = :financialYearId");
                } else {
                    sql.append(" AND is_closed = false"); // OPEN
                }
                Query q = entityManager.createNativeQuery(sql.toString());
                q.setParameter("companyId", companyId);
                if (filter.getFinancialYearId() != null) {
                    q.setParameter("financialYearId", filter.getFinancialYearId());
                }
                q.setMaxResults(1);
                Object[] row = singleRow(q, "Fiscal year");
                if (row != null) {
                    if (row[0] instanceof java.sql.Date) filter.setFromDate(((java.sql.Date) row[0]).toLocalDate());
                    else if (row[0] != null) filter.setFromDate(LocalDate.parse(row[0].toString()));
                    
                    if (row[1] instanceof java.sql.Date) filter.setToDate(((java.sql.Date) row[1]).toLocalDate());
                    else if (row[1] != null) filter.setToDate(LocalDate.parse(row[1].toString()));
                }
            } catch (Exception e) {
                log.debug("Fiscal year metadata unavailable: {}", e.getMessage());
            }
        }
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
}
