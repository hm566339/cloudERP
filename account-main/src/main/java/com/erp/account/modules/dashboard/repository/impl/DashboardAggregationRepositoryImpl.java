package com.erp.account.modules.dashboard.repository.impl;

import com.erp.account.modules.dashboard.dto.projections.ChartDataProjection;
import com.erp.account.modules.dashboard.repository.DashboardAggregationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;

@Slf4j
@Repository
@RequiredArgsConstructor
public class DashboardAggregationRepositoryImpl implements DashboardAggregationRepository {

    @PersistenceContext
    private final EntityManager entityManager;

    // ========== Helper for null-safe company filtering ==========

    private String companyFilter(String alias, UUID companyId) {
        if (companyId == null) {
            return "";
        }
        return " WHERE " + alias + ".company.id = :companyId";
    }

    private String companyFilterAnd(String alias, UUID companyId) {
        if (companyId == null) {
            return "";
        }
        return " AND " + alias + ".company.id = :companyId";
    }

    private <T> TypedQuery<T> setCompanyParam(TypedQuery<T> query, UUID companyId) {
        if (companyId != null) {
            query.setParameter("companyId", companyId);
        }
        return query;
    }

    // ========== Count Methods ==========

    @Override
    public Long countCustomers(UUID companyId) {
        try {
            String jpql = "SELECT COUNT(c) FROM Customer c" + companyFilter("c", companyId);
            return setCompanyParam(entityManager.createQuery(jpql, Long.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error counting customers: {}", e.getMessage());
            return 0L;
        }
    }

    @Override
    public Long countVendors(UUID companyId) {
        try {
            String jpql = "SELECT COUNT(v) FROM Vendor v" + companyFilter("v", companyId);
            return setCompanyParam(entityManager.createQuery(jpql, Long.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error counting vendors: {}", e.getMessage());
            return 0L;
        }
    }

    @Override
    public Long countSalesInvoices(UUID companyId) {
        try {
            String jpql = "SELECT COUNT(s) FROM SalesInvoice s" + companyFilter("s", companyId);
            return setCompanyParam(entityManager.createQuery(jpql, Long.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error counting sales invoices: {}", e.getMessage());
            return 0L;
        }
    }

    @Override
    public Long countPurchaseInvoices(UUID companyId) {
        try {
            String jpql = "SELECT COUNT(p) FROM ApInvoice p" + companyFilter("p", companyId);
            return setCompanyParam(entityManager.createQuery(jpql, Long.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error counting purchase invoices: {}", e.getMessage());
            return 0L;
        }
    }

    // ========== Outstanding Methods ==========

    @Override
    public BigDecimal getOutstandingReceivables(UUID companyId) {
        try {
            String jpql;
            if (companyId != null) {
                jpql = "SELECT COALESCE(SUM(s.outstandingAmount), 0) FROM SalesInvoice s WHERE s.company.id = :companyId AND s.status != 'PAID'";
            } else {
                jpql = "SELECT COALESCE(SUM(s.outstandingAmount), 0) FROM SalesInvoice s WHERE s.status != 'PAID'";
            }
            return setCompanyParam(entityManager.createQuery(jpql, BigDecimal.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error getting outstanding receivables: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    @Override
    public BigDecimal getOutstandingPayables(UUID companyId) {
        try {
            String jpql;
            if (companyId != null) {
                jpql = "SELECT COALESCE(SUM(p.outstandingAmount), 0) FROM ApInvoice p WHERE p.company.id = :companyId AND p.status != 'PAID'";
            } else {
                jpql = "SELECT COALESCE(SUM(p.outstandingAmount), 0) FROM ApInvoice p WHERE p.status != 'PAID'";
            }
            return setCompanyParam(entityManager.createQuery(jpql, BigDecimal.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error getting outstanding payables: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    // ========== Balance Methods ==========

    @Override
    public BigDecimal getCashBalance(UUID companyId) {
        try {
            String jpql;
            if (companyId != null) {
                jpql = "SELECT COALESCE(SUM(b.currentBalance), 0) FROM BankAccount b WHERE b.company.id = :companyId AND b.accountType = 'CASH'";
            } else {
                jpql = "SELECT COALESCE(SUM(b.currentBalance), 0) FROM BankAccount b WHERE b.accountType = 'CASH'";
            }
            return setCompanyParam(entityManager.createQuery(jpql, BigDecimal.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error getting cash balance: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    @Override
    public BigDecimal getBankBalance(UUID companyId) {
        try {
            String jpql;
            if (companyId != null) {
                jpql = "SELECT COALESCE(SUM(b.currentBalance), 0) FROM BankAccount b WHERE b.company.id = :companyId AND b.accountType != 'CASH'";
            } else {
                jpql = "SELECT COALESCE(SUM(b.currentBalance), 0) FROM BankAccount b WHERE b.accountType != 'CASH'";
            }
            return setCompanyParam(entityManager.createQuery(jpql, BigDecimal.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error getting bank balance: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    // ========== Revenue / Expense Methods ==========

    @Override
    public BigDecimal getRevenue(UUID companyId) {
        try {
            String jpql = "SELECT COALESCE(SUM(s.totalAmount), 0) FROM SalesInvoice s" + companyFilter("s", companyId);
            return setCompanyParam(entityManager.createQuery(jpql, BigDecimal.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error getting revenue: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    @Override
    public BigDecimal getExpense(UUID companyId) {
        try {
            String jpql = "SELECT COALESCE(SUM(p.totalAmount), 0) FROM ApInvoice p" + companyFilter("p", companyId);
            return setCompanyParam(entityManager.createQuery(jpql, BigDecimal.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error getting expense: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    // ========== Today's Collection / Payment ==========

    @Override
    public BigDecimal getTodaysCollection(UUID companyId) {
        try {
            String jpql;
            if (companyId != null) {
                jpql = "SELECT COALESCE(SUM(r.amount), 0) FROM ReceiptVoucher r WHERE r.company.id = :companyId AND CAST(r.voucherDate AS date) = CURRENT_DATE";
            } else {
                jpql = "SELECT COALESCE(SUM(r.amount), 0) FROM ReceiptVoucher r WHERE CAST(r.voucherDate AS date) = CURRENT_DATE";
            }
            return setCompanyParam(entityManager.createQuery(jpql, BigDecimal.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error getting today's collection: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    @Override
    public BigDecimal getTodaysPayment(UUID companyId) {
        try {
            String jpql;
            if (companyId != null) {
                jpql = "SELECT COALESCE(SUM(p.amount), 0) FROM PaymentVoucher p WHERE p.company.id = :companyId AND CAST(p.voucherDate AS date) = CURRENT_DATE";
            } else {
                jpql = "SELECT COALESCE(SUM(p.amount), 0) FROM PaymentVoucher p WHERE CAST(p.voucherDate AS date) = CURRENT_DATE";
            }
            return setCompanyParam(entityManager.createQuery(jpql, BigDecimal.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error getting today's payment: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    // ========== GST / Budget ==========

    @Override
    public BigDecimal getGstLiability(UUID companyId) {
        try {
            String jpql;
            if (companyId != null) {
                jpql = "SELECT COALESCE(SUM(t.taxAmount), 0) FROM TaxTransaction t WHERE t.company.id = :companyId AND t.transactionType = 'SALES'";
            } else {
                jpql = "SELECT COALESCE(SUM(t.taxAmount), 0) FROM TaxTransaction t WHERE t.transactionType = 'SALES'";
            }
            return setCompanyParam(entityManager.createQuery(jpql, BigDecimal.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error getting GST liability: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    @Override
    public BigDecimal getBudgetUtilization(UUID companyId) {
        return BigDecimal.ZERO; // Placeholder for budget logic
    }

    // ========== Journal / Approvals ==========

    @Override
    public Long getPostedJournalsCount(UUID companyId) {
        try {
            String jpql;
            if (companyId != null) {
                jpql = "SELECT COUNT(j) FROM GlJournalEntry j WHERE j.company.id = :companyId AND j.status = 'POSTED'";
            } else {
                jpql = "SELECT COUNT(j) FROM GlJournalEntry j WHERE j.status = 'POSTED'";
            }
            return setCompanyParam(entityManager.createQuery(jpql, Long.class), companyId)
                    .getSingleResult();
        } catch (Exception e) {
            log.warn("Error getting posted journals count: {}", e.getMessage());
            return 0L;
        }
    }

    @Override
    public Long getPendingApprovalsCount(UUID companyId) {
        return 0L; // Simplified
    }

    // ========== Charts ==========

    @Override
    public List<ChartDataProjection> getRevenueTrend(UUID companyId) {
        try {
            String jpql = "SELECT new com.erp.account.modules.dashboard.dto.response.ChartDataDto(CAST(s.invoiceDate as string), SUM(s.totalAmount)) " +
                          "FROM SalesInvoice s " + companyFilter("s", companyId) + " " +
                          "GROUP BY s.invoiceDate ORDER BY s.invoiceDate DESC";
            return setCompanyParam(entityManager.createQuery(jpql, ChartDataProjection.class), companyId)
                    .setMaxResults(10)
                    .getResultList();
        } catch (Exception e) {
            log.warn("Error fetching revenue trend: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public List<ChartDataProjection> getExpenseTrend(UUID companyId) {
        try {
            String jpql = "SELECT new com.erp.account.modules.dashboard.dto.response.ChartDataDto(CAST(e.claimDate as string), SUM(e.claimAmount)) " +
                          "FROM ExpenseClaim e " + companyFilter("e", companyId) + " " +
                          "GROUP BY e.claimDate ORDER BY e.claimDate DESC";
            return setCompanyParam(entityManager.createQuery(jpql, ChartDataProjection.class), companyId)
                    .setMaxResults(10)
                    .getResultList();
        } catch (Exception e) {
            log.warn("Error fetching expense trend: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public List<ChartDataProjection> getCashFlow(UUID companyId) {
        return Collections.emptyList(); // Implemented in DashboardServiceImpl
    }

    @Override
    public List<ChartDataProjection> getReceivableAging(UUID companyId) {
        try {
            LocalDate today = LocalDate.now();
            LocalDate date30 = today.minusDays(30);
            LocalDate date60 = today.minusDays(60);
            LocalDate date90 = today.minusDays(90);

            String jpql = "SELECT " +
                    "SUM(CASE WHEN s.dueDate >= :today THEN s.outstandingAmount ELSE 0 END), " +
                    "SUM(CASE WHEN s.dueDate < :today AND s.dueDate >= :date30 THEN s.outstandingAmount ELSE 0 END), " +
                    "SUM(CASE WHEN s.dueDate < :date30 AND s.dueDate >= :date60 THEN s.outstandingAmount ELSE 0 END), " +
                    "SUM(CASE WHEN s.dueDate < :date60 AND s.dueDate >= :date90 THEN s.outstandingAmount ELSE 0 END), " +
                    "SUM(CASE WHEN s.dueDate < :date90 THEN s.outstandingAmount ELSE 0 END) " +
                    "FROM SalesInvoice s WHERE s.status != 'PAID' " + companyFilterAnd("s", companyId);

            TypedQuery<Object[]> query = entityManager.createQuery(jpql, Object[].class);
            query.setParameter("today", today);
            query.setParameter("date30", date30);
            query.setParameter("date60", date60);
            query.setParameter("date90", date90);
            setCompanyParam(query, companyId);

            Object[] result = query.getSingleResult();
            
            List<ChartDataProjection> list = new ArrayList<>();
            list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("Current", getBigDecimal(result[0])));
            list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("1-30 Days", getBigDecimal(result[1])));
            list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("31-60 Days", getBigDecimal(result[2])));
            list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("61-90 Days", getBigDecimal(result[3])));
            list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("90+ Days", getBigDecimal(result[4])));
            return list;
        } catch (Exception e) {
            log.warn("Error fetching receivable aging: {}", e.getMessage());
            return getEmptyAgingBuckets();
        }
    }

    @Override
    public List<ChartDataProjection> getPayableAging(UUID companyId) {
        try {
            LocalDate today = LocalDate.now();
            LocalDate date30 = today.minusDays(30);
            LocalDate date60 = today.minusDays(60);
            LocalDate date90 = today.minusDays(90);

            String jpql = "SELECT " +
                    "SUM(CASE WHEN p.dueDate >= :today THEN p.outstandingAmount ELSE 0 END), " +
                    "SUM(CASE WHEN p.dueDate < :today AND p.dueDate >= :date30 THEN p.outstandingAmount ELSE 0 END), " +
                    "SUM(CASE WHEN p.dueDate < :date30 AND p.dueDate >= :date60 THEN p.outstandingAmount ELSE 0 END), " +
                    "SUM(CASE WHEN p.dueDate < :date60 AND p.dueDate >= :date90 THEN p.outstandingAmount ELSE 0 END), " +
                    "SUM(CASE WHEN p.dueDate < :date90 THEN p.outstandingAmount ELSE 0 END) " +
                    "FROM ApInvoice p WHERE p.status != 'PAID' " + companyFilterAnd("p", companyId);

            TypedQuery<Object[]> query = entityManager.createQuery(jpql, Object[].class);
            query.setParameter("today", today);
            query.setParameter("date30", date30);
            query.setParameter("date60", date60);
            query.setParameter("date90", date90);
            setCompanyParam(query, companyId);

            Object[] result = query.getSingleResult();
            
            List<ChartDataProjection> list = new ArrayList<>();
            list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("Current", getBigDecimal(result[0])));
            list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("1-30 Days", getBigDecimal(result[1])));
            list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("31-60 Days", getBigDecimal(result[2])));
            list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("61-90 Days", getBigDecimal(result[3])));
            list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("90+ Days", getBigDecimal(result[4])));
            return list;
        } catch (Exception e) {
            log.warn("Error fetching payable aging: {}", e.getMessage());
            return getEmptyAgingBuckets();
        }
    }

    private BigDecimal getBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        }
        return new BigDecimal(value.toString());
    }

    private List<ChartDataProjection> getEmptyAgingBuckets() {
        List<ChartDataProjection> list = new ArrayList<>();
        list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("Current", BigDecimal.ZERO));
        list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("1-30 Days", BigDecimal.ZERO));
        list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("31-60 Days", BigDecimal.ZERO));
        list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("61-90 Days", BigDecimal.ZERO));
        list.add(new com.erp.account.modules.dashboard.dto.response.ChartDataDto("90+ Days", BigDecimal.ZERO));
        return list;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object> getRecentActivities(UUID companyId, int limit) {
        try {
            String jpql = "SELECT a FROM AuditLog a " + companyFilter("a", companyId) + " ORDER BY a.performedAt DESC";
            List<AuditLog> logs = setCompanyParam(entityManager.createQuery(jpql, AuditLog.class), companyId)
                    .setMaxResults(limit)
                    .getResultList();
            List<Object> result = new ArrayList<>(logs.size());
            for (AuditLog a : logs) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", a.getId());
                map.put("companyId", a.getCompany() != null ? a.getCompany().getId() : null);
                map.put("moduleName", a.getModuleName());
                map.put("entityName", a.getEntityName());
                map.put("entityId", a.getEntityId());
                map.put("actionType", a.getActionType());
                map.put("performedBy", a.getPerformedBy());
                map.put("performedByUsername", a.getPerformedByUsername());
                map.put("performedAt", a.getPerformedAt());
                map.put("ipAddress", a.getIpAddress());
                map.put("userAgent", a.getUserAgent());
                result.add(map);
            }
            return result;
        } catch (Exception e) {
            log.warn("Error fetching recent activities: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object> getRecentJournals(UUID companyId, int limit) {
        try {
            String jpql = "SELECT j FROM GlJournalEntry j " + companyFilter("j", companyId) + " ORDER BY j.createdAt DESC";
            List<GlJournalEntry> entries = setCompanyParam(entityManager.createQuery(jpql, GlJournalEntry.class), companyId)
                    .setMaxResults(limit)
                    .getResultList();
            List<Object> result = new ArrayList<>(entries.size());
            for (GlJournalEntry j : entries) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", j.getId());
                map.put("companyId", j.getCompany() != null ? j.getCompany().getId() : null);
                map.put("voucherNo", j.getVoucherNo());
                map.put("voucherDate", j.getVoucherDate());
                map.put("referenceNo", j.getReferenceNo());
                map.put("sourceModule", j.getSourceModule() != null ? j.getSourceModule().name() : null);
                map.put("sourceId", j.getSourceId());
                map.put("narration", j.getNarration());
                map.put("status", j.getStatus() != null ? j.getStatus().name() : null);
                map.put("totalDebit", j.getTotalDebit());
                map.put("totalCredit", j.getTotalCredit());
                map.put("postedBy", j.getPostedBy());
                map.put("postedAt", j.getPostedAt());
                map.put("createdAt", j.getCreatedAt());
                result.add(map);
            }
            return result;
        } catch (Exception e) {
            log.warn("Error fetching recent journals: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Object> getPendingApprovals(UUID companyId, int limit) {
        return Collections.emptyList();
    }
}
