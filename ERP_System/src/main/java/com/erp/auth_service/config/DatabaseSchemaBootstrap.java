package com.erp.auth_service.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Bootstrap runner to ensure PostgreSQL columns required for Organization Owner flows
 * allow NULL values (specifically company_id in authorization_code and session tables).
 *
 * Hibernate's ddl-auto=update does not alter existing column nullability, so this runner
 * guarantees the schema compatibility on application startup without requiring manual DDL.
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaBootstrap implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Ensuring database column nullability compatibility for Organization Owner flows...");
        dropColumnNotNullSafely("authorization_code", "company_id");
        dropColumnNotNullSafely("session", "company_id");
        addColumnIfMissingSafely("\"user\"", "notes", "TEXT");
    }

    private void dropColumnNotNullSafely(String tableName, String columnName) {
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE " + tableName + " ALTER COLUMN " + columnName + " DROP NOT NULL"
            );
            log.info("Successfully verified/dropped NOT NULL constraint on {}.{}", tableName, columnName);
        } catch (Exception ex) {
            log.warn("Could not alter {}.{} (table may not exist or constraint already dropped): {}",
                    tableName, columnName, ex.getMessage());
        }
    }

    private void addColumnIfMissingSafely(String tableName, String columnName, String columnType) {
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE " + tableName + " ADD COLUMN IF NOT EXISTS " + columnName + " " + columnType
            );
            log.info("Successfully verified/added column {}.{}", tableName, columnName);
        } catch (Exception ex) {
            log.warn("Could not add column {}.{}: {}", tableName, columnName, ex.getMessage());
        }
    }
}
