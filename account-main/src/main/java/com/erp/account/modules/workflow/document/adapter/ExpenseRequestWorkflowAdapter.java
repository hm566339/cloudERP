package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.expense.dto.ExpenseRequestApproveRequest;
import com.erp.account.modules.expense.dto.ExpenseRequestRejectRequest;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.expense.service.ExpenseRequestService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ExpenseRequestWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "EXPENSE_REQUEST";
    private final ExpenseRequestRepository repository;
    private final ExpenseRequestService service;

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
        public String getDocumentNumber() { return request.getId().toString(); }
        public BigDecimal getAmount() { return request.getRequestedAmount(); }
        public UUID getOwnerId() { return request.getRequesterId(); }
        public void onWorkflowSubmitted() { service.submitExpenseRequest(getCompanyId(), request.getId()); }
        public void onWorkflowApproved() {
            service.approveExpenseRequest(getCompanyId(), request.getId(), ExpenseRequestApproveRequest.builder()
                    .approvedAmount(request.getRequestedAmount()).remarks("Approved by workflow").build());
        }
        public void onWorkflowRejected() {
            service.rejectExpenseRequest(getCompanyId(), request.getId(), ExpenseRequestRejectRequest.builder()
                    .reason("Rejected by workflow").build());
        }
        public void onWorkflowCancelled() { service.cancelExpenseRequest(getCompanyId(), request.getId()); }
    }
}
