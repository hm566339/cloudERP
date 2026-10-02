package com.erp.account.modules.expense.service.impl;

import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.enums.ApprovalStatus;
import com.erp.account.enums.ReimbursementStatus;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.entity.ExpenseClaim;
import com.erp.account.modules.expense.entity.Reimbursement;
import com.erp.account.modules.expense.mapper.ReimbursementMapper;
import com.erp.account.modules.expense.repository.ExpenseClaimRepository;
import com.erp.account.modules.expense.repository.ReimbursementRepository;
import com.erp.account.modules.expense.service.ExpensePostingService;
import com.erp.account.modules.expense.service.ReimbursementService;
import com.erp.account.modules.expense.specification.ReimbursementSpecification;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReimbursementServiceImpl implements ReimbursementService {

    private final ReimbursementRepository reimbursementRepository;
    private final ExpenseClaimRepository expenseClaimRepository;
    private final CompanyRepository companyRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final ReimbursementMapper reimbursementMapper;
    private final ExpensePostingService expensePostingService;
    private final ChartOfAccountRepository chartOfAccountRepository;

    @Override
    @Transactional
    public ReimbursementResponse createReimbursement(UUID companyId, ReimbursementCreateRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + resolvedCompanyId));

        ExpenseClaim claim = expenseClaimRepository.findByIdAndCompanyIdAndIsDeletedFalse(request.getExpenseClaimId(), resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Claim not found"));

        if (!claim.getEmployeeId().equals(request.getEmployeeId())) {
            throw new IllegalArgumentException("Employee ID does not match the Expense Claim's Employee ID");
        }
        
        if (claim.getStatus() != ApprovalStatus.FINANCE_APPROVED && claim.getStatus() != ApprovalStatus.PAID) {
            throw new IllegalArgumentException("Expense Claim must be FINANCE_APPROVED to process a reimbursement.");
        }

        BigDecimal alreadyReimbursed = reimbursementRepository.sumReimbursedAmountByExpenseClaimId(claim.getId());
        if (alreadyReimbursed == null) alreadyReimbursed = BigDecimal.ZERO;
        
        BigDecimal remainingAmount = claim.getClaimAmount().subtract(alreadyReimbursed);
        if (request.getReimbursementAmount().compareTo(remainingAmount) > 0) {
            throw new IllegalArgumentException("Reimbursement amount exceeds the remaining eligible claim amount. Maximum eligible: " + remainingAmount);
        }

        String reimbursementNo = voucherSequenceService.generateNextReimbursementNumber(resolvedCompanyId, request.getReimbursementDate());

        Reimbursement reimbursement = Reimbursement.builder()
                .company(company)
                .employeeId(request.getEmployeeId())
                .expenseClaimId(request.getExpenseClaimId())
                .reimbursementNo(reimbursementNo)
                .reimbursementDate(request.getReimbursementDate())
                .reimbursementAmount(request.getReimbursementAmount())
                .status(ReimbursementStatus.DRAFT)
                .paymentMethod(request.getPaymentMethod())
                .paymentReference(request.getPaymentReference())
                .notes(request.getNotes())
                .build();

        Reimbursement savedReimbursement = reimbursementRepository.save(reimbursement);
        log.info("Created Reimbursement {} for company {}", savedReimbursement.getReimbursementNo(), resolvedCompanyId);

        return reimbursementMapper.entityToResponse(savedReimbursement);
    }

    @Override
    @Transactional(readOnly = true)
    public ReimbursementResponse getReimbursementById(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Reimbursement reimbursement = reimbursementRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement not found"));

        return reimbursementMapper.entityToResponse(reimbursement);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReimbursementResponse> getAllReimbursements(UUID companyId, ReimbursementFilterRequest filter, Pageable pageable) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Page<Reimbursement> page = reimbursementRepository.findAll(
                ReimbursementSpecification.getFilterSpecification(filter, resolvedCompanyId),
                pageable
        );

        return page.map(reimbursementMapper::entityToResponse);
    }

    @Override
    @Transactional
    public ReimbursementResponse updateReimbursement(UUID companyId, UUID id, ReimbursementUpdateRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Reimbursement reimbursement = reimbursementRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement not found"));

        if (reimbursement.getStatus() != ReimbursementStatus.DRAFT) {
            throw new IllegalArgumentException("Only reimbursements in DRAFT status can be updated");
        }

        ExpenseClaim claim = expenseClaimRepository.findByIdAndCompanyIdAndIsDeletedFalse(request.getExpenseClaimId(), resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense Claim not found"));

        if (!claim.getEmployeeId().equals(request.getEmployeeId())) {
            throw new IllegalArgumentException("Employee ID does not match the Expense Claim's Employee ID");
        }

        BigDecimal alreadyReimbursed = reimbursementRepository.sumReimbursedAmountByExpenseClaimId(claim.getId());
        if (alreadyReimbursed == null) alreadyReimbursed = BigDecimal.ZERO;
        
        // Subtract current reimbursement amount because we're updating it
        alreadyReimbursed = alreadyReimbursed.subtract(reimbursement.getReimbursementAmount());
        
        BigDecimal remainingAmount = claim.getClaimAmount().subtract(alreadyReimbursed);
        if (request.getReimbursementAmount().compareTo(remainingAmount) > 0) {
            throw new IllegalArgumentException("Reimbursement amount exceeds the remaining eligible claim amount. Maximum eligible: " + remainingAmount);
        }

        reimbursement.setEmployeeId(request.getEmployeeId());
        reimbursement.setExpenseClaimId(request.getExpenseClaimId());
        reimbursement.setReimbursementDate(request.getReimbursementDate());
        reimbursement.setReimbursementAmount(request.getReimbursementAmount());
        reimbursement.setPaymentMethod(request.getPaymentMethod());
        reimbursement.setPaymentReference(request.getPaymentReference());
        reimbursement.setNotes(request.getNotes());

        Reimbursement updatedReimbursement = reimbursementRepository.save(reimbursement);
        log.info("Updated Reimbursement {}", reimbursement.getReimbursementNo());

        return reimbursementMapper.entityToResponse(updatedReimbursement);
    }

    @Override
    @Transactional
    public PostResponse deleteReimbursement(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Reimbursement reimbursement = reimbursementRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement not found"));

        if (reimbursement.getStatus() != ReimbursementStatus.DRAFT && reimbursement.getStatus() != ReimbursementStatus.REJECTED) {
            throw new IllegalArgumentException("Only DRAFT or REJECTED reimbursements can be deleted");
        }

        reimbursement.setIsDeleted(true);
        reimbursement.setDeletedAt(LocalDateTime.now());
        reimbursementRepository.save(reimbursement);
        
        log.info("Soft deleted Reimbursement {}", reimbursement.getReimbursementNo());
        
        return PostResponse.builder().id(reimbursement.getId()).build();
    }

    @Override
    @Transactional
    public ReimbursementResponse submitReimbursement(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Reimbursement reimbursement = reimbursementRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement not found"));

        if (reimbursement.getStatus() != ReimbursementStatus.DRAFT) {
            throw new IllegalArgumentException("Only DRAFT reimbursements can be submitted");
        }

        reimbursement.setStatus(ReimbursementStatus.SUBMITTED);
        Reimbursement savedReimbursement = reimbursementRepository.save(reimbursement);
        
        log.info("Submitted Reimbursement {}", reimbursement.getReimbursementNo());
        
        return reimbursementMapper.entityToResponse(savedReimbursement);
    }

    @Override
    @Transactional
    public ReimbursementResponse approveReimbursement(UUID companyId, UUID id, ReimbursementApproveRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Reimbursement reimbursement = reimbursementRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement not found"));

        if (reimbursement.getStatus() != ReimbursementStatus.SUBMITTED) {
            throw new IllegalArgumentException("Only SUBMITTED reimbursements can be approved");
        }

        reimbursement.setStatus(ReimbursementStatus.APPROVED);
        if (request != null && request.getNotes() != null) {
            reimbursement.setNotes(request.getNotes());
        }
        Reimbursement savedReimbursement = reimbursementRepository.save(reimbursement);
        
        log.info("Approved Reimbursement {}", reimbursement.getReimbursementNo());
        
        return reimbursementMapper.entityToResponse(savedReimbursement);
    }

    @Override
    @Transactional
    public ReimbursementResponse rejectReimbursement(UUID companyId, UUID id, ReimbursementRejectRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Reimbursement reimbursement = reimbursementRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement not found"));

        if (reimbursement.getStatus() != ReimbursementStatus.SUBMITTED) {
            throw new IllegalArgumentException("Only SUBMITTED reimbursements can be rejected");
        }

        reimbursement.setStatus(ReimbursementStatus.REJECTED);
        reimbursement.setNotes(request.getRejectionReason());
        Reimbursement savedReimbursement = reimbursementRepository.save(reimbursement);
        
        log.info("Rejected Reimbursement {} for reason: {}", reimbursement.getReimbursementNo(), request.getRejectionReason());
        
        return reimbursementMapper.entityToResponse(savedReimbursement);
    }

    @Override
    @Transactional
    public ReimbursementResponse payReimbursement(UUID companyId, UUID id, ReimbursementPayRequest request) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Reimbursement reimbursement = reimbursementRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement not found"));

        if (reimbursement.getStatus() != ReimbursementStatus.APPROVED) {
            throw new IllegalArgumentException("Only APPROVED reimbursements can be marked as PAID");
        }

        reimbursement.setStatus(ReimbursementStatus.PAID);
        reimbursement.setPaymentMethod(request.getPaymentMethod());
        reimbursement.setPaymentDate(request.getPaymentDate());
        reimbursement.setPaymentReference(request.getPaymentReference());

        Reimbursement savedReimbursement = reimbursementRepository.save(reimbursement);
        
        log.info("Paid Reimbursement {} with method {}", reimbursement.getReimbursementNo(), request.getPaymentMethod());
        
        // Ledger integration - post settlement journal entry: Dr Employee Payable, Cr Bank/Cash
        try {
            UUID employeePayableAccountId = request.getEmployeePayableAccountId();
            if (employeePayableAccountId == null) {
                employeePayableAccountId = chartOfAccountRepository
                        .findByCompanyIdAndAccountCodeAndIsDeletedFalse(resolvedCompanyId, "200007")
                        .or(() -> chartOfAccountRepository.findByCompanyIdAndAccountCodeAndIsDeletedFalse(resolvedCompanyId, "200001"))
                        .map(ChartOfAccount::getId)
                        .orElse(null);
            }

            UUID bankOrCashAccountId = request.getBankOrCashAccountId();
            if (bankOrCashAccountId == null) {
                if (request.getPaymentMethod() == com.erp.account.enums.PaymentMode.CASH) {
                    bankOrCashAccountId = chartOfAccountRepository
                            .findByCompanyIdAndAccountCodeAndIsDeletedFalse(resolvedCompanyId, "100001")
                            .map(ChartOfAccount::getId)
                            .orElse(null);
                } else {
                    bankOrCashAccountId = chartOfAccountRepository
                            .findByCompanyIdAndAccountCodeAndIsDeletedFalse(resolvedCompanyId, "100008")
                            .or(() -> chartOfAccountRepository.findByCompanyIdAndAccountCodeAndIsDeletedFalse(resolvedCompanyId, "100001"))
                            .map(ChartOfAccount::getId)
                            .orElse(null);
                }
            }

            if (employeePayableAccountId != null && bankOrCashAccountId != null) {
                expensePostingService.postExpenseReimbursement(
                        resolvedCompanyId,
                        null,
                        employeePayableAccountId,
                        bankOrCashAccountId,
                        reimbursement.getReimbursementAmount(),
                        request.getPaymentDate() != null ? request.getPaymentDate() : java.time.LocalDate.now(),
                        "Settlement of Reimbursement: " + reimbursement.getReimbursementNo()
                );
                log.info("Posted GL journal settlement for Reimbursement {}", reimbursement.getReimbursementNo());
            } else {
                log.warn("Could not determine Employee Payable or Bank/Cash account for GL posting of Reimbursement {}", reimbursement.getReimbursementNo());
            }
        } catch (Exception ex) {
            log.error("Error posting GL journal for reimbursement settlement {}: {}", reimbursement.getReimbursementNo(), ex.getMessage(), ex);
            throw ex;
        }

        return reimbursementMapper.entityToResponse(savedReimbursement);
    }

    @Override
    @Transactional
    public ReimbursementResponse cancelReimbursement(UUID companyId, UUID id) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        Reimbursement reimbursement = reimbursementRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement not found"));

        if (reimbursement.getStatus() == ReimbursementStatus.PAID) {
            throw new IllegalArgumentException("Cannot cancel an already PAID reimbursement");
        }

        reimbursement.setStatus(ReimbursementStatus.CANCELLED);
        Reimbursement savedReimbursement = reimbursementRepository.save(reimbursement);
        
        log.info("Cancelled Reimbursement {}", reimbursement.getReimbursementNo());
        
        return reimbursementMapper.entityToResponse(savedReimbursement);
    }
}
