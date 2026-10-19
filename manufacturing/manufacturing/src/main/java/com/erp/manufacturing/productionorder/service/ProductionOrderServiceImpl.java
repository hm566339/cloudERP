package com.erp.manufacturing.productionorder.service;

import com.erp.manufacturing.bom.entity.Bom;
import com.erp.manufacturing.bom.entity.BomItem;
import com.erp.manufacturing.bom.entity.BomOutput;
import com.erp.manufacturing.bom.entity.BomRevision;
import com.erp.manufacturing.bom.repository.BomItemRepository;
import com.erp.manufacturing.bom.repository.BomOutputRepository;
import com.erp.manufacturing.bom.repository.BomRepository;
import com.erp.manufacturing.bom.repository.BomRevisionRepository;
import com.erp.manufacturing.common.enums.ProductionMaterialStatus;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.common.enums.ProductionOutputStatus;
import com.erp.manufacturing.common.enums.ProductionOutputType;
import com.erp.manufacturing.common.exception.ResourceNotFoundException;
import com.erp.manufacturing.productionorder.dto.request.ProductionOrderCreateRequest;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderMaterial;
import com.erp.manufacturing.productionorder.entity.ProductionOrderOutput;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderOutputRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.util.TenantUtils;
import com.erp.manufacturing.workflow.client.WorkflowClient;
import com.erp.manufacturing.workflow.dto.WorkflowTransactionDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class ProductionOrderServiceImpl implements ProductionOrderService {

    private final ProductionOrderRepository repository;
    private final WorkflowClient workflowClient;
    private final BomRepository bomRepository;
    private final BomRevisionRepository bomRevisionRepository;
    private final BomItemRepository bomItemRepository;
    private final BomOutputRepository bomOutputRepository;
    private final ProductionOrderMaterialRepository materialRepository;
    private final ProductionOrderOutputRepository outputRepository;

    @Autowired
    public ProductionOrderServiceImpl(ProductionOrderRepository repository,
                                      WorkflowClient workflowClient,
                                      BomRepository bomRepository,
                                      BomRevisionRepository bomRevisionRepository,
                                      BomItemRepository bomItemRepository,
                                      BomOutputRepository bomOutputRepository,
                                      ProductionOrderMaterialRepository materialRepository,
                                      ProductionOrderOutputRepository outputRepository) {
        this.repository = repository;
        this.workflowClient = workflowClient;
        this.bomRepository = bomRepository;
        this.bomRevisionRepository = bomRevisionRepository;
        this.bomItemRepository = bomItemRepository;
        this.bomOutputRepository = bomOutputRepository;
        this.materialRepository = materialRepository;
        this.outputRepository = outputRepository;
    }

    public ProductionOrderServiceImpl(ProductionOrderRepository repository, WorkflowClient workflowClient) {
        this(repository, workflowClient, null, null, null, null, null, null);
    }

    @Override
    public Optional<ProductionOrder> getById(UUID id) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        if (companyId != null) {
            return repository.findByIdAndCompanyId(id, companyId);
        }
        return repository.findById(id);
    }

    @Override
    public Optional<ProductionOrder> getByIdAndCompanyId(UUID id, UUID companyId) {
        return repository.findByIdAndCompanyId(id, companyId);
    }

    @Override
    public List<ProductionOrder> getAll() {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        if (companyId != null) {
            return repository.findByCompanyId(companyId);
        }
        return repository.findAll();
    }

    @Override
    @Transactional
    public ProductionOrder createOrder(ProductionOrderCreateRequest request) {
        UUID companyId = TenantUtils.resolveCompanyId(request.getCompanyId());

        if (bomRepository == null) {
            throw new IllegalStateException("BomRepository not configured");
        }

        Bom bom = bomRepository.findByIdAndCompanyId(request.getBomId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("BOM not found or belongs to another company: " + request.getBomId()));

        BomRevision revision;
        if (request.getBomRevisionId() != null) {
            revision = bomRevisionRepository.findById(request.getBomRevisionId())
                    .filter(r -> companyId.equals(r.getCompanyId()))
                    .orElseThrow(() -> new ResourceNotFoundException("BOM revision not found: " + request.getBomRevisionId()));
        } else {
            revision = bomRevisionRepository.findByCompanyIdAndBom_IdAndRevisionNumber(companyId, bom.getId(), bom.getCurrentRevision())
                    .or(() -> bomRevisionRepository.findTopByCompanyIdAndBom_IdOrderByRevisionNumberDesc(companyId, bom.getId()))
                    .orElseThrow(() -> new ResourceNotFoundException("No BOM revision found for BOM: " + bom.getId()));
        }

        UUID finishedProductId = request.getFinishedProductId() != null ? request.getFinishedProductId() : bom.getFinishedProductId();
        String orderNo = request.getProductionOrderNo();
        if (orderNo == null || orderNo.isBlank()) {
            orderNo = "PO-" + System.currentTimeMillis();
        }

        LocalDateTime now = LocalDateTime.now();
        ProductionOrder order = ProductionOrder.builder()
                .companyId(companyId)
                .productionOrderNo(orderNo)
                .finishedProductId(finishedProductId)
                .bom(bom)
                .bomRevision(revision)
                .warehouseId(request.getWarehouseId())
                .productionLocationId(request.getProductionLocationId())
                .plannedQuantity(request.getPlannedQuantity())
                .producedQuantity(BigDecimal.ZERO)
                .rejectedQuantity(BigDecimal.ZERO)
                .scrapQuantity(BigDecimal.ZERO)
                .remainingQuantity(request.getPlannedQuantity())
                .plannedStartDate(request.getPlannedStartDate())
                .plannedEndDate(request.getPlannedEndDate())
                .status(ProductionOrderStatus.DRAFT)
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .notes(request.getNotes())
                .build();
        order.setCreatedBy(TenantUtils.getCurrentUserId());
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        order.setIsDeleted(false);
        order.setVersion(0L);

        ProductionOrder savedOrder = repository.save(order);

        // Generate ProductionOrderMaterial lines from BomItems
        if (bomItemRepository != null && materialRepository != null) {
            List<BomItem> items = bomItemRepository.findAllByBomRevision_IdAndCompanyId(revision.getId(), companyId);
            for (BomItem item : items) {
                if (Boolean.FALSE.equals(item.getIsActive())) continue;
                BigDecimal plannedItemQty = item.getQuantity().multiply(request.getPlannedQuantity());
                ProductionOrderMaterial material = ProductionOrderMaterial.builder()
                        .companyId(companyId)
                        .productionOrder(savedOrder)
                        .bomItem(item)
                        .componentProductId(item.getComponentProductId())
                        .plannedQuantity(plannedItemQty)
                        .reservedQuantity(BigDecimal.ZERO)
                        .consumedQuantity(BigDecimal.ZERO)
                        .returnedQuantity(BigDecimal.ZERO)
                        .wastageQuantity(BigDecimal.ZERO)
                        .scrapQuantity(BigDecimal.ZERO)
                        .uomId(item.getUomId())
                        .status(ProductionMaterialStatus.PLANNED)
                        .sequenceNo(item.getSequenceNo() != null ? item.getSequenceNo() : 1)
                        .build();
                material.setCreatedBy(TenantUtils.getCurrentUserId());
                material.setCreatedAt(now);
                material.setUpdatedAt(now);
                material.setIsDeleted(false);
                material.setVersion(0L);
                materialRepository.save(material);
            }
        }

        // Generate ProductionOrderOutput for finished product
        if (outputRepository != null) {
            UUID outputUomId = null;
            if (bomOutputRepository != null) {
                List<BomOutput> outputs = bomOutputRepository.findAllByBomRevision_IdAndCompanyId(revision.getId(), companyId);
                for (BomOutput bo : outputs) {
                    if (Boolean.TRUE.equals(bo.getIsPrimary()) || outputUomId == null) {
                        outputUomId = bo.getUomId();
                    }
                }
            }
            if (outputUomId == null) {
                outputUomId = UUID.nameUUIDFromBytes(("UOM-" + finishedProductId).getBytes(StandardCharsets.UTF_8));
            }

            ProductionOrderOutput output = ProductionOrderOutput.builder()
                    .companyId(companyId)
                    .productionOrder(savedOrder)
                    .productId(finishedProductId)
                    .outputType(ProductionOutputType.FINISHED_GOOD)
                    .plannedQuantity(request.getPlannedQuantity())
                    .producedQuantity(BigDecimal.ZERO)
                    .rejectedQuantity(BigDecimal.ZERO)
                    .scrapQuantity(BigDecimal.ZERO)
                    .uomId(outputUomId)
                    .warehouseId(request.getWarehouseId())
                    .locationId(request.getProductionLocationId())
                    .status(ProductionOutputStatus.PLANNED)
                    .build();
            output.setCreatedBy(TenantUtils.getCurrentUserId());
            output.setCreatedAt(now);
            output.setUpdatedAt(now);
            output.setIsDeleted(false);
            output.setVersion(0L);
            outputRepository.save(output);
        }

        return savedOrder;
    }

    @Override
    @Transactional
    public ProductionOrder createOrderFromBom(UUID bomId, BigDecimal quantity, UUID warehouseId, UUID locationId, String notes) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        Bom bom = bomRepository.findByIdAndCompanyId(bomId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("BOM not found with ID: " + bomId));

        BigDecimal qty = quantity != null && quantity.signum() > 0 ? quantity : BigDecimal.ONE;
        UUID whId = warehouseId != null ? warehouseId : UUID.nameUUIDFromBytes("DEFAULT_WH".getBytes(StandardCharsets.UTF_8));

        ProductionOrderCreateRequest request = ProductionOrderCreateRequest.builder()
                .companyId(companyId)
                .bomId(bomId)
                .finishedProductId(bom.getFinishedProductId())
                .warehouseId(whId)
                .productionLocationId(locationId)
                .plannedQuantity(qty)
                .notes(notes)
                .build();

        return createOrder(request);
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
