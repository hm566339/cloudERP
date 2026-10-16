package com.erp.manufacturing.workflow;

import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.workflow.document.ProductionOrderWorkflowAdapter;
import com.erp.manufacturing.workflow.document.WorkflowDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductionOrderWorkflowAdapterTest {

    @Mock
    private ProductionOrderRepository repository;

    @InjectMocks
    private ProductionOrderWorkflowAdapter adapter;

    private UUID documentId;
    private UUID companyId;
    private ProductionOrder order;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        companyId = UUID.randomUUID();

        order = ProductionOrder.builder()
                .companyId(companyId)
                .productionOrderNo("PO-2026-0001")
                .status(ProductionOrderStatus.DRAFT)
                .plannedQuantity(new BigDecimal("100.000000"))
                .build();
        order.setId(documentId);
    }

    @Test
    void getDocumentType_ReturnsProductionOrder() {
        assertEquals("PRODUCTION_ORDER", adapter.getDocumentType());
    }

    @Test
    void find_WhenExists_ReturnsWorkflowDocument() {
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(order));

        WorkflowDocument doc = adapter.find(documentId, companyId);

        assertNotNull(doc);
        assertEquals(documentId, doc.getId());
        assertEquals("PO-2026-0001", doc.getDocumentNumber());
        assertEquals(new BigDecimal("100.000000"), doc.getAmount());
    }

    @Test
    void onWorkflowSubmitted_SetsPendingApproval() {
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(order));

        WorkflowDocument doc = adapter.find(documentId, companyId);
        assertNotNull(doc);
        doc.onWorkflowSubmitted();

        assertEquals(ProductionOrderStatus.PENDING_APPROVAL, order.getStatus());
        verify(repository).save(order);
    }

    @Test
    void onWorkflowApproved_TransitionsToConfirmed() {
        order.setStatus(ProductionOrderStatus.PENDING_APPROVAL);
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(order));

        WorkflowDocument doc = adapter.find(documentId, companyId);
        assertNotNull(doc);
        doc.onWorkflowApproved();

        assertEquals(ProductionOrderStatus.CONFIRMED, order.getStatus());
        assertNotNull(order.getApprovedAt());
        verify(repository).save(order);
    }

    @Test
    void onWorkflowApproved_IdempotentWhenAlreadyConfirmedOrReleased() {
        order.setStatus(ProductionOrderStatus.CONFIRMED);
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(order));

        WorkflowDocument doc = adapter.find(documentId, companyId);
        assertNotNull(doc);
        doc.onWorkflowApproved();

        verify(repository, never()).save(order);
    }

    @Test
    void onWorkflowRejected_TransitionsToCancelled() {
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(order));

        WorkflowDocument doc = adapter.find(documentId, companyId);
        assertNotNull(doc);
        doc.onWorkflowRejected();

        assertEquals(ProductionOrderStatus.CANCELLED, order.getStatus());
        assertNotNull(order.getCancelledAt());
        verify(repository).save(order);
    }

    @Test
    void onWorkflowReturned_TransitionsToDraft() {
        order.setStatus(ProductionOrderStatus.PENDING_APPROVAL);
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(order));

        WorkflowDocument doc = adapter.find(documentId, companyId);
        assertNotNull(doc);
        doc.onWorkflowReturned();

        assertEquals(ProductionOrderStatus.DRAFT, order.getStatus());
        verify(repository).save(order);
    }
}
