-- DO Block to dynamically add new audit fields to all tables that have a created_at column (assuming they extend BaseEntity)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT c.table_name 
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name
        WHERE c.table_schema = 'public' 
          AND c.column_name = 'created_at' 
          AND t.table_type = 'BASE TABLE'
    )
    LOOP
        -- Add created_by_username
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' ADD COLUMN IF NOT EXISTS created_by_username VARCHAR(255)';
        
        -- Add updated_by_username
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' ADD COLUMN IF NOT EXISTS updated_by_username VARCHAR(255)';

        -- Add deleted_by
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' ADD COLUMN IF NOT EXISTS deleted_by UUID';

        -- Add deleted_by_username
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' ADD COLUMN IF NOT EXISTS deleted_by_username VARCHAR(255)';

        -- Add deleted_at
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP';
    END LOOP;
END $$;
