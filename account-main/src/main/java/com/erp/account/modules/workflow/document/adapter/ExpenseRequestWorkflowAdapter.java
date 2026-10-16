package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import com.erp.account.security.CurrentUserContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ExpenseRequestWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "EXPENSE_REQUEST";
    private final ExpenseRequestRepository repository;

    @Override
    public String getDocumentType() { return DOCUMENT_TYPE; }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(ExpenseRequestDocument::new).orElse(null);
    }

    private final class ExpenseRequestDocument implements WorkflowDocument {
        private final ExpenseRequest request;
        private ExpenseRequestDocument(ExpenseRequest request) { this.request = request; }
        public UUID getId() { return request.getId(); }
        public UUID getCompanyId() { return request.getCompany() == null ? null : request.getCompany().getId(); }
        public String getDocumentType() { return DOCUMENT_TYPE; }
        public String getDocumentNumber() { return request.getRequestNumber() != null ? request.getRequestNumber() : request.getId().toString(); }
        public BigDecimal getAmount() { return request.getRequestedAmount(); }
        public UUID getOwnerId() { return request.getRequesterId(); }

        @Transactional
        public void onWorkflowSubmitted() {
            request.setStatus(ExpenseRequestStatus.PENDING_APPROVAL);
            request.setApprovalStatus(ExpenseRequestStatus.PENDING_APPROVAL);
            repository.save(request);
        }

        @Transactional
        public void onWorkflowApproved() {
            request.setStatus(ExpenseRequestStatus.APPROVED);
            request.setApprovalStatus(ExpenseRequestStatus.APPROVED);
            if (request.getApprovedAmount() == null) {
                request.setApprovedAmount(request.getRequestedAmount());
            }
            request.setApprovedBy(CurrentUserContext.getUserId());
            request.setApprovedAt(LocalDateTime.now());
            repository.save(request);
        }

        @Transactional
        public void onWorkflowRejected() {
            request.setStatus(ExpenseRequestStatus.REJECTED);
            request.setApprovalStatus(ExpenseRequestStatus.REJECTED);
            request.setRejectedBy(CurrentUserContext.getUserId());
            request.setRejectedAt(LocalDateTime.now());
            repository.save(request);
        }

        @Transactional
        public void onWorkflowCancelled() {
            request.setStatus(ExpenseRequestStatus.CANCELLED);
            request.setApprovalStatus(ExpenseRequestStatus.CANCELLED);
            repository.save(request);
        }

        @Transactional
        public void onWorkflowReturned() {
            request.setStatus(ExpenseRequestStatus.DRAFT);
            request.setApprovalStatus(ExpenseRequestStatus.DRAFT);
            repository.save(request);
        }
    }
}

