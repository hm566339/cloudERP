package com.erp.account.modules.workflow.document;

import com.erp.account.common.exception.BadRequestException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class WorkflowDocumentRegistry {
    private final Map<String, WorkflowDocumentAdapter> adapters;

    public WorkflowDocumentRegistry(List<WorkflowDocumentAdapter> adapters) {
        this.adapters = adapters.stream().collect(Collectors.toUnmodifiableMap(
                adapter -> adapter.getDocumentType().toUpperCase(), Function.identity()));
    }

    public WorkflowDocument load(String documentType, UUID documentId, UUID companyId) {
        WorkflowDocumentAdapter adapter = adapters.get(documentType.toUpperCase());
        if (adapter == null) {
            throw new BadRequestException("No workflow adapter registered for document type: " + documentType);
        }
        WorkflowDocument document = adapter.find(documentId, companyId);
        if (document == null) {
            throw new BadRequestException("Workflow document was not found: " + documentId);
        }
        if (!companyId.equals(document.getCompanyId())) {
            throw new BadRequestException("Workflow document belongs to another company");
        }
        return document;
    }
}
