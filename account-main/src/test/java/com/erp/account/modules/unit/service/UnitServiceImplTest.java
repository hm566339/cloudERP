package com.erp.account.modules.unit.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.unit.entity.Unit;
import com.erp.account.modules.unit.repository.UnitRepository;
import com.erp.account.modules.unit.service.impl.UnitServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UnitServiceImplTest {

    @Mock
    private UnitRepository unitRepository;

    private UnitServiceImpl unitService;

    @BeforeEach
    void setUp() {
        unitService = new UnitServiceImpl(unitRepository);
    }

    @Test
    @DisplayName("Should resolve PIE0826001 code as Piece/PIECE non-decimal unit")
    void testResolveUnit_PieceCode() {
        Unit unit = unitService.resolveUnit("PIE0826001");
        assertNotNull(unit);
        assertEquals("Piece", unit.getName());
        assertEquals("PIECE", unit.getSymbol());
        assertFalse(unit.isAllowDecimal());
        assertEquals(0, unit.getDecimalPlaces());
    }

    @Test
    @DisplayName("Should format 50.0000 and 10.0000 for PIE0826001 as 50 and 10")
    void testFormatQuantity_Piece() {
        assertEquals("50", unitService.formatQuantity(new BigDecimal("50.0000"), "PIE0826001"));
        assertEquals("10", unitService.formatQuantity(new BigDecimal("10.0000"), "PIE0826001"));
        assertEquals("PIECE", unitService.getUnitDisplay("PIE0826001"));
    }

    @Test
    @DisplayName("Should format decimal units (KG, LTR, MTR) preserving required decimals without trailing zeros")
    void testFormatQuantity_DecimalUnits() {
        // Kilogram
        assertEquals("10.5", unitService.formatQuantity(new BigDecimal("10.5000"), "KG"));
        assertEquals("2.25", unitService.formatQuantity(new BigDecimal("2.2500"), "KG"));
        assertEquals("10", unitService.formatQuantity(new BigDecimal("10.0000"), "KG"));
        assertEquals("KG", unitService.getUnitDisplay("KG"));

        // Liter
        assertEquals("5.5", unitService.formatQuantity(new BigDecimal("5.5000"), "LTR"));
        assertEquals("LITRE", unitService.getUnitDisplay("LTR"));

        // Meter
        assertEquals("25", unitService.formatQuantity(new BigDecimal("25.0000"), "MTR"));
        assertEquals("2.5", unitService.formatQuantity(new BigDecimal("2.5000"), "MTR"));
        assertEquals("METER", unitService.getUnitDisplay("MTR"));

        // Box
        assertEquals("10", unitService.formatQuantity(new BigDecimal("10.0000"), "BOX"));
        assertEquals("BOX", unitService.getUnitDisplay("BOX"));
    }

    @Test
    @DisplayName("Should validate quantity against unit and reject fractional pieces")
    void testValidateQuantity_NonDecimalUnit() {
        // Valid non-fractional
        assertDoesNotThrow(() -> unitService.validateQuantity(new BigDecimal("50.0000"), "PIE0826001"));
        assertDoesNotThrow(() -> unitService.validateQuantity(new BigDecimal("10.0000"), "PIE0826001"));

        // Invalid fractional pieces
        assertThrows(BadRequestException.class, () ->
                unitService.validateQuantity(new BigDecimal("10.5000"), "PIE0826001"));
    }

    @Test
    @DisplayName("Should allow fractional quantity for decimal units")
    void testValidateQuantity_DecimalUnit() {
        assertDoesNotThrow(() -> unitService.validateQuantity(new BigDecimal("10.5000"), "KG"));
        assertDoesNotThrow(() -> unitService.validateQuantity(new BigDecimal("2.2500"), "KG"));
        assertDoesNotThrow(() -> unitService.validateQuantity(new BigDecimal("5.5000"), "LTR"));
    }

    @Test
    @DisplayName("Should resolve unit from database if present")
    void testResolveUnit_FromDatabase() {
        Unit customUnit = Unit.builder()
                .code("ROLL01")
                .name("Roll")
                .symbol("ROLL")
                .allowDecimal(false)
                .decimalPlaces(0)
                .build();
        when(unitRepository.findByCodeIgnoreCase("ROLL01")).thenReturn(Optional.of(customUnit));

        Unit resolved = unitService.resolveUnit("ROLL01");
        assertNotNull(resolved);
        assertEquals("Roll", resolved.getName());
        assertEquals("ROLL", resolved.getSymbol());
        assertEquals("15", unitService.formatQuantity(new BigDecimal("15.0000"), resolved));
    }
}
