package com.erp.account.modules.unit.service;

import com.erp.account.modules.unit.entity.Unit;

import java.math.BigDecimal;

public interface UnitService {

    /**
     * Resolves a Unit definition from a unit code, symbol, or name.
     * Looks up UnitRepository, falling back to standard unit registry or dynamic registration.
     */
    Unit resolveUnit(String code);

    /**
     * Formats quantity string according to unit configuration.
     */
    String formatQuantity(BigDecimal quantity, Unit unit);

    /**
     * Formats quantity string by resolving unit code first.
     */
    String formatQuantity(BigDecimal quantity, String unitCode);

    /**
     * Returns a human-readable display string for a unit (e.g. "PIECE", "KG").
     */
    String getUnitDisplay(Unit unit, String fallback);

    /**
     * Returns a human-readable display string by resolving unit code.
     */
    String getUnitDisplay(String unitCode);

    /**
     * Validates whether the given quantity conforms to the unit's decimal configuration.
     * Throws BadRequestException if fractional quantities are specified for non-decimal units.
     */
    void validateQuantity(BigDecimal quantity, Unit unit);

    /**
     * Validates quantity by unit code.
     */
    void validateQuantity(BigDecimal quantity, String unitCode);
}
