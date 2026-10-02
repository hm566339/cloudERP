package com.erp.manufacturing.cost.service;

import com.erp.manufacturing.cost.entity.ProductionCost;
import com.erp.manufacturing.cost.repository.ProductionCostRepository;
import com.erp.manufacturing.common.enums.ProductionCostStatus;
import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.consumption.entity.MaterialConsumption;
import com.erp.manufacturing.consumption.repository.MaterialConsumptionRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderOutputRepository;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderOutput;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductionCostServiceImpl implements ProductionCostService {
    private final ProductionCostRepository repository;
    private final ProductionOrderRepository productionOrderRepository;
    private final ProductionOrderOutputRepository outputRepository;
    private final MaterialConsumptionRepository consumptionRepository;

    public ProductionCostServiceImpl(ProductionCostRepository repository, ProductionOrderRepository productionOrderRepository,
                                     ProductionOrderOutputRepository outputRepository, MaterialConsumptionRepository consumptionRepository) {
        this.repository = repository;
        this.productionOrderRepository = productionOrderRepository;
        this.outputRepository = outputRepository;
        this.consumptionRepository = consumptionRepository;
    }

    @Override public Optional<ProductionCost> getById(UUID id) { return repository.findById(id); }
    @Override public List<ProductionCost> getAll() { return repository.findAll(); }
    @Override public void delete(UUID id) { repository.deleteById(id); }

        @Override
        @Transactional
        public ProductionCost calculate(UUID productionOrderId, UUID companyId, boolean finalize) {
        ProductionOrder order = productionOrderRepository.findByIdAndCompanyId(productionOrderId, companyId)
            .orElseThrow(() -> new BusinessValidationException("Production order not found"));
        List<ProductionOrderOutput> outputs = outputRepository.findAllByProductionOrder_IdAndCompanyId(productionOrderId, companyId);
        if (outputs.isEmpty() || outputs.stream().anyMatch(output -> output.getPlannedQuantity() == null)) {
            throw new BusinessValidationException("Production output is required for costing");
        }
        BigDecimal goodOutputQuantity = outputs.stream().map(ProductionOrderOutput::getProducedQuantity)
            .filter(java.util.Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (goodOutputQuantity.signum() <= 0) throw new BusinessValidationException("Good output quantity must be positive");

        List<MaterialConsumption> consumptions = consumptionRepository.findAll().stream()
            .filter(consumption -> companyId.equals(consumption.getCompanyId())
                && consumption.getProductionOrder() != null
                && productionOrderId.equals(consumption.getProductionOrder().getId()))
            .toList();
        if (consumptions.isEmpty() || consumptions.stream().anyMatch(consumption -> consumption.getActualTotalCost() == null)) {
            throw new BusinessValidationException("Authoritative material cost is required");
        }
        BigDecimal materialCost = consumptions.stream().map(MaterialConsumption::getActualTotalCost)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        boolean allProduced = outputs.stream().allMatch(output -> output.getProducedQuantity() != null
            && output.getProducedQuantity().compareTo(output.getPlannedQuantity()) >= 0);
        if (finalize && !allProduced) throw new BusinessValidationException("Production cost cannot be finalized before all output is produced");

        ProductionCost cost = repository.findByCompanyIdAndProductionOrder_Id(companyId, productionOrderId)
            .orElseGet(ProductionCost::new);
        if (ProductionCostStatus.FINALIZED.equals(cost.getStatus())) return cost;
        cost.setCompanyId(companyId); cost.setProductionOrder(order); cost.setMaterialCost(materialCost);
        cost.setLaborCost(BigDecimal.ZERO); cost.setMachineCost(BigDecimal.ZERO); cost.setOverheadCost(BigDecimal.ZERO);
        cost.setSubcontractCost(BigDecimal.ZERO); cost.setScrapRecovery(BigDecimal.ZERO); cost.setByProductCredit(BigDecimal.ZERO);
        cost.setTotalCost(materialCost); cost.setGoodOutputQuantity(goodOutputQuantity);
        cost.setCostPerUnit(materialCost.divide(goodOutputQuantity, 6, java.math.RoundingMode.HALF_UP));
        cost.setCurrencyCode("USD"); cost.setStatus(finalize ? ProductionCostStatus.FINALIZED : ProductionCostStatus.CALCULATED);
        cost.setCalculatedAt(LocalDateTime.now());
        cost.setCreatedAt(cost.getCreatedAt() == null ? LocalDateTime.now() : cost.getCreatedAt());
        cost.setUpdatedAt(LocalDateTime.now()); cost.setIsDeleted(false);
        return repository.save(cost);
        }
}
