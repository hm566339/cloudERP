package com.erp.manufacturing.workflow;

import com.erp.manufacturing.bom.dto.response.BomResponse;
import com.erp.manufacturing.bom.entity.Bom;
import com.erp.manufacturing.bom.repository.BomRepository;
import com.erp.manufacturing.bom.service.BomServiceImpl;
import com.erp.manufacturing.common.enums.BomStatus;
import com.erp.manufacturing.common.enums.BomType;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.productionorder.service.ProductionOrderServiceImpl;
import com.erp.manufacturing.workflow.client.WorkflowClient;
import com.erp.manufacturing.workflow.controller.WorkflowCallbackController;
import com.erp.manufacturing.workflow.document.BomWorkflowAdapter;
import com.erp.manufacturing.workflow.document.ProductionOrderWorkflowAdapter;
import com.erp.manufacturing.workflow.document.WorkflowDocumentRegistry;
import com.erp.manufacturing.workflow.dto.WorkflowCallbackEventDto;
import com.erp.manufacturing.workflow.dto.WorkflowTransactionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ManufacturingWorkflowLifecycleIntegrationTest {

    private static final String VALID_SECRET = "test-secret-456";

    @Mock private ProductionOrderRepository productionOrderRepository;
    @Mock private BomRepository bomRepository;
    @Mock private WorkflowClient workflowClient;

    private ProductionOrderServiceImpl productionOrderService;
    private BomServiceImpl bomService;
    private WorkflowDocumentRegistry registry;
    private WorkflowCallbackController callbackController;

    private UUID companyA;
    private UUID companyB;
    private UUID orderId;
    private UUID bomId;
    private ProductionOrder order;
    private Bom bom;

    @BeforeEach
    void setUp() {
        companyA = UUID.randomUUID();
        companyB = UUID.randomUUID();
        orderId = UUID.randomUUID();
        bomId = UUID.randomUUID();

        productionOrderService = new ProductionOrderServiceImpl(productionOrderRepository, workflowClient);
        bomService = new BomServiceImpl(bomRepository, null, workflowClient);

        ProductionOrderWorkflowAdapter poAdapter = new ProductionOrderWorkflowAdapter(productionOrderRepository);
        BomWorkflowAdapter bomAdapter = new BomWorkflowAdapter(bomRepository);
        registry = new WorkflowDocumentRegistry(List.of(poAdapter, bomAdapter));

        callbackController = new WorkflowCallbackController(registry);
        ReflectionTestUtils.setField(callbackController, "expectedSecret", VALID_SECRET);

        bom = Bom.builder()
                .companyId(companyA)
                .bomNumber("BOM-2026-001")
                .name("Standard Widget BOM")
                .bomType(BomType.STANDARD)
                .status(BomStatus.DRAFT)
                .isDefault(true)
                .currentRevision(1)
                .build();
        bom.setId(bomId);

        order = ProductionOrder.builder()
                .companyId(companyA)
                .productionOrderNo("PO-2026-001")
                .plannedQuantity(new BigDecimal("50.00"))
                .status(ProductionOrderStatus.DRAFT)
                .build();
        order.setId(orderId);
    }

    @Test
    void bomFullLifecycle_DraftToSubmittedToApproved() {
        when(bomRepository.findByIdAndCompanyId(bomId, companyA)).thenReturn(Optional.of(bom));
        when(bomRepository.findById(bomId)).thenReturn(Optional.of(bom));
        when(bomRepository.save(any(Bom.class))).thenAnswer(i -> i.getArgument(0));

        // 1. Submit for approval
        lenient().when(workflowClient.submitWorkflow(eq(companyA), eq("BOM"), eq(bomId), eq("BOM-2026-001"), any()))
                .thenReturn(WorkflowTransactionDto.builder().id(UUID.randomUUID()).status("PENDING").build());

        // Call adapter onWorkflowSubmitted
        registry.load("BOM", bomId, companyA).onWorkflowSubmitted();
        assertEquals(BomStatus.PENDING_APPROVAL, bom.getStatus());

        // 2. Cannot submit if already pending approval
        assertThrows(IllegalStateException.class, () -> bomService.submitForApproval(bomId, companyA, "duplicate"));

        // 3. Callback arrives with valid secret and APPROVED event
        WorkflowCallbackEventDto approvedEvent = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("BOM")
                .documentId(bomId)
                .companyId(companyA)
                .status("APPROVED")
                .build();

        ResponseEntity<InventoryApiResponse<Void>> callbackResp = callbackController.handleWorkflowCallback(VALID_SECRET, approvedEvent);
        assertEquals(HttpStatus.OK, callbackResp.getStatusCode());
        assertEquals(BomStatus.APPROVED, bom.getStatus());
        assertNotNull(bom.getApprovedAt());
    }

    @Test
    void productionOrderFullLifecycle_DraftToPendingToConfirmedToReleased() {
        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyA)).thenReturn(Optional.of(order));
        when(productionOrderRepository.save(any(ProductionOrder.class))).thenAnswer(i -> i.getArgument(0));

        // 1. Unapproved order CANNOT be released
        assertThrows(IllegalStateException.class, () -> productionOrderService.releaseOrder(orderId, companyA));

        // 2. Submit for approval
        when(workflowClient.submitWorkflow(eq(companyA), eq("PRODUCTION_ORDER"), eq(orderId), eq("PO-2026-001"), any()))
                .thenReturn(WorkflowTransactionDto.builder().id(UUID.randomUUID()).status("PENDING").build());

        ProductionOrder submitted = productionOrderService.submitForApproval(orderId, companyA, "Ready for line 1");
        assertEquals(ProductionOrderStatus.PENDING_APPROVAL, submitted.getStatus());

        // Still cannot release while pending approval
        assertThrows(IllegalStateException.class, () -> productionOrderService.releaseOrder(orderId, companyA));

        // 3. Callback arrives: Approved -> transitions to CONFIRMED
        WorkflowCallbackEventDto approvedEvent = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("PRODUCTION_ORDER")
                .documentId(orderId)
                .companyId(companyA)
                .status("APPROVED")
                .build();

        ResponseEntity<InventoryApiResponse<Void>> callbackResp = callbackController.handleWorkflowCallback(VALID_SECRET, approvedEvent);
        assertEquals(HttpStatus.OK, callbackResp.getStatusCode());
        assertEquals(ProductionOrderStatus.CONFIRMED, order.getStatus());
        assertNotNull(order.getApprovedAt());

        // 4. Release order: Transitions from CONFIRMED -> RELEASED
        ProductionOrder released = productionOrderService.releaseOrder(orderId, companyA);
        assertEquals(ProductionOrderStatus.RELEASED, released.getStatus());
        assertNotNull(released.getReleasedAt());
    }

    @Test
    void productionOrderRejected_TransitionsToCancelled_CannotBeReleased() {
        order.setStatus(ProductionOrderStatus.PENDING_APPROVAL);
        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyA)).thenReturn(Optional.of(order));
        when(productionOrderRepository.save(any(ProductionOrder.class))).thenAnswer(i -> i.getArgument(0));

        // Callback arrives: Rejected -> transitions to CANCELLED
        WorkflowCallbackEventDto rejectEvent = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_REJECTED")
                .documentType("PRODUCTION_ORDER")
                .documentId(orderId)
                .companyId(companyA)
                .status("REJECTED")
                .reason("Material out of stock")
                .build();

        ResponseEntity<InventoryApiResponse<Void>> callbackResp = callbackController.handleWorkflowCallback(VALID_SECRET, rejectEvent);
        assertEquals(HttpStatus.OK, callbackResp.getStatusCode());
        assertEquals(ProductionOrderStatus.CANCELLED, order.getStatus());
        assertNotNull(order.getCancelledAt());

        // Cancelled order CANNOT be released
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> productionOrderService.releaseOrder(orderId, companyA));
        assertTrue(ex.getMessage().contains("must be in CONFIRMED status to release"));
    }

    @Test
    void tenantIsolationEnforced_CompanyBCannotAccessOrApproveCompanyADocument() {
        // Mock finding for Company A only
        lenient().when(productionOrderRepository.findByIdAndCompanyId(orderId, companyA)).thenReturn(Optional.of(order));
        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyB)).thenReturn(Optional.empty());

        // Company B attempts to submit Company A's order -> Not found
        assertThrows(IllegalArgumentException.class, () -> productionOrderService.submitForApproval(orderId, companyB, "tamper"));

        // Company B attempts callback for Company A's order -> Document not found in Company B
        WorkflowCallbackEventDto callbackEvent = WorkflowCallbackEventDto.builder()
                .eventType("WORKFLOW_APPROVED")
                .documentType("PRODUCTION_ORDER")
                .documentId(orderId)
                .companyId(companyB)
                .status("APPROVED")
                .build();

        ResponseEntity<InventoryApiResponse<Void>> resp = callbackController.handleWorkflowCallback(VALID_SECRET, callbackEvent);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("Document not found, ignored", resp.getBody().getMessage());
        // Order in Company A remained untouched in DRAFT
        assertEquals(ProductionOrderStatus.DRAFT, order.getStatus());
    }
}
