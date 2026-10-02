-- Add unique constraint for company_id and sku
ALTER TABLE product
ADD CONSTRAINT uk_product_company_sku UNIQUE (company_id, sku);

-- Add unique constraint for company_id and product_code
ALTER TABLE product
ADD CONSTRAINT uk_product_company_code UNIQUE (company_id, product_code);
