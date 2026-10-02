-- Migration V1_27: Add employee_name column to expense_request table
ALTER TABLE expense_request ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);
