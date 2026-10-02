/**
 * Centralized Backend Enums for Accounting & Finance
 *
 * Synced with DBML Schema — all enums used by the accounting backend.
 * Used for dropdown selections to keep frontend values in sync with backend enums.
 */

// ─── Account & Chart of Accounts ─────────────────────────────────────────────

export const AccountCategoryType = [
  { value: "AST", label: "Assets" },
  { value: "LIA", label: "Liabilities" },
  { value: "EQT", label: "Equity" },
  { value: "INC", label: "Income" },
  { value: "EXP", label: "Expense" },
];

/** Account nature as defined in the DBML schema (DEBIT / CREDIT) */
export const AccountNature = [
  { value: "DEBIT", label: "Debit" },
  { value: "CREDIT", label: "Credit" },
];

/** @deprecated Use AccountCategoryType instead — kept for backward compatibility */
export const AccountNatureCategory = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
];

export const AccountStatus = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "BLOCKED", label: "Blocked" },
];

// ─── Approval & Document Workflow ────────────────────────────────────────────

export const ApprovalStatus = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "LEVEL1_APPROVED", label: "Level 1 Approved" },
  { value: "LEVEL2_APPROVED", label: "Level 2 Approved" },
  { value: "FINANCE_APPROVED", label: "Finance Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PAID", label: "Paid" },
];

export const DocumentStatus = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "POSTED", label: "Posted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REVERSED", label: "Reversed" },
];

export const VerificationStatus = [
  { value: "VERIFIED", label: "Verified" },
  { value: "UNVERIFIED", label: "Unverified" },
];

// ─── Banking ─────────────────────────────────────────────────────────────────

export const BankAccountType = [
  { value: "SAVINGS", label: "Savings" },
  { value: "CURRENT", label: "Current" },
  { value: "CASH_CREDIT", label: "Cash Credit" },
  { value: "OVERDRAFT", label: "Overdraft" },
];

export const BankTransactionType = [
  { value: "DEPOSIT", label: "Deposit" },
  { value: "WITHDRAWAL", label: "Withdrawal" },
  { value: "PAYMENT", label: "Payment" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "BANK_CHARGES", label: "Bank Charges" },
  { value: "INTEREST", label: "Interest" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "REVERSAL", label: "Reversal" },
];

// ─── Invoices ────────────────────────────────────────────────────────────────

export const InvoiceStatus = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "POSTED", label: "Posted" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REJECTED", label: "Rejected" },
];

export const EinvoiceStatus = [
  { value: "PENDING", label: "Pending" },
  { value: "GENERATED", label: "Generated" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

// ─── Payments & Receipts ─────────────────────────────────────────────────────

export const PaymentMode = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "UPI", label: "UPI" },
  { value: "RTGS", label: "RTGS" },
  { value: "NEFT", label: "NEFT" },
  { value: "IMPS", label: "IMPS" },
  { value: "CARD", label: "Card" },
];

export const PaymentStatus = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "CREATED", label: "Created" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "POSTED", label: "Posted" },
  { value: "REVERSED", label: "Reversed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "PENDING_ALLOCATION", label: "Pending Allocation" },
];

export const PaymentVoucherStatus = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "POSTED", label: "Posted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REVERSED", label: "Reversed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const ReceiptVoucherStatus = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "POSTED", label: "Posted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REVERSED", label: "Reversed" },
  { value: "CANCELLED", label: "Cancelled" },
];

// ─── GL & Posting ────────────────────────────────────────────────────────────

export const PostingStatus = [
  { value: "DRAFT", label: "Draft" },
  { value: "POSTED", label: "Posted" },
  { value: "FAILED", label: "Failed" },
  { value: "REVERSED", label: "Reversed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const SourceModule = [
  { value: "MANUAL", label: "Manual" },
  { value: "AP", label: "Accounts Payable" },
  { value: "AR", label: "Accounts Receivable" },
  { value: "PAYMENT", label: "Payment" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "BANK", label: "Bank" },
  { value: "EXPENSE", label: "Expense" },
  { value: "PAYROLL", label: "Payroll" },
  { value: "INVENTORY", label: "Inventory" },
  { value: "TAX", label: "Tax" },
  { value: "CREDIT_NOTE", label: "Credit Note" },
  { value: "DEBIT_NOTE", label: "Debit Note" },
  { value: "PAYMENT_VOUCHER", label: "Payment Voucher" },
];

// ─── Budgeting ───────────────────────────────────────────────────────────────

export const BudgetStatus = [
  { value: "DRAFT", label: "Draft" },
  { value: "APPROVED", label: "Approved" },
  { value: "CLOSED", label: "Closed" },
  { value: "REVISED", label: "Revised" },
];

export const VarianceType = [
  { value: "FAVORABLE", label: "Favorable" },
  { value: "UNFAVORABLE", label: "Unfavorable" },
  { value: "BREAKEVEN", label: "Breakeven" },
];

// ─── Tax / GST ───────────────────────────────────────────────────────────────

export const HsnSacType = [
  { value: "HSN", label: "HSN (Goods)" },
  { value: "SAC", label: "SAC (Services)" },
];

// ─── Fiscal Year & Periods ───────────────────────────────────────────────────

export const AccountingPeriodStatus = [
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "LOCKED", label: "Locked" },
];

export const PeriodType = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom" },
];

export const FiscalYearPreset = [
  "INDIA_APR_MAR",
  "JAN_DEC",
  "JUL_JUN",
  "OCT_SEP",
  "CUSTOM",
];

export const FiscalYearStatus = [
  "OPEN",
  "CLOSED",
  "LOCKED",
];
