package com.erp.inventory.modules.workflow.document;

import com.erp.inventory.modules.openingstock.entity.OpeningStock;
import com.erp.inventory.modules.openingstock.entity.OpeningStockLine;
import com.erp.inventory.modules.openingstock.repository.OpeningStockLineRepository;
import com.erp.inventory.modules.openingstock.repository.OpeningStockRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpeningStockWorkflowAdapterTest {

    @Mock
    private OpeningStockRepository repository;

    @Mock
    private OpeningStockLineRepository lineRepository;

    @InjectMocks
    private OpeningStockWorkflowAdapter adapter;

    private UUID documentId;
    private UUID companyId;
    private OpeningStock openingStock;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        companyId = UUID.randomUUID();

        openingStock = OpeningStock.builder()
                .openingStockNo("OS-2026-0001")
                .status("DRAFT")
                .build();
        openingStock.setId(documentId);
        openingStock.setCompanyId(companyId);
    }

    @Test
    void getDocumentType_ReturnsOpeningStock() {
        assertEquals("OPENING_STOCK", adapter.getDocumentType());
    }

    @Test
    void find_WhenExists_ReturnsWorkflowDocument() {
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(openingStock));
        OpeningStockLine line = OpeningStockLine.builder()
                .quantity(new BigDecimal("10"))
                .unitCost(new BigDecimal("5.50"))
                .totalValue(new BigDecimal("55.00"))
                .build();
        when(lineRepository.findAllByOpeningStockIdAndCompanyId(documentId, companyId)).thenReturn(List.of(line));

        WorkflowDocument doc = adapter.find(documentId, companyId);

        assertNotNull(doc);
        assertEquals(documentId, doc.getId());
        assertEquals("OS-2026-0001", doc.getDocumentNumber());
        assertEquals(new BigDecimal("55.00"), doc.getAmount());
    }

    @Test
    void onWorkflowApproved_TransitionsToApproved() {
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(openingStock));

        WorkflowDocument doc = adapter.find(documentId, companyId);
        assertNotNull(doc);
        doc.onWorkflowApproved();

        assertEquals("APPROVED", openingStock.getStatus());
        assertNotNull(openingStock.getApprovedAt());
        verify(repository).save(openingStock);
    }

    @Test
    void onWorkflowApproved_IdempotentWhenAlreadyApproved() {
        openingStock.setStatus("APPROVED");
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(openingStock));

        WorkflowDocument doc = adapter.find(documentId, companyId);
        assertNotNull(doc);
        doc.onWorkflowApproved();

        verify(repository, never()).save(openingStock);
    }

    @Test
    void onWorkflowRejected_TransitionsToRejected() {
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(openingStock));

        WorkflowDocument doc = adapter.find(documentId, companyId);
        assertNotNull(doc);
        doc.onWorkflowRejected();

        assertEquals("REJECTED", openingStock.getStatus());
        verify(repository).save(openingStock);
    }

    @Test
    void onWorkflowReturned_TransitionsToDraft() {
        when(repository.findByIdAndCompanyId(documentId, companyId)).thenReturn(Optional.of(openingStock));

        WorkflowDocument doc = adapter.find(documentId, companyId);
        assertNotNull(doc);
        doc.onWorkflowReturned();

        assertEquals("DRAFT", openingStock.getStatus());
        verify(repository).save(openingStock);
    }
}
