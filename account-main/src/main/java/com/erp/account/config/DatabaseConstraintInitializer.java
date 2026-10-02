package com.erp.account.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Startup component to drop legacy database check constraints that were generated when
 * entity fields were Java Enums (such as AccountCategoryType).
 */
@Component
@Slf4j
public class DatabaseConstraintInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseConstraintInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            log.info("Checking and dropping legacy database check constraints...");
            jdbcTemplate.execute("ALTER TABLE account_category DROP CONSTRAINT IF EXISTS account_category_code_check");
            log.info("Successfully dropped account_category_code_check constraint if it existed.");
        } catch (Exception e) {
            log.warn("Failed to drop legacy constraint account_category_code_check: {}", e.getMessage());
        }
    }
}
