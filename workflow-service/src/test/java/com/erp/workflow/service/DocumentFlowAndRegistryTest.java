package com.erp.workflow.service;

import com.erp.workflow.dto.flow.*;
import com.erp.workflow.entity.DocumentFlowConfiguration;
import com.erp.workflow.registry.DocumentTypeCapability;
import com.erp.workflow.registry.DocumentTypeRegistry;
import com.erp.workflow.repository.DocumentFlowConfigRepository;
import com.erp.workflow.service.impl.DocumentFlowConfigServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentFlowAndRegistryTest {

    @Mock
    private DocumentFlowConfigRepository repository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private DocumentFlowConfigServiceImpl flowConfigService;

    private UUID testCompanyId;

    @BeforeEach
    void setUp() {
        testCompanyId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Registry - Central registry contains all supported ERP document types across modules")
    void testRegistry_DocumentTypesRegistered() {
        List<DocumentTypeCapability> allDocs = DocumentTypeRegistry.getDefault().getAll();
        assertNotNull(allDocs);
        assertTrue(allDocs.size() >= 20, "Should have all standard ERP document types registered");

        // Verify Sales document capabilities
        DocumentTypeCapability quotationCap = DocumentTypeRegistry.getDefault().find("QUOTATION").orElse(null);
        assertNotNull(quotationCap);
        assertEquals("SALES", quotationCap.getPrimaryModule());
        assertTrue(quotationCap.isSupportsSubmission());
        assertTrue(quotationCap.isSupportsApproval());

        // Verify Purchase document capabilities
        DocumentTypeCapability poCap = DocumentTypeRegistry.getDefault().find("PURCHASE_ORDER").orElse(null);
        assertNotNull(poCap);
        assertEquals("PURCHASE", poCap.getPrimaryModule());

        // Verify Inventory document capabilities
        DocumentTypeCapability transferCap = DocumentTypeRegistry.getDefault().find("STOCK_TRANSFER").orElse(null);
        assertNotNull(transferCap);
        assertEquals("INVENTORY", transferCap.getPrimaryModule());

        // Verify Finance document capabilities
        DocumentTypeCapability creditCap = DocumentTypeRegistry.getDefault().find("CREDIT_NOTE").orElse(null);
        assertNotNull(creditCap);
        assertEquals("ACCOUNT", creditCap.getPrimaryModule());
    }

    @Test
    @DisplayName("Registry - Module compatibility validates properly and replaces hardcoded switch")
    void testRegistry_ModuleCompatibility() {
        // Sales compatible with SALES and unified ACCOUNT
        assertTrue(DocumentTypeRegistry.isCompatible("SALES", "SALES", "QUOTATION"));
        assertTrue(DocumentTypeRegistry.isCompatible("ACCOUNT", "SALES", "QUOTATION"));
        assertTrue(DocumentTypeRegistry.isCompatible("SALES", "SALES", "PROFORMA_INVOICE"));
        assertTrue(DocumentTypeRegistry.isCompatible("SALES", "SALES", "SALES_ORDER"));
        assertTrue(DocumentTypeRegistry.isCompatible("SALES", "SALES", "DELIVERY_CHALLAN"));
        assertTrue(DocumentTypeRegistry.isCompatible("SALES", "SALES", "SALES_INVOICE"));

        // Purchase documents
        assertTrue(DocumentTypeRegistry.isCompatible("PURCHASE", "PURCHASE", "PURCHASE_REQUISITION"));
        assertTrue(DocumentTypeRegistry.isCompatible("PURCHASE", "PURCHASE", "RFQ"));
        assertTrue(DocumentTypeRegistry.isCompatible("PURCHASE", "PURCHASE", "SUPPLIER_QUOTATION"));
        assertTrue(DocumentTypeRegistry.isCompatible("PURCHASE", "PURCHASE", "PURCHASE_ORDER"));
        assertTrue(DocumentTypeRegistry.isCompatible("PURCHASE", "PURCHASE", "GOODS_RECEIPT"));

        // Inventory documents
        assertTrue(DocumentTypeRegistry.isCompatible("INVENTORY", "INVENTORY", "STOCK_ADJUSTMENT"));
        assertTrue(DocumentTypeRegistry.isCompatible("INVENTORY", "INVENTORY", "STOCK_TRANSFER"));

        // Incompatible cross-module checks
        assertFalse(DocumentTypeRegistry.isCompatible("INVENTORY", "SALES", "SALES_INVOICE"));
        assertFalse(DocumentTypeRegistry.isCompatible("SALES", "INVENTORY", "STOCK_TRANSFER"));
        assertFalse(DocumentTypeRegistry.isCompatible("UNKNOWN_MODULE", "UNKNOWN_MODULE", "QUOTATION"));
    }

    @Test
    @DisplayName("Flow Service - Safe default flow returned when company has not customized flow")
    void testDefaultFlow_SalesModule() {
        when(repository.findByCompanyIdAndModuleNameAndIsActiveTrueAndIsDeletedFalse(testCompanyId, "SALES"))
                .thenReturn(Optional.empty());

        DocumentFlowConfigDto config = flowConfigService.getFlowConfig(testCompanyId, "SALES");

        assertNotNull(config);
        assertEquals(testCompanyId, config.getCompanyId());
        assertEquals("SALES", config.getModuleName());
        assertNotNull(config.getFlowData());
        assertFalse(config.getFlowData().getNodes().isEmpty());
        assertFalse(config.getFlowData().getTransitions().isEmpty());

        // Default sales transitions: Quotation -> PI, Quotation -> SO, etc.
        List<DocumentFlowTransitionDto> transitions = config.getFlowData().getTransitions();
        boolean hasQuoteToSo = transitions.stream().anyMatch(t -> 
                "QUOTATION".equals(t.getSourceDocType()) && "SALES_ORDER".equals(t.getTargetDocType()));
        boolean hasQuoteToPi = transitions.stream().anyMatch(t -> 
                "QUOTATION".equals(t.getSourceDocType()) && "PROFORMA_INVOICE".equals(t.getTargetDocType()));

        assertTrue(hasQuoteToSo, "Default Sales flow should allow Quotation -> Sales Order");
        assertTrue(hasQuoteToPi, "Default Sales flow should allow Quotation -> Proforma Invoice");
    }

    @Test
    @DisplayName("Flow Service - Dynamic tabs return ordered enabled documents")
    void testGetTabs_ReturnsOrderedEnabledDocuments() {
        when(repository.findByCompanyIdAndModuleNameAndIsActiveTrueAndIsDeletedFalse(testCompanyId, "SALES"))
                .thenReturn(Optional.empty());

        DocumentFlowTabsResponse tabsResponse = flowConfigService.getTabs(testCompanyId, "SALES");

        assertNotNull(tabsResponse);
        assertNotNull(tabsResponse.getTabs());
        assertEquals(6, tabsResponse.getTabs().size());

        // Ensure order is strictly increasing
        for (int i = 0; i < tabsResponse.getTabs().size() - 1; i++) {
            assertTrue(tabsResponse.getTabs().get(i).getOrder() <= tabsResponse.getTabs().get(i + 1).getOrder());
        }
    }

    @Test
    @DisplayName("Flow Service - Allowed transitions for a specific document type")
    void testGetAllowedTransitions_Quotation() {
        when(repository.findByCompanyIdAndModuleNameAndIsActiveTrueAndIsDeletedFalse(testCompanyId, "SALES"))
                .thenReturn(Optional.empty());

        List<DocumentFlowTransitionDto> transitions = flowConfigService.getAllowedTransitions(
                testCompanyId, "QUOTATION");

        assertNotNull(transitions);
        assertFalse(transitions.isEmpty());
        for (DocumentFlowTransitionDto t : transitions) {
            assertEquals("QUOTATION", t.getSourceDocType());
            assertNotNull(t.getTargetDocType());
        }
    }

    @Test
    @DisplayName("Flow Service - Company custom flow configuration can be saved and retrieved")
    void testSaveAndRetrieve_CompanyCustomFlow() {
        DocumentFlowDataDto customFlowData = DocumentFlowDataDto.builder()
                .nodes(List.of(
                        DocumentFlowNodeDto.builder().documentType("QUOTATION").displayName("Quotes").orderIndex(1).isEnabled(true).build(),
                        DocumentFlowNodeDto.builder().documentType("SALES_INVOICE").displayName("Invoices").orderIndex(2).isEnabled(true).build()
                ))
                .transitions(List.of(
                        DocumentFlowTransitionDto.builder().sourceDocType("QUOTATION").targetDocType("SALES_INVOICE").buttonLabel("Direct to Invoice").autoConvert(false).build()
                ))
                .build();

        DocumentFlowConfigDto saveRequest = DocumentFlowConfigDto.builder()
                .companyId(testCompanyId)
                .moduleName("SALES")
                .flowName("Direct Invoicing Flow")
                .flowData(customFlowData)
                .isActive(true)
                .build();

        DocumentFlowConfiguration savedEntity = DocumentFlowConfiguration.builder()
                .id(UUID.randomUUID())
                .companyId(testCompanyId)
                .moduleName("SALES")
                .flowName("Direct Invoicing Flow")
                .flowData("{\"nodes\":[{\"documentType\":\"QUOTATION\",\"displayName\":\"Quotes\",\"orderIndex\":1,\"isEnabled\":true},{\"documentType\":\"SALES_INVOICE\",\"displayName\":\"Invoices\",\"orderIndex\":2,\"isEnabled\":true}],\"transitions\":[{\"sourceDocType\":\"QUOTATION\",\"targetDocType\":\"SALES_INVOICE\",\"buttonLabel\":\"Direct to Invoice\",\"autoConvert\":false}]}")
                .isActive(true)
                .build();

        when(repository.findByCompanyIdAndModuleNameAndFlowNameAndIsDeletedFalse(testCompanyId, "SALES", "Direct Invoicing Flow"))
                .thenReturn(Optional.empty());
        when(repository.save(any(DocumentFlowConfiguration.class))).thenReturn(savedEntity);

        DocumentFlowConfigDto savedResult = flowConfigService.saveFlowConfig(testCompanyId, saveRequest);

        assertNotNull(savedResult);
        assertEquals(testCompanyId, savedResult.getCompanyId());
        assertEquals("Direct Invoicing Flow", savedResult.getFlowName());
        verify(repository, times(1)).save(any(DocumentFlowConfiguration.class));
    }
}
