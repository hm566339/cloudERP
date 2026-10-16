package com.erp.manufacturing.productionorder.service;

import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.util.TenantUtils;
import com.erp.manufacturing.workflow.client.WorkflowClient;
import com.erp.manufacturing.workflow.dto.WorkflowTransactionDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class ProductionOrderServiceImpl implements ProductionOrderService {

    private final ProductionOrderRepository repository;
    private final WorkflowClient workflowClient;

    public ProductionOrderServiceImpl(ProductionOrderRepository repository, WorkflowClient workflowClient) {
        this.repository = repository;
        this.workflowClient = workflowClient;
    }

    @Override
    public Optional<ProductionOrder> getById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public Optional<ProductionOrder> getByIdAndCompanyId(UUID id, UUID companyId) {
        return repository.findByIdAndCompanyId(id, companyId);
    }

    @Override
    public List<ProductionOrder> getAll() {
        return repository.findAll();
    }

    @Override
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public ProductionOrder submitForApproval(UUID id, UUID companyId, String comments) {
        ProductionOrder order = repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new IllegalArgumentException("Production order not found with ID: " + id));

        if (order.getStatus() != null && order.getStatus() != ProductionOrderStatus.DRAFT) {
            throw new IllegalStateException("Production order cannot be submitted from status: " + order.getStatus());
        }

        try {
            WorkflowTransactionDto existingTx = workflowClient.getWorkflowByDocument(companyId, "PRODUCTION_ORDER", id);
            if (existingTx != null && ("PENDING".equalsIgnoreCase(existingTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existingTx.getStatus()))) {
                throw new IllegalStateException("Production order is already submitted for approval with transaction: " + existingTx.getId());
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.debug("No existing workflow transaction found for production order {}", id);
        }

        try {
            workflowClient.submitWorkflow(
                    companyId,
                    "PRODUCTION_ORDER",
                    order.getId(),
                    order.getProductionOrderNo(),
                    comments != null ? comments : "Submitted production order for approval"
            );
            order.setStatus(ProductionOrderStatus.PENDING_APPROVAL);
        } catch (Exception e) {
            log.error("Failed to submit workflow for production order {}: {}", order.getProductionOrderNo(), e.getMessage());
            throw new RuntimeException("Workflow submission failed: " + e.getMessage(), e);
        }

        return repository.save(order);
    }

    @Override
    @Transactional
    public ProductionOrder approveOrder(UUID id, UUID companyId) {
        ProductionOrder order = repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new IllegalArgumentException("Production order not found with ID: " + id));

        if (order.getStatus() == ProductionOrderStatus.CONFIRMED || order.getStatus() == ProductionOrderStatus.RELEASED) {
            return order; // Idempotent
        }

        if (order.getStatus() != ProductionOrderStatus.PENDING_APPROVAL && order.getStatus() != ProductionOrderStatus.DRAFT) {
            throw new IllegalStateException("Production order cannot be approved from status: " + order.getStatus());
        }

        order.setStatus(ProductionOrderStatus.CONFIRMED);
        order.setApprovedAt(LocalDateTime.now());
        UUID currentUserId = TenantUtils.getCurrentUserId();
        if (currentUserId != null) {
            order.setApprovedBy(currentUserId);
        }
        return repository.save(order);
    }

    @Override
    @Transactional
    public ProductionOrder rejectOrder(UUID id, UUID companyId, String reason) {
        ProductionOrder order = repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new IllegalArgumentException("Production order not found with ID: " + id));

        if (order.getStatus() == ProductionOrderStatus.CANCELLED) {
            return order;
        }

        order.setStatus(ProductionOrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        if (reason != null && !reason.isBlank()) {
            String existingNotes = order.getNotes() != null ? order.getNotes() + "\n" : "";
            order.setNotes(existingNotes + "Rejection Reason: " + reason);
        }
        UUID currentUserId = TenantUtils.getCurrentUserId();
        if (currentUserId != null) {
            order.setCancelledBy(currentUserId);
        }
        return repository.save(order);
    }

    @Override
    @Transactional
    public ProductionOrder releaseOrder(UUID id, UUID companyId) {
        ProductionOrder order = repository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new IllegalArgumentException("Production order not found with ID: " + id));

        if (order.getStatus() != ProductionOrderStatus.CONFIRMED) {
            throw new IllegalStateException("Production order must be in CONFIRMED status to release. Current status: " + order.getStatus());
        }

        order.setStatus(ProductionOrderStatus.RELEASED);
        order.setReleasedAt(LocalDateTime.now());
        UUID currentUserId = TenantUtils.getCurrentUserId();
        if (currentUserId != null) {
            order.setReleasedBy(currentUserId);
        }
        return repository.save(order);
    }
}
