ALTER TABLE gl_journal_entry ADD COLUMN IF NOT EXISTS event_type VARCHAR(60);
ALTER TABLE gl_journal_entry ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(200);

CREATE UNIQUE INDEX IF NOT EXISTS uk_gl_manufacturing_source
    ON gl_journal_entry(company_id, source_module, source_id, event_type)
    WHERE source_module = 'MANUFACTURING' AND is_deleted = false
      AND source_id IS NOT NULL AND event_type IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_gl_manufacturing_idempotency
    ON gl_journal_entry(company_id, source_module, idempotency_key)
    WHERE source_module = 'MANUFACTURING' AND is_deleted = false
      AND idempotency_key IS NOT NULL;
