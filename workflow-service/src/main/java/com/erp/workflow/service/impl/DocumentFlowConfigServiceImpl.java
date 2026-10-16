package com.erp.workflow.service.impl;

import com.erp.workflow.dto.flow.*;
import com.erp.workflow.entity.DocumentFlowConfiguration;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.repository.DocumentFlowConfigRepository;
import com.erp.workflow.service.DocumentFlowConfigService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DocumentFlowConfigServiceImpl implements DocumentFlowConfigService {

    private final DocumentFlowConfigRepository repository;
    private final ObjectMapper objectMapper;

    public DocumentFlowConfigServiceImpl(DocumentFlowConfigRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentFlowConfigDto getFlowConfig(UUID companyId, String moduleName) {
        String safeModule = normalizeModuleName(moduleName);
        if (companyId != null) {
            Optional<DocumentFlowConfiguration> configOpt = repository
                    .findByCompanyIdAndModuleNameAndIsActiveTrueAndIsDeletedFalse(companyId, safeModule);
            if (configOpt.isPresent()) {
                return toDto(configOpt.get());
            }
        }
        return getDefaultFlowConfig(companyId, safeModule);
    }

    @Override
    @Transactional
    public DocumentFlowConfigDto saveFlowConfig(UUID companyId, DocumentFlowConfigDto dto) {
        if (companyId == null) {
            throw new WorkflowValidationException("Company ID is required to configure document flow");
        }
        if (!StringUtils.hasText(dto.getModuleName())) {
            throw new WorkflowValidationException("Module name is required");
        }
        String safeModule = normalizeModuleName(dto.getModuleName());
        String flowName = StringUtils.hasText(dto.getFlowName()) ? dto.getFlowName().trim() : "Default " + safeModule + " Flow";

        DocumentFlowConfiguration entity = repository
                .findByCompanyIdAndModuleNameAndFlowNameAndIsDeletedFalse(companyId, safeModule, flowName)
                .orElse(DocumentFlowConfiguration.builder()
                        .companyId(companyId)
                        .moduleName(safeModule)
                        .flowName(flowName)
                        .build());

        entity.setDescription(dto.getDescription());
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        entity.setIsDefault(dto.getIsDefault() != null ? dto.getIsDefault() : false);

        try {
            entity.setFlowData(objectMapper.writeValueAsString(dto.getFlowData()));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize document flow data for company {}", companyId, e);
            throw new WorkflowValidationException("Invalid flow data structure: " + e.getMessage());
        }

        DocumentFlowConfiguration saved = repository.save(entity);
        log.info("Saved document flow configuration {} for module {} and company {}", saved.getId(), safeModule, companyId);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentFlowTabsResponse getTabs(UUID companyId, String moduleName) {
        String safeModule = normalizeModuleName(moduleName);
        DocumentFlowConfigDto config = getFlowConfig(companyId, safeModule);
        boolean isCustom = config.getId() != null;

        DocumentFlowDataDto data = config.getFlowData();
        List<DocumentFlowNodeDto> nodes = data != null && data.getNodes() != null ? data.getNodes() : Collections.emptyList();
        List<DocumentFlowTransitionDto> transitions = data != null && data.getTransitions() != null ? data.getTransitions() : Collections.emptyList();

        Map<String, List<DocumentFlowTransitionDto>> transitionMap = transitions.stream()
                .filter(DocumentFlowTransitionDto::isAllowed)
                .collect(Collectors.groupingBy(t -> t.getSourceDocType().toUpperCase()));

        List<DocumentFlowTabItemDto> tabItems = nodes.stream()
                .filter(DocumentFlowNodeDto::isEnabled)
                .sorted(Comparator.comparingInt(n -> n.getOrderIndex() != null ? n.getOrderIndex() : 0))
                .map(node -> {
                    String docType = node.getDocumentType() != null ? node.getDocumentType().toUpperCase() : "";
                    List<DocumentFlowTransitionDto> allowedNext = transitionMap.getOrDefault(docType, Collections.emptyList());
                    return DocumentFlowTabItemDto.builder()
                            .key(node.getTabKey())
                            .label(node.getDisplayName())
                            .documentType(docType)
                            .path(node.getRoutePath())
                            .icon(node.getIconName())
                            .order(node.getOrderIndex() != null ? node.getOrderIndex() : 0)
                            .enabled(node.isEnabled())
                            .requiredFeature(node.getRequiredFeature())
                            .requiredPermission(node.getRequiredPermission())
                            .allowedRoles(node.getAllowedRoles())
                            .allowedNextTransitions(allowedNext)
                            .build();
                })
                .collect(Collectors.toList());

        return DocumentFlowTabsResponse.builder()
                .companyId(companyId)
                .moduleName(safeModule)
                .flowName(config.getFlowName())
                .isCustomFlow(isCustom)
                .tabs(tabItems)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentFlowTransitionDto> getAllowedTransitions(UUID companyId, String sourceDocType) {
        if (!StringUtils.hasText(sourceDocType)) return Collections.emptyList();
        String safeSource = sourceDocType.trim().toUpperCase();

        // Determine module from sourceDocType
        String module = guessModuleForDocType(safeSource);
        DocumentFlowConfigDto config = getFlowConfig(companyId, module);
        if (config == null || config.getFlowData() == null || config.getFlowData().getTransitions() == null) {
            return Collections.emptyList();
        }

        return config.getFlowData().getTransitions().stream()
                .filter(t -> t.isAllowed() && safeSource.equalsIgnoreCase(t.getSourceDocType()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTransitionAllowed(UUID companyId, String sourceDocType, String targetDocType) {
        if (!StringUtils.hasText(sourceDocType) || !StringUtils.hasText(targetDocType)) return false;
        String safeSource = sourceDocType.trim().toUpperCase();
        String safeTarget = targetDocType.trim().toUpperCase();

        List<DocumentFlowTransitionDto> transitions = getAllowedTransitions(companyId, safeSource);
        return transitions.stream().anyMatch(t -> safeTarget.equalsIgnoreCase(t.getTargetDocType()));
    }

    private DocumentFlowConfigDto toDto(DocumentFlowConfiguration entity) {
        DocumentFlowDataDto flowData = null;
        if (StringUtils.hasText(entity.getFlowData())) {
            try {
                flowData = objectMapper.readValue(entity.getFlowData(), DocumentFlowDataDto.class);
            } catch (Exception e) {
                log.warn("Failed to parse flowData json for entity {}: {}", entity.getId(), e.getMessage());
            }
        }
        if (flowData == null) {
            flowData = DocumentFlowDataDto.builder().build();
        }

        return DocumentFlowConfigDto.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .moduleName(entity.getModuleName())
                .flowName(entity.getFlowName())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .isDefault(entity.getIsDefault())
                .flowData(flowData)
                .build();
    }

    private String normalizeModuleName(String moduleName) {
        if (!StringUtils.hasText(moduleName)) return "SALES";
        String upper = moduleName.trim().toUpperCase();
        if ("ACCOUNT".equals(upper) || "SALES_CRM".equals(upper)) return "SALES";
        return upper;
    }

    private String guessModuleForDocType(String docType) {
        switch (docType) {
            case "QUOTATION":
            case "PROFORMA_INVOICE":
            case "SALES_ORDER":
            case "DELIVERY_CHALLAN":
            case "SALES_INVOICE":
            case "RECEIPT_VOUCHER":
                return "SALES";
            case "PURCHASE_REQUISITION":
            case "RFQ":
            case "SUPPLIER_QUOTATION":
            case "PURCHASE_ORDER":
            case "GOODS_RECEIPT":
            case "AP_INVOICE":
            case "AP_PAYMENT":
                return "PURCHASE";
            case "STOCK_TRANSFER":
            case "STOCK_ADJUSTMENT":
            case "STOCK_MOVEMENT":
            case "OPENING_STOCK":
            case "STOCK_RESERVATION":
                return "INVENTORY";
            case "EXPENSE_REQUEST":
            case "EXPENSE":
            case "REIMBURSEMENT":
                return "EXPENSES";
            default:
                return "SALES";
        }
    }

    public DocumentFlowConfigDto getDefaultFlowConfig(UUID companyId, String moduleName) {
        switch (moduleName) {
            case "PURCHASE":
                return buildDefaultPurchaseFlow(companyId);
            case "INVENTORY":
                return buildDefaultInventoryFlow(companyId);
            case "EXPENSES":
            case "EXPENSE":
                return buildDefaultExpenseFlow(companyId);
            case "SALES":
            default:
                return buildDefaultSalesFlow(companyId);
        }
    }

    private DocumentFlowConfigDto buildDefaultSalesFlow(UUID companyId) {
        List<DocumentFlowNodeDto> nodes = List.of(
                DocumentFlowNodeDto.builder().documentType("QUOTATION").displayName("Quotations").tabKey("quotations").routePath("/accounts/transactions/quotations").iconName("FileText").orderIndex(1).isEnabled(true).requiredFeature("QUOTATIONS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("PROFORMA_INVOICE").displayName("Proforma Invoices (PI)").tabKey("proforma").routePath("/accounts/transactions/proforma-invoices").iconName("Clock").orderIndex(2).isEnabled(true).requiredFeature("PROFORMA_INVOICES").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("SALES_ORDER").displayName("Sales Orders").tabKey("orders").routePath("/accounts/transactions/sales-orders").iconName("ShoppingCart").orderIndex(3).isEnabled(true).requiredFeature("SALES_ORDERS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("DELIVERY_CHALLAN").displayName("Delivery Challans").tabKey("delivery-challans").routePath("/accounts/transactions/delivery-challans").iconName("Truck").orderIndex(4).isEnabled(true).requiredFeature("DELIVERY_CHALLANS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("SALES_INVOICE").displayName("Sales Invoices").tabKey("sales-invoices").routePath("/accounts/transactions/sales").iconName("FileText").orderIndex(5).isEnabled(true).requiredFeature("SALES_INVOICES").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("RECEIPT_VOUCHER").displayName("Receipt Vouchers").tabKey("receipt-vouchers").routePath("/accounts/transactions/receipts").iconName("Receipt").orderIndex(6).isEnabled(true).requiredFeature("RECEIPT_VOUCHERS").requiredPermission("READ").build()
        );

        List<DocumentFlowTransitionDto> transitions = List.of(
                DocumentFlowTransitionDto.builder().sourceDocType("QUOTATION").targetDocType("PROFORMA_INVOICE").actionName("Create Proforma Invoice").buttonLabel("Convert to PI").isAllowed(true).requiresApproval(true).conversionEndpoint("/api/account/v1/proforma-invoices/from-quotation/{id}").requiredSourceStatuses(List.of("ACCEPTED", "APPROVED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("QUOTATION").targetDocType("SALES_ORDER").actionName("Create Sales Order").buttonLabel("Create Order").isAllowed(true).requiresApproval(true).autoConvert(false).conversionEndpoint("/api/account/sales/orders/from-quotation/{id}").requiredSourceStatuses(List.of("ACCEPTED", "APPROVED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("QUOTATION").targetDocType("SALES_INVOICE").actionName("Create Sales Invoice").buttonLabel("Create Invoice").isAllowed(true).requiresApproval(true).conversionEndpoint("/api/account/sales/invoices/from-quotation/{id}").requiredSourceStatuses(List.of("ACCEPTED", "APPROVED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("PROFORMA_INVOICE").targetDocType("SALES_ORDER").actionName("Convert to Sales Order").buttonLabel("Create Order").isAllowed(true).requiresApproval(false).conversionEndpoint("/api/account/sales/orders/from-proforma-invoice/{id}").requiredSourceStatuses(List.of("CONFIRMED", "PARTIALLY_PAID", "PAID")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("SALES_ORDER").targetDocType("DELIVERY_CHALLAN").actionName("Create Delivery Challan").buttonLabel("Create Challan").isAllowed(true).requiresApproval(false).conversionEndpoint("/api/account/delivery-challans/from-sales-order").requiredSourceStatuses(List.of("CONFIRMED", "APPROVED", "FULFILLED", "PARTIALLY_DELIVERED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("SALES_ORDER").targetDocType("SALES_INVOICE").actionName("Create Sales Invoice").buttonLabel("Create Invoice").isAllowed(true).requiresApproval(false).conversionEndpoint("/api/account/sales/invoices/from-sales-order/{id}").requiredSourceStatuses(List.of("CONFIRMED", "APPROVED", "FULFILLED", "PARTIALLY_DELIVERED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("DELIVERY_CHALLAN").targetDocType("SALES_INVOICE").actionName("Create Sales Invoice").buttonLabel("Create Invoice").isAllowed(true).requiresApproval(false).conversionEndpoint("/api/account/sales/invoices/from-delivery-challan/{id}").requiredSourceStatuses(List.of("DELIVERED", "APPROVED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("SALES_INVOICE").targetDocType("RECEIPT_VOUCHER").actionName("Record Receipt").buttonLabel("Record Payment").isAllowed(true).requiresApproval(false).conversionEndpoint("/api/account/v1/receipt-vouchers/from-invoice/{id}").requiredSourceStatuses(List.of("POSTED", "PARTIALLY_PAID")).build()
        );

        return DocumentFlowConfigDto.builder()
                .companyId(companyId)
                .moduleName("SALES")
                .flowName("Standard Sales Flow")
                .description("Default end-to-end sales lifecycle: Quotation -> PI -> Order -> Challan -> Invoice -> Receipt")
                .isActive(true)
                .isDefault(true)
                .flowData(DocumentFlowDataDto.builder().nodes(nodes).transitions(transitions).build())
                .build();
    }

    private DocumentFlowConfigDto buildDefaultPurchaseFlow(UUID companyId) {
        List<DocumentFlowNodeDto> nodes = List.of(
                DocumentFlowNodeDto.builder().documentType("PURCHASE_REQUISITION").displayName("Purchase Requisitions").tabKey("requisitions").routePath("/accounts/transactions/purchase-requisitions").iconName("ClipboardList").orderIndex(1).isEnabled(true).requiredFeature("PURCHASE_REQUISITIONS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("RFQ").displayName("RFQs").tabKey("rfqs").routePath("/accounts/transactions/rfqs").iconName("FileSearch").orderIndex(2).isEnabled(true).requiredFeature("RFQS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("SUPPLIER_QUOTATION").displayName("Supplier Quotes").tabKey("supplier-quotes").routePath("/accounts/transactions/purchase-quotations").iconName("FileText").orderIndex(3).isEnabled(true).requiredFeature("SUPPLIER_QUOTATIONS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("PURCHASE_ORDER").displayName("Purchase Orders").tabKey("purchase-orders").routePath("/accounts/transactions/purchase-orders").iconName("ShoppingCart").orderIndex(4).isEnabled(true).requiredFeature("PURCHASE_ORDERS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("GOODS_RECEIPT").displayName("Goods Receipts").tabKey("goods-receipts").routePath("/accounts/transactions/goods-receipts").iconName("Truck").orderIndex(5).isEnabled(true).requiredFeature("GOODS_RECEIPTS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("AP_INVOICE").displayName("Purchase Invoices").tabKey("purchase-invoices").routePath("/accounts/transactions/purchase").iconName("Receipt").orderIndex(6).isEnabled(true).requiredFeature("AP_INVOICES").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("AP_PAYMENT").displayName("Payments").tabKey("payments").routePath("/accounts/transactions/payments").iconName("CreditCard").orderIndex(7).isEnabled(true).requiredFeature("AP_PAYMENTS").requiredPermission("READ").build()
        );

        List<DocumentFlowTransitionDto> transitions = List.of(
                DocumentFlowTransitionDto.builder().sourceDocType("PURCHASE_REQUISITION").targetDocType("RFQ").actionName("Create RFQ").buttonLabel("Create RFQ").isAllowed(true).requiresApproval(true).conversionEndpoint("/api/account/v1/rfqs").requiredSourceStatuses(List.of("APPROVED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("PURCHASE_REQUISITION").targetDocType("PURCHASE_ORDER").actionName("Create PO").buttonLabel("Create Order").isAllowed(true).requiresApproval(true).conversionEndpoint("/api/account/purchase/orders/from-requisition/{id}").requiredSourceStatuses(List.of("APPROVED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("RFQ").targetDocType("SUPPLIER_QUOTATION").actionName("Receive Quote").buttonLabel("Add Quote").isAllowed(true).requiresApproval(false).conversionEndpoint("/api/account/v1/supplier-quotations").requiredSourceStatuses(List.of("SENT", "RESPONSE_RECEIVED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("SUPPLIER_QUOTATION").targetDocType("PURCHASE_ORDER").actionName("Create PO").buttonLabel("Award & Create PO").isAllowed(true).requiresApproval(true).conversionEndpoint("/api/account/purchase/orders/from-quotation/{id}").requiredSourceStatuses(List.of("AWARDED", "APPROVED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("PURCHASE_ORDER").targetDocType("GOODS_RECEIPT").actionName("Create GRN").buttonLabel("Receive Goods").isAllowed(true).requiresApproval(true).conversionEndpoint("/api/account/goods-receipts/from-po/{id}").requiredSourceStatuses(List.of("APPROVED", "SENT", "PARTIALLY_RECEIVED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("GOODS_RECEIPT").targetDocType("AP_INVOICE").actionName("Create AP Invoice").buttonLabel("Create Bill").isAllowed(true).requiresApproval(false).conversionEndpoint("/api/account/v1/ap-invoices/from-grn/{id}").requiredSourceStatuses(List.of("CONFIRMED", "POSTED")).build(),
                DocumentFlowTransitionDto.builder().sourceDocType("AP_INVOICE").targetDocType("AP_PAYMENT").actionName("Make Payment").buttonLabel("Pay Bill").isAllowed(true).requiresApproval(false).conversionEndpoint("/api/account/v1/ap-payments").requiredSourceStatuses(List.of("POSTED", "PARTIALLY_PAID")).build()
        );

        return DocumentFlowConfigDto.builder()
                .companyId(companyId)
                .moduleName("PURCHASE")
                .flowName("Standard Procurement Flow")
                .description("Default procurement lifecycle: Requisition -> RFQ -> Supplier Quote -> PO -> GRN -> Invoice -> Payment")
                .isActive(true)
                .isDefault(true)
                .flowData(DocumentFlowDataDto.builder().nodes(nodes).transitions(transitions).build())
                .build();
    }

    private DocumentFlowConfigDto buildDefaultInventoryFlow(UUID companyId) {
        List<DocumentFlowNodeDto> nodes = List.of(
                DocumentFlowNodeDto.builder().documentType("STOCK_TRANSFER").displayName("Stock Transfers").tabKey("transfers").routePath("/inventory/transfers").iconName("Truck").orderIndex(1).isEnabled(true).requiredFeature("STOCK_TRANSFERS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("STOCK_ADJUSTMENT").displayName("Stock Adjustments").tabKey("adjustments").routePath("/inventory/adjustments").iconName("FileSpreadsheet").orderIndex(2).isEnabled(true).requiredFeature("STOCK_ADJUSTMENTS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("OPENING_STOCK").displayName("Opening Stock").tabKey("opening-stock").routePath("/inventory/opening-stock").iconName("Book").orderIndex(3).isEnabled(true).requiredFeature("OPENING_STOCK").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("STOCK_RESERVATION").displayName("Stock Reservations").tabKey("reservations").routePath("/inventory/reservations").iconName("Clock").orderIndex(4).isEnabled(true).requiredFeature("STOCK_RESERVATIONS").requiredPermission("READ").build()
        );

        return DocumentFlowConfigDto.builder()
                .companyId(companyId)
                .moduleName("INVENTORY")
                .flowName("Standard Inventory Flow")
                .description("Default inventory operations: Transfers, Adjustments, Opening Stock, Reservations")
                .isActive(true)
                .isDefault(true)
                .flowData(DocumentFlowDataDto.builder().nodes(nodes).transitions(Collections.emptyList()).build())
                .build();
    }

    private DocumentFlowConfigDto buildDefaultExpenseFlow(UUID companyId) {
        List<DocumentFlowNodeDto> nodes = List.of(
                DocumentFlowNodeDto.builder().documentType("EXPENSE_REQUEST").displayName("Expense Requests").tabKey("requests").routePath("/accounts/transactions/expenses/requests").iconName("ClipboardList").orderIndex(1).isEnabled(true).requiredFeature("EXPENSE_REQUESTS").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("EXPENSE").displayName("Expenses").tabKey("expenses").routePath("/accounts/transactions/expenses/expenses").iconName("Receipt").orderIndex(2).isEnabled(true).requiredFeature("EXPENSES").requiredPermission("READ").build(),
                DocumentFlowNodeDto.builder().documentType("REIMBURSEMENT").displayName("Reimbursements").tabKey("reimbursements").routePath("/accounts/transactions/expenses/reimbursements").iconName("CreditCard").orderIndex(3).isEnabled(true).requiredFeature("REIMBURSEMENTS").requiredPermission("READ").build()
        );

        return DocumentFlowConfigDto.builder()
                .companyId(companyId)
                .moduleName("EXPENSES")
                .flowName("Standard Expense Flow")
                .description("Default expense operations: Requests, Expense claims, Reimbursements")
                .isActive(true)
                .isDefault(true)
                .flowData(DocumentFlowDataDto.builder().nodes(nodes).transitions(Collections.emptyList()).build())
                .build();
    }
}
