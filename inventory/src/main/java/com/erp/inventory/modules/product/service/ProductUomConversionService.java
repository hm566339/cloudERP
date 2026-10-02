package com.erp.inventory.modules.product.service;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.entity.ProductUom;
import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import com.erp.inventory.modules.product.repository.ProductUomRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductUomConversionService {

    private static final int CALCULATION_SCALE = 12;

    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final ProductUomRepository productUomRepository;

    public NormalizedQuantity normalize(Product product, BigDecimal quantity, String unit, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (product == null || product.getId() == null) {
            throw new BusinessValidationException("Product is required for UOM conversion");
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Quantity must be greater than zero");
        }
        if (unit == null || unit.isBlank()) {
            throw new BusinessValidationException("Unit of measure is required for inventory stock-in");
        }
        if (product.getBaseUomId() == null) {
            throw new BusinessValidationException("Product stock UOM is not configured: " + product.getId());
        }

        UnitOfMeasure transactionUom = findUom(unit.trim(), company);
        UnitOfMeasure stockUom = unitOfMeasureRepository.findByIdAndCompanyId(product.getBaseUomId(), company)
                .orElseThrow(() -> new BusinessValidationException("Product stock UOM not found: " + product.getBaseUomId()));

        validateActive(transactionUom, "Transaction UOM");
        validateActive(stockUom, "Product stock UOM");
        validateDecimalPlaces(quantity, transactionUom, "Transaction quantity");

        BigDecimal conversionFactor;
        if (transactionUom.getId().equals(stockUom.getId())) {
            conversionFactor = BigDecimal.ONE;
        } else {
            ProductUom mapping = productUomRepository
                    .findByProductIdAndUomIdAndCompanyIdAndIsDeletedFalse(product.getId(), transactionUom.getId(), company)
                    .orElseThrow(() -> new BusinessValidationException(
                            "Unsupported UOM " + unit + " for product " + product.getProductName()));

            conversionFactor = mapping.getConversionFactor();
            if (conversionFactor == null || conversionFactor.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessValidationException("Invalid conversion factor for UOM " + unit);
            }
            if (Boolean.FALSE.equals(mapping.getIsPurchaseUom())) {
                throw new BusinessValidationException("UOM " + unit + " is not configured as a purchase UOM");
            }
        }

        BigDecimal normalizedQuantity = plainDecimal(quantity.multiply(conversionFactor));
        validateDecimalPlaces(normalizedQuantity, stockUom, "Normalized quantity");

        return new NormalizedQuantity(
                transactionUom.getId(),
                stockUom.getId(),
                quantity,
                normalizedQuantity,
                conversionFactor);
    }

    public BigDecimal normalizeUnitCost(BigDecimal transactionUnitCost, BigDecimal conversionFactor) {
        if (transactionUnitCost == null || transactionUnitCost.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Unit price must be zero or greater");
        }
        if (conversionFactor == null || conversionFactor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Conversion factor must be greater than zero");
        }
        return plainDecimal(transactionUnitCost.divide(conversionFactor, CALCULATION_SCALE, RoundingMode.HALF_UP));
    }

    private UnitOfMeasure findUom(String unit, UUID companyId) {
        return unitOfMeasureRepository.findByCodeIgnoreCaseAndCompanyId(unit, companyId)
                .or(() -> unitOfMeasureRepository.findByNameIgnoreCaseAndCompanyId(unit, companyId))
                .orElseThrow(() -> new BusinessValidationException("Unsupported UOM: " + unit));
    }

    private void validateActive(UnitOfMeasure uom, String label) {
        if (!Boolean.TRUE.equals(uom.getIsActive()) || Boolean.TRUE.equals(uom.getIsDeleted())) {
            throw new BusinessValidationException(label + " is inactive");
        }
    }

    private void validateDecimalPlaces(BigDecimal quantity, UnitOfMeasure uom, String label) {
        if (quantity != null && uom != null && uom.getDecimalPlaces() != null) {
            BigDecimal stripped = quantity.stripTrailingZeros();
            int effectiveScale = Math.max(0, stripped.scale());
            if (effectiveScale > uom.getDecimalPlaces()) {
                throw new BusinessValidationException(label + " exceeds the configured precision for UOM " + uom.getCode());
            }
        }
    }

    private BigDecimal plainDecimal(BigDecimal value) {
        return new BigDecimal(value.stripTrailingZeros().toPlainString());
    }

    public record NormalizedQuantity(
            UUID transactionUomId,
            UUID stockUomId,
            BigDecimal transactionQuantity,
            BigDecimal normalizedQuantity,
            BigDecimal conversionFactor) {
    }
}