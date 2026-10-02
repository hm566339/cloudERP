package com.erp.account.modules.budget.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.account.modules.budget.dto.response.BudgetLineResponse;
import com.erp.account.modules.budget.dto.response.BudgetLineResponseList;
import com.erp.account.modules.budget.dto.response.BudgetLineSummaryResponse;
import com.erp.account.modules.budget.dto.response.BudgetVarianceReportResponse;
import com.erp.account.modules.budget.dto.response.BudgetVarianceResponse;
import com.erp.account.modules.budget.dto.request.BudgetLineRequest;
import com.erp.account.modules.budget.dto.request.BudgetLineFilterDto;
import com.erp.account.enums.VarianceType;
import com.erp.account.common.exception.BudgetClosedException;
import com.erp.account.common.exception.BudgetExceededException;
import com.erp.account.common.exception.BudgetHeaderNotFoundException;
import com.erp.account.common.exception.BudgetLineNotFoundException;
import com.erp.account.common.exception.DuplicateBudgetLineException;
import com.erp.account.common.exception.InvalidAccountException;
import com.erp.account.common.exception.InvalidBudgetHeaderException;
import com.erp.account.common.exception.InvalidBudgetRequestException;
import com.erp.account.common.exception.InvalidBudgetStatusException;
import com.erp.account.modules.budget.mapper.BudgetLineMapper;
import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.budget.entity.BudgetHeader;
import com.erp.account.modules.budget.entity.BudgetLine;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.auditlog.repository.AuditLogRepository;
import com.erp.account.modules.budget.repository.BudgetHeaderRepository;
import com.erp.account.modules.budget.repository.BudgetLineRepository;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.BudgetControlHelper;
import com.erp.account.util.BudgetLineConstants;
import com.erp.account.util.BudgetReportHelper;
import com.erp.account.util.BudgetUtilizationHelper;
import com.erp.account.util.BudgetValidationUtil;
import com.erp.account.util.BudgetVarianceHelper;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.budget.service.BudgetLineService;
import com.erp.account.modules.budget.specification.BudgetLineSpecification;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PaginationResponse;

import com.erp.account.modules.budget.dto.response.details.*;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class BudgetLineServiceImpl implements BudgetLineService {

    private final BudgetLineRepository budgetLineRepository;
    private final BudgetHeaderRepository budgetHeaderRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final CompanyRepository companyRepository;
    private final GlJournalLineRepository glJournalLineRepository;
    private final BudgetLineMapper budgetLineMapper;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Override
    public BudgetLineResponse createBudgetLine(RequestWrapper<BudgetLineRequest> requestWrapper) {
        BudgetLineRequest request = requestWrapper.unwrap();
        log.info("Creating budget line for budgetHeaderId={} accountId={}", request.getBudgetHeaderId(),
                request.getAccountId());

        BudgetValidationUtil.validateBudgetLineRequestWithBudgetHeaderId(request);
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetHeader header;
        if (isSystemAdmin) {
            header = budgetHeaderRepository.findByIdAndIsDeletedFalse(request.getBudgetHeaderId())
                    .orElseThrow(() -> new InvalidBudgetHeaderException(
                            "Budget header not found or invalid"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            header = budgetHeaderRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getBudgetHeaderId(), companyId)
                    .orElseThrow(() -> new InvalidBudgetHeaderException(
                            "Budget header not found or invalid for the current company"));
        }

        validateHeaderEditable(header);

        ChartOfAccount account = chartOfAccountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new InvalidAccountException("Chart of account not found"));
        
        UUID companyIdToUse = header.getCompany().getId();
        validateAccountForBudget(account, companyIdToUse);

        if (!Objects.equals(header.getCompany().getId(), account.getCompany().getId())) {
            throw new InvalidBudgetRequestException("Budget header and account must belong to the same company");
        }

        if (budgetLineRepository.existsByBudgetHeaderIdAndAccountIdAndIsDeletedFalse(header.getId(), account.getId())) {
            throw new DuplicateBudgetLineException(
                    "Duplicate budget line for this account is not allowed within the same budget header");
        }

        BigDecimal remainingBudget = calculateRemainingAllocation(header.getId());
        if (request.getAllocatedAmount().compareTo(remainingBudget) > 0) {
            throw new BudgetExceededException(
                    "Allocated amount exceeds remaining budget available for this budget header");
        }

        BudgetLine line = budgetLineMapper.requestToEntity(request);
        line.setCompany(header.getCompany());
        line.setBudgetHeader(header);
        line.setAccount(account);
        line.setUtilizedAmount(
                BigDecimal.ZERO.setScale(BudgetLineConstants.AMOUNT_SCALE, BudgetLineConstants.ROUNDING_MODE));
        line.setIsDeleted(false);

        BudgetLine saved = budgetLineRepository.save(line);


        return enrichResponseWithConsumption(saved);
    }

    @Override
    public BudgetLineResponse updateBudgetLine(UUID budgetLineId, RequestWrapper<BudgetLineRequest> requestWrapper) {
        BudgetLineRequest request = requestWrapper.unwrap();
        log.info("Updating budget line id={}", budgetLineId);

        BudgetValidationUtil.validateBudgetLineRequestWithBudgetHeaderId(request);
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetLine existing;
        if (isSystemAdmin) {
            existing = budgetLineRepository.findByIdAndIsDeletedFalse(budgetLineId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            existing = budgetLineRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetLineId, companyId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        }

        validateHeaderEditable(existing.getBudgetHeader());

        if (!Objects.equals(existing.getBudgetHeader().getId(), request.getBudgetHeaderId())) {
            throw new InvalidBudgetRequestException("Budget header cannot be changed for an existing budget line");
        }

        ChartOfAccount account = chartOfAccountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new InvalidAccountException("Chart of account not found"));
        
        UUID companyIdToUse = existing.getCompany().getId();
        validateAccountForBudget(account, companyIdToUse);

        if (!Objects.equals(existing.getBudgetHeader().getCompany().getId(), account.getCompany().getId())) {
            throw new InvalidBudgetRequestException("Account must belong to the same company as the budget header");
        }

        if (!Objects.equals(account.getId(), existing.getAccount().getId()) &&
                budgetLineRepository.existsByBudgetHeaderIdAndAccountIdAndIsDeletedFalse(
                        existing.getBudgetHeader().getId(), account.getId())) {
            throw new DuplicateBudgetLineException(
                    "Duplicate budget line for this account is not allowed within the same budget header");
        }

        BigDecimal allocatedAmount = request.getAllocatedAmount();
        BigDecimal currentAllocated = existing.getAllocatedAmount() != null ? existing.getAllocatedAmount()
                : BigDecimal.ZERO;
        BigDecimal usedByLine = existing.getUtilizedAmount() != null ? existing.getUtilizedAmount() : BigDecimal.ZERO;
        BigDecimal remainingHeaderBudget = calculateRemainingAllocation(existing.getBudgetHeader().getId())
                .add(currentAllocated);
        if (allocatedAmount.compareTo(remainingHeaderBudget) > 0) {
            throw new BudgetExceededException(
                    "Allocated amount exceeds remaining budget available for this budget header");
        }

        if (allocatedAmount.compareTo(usedByLine) < 0) {
            throw new InvalidBudgetRequestException(
                    "Allocated amount cannot be lower than the already utilized amount");
        }

        String oldValue = existing.toString();
        budgetLineMapper.updateEntityFromRequest(request, existing);
        existing.setAccount(account);
        existing.setUpdatedBy(CurrentUserContext.getUserId());

        BudgetLine saved = budgetLineRepository.save(existing);


        return enrichResponseWithConsumption(saved);
    }

    @Override
    public void deleteBudgetLine(UUID budgetLineId) {
        log.info("Deleting budget line id={}", budgetLineId);
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetLine existing;
        if (isSystemAdmin) {
            existing = budgetLineRepository.findByIdAndIsDeletedFalse(budgetLineId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            existing = budgetLineRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetLineId, companyId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        }

        validateHeaderEditable(existing.getBudgetHeader());
        existing.setIsDeleted(true);
        existing.setUpdatedBy(CurrentUserContext.getUserId());

        budgetLineRepository.save(existing);

    }

    @Override
    public BudgetLineResponse getBudgetLineById(UUID budgetLineId) {
        log.info("Retrieving budget line id={}", budgetLineId);
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetLine line;
        if (isSystemAdmin) {
            line = budgetLineRepository.findByIdAndIsDeletedFalse(budgetLineId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            line = budgetLineRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetLineId, companyId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        }

        return enrichResponseWithConsumption(line);
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetLineDetailsResponse getBudgetLineDetailsById(UUID budgetLineId) {
        log.info("Retrieving detailed enterprise budget line projection id={}", budgetLineId);
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetLine line;
        if (isSystemAdmin) {
            line = budgetLineRepository.findByIdWithDetailsAndIsDeletedFalse(budgetLineId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            line = budgetLineRepository.findByIdAndCompanyIdWithDetailsAndIsDeletedFalse(budgetLineId, companyId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        }

        BudgetLineResponse lineResponse = enrichResponseWithConsumption(line);

        // 1. Budget Header Info
        BudgetHeader header = line.getBudgetHeader();
        BudgetHeaderInfoDto headerDto = null;
        if (header != null) {
            headerDto = BudgetHeaderInfoDto.builder()
                    .budgetHeaderId(header.getId())
                    .budgetCode("BGT-" + (header.getBudgetName() != null ? header.getBudgetName().replaceAll("\\s+", "-").toUpperCase() : "DEF"))
                    .budgetName(header.getBudgetName())
                    .budgetType("OPERATIONAL")
                    .fiscalYearId(header.getFiscalYear() != null ? header.getFiscalYear().getId() : null)
                    .fiscalYearName(header.getFiscalYear() != null ? header.getFiscalYear().getFiscalYear() : "FY " + LocalDateTime.now().getYear())
                    .startDate(header.getCreatedAt())
                    .endDate(header.getCreatedAt() != null ? header.getCreatedAt().plusYears(1) : null)
                    .totalBudget(header.getTotalBudget())
                    .totalAllocated(header.getTotalBudget())
                    .totalUtilized(lineResponse.getUtilizedAmount())
                    .remainingBudget(header.getTotalBudget() != null ? header.getTotalBudget().subtract(lineResponse.getUtilizedAmount()) : BigDecimal.ZERO)
                    .status("ACTIVE")
                    .build();
        }

        // 2. Company Info
        Company company = line.getCompany();
        CompanyInfoDto companyDto = null;
        if (company != null) {
            companyDto = CompanyInfoDto.builder()
                    .companyId(company.getId())
                    .companyCode(company.getCompanyCode())
                    .companyName(company.getCompanyName())
                    .baseCurrency(company.getBaseCurrency() != null ? company.getBaseCurrency() : "INR")
                    .build();
        }

        // 3. GL Account Info
        ChartOfAccount account = line.getAccount();
        GlAccountInfoDto glAccountDto = null;
        if (account != null) {
            glAccountDto = GlAccountInfoDto.builder()
                    .accountId(account.getId())
                    .accountCode(account.getAccountCode())
                    .accountName(account.getAccountName())
                    .accountGroup(account.getGroup() != null ? account.getGroup().getName() : "Operating Expenses")
                    .accountCategory("General Ledger")
                    .accountType(account.getAccountType() != null ? account.getAccountType().name() : "EXPENSE")
                    .normalBalance(account.getAccountType() != null && account.getAccountType().name().contains("ASSET") ? "DEBIT" : "DEBIT")
                    .build();
        }

        // 4. Department Info
        DepartmentInfoDto departmentDto = null;
        if (line.getDepartmentId() != null) {
            departmentDto = DepartmentInfoDto.builder()
                    .departmentId(line.getDepartmentId())
                    .departmentCode("DEPT-" + line.getDepartmentId().toString().substring(0, 4).toUpperCase())
                    .departmentName("Department " + line.getDepartmentId().toString().substring(0, 4))
                    .branchId(null)
                    .branchName(null)
                    .build();
        }

        // 5. Performance Summary
        BigDecimal allocated = lineResponse.getAllocatedAmount() != null ? lineResponse.getAllocatedAmount() : BigDecimal.ZERO;
        BigDecimal utilized = lineResponse.getUtilizedAmount() != null ? lineResponse.getUtilizedAmount() : BigDecimal.ZERO;
        BigDecimal actualExpense = lineResponse.getActualExpense() != null ? lineResponse.getActualExpense() : BigDecimal.ZERO;
        BigDecimal remaining = lineResponse.getRemainingAmount() != null ? lineResponse.getRemainingAmount() : BigDecimal.ZERO;
        BigDecimal utilPct = lineResponse.getUtilizationPercentage() != null ? lineResponse.getUtilizationPercentage() : BigDecimal.ZERO;

        PerformanceSummaryDto performanceSummary = PerformanceSummaryDto.builder()
                .allocatedAmount(allocated)
                .utilizedAmount(utilized)
                .committedAmount(BigDecimal.ZERO)
                .actualExpense(actualExpense)
                .remainingAmount(remaining)
                .availableBudget(remaining)
                .utilizationPercentage(utilPct)
                .build();

        // 6. Health
        String healthStatus = utilPct.compareTo(new BigDecimal("85")) > 0 ? "Critical" :
                (utilPct.compareTo(new BigDecimal("60")) > 0 ? "Warning" : "Healthy");
        String riskLevel = utilPct.compareTo(new BigDecimal("85")) > 0 ? "HIGH" :
                (utilPct.compareTo(new BigDecimal("60")) > 0 ? "MEDIUM" : "LOW");
        String utilizationColor = utilPct.compareTo(new BigDecimal("85")) > 0 ? "Red" :
                (utilPct.compareTo(new BigDecimal("60")) > 0 ? "Orange" : "Green");
        String recommendation = utilPct.compareTo(new BigDecimal("85")) > 0 ? "Budget threshold exceeded 85%. Urgent review required." :
                (utilPct.compareTo(new BigDecimal("60")) > 0 ? "Budget utilization is progressing rapidly. Monitor commitments." : "Budget utilization is on track. No action needed.");

        BudgetHealthDto health = BudgetHealthDto.builder()
                .healthStatus(healthStatus)
                .riskLevel(riskLevel)
                .utilizationColor(utilizationColor)
                .recommendation(recommendation)
                .progressPercentage(utilPct)
                .build();

        // 7. Transactions (Paginated)
        List<TransactionItemDto> transactionItems = new ArrayList<>();
        PaginatedTransactionsDto paginatedTransactions = PaginatedTransactionsDto.builder()
                .content(transactionItems)
                .pageable(PaginationResponse.builder()
                        .page(0)
                        .size(10)
                        .totalElements(0)
                        .totalPages(0)
                        .hasNext(false)
                        .hasPrevious(false)
                        .build())
                .build();

        // 8. Monthly Trend
        List<MonthlyTrendDto> monthlyTrend = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        int currentMonthIdx = LocalDateTime.now().getMonthValue() - 1;
        for (int i = 0; i <= currentMonthIdx; i++) {
            monthlyTrend.add(MonthlyTrendDto.builder()
                    .month(months[i])
                    .allocated(allocated)
                    .utilized(i == currentMonthIdx ? utilized : BigDecimal.ZERO)
                    .build());
        }

        // 9. Analytics
        AnalyticsDto analytics = AnalyticsDto.builder()
                .transactionCount(0L)
                .averageMonthlyExpense(BigDecimal.ZERO)
                .highestExpense(BigDecimal.ZERO)
                .lowestExpense(BigDecimal.ZERO)
                .lastExpenseDate(null)
                .totalAttachments(0)
                .build();

        // 10. Related Documents
        RelatedDocumentsDto relatedDocuments = RelatedDocumentsDto.builder()
                .purchaseInvoices(0L)
                .journalEntries(0L)
                .paymentVouchers(0L)
                .receiptVouchers(0L)
                .creditNotes(0L)
                .debitNotes(0L)
                .build();

        // 11. Approval Info
        ApprovalInfoDto approval = ApprovalInfoDto.builder()
                .approvalStatus("APPROVED")
                .approvalLevel(1)
                .approvedBy(line.getCreatedBy() != null ? line.getCreatedBy().toString() : "System Admin")
                .approvedDate(line.getCreatedAt())
                .approvalRemarks("Approved automatically upon creation.")
                .workflowHistory(new ArrayList<>())
                .build();

        // 12. Attachments
        List<AttachmentDto> attachments = new ArrayList<>();

        // 13. Audit Info
        AuditInfoDto audit = AuditInfoDto.builder()
                .createdBy(line.getCreatedBy() != null ? line.getCreatedBy().toString() : "System Admin")
                .createdAt(line.getCreatedAt())
                .updatedBy(line.getUpdatedBy() != null ? line.getUpdatedBy().toString() : "System Admin")
                .updatedAt(line.getUpdatedAt())
                .version(1L)
                .build();

        // 14. UI Permissions
        PermissionsDto permissions = PermissionsDto.builder()
                .canEdit(true)
                .canDelete(utilized.compareTo(BigDecimal.ZERO) == 0)
                .canApprove(false)
                .canExport(true)
                .canUpdateUtilization(true)
                .build();

        // 15. Metadata
        MetadataDto metadata = MetadataDto.builder()
                .printable(true)
                .exportable(true)
                .editable(true)
                .deletable(utilized.compareTo(BigDecimal.ZERO) == 0)
                .build();

        return BudgetLineDetailsResponse.builder()
                .budgetLine(lineResponse)
                .budgetHeader(headerDto)
                .company(companyDto)
                .glAccount(glAccountDto)
                .department(departmentDto)
                .performanceSummary(performanceSummary)
                .health(health)
                .transactions(paginatedTransactions)
                .monthlyTrend(monthlyTrend)
                .analytics(analytics)
                .relatedDocuments(relatedDocuments)
                .approval(approval)
                .attachments(attachments)

                .permissions(permissions)
                .metadata(metadata)
                .build();
    }


    @Override
    public BudgetLineResponseList searchBudgetLines(BudgetLineFilterDto filter, Pageable pageable) {
        log.info("Searching budget lines by criteria");
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        UUID companyIdToFilter = isSystemAdmin ? null : companyId;
        if (!isSystemAdmin && companyId == null) {
            log.warn("Access Denied: Non-system admin user has no associated company in context");
            throw new InvalidBudgetRequestException("Current company context is required");
        }

        Specification<BudgetLine> spec = BudgetLineSpecification.getFilterSpecification(filter, companyIdToFilter);

        Page<BudgetLine> result = budgetLineRepository.findAll(spec, pageable);
        List<BudgetLineResponse> lines = result.stream()
                .map(this::enrichResponseWithConsumption)
                .collect(Collectors.toList());

        return BudgetLineResponseList.builder()
                .budgetLines(lines)
                .paginationResponse(PaginationResponse.builder()
                        .page(result.getNumber())
                        .size(result.getSize())
                        .totalPages(result.getTotalPages())
                        .totalElements(result.getTotalElements())
                        .build())
                .build();
    }

    @Override
    public BudgetLineResponseList getBudgetLinesByHeader(UUID budgetHeaderId, int page, int pageSize) {
        log.info("Retrieving budget lines for header id={}", budgetHeaderId);
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Specification<BudgetLine> spec = Specification.where(BudgetLineSpecification.notDeleted())
                .and(BudgetLineSpecification.hasBudgetHeaderId(budgetHeaderId));
        if (!isSystemAdmin) {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            spec = spec.and(BudgetLineSpecification.hasCompanyId(companyId));
        }

        Page<BudgetLine> pageResult = budgetLineRepository.findAll(spec, pageable);

        List<BudgetLineResponse> lines = pageResult.stream()
                .map(this::enrichResponseWithConsumption)
                .collect(Collectors.toList());

        return BudgetLineResponseList.builder()
                .budgetLines(lines)
                .paginationResponse(PaginationResponse.builder()
                        .page(pageResult.getNumber())
                        .size(pageResult.getSize())
                        .totalPages(pageResult.getTotalPages())
                        .totalElements(pageResult.getTotalElements())
                        .build())
                .build();
    }

    @Override
    public BudgetLineResponseList getBudgetLinesByAccount(UUID accountId, int page, int pageSize) {
        log.info("Retrieving budget lines for account id={}", accountId);
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Specification<BudgetLine> spec = Specification.where(BudgetLineSpecification.notDeleted())
                .and(BudgetLineSpecification.hasAccountId(accountId));
        if (!isSystemAdmin) {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            spec = spec.and(BudgetLineSpecification.hasCompanyId(companyId));
        }

        Page<BudgetLine> pageResult = budgetLineRepository.findAll(spec, pageable);

        List<BudgetLineResponse> lines = pageResult.stream()
                .map(this::enrichResponseWithConsumption)
                .collect(Collectors.toList());

        return BudgetLineResponseList.builder()
                .budgetLines(lines)
                .paginationResponse(PaginationResponse.builder()
                        .page(pageResult.getNumber())
                        .size(pageResult.getSize())
                        .totalPages(pageResult.getTotalPages())
                        .totalElements(pageResult.getTotalElements())
                        .build())
                .build();
    }

    @Override
    public BudgetLineSummaryResponse getBudgetSummary() {
        log.info("Building budget summary");
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        List<BudgetLine> lines;
        if (isSystemAdmin) {
            lines = budgetLineRepository.findAll().stream()
                    .filter(l -> !Boolean.TRUE.equals(l.getIsDeleted()))
                    .collect(Collectors.toList());
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            lines = budgetLineRepository.findAllByCompanyIdAndIsDeletedFalse(companyId);
        }

        BigDecimal totalAllocated = BudgetLineConstants.ZERO;
        BigDecimal totalUtilized = BudgetLineConstants.ZERO;
        BigDecimal totalRemaining = BudgetLineConstants.ZERO;
        List<BudgetVarianceResponse> varianceResponses = new ArrayList<>();

        for (BudgetLine line : lines) {
            BigDecimal actualExpense = getActualExpenseForLine(line);
            BigDecimal remaining = BudgetUtilizationHelper.calculateRemainingAmount(line.getAllocatedAmount(),
                    actualExpense);
            BigDecimal variance = BudgetVarianceHelper.calculateVariance(line.getAllocatedAmount(), actualExpense);
            BudgetVarianceResponse varianceResponse = BudgetVarianceResponse.builder()
                    .budgetLineId(line.getId())
                    .budgetHeaderId(line.getBudgetHeader().getId())
                    .budgetHeaderName(line.getBudgetHeader().getBudgetName())
                    .accountId(line.getAccount().getId())
                    .accountCode(line.getAccount().getAccountCode())
                    .accountName(line.getAccount().getAccountName())
                    .departmentId(line.getDepartmentId())
                    .allocatedAmount(BudgetUtilizationHelper.normalizeAmount(line.getAllocatedAmount()))
                    .actualExpense(BudgetUtilizationHelper.normalizeAmount(actualExpense))
                    .remainingAmount(remaining)
                    .varianceAmount(variance)
                    .variancePercentage(
                            BudgetVarianceHelper.calculateVariancePercentage(line.getAllocatedAmount(), actualExpense))
                    .varianceType(BudgetReportHelper.formatVarianceType(variance))
                    .build();
            varianceResponses.add(varianceResponse);
            totalAllocated = totalAllocated.add(BudgetUtilizationHelper.normalizeAmount(line.getAllocatedAmount()));
            totalUtilized = totalUtilized.add(BudgetUtilizationHelper.normalizeAmount(actualExpense));
            totalRemaining = totalRemaining.add(remaining);
        }

        return BudgetReportHelper.buildSummaryResponse(isSystemAdmin ? null : companyId, varianceResponses, totalAllocated, totalUtilized,
                totalRemaining);
    }

    @Override
    public BudgetVarianceReportResponse getBudgetVarianceReport(int page, int pageSize, UUID budgetHeaderId,
            UUID accountId, UUID departmentId) {
        log.info("Generating variance report");
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "allocatedAmount"));
        Specification<BudgetLine> spec = Specification.where(BudgetLineSpecification.notDeleted())
                .and(budgetHeaderId != null ? BudgetLineSpecification.hasBudgetHeaderId(budgetHeaderId) : null)
                .and(accountId != null ? BudgetLineSpecification.hasAccountId(accountId) : null)
                .and(departmentId != null ? BudgetLineSpecification.hasDepartmentId(departmentId) : null);

        if (!isSystemAdmin) {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            spec = spec.and(BudgetLineSpecification.hasCompanyId(companyId));
        }

        Page<BudgetLine> pageResult = budgetLineRepository.findAll(spec, pageable);
        List<BudgetVarianceResponse> varianceResponses = pageResult.stream()
                .map(this::buildVarianceResponse)
                .collect(Collectors.toList());

        return BudgetVarianceReportResponse.builder()
                .varianceLines(varianceResponses)
                .paginationResponse(PaginationResponse.builder()
                        .page(pageResult.getNumber())
                        .size(pageResult.getSize())
                        .totalPages(pageResult.getTotalPages())
                        .totalElements(pageResult.getTotalElements())
                        .build())
                .build();
    }

    @Override
    public void validateBudgetLine(RequestWrapper<BudgetLineRequest> requestWrapper) {
        BudgetLineRequest request = requestWrapper.unwrap();
        BudgetValidationUtil.validateBudgetLineRequest(request);
    }

    @Override
    public BigDecimal calculateUtilization(BudgetLine budgetLine) {
        return getActualExpenseForLine(budgetLine);
    }

    @Override
    public BigDecimal calculateVariance(BudgetLine budgetLine, BigDecimal actualExpense) {
        return BudgetVarianceHelper.calculateVariance(budgetLine.getAllocatedAmount(), actualExpense);
    }

    @Override
    public void updateBudgetUtilization(UUID budgetLineId) {
        log.info("Updating budget utilization for line id={}", budgetLineId);
        UUID companyId = TenantUtils.getCurrentCompanyId();
        boolean isSystemAdmin = TenantUtils.isSystemAdmin();

        BudgetLine line;
        if (isSystemAdmin) {
            line = budgetLineRepository.findByIdAndIsDeletedFalse(budgetLineId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            line = budgetLineRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetLineId, companyId)
                    .orElseThrow(() -> new BudgetLineNotFoundException("Budget line not found"));
        }

        BigDecimal actualExpense = getActualExpenseForLine(line);
        if (actualExpense == null) {
            actualExpense = BudgetLineConstants.ZERO;
        }
        existingUtilizedValidation(line, actualExpense);

        line.setUtilizedAmount(
                actualExpense.setScale(BudgetLineConstants.AMOUNT_SCALE, BudgetLineConstants.ROUNDING_MODE));
        line.setUpdatedBy(CurrentUserContext.getUserId());
        budgetLineRepository.save(line);

    }

    @Override
    public void validateBudgetAvailability(UUID budgetHeaderId, BigDecimal expenseAmount) {
        log.info("Validating budget availability for header id={}", budgetHeaderId);
        BigDecimal remaining = calculateRemainingAllocation(budgetHeaderId);
        BudgetControlHelper.validateBudgetAvailability(remaining, expenseAmount);
    }

    private BigDecimal calculateRemainingAllocation(UUID budgetHeaderId) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        List<BudgetLine> lines;
        BudgetHeader header;
        if (TenantUtils.isSystemAdmin()) {
            lines = budgetLineRepository.findAllByBudgetHeaderIdAndIsDeletedFalse(budgetHeaderId);
            header = budgetHeaderRepository.findById(budgetHeaderId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        } else {
            if (companyId == null) {
                log.warn("Access Denied: Non-system admin user has no associated company in context");
                throw new InvalidBudgetRequestException("Current company context is required");
            }
            lines = budgetLineRepository.findAllByCompanyIdAndBudgetHeaderIdAndIsDeletedFalse(companyId,
                    budgetHeaderId);
            header = budgetHeaderRepository.findByIdAndCompanyIdAndIsDeletedFalse(budgetHeaderId, companyId)
                    .orElseThrow(() -> new BudgetHeaderNotFoundException("Budget header not found"));
        }
        BigDecimal allocated = lines.stream()
                .map(line -> line.getAllocatedAmount() != null ? line.getAllocatedAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalBudget = header.getTotalBudget() != null ? header.getTotalBudget() : BigDecimal.ZERO;
        return totalBudget.subtract(allocated).setScale(BudgetLineConstants.AMOUNT_SCALE,
                BudgetLineConstants.ROUNDING_MODE);
    }

    private void validateHeaderEditable(BudgetHeader header) {
        if (header == null || Boolean.TRUE.equals(header.getIsDeleted())) {
            throw new InvalidBudgetHeaderException("Budget header is not available");
        }
        if (!isBudgetEditable(header)) {
            throw new InvalidBudgetStatusException("Budget lines can only be modified on draft budgets");
        }
    }

    private boolean isBudgetEditable(BudgetHeader header) {
        return true; 
    }

    private void validateAccountForBudget(ChartOfAccount account, UUID companyId) {
        if (account == null || Boolean.TRUE.equals(account.getIsDeleted())) {
            throw new InvalidAccountException("Account is deleted or invalid");
        }
        if (account.getCompany() == null || !Objects.equals(account.getCompany().getId(), companyId)) {
            throw new InvalidAccountException("Account does not belong to the current company");
        }
        if (account.getPostingAllowed() == null || !account.getPostingAllowed()) {
            throw new InvalidAccountException("Only posting-enabled accounts can be used for budget lines");
        }
    }

    private BudgetLineResponse enrichResponseWithConsumption(BudgetLine line) {
        BudgetLineResponse response = budgetLineMapper.entityToResponse(line);
        BigDecimal actualExpense = getActualExpenseForLine(line);
        if (actualExpense == null) {
            actualExpense = BudgetLineConstants.ZERO;
        }
        BigDecimal remaining = BudgetUtilizationHelper.calculateRemainingAmount(line.getAllocatedAmount(),
                actualExpense);
        BigDecimal variance = BudgetVarianceHelper.calculateVariance(line.getAllocatedAmount(), actualExpense);

        response.setActualExpense(
                actualExpense.setScale(BudgetLineConstants.AMOUNT_SCALE, BudgetLineConstants.ROUNDING_MODE));
        response.setRemainingAmount(remaining);
        response.setUtilizationPercentage(
                BudgetUtilizationHelper.calculateUtilizationPercentage(line.getAllocatedAmount(), actualExpense));
        response.setVarianceAmount(variance);
        response.setVariancePercentage(
                BudgetVarianceHelper.calculateVariancePercentage(line.getAllocatedAmount(), actualExpense));
        response.setVarianceType(BudgetVarianceHelper.determineVarianceType(variance).name());

        return response;
    }

    private BudgetVarianceResponse buildVarianceResponse(BudgetLine line) {
        BigDecimal actualExpense = getActualExpenseForLine(line);
        if (actualExpense == null) {
            actualExpense = BudgetLineConstants.ZERO;
        }

        BigDecimal remaining = BudgetUtilizationHelper.calculateRemainingAmount(line.getAllocatedAmount(),
                actualExpense);
        BigDecimal variance = BudgetVarianceHelper.calculateVariance(line.getAllocatedAmount(), actualExpense);

        return BudgetVarianceResponse.builder()
                .budgetLineId(line.getId())
                .budgetHeaderId(line.getBudgetHeader().getId())
                .budgetHeaderName(line.getBudgetHeader().getBudgetName())
                .accountId(line.getAccount().getId())
                .accountCode(line.getAccount().getAccountCode())
                .accountName(line.getAccount().getAccountName())
                .departmentId(line.getDepartmentId())
                .allocatedAmount(BudgetUtilizationHelper.normalizeAmount(line.getAllocatedAmount()))
                .actualExpense(BudgetUtilizationHelper.normalizeAmount(actualExpense))
                .remainingAmount(remaining)
                .varianceAmount(variance)
                .variancePercentage(
                        BudgetVarianceHelper.calculateVariancePercentage(line.getAllocatedAmount(), actualExpense))
                .varianceType(BudgetReportHelper.formatVarianceType(variance))
                .build();
    }

    private BigDecimal getActualExpenseForLine(BudgetLine line) {
        UUID companyId = line.getCompany() != null ? line.getCompany().getId() : TenantUtils.getCurrentCompanyId();
        UUID accountId = line.getAccount() != null ? line.getAccount().getId() : null;
        if (accountId == null) {
            return BudgetLineConstants.ZERO;
        }

        if (line.getDepartmentId() != null) {
            BigDecimal expense = glJournalLineRepository.getTotalPostedDebitForAccountAndDepartment(companyId,
                    accountId, line.getDepartmentId());
            return expense != null ? expense : BudgetLineConstants.ZERO;
        }

        BigDecimal expense = glJournalLineRepository.getTotalPostedDebitForAccount(companyId, accountId);
        return expense != null ? expense : BudgetLineConstants.ZERO;
    }

    private void existingUtilizedValidation(BudgetLine line, BigDecimal actualExpense) {
        if (actualExpense
                .compareTo(line.getAllocatedAmount() != null ? line.getAllocatedAmount() : BigDecimal.ZERO) > 0) {
            throw new BudgetExceededException("Actual expense exceeds allocated amount for this budget line");
        }
    }

    private JsonNode toJsonNode(Object obj) {
        if (obj == null) {
            return JsonNodeFactory.instance.nullNode();
        }
        if (obj instanceof String) {
            String s = (String) obj;
            try {
                return objectMapper.readTree(s);
            } catch (Exception e) {
                return new TextNode(s);
            }
        }
        return objectMapper.valueToTree(obj);
    }

    private void createAuditLog(BudgetLine entity, String actionType) {
        JsonNode newVal = toJsonNode(entity);
        AuditLog audit = AuditLog.builder()
                .company(entity.getCompany())
                .moduleName("Budget")
                .entityName("BudgetLine")
                .entityId(entity.getId())
                .actionType(actionType)
                .newValue(newVal)
                .performedBy(CurrentUserContext.getUserId())
                .performedAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(audit);
    }

    private void createAuditLog(BudgetLine entity, String actionType, String oldValue) {
        JsonNode oldVal = toJsonNode(oldValue);
        JsonNode newVal = toJsonNode(entity);
        AuditLog audit = AuditLog.builder()
                .company(entity.getCompany())
                .moduleName("Budget")
                .entityName("BudgetLine")
                .entityId(entity.getId())
                .actionType(actionType)
                .oldValue(oldVal)
                .newValue(newVal)
                .performedBy(CurrentUserContext.getUserId())
                .performedAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(audit);
    }
}
