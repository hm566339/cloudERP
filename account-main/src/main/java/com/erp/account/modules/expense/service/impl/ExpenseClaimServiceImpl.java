package com.erp.account.modules.expense.service.impl;

import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.enums.ApprovalStatus;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.ReimbursementStatus;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expense.entity.ExpenseClaim;
import com.erp.account.modules.expense.entity.ExpenseClaimItem;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.entity.Reimbursement;
import com.erp.account.modules.expense.mapper.ExpenseClaimMapper;
import com.erp.account.modules.expense.repository.ExpenseCategoryRepository;
import com.erp.account.modules.expense.repository.ExpenseClaimItemRepository;
import com.erp.account.modules.expense.repository.ExpenseClaimRepository;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.expense.repository.ReimbursementRepository;
import com.erp.account.modules.expense.service.ExpenseAttachmentStorageService;
import com.erp.account.modules.expense.service.ExpenseClaimService;
import com.erp.account.modules.expense.specification.ExpenseClaimSpecification;
import com.erp.account.modules.expense.service.ExpensePostingService;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseClaimServiceImpl implements ExpenseClaimService {

    private final ExpenseClaimRepository expenseClaimRepository;
    private final ExpenseClaimItemRepository expenseClaimItemRepository;
    private final ExpenseCategoryRepository expenseCategoryRepository;
    private final ExpenseRequestRepository expenseRequestRepository;
    private final ReimbursementRepository reimbursementRepository;
    private final CompanyRepository companyRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final ExpenseClaimMapper expenseClaimMapper;
    private final ExpensePostingService expensePostingService;
    private final ExpenseAttachmentStorageService expenseAttachmentStorageService;

    @Override
    @Transactional
    public ExpenseClaimResponse createExpenseClaim(UUID companyId, ExpenseClaimCreateRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + resolvedCompanyId));

        ExpenseRequest expenseRequest = null;
        if (request.getExpenseRequestId() != null) {
            expenseRequest = expenseRequestRepository.findByIdAndCompanyIdWithLock(request.getExpenseRequestId(), resolvedCompanyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Expense Request not found"));

            if (expenseRequest.getApprovalStatus() != ExpenseRequestStatus.APPROVED) {
                throw new IllegalArgumentException("Expense Request must be APPROVED to create a claim. Current approval status: " + expenseRequest.getApprovalStatus());
            }
        }

        String claimNo = voucherSequenceService.generateNextExpenseClaimNumber(resolvedCompanyId, request.getClaimDate());

        String employeeName = request.getEmployeeName();
        if (employeeName == null || employeeName.isBlank()) {
            employeeName = com.erp.account.security.CurrentUserContext.getUserFullName();
        }

        String employeeRole = request.getEmployeeRole();
        if (employeeRole == null || employeeRole.isBlank()) {
            employeeRole = com.erp.account.security.CurrentUserContext.getUserRole();
        }

        UUID employeeId = request.getEmployeeId();
        if (employeeId == null) {
            employeeId = com.erp.account.security.CurrentUserContext.getUserId();
        }

        ExpenseClaim claim = ExpenseClaim.builder()
                .company(company)
                .claimNo(claimNo)
                .employeeId(employeeId)
                .employeeName(employeeName)
                .employeeRole(employeeRole)
                .claimDate(request.getClaimDate())
                .status(ApprovalStatus.DRAFT)
                .expenseRequestId(expenseRequest != null ? expenseRequest.getId() : null)
                .build();

        List<ExpenseClaimItem> claimItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (ExpenseClaimItemRequest itemReq : request.getItems()) {
            ExpenseCategory category = expenseCategoryRepository.findById(itemReq.getExpenseCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Expense Category not found"));

            if (!category.getCompany().getId().equals(resolvedCompanyId)) {
                throw new IllegalArgumentException("Expense Category does not belong to the given company");
            }

            if (Boolean.FALSE.equals(category.getIsActive()) || Boolean.TRUE.equals(category.getIsDeleted())) {
                throw new IllegalArgumentException("Expense Category is inactive or deleted: " + category.getCategoryName());
            }

            if (itemReq.getBillAttachmentUrl() != null && !itemReq.getBillAttachmentUrl().isBlank()) {
                if (!expenseAttachmentStorageService.isValidAttachmentUrl(itemReq.getBillAttachmentUrl(), resolvedCompanyId)) {
                    throw new BadRequestException("Invalid bill attachment URL or file does not belong to this company: " + itemReq.getBillAttachmentUrl());
                }
            }

            ExpenseClaimItem item = ExpenseClaimItem.builder()
                    .expenseClaim(claim)
                    .company(company)
                    .expenseCategory(category)
                    .expenseDate(itemReq.getExpenseDate())
                    .description(itemReq.getDescription())
                    .amount(itemReq.getAmount())
                    .billAttachmentUrl(itemReq.getBillAttachmentUrl())
                    .paymentType(itemReq.getPaymentType())
                    .build();

            claimItems.add(item);
            totalAmount = totalAmount.add(itemReq.getAmount());
        }

        if (expenseRequest != null) {
            BigDecimal approvedAmount = expenseRequest.getApprovedAmount() != null
                    ? expenseRequest.getApprovedAmount()
                    : (expenseRequest.getRequestedAmount() != null ? expenseRequest.getRequestedAmount() : BigDecimal.ZERO);
            BigDecimal existingUsedAmount = expenseClaimRepository.sumClaimAmountByExpenseRequestId(expenseRequest.getId());
            if (existingUsedAmount == null) {
                existingUsedAmount = BigDecimal.ZERO;
            }
            BigDecimal remainingAmount = approvedAmount.subtract(existingUsedAmount);
            if (remainingAmount.compareTo(BigDecimal.ZERO) < 0) {
                remainingAmount = BigDecimal.ZERO;
            }

            if (totalAmount.compareTo(remainingAmount) > 0) {
                throw new IllegalArgumentException(String.format(
                    "Claim amount (₹%s) exceeds the remaining approved amount (₹%s) for Expense Request %s (Approved: ₹%s, Already Used: ₹%s)",
                    totalAmount, remainingAmount, expenseRequest.getRequestNumber(), approvedAmount, existingUsedAmount
                ));
            }
        }

        claim.setClaimAmount(totalAmount);
        claim.setItems(claimItems); // bidirectional link

        ExpenseClaim savedClaim = expenseClaimRepository.save(claim);
        log.info("Created Expense Claim {} for company {}", savedClaim.getClaimNo(), resolvedCompanyId);

        if (expenseRequest != null) {
            expenseRequest.setStatus(ExpenseRequestStatus.CONVERTED_TO_EXPENSE);
            expenseRequestRepository.save(expenseRequest);
        }

        return expenseClaimMapper.entityToResponse(savedClaim);
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseClaimResponse getExpenseClaimById(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        ExpenseClaim claim = expenseClaimRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Claim not found"));

        return expenseClaimMapper.entityToResponse(claim);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExpenseClaimResponse> getAllExpenseClaims(UUID companyId, ExpenseClaimFilterDto filter, Pageable pageable) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Page<ExpenseClaim> page = expenseClaimRepository.findAll(
                ExpenseClaimSpecification.getFilterSpecification(filter, resolvedCompanyId),
                pageable
        );

        return page.map(expenseClaimMapper::entityToResponse);
    }

    @Override
    @Transactional
    public ExpenseClaimResponse updateExpenseClaim(UUID companyId, UUID id, ExpenseClaimUpdateRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        ExpenseClaim claim = expenseClaimRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Claim not found"));

        if (claim.getStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Only claims in DRAFT status can be updated");
        }

        ExpenseRequest expenseRequest = null;
        if (request.getExpenseRequestId() != null) {
            expenseRequest = expenseRequestRepository.findByIdAndCompanyIdWithLock(request.getExpenseRequestId(), resolvedCompanyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Expense Request not found"));

            if (expenseRequest.getApprovalStatus() != ExpenseRequestStatus.APPROVED) {
                throw new IllegalArgumentException("Expense Request must be APPROVED to link to a claim. Current approval status: " + expenseRequest.getApprovalStatus());
            }
        }

        claim.setEmployeeId(request.getEmployeeId());
        if (request.getEmployeeName() != null && !request.getEmployeeName().isBlank()) {
            claim.setEmployeeName(request.getEmployeeName());
        }
        if (request.getEmployeeRole() != null && !request.getEmployeeRole().isBlank()) {
            claim.setEmployeeRole(request.getEmployeeRole());
        }
        claim.setClaimDate(request.getClaimDate());
        claim.setExpenseRequestId(expenseRequest != null ? expenseRequest.getId() : null);

        // Delete existing items
        expenseClaimItemRepository.deleteAllByExpenseClaimId(id);
        claim.getItems().clear();

        List<ExpenseClaimItem> newItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (ExpenseClaimItemRequest itemReq : request.getItems()) {
            ExpenseCategory category = expenseCategoryRepository.findById(itemReq.getExpenseCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Expense Category not found"));

            if (!category.getCompany().getId().equals(resolvedCompanyId)) {
                throw new IllegalArgumentException("Expense Category does not belong to the given company");
            }
            if (Boolean.FALSE.equals(category.getIsActive()) || Boolean.TRUE.equals(category.getIsDeleted())) {
                throw new IllegalArgumentException("Expense Category is inactive or deleted: " + category.getCategoryName());
            }

            if (itemReq.getBillAttachmentUrl() != null && !itemReq.getBillAttachmentUrl().isBlank()) {
                if (!expenseAttachmentStorageService.isValidAttachmentUrl(itemReq.getBillAttachmentUrl(), resolvedCompanyId)) {
                    throw new BadRequestException("Invalid bill attachment URL or file does not belong to this company: " + itemReq.getBillAttachmentUrl());
                }
            }

            ExpenseClaimItem item = ExpenseClaimItem.builder()
                    .expenseClaim(claim)
                    .company(claim.getCompany())
                    .expenseCategory(category)
                    .expenseDate(itemReq.getExpenseDate())
                    .description(itemReq.getDescription())
                    .amount(itemReq.getAmount())
                    .billAttachmentUrl(itemReq.getBillAttachmentUrl())
                    .paymentType(itemReq.getPaymentType())
                    .build();

            newItems.add(item);
            totalAmount = totalAmount.add(itemReq.getAmount());
        }

        if (expenseRequest != null) {
            BigDecimal approvedAmount = expenseRequest.getApprovedAmount() != null
                    ? expenseRequest.getApprovedAmount()
                    : (expenseRequest.getRequestedAmount() != null ? expenseRequest.getRequestedAmount() : BigDecimal.ZERO);
            BigDecimal existingUsedAmount = expenseClaimRepository.sumClaimAmountByExpenseRequestIdExcludingClaimId(expenseRequest.getId(), id);
            if (existingUsedAmount == null) {
                existingUsedAmount = BigDecimal.ZERO;
            }
            BigDecimal remainingAmount = approvedAmount.subtract(existingUsedAmount);
            if (remainingAmount.compareTo(BigDecimal.ZERO) < 0) {
                remainingAmount = BigDecimal.ZERO;
            }

            if (totalAmount.compareTo(remainingAmount) > 0) {
                throw new IllegalArgumentException(String.format(
                    "Claim amount (₹%s) exceeds the remaining approved amount (₹%s) for Expense Request %s (Approved: ₹%s, Already Used: ₹%s)",
                    totalAmount, remainingAmount, expenseRequest.getRequestNumber(), approvedAmount, existingUsedAmount
                ));
            }
        }

        claim.setClaimAmount(totalAmount);
        claim.getItems().addAll(newItems);

        ExpenseClaim updatedClaim = expenseClaimRepository.save(claim);
        log.info("Updated Expense Claim {}", claim.getClaimNo());

        if (expenseRequest != null) {
            expenseRequest.setStatus(ExpenseRequestStatus.CONVERTED_TO_EXPENSE);
            expenseRequestRepository.save(expenseRequest);
        }

        return expenseClaimMapper.entityToResponse(updatedClaim);
    }

    @Override
    @Transactional
    public PostResponse deleteExpenseClaim(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        ExpenseClaim claim = expenseClaimRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Claim not found"));

        if (claim.getStatus() != ApprovalStatus.DRAFT && claim.getStatus() != ApprovalStatus.REJECTED) {
            throw new IllegalArgumentException("Only DRAFT or REJECTED claims can be deleted");
        }

        claim.setIsDeleted(true);
        claim.setDeletedAt(LocalDateTime.now());
        expenseClaimRepository.save(claim);
        
        log.info("Soft deleted Expense Claim {}", claim.getClaimNo());
        
        return PostResponse.builder().id(claim.getId()).build();
    }

    @Override
    @Transactional
    public ExpenseClaimResponse submitExpenseClaim(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        ExpenseClaim claim = expenseClaimRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Claim not found"));

        if (claim.getStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Only DRAFT claims can be submitted");
        }

        if (claim.getClaimAmount() == null || claim.getClaimAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Cannot submit a claim with zero amount");
        }

        claim.setStatus(ApprovalStatus.SUBMITTED);
        ExpenseClaim savedClaim = expenseClaimRepository.save(claim);
        
        log.info("Submitted Expense Claim {}", claim.getClaimNo());
        
        return expenseClaimMapper.entityToResponse(savedClaim);
    }

    @Override
    @Transactional
    public ExpenseClaimResponse approveExpenseClaim(UUID companyId, UUID id, ExpenseClaimApproveRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        ExpenseClaim claim = expenseClaimRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Claim not found"));

        if (claim.getStatus() != ApprovalStatus.SUBMITTED) {
            throw new IllegalArgumentException("Only SUBMITTED claims can be approved");
        }

        if (request == null || request.getEmployeePayableAccountId() == null || request.getBankOrCashAccountId() == null) {
            throw new IllegalArgumentException("Employee Payable and Bank/Cash accounts are required to approve the expense");
        }

        claim.setStatus(ApprovalStatus.FINANCE_APPROVED);
        ExpenseClaim savedClaim = expenseClaimRepository.save(claim);

        // Ledger integration - exactly one GL journal posting
        expensePostingService.postExpenseClaimApproval(
                resolvedCompanyId,
                claim,
                request.getEmployeePayableAccountId(),
                request.getBankOrCashAccountId(),
                LocalDate.now(),
                "Expense Claim Approval: " + claim.getClaimNo()
        );

        // Automatic Reimbursement creation for self-paid / reimbursable items (Idempotent)
        BigDecimal selfPaidAmount = BigDecimal.ZERO;
        if (claim.getItems() != null && !claim.getItems().isEmpty()) {
            for (ExpenseClaimItem item : claim.getItems()) {
                BigDecimal itemAmt = item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO;
                if (itemAmt.compareTo(BigDecimal.ZERO) > 0) {
                    if (item.getPaymentType() != PaymentType.CARD && item.getPaymentType() != PaymentType.BANK) {
                        selfPaidAmount = selfPaidAmount.add(itemAmt);
                    }
                }
            }
        } else {
            selfPaidAmount = claim.getClaimAmount() != null ? claim.getClaimAmount() : BigDecimal.ZERO;
        }

        if (selfPaidAmount.compareTo(BigDecimal.ZERO) > 0) {
            boolean reimbursementExists = reimbursementRepository
                    .existsByExpenseClaimIdAndCompanyIdAndIsDeletedFalse(claim.getId(), resolvedCompanyId);

            if (!reimbursementExists) {
                Company company = claim.getCompany();
                if (company == null) {
                    company = companyRepository.findById(resolvedCompanyId)
                            .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + resolvedCompanyId));
                }

                LocalDate rmbDate = claim.getClaimDate() != null ? claim.getClaimDate() : LocalDate.now();
                String rmbNo = voucherSequenceService.generateNextReimbursementNumber(resolvedCompanyId, rmbDate);

                Reimbursement reimbursement = Reimbursement.builder()
                        .company(company)
                        .employeeId(claim.getEmployeeId())
                        .expenseClaimId(claim.getId())
                        .reimbursementNo(rmbNo)
                        .reimbursementDate(rmbDate)
                        .reimbursementAmount(selfPaidAmount)
                        .status(ReimbursementStatus.SUBMITTED)
                        .notes("Auto-generated reimbursement for " + claim.getClaimNo())
                        .build();

                reimbursementRepository.save(reimbursement);
                log.info("Auto-created Reimbursement {} for approved Expense Claim {}", rmbNo, claim.getClaimNo());
            } else {
                log.info("Reimbursement already exists for Expense Claim {}, skipping duplicate creation", claim.getClaimNo());
            }
        } else {
            log.info("Expense Claim {} has no self-paid items (company-paid); skipping reimbursement creation", claim.getClaimNo());
        }

        log.info("Approved Expense Claim {}", claim.getClaimNo());

        return expenseClaimMapper.entityToResponse(savedClaim);
    }

    @Override
    @Transactional
    public ExpenseClaimResponse rejectExpenseClaim(UUID companyId, UUID id, ExpenseClaimRejectRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        ExpenseClaim claim = expenseClaimRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Claim not found"));

        if (claim.getStatus() != ApprovalStatus.SUBMITTED) {
            throw new IllegalArgumentException("Only SUBMITTED claims can be rejected");
        }

        claim.setStatus(ApprovalStatus.REJECTED);
        ExpenseClaim savedClaim = expenseClaimRepository.save(claim);

        log.info("Rejected Expense Claim {} for reason: {}", claim.getClaimNo(), request != null ? request.getRejectionReason() : "");

        return expenseClaimMapper.entityToResponse(savedClaim);
    }

    @Override
    @Transactional
    public ExpenseClaimResponse cancelExpenseClaim(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        ExpenseClaim claim = expenseClaimRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Claim not found"));

        if (claim.getStatus() == ApprovalStatus.FINANCE_APPROVED || claim.getStatus() == ApprovalStatus.PAID) {
            throw new IllegalArgumentException("Cannot cancel an already approved or paid claim");
        }

        claim.setStatus(ApprovalStatus.CANCELLED);
        ExpenseClaim savedClaim = expenseClaimRepository.save(claim);

        log.info("Cancelled Expense Claim {}", claim.getClaimNo());

        return expenseClaimMapper.entityToResponse(savedClaim);
    }
}
