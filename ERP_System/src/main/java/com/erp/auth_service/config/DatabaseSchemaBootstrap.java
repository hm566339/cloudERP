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
        log.info("Ensuring database column nullability and foreign key cascade compatibility...");
        dropColumnNotNullSafely("authorization_code", "company_id");
        dropColumnNotNullSafely("session", "company_id");
        addColumnIfMissingSafely("\"user\"", "notes", "TEXT");
        migrateRefreshTokenRecordCascadeForeignKeySafely();
        ensureCaseInsensitiveUserIndexesSafely();
        ensureOrganizationAppearanceTableSafely();
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

    private void migrateRefreshTokenRecordCascadeForeignKeySafely() {
        try {
            log.info("Checking refresh_token_record foreign key ON DELETE CASCADE constraint...");

            // 1. Purge legacy orphaned records first so FK modification cannot fail on dirty data
            jdbcTemplate.execute(
                "DELETE FROM refresh_token_record WHERE session_id IS NULL OR session_id NOT IN (SELECT id FROM session)"
            );

            // 2. Query whether an ON DELETE CASCADE foreign key constraint already exists for session_id on refresh_token_record
            Integer cascadeExists = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.referential_constraints rc
                JOIN information_schema.table_constraints tc
                    ON rc.constraint_name = tc.constraint_name
                    AND rc.constraint_schema = tc.constraint_schema
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.constraint_schema = kcu.constraint_schema
                WHERE tc.table_name = 'refresh_token_record'
                  AND kcu.column_name = 'session_id'
                  AND rc.delete_rule = 'CASCADE'
                """,
                Integer.class
            );

            if (cascadeExists == null || cascadeExists == 0) {
                log.info("Migrating refresh_token_record foreign key constraint to ON DELETE CASCADE...");

                // Drop any existing foreign key constraint on refresh_token_record(session_id)
                jdbcTemplate.execute(
                    """
                    DO $$
                    DECLARE
                        r RECORD;
                    BEGIN
                        FOR r IN (
                            SELECT tc.constraint_name
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.key_column_usage kcu
                                ON tc.constraint_name = kcu.constraint_name
                                AND tc.table_schema = kcu.table_schema
                            WHERE tc.table_name = 'refresh_token_record'
                              AND tc.constraint_type = 'FOREIGN KEY'
                              AND kcu.column_name = 'session_id'
                        ) LOOP
                            EXECUTE 'ALTER TABLE refresh_token_record DROP CONSTRAINT ' || quote_ident(r.constraint_name);
                        END LOOP;
                    END $$;
                    """
                );

                // Add foreign key constraint with ON DELETE CASCADE
                jdbcTemplate.execute(
                    """
                    ALTER TABLE refresh_token_record
                        ADD CONSTRAINT fkiqef9ces3kb0fssekw7k0dm4x
                        FOREIGN KEY (session_id)
                        REFERENCES session (id)
                        ON DELETE CASCADE
                    """
                );
                log.info("Successfully configured ON DELETE CASCADE on refresh_token_record(session_id).");
            } else {
                log.info("Foreign key constraint on refresh_token_record(session_id) already has ON DELETE CASCADE.");
            }

            // Ensure index exists on session_id
            jdbcTemplate.execute(
                "CREATE INDEX IF NOT EXISTS idx_refresh_token_record_session_id ON refresh_token_record (session_id)"
            );
        } catch (Exception ex) {
            log.warn("Could not migrate refresh_token_record foreign key constraint: {}", ex.getMessage());
        }
    }

    private void ensureCaseInsensitiveUserIndexesSafely() {
        try {
            // Check if duplicate case-insensitive usernames exist in "user"
            Integer duplicateUsernames = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM (
                    SELECT company_id, LOWER(username)
                    FROM "user"
                    GROUP BY company_id, LOWER(username)
                    HAVING COUNT(*) > 1
                ) dupes
                """,
                Integer.class
            );

            if (duplicateUsernames != null && duplicateUsernames > 0) {
                log.warn("Detected {} case-insensitive duplicate username collision(s) in 'user' table. Unique index creation deferred until duplicates are resolved.",
                        duplicateUsernames);
            } else {
                jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_user_company_lower_username ON \"user\" (company_id, LOWER(username))"
                );
                log.info("Verified unique case-insensitive index on 'user'(company_id, LOWER(username)).");
            }

            // Check if duplicate case-insensitive emails exist in "user"
            Integer duplicateEmails = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM (
                    SELECT company_id, LOWER(email)
                    FROM "user"
                    GROUP BY company_id, LOWER(email)
                    HAVING COUNT(*) > 1
                ) dupes
                """,
                Integer.class
            );

            if (duplicateEmails != null && duplicateEmails > 0) {
                log.warn("Detected {} case-insensitive duplicate email collision(s) in 'user' table. Unique index creation deferred until duplicates are resolved.",
                        duplicateEmails);
            } else {
                jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_user_company_lower_email ON \"user\" (company_id, LOWER(email))"
                );
                log.info("Verified unique case-insensitive index on 'user'(company_id, LOWER(email)).");
            }
        } catch (Exception ex) {
            log.warn("Could not verify/create case-insensitive indexes on 'user': {}", ex.getMessage());
        }
    }

    private void ensureOrganizationAppearanceTableSafely() {
        try {
            log.info("Ensuring organization_appearance table and constraints exist...");
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS organization_appearance (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    organization_id UUID NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
                    active_theme VARCHAR(50) NOT NULL DEFAULT 'sage',
                    appearance_mode VARCHAR(20) NOT NULL DEFAULT 'system',
                    layout_density VARCHAR(20) NOT NULL DEFAULT 'comfortable',
                    font_family VARCHAR(50) NOT NULL DEFAULT 'default',
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """);
            jdbcTemplate.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS uk_org_appearance_organization ON organization_appearance (organization_id)"
            );
            log.info("Successfully verified/created organization_appearance table.");
        } catch (Exception ex) {
            log.warn("Could not ensure organization_appearance table: {}", ex.getMessage());
        }
    }
}
