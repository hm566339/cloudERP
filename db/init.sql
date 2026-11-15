-- ==============================================================================
-- Cloud ERP - Idempotent Database Initialization Script
-- Executed automatically by PostgreSQL docker-entrypoint on initial setup.
-- Uses \gexec to prevent ERROR: database already exists when databases exist.
-- ==============================================================================

SELECT 'CREATE DATABASE account' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'account')\gexec
SELECT 'CREATE DATABASE sso' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sso')\gexec
SELECT 'CREATE DATABASE workflow_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'workflow_db')\gexec
SELECT 'CREATE DATABASE inventory' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'inventory')\gexec
SELECT 'CREATE DATABASE manufacturing' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'manufacturing')\gexec
SELECT 'CREATE DATABASE communication_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'communication_db')\gexec
SELECT 'CREATE DATABASE crm_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'crm_db')\gexec
