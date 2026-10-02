package com.erp.account.modules.expense.repository.report;

import com.erp.account.enums.ApprovalStatus;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.ReimbursementStatus;
import com.erp.account.modules.expense.dto.report.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class ExpenseReportRepository {

    private final EntityManager entityManager;

    public ExpenseReportSummaryResponse getSummary(UUID companyId, ExpenseReportFilterRequest filter) {
        ExpenseReportSummaryResponse response = new ExpenseReportSummaryResponse();

        // 1. Total Recorded Expenses
        StringBuilder hql1 = new StringBuilder(
                "SELECT COUNT(c.id), SUM(c.claimAmount) FROM ExpenseClaim c " +
                "WHERE c.company.id = :companyId AND c.isDeleted = false " +
                "AND c.status IN (:finance, :paid) "
        );
        appendFilters(hql1, filter, "c", false);
        TypedQuery<Object[]> q1 = entityManager.createQuery(hql1.toString(), Object[].class);
        q1.setParameter("companyId", companyId);
        q1.setParameter("finance", ApprovalStatus.FINANCE_APPROVED);
        q1.setParameter("paid", ApprovalStatus.PAID);
        setFilterParameters(q1, filter);
        
        Object[] res1 = q1.getSingleResult();
        response.setTotalRecordedExpenseCount(res1[0] != null ? ((Number) res1[0]).longValue() : 0L);
        response.setTotalRecordedExpenses(res1[1] != null ? (BigDecimal) res1[1] : BigDecimal.ZERO);

        // 2. Pending Advance / Requests
        StringBuilder hql2 = new StringBuilder(
                "SELECT SUM(r.requestedAmount) FROM ExpenseRequest r " +
                "WHERE r.company.id = :companyId AND r.isDeleted = false " +
                "AND r.status IN (:pending, :approved) "
        );
        appendFilters(hql2, filter, "r", true);
        TypedQuery<BigDecimal> q2 = entityManager.createQuery(hql2.toString(), BigDecimal.class);
        q2.setParameter("companyId", companyId);
        q2.setParameter("pending", ExpenseRequestStatus.PENDING_APPROVAL);
        q2.setParameter("approved", ExpenseRequestStatus.APPROVED);
        setFilterParameters(q2, filter);
        
        BigDecimal res2 = q2.getSingleResult();
        response.setPendingAdvanceRequests(res2 != null ? res2 : BigDecimal.ZERO);

        // 3. Pending Reimbursement Due
        // Sum of all eligible claims - sum of all settled/paid reimbursements
        StringBuilder hql3_claims = new StringBuilder(
                "SELECT SUM(c.claimAmount) FROM ExpenseClaim c " +
                "WHERE c.company.id = :companyId AND c.isDeleted = false " +
                "AND c.status IN (:finance, :paid) "
        );
        appendFilters(hql3_claims, filter, "c", false);
        TypedQuery<BigDecimal> q3_claims = entityManager.createQuery(hql3_claims.toString(), BigDecimal.class);
        q3_claims.setParameter("companyId", companyId);
        q3_claims.setParameter("finance", ApprovalStatus.FINANCE_APPROVED);
        q3_claims.setParameter("paid", ApprovalStatus.PAID);
        setFilterParameters(q3_claims, filter);
        
        BigDecimal totalEligibleClaims = q3_claims.getSingleResult();
        if (totalEligibleClaims == null) totalEligibleClaims = BigDecimal.ZERO;

        StringBuilder hql3_reimbursements = new StringBuilder(
                "SELECT SUM(rm.reimbursementAmount) FROM Reimbursement rm " +
                "JOIN ExpenseClaim c ON rm.expenseClaimId = c.id " +
                "WHERE rm.company.id = :companyId AND rm.isDeleted = false " +
                "AND rm.status = :paid "
        );
        appendFilters(hql3_reimbursements, filter, "c", false);
        TypedQuery<BigDecimal> q3_rmb = entityManager.createQuery(hql3_reimbursements.toString(), BigDecimal.class);
        q3_rmb.setParameter("companyId", companyId);
        q3_rmb.setParameter("paid", ReimbursementStatus.PAID);
        setFilterParameters(q3_rmb, filter);
        
        BigDecimal totalSettled = q3_rmb.getSingleResult();
        if (totalSettled == null) totalSettled = BigDecimal.ZERO;
        
        BigDecimal pending = totalEligibleClaims.subtract(totalSettled);
        response.setPendingReimbursementDue(pending.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : pending);

        // 4. Total Reimbursements Settled
        response.setTotalReimbursementsSettled(totalSettled);

        return response;
    }

    public List<StaffDriverReportResponse> getStaffDriverAnalysis(UUID companyId, ExpenseReportFilterRequest filter) {
        StringBuilder hql = new StringBuilder(
                "SELECT c.employeeId, c.employeeName, c.employeeRole, " +
                "COUNT(DISTINCT c.id), " +
                "SUM(CASE WHEN i.paymentType = 'CASH' THEN i.amount ELSE 0 END), " +
                "SUM(CASE WHEN i.paymentType = 'CARD' THEN i.amount ELSE 0 END), " +
                "SUM(i.amount) " +
                "FROM ExpenseClaimItem i " +
                "JOIN i.expenseClaim c " +
                "WHERE c.company.id = :companyId AND c.isDeleted = false AND i.isDeleted = false " +
                "AND c.status IN (:finance, :paid) "
        );
        appendFilters(hql, filter, "c", false);
        hql.append(" GROUP BY c.employeeId, c.employeeName, c.employeeRole");

        TypedQuery<Object[]> query = entityManager.createQuery(hql.toString(), Object[].class);
        query.setParameter("companyId", companyId);
        query.setParameter("finance", ApprovalStatus.FINANCE_APPROVED);
        query.setParameter("paid", ApprovalStatus.PAID);
        setFilterParameters(query, filter);

        List<Object[]> results = query.getResultList();
        List<StaffDriverReportResponse> responses = new ArrayList<>();
        
        for (Object[] row : results) {
            UUID employeeId = (UUID) row[0];
            String employeeName = (String) row[1];
            String employeeRole = (String) row[2];

            long count = ((Number) row[3]).longValue();
            BigDecimal selfPaid = (BigDecimal) row[4];
            BigDecimal companyPaid = (BigDecimal) row[5];
            BigDecimal totalAmount = (BigDecimal) row[6];
            
            StaffDriverReportResponse dto = StaffDriverReportResponse.builder()
                    .employeeId(employeeId)
                    .employeeName(employeeName)
                    .role(employeeRole)
                    .voucherCount(count)
                    .selfPaidReimbursable(selfPaid != null ? selfPaid : BigDecimal.ZERO)
                    .companyPaid(companyPaid != null ? companyPaid : BigDecimal.ZERO)
                    .totalAmount(totalAmount != null ? totalAmount : BigDecimal.ZERO)
                    .build();
            responses.add(dto);
        }
        return responses;
    }

    public List<CategoryExpenseReportResponse> getCategoryBreakdown(UUID companyId, ExpenseReportFilterRequest filter) {
        StringBuilder hql = new StringBuilder(
                "SELECT cat.id, cat.categoryName, COUNT(DISTINCT c.id), " +
                "SUM(CASE WHEN i.paymentType = 'CASH' THEN i.amount ELSE 0 END), " +
                "SUM(CASE WHEN i.paymentType = 'CARD' THEN i.amount ELSE 0 END), " +
                "SUM(i.amount) " +
                "FROM ExpenseClaimItem i " +
                "JOIN i.expenseClaim c " +
                "JOIN i.expenseCategory cat " +
                "WHERE c.company.id = :companyId AND c.isDeleted = false AND i.isDeleted = false " +
                "AND c.status IN (:finance, :paid) "
        );
        appendFilters(hql, filter, "c", false);
        if (filter != null && filter.getCategoryId() != null) {
            hql.append(" AND cat.id = :catId ");
        }
        hql.append(" GROUP BY cat.id, cat.categoryName");

        TypedQuery<Object[]> query = entityManager.createQuery(hql.toString(), Object[].class);
        query.setParameter("companyId", companyId);
        query.setParameter("finance", ApprovalStatus.FINANCE_APPROVED);
        query.setParameter("paid", ApprovalStatus.PAID);
        setFilterParameters(query, filter);
        if (filter != null && filter.getCategoryId() != null) {
            query.setParameter("catId", filter.getCategoryId());
        }

        List<Object[]> results = query.getResultList();
        List<CategoryExpenseReportResponse> responses = new ArrayList<>();
        for (Object[] row : results) {
            UUID catId = (UUID) row[0];
            String catName = (String) row[1];
            long count = ((Number) row[2]).longValue();
            BigDecimal selfPaid = (BigDecimal) row[3];
            BigDecimal companyPaid = (BigDecimal) row[4];
            BigDecimal totalAmount = (BigDecimal) row[5];

            CategoryExpenseReportResponse dto = CategoryExpenseReportResponse.builder()
                    .categoryId(catId)
                    .categoryName(catName)
                    .voucherCount(count)
                    .selfPaidAmount(selfPaid != null ? selfPaid : BigDecimal.ZERO)
                    .companyPaidAmount(companyPaid != null ? companyPaid : BigDecimal.ZERO)
                    .totalAmount(totalAmount != null ? totalAmount : BigDecimal.ZERO)
                    .build();
            responses.add(dto);
        }
        return responses;
    }

    public List<VehicleExpenseReportResponse> getVehicleFleetExpenses(UUID companyId, ExpenseReportFilterRequest filter) {
        StringBuilder hql = new StringBuilder(
                "SELECT r.vehicleId, r.vehicleNumber, COUNT(DISTINCT c.id), SUM(i.amount), " +
                "SUM(CASE WHEN LOWER(cat.categoryName) LIKE '%fuel%' THEN i.amount ELSE 0 END), " +
                "SUM(CASE WHEN LOWER(cat.categoryName) NOT LIKE '%fuel%' THEN i.amount ELSE 0 END) " +
                "FROM ExpenseClaimItem i " +
                "JOIN i.expenseClaim c " +
                "JOIN i.expenseCategory cat " +
                "JOIN ExpenseRequest r ON c.expenseRequestId = r.id " +
                "WHERE c.company.id = :companyId AND c.isDeleted = false AND i.isDeleted = false " +
                "AND r.vehicleId IS NOT NULL " +
                "AND c.status IN (:finance, :paid) "
        );
        appendFilters(hql, filter, "c", false);
        hql.append(" GROUP BY r.vehicleId, r.vehicleNumber");

        TypedQuery<Object[]> query = entityManager.createQuery(hql.toString(), Object[].class);
        query.setParameter("companyId", companyId);
        query.setParameter("finance", ApprovalStatus.FINANCE_APPROVED);
        query.setParameter("paid", ApprovalStatus.PAID);
        setFilterParameters(query, filter);

        List<Object[]> results = query.getResultList();
        List<VehicleExpenseReportResponse> responses = new ArrayList<>();
        for (Object[] row : results) {
            UUID vehicleId = (UUID) row[0];
            String vehicleNumber = (String) row[1];
            long count = ((Number) row[2]).longValue();
            BigDecimal amount = (BigDecimal) row[3];
            BigDecimal fuelAmount = (BigDecimal) row[4];
            BigDecimal maintAmount = (BigDecimal) row[5];

            VehicleExpenseReportResponse dto = VehicleExpenseReportResponse.builder()
                    .vehicleId(vehicleId)
                    .vehicleNumber(vehicleNumber)
                    .voucherCount(count)
                    .totalAmount(amount != null ? amount : BigDecimal.ZERO)
                    .fuelAmount(fuelAmount != null ? fuelAmount : BigDecimal.ZERO)
                    .maintenanceAmount(maintAmount != null ? maintAmount : BigDecimal.ZERO)
                    .build();
            responses.add(dto);
        }
        return responses;
    }

    public List<SalesOrderDcExpenseReportResponse> getSalesOrderDcExpenses(UUID companyId, ExpenseReportFilterRequest filter) {
        StringBuilder hql = new StringBuilder(
                "SELECT r.salesOrderId, r.deliveryChallanId, c.employeeId, c.employeeName, r.vehicleId, r.vehicleNumber, " +
                "COUNT(DISTINCT c.id), SUM(c.claimAmount) " +
                "FROM ExpenseClaim c " +
                "JOIN ExpenseRequest r ON c.expenseRequestId = r.id " +
                "WHERE c.company.id = :companyId AND c.isDeleted = false " +
                "AND (r.salesOrderId IS NOT NULL OR r.deliveryChallanId IS NOT NULL) " +
                "AND c.status IN (:finance, :paid) "
        );
        appendFilters(hql, filter, "c", false);
        if (filter != null && filter.getSalesOrderId() != null) {
            hql.append(" AND r.salesOrderId = :soId ");
        }
        if (filter != null && filter.getDeliveryChallanId() != null) {
            hql.append(" AND r.deliveryChallanId = :dcId ");
        }
        
        hql.append(" GROUP BY r.salesOrderId, r.deliveryChallanId, c.employeeId, c.employeeName, r.vehicleId, r.vehicleNumber");

        TypedQuery<Object[]> query = entityManager.createQuery(hql.toString(), Object[].class);
        query.setParameter("companyId", companyId);
        query.setParameter("finance", ApprovalStatus.FINANCE_APPROVED);
        query.setParameter("paid", ApprovalStatus.PAID);
        setFilterParameters(query, filter);
        if (filter != null && filter.getSalesOrderId() != null) {
            query.setParameter("soId", filter.getSalesOrderId());
        }
        if (filter != null && filter.getDeliveryChallanId() != null) {
            query.setParameter("dcId", filter.getDeliveryChallanId());
        }

        List<Object[]> results = query.getResultList();
        List<SalesOrderDcExpenseReportResponse> responses = new ArrayList<>();
        for (Object[] row : results) {
            UUID soId = (UUID) row[0];
            UUID dcId = (UUID) row[1];
            UUID empId = (UUID) row[2];
            String empName = (String) row[3];
            UUID vId = (UUID) row[4];
            String vNum = (String) row[5];
            long count = ((Number) row[6]).longValue();
            BigDecimal amount = (BigDecimal) row[7];

            SalesOrderDcExpenseReportResponse dto = SalesOrderDcExpenseReportResponse.builder()
                    .salesOrderId(soId)
                    .deliveryChallanId(dcId)
                    .employeeId(empId)
                    .employeeName(empName)
                    .vehicleId(vId)
                    .vehicleNumber(vNum)
                    .voucherCount(count)
                    .totalAmount(amount != null ? amount : BigDecimal.ZERO)
                    .build();
            responses.add(dto);
        }
        return responses;
    }

    private void appendFilters(StringBuilder hql, ExpenseReportFilterRequest filter, String claimAlias, boolean isRequestEntity) {
        if (filter == null) return;
        
        String dateField = isRequestEntity ? "requestDate" : "claimDate";
        String empField = isRequestEntity ? "employeeDriverId" : "employeeId";
        
        if (filter.getDateFrom() != null) {
            hql.append(" AND ").append(claimAlias).append(".").append(dateField).append(" >= :dateFrom ");
        }
        if (filter.getDateTo() != null) {
            hql.append(" AND ").append(claimAlias).append(".").append(dateField).append(" <= :dateTo ");
        }
        if (filter.getEmployeeId() != null) {
            hql.append(" AND ").append(claimAlias).append(".").append(empField).append(" = :empId ");
        }
        // Vehicle/SO/DC filters might not apply universally if we don't join ExpenseRequest, 
        // but for now we only filter them if present in the specific method or if we do an EXISTS clause.
    }

    private void setFilterParameters(TypedQuery<?> query, ExpenseReportFilterRequest filter) {
        if (filter == null) return;
        
        if (filter.getDateFrom() != null) {
            query.setParameter("dateFrom", filter.getDateFrom());
        }
        if (filter.getDateTo() != null) {
            query.setParameter("dateTo", filter.getDateTo());
        }
        if (filter.getEmployeeId() != null) {
            query.setParameter("empId", filter.getEmployeeId());
        }
    }
}
