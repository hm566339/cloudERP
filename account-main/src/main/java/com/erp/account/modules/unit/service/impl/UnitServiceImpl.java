package com.erp.account.modules.unit.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.unit.entity.Unit;
import com.erp.account.modules.unit.repository.UnitRepository;
import com.erp.account.modules.unit.service.UnitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UnitServiceImpl implements UnitService {

    private final UnitRepository unitRepository;

    private static final Map<String, Unit> STANDARD_UNITS;

    static {
        Map<String, Unit> map = new HashMap<>();

        // Non-decimal discrete units
        Unit piece = Unit.builder().code("PIECE").name("Piece").symbol("PIECE").allowDecimal(false).decimalPlaces(0).build();
        map.put("PIE0826001", piece);
        map.put("PIECE", piece);
        map.put("PIECES", piece);
        map.put("PCS", piece);
        map.put("PC", piece);
        map.put("NOS", piece);
        map.put("NO", piece);
        map.put("NUMBERS", piece);
        map.put("NUMBER", piece);

        Unit box = Unit.builder().code("BOX").name("Box").symbol("BOX").allowDecimal(false).decimalPlaces(0).build();
        map.put("BOX", box);
        map.put("BOXES", box);
        map.put("BX", box);

        Unit bag = Unit.builder().code("BAG").name("Bag").symbol("BAG").allowDecimal(false).decimalPlaces(0).build();
        map.put("BAG", bag);
        map.put("BAGS", bag);

        Unit set = Unit.builder().code("SET").name("Set").symbol("SET").allowDecimal(false).decimalPlaces(0).build();
        map.put("SET", set);
        map.put("SETS", set);

        Unit dozen = Unit.builder().code("DOZEN").name("Dozen").symbol("DOZEN").allowDecimal(false).decimalPlaces(0).build();
        map.put("DOZ", dozen);
        map.put("DOZEN", dozen);
        map.put("DZ", dozen);

        Unit pack = Unit.builder().code("PACK").name("Pack").symbol("PACK").allowDecimal(false).decimalPlaces(0).build();
        map.put("PAC", pack);
        map.put("PACK", pack);
        map.put("PACKS", pack);
        map.put("PKT", pack);
        map.put("PACKET", pack);

        // Continuous / decimal units
        Unit kg = Unit.builder().code("KG").name("Kilogram").symbol("KG").allowDecimal(true).decimalPlaces(3).build();
        map.put("KG", kg);
        map.put("KGS", kg);
        map.put("KILOGRAM", kg);
        map.put("KILOGRAMS", kg);

        Unit gram = Unit.builder().code("GM").name("Gram").symbol("GM").allowDecimal(true).decimalPlaces(2).build();
        map.put("GM", gram);
        map.put("GMS", gram);
        map.put("GRAM", gram);
        map.put("GRAMS", gram);

        Unit liter = Unit.builder().code("LITRE").name("Liter").symbol("LITRE").allowDecimal(true).decimalPlaces(2).build();
        map.put("LTR", liter);
        map.put("LTRS", liter);
        map.put("LITRE", liter);
        map.put("LITER", liter);
        map.put("LITRES", liter);
        map.put("LITERS", liter);

        Unit ml = Unit.builder().code("ML").name("Milliliter").symbol("ML").allowDecimal(true).decimalPlaces(2).build();
        map.put("ML", ml);
        map.put("MILLILITER", ml);
        map.put("MILLILITRE", ml);

        Unit meter = Unit.builder().code("METER").name("Meter").symbol("METER").allowDecimal(true).decimalPlaces(2).build();
        map.put("MTR", meter);
        map.put("MTRS", meter);
        map.put("METER", meter);
        map.put("METRE", meter);
        map.put("METERS", meter);
        map.put("METRES", meter);

        Unit cm = Unit.builder().code("CM").name("Centimeter").symbol("CM").allowDecimal(true).decimalPlaces(2).build();
        map.put("CM", cm);
        map.put("CENTIMETER", cm);

        Unit ton = Unit.builder().code("TON").name("Ton").symbol("TON").allowDecimal(true).decimalPlaces(3).build();
        map.put("TON", ton);
        map.put("TONS", ton);
        map.put("MT", ton);

        STANDARD_UNITS = Collections.unmodifiableMap(map);
    }

    @Override
    public Unit resolveUnit(String code) {
        if (code == null || code.trim().isEmpty()) {
            return null;
        }
        String trimmed = code.trim();
        String upper = trimmed.toUpperCase();

        // 1. Try DB lookup if repository is available
        if (unitRepository != null) {
            try {
                Optional<Unit> dbUnit = unitRepository.findByCodeIgnoreCase(trimmed);
                if (dbUnit.isPresent()) {
                    return dbUnit.get();
                }
                Optional<Unit> altUnit = unitRepository.findByCodeOrSymbolOrName(trimmed);
                if (altUnit.isPresent()) {
                    return altUnit.get();
                }
            } catch (Exception ex) {
                log.debug("Unit repository lookup failed for code '{}': {}", code, ex.getMessage());
            }
        }

        // 2. Check standard built-in dictionary
        if (STANDARD_UNITS.containsKey(upper)) {
            Unit standard = STANDARD_UNITS.get(upper);
            // Optionally persist to DB in background if repository is available
            persistIfMissing(standard, trimmed);
            return standard;
        }

        // 3. Match by prefix / pattern
        if (upper.startsWith("PIE")) {
            Unit piece = STANDARD_UNITS.get("PIECE");
            persistIfMissing(piece, trimmed);
            return piece;
        }

        // 4. Default fallback: allow decimal with 2 places, symbol = upper
        return Unit.builder()
                .code(trimmed)
                .name(trimmed)
                .symbol(upper)
                .allowDecimal(true)
                .decimalPlaces(2)
                .build();
    }

    private void persistIfMissing(Unit template, String originalCode) {
        if (unitRepository == null || template == null) {
            return;
        }
        try {
            if (unitRepository.findByCodeIgnoreCase(originalCode).isEmpty()) {
                Unit toSave = Unit.builder()
                        .code(originalCode)
                        .name(template.getName())
                        .symbol(template.getSymbol())
                        .allowDecimal(template.isAllowDecimal())
                        .decimalPlaces(template.getDecimalPlaces())
                        .build();
                unitRepository.save(toSave);
            }
        } catch (Exception ex) {
            log.debug("Could not auto-seed unit '{}': {}", originalCode, ex.getMessage());
        }
    }

    @Override
    public String formatQuantity(BigDecimal quantity, Unit unit) {
        if (quantity == null) {
            return "-";
        }

        if (unit == null) {
            BigDecimal stripped = quantity.stripTrailingZeros();
            return (stripped.scale() < 0 ? stripped.setScale(0) : stripped).toPlainString();
        }

        if (!unit.isAllowDecimal()) {
            return quantity.setScale(0, RoundingMode.HALF_UP).toPlainString();
        }

        BigDecimal stripped = quantity.stripTrailingZeros();
        if (stripped.scale() < 0) {
            return stripped.setScale(0).toPlainString();
        }

        if (unit.getDecimalPlaces() != null && stripped.scale() > unit.getDecimalPlaces()) {
            return stripped.setScale(unit.getDecimalPlaces(), RoundingMode.HALF_UP)
                    .stripTrailingZeros()
                    .toPlainString();
        }

        return stripped.toPlainString();
    }

    @Override
    public String formatQuantity(BigDecimal quantity, String unitCode) {
        Unit unit = resolveUnit(unitCode);
        return formatQuantity(quantity, unit);
    }

    @Override
    public String getUnitDisplay(Unit unit, String fallback) {
        if (unit != null) {
            if (unit.getSymbol() != null && !unit.getSymbol().trim().isEmpty()) {
                return unit.getSymbol().trim().toUpperCase();
            }
            if (unit.getName() != null && !unit.getName().trim().isEmpty()) {
                return unit.getName().trim();
            }
        }
        if (fallback != null && !fallback.trim().isEmpty()) {
            return fallback.trim();
        }
        return "-";
    }

    @Override
    public String getUnitDisplay(String unitCode) {
        Unit unit = resolveUnit(unitCode);
        return getUnitDisplay(unit, unitCode);
    }

    @Override
    public void validateQuantity(BigDecimal quantity, Unit unit) {
        if (quantity == null || unit == null) {
            return;
        }
        if (!unit.isAllowDecimal() && quantity.stripTrailingZeros().scale() > 0) {
            throw new BadRequestException("Fractional quantity is not allowed for unit " + (unit.getName() != null ? unit.getName() : unit.getCode()));
        }
    }

    @Override
    public void validateQuantity(BigDecimal quantity, String unitCode) {
        Unit unit = resolveUnit(unitCode);
        validateQuantity(quantity, unit);
    }
}
