INSERT INTO customer_address (
    id, customer_id, address_type, address_line1, city, gst_state_id, country,
    is_default, is_active, is_deleted, created_at, created_by
)
SELECT
    gen_random_uuid(), c.id, 'DEFAULT', c.address_line1, c.city,
    s.id, COALESCE(NULLIF(c.country, ''), 'India'),
    TRUE, COALESCE(c.is_active, TRUE), COALESCE(c.is_deleted, FALSE),
    c.created_at, c.created_by
FROM customer c
LEFT JOIN gst_state_code s
    ON LOWER(s.state_name) = LOWER(c.state)
    OR LOWER(s.state_code) = LOWER(c.state)
WHERE NULLIF(c.address_line1, '') IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM customer_address ca
      WHERE ca.customer_id = c.id
        AND COALESCE(ca.is_deleted, FALSE) = FALSE
  );

ALTER TABLE customer
    DROP COLUMN IF EXISTS address_line1,
    DROP COLUMN IF EXISTS city,
    DROP COLUMN IF EXISTS state,
    DROP COLUMN IF EXISTS country;