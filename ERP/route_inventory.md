# Phase 0: Full Route Inventory

## Module: 403
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/403` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: MODULES
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/modules` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `modules` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `modules/:id` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `modules` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `modules/:id` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: LOGIN
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/login` | `None` | No | Varies (Dual Route) | Public or Layout route |

## Module: :MODULECODE
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/:moduleCode/login` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: ADMIN-LOGIN
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/admin-login` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: AUTH
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/auth/callback` | `None` | No | Varies (Dual Route) | Public or Layout route |

## Module: ACCOUNT
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/account/callback` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `/account/*` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `/account` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: ACCOUNTS
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/accounts/callback` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `/accounts` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `accounts/dashboard` | `None` | No | No | Missing ProtectedRoute / module guard |
| `accounts/organization/financial-years` | `FISCAL_YEARS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/organization/accounting-periods` | `ACCOUNTING_PERIODS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/organization/accounting-periods/:id` | `ACCOUNTING_PERIODS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/ledgers` | `CHART_OF_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/ledgers/:id` | `CHART_OF_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/chart-of-accounts` | `CHART_OF_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/chart-of-accounts/:id` | `CHART_OF_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/customers` | `CUSTOMERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/customers/:id` | `CUSTOMERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/vendors` | `VENDORS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/vendors/:id` | `VENDORS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/bank-accounts` | `BANK_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/bank-accounts/:id` | `BANK_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/gst-slabs` | `GST_SLABS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/gst-slabs/:id` | `GST_SLABS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/hsn-sac` | `HSN_SAC` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/hsn-sac/:id` | `HSN_SAC` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/fiscal-years` | `FISCAL_YEAR` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/fiscal-years/:id` | `FISCAL_YEAR` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/tax/gst-state-master` | `FINANCE` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/tax/gst-state-master/:id` | `FINANCE` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/tax/gst-registrations` | `FINANCE` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/tax/gst-registrations/:id` | `FINANCE` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/sales` | `SALES_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/sales/:id` | `SALES_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/sales/invoices` | `SALES_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/sales/invoices/:id` | `SALES_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/sales/invoices/:invoiceId` | `SALES_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/budget/budget-headers` | `BUDGET_HEADERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/budget/budget-headers/:id` | `BUDGET_HEADERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/budget/budget-lines` | `BUDGET_LINES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/budget/budget-lines/:id` | `BUDGET_LINES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/purchase` | `PURCHASE_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/purchase/:id` | `PURCHASE_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/purchases/invoices` | `PURCHASE_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/purchases/invoices/:id` | `PURCHASE_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/journal` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/journal/:id` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/journal-lines` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/journal-lines/:id` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/journal-lines/journal/:journalId` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/journal-lines/account/:accountId` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/payments` | `PAYMENT_VOUCHERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/payments/:id` | `PAYMENT_VOUCHERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/receipts` | `RECEIPTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/receipts/:id` | `RECEIPTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/credit-notes` | `CREDIT_NOTES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/credit-notes/:id` | `CREDIT_NOTES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/debit-notes` | `DEBIT_NOTES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/debit-notes/:id` | `DEBIT_NOTES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/banking` | `BANK_TRANSACTIONS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/banking/:id` | `BANK_TRANSACTIONS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/ap-payments` | `AP_PAYMENTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/transactions/ap-payments/:id` | `AP_PAYMENTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/trial-balance` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/hsn-report` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/sac-report` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/ledger` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/ledger/:accountId` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/profit-loss` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/balance-sheet` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/cash-flow` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/gst` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/gst/summary` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/gst/gstr1` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/gst/gstr3b` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/gst/hsn-summary` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/gst/itc` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/gst/export` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/reports/gst/gstr2b` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/budget` | `BUDGET_HEADERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/account-categories` | `ACCOUNT_CATEGORIES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/account-categories/:id` | `ACCOUNT_CATEGORIES` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/account-groups` | `ACCOUNT_GROUPS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/masters/account-groups/:id` | `ACCOUNT_GROUPS` | No | Varies (Dual Route) | Needs shared routing helper |
| `accounts/settings/workflow` | `APPROVALS` | No | No | Needs shared routing helper |
| `accounts/settings/audit-logs` | `AUDIT_LOGS` | No | No | Needs shared routing helper |

## Module: FORGOT-PASSWORD
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/forgot-password` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `/forgot-password/:token` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: RESET-PASSWORD
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/reset-password` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `/reset-password/:token` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: VERIFY-EMAIL
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/verify-email` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: REGISTER
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/register` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: COMPANY-SELECT
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/company-select` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: DASHBOARD
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `dashboard` | `None` | No | No | Missing ProtectedRoute / module guard |
| `dashboard` | `None` | No | No | Missing ProtectedRoute / module guard |
| `dashboard` | `None` | No | No | Missing ProtectedRoute / module guard |

## Module: ORGANIZATION
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `organization/financial-years` | `FISCAL_YEARS` | No | Varies (Dual Route) | Needs shared routing helper |
| `organization/accounting-periods` | `ACCOUNTING_PERIODS` | No | Varies (Dual Route) | Needs shared routing helper |
| `organization/accounting-periods/:id` | `ACCOUNTING_PERIODS` | No | Varies (Dual Route) | Needs shared routing helper |

## Module: MASTERS
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `masters/ledgers` | `CHART_OF_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/ledgers/:id` | `CHART_OF_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/chart-of-accounts` | `CHART_OF_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/chart-of-accounts/:id` | `CHART_OF_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/customers` | `CUSTOMERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/customers/:id` | `CUSTOMERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/vendors` | `VENDORS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/vendors/:id` | `VENDORS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/bank-accounts` | `BANK_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/bank-accounts/:id` | `BANK_ACCOUNTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/gst-slabs` | `GST_SLABS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/gst-slabs/:id` | `GST_SLABS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/hsn-sac` | `HSN_SAC` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/hsn-sac/:id` | `HSN_SAC` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/fiscal-years` | `FISCAL_YEARS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/fiscal-years/:id` | `FISCAL_YEARS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/account-categories` | `ACCOUNT_CATEGORIES` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/account-categories/:id` | `ACCOUNT_CATEGORIES` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/account-groups` | `ACCOUNT_GROUPS` | No | Varies (Dual Route) | Needs shared routing helper |
| `masters/account-groups/:id` | `ACCOUNT_GROUPS` | No | Varies (Dual Route) | Needs shared routing helper |

## Module: TAX
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `tax/gst-state-master` | `FINANCE` | No | Varies (Dual Route) | Needs shared routing helper |
| `tax/gst-state-master/:id` | `FINANCE` | No | Varies (Dual Route) | Needs shared routing helper |
| `tax/gst-registrations` | `FINANCE` | No | Varies (Dual Route) | Needs shared routing helper |
| `tax/gst-registrations/:id` | `FINANCE` | No | Varies (Dual Route) | Needs shared routing helper |

## Module: TRANSACTIONS
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `transactions/sales` | `SALES_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/accounts-receivable` | `ACCOUNTS_RECEIVABLE` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/ar-invoices/:id` | `ACCOUNTS_RECEIVABLE` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/sales/:id` | `SALES_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/purchase` | `PURCHASE_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/purchase/:id` | `PURCHASE_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/journal` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/journal/:id` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/journal-lines` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/journal-lines/:id` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/journal-lines/journal/:journalId` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/journal-lines/account/:accountId` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/payments` | `PAYMENT_VOUCHERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/payments/:id` | `PAYMENT_VOUCHERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/receipts` | `RECEIPTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/receipts/:id` | `RECEIPTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/credit-notes` | `CREDIT_NOTES` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/credit-notes/:id` | `CREDIT_NOTES` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/debit-notes` | `DEBIT_NOTES` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/debit-notes/:id` | `DEBIT_NOTES` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/banking` | `BANK_TRANSACTIONS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/banking/:id` | `BANK_TRANSACTIONS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/ap-payments` | `AP_PAYMENTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/ap-payments/:id` | `AP_PAYMENTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `transactions/bank-reconciliation` | `BANK_TRANSACTIONS` | No | Varies (Dual Route) | Needs shared routing helper |

## Module: SALES
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `sales/invoices` | `SALES_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `sales/invoices/:id` | `SALES_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `sales/invoices/:invoiceId` | `SALES_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |

## Module: BUDGET
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `budget/budget-headers` | `BUDGET_HEADERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `budget/budget-headers/:id` | `BUDGET_HEADERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `budget/budget-lines` | `BUDGET_LINES` | No | Varies (Dual Route) | Needs shared routing helper |
| `budget/budget-lines/:id` | `BUDGET_LINES` | No | Varies (Dual Route) | Needs shared routing helper |
| `budget` | `BUDGET_HEADERS` | No | Varies (Dual Route) | Needs shared routing helper |

## Module: PURCHASES
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `purchases/invoices` | `PURCHASE_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `purchases/invoices/:id` | `PURCHASE_INVOICES` | No | Varies (Dual Route) | Needs shared routing helper |
| `purchases` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/vendors` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/requests` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/orders` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/payments` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/quotations` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/approvals` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/vouchers` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/ap-payments` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/vouchers/:id` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/ap-invoices` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/ap-invoices/:id` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `purchases/audit` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: REPORTS
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `reports/trial-balance` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/hsn-report` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/tax-reports` | `TAX_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/budget-variance` | `BUDGET_HEADERS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/sac-report` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/ledger` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/bank-ledger` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/ledger/:accountId` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/profit-loss` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/balance-sheet` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/cash-flow` | `REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/gst` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/gst/summary` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/gst/gstr1` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/gst/gstr3b` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/gst/hsn-summary` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/gst/itc` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/gst/export` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports/gst/gstr2b` | `GST_REPORTS` | No | Varies (Dual Route) | Needs shared routing helper |
| `reports` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `reports/receivables` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `reports/payables` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `reports/tb` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `reports/pl` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `reports/bs` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `reports` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: SETTINGS
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `settings/workflow` | `APPROVALS` | No | No | Needs shared routing helper |
| `settings/audit-logs` | `AUDIT_LOGS` | No | No | Needs shared routing helper |
| `settings` | `None` | No | No | Missing ProtectedRoute / module guard |
| `settings` | `None` | No | No | Missing ProtectedRoute / module guard |
| `settings` | `None` | No | No | Missing ProtectedRoute / module guard |

## Module: PROFILE
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `profile` | `None` | No | No | Missing ProtectedRoute / module guard |
| `profile` | `None` | No | No | Missing ProtectedRoute / module guard |
| `profile` | `None` | No | No | Missing ProtectedRoute / module guard |

## Module: ROOT
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `*` | `None` | No | Varies (Dual Route) | Public or Layout route |
| `*` | `None` | No | Varies (Dual Route) | Public or Layout route |
| `/` | `None` | No | Varies (Dual Route) | Public or Layout route |
| `*` | `None` | No | Varies (Dual Route) | Public or Layout route |

## Module: COMPANY
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/company/:companyId` | `None` | Yes | Yes | Duplicated route tree instead of unified structure |

## Module: COMPANY-DASHBOARD
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `company-dashboard` | `None` | No | No | Missing ProtectedRoute / module guard |

## Module: FINANCE
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `finance/expenses` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `finance/journal-lines` | `GL_JOURNALS` | No | Varies (Dual Route) | Needs shared routing helper |
| `finance/budget-lines` | `BUDGET_HEADERS` | No | Varies (Dual Route) | Needs shared routing helper |

## Module: ACCOUNTING
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `accounting/sales-orders` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: HR
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `hr` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `hr/profile` | `None` | No | No | Missing ProtectedRoute / module guard |
| `hr/employees` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `hr/attendance` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `hr/leave` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `hr/payroll` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `hr/recruitment` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `hr/performance` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `hr/shifts` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `hr/audit` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: INVENTORY
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `inventory` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `inventory/tracking` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `inventory/warehouse` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `inventory/barcode` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `inventory/transfer` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `inventory/purchase-entry` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `inventory/alerts` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `inventory/audit` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: SALES-CRM
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `sales-crm` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sales-crm/customers` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sales-crm/customers/:id` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sales-crm/leads` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sales-crm/quotations` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sales-crm/orders` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sales-crm/communication` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sales-crm/analytics` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sales-crm/invoices` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sales-crm/invoices/:id` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sales-crm/audit` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: MANUFACTURING
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `manufacturing` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `manufacturing/production` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `manufacturing/batches` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `manufacturing/audit` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: ADMIN
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `admin` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `admin/system-logs` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: USERS
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `users` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `users/:id` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `users` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `users/:id` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: ROLES
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `roles` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `roles` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: SESSIONS
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `sessions` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sessions/all` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sessions` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `sessions/all` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: PORTAL-ACCESS
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `portal-access` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: SUPER-ADMIN
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `/super-admin` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: COMPANIES
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `companies` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `companies/:id` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: COMPANY-MODULES
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `company-modules` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |
| `company-modules/:id` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: MODULE-ROUTES
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `module-routes` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

## Module: AUDIT-LOGS
| Path | Roles Allowed | Has companyId? | Should Have companyId? | Issue Found |
|---|---|---|---|---|
| `audit-logs` | `None` | No | Varies (Dual Route) | Missing ProtectedRoute / module guard |

