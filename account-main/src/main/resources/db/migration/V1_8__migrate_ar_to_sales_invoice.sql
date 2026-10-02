-- V1_8__migrate_ar_to_sales_invoice.sql
-- Description: Safe historical data migration from ar_invoice to sales_invoice and receipt_voucher_allocation to receipt_allocation

-- 1. Migrate ar_invoice to sales_invoice
INSERT INTO sales_invoice (
    id, version, company_id, customer_id, invoice_number, invoice_date, due_date,
    invoice_currency, exchange_rate, subtotal, tax_amount, total_amount,
    received_amount, outstanding_amount, payment_status,
    receivable_account_id, revenue_account_id,
    output_cgst_account_id, output_sgst_account_id, output_igst_account_id, output_cess_account_id,
    place_of_supply_state_id, place_of_supply_state_code,
    delivery_address_id, delivery_address_line1, delivery_address_line2,
    delivery_city, delivery_state, delivery_postal_code, delivery_country,
    status, approved_by, approved_at,
    gl_journal_entry_id, gl_posting_status, posted_at, notes,
    created_by, created_at, updated_by, updated_at, is_deleted
)
SELECT 
    id, version, company_id, customer_id, invoice_number, invoice_date, due_date,
    invoice_currency, exchange_rate, subtotal, tax_amount, total_amount,
    received_amount, outstanding_amount, 
    CASE 
        WHEN outstanding_amount <= 0 THEN 'PAID'
        WHEN received_amount > 0 THEN 'PARTIAL'
        ELSE 'UNPAID'
    END as payment_status,
    receivable_account_id, 
    COALESCE((SELECT item.revenue_account_id FROM ar_invoice_item item WHERE item.ar_invoice_id = ar_invoice.id AND item.revenue_account_id IS NOT NULL LIMIT 1), receivable_account_id) as revenue_account_id,
    output_cgst_account_id, output_sgst_account_id, output_igst_account_id, output_cess_account_id,
    place_of_supply_state_id, place_of_supply_state_code,
    delivery_address_id, delivery_address_line1, delivery_address_line2,
    delivery_city, delivery_state, delivery_postal_code, delivery_country,
    status, approved_by, approved_at,
    gl_journal_entry_id, gl_posting_status, gl_posting_time as posted_at, notes,
    created_by, created_at, updated_by, updated_at, is_deleted
FROM ar_invoice
ON CONFLICT (id) DO NOTHING;

-- 2. Migrate ar_invoice_item to sales_invoice_item
INSERT INTO sales_invoice_item (
    id, version, sales_invoice_id, company_id, item_id, item_name, description,
    quantity, unit_price, taxable_amount, tax_amount,
    cgst_amount, sgst_amount, igst_amount, cess_amount, total_amount,
    hsn_sac_id, warehouse_id, location_id, unit,
    created_by, created_at, updated_by, updated_at, is_deleted
)
SELECT 
    id, version, ar_invoice_id as sales_invoice_id, company_id, item_id, COALESCE(description, 'Item') as item_name, description,
    quantity, unit_price, taxable_amount, tax_amount,
    cgst_amount, sgst_amount, igst_amount, cess_amount, total_amount,
    hsn_sac_id, warehouse_id, location_id, unit,
    created_by, created_at, updated_by, updated_at, is_deleted
FROM ar_invoice_item
ON CONFLICT (id) DO NOTHING;

-- 3. Migrate receipt_voucher_allocation to receipt_allocation
INSERT INTO receipt_allocation (
    id, version, receipt_voucher_id, sales_invoice_id, allocated_amount,
    created_by, created_at, updated_by, updated_at, is_deleted
)
SELECT 
    id, version, receipt_voucher_id, ar_invoice_id as sales_invoice_id, allocated_amount,
    created_by, created_at, updated_by, updated_at, is_deleted
FROM receipt_voucher_allocation
ON CONFLICT (id) DO NOTHING;
