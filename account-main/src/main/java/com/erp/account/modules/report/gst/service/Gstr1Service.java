package com.erp.account.modules.report.gst.service;

import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import com.erp.account.modules.report.gst.dto.GstReportRequest;
import com.erp.account.modules.report.gst.dto.Gstr1Dto;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.util.TenantUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Slf4j
@Service
@Transactional(readOnly = true)
public class Gstr1Service {

    @PersistenceContext
    private EntityManager entityManager;

    public Page<Gstr1Dto> getGstr1(GstReportRequest request) {
        GstReportFilterDto filter = request.getFilters();
        if (filter == null) {
            filter = new GstReportFilterDto();
        }

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

        log.debug("Resolved companyId for GSTR-1: {}", companyId);
        log.info("Generating GSTR-1 for Company: {}", companyId);

        Sort.Direction direction = Sort.Direction.fromString(request.getSort().getDirection());
        String sortBy = request.getSort().getField();
        PageRequest pageRequest = PageRequest.of(request.getPagination().getZeroBasedPage(), Math.max(1, request.getPagination().getSize()), Sort.by(direction, sortBy));

        if (!isValidDateRange(filter.getFromDate(), filter.getToDate())) {
            return Page.empty(pageRequest);
        }

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT s.id, s.invoice_number, s.invoice_date, c.customer_name, c.gstin, s.place_of_supply_state_code, ")
                .append("COALESCE(SUM(i.taxable_amount),0) as taxable, ")
                .append("COALESCE(SUM(i.cgst_amount),0) as cgst, ")
                .append("COALESCE(SUM(i.sgst_amount),0) as sgst, ")
                .append("COALESCE(SUM(i.igst_amount),0) as igst, ")
                .append("COALESCE(SUM(i.cess_amount),0) as cess, ")
                .append("MAX(s.total_amount) as total_amount, h.code as hsn_code, g.igst_rate as gst_rate ")
                .append("FROM sales_invoice s ")
                .append("LEFT JOIN customer c ON s.customer_id = c.id ")
                .append("LEFT JOIN sales_invoice_item i ON i.sales_invoice_id = s.id AND (i.is_deleted = false OR i.is_deleted IS NULL) ")
                .append("LEFT JOIN hsn_sac_master h ON i.hsn_sac_id = h.id ")
                .append("LEFT JOIN gst_slab g ON h.gst_slab_id = g.id ")
                .append("WHERE s.invoice_date BETWEEN :fromDate AND :toDate ")
                .append("AND (s.is_deleted = false OR s.is_deleted IS NULL) ")
                .append("AND s.status IN ('POSTED','APPROVED') ")
                .append("AND (:companyId IS NULL OR s.company_id = :companyId) ");
        sql.append("GROUP BY s.id, s.invoice_number, s.invoice_date, c.customer_name, c.gstin, s.place_of_supply_state_code, h.code, g.igst_rate ")
                .append("ORDER BY s.invoice_date DESC");

        StringBuilder countSql = new StringBuilder();
        countSql.append("SELECT COUNT(DISTINCT s.id) FROM sales_invoice s ")
                .append("LEFT JOIN sales_invoice_item i ON i.sales_invoice_id = s.id AND (i.is_deleted = false OR i.is_deleted IS NULL) ")
                .append("LEFT JOIN hsn_sac_master h ON i.hsn_sac_id = h.id ")
                .append("LEFT JOIN gst_slab g ON h.gst_slab_id = g.id ")
                .append("WHERE s.invoice_date BETWEEN :fromDate AND :toDate ")
                .append("AND (s.is_deleted = false OR s.is_deleted IS NULL) ")
                .append("AND s.status IN ('POSTED','APPROVED') ")
                .append("AND (:companyId IS NULL OR s.company_id = :companyId) ");

        Query query = entityManager.createNativeQuery(sql.toString());
        query.setParameter("fromDate", filter.getFromDate());
        query.setParameter("toDate", filter.getToDate());
        query.setParameter("companyId", companyId);
        query.setFirstResult((int) pageRequest.getOffset());
        query.setMaxResults(pageRequest.getPageSize());

        Query countQuery = entityManager.createNativeQuery(countSql.toString());
        countQuery.setParameter("fromDate", filter.getFromDate());
        countQuery.setParameter("toDate", filter.getToDate());
        countQuery.setParameter("companyId", companyId);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        Number total = ((Number) countQuery.getSingleResult());

        List<Gstr1Dto> dtoList = new ArrayList<>();
        for (Object[] row : rows) {
            Gstr1Dto dto = new Gstr1Dto();
            dto.setInvoiceNumber(row[1] != null ? row[1].toString() : null);
            if (row[2] instanceof java.time.LocalDate) dto.setInvoiceDate((java.time.LocalDate) row[2]);
            else if (row[2] instanceof java.sql.Date) dto.setInvoiceDate(((java.sql.Date) row[2]).toLocalDate());
            dto.setCustomerName(row[3] != null ? row[3].toString() : null);
            String gstin = row[4] != null ? row[4].toString() : null;
            dto.setGstin(gstin);
            String pos = row[5] != null ? row[5].toString() : null;
            dto.setPlaceOfSupply(pos);
            dto.setState(pos);
            dto.setTaxableAmount(toBigDecimal(row[6]));
            dto.setCgst(toBigDecimal(row[7]));
            dto.setSgst(toBigDecimal(row[8]));
            dto.setIgst(toBigDecimal(row[9]));
            dto.setCess(toBigDecimal(row[10]));
            BigDecimal totalVal = toBigDecimal(row[11]);
            dto.setTotalInvoiceValue(totalVal);
            dto.setHsn(row[12] != null ? row[12].toString() : null);
            dto.setGstRate(toBigDecimal(row[13]));

            if (gstin != null && !gstin.isBlank()) {
                dto.setTableCategory("B2B");
            } else if (dto.getIgst().compareTo(BigDecimal.ZERO) > 0 && totalVal.compareTo(new BigDecimal("250000")) > 0) {
                dto.setTableCategory("B2CL");
            } else {
                dto.setTableCategory("B2CS");
            }

            dtoList.add(dto);
        }

        return new PageImpl<>(dtoList, pageRequest, total.longValue());
    }

    private boolean isValidDateRange(LocalDate fromDate, LocalDate toDate) {
        return fromDate != null && toDate != null && !fromDate.isAfter(toDate);
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
                throw new com.erp.account.common.exception.ForbiddenException("Branch does not belong to the requested company or does not exist", "BRANCH_COMPANY_MISMATCH");
            }
        } catch (com.erp.account.common.exception.ForbiddenException fe) {
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
                throw new com.erp.account.common.exception.ForbiddenException("GST registration does not belong to the requested company/branch or does not exist", "GST_REGISTRATION_MISMATCH");
            }
        } catch (com.erp.account.common.exception.ForbiddenException fe) {
            throw fe;
        } catch (Exception ignored) {
            // skip strict validation when metadata is unavailable
        }
    }

    private Gstr1Dto mapToGstr1Dto(SalesInvoice invoice) {
        Gstr1Dto dto = new Gstr1Dto();
        dto.setInvoiceNumber(invoice.getInvoiceNumber());
        dto.setInvoiceDate(invoice.getInvoiceDate());
        dto.setCustomerName(invoice.getCustomer() != null ? invoice.getCustomer().getCustomerName() : null);
        dto.setGstin(invoice.getCustomer() != null ? invoice.getCustomer().getGstin() : null);
        dto.setPlaceOfSupply(invoice.getPlaceOfSupplyStateCode());
        dto.setState(invoice.getPlaceOfSupplyStateCode());
        dto.setTaxableAmount(invoice.getSubtotal() != null ? invoice.getSubtotal() : BigDecimal.ZERO);
        dto.setTotalInvoiceValue(invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO);
        dto.setCgst(sumItemTax(invoice, item -> item.getCgstAmount()));
        dto.setSgst(sumItemTax(invoice, item -> item.getSgstAmount()));
        dto.setIgst(sumItemTax(invoice, item -> item.getIgstAmount()));
        dto.setCess(sumItemTax(invoice, item -> item.getCessAmount()));
        dto.setHsn(invoice.getSalesInvoiceItems().stream()
                .filter(item -> item.getHsnSacMaster() != null)
                .map(item -> item.getHsnSacMaster().getCode())
                .findFirst()
                .orElse(null));
        dto.setGstRate(invoice.getSalesInvoiceItems().stream()
                .filter(item -> item.getHsnSacMaster() != null && item.getHsnSacMaster().getGstSlab() != null)
                .map(item -> item.getHsnSacMaster().getGstSlab().getIgstRate())
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null));
        return dto;
    }

    private BigDecimal sumItemTax(SalesInvoice invoice, java.util.function.Function<com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem, BigDecimal> extractor) {
        return invoice.getSalesInvoiceItems().stream()
                .map(extractor)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        try {
            return new BigDecimal(value.toString());
        } catch (Exception e) {
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
