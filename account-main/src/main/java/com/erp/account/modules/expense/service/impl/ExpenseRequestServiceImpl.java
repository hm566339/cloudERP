package com.erp.account.modules.expense.service.impl;

import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanRepository;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.mapper.ExpenseRequestMapper;
import com.erp.account.modules.expense.repository.ExpenseClaimRepository;
import com.erp.account.modules.expense.repository.ExpenseCategoryRepository;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.expense.service.ExpenseRequestService;
import com.erp.account.modules.expense.specification.ExpenseRequestSpecification;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseRequestServiceImpl implements ExpenseRequestService {

    private final ExpenseRequestRepository expenseRequestRepository;
    private final ExpenseClaimRepository expenseClaimRepository;
    private final ExpenseCategoryRepository expenseCategoryRepository;
    private final CompanyRepository companyRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final DeliveryChallanRepository deliveryChallanRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final ExpenseRequestMapper expenseRequestMapper;
    private final AuditLogService auditLogService;
    private final WorkflowClient workflowClient;

    @Override
    @Transactional
    public ExpenseRequestResponse createExpenseRequest(UUID requestCompanyId, ExpenseRequestCreateRequest request) {
        log.info("Creating Expense Request for company: {}", requestCompanyId);

        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        UUID requesterId = TenantUtils.getCurrentUserId();
        if (requesterId == null) {
            throw new UnauthorizedException("User session not found or unauthenticated.");
        }

        validateCreateRequest(request, companyId);

        ExpenseCategory category = expenseCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense Category not found with id: " + request.getCategoryId()));

        if (!companyId.equals(category.getCompany().getId())) {
            throw new ValidationException("Expense category belongs to a different company.");
        }

        if (Boolean.TRUE.equals(category.getIsDeleted())) {
            throw new ValidationException("Expense category is inactive or deleted.");
        }

        validateOperationalLinks(companyId, request.getSalesOrderId(), request.getDeliveryChallanId());

        LocalDate requestDate = request.getDate() != null ? request.getDate() : LocalDate.now();
        String requestNumber = voucherSequenceService.generateNextExpenseRequestNumber(companyId, requestDate);

        BigDecimal advanceAmount = null;
        if (Boolean.TRUE.equals(request.getRequiresAdvance())) {
            advanceAmount = request.getAdvanceAmount() != null ? request.getAdvanceAmount() : request.getRequestedAmount();
        }

        String employeeName = request.getEmployeeName();
        if ((employeeName == null || employeeName.isBlank()) && CurrentUserContext.getUserFullName() != null) {
            if (request.getEmployeeDriverId() != null && request.getEmployeeDriverId().equals(CurrentUserContext.getUserId())) {
                employeeName = CurrentUserContext.getUserFullName();
            }
        }

        ExpenseRequest entity = ExpenseRequest.builder()
                .company(company)
                .requestNumber(requestNumber)
                .requestType(request.getRequestType())
                .requestDate(requestDate)
                .requesterId(requesterId)
                .employeeDriverId(request.getEmployeeDriverId())
                .employeeName(employeeName)
                .roleType(request.getRoleType())
                .expenseCategory(category)
                .requestedAmount(request.getRequestedAmount())
                .purposeDescription(request.getPurposeDescription())
                .additionalNotes(request.getAdditionalNotes())
                .status(ExpenseRequestStatus.DRAFT)
                .approvalStatus(ExpenseRequestStatus.DRAFT)
                .requiresAdvance(Boolean.TRUE.equals(request.getRequiresAdvance()))
                .advanceAmount(advanceAmount)
                .salesOrderId(request.getSalesOrderId())
                .deliveryChallanId(request.getDeliveryChallanId())
                .vehicleId(request.getVehicleId())
                .vehicleNumber(request.getVehicleNumber())
                .build();

        // ── Auto-Approval on Create for authorized roles ──
        boolean isAutoApprove = isAutoApproveRole();
        boolean isOwnerSelfApprove = isCeoOrOwner();

        if (isAutoApprove || isOwnerSelfApprove) {
            entity.setStatus(ExpenseRequestStatus.APPROVED);
            entity.setApprovalStatus(ExpenseRequestStatus.APPROVED);
            entity.setApprovedAmount(entity.getRequestedAmount());
            entity.setApprovedBy(requesterId);
            entity.setApprovedAt(LocalDateTime.now());

            if (isAutoApprove) {
                String existingNotes = entity.getAdditionalNotes() != null ? entity.getAdditionalNotes() + "\n" : "";
                entity.setAdditionalNotes(existingNotes + "Automatically approved based on user role.");
            }

            log.info("Auto-Approval on CREATE -> userId={}, roles={}, matchedAutoApproval={}, request={}, requestedAmount={}, finalStatus=APPROVED",
                     requesterId,
                     SecurityContextHolder.getContext().getAuthentication() != null
                         ? SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                         : "[]",
                     isAutoApprove ? "Role-Based" : "CEO/Owner",
                     requestNumber,
                     request.getRequestedAmount());
        } else {
            log.info("No auto-approval role on CREATE -> userId={}, roles={}, request={}, finalStatus=DRAFT",
                     requesterId,
                     SecurityContextHolder.getContext().getAuthentication() != null
                         ? SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                         : "[]",
                     requestNumber);
        }

        ExpenseRequest saved = expenseRequestRepository.save(entity);
        log.info("Expense Request created with ID: {} and number: {}, status: {}, approvalStatus: {}",
                 saved.getId(), saved.getRequestNumber(), saved.getStatus(), saved.getApprovalStatus());

        // Record audit for auto-approved creates
        if (isAutoApprove) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : "system";
            AuditLog auditLog = AuditLog.builder()
                    .company(entity.getCompany())
                    .moduleName("EXPENSE")
                    .entityName("ExpenseRequest")
                    .entityId(saved.getId())
                    .actionType("AUTO_APPROVED")
                    .performedBy(requesterId)
                    .performedByUsername(username)
                    .performedAt(LocalDateTime.now())
                    .build();
            try {
                auditLogService.recordAudit(auditLog);
            } catch (Exception e) {
                log.warn("Failed to record AUTO_APPROVED audit log for Expense Request {}", saved.getId(), e);
            }
        }

        return enrichWithRemainingAmount(expenseRequestMapper.entityToResponse(saved), saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseRequestResponse getExpenseRequestById(UUID requestCompanyId, UUID id) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        ExpenseRequest entity = expenseRequestRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Request not found with id: " + id));
        ExpenseRequestResponse response = expenseRequestMapper.entityToResponse(entity);
        return enrichWithRemainingAmount(response, entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExpenseRequestResponse> getAllExpenseRequests(UUID requestCompanyId, ExpenseRequestFilterDto filter, Pageable pageable) {
        UUID companyId = TenantUtils.resolveCompanyIdForQuery(requestCompanyId);
        Specification<ExpenseRequest> spec = ExpenseRequestSpecification.getFilterSpecification(filter, companyId);
        Page<ExpenseRequest> page = expenseRequestRepository.findAll(spec, pageable);

        List<UUID> requestIds = page.getContent().stream().map(ExpenseRequest::getId).toList();
        Map<UUID, BigDecimal> usedMap = new HashMap<>();
        if (!requestIds.isEmpty()) {
            List<Object[]> usedList = expenseClaimRepository.sumClaimAmountsByExpenseRequestIds(requestIds);
            if (usedList != null) {
                for (Object[] row : usedList) {
                    if (row != null && row.length >= 2 && row[0] != null) {
                        usedMap.put((UUID) row[0], row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO);
                    }
                }
            }
        }

        return page.map(entity -> {
            ExpenseRequestResponse dto = expenseRequestMapper.entityToResponse(entity);
            BigDecimal approved = entity.getApprovedAmount() != null ? entity.getApprovedAmount() : (entity.getRequestedAmount() != null ? entity.getRequestedAmount() : BigDecimal.ZERO);
            BigDecimal used = usedMap.getOrDefault(entity.getId(), BigDecimal.ZERO);
            BigDecimal remaining = approved.subtract(used);
            if (remaining.compareTo(BigDecimal.ZERO) < 0) {
                remaining = BigDecimal.ZERO;
            }
            dto.setUsedAmount(used);
            dto.setRemainingAmount(remaining);
            if (entity.getEmployeeName() != null) {
                dto.setEmployeeName(entity.getEmployeeName());
            }
            return dto;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeExpenseBalanceResponse> getConsolidatedEmployeeExpenseBalances(UUID requestCompanyId, UUID employeeDriverId) {
        UUID companyId = TenantUtils.resolveCompanyIdForQuery(requestCompanyId);

        ExpenseRequestFilterDto filter = ExpenseRequestFilterDto.builder()
                .approvalStatus(ExpenseRequestStatus.APPROVED)
                .status(ExpenseRequestStatus.APPROVED)
                .availableForExpense(true)
                .employeeDriverId(employeeDriverId)
                .build();

        Specification<ExpenseRequest> spec = ExpenseRequestSpecification.getFilterSpecification(filter, companyId);
        List<ExpenseRequest> requests = expenseRequestRepository.findAll(spec);

        if (requests == null || requests.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> requestIds = requests.stream().map(ExpenseRequest::getId).toList();
        Map<UUID, BigDecimal> usedMap = new HashMap<>();
        if (!requestIds.isEmpty()) {
            List<Object[]> usedList = expenseClaimRepository.sumClaimAmountsByExpenseRequestIds(requestIds);
            if (usedList != null) {
                for (Object[] row : usedList) {
                    if (row != null && row.length >= 2 && row[0] != null) {
                        usedMap.put((UUID) row[0], row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO);
                    }
                }
            }
        }

        Set<UUID> employeeIds = requests.stream().map(ExpenseRequest::getEmployeeDriverId).collect(Collectors.toSet());
        Map<UUID, String> employeeNamesFromClaims = new HashMap<>();
        Map<UUID, String> employeeRolesFromClaims = new HashMap<>();
        if (!employeeIds.isEmpty()) {
            List<Object[]> empDetails = expenseClaimRepository.findLatestEmployeeDetailsByEmployeeIds(employeeIds);
            if (empDetails != null) {
                for (Object[] row : empDetails) {
                    if (row != null && row.length >= 3 && row[0] != null) {
                        UUID empId = (UUID) row[0];
                        if (!employeeNamesFromClaims.containsKey(empId) && row[1] != null) {
                            employeeNamesFromClaims.put(empId, (String) row[1]);
                        }
                        if (!employeeRolesFromClaims.containsKey(empId) && row[2] != null) {
                            employeeRolesFromClaims.put(empId, (String) row[2]);
                        }
                    }
                }
            }
        }

        Map<UUID, List<ExpenseRequest>> groupedByEmployee = requests.stream()
                .collect(Collectors.groupingBy(ExpenseRequest::getEmployeeDriverId, LinkedHashMap::new, Collectors.toList()));

        List<EmployeeExpenseBalanceResponse> consolidatedResponses = new ArrayList<>();

        for (Map.Entry<UUID, List<ExpenseRequest>> entry : groupedByEmployee.entrySet()) {
            UUID empId = entry.getKey();
            List<ExpenseRequest> empRequests = entry.getValue();

            BigDecimal totalRequested = BigDecimal.ZERO;
            BigDecimal totalApproved = BigDecimal.ZERO;
            BigDecimal totalUsed = BigDecimal.ZERO;
            BigDecimal totalRemaining = BigDecimal.ZERO;

            List<EmployeeExpenseRequestDetail> requestDetails = new ArrayList<>();
            String resolvedEmpName = null;
            String resolvedEmpRole = null;

            for (ExpenseRequest req : empRequests) {
                BigDecimal requested = req.getRequestedAmount() != null ? req.getRequestedAmount() : BigDecimal.ZERO;
                BigDecimal approved = req.getApprovedAmount() != null ? req.getApprovedAmount() : requested;
                BigDecimal used = usedMap.getOrDefault(req.getId(), BigDecimal.ZERO);
                BigDecimal remaining = approved.subtract(used);
                if (remaining.compareTo(BigDecimal.ZERO) < 0) {
                    remaining = BigDecimal.ZERO;
                }

                if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                totalRequested = totalRequested.add(requested);
                totalApproved = totalApproved.add(approved);
                totalUsed = totalUsed.add(used);
                totalRemaining = totalRemaining.add(remaining);

                if (resolvedEmpName == null && req.getEmployeeName() != null && !req.getEmployeeName().isBlank()) {
                    resolvedEmpName = req.getEmployeeName();
                }

                String catName = req.getExpenseCategory() != null ? req.getExpenseCategory().getCategoryName() : null;

                EmployeeExpenseRequestDetail detail = EmployeeExpenseRequestDetail.builder()
                        .expenseRequestId(req.getId())
                        .requestNumber(req.getRequestNumber())
                        .categoryName(catName)
                        .description(req.getPurposeDescription())
                        .requestedAmount(requested)
                        .approvedAmount(approved)
                        .usedAmount(used)
                        .remainingAmount(remaining)
                        .build();

                requestDetails.add(detail);
            }

            if (totalRemaining.compareTo(BigDecimal.ZERO) <= 0 || requestDetails.isEmpty()) {
                continue;
            }

            if (resolvedEmpName == null) {
                resolvedEmpName = employeeNamesFromClaims.get(empId);
            }
            if (resolvedEmpName == null && CurrentUserContext.getUserId() != null && CurrentUserContext.getUserId().equals(empId)) {
                resolvedEmpName = CurrentUserContext.getUserFullName();
            }
            if (resolvedEmpName == null || resolvedEmpName.isBlank()) {
                resolvedEmpName = "Employee";
            }

            resolvedEmpRole = employeeRolesFromClaims.get(empId);
            if (resolvedEmpRole == null && CurrentUserContext.getUserId() != null && CurrentUserContext.getUserId().equals(empId)) {
                resolvedEmpRole = CurrentUserContext.getUserRole();
            }
            if (resolvedEmpRole == null && !empRequests.isEmpty() && empRequests.get(0).getRoleType() != null) {
                resolvedEmpRole = empRequests.get(0).getRoleType().name();
            }
            if (resolvedEmpRole == null || resolvedEmpRole.isBlank()) {
                resolvedEmpRole = "EMPLOYEE";
            }

            EmployeeExpenseBalanceResponse balanceResponse = EmployeeExpenseBalanceResponse.builder()
                    .employeeId(empId)
                    .employeeName(resolvedEmpName)
                    .employeeRole(resolvedEmpRole)
                    .totalRequestedAmount(totalRequested)
                    .totalApprovedAmount(totalApproved)
                    .totalUsedAmount(totalUsed)
                    .totalRemainingAmount(totalRemaining)
                    .requests(requestDetails)
                    .build();

            consolidatedResponses.add(balanceResponse);
        }

        return consolidatedResponses;
    }

    private ExpenseRequestResponse enrichWithRemainingAmount(ExpenseRequestResponse response, ExpenseRequest entity) {
        if (response == null || entity == null) {
            return response;
        }
        BigDecimal used = expenseClaimRepository.sumClaimAmountByExpenseRequestId(entity.getId());
        if (used == null) {
            used = BigDecimal.ZERO;
        }
        BigDecimal approved = entity.getApprovedAmount() != null ? entity.getApprovedAmount() : (entity.getRequestedAmount() != null ? entity.getRequestedAmount() : BigDecimal.ZERO);
        BigDecimal remaining = approved.subtract(used);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }
        response.setUsedAmount(used);
        response.setRemainingAmount(remaining);
        return response;
    }

    @Override
    @Transactional
    public ExpenseRequestResponse updateExpenseRequest(UUID requestCompanyId, UUID id, ExpenseRequestUpdateRequest request) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        ExpenseRequest entity = expenseRequestRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Request not found with id: " + id));

        if (entity.getStatus() != ExpenseRequestStatus.DRAFT) {
            throw new ValidationException("Only DRAFT expense requests can be modified. Current status: " + entity.getStatus());
        }

        if (request.getRequestType() != null) {
            entity.setRequestType(request.getRequestType());
        }
        if (request.getDate() != null) {
            entity.setRequestDate(request.getDate());
        }
        if (request.getEmployeeDriverId() != null) {
            entity.setEmployeeDriverId(request.getEmployeeDriverId());
        }
        if (request.getRoleType() != null) {
            entity.setRoleType(request.getRoleType());
        }
        if (request.getCategoryId() != null) {
            ExpenseCategory category = expenseCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Expense Category not found with id: " + request.getCategoryId()));
            if (!companyId.equals(category.getCompany().getId())) {
                throw new ValidationException("Expense category belongs to a different company.");
            }
            if (Boolean.TRUE.equals(category.getIsDeleted())) {
                throw new ValidationException("Expense category is inactive or deleted.");
            }
            entity.setExpenseCategory(category);
        }
        if (request.getRequestedAmount() != null) {
            if (request.getRequestedAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ValidationException("Requested amount must be greater than zero.");
            }
            entity.setRequestedAmount(request.getRequestedAmount());
        }
        if (request.getPurposeDescription() != null) {
            entity.setPurposeDescription(request.getPurposeDescription());
        }
        if (request.getAdditionalNotes() != null) {
            entity.setAdditionalNotes(request.getAdditionalNotes());
        }
        if (request.getRequiresAdvance() != null) {
            entity.setRequiresAdvance(request.getRequiresAdvance());
        }
        if (request.getAdvanceAmount() != null) {
            entity.setAdvanceAmount(request.getAdvanceAmount());
        }

        validateOperationalLinks(companyId, request.getSalesOrderId(), request.getDeliveryChallanId());
        if (request.getSalesOrderId() != null) {
            entity.setSalesOrderId(request.getSalesOrderId());
        }
        if (request.getDeliveryChallanId() != null) {
            entity.setDeliveryChallanId(request.getDeliveryChallanId());
        }
        if (request.getVehicleId() != null) {
            entity.setVehicleId(request.getVehicleId());
        }
        if (request.getVehicleNumber() != null) {
            entity.setVehicleNumber(request.getVehicleNumber());
        }

        ExpenseRequest updated = expenseRequestRepository.save(entity);
        return enrichWithRemainingAmount(expenseRequestMapper.entityToResponse(updated), updated);
    }

    @Override
    @Transactional
    public ExpenseRequestResponse submitExpenseRequest(UUID requestCompanyId, UUID id) {
        return submitExpenseRequest(requestCompanyId, id, null);
    }

    @Override
    @Transactional
    public ExpenseRequestResponse submitExpenseRequest(UUID requestCompanyId, UUID id, String comments) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        ExpenseRequest entity = expenseRequestRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Request not found with id: " + id));

        if (entity.getStatus() != ExpenseRequestStatus.DRAFT) {
            throw new ValidationException("Only DRAFT requests can be submitted. Current status: " + entity.getStatus());
        }

        if (entity.getRequestedAmount() == null || entity.getRequestedAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Requested amount must be greater than zero to submit.");
        }

        UUID currentUserId = TenantUtils.getCurrentUserId();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userRolesStr = (auth != null && auth.getAuthorities() != null) 
            ? auth.getAuthorities().toString() 
            : "[]";

        ExpenseRequestStatus oldStatus = entity.getStatus();

        // Auto Approval Rule: CFO, SYSTEM_ADMIN, FINANCE_MANAGER
        boolean isAutoApprove = isAutoApproveRole();
        // CEO / Owner Self-Approval Rule:
        boolean isOwnerSelfApprove = isCeoOrOwner();

        if (isAutoApprove || isOwnerSelfApprove) {
            log.info("Requester has auto-approve role ({}). Auto-approving Expense Request: {}", isAutoApprove ? "Role-Based" : "CEO/Owner", id);
            entity.setStatus(ExpenseRequestStatus.APPROVED);
            entity.setApprovalStatus(ExpenseRequestStatus.APPROVED);
            entity.setApprovedAmount(entity.getRequestedAmount());
            entity.setApprovedBy(currentUserId);
            entity.setApprovedAt(LocalDateTime.now());
            
            if (isAutoApprove) {
                String existingNotes = entity.getAdditionalNotes() != null ? entity.getAdditionalNotes() + "\n" : "";
                entity.setAdditionalNotes(existingNotes + "Automatically approved based on user role.");
            }
        } else {
            // Prevent duplicate workflow submission
            if (workflowClient != null) {
                try {
                    WorkflowTransactionDto existingTx = workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", entity.getId());
                    if (existingTx != null && ("PENDING".equalsIgnoreCase(existingTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existingTx.getStatus()))) {
                        throw new ValidationException("Expense Request is already submitted for approval with transaction: " + existingTx.getId());
                    }
                } catch (ValidationException e) {
                    throw e;
                } catch (Exception e) {
                    log.debug("No existing workflow transaction found for expense request {}", id);
                }

                try {
                    workflowClient.submitWorkflow(
                            companyId,
                            "EXPENSE_REQUEST",
                            entity.getId(),
                            entity.getRequestNumber(),
                            comments != null ? comments : "Submitted expense request for approval"
                    );
                    log.info("Expense Request {} submitted for approval to workflow-service", entity.getRequestNumber());
                } catch (ValidationException e) {
                    throw e;
                } catch (Exception e) {
                    log.error("Workflow engine submission failed for expense request {}. Error: {}", id, e.getMessage());
                    throw new ValidationException("Failed to submit expense request for workflow approval: " + e.getMessage());
                }
            }

            entity.setStatus(ExpenseRequestStatus.PENDING_APPROVAL);
            entity.setApprovalStatus(ExpenseRequestStatus.PENDING_APPROVAL);
        }

        log.info("Expense Request Submit Debug -> Authenticated user: {}, Roles: {}, Auto approval matched: {}, Request: {}, RequestedAmount: {}, Old status: {}, New status: {}", 
                 currentUserId, userRolesStr, isAutoApprove, entity.getRequestNumber(), entity.getRequestedAmount(), oldStatus, entity.getStatus());

        ExpenseRequest saved = expenseRequestRepository.save(entity);
        
        if (isAutoApprove) {
            String username = (auth != null) ? auth.getName() : "system";
            AuditLog auditLog = AuditLog.builder()
                    .company(entity.getCompany())
                    .moduleName("EXPENSE")
                    .entityName("ExpenseRequest")
                    .entityId(saved.getId())
                    .actionType("AUTO_APPROVED")
                    .performedBy(currentUserId)
                    .performedByUsername(username)
                    .performedAt(LocalDateTime.now())
                    .build();
            try {
                auditLogService.recordAudit(auditLog);
            } catch (Exception e) {
                log.warn("Failed to manually record AUTO_APPROVED audit log for Expense Request {}", saved.getId(), e);
            }
        }
        
        return enrichWithRemainingAmount(expenseRequestMapper.entityToResponse(saved), saved);
    }

    @Override
    @Transactional
    public ExpenseRequestResponse approveExpenseRequest(UUID requestCompanyId, UUID id, ExpenseRequestApproveRequest request) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        ExpenseRequest entity = expenseRequestRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Request not found with id: " + id));

        if (entity.getStatus() != ExpenseRequestStatus.PENDING_APPROVAL) {
            throw new ValidationException("Request must be in PENDING_APPROVAL status to approve. Current status: " + entity.getStatus());
        }

        // Prevent bypassing active pending workflow
        if (workflowClient != null) {
            try {
                WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", id);
                if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                    throw new ValidationException("Expense Request cannot be approved directly while workflow approval is pending. Please approve via the workflow.");
                }
            } catch (ValidationException e) {
                throw e;
            } catch (Exception e) {
                log.debug("Workflow check skipped for expense request approval {}: {}", id, e.getMessage());
            }
        }

        UUID currentUserId = TenantUtils.getCurrentUserId();

        // Self-approval restriction rule
        boolean isCreatorOrRequester = (entity.getCreatedBy() != null && entity.getCreatedBy().equals(currentUserId))
                || (entity.getRequesterId() != null && entity.getRequesterId().equals(currentUserId));

        if (isCreatorOrRequester && !isCeoOrOwner()) {
            throw new SecurityException("Creator cannot approve their own document.");
        }

        BigDecimal approvedAmount = entity.getRequestedAmount();
        if (request != null && request.getApprovedAmount() != null) {
            approvedAmount = request.getApprovedAmount();
        }

        if (approvedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Approved amount must be greater than zero.");
        }

        if (approvedAmount.compareTo(entity.getRequestedAmount()) > 0) {
            throw new ValidationException("Approved amount (" + approvedAmount + ") cannot exceed requested amount (" + entity.getRequestedAmount() + ").");
        }

        entity.setApprovedAmount(approvedAmount);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedAt(LocalDateTime.now());
        entity.setStatus(ExpenseRequestStatus.APPROVED);
        entity.setApprovalStatus(ExpenseRequestStatus.APPROVED);

        if (request != null && request.getRemarks() != null && !request.getRemarks().isBlank()) {
            String existingNotes = entity.getAdditionalNotes() != null ? entity.getAdditionalNotes() + "\n" : "";
            entity.setAdditionalNotes(existingNotes + "Approval remarks: " + request.getRemarks());
        }

        ExpenseRequest saved = expenseRequestRepository.save(entity);
        log.info("Expense Request {} approved by user {} with amount {}", id, currentUserId, approvedAmount);
        return enrichWithRemainingAmount(expenseRequestMapper.entityToResponse(saved), saved);
    }

    @Override
    @Transactional
    public ExpenseRequestResponse rejectExpenseRequest(UUID requestCompanyId, UUID id, ExpenseRequestRejectRequest request) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        ExpenseRequest entity = expenseRequestRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Request not found with id: " + id));

        if (entity.getStatus() == ExpenseRequestStatus.APPROVED
                || entity.getStatus() == ExpenseRequestStatus.REJECTED
                || entity.getStatus() == ExpenseRequestStatus.CANCELLED
                || entity.getStatus() == ExpenseRequestStatus.CONVERTED_TO_EXPENSE) {
            throw new ValidationException("Cannot reject request in status: " + entity.getStatus());
        }

        // Prevent bypassing active pending workflow
        if (workflowClient != null) {
            try {
                WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", id);
                if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                    throw new ValidationException("Expense Request cannot be rejected directly while workflow approval is pending. Please reject via the workflow.");
                }
            } catch (ValidationException e) {
                throw e;
            } catch (Exception e) {
                log.debug("Workflow check skipped for expense request rejection {}: {}", id, e.getMessage());
            }
        }

        if (request == null || request.getReason() == null || request.getReason().isBlank()) {
            throw new ValidationException("Rejection reason is required.");
        }

        UUID currentUserId = TenantUtils.getCurrentUserId();
        entity.setRejectionReason(request.getReason());
        entity.setRejectedBy(currentUserId);
        entity.setRejectedAt(LocalDateTime.now());
        entity.setStatus(ExpenseRequestStatus.REJECTED);
        entity.setApprovalStatus(ExpenseRequestStatus.REJECTED);

        ExpenseRequest saved = expenseRequestRepository.save(entity);
        log.info("Expense Request {} rejected by user {}", id, currentUserId);
        return enrichWithRemainingAmount(expenseRequestMapper.entityToResponse(saved), saved);
    }

    @Override
    @Transactional
    public ExpenseRequestResponse cancelExpenseRequest(UUID requestCompanyId, UUID id) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        ExpenseRequest entity = expenseRequestRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Request not found with id: " + id));

        if (entity.getStatus() == ExpenseRequestStatus.CANCELLED
                || entity.getStatus() == ExpenseRequestStatus.CONVERTED_TO_EXPENSE) {
            throw new ValidationException("Cannot cancel request in status: " + entity.getStatus());
        }

        // Prevent bypassing active pending workflow
        if (workflowClient != null) {
            try {
                WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", id);
                if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                    throw new ValidationException("Expense Request cannot be cancelled directly while workflow approval is pending. Please cancel via the workflow.");
                }
            } catch (ValidationException e) {
                throw e;
            } catch (Exception e) {
                log.debug("Workflow check skipped for expense request cancellation {}: {}", id, e.getMessage());
            }
        }

        entity.setStatus(ExpenseRequestStatus.CANCELLED);
        entity.setApprovalStatus(ExpenseRequestStatus.CANCELLED);

        ExpenseRequest saved = expenseRequestRepository.save(entity);
        log.info("Expense Request {} cancelled", id);
        return enrichWithRemainingAmount(expenseRequestMapper.entityToResponse(saved), saved);
    }

    private void validateCreateRequest(ExpenseRequestCreateRequest request, UUID companyId) {
        if (request.getRequestType() == null) {
            throw new ValidationException("Request type is required.");
        }
        if (request.getEmployeeDriverId() == null) {
            throw new ValidationException("Employee/Driver ID is required.");
        }
        if (request.getRoleType() == null) {
            throw new ValidationException("Role type is required.");
        }
        if (request.getCategoryId() == null) {
            throw new ValidationException("Expense Category is required.");
        }
        if (request.getRequestedAmount() == null || request.getRequestedAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Requested amount must be greater than zero.");
        }
    }

    private void validateOperationalLinks(UUID companyId, UUID salesOrderId, UUID deliveryChallanId) {
        if (salesOrderId != null) {
            salesOrderRepository.findById(salesOrderId).ifPresent(so -> {
                if (!companyId.equals(so.getCompanyId())) {
                    throw new ValidationException("Sales Order belongs to a different company.");
                }
            });
        }
        if (deliveryChallanId != null) {
            deliveryChallanRepository.findById(deliveryChallanId).ifPresent(dc -> {
                if (!companyId.equals(dc.getCompanyId())) {
                    throw new ValidationException("Delivery Challan belongs to a different company.");
                }
            });
        }
    }

    private boolean isAutoApproveRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream().anyMatch(a -> {
            if (a.getAuthority() == null) return false;
            String role = a.getAuthority().trim().toUpperCase();
            if (role.startsWith("ROLE_")) {
                role = role.substring(5);
            }
            return "CFO".equals(role)
                    || "SYSTEM_ADMIN".equals(role)
                    || "FINANCE_MANAGER".equals(role);
        });
    }

    private boolean isCeoOrOwner() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        return auth.getAuthorities().stream().anyMatch(a -> {
            String role = a.getAuthority();
            return "ROLE_CEO".equalsIgnoreCase(role)
                    || "ROLE_COMPANY_OWNER".equalsIgnoreCase(role)
                    || "ROLE_OWNER".equalsIgnoreCase(role)
                    || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(role);
        });
    }
}
