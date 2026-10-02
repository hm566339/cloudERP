package com.erp.account.modules.creditnote.service;

import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.enums.DocumentStatus;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.creditnote.dto.request.CreditNoteRequest;
import com.erp.account.modules.creditnote.entity.CreditNote;
import com.erp.account.modules.creditnote.repository.CreditNoteRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreditNoteValidationService {

    private final CreditNoteRepository creditNoteRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final AccountingValidationService accountingValidationService;

    public void validateForCreate(CreditNoteRequest request, SalesInvoice invoice, UUID companyId) {
        validateRequest(request);
        validateDuplicateNumber(request.getCreditNoteNo(), companyId, null);
        validateInvoice(invoice, companyId);
        validatePostingPeriod(request, companyId);
        validateAccounts(request, companyId);
        validateAmount(request, invoice);
    }

    public void validateForUpdate(CreditNote creditNote, CreditNoteRequest request, SalesInvoice invoice, UUID companyId) {
        if (creditNote.getStatus() != DocumentStatus.DRAFT) {
            throw new PaymentValidationException("Only DRAFT credit notes can be updated.");
        }
        validateRequest(request);
        validateDuplicateNumber(request.getCreditNoteNo(), companyId, creditNote.getId());
        validateInvoice(invoice, companyId);
        validatePostingPeriod(request, companyId);
        validateAccounts(request, companyId);
        validateAmount(request, invoice);
    }

    public void validateSubmit(CreditNote creditNote) {
        if (creditNote.getStatus() != DocumentStatus.DRAFT) {
            throw new PaymentValidationException("Only DRAFT credit notes can be submitted.");
        }
    }

    public void validateApprove(CreditNote creditNote) {
        if (creditNote.getStatus() != DocumentStatus.SUBMITTED) {
            throw new PaymentValidationException("Only SUBMITTED credit notes can be approved.");
        }
    }

    public void validateReject(CreditNote creditNote) {
        if (creditNote.getStatus() != DocumentStatus.SUBMITTED) {
            throw new PaymentValidationException("Only SUBMITTED credit notes can be rejected.");
        }
    }

    public void validateDelete(CreditNote creditNote) {
        if (creditNote.getStatus() != DocumentStatus.DRAFT) {
            throw new PaymentValidationException("Only DRAFT credit notes can be deleted.");
        }
    }

    public void validateCancel(CreditNote creditNote) {
        if (creditNote.getStatus() != DocumentStatus.REVERSED && creditNote.getStatus() != DocumentStatus.DRAFT) {
            throw new PaymentValidationException("Credit note must be DRAFT or REVERSED before cancellation.");
        }
        if (creditNote.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Cannot cancel a posted credit note. Reverse it first.");
        }
    }

    public void validatePostingRules(CreditNote creditNote) {
        if (creditNote.getStatus() != DocumentStatus.APPROVED) {
            throw new PaymentValidationException("Only APPROVED credit notes can be posted.");
        }
        if (creditNote.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Credit note is already posted.");
        }
        accountingValidationService.validatePostingDate(creditNote.getNoteDate(), creditNote.getCompany().getId());
        validatePostingAccount(creditNote.getReceivableAccountId(), creditNote.getCompany().getId(), "Receivable");
        validatePostingAccount(creditNote.getRevenueAdjustmentAccountId(), creditNote.getCompany().getId(), "Revenue adjustment");
    }

    public void validateReverse(CreditNote creditNote) {
        if (creditNote.getGlPostingStatus() != PostingStatus.POSTED || creditNote.getGlJournalEntryId() == null) {
            throw new PaymentValidationException("Only posted credit notes can be reversed.");
        }
    }

    private void validateRequest(CreditNoteRequest request) {
        if (request.getSalesInvoiceId() == null) {
            throw new PaymentValidationException("Sales invoice ID is required.");
        }
        if (request.getCreditNoteNo() == null || request.getCreditNoteNo().isBlank()) {
            throw new PaymentValidationException("Credit note number is required.");
        }
        if (request.getNoteDate() == null) {
            throw new PaymentValidationException("Credit note date is required.");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new PaymentValidationException("Credit note amount must be greater than zero.");
        }
        if (request.getReceivableAccountId() == null) {
            throw new PaymentValidationException("Receivable account is required.");
        }
        if (request.getRevenueAdjustmentAccountId() == null) {
            throw new PaymentValidationException("Revenue adjustment account is required.");
        }
    }

    private void validateDuplicateNumber(String creditNoteNo, UUID companyId, UUID currentId) {
        boolean exists = currentId == null
                ? creditNoteRepository.existsByCompanyIdAndCreditNoteNoAndIsDeletedFalse(companyId, creditNoteNo)
                : creditNoteRepository.existsByCompanyIdAndCreditNoteNoAndIdNotAndIsDeletedFalse(companyId, creditNoteNo, currentId);
        if (exists) {
            throw new PaymentValidationException("Credit note number already exists: " + creditNoteNo);
        }
    }

    private void validateInvoice(SalesInvoice invoice, UUID companyId) {
        if (!companyId.equals(invoice.getCompanyId())) {
            throw new PaymentValidationException("Invoice does not belong to the requested company.");
        }
        if (invoice.getStatus() != InvoiceStatus.POSTED && invoice.getStatus() != InvoiceStatus.PARTIALLY_PAID) {
            throw new PaymentValidationException("Credit note can be created only for POSTED or PARTIALLY_PAID invoices.");
        }
        if (invoice.getCustomer() != null && !Boolean.TRUE.equals(invoice.getCustomer().getIsActive())) {
            throw new PaymentValidationException("Customer is inactive.");
        }
    }

    private void validatePostingPeriod(CreditNoteRequest request, UUID companyId) {
        accountingValidationService.validatePostingDate(request.getNoteDate(), companyId);
    }

    private void validateAccounts(CreditNoteRequest request, UUID companyId) {
        ChartOfAccount receivableAccount = validatePostingAccount(request.getReceivableAccountId(), companyId, "Receivable");
        if (receivableAccount.getGroup() != null) {
            if (!"AST-AR".equals(receivableAccount.getGroup().getCode())) {
                throw new PaymentValidationException("Receivable account must be an Accounts Receivable (AR) account.");
            }
        }
        
        ChartOfAccount revenueAccount = validatePostingAccount(request.getRevenueAdjustmentAccountId(), companyId, "Revenue adjustment");
        if (revenueAccount.getGroup() != null && revenueAccount.getGroup().getCategory() != null) {
            if (!"INC".equals(revenueAccount.getGroup().getCategory().getCode())) {
                throw new PaymentValidationException("Revenue adjustment account must belong to Income/Revenue category.");
            }
        }
    }

    private ChartOfAccount validatePostingAccount(UUID accountId, UUID companyId, String purpose) {
        ChartOfAccount account = chartOfAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(accountId, companyId)
                .orElseThrow(() -> new PaymentValidationException(purpose + " account not found: " + accountId));
        if (!Boolean.TRUE.equals(account.getIsActive()) || !Boolean.TRUE.equals(account.getPostingAllowed())) {
            throw new PaymentValidationException(purpose + " account must be active and posting allowed.");
        }
        return account;
    }

    private void validateAmount(CreditNoteRequest request, SalesInvoice invoice) {
        BigDecimal total = creditNoteTotal(request.getAmount(), request.getGstAmount());
        if (total.compareTo(defaultAmount(invoice.getOutstandingAmount())) > 0) {
            throw new PaymentValidationException("Credit note total cannot exceed outstanding invoice amount.");
        }
    }

    public BigDecimal creditNoteTotal(BigDecimal amount, BigDecimal gstAmount) {
        return defaultAmount(amount).add(defaultAmount(gstAmount));
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
