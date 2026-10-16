package com.erp.inventory.modules.workflow.document;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WorkflowDocumentRegistry {

    private final Map<String, WorkflowDocumentAdapter> adapters = new ConcurrentHashMap<>();

    public WorkflowDocumentRegistry(List<WorkflowDocumentAdapter> adapterList) {
        for (WorkflowDocumentAdapter adapter : adapterList) {
            adapters.put(adapter.getDocumentType().toUpperCase(), adapter);
        }
    }

    public WorkflowDocument load(String documentType, UUID documentId, UUID companyId) {
        if (documentType == null || documentId == null || companyId == null) {
            return null;
        }
        WorkflowDocumentAdapter adapter = adapters.get(documentType.toUpperCase());
        if (adapter == null) {
            throw new IllegalArgumentException("Unsupported workflow document type: " + documentType);
        }
        WorkflowDocument doc = adapter.find(documentId, companyId);
        if (doc != null && !companyId.equals(doc.getCompanyId())) {
            throw new SecurityException("Workflow document belongs to another company");
        }
        return doc;
    }
}
