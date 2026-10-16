package com.erp.workflow.registry;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Centralized, extensible registry for all ERP document types and their workflow capabilities.
 * Replaces hardcoded switch statements across workflow-service.
 */
@Component
public class DocumentTypeRegistry {

    private final Map<String, DocumentTypeCapability> registry = new ConcurrentHashMap<>();

    public DocumentTypeRegistry() {
        registerDefaultDocumentTypes();
    }

    private void registerDefaultDocumentTypes() {
        // --- SALES MODULE DOCUMENTS ---
        register(DocumentTypeCapability.builder()
                .documentType("QUOTATION")
                .displayName("Sales Quotation")
                .primaryModule("SALES")
                .compatibleModules(List.of("SALES", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("PROFORMA_INVOICE")
                .allowedTargetDocTypes(List.of("PROFORMA_INVOICE", "SALES_ORDER", "SALES_INVOICE"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("PROFORMA_INVOICE")
                .displayName("Proforma Invoice")
                .primaryModule("SALES")
                .compatibleModules(List.of("SALES", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("SALES_ORDER")
                .allowedTargetDocTypes(List.of("SALES_ORDER", "SALES_INVOICE"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("SALES_ORDER")
                .displayName("Sales Order")
                .primaryModule("SALES")
                .compatibleModules(List.of("SALES", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("DELIVERY_CHALLAN")
                .allowedTargetDocTypes(List.of("DELIVERY_CHALLAN", "SALES_INVOICE"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("DELIVERY_CHALLAN")
                .displayName("Delivery Challan")
                .primaryModule("SALES")
                .compatibleModules(List.of("SALES", "ACCOUNT", "INVENTORY"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("SALES_INVOICE")
                .allowedTargetDocTypes(List.of("SALES_INVOICE"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("SALES_INVOICE")
                .displayName("Sales Invoice")
                .primaryModule("SALES")
                .compatibleModules(List.of("SALES", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("RECEIPT_VOUCHER")
                .allowedTargetDocTypes(List.of("RECEIPT_VOUCHER", "CREDIT_NOTE"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("SALES")
                .displayName("Sales Document")
                .primaryModule("SALES")
                .compatibleModules(List.of("SALES", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType("SALES_INVOICE")
                .allowedTargetDocTypes(List.of("SALES_ORDER", "SALES_INVOICE"))
                .build());

        // --- PURCHASE MODULE DOCUMENTS ---
        register(DocumentTypeCapability.builder()
                .documentType("PURCHASE_REQUISITION")
                .displayName("Purchase Requisition")
                .primaryModule("PURCHASE")
                .compatibleModules(List.of("PURCHASE", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("RFQ")
                .allowedTargetDocTypes(List.of("RFQ", "PURCHASE_ORDER"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("RFQ")
                .displayName("Request For Quotation (RFQ)")
                .primaryModule("PURCHASE")
                .compatibleModules(List.of("PURCHASE", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType("SUPPLIER_QUOTATION")
                .allowedTargetDocTypes(List.of("SUPPLIER_QUOTATION"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("SUPPLIER_QUOTATION")
                .displayName("Supplier Quotation")
                .primaryModule("PURCHASE")
                .compatibleModules(List.of("PURCHASE", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("PURCHASE_ORDER")
                .allowedTargetDocTypes(List.of("PURCHASE_ORDER"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("PURCHASE_ORDER")
                .displayName("Purchase Order")
                .primaryModule("PURCHASE")
                .compatibleModules(List.of("PURCHASE", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("GOODS_RECEIPT")
                .allowedTargetDocTypes(List.of("GOODS_RECEIPT", "AP_INVOICE"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("PURCHASE")
                .displayName("Purchase Document")
                .primaryModule("PURCHASE")
                .compatibleModules(List.of("PURCHASE", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType("GOODS_RECEIPT")
                .allowedTargetDocTypes(List.of("GOODS_RECEIPT", "AP_INVOICE"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("GOODS_RECEIPT")
                .displayName("Goods Receipt Note (GRN)")
                .primaryModule("PURCHASE")
                .compatibleModules(List.of("PURCHASE", "ACCOUNT", "INVENTORY"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("AP_INVOICE")
                .allowedTargetDocTypes(List.of("AP_INVOICE"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("AP_INVOICE")
                .displayName("Accounts Payable (Purchase) Invoice")
                .primaryModule("PURCHASE")
                .compatibleModules(List.of("PURCHASE", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("AP_PAYMENT")
                .allowedTargetDocTypes(List.of("AP_PAYMENT", "DEBIT_NOTE"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("AP_PAYMENT")
                .displayName("Accounts Payable Payment")
                .primaryModule("PURCHASE")
                .compatibleModules(List.of("PURCHASE", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        // --- INVENTORY MODULE DOCUMENTS ---
        register(DocumentTypeCapability.builder()
                .documentType("STOCK_TRANSFER")
                .displayName("Stock Transfer")
                .primaryModule("INVENTORY")
                .compatibleModules(List.of("INVENTORY"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("STOCK_ADJUSTMENT")
                .displayName("Stock Adjustment")
                .primaryModule("INVENTORY")
                .compatibleModules(List.of("INVENTORY"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("STOCK_MOVEMENT")
                .displayName("Stock Movement")
                .primaryModule("INVENTORY")
                .compatibleModules(List.of("INVENTORY"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("OPENING_STOCK")
                .displayName("Opening Stock")
                .primaryModule("INVENTORY")
                .compatibleModules(List.of("INVENTORY"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("STOCK_RESERVATION")
                .displayName("Stock Reservation")
                .primaryModule("INVENTORY")
                .compatibleModules(List.of("INVENTORY"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        // --- FINANCE / ACCOUNTING MODULE DOCUMENTS ---
        register(DocumentTypeCapability.builder()
                .documentType("EXPENSE_REQUEST")
                .displayName("Expense Request")
                .primaryModule("EXPENSE")
                .compatibleModules(List.of("EXPENSE", "EXPENSES", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(true)
                .defaultTargetDocType("PAYMENT_VOUCHER")
                .allowedTargetDocTypes(List.of("PAYMENT_VOUCHER", "REIMBURSEMENT"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("EXPENSE")
                .displayName("Expense Claim")
                .primaryModule("EXPENSE")
                .compatibleModules(List.of("EXPENSE", "EXPENSES", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType("PAYMENT_VOUCHER")
                .allowedTargetDocTypes(List.of("PAYMENT_VOUCHER"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("REIMBURSEMENT")
                .displayName("Reimbursement")
                .primaryModule("REIMBURSEMENTS")
                .compatibleModules(List.of("REIMBURSEMENTS", "REIMBURSEMENT", "EXPENSE", "EXPENSES", "ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType("PAYMENT_VOUCHER")
                .allowedTargetDocTypes(List.of("PAYMENT_VOUCHER"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("RECEIPT_VOUCHER")
                .displayName("Receipt Voucher")
                .primaryModule("ACCOUNT")
                .compatibleModules(List.of("ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("PAYMENT_VOUCHER")
                .displayName("Payment Voucher")
                .primaryModule("ACCOUNT")
                .compatibleModules(List.of("ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("JOURNAL_ENTRY")
                .displayName("Journal Entry")
                .primaryModule("ACCOUNT")
                .compatibleModules(List.of("ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("CREDIT_NOTE")
                .displayName("Credit Note")
                .primaryModule("ACCOUNT")
                .compatibleModules(List.of("ACCOUNT", "SALES"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("DEBIT_NOTE")
                .displayName("Debit Note")
                .primaryModule("ACCOUNT")
                .compatibleModules(List.of("ACCOUNT", "PURCHASE"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("FISCAL_YEAR")
                .displayName("Fiscal Year Close")
                .primaryModule("ACCOUNT")
                .compatibleModules(List.of("ACCOUNT"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType(null)
                .allowedTargetDocTypes(Collections.emptyList())
                .build());

        // --- MANUFACTURING MODULE DOCUMENTS ---
        register(DocumentTypeCapability.builder()
                .documentType("BOM")
                .displayName("Bill of Materials (BOM)")
                .primaryModule("MANUFACTURING")
                .compatibleModules(List.of("MANUFACTURING"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType("PRODUCTION_ORDER")
                .allowedTargetDocTypes(List.of("PRODUCTION_ORDER"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("PRODUCTION_ORDER")
                .displayName("Production Order")
                .primaryModule("MANUFACTURING")
                .compatibleModules(List.of("MANUFACTURING"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType("WORK_ORDER")
                .allowedTargetDocTypes(List.of("WORK_ORDER", "PRODUCTION_COMPLETION"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("WORK_ORDER")
                .displayName("Work Order")
                .primaryModule("MANUFACTURING")
                .compatibleModules(List.of("MANUFACTURING"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType("PRODUCTION_COMPLETION")
                .allowedTargetDocTypes(List.of("PRODUCTION_COMPLETION"))
                .build());

        register(DocumentTypeCapability.builder()
                .documentType("PRODUCTION_COMPLETION")
                .displayName("Production Completion")
                .primaryModule("MANUFACTURING")
                .compatibleModules(List.of("MANUFACTURING", "INVENTORY"))
                .supportsWorkflowDefinition(true)
                .supportsSubmission(true)
                .supportsApproval(true)
                .supportsRejection(true)
                .supportsReturn(true)
                .supportsCancellation(true)
                .supportsCallbacks(true)
                .supportsAutomation(false)
                .defaultTargetDocType("GOODS_RECEIPT")
                .allowedTargetDocTypes(List.of("GOODS_RECEIPT"))
                .build());
    }

    public void register(DocumentTypeCapability capability) {
        if (capability != null && StringUtils.hasText(capability.getDocumentType())) {
            registry.put(capability.getDocumentType().toUpperCase(), capability);
        }
    }

    public Optional<DocumentTypeCapability> find(String documentType) {
        if (!StringUtils.hasText(documentType)) return Optional.empty();
        return Optional.ofNullable(registry.get(documentType.toUpperCase()));
    }

    public List<DocumentTypeCapability> getAll() {
        return new ArrayList<>(registry.values());
    }

    public boolean isSupported(String documentType) {
        if (!StringUtils.hasText(documentType)) return false;
        return registry.containsKey(documentType.toUpperCase());
    }

    public boolean isModuleCompatible(String requestedModule, String definitionModule, String documentType) {
        if (!StringUtils.hasText(requestedModule) || !StringUtils.hasText(definitionModule)) {
            return true;
        }
        if (StringUtils.hasText(documentType)) {
            DocumentTypeCapability capability = registry.get(documentType.toUpperCase());
            if (capability != null) {
                boolean reqMatches = capability.getCompatibleModules().stream().anyMatch(requestedModule::equalsIgnoreCase);
                boolean defMatches = capability.getCompatibleModules().stream().anyMatch(definitionModule::equalsIgnoreCase);
                return reqMatches && defMatches;
            }
        }
        return requestedModule.equalsIgnoreCase(definitionModule);
    }

    private static final DocumentTypeRegistry DEFAULT_INSTANCE = new DocumentTypeRegistry();

    public static DocumentTypeRegistry getDefault() {
        return DEFAULT_INSTANCE;
    }

    public static boolean isCompatible(String requestedModule, String definitionModule, String documentType) {
        return DEFAULT_INSTANCE.isModuleCompatible(requestedModule, definitionModule, documentType);
    }
}

