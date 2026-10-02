package com.erp.inventory.modules.product.service;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.entity.ProductUom;
import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import com.erp.inventory.modules.product.repository.ProductUomRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductUomConversionServiceTest {

    @Mock private UnitOfMeasureRepository unitOfMeasureRepository;
    @Mock private ProductUomRepository productUomRepository;

    private ProductUomConversionService service;
    private MockedStatic<TenantUtils> mockedTenantUtils;
    private UUID companyId;
    private UUID productId;
    private UUID kgId;
    private UUID tonId;

    @BeforeEach
    void setUp() {
        service = new ProductUomConversionService(unitOfMeasureRepository, productUomRepository);
        mockedTenantUtils = mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(invocation -> invocation.getArgument(0));
        companyId = UUID.randomUUID();
        productId = UUID.randomUUID();
        kgId = UUID.randomUUID();
        tonId = UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        mockedTenantUtils.close();
    }

    @Test
    void normalizesConfiguredTonToKg() {
        Product product = product(kgId);
        UnitOfMeasure kg = uom(kgId, "KG", 3);
        UnitOfMeasure ton = uom(tonId, "TON", 3);
        ProductUom mapping = new ProductUom();
        mapping.setConversionFactor(new BigDecimal("1000"));
        mapping.setIsPurchaseUom(true);

        when(unitOfMeasureRepository.findByCodeIgnoreCaseAndCompanyId("TON", companyId)).thenReturn(Optional.of(ton));
        when(unitOfMeasureRepository.findByIdAndCompanyId(kgId, companyId)).thenReturn(Optional.of(kg));
        when(productUomRepository.findByProductIdAndUomIdAndCompanyIdAndIsDeletedFalse(productId, tonId, companyId))
                .thenReturn(Optional.of(mapping));

        ProductUomConversionService.NormalizedQuantity result = service.normalize(
                product, new BigDecimal("2"), "TON", companyId);

        assertEquals(new BigDecimal("2000"), result.normalizedQuantity());
        assertEquals(new BigDecimal("1000"), result.conversionFactor());
        assertEquals(tonId, result.transactionUomId());
        assertEquals(kgId, result.stockUomId());
        assertEquals(new BigDecimal("50"), service.normalizeUnitCost(new BigDecimal("50000"), result.conversionFactor()));
    }

    @Test
    void rejectsUnmappedIncompatibleUom() {
        Product product = product(kgId);
        UnitOfMeasure kg = uom(kgId, "KG", 3);
        UnitOfMeasure pcs = uom(tonId, "PCS", 0);

        when(unitOfMeasureRepository.findByCodeIgnoreCaseAndCompanyId("PCS", companyId)).thenReturn(Optional.of(pcs));
        when(unitOfMeasureRepository.findByIdAndCompanyId(kgId, companyId)).thenReturn(Optional.of(kg));
        when(productUomRepository.findByProductIdAndUomIdAndCompanyIdAndIsDeletedFalse(productId, tonId, companyId))
                .thenReturn(Optional.empty());

        assertThrows(BusinessValidationException.class,
                () -> service.normalize(product, new BigDecimal("100"), "PCS", companyId));
    }

    @Test
    void rejectsMissingUnit() {
        assertThrows(BusinessValidationException.class,
                () -> service.normalize(product(kgId), new BigDecimal("100"), " ", companyId));
    }

    @Test
    void preservesDecimalQuantityForConfiguredPrecision() {
        Product product = product(kgId);
        UnitOfMeasure kg = uom(kgId, "KG", 3);
        when(unitOfMeasureRepository.findByCodeIgnoreCaseAndCompanyId("KG", companyId)).thenReturn(Optional.of(kg));
        when(unitOfMeasureRepository.findByIdAndCompanyId(kgId, companyId)).thenReturn(Optional.of(kg));

        ProductUomConversionService.NormalizedQuantity result = service.normalize(
                product, new BigDecimal("0.500"), "KG", companyId);

        assertEquals(new BigDecimal("0.5"), result.normalizedQuantity());
    }

    @Test
    void allowsTrailingZerosForIntegerUom() {
        Product product = product(tonId);
        UnitOfMeasure pcs = uom(tonId, "PIE0826001", 0);
        when(unitOfMeasureRepository.findByCodeIgnoreCaseAndCompanyId("PIE0826001", companyId)).thenReturn(Optional.of(pcs));
        when(unitOfMeasureRepository.findByIdAndCompanyId(tonId, companyId)).thenReturn(Optional.of(pcs));

        ProductUomConversionService.NormalizedQuantity result = service.normalize(
                product, new BigDecimal("5.0000"), "PIE0826001", companyId);

        assertEquals(new BigDecimal("5"), result.normalizedQuantity());
    }

    private Product product(UUID baseUomId) {
        Product product = new Product();
        product.setId(productId);
        product.setProductName("Steel Sheet");
        product.setBaseUomId(baseUomId);
        return product;
    }

    private UnitOfMeasure uom(UUID id, String code, int decimalPlaces) {
        UnitOfMeasure uom = new UnitOfMeasure();
        uom.setId(id);
        uom.setCode(code);
        uom.setName(code);
        uom.setDecimalPlaces(decimalPlaces);
        uom.setIsActive(true);
        uom.setIsDeleted(false);
        return uom;
    }
}