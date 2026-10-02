-- Migration V1_24: Create expense_request table and update expense_claim

CREATE TABLE expense_request (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    request_number VARCHAR(50) NOT NULL,
    request_type VARCHAR(30) NOT NULL,
    request_date DATE NOT NULL,
    requester_id UUID NOT NULL,
    employee_driver_id UUID NOT NULL,
    role_type VARCHAR(20) NOT NULL,
    expense_category_id UUID NOT NULL,
    requested_amount NUMERIC(19, 4) NOT NULL,
    purpose_description TEXT,
    additional_notes TEXT,
    status VARCHAR(30) NOT NULL,
    approval_status VARCHAR(30),
    approved_amount NUMERIC(19, 4),
    approved_by UUID,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    rejected_by UUID,
    rejected_at TIMESTAMP,
    requires_advance BOOLEAN DEFAULT FALSE,
    advance_amount NUMERIC(19, 4),
    sales_order_id UUID,
    delivery_challan_id UUID,
    vehicle_id UUID,
    vehicle_number VARCHAR(50),
    claim_id UUID,

    -- Audit fields
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by UUID,
    created_by_username VARCHAR(255),
    updated_by UUID,
    updated_by_username VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by UUID,
    deleted_by_username VARCHAR(255),
    deleted_at TIMESTAMP,

    CONSTRAINT fk_expense_request_company FOREIGN KEY (company_id) REFERENCES company(id),
    CONSTRAINT fk_expense_request_category FOREIGN KEY (expense_category_id) REFERENCES expense_category(id),
    CONSTRAINT uk_expense_request_company_req_no UNIQUE (company_id, request_number)
);

CREATE INDEX idx_expense_request_company_id ON expense_request(company_id);
CREATE INDEX idx_expense_request_request_number ON expense_request(request_number);
CREATE INDEX idx_expense_request_status ON expense_request(status);
CREATE INDEX idx_expense_request_requester_id ON expense_request(requester_id);
CREATE INDEX idx_expense_request_employee_driver_id ON expense_request(employee_driver_id);
CREATE INDEX idx_expense_request_category_id ON expense_request(expense_category_id);
CREATE INDEX idx_expense_request_request_date ON expense_request(request_date);
CREATE INDEX idx_expense_request_sales_order_id ON expense_request(sales_order_id);
CREATE INDEX idx_expense_request_delivery_challan_id ON expense_request(delivery_challan_id);

-- Link actual expense claim to expense request
ALTER TABLE expense_claim ADD COLUMN IF NOT EXISTS expense_request_id UUID REFERENCES expense_request(id);
