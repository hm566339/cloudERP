-- V6__Add_Snapshot_Unique_Constraint.sql
ALTER TABLE inventory_snapshot 
ADD CONSTRAINT uk_inventory_snapshot_scope_date 
UNIQUE (company_id, snapshot_scope, snapshot_date);
