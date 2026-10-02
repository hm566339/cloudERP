package com.erp.inventory.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final DataSource dataSource;

    @Override
    public void run(String... args) {
        log.info("Checking database constraints for stock_movement reference_type...");
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            boolean needsUpdate = true;
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT pg_get_constraintdef(c.oid) " +
                    "FROM pg_constraint c " +
                    "WHERE c.conname = 'stock_movement_reference_type_check'")) {
                if (rs.next()) {
                    String def = rs.getString(1);
                    if (def != null && def.contains("DELIVERY_CHALLAN")) {
                        needsUpdate = false;
                        log.info("Database constraint stock_movement_reference_type_check already contains DELIVERY_CHALLAN.");
                    }
                }
            }

            if (needsUpdate) {
                log.info("Applying database migration: updating stock_movement and stock_reservation check constraints to include DELIVERY_CHALLAN...");
                stmt.execute(
                    "ALTER TABLE stock_movement DROP CONSTRAINT IF EXISTS stock_movement_reference_type_check;\n" +
                    "ALTER TABLE stock_movement ADD CONSTRAINT stock_movement_reference_type_check " +
                    "CHECK (reference_type IN ('MANUAL', 'PURCHASE_RECEIPT', 'PURCHASE_RETURN', 'SALES_INVOICE', 'SALES_RETURN', 'DELIVERY', 'DELIVERY_CHALLAN', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT', 'OPENING_STOCK', 'PRODUCTION', 'STOCK_RESERVATION'));\n" +
                    "ALTER TABLE stock_reservation DROP CONSTRAINT IF EXISTS stock_reservation_reference_type_check;\n" +
                    "ALTER TABLE stock_reservation ADD CONSTRAINT stock_reservation_reference_type_check " +
                    "CHECK (reference_type IN ('MANUAL', 'PURCHASE_RECEIPT', 'PURCHASE_RETURN', 'SALES_INVOICE', 'SALES_RETURN', 'DELIVERY', 'DELIVERY_CHALLAN', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT', 'OPENING_STOCK', 'PRODUCTION', 'STOCK_RESERVATION'));"
                );
                log.info("Database migration applied successfully: check constraints updated.");
            }
        } catch (Exception e) {
            log.warn("Database migration check encountered an exception: {}", e.getMessage());
        }
    }
}
