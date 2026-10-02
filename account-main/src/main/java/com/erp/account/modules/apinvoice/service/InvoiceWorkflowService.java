package com.erp.account.modules.apinvoice.service;

import com.erp.account.common.exception.InvalidInvoiceStatusException;
import com.erp.account.common.exception.InvoiceApprovalException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.util.TenantUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
public class InvoiceWorkflowService {

    public void submitForApproval(ApInvoice invoice) {
        requireStatus(invoice, InvoiceStatus.DRAFT, InvoiceStatus.PENDING_APPROVAL);
        invoice.setStatus(InvoiceStatus.PENDING_APPROVAL);
        log.info("AP invoice {} submitted for approval", invoice.getInvoiceNo());
    }

    public void approve(ApInvoice invoice) {
        if (invoice.getStatus() != InvoiceStatus.PENDING_APPROVAL) {
            throw new InvoiceApprovalException("Invoice must be PENDING_APPROVAL to approve", "INVALID_APPROVAL_STATUS");
        }
        invoice.setStatus(InvoiceStatus.APPROVED);
        invoice.setApprovedBy(TenantUtils.getCurrentUserId());
        invoice.setApprovedAt(LocalDateTime.now());
    }

    public void reject(ApInvoice invoice) {
        if (invoice.getStatus() != InvoiceStatus.PENDING_APPROVAL) {
            throw new InvoiceApprovalException("Invoice must be PENDING_APPROVAL to reject", "INVALID_REJECTION_STATUS");
        }
        invoice.setStatus(InvoiceStatus.REJECTED);
    }

    public void markPosted(ApInvoice invoice) {
        invoice.setGlPostingStatus(PostingStatus.POSTED);
        invoice.setGlPostingTime(LocalDateTime.now());
        invoice.setStatus(InvoiceStatus.POSTED);
    }

    public void markPostingFailed(ApInvoice invoice) {
        invoice.setGlPostingStatus(PostingStatus.FAILED);
    }

    public void cancel(ApInvoice invoice) {
        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getStatus() == InvoiceStatus.PARTIALLY_PAID) {
            throw new InvalidInvoiceStatusException(invoice.getStatus().name(), "CANCELLED", "CANNOT_CANCEL_PAID_INVOICE");
        }
        if (invoice.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new InvalidInvoiceStatusException(invoice.getStatus().name(), "CANCELLED", "POSTED invoices are immutable and cannot be cancelled directly. Please create a Debit Note (Reverse Entry).");
        }
        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoice.setGlPostingStatus(PostingStatus.CANCELLED);
    }

    public void reverse(ApInvoice invoice) {
        if (invoice.getStatus() != InvoiceStatus.POSTED) {
            throw new InvalidInvoiceStatusException(invoice.getStatus().name(), "REVERSED", "Only POSTED invoices can be reversed");
        }
        invoice.setStatus(InvoiceStatus.REVERSED);
        invoice.setGlPostingStatus(PostingStatus.REVERSED);
    }

    public void voidInvoice(ApInvoice invoice) {
        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getStatus() == InvoiceStatus.PARTIALLY_PAID || invoice.getStatus() == InvoiceStatus.POSTED) {
            throw new InvalidInvoiceStatusException(invoice.getStatus().name(), "VOIDED", "Cannot void paid or posted invoices");
        }
        invoice.setStatus(InvoiceStatus.VOIDED);
    }

    public void writeOff(ApInvoice invoice) {
        if (invoice.getStatus() != InvoiceStatus.POSTED && invoice.getStatus() != InvoiceStatus.PARTIALLY_PAID) {
            throw new InvalidInvoiceStatusException(invoice.getStatus().name(), "WRITTEN_OFF", "Only POSTED or PARTIALLY_PAID invoices can be written off");
        }
        invoice.setStatus(InvoiceStatus.WRITTEN_OFF);
    }

    private void requireStatus(ApInvoice invoice, InvoiceStatus expected, InvoiceStatus target) {
        if (invoice.getStatus() != expected) {
            throw new InvalidInvoiceStatusException(invoice.getStatus().name(), target.name(), "INVALID_WORKFLOW_STATUS");
        }
    }
}
