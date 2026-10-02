package com.erp.inventory.common.seed;

import com.erp.inventory.modules.product.entity.ProductCategory;
import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import com.erp.inventory.modules.product.repository.ProductCategoryRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import com.erp.inventory.modules.product.dto.request.ProductRequest;
import com.erp.inventory.modules.product.service.ProductService;
import com.erp.inventory.modules.product.enums.ProductType;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import com.erp.inventory.modules.product.dto.response.ProductResponse;

import com.erp.inventory.modules.pricing.entity.ProductPrice;
import com.erp.inventory.modules.pricing.repository.ProductPriceRepository;
import com.erp.inventory.modules.product.enums.PriceType;

import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.enums.LocationType;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;

import com.erp.inventory.modules.openingstock.service.OpeningStockService;
import com.erp.inventory.modules.openingstock.dto.request.OpeningStockRequest;
import com.erp.inventory.modules.openingstock.dto.request.OpeningStockLineRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class MasterDataSeeder implements CommandLineRunner {

    private final ProductCategoryRepository categoryRepository;
    private final UnitOfMeasureRepository uomRepository;
    private final ProductService productService;
    private final ProductPriceRepository productPriceRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final OpeningStockService openingStockService;

    @Value("${inventory.seed.master-data:false}")
    private boolean shouldSeed;

    private final UUID COMPANY_ID = UUID.fromString("8794358f-3b1a-40be-9d13-afb51b449862");

    @Override
    public void run(String... args) throws Exception {
        if (!shouldSeed) {
            log.info("Master data seeding is disabled. Skipping...");
            return;
        }

        log.info("STARTING MASTER DATA SEEDING FOR COMPANY: {}", COMPANY_ID);

        com.erp.inventory.common.security.CurrentUserContext.setCompanyId(COMPANY_ID);
        try {
            // 1. Categories
            ProductCategory catElectronics = createCategory("ELEC", "Electronics");
        ProductCategory catPhones = createCategory("PHONE", "Mobile Phones");
        ProductCategory catLaptops = createCategory("LAP", "Laptops");
        ProductCategory catAccessories = createCategory("ACC", "Accessories");
        ProductCategory catOffice = createCategory("OFF", "Office Supplies");

        // 2. UOMs
        UnitOfMeasure uomPcs = createUom("PCS", "Pieces");
        UnitOfMeasure uomBox = createUom("BOX", "Box");

        // 3. Products - setting tracking to NONE so Opening Stock can be directly seeded without Batch/Serial dependency
        ProductResponse ip15_128 = createProduct("iPhone 15 128GB", "IP15-128", catPhones.getId(), uomPcs.getId(), TrackingType.NONE);
        ProductResponse ip15_256 = createProduct("iPhone 15 256GB", "IP15-256", catPhones.getId(), uomPcs.getId(), TrackingType.NONE);
        ProductResponse s24 = createProduct("Samsung Galaxy S24", "SGS24-128", catPhones.getId(), uomPcs.getId(), TrackingType.NONE);
        ProductResponse a55 = createProduct("Samsung Galaxy A55", "SGA55-256", catPhones.getId(), uomPcs.getId(), TrackingType.NONE);
        ProductResponse dell = createProduct("Dell Latitude 5440", "DELL-L5440", catLaptops.getId(), uomPcs.getId(), TrackingType.NONE);
        ProductResponse hp = createProduct("HP ProBook 440", "HP-PB440", catLaptops.getId(), uomPcs.getId(), TrackingType.NONE);
        ProductResponse mouse = createProduct("Logitech Wireless Mouse", "LOG-MOUSE", catAccessories.getId(), uomPcs.getId(), TrackingType.NONE);
        ProductResponse keyboard = createProduct("Logitech Keyboard", "LOG-KEYBOARD", catAccessories.getId(), uomPcs.getId(), TrackingType.NONE);
        ProductResponse paper = createProduct("A4 Printer Paper", "PAPER-A4", catOffice.getId(), uomBox.getId(), TrackingType.NONE);
        ProductResponse hdmi = createProduct("HDMI Cable", "HDMI-2M", catAccessories.getId(), uomPcs.getId(), TrackingType.NONE);

        // 4. Prices
        createPrice(ip15_128.getId(), new BigDecimal("55000"), new BigDecimal("60000"));
        createPrice(ip15_256.getId(), new BigDecimal("65000"), new BigDecimal("70000"));
        createPrice(s24.getId(), new BigDecimal("60000"), new BigDecimal("68000"));
        createPrice(a55.getId(), new BigDecimal("35000"), new BigDecimal("40000"));
        createPrice(dell.getId(), new BigDecimal("65000"), new BigDecimal("72000"));
        createPrice(hp.getId(), new BigDecimal("60000"), new BigDecimal("68000"));
        createPrice(mouse.getId(), new BigDecimal("800"), new BigDecimal("1200"));
        createPrice(keyboard.getId(), new BigDecimal("1200"), new BigDecimal("1800"));
        createPrice(paper.getId(), new BigDecimal("200"), new BigDecimal("350"));
        createPrice(hdmi.getId(), new BigDecimal("150"), new BigDecimal("300"));

        // 5. Warehouse
        Warehouse warehouse = createWarehouse("WH-001", "Main Warehouse");
        WarehouseLocation locA1 = createLocation(warehouse.getId(), "MAIN-A1", "Main Rack A1");
        WarehouseLocation locA2 = createLocation(warehouse.getId(), "MAIN-A2", "Main Rack A2");

        // 6. Opening Stock
        createOpeningStock(warehouse.getId(), locA1.getId(), List.of(
                createOsLine(ip15_128.getId(), uomPcs.getId(), new BigDecimal("20"), new BigDecimal("55000")),
                createOsLine(ip15_256.getId(), uomPcs.getId(), new BigDecimal("15"), new BigDecimal("65000")),
                createOsLine(s24.getId(), uomPcs.getId(), new BigDecimal("10"), new BigDecimal("60000")),
                createOsLine(a55.getId(), uomPcs.getId(), new BigDecimal("15"), new BigDecimal("35000")),
                createOsLine(dell.getId(), uomPcs.getId(), new BigDecimal("8"), new BigDecimal("65000")),
                createOsLine(hp.getId(), uomPcs.getId(), new BigDecimal("8"), new BigDecimal("60000"))
        ));

        createOpeningStock(warehouse.getId(), locA2.getId(), List.of(
                createOsLine(mouse.getId(), uomPcs.getId(), new BigDecimal("50"), new BigDecimal("800")),
                createOsLine(keyboard.getId(), uomPcs.getId(), new BigDecimal("40"), new BigDecimal("1200")),
                createOsLine(paper.getId(), uomBox.getId(), new BigDecimal("100"), new BigDecimal("200")),
                createOsLine(hdmi.getId(), uomPcs.getId(), new BigDecimal("50"), new BigDecimal("150"))
        ));

        log.info("MASTER DATA SEEDING COMPLETED SUCCESSFULLY.");
        } finally {
            com.erp.inventory.common.security.CurrentUserContext.clear();
        }
    }

    private ProductCategory createCategory(String code, String name) {
        return categoryRepository.findAllByCompanyId(COMPANY_ID, org.springframework.data.domain.Pageable.unpaged())
            .stream().filter(c -> code.equals(c.getCode())).findFirst().orElseGet(() -> {
                ProductCategory cat = new ProductCategory();
                cat.setCompanyId(COMPANY_ID);
                cat.setCode(code);
                cat.setName(name);
                cat.setDescription(name);
                cat.setIsActive(true);
                cat.setIsDeleted(false);
                return categoryRepository.save(cat);
            });
    }

    private UnitOfMeasure createUom(String code, String name) {
        return uomRepository.findAllByCompanyId(COMPANY_ID, org.springframework.data.domain.Pageable.unpaged())
            .stream().filter(u -> code.equals(u.getCode())).findFirst().orElseGet(() -> {
                UnitOfMeasure uom = new UnitOfMeasure();
                uom.setCompanyId(COMPANY_ID);
                uom.setCode(code);
                uom.setName(name);
                uom.setIsActive(true);
                uom.setDecimalPlaces(0);
                uom.setIsDeleted(false);
                return uomRepository.save(uom);
            });
    }

    private ProductResponse createProduct(String name, String sku, UUID categoryId, UUID uomId, TrackingType tracking) {
        ProductRequest req = new ProductRequest();
        req.setProductName(name);
        req.setSku(sku);
        req.setCategoryId(categoryId);
        req.setBaseUomId(uomId);
        req.setProductType(ProductType.GOODS);
        req.setTrackingType(tracking);
        req.setValuationMethod(ValuationMethod.FIFO);
        req.setDescription(name);
        req.setStatus(com.erp.inventory.modules.product.enums.ProductStatus.ACTIVE);
        
        try {
            return productService.create(req, COMPANY_ID);
        } catch (Exception e) {
            log.warn("Product might already exist or error: {}", e.getMessage());
            return productService.getAll(new com.erp.inventory.modules.product.dto.request.ProductFilterRequest(), COMPANY_ID, org.springframework.data.domain.Pageable.unpaged())
                    .stream().filter(p -> sku.equals(p.getSku())).findFirst().orElseThrow();
        }
    }

    private void createPrice(UUID productId, BigDecimal purchasePrice, BigDecimal sellingPrice) {
        boolean hasPurchase = productPriceRepository.findAllByCompanyId(COMPANY_ID).stream()
                .anyMatch(p -> productId.equals(p.getProductId()) && PriceType.PURCHASE.name().equals(p.getPriceType().name()));
        
        if (!hasPurchase) {
            ProductPrice p = new ProductPrice();
            p.setCompanyId(COMPANY_ID);
            p.setProductId(productId);
            p.setPriceType(PriceType.PURCHASE);
            p.setCurrencyCode("INR");
            p.setPrice(purchasePrice);
            p.setMinQuantity(BigDecimal.ONE);
            p.setStatus("ACTIVE");
            p.setEffectiveFrom(LocalDateTime.now().minusDays(1));
            p.setIsDeleted(false);
            productPriceRepository.save(p);
        }

        boolean hasSelling = productPriceRepository.findAllByCompanyId(COMPANY_ID).stream()
                .anyMatch(p -> productId.equals(p.getProductId()) && PriceType.SELLING.name().equals(p.getPriceType().name()));

        if (!hasSelling) {
            ProductPrice s = new ProductPrice();
            s.setCompanyId(COMPANY_ID);
            s.setProductId(productId);
            s.setPriceType(PriceType.SELLING);
            s.setCurrencyCode("INR");
            s.setPrice(sellingPrice);
            s.setMinQuantity(BigDecimal.ONE);
            s.setStatus("ACTIVE");
            s.setEffectiveFrom(LocalDateTime.now().minusDays(1));
            s.setIsDeleted(false);
            productPriceRepository.save(s);
        }
    }

    private Warehouse createWarehouse(String code, String name) {
        return warehouseRepository.findAllByCompanyId(COMPANY_ID, org.springframework.data.domain.Pageable.unpaged())
            .stream().filter(w -> code.equals(w.getWarehouseCode())).findFirst().orElseGet(() -> {
                Warehouse w = new Warehouse();
                w.setCompanyId(COMPANY_ID);
                w.setWarehouseCode(code);
                w.setWarehouseName(name);
                w.setWarehouseType(com.erp.inventory.modules.warehouse.enums.WarehouseType.MAIN);
                w.setStatus("ACTIVE");
                w.setAddressLine1("123 Ind Estate");
                w.setCity("Mumbai");
                w.setState("MH");
                w.setCountry("India");
                w.setPinCode("400001");
                w.setIsDeleted(false);
                return warehouseRepository.save(w);
            });
    }

    private WarehouseLocation createLocation(UUID whId, String code, String name) {
        return warehouseLocationRepository.findAllByCompanyId(COMPANY_ID, org.springframework.data.domain.Pageable.unpaged())
            .stream().filter(l -> whId.equals(l.getWarehouseId()) && code.equals(l.getLocationCode())).findFirst().orElseGet(() -> {
                WarehouseLocation l = new WarehouseLocation();
                l.setCompanyId(COMPANY_ID);
                l.setWarehouseId(whId);
                l.setLocationCode(code);
                l.setLocationName(name);
                l.setLocationType(LocationType.RACK);
                l.setIsActive(true);
                l.setIsDeleted(false);
                return warehouseLocationRepository.save(l);
            });
    }

    private void createOpeningStock(UUID warehouseId, UUID locationId, List<OpeningStockLineRequest> lines) {
        try {
            OpeningStockRequest req = new OpeningStockRequest();
            req.setWarehouseId(warehouseId);
            req.setOpeningDate(LocalDate.now());
            req.setOpeningStockNo("OS-" + System.currentTimeMillis() + "-" + locationId.toString().substring(0, 4));
            req.setRemarks("Initial Seeding");
            req.setLines(lines);
            req.setStatus("APPROVED");

            for (OpeningStockLineRequest line : lines) {
                line.setWarehouseLocationId(locationId);
            }

            openingStockService.create(req, COMPANY_ID);
            log.info("Opening stock created for location: {}", locationId);
        } catch (Exception e) {
            log.warn("Opening stock creation failed (might already exist): {}", e.getMessage());
        }
    }

    private OpeningStockLineRequest createOsLine(UUID productId, UUID uomId, BigDecimal qty, BigDecimal cost) {
        OpeningStockLineRequest req = new OpeningStockLineRequest();
        req.setProductId(productId);
        req.setUomId(uomId);
        req.setQuantity(qty);
        req.setUnitCost(cost);
        return req;
    }
}
