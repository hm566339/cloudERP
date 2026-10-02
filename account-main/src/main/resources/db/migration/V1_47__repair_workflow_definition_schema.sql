-- Bring legacy workflow_definition tables in line with the WorkflowDefinition entity.
-- Do not guess tenant or document ownership for existing rows.

DO $$
BEGIN
    IF to_regclass('public.workflow_definition') IS NULL THEN
        RAISE EXCEPTION
            'public.workflow_definition is missing; verify database/schema and Flyway migration V1_46';
    END IF;
END $$;

ALTER TABLE public.workflow_definition
    ADD COLUMN IF NOT EXISTS company_id uuid,
    ADD COLUMN IF NOT EXISTS workflow_code varchar(100),
    ADD COLUMN IF NOT EXISTS document_type varchar(100),
    ADD COLUMN IF NOT EXISTS version integer,
    ADD COLUMN IF NOT EXISTS is_default boolean;

ALTER TABLE public.workflow_definition
    ALTER COLUMN version SET DEFAULT 1,
    ALTER COLUMN is_default SET DEFAULT false;

UPDATE public.workflow_definition
SET version = 1
WHERE version IS NULL;

UPDATE public.workflow_definition
SET is_default = false
WHERE is_default IS NULL;

-- These values are safe only when every transaction for a definition agrees.
DO $$
BEGIN
        IF to_regclass('public.workflow_transaction') IS NOT NULL
             AND EXISTS (
                     SELECT 1
                     FROM information_schema.columns
                     WHERE table_schema = 'public'
                         AND table_name = 'workflow_transaction'
                         AND column_name = 'company_id'
             )
             AND EXISTS (
                     SELECT 1
                     FROM information_schema.columns
                     WHERE table_schema = 'public'
                         AND table_name = 'workflow_transaction'
                         AND column_name = 'document_type'
             ) THEN
        UPDATE public.workflow_definition definition
        SET company_id = tx.company_id,
            document_type = tx.document_type
        FROM (
            SELECT workflow_definition_id,
                   MIN(company_id) AS company_id,
                   MIN(document_type) AS document_type
            FROM public.workflow_transaction
            WHERE company_id IS NOT NULL
              AND document_type IS NOT NULL
            GROUP BY workflow_definition_id
            HAVING COUNT(DISTINCT company_id) = 1
               AND COUNT(DISTINCT document_type) = 1
        ) tx
        WHERE definition.id = tx.workflow_definition_id
          AND (definition.company_id IS NULL OR definition.document_type IS NULL);
    END IF;
END $$;

-- workflow_code has no authoritative legacy source, so it must be supplied by
-- an operator rather than fabricated from an identifier.
DO $$
DECLARE
    unresolved_count bigint;
BEGIN
    SELECT COUNT(*)
    INTO unresolved_count
    FROM public.workflow_definition
    WHERE company_id IS NULL
       OR workflow_code IS NULL
       OR document_type IS NULL;

    IF unresolved_count > 0 THEN
        RAISE EXCEPTION
            'workflow_definition repair requires explicit backfill for % existing row(s): company_id, workflow_code, and/or document_type is NULL',
            unresolved_count;
    END IF;
END $$;

ALTER TABLE public.workflow_definition
    ALTER COLUMN company_id SET NOT NULL,
    ALTER COLUMN workflow_code SET NOT NULL,
    ALTER COLUMN document_type SET NOT NULL,
    ALTER COLUMN version SET NOT NULL,
    ALTER COLUMN is_default SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.workflow_definition'::regclass
          AND conname = 'uk_wf_def_code_version'
    ) THEN
        ALTER TABLE public.workflow_definition
            ADD CONSTRAINT uk_wf_def_code_version
            UNIQUE (company_id, workflow_code, version);
    END IF;

    IF to_regclass('public.company') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conrelid = 'public.workflow_definition'::regclass
             AND conname = 'fk_workflow_definition_company'
       ) THEN
        ALTER TABLE public.workflow_definition
            ADD CONSTRAINT fk_workflow_definition_company
            FOREIGN KEY (company_id) REFERENCES public.company(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wf_def_company_doc
    ON public.workflow_definition(company_id, document_type, is_active);