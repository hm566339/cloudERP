/**
 * Unified Resource Registry
 * Single Source of Truth for all Backend Resources
 * Generated automatically from backend metadata.
 */

export const RESOURCE_REGISTRY = {
  "customers": {
    "key": "customers",
    "name": "Customer",
    "pluralName": "Customers",
    "module": "ACCOUNT",
    "feature": "CUSTOMERS",
    "idField": "id",
    "codeField": "customerCode",
    "nameField": "customerName",
    "listPath": "/api/account/customers",
    "detailPath": "/api/account/customers/:id",
    "createPath": "/api/account/customers",
    "updatePath": "/api/account/customers/:id",
    "deletePath": "/api/account/customers/:id",
    "route": "/accounts/masters/customers",
    "permissions": {
      "read": "CUSTOMERS:READ",
      "create": "CUSTOMERS:CREATE",
      "update": "CUSTOMERS:UPDATE",
      "delete": "CUSTOMERS:DELETE"
    },
    "listCapabilities": {
      "searchParam": "search",
      "searchedFields": [
        "customerCode",
        "customerName",
        "phone",
        "email",
        "gstin"
      ],
      "defaultSort": "createdAt,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "maxPageSize": 100,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      },
      "filters": [
        {
          "name": "status",
          "label": "Status",
          "type": "select",
          "enumKey": "accountStatus"
        },
        {
          "name": "gstType",
          "label": "GST Type",
          "type": "select",
          "enumKey": "gstTreatment"
        }
      ]
    },
    "fields": [
      {
        "name": "customerCode",
        "label": "Customer Code",
        "type": "text",
        "required": false,
        "inTable": true,
        "sortable": true
      },
      {
        "name": "customerName",
        "label": "Customer Name",
        "type": "text",
        "required": true,
        "inTable": true,
        "sortable": true
      },
      {
        "name": "email",
        "label": "Email Address",
        "type": "email",
        "required": false,
        "inTable": true
      },
      {
        "name": "phone",
        "label": "Phone Number",
        "type": "text",
        "required": false,
        "inTable": true
      },
      {
        "name": "gstin",
        "label": "GSTIN",
        "type": "text",
        "required": false,
        "inTable": true
      },
      {
        "name": "panNo",
        "label": "PAN Number",
        "type": "text",
        "required": false
      },
      {
        "name": "creditLimit",
        "label": "Credit Limit",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "outstandingBalance",
        "label": "Outstanding",
        "type": "decimal",
        "format": "currency",
        "inTable": true,
        "readOnly": true
      },
      {
        "name": "isActive",
        "label": "Status",
        "type": "boolean",
        "format": "statusBadge",
        "enumKey": "accountStatus",
        "inTable": true
      }
    ]
  },
  "vendors": {
    "key": "vendors",
    "name": "Vendor",
    "pluralName": "Vendors",
    "module": "ACCOUNT",
    "feature": "VENDORS",
    "idField": "id",
    "codeField": "vendorCode",
    "nameField": "vendorName",
    "listPath": "/api/account/v1/vendors",
    "detailPath": "/api/account/v1/vendors/:id",
    "createPath": "/api/account/v1/vendors",
    "updatePath": "/api/account/v1/vendors/:id",
    "deletePath": "/api/account/v1/vendors/:id",
    "route": "/accounts/masters/vendors",
    "permissions": {
      "read": "VENDORS:READ",
      "create": "VENDORS:CREATE",
      "update": "VENDORS:UPDATE",
      "delete": "VENDORS:DELETE"
    },
    "listCapabilities": {
      "searchParam": "search",
      "searchedFields": [
        "vendorCode",
        "vendorName",
        "panNumber",
        "gstin"
      ],
      "defaultSort": "createdAt,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "maxPageSize": 100,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      },
      "filters": [
        {
          "name": "status",
          "label": "Status",
          "type": "select",
          "enumKey": "accountStatus"
        }
      ]
    },
    "fields": [
      {
        "name": "vendorCode",
        "label": "Vendor Code",
        "type": "text",
        "required": false,
        "inTable": true,
        "sortable": true
      },
      {
        "name": "vendorName",
        "label": "Vendor Name",
        "type": "text",
        "required": true,
        "inTable": true,
        "sortable": true
      },
      {
        "name": "contactPerson",
        "label": "Contact Person",
        "type": "text",
        "required": false,
        "inTable": true
      },
      {
        "name": "email",
        "label": "Email",
        "type": "email",
        "required": false,
        "inTable": true
      },
      {
        "name": "phone",
        "label": "Phone",
        "type": "text",
        "required": false,
        "inTable": true
      },
      {
        "name": "gstin",
        "label": "GSTIN",
        "type": "text",
        "required": false,
        "inTable": true
      },
      {
        "name": "isActive",
        "label": "Status",
        "type": "boolean",
        "format": "statusBadge",
        "enumKey": "accountStatus",
        "inTable": true
      }
    ]
  },
  "bank-accounts": {
    "key": "bank-accounts",
    "name": "Bank Account",
    "pluralName": "Bank Accounts",
    "module": "ACCOUNT",
    "feature": "BANK_ACCOUNTS",
    "idField": "id",
    "codeField": "accountNumber",
    "nameField": "bankName",
    "listPath": "/api/account/bank-accounts",
    "detailPath": "/api/account/bank-accounts/:id",
    "createPath": "/api/account/bank-accounts",
    "updatePath": "/api/account/bank-accounts/:id",
    "deletePath": "/api/account/bank-accounts/:id",
    "route": "/accounts/masters/bank-accounts",
    "permissions": {
      "read": "BANK_ACCOUNTS:READ",
      "create": "BANK_ACCOUNTS:CREATE",
      "update": "BANK_ACCOUNTS:UPDATE",
      "delete": "BANK_ACCOUNTS:DELETE"
    },
    "listCapabilities": {
      "searchParam": "search",
      "searchedFields": [
        "bankName",
        "accountNumber",
        "ifscCode",
        "branchName"
      ],
      "defaultSort": "createdAt,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      },
      "filters": [
        {
          "name": "accountType",
          "label": "Account Type",
          "type": "select",
          "enumKey": "bankAccountType"
        },
        {
          "name": "status",
          "label": "Status",
          "type": "select",
          "enumKey": "accountStatus"
        }
      ]
    },
    "fields": [
      {
        "name": "bankName",
        "label": "Bank Name",
        "type": "text",
        "required": true,
        "inTable": true,
        "sortable": true
      },
      {
        "name": "accountNumber",
        "label": "Account Number",
        "type": "text",
        "required": true,
        "inTable": true
      },
      {
        "name": "accountType",
        "label": "Account Type",
        "type": "select",
        "enumKey": "bankAccountType",
        "required": true,
        "inTable": true
      },
      {
        "name": "ifscCode",
        "label": "IFSC Code",
        "type": "text",
        "required": true,
        "inTable": true
      },
      {
        "name": "branchName",
        "label": "Branch",
        "type": "text",
        "required": false,
        "inTable": true
      },
      {
        "name": "currentBalance",
        "label": "Balance",
        "type": "decimal",
        "format": "currency",
        "inTable": true,
        "readOnly": true
      },
      {
        "name": "isActive",
        "label": "Status",
        "type": "boolean",
        "format": "statusBadge",
        "enumKey": "accountStatus",
        "inTable": true
      }
    ]
  },
  "chart-of-accounts": {
    "key": "chart-of-accounts",
    "name": "Chart of Account",
    "pluralName": "Chart of Accounts",
    "module": "ACCOUNT",
    "feature": "CHART_OF_ACCOUNTS",
    "idField": "id",
    "codeField": "accountCode",
    "nameField": "accountName",
    "listPath": "/api/account/chart-of-accounts",
    "detailPath": "/api/account/chart-of-accounts/:id",
    "createPath": "/api/account/chart-of-accounts",
    "updatePath": "/api/account/chart-of-accounts/:id",
    "deletePath": "/api/account/chart-of-accounts/:id",
    "route": "/accounts/masters/ledgers",
    "permissions": {
      "read": "CHART_OF_ACCOUNTS:READ",
      "create": "CHART_OF_ACCOUNTS:CREATE",
      "update": "CHART_OF_ACCOUNTS:UPDATE",
      "delete": "CHART_OF_ACCOUNTS:DELETE"
    },
    "listCapabilities": {
      "searchParam": "search",
      "searchedFields": [
        "accountCode",
        "accountName"
      ],
      "defaultSort": "accountCode,asc",
      "defaultPageBase": 0,
      "defaultPageSize": 20,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      },
      "filters": [
        {
          "name": "status",
          "label": "Status",
          "type": "select",
          "enumKey": "accountStatus"
        }
      ]
    },
    "fields": [
      {
        "name": "accountCode",
        "label": "Code",
        "type": "text",
        "required": true,
        "inTable": true,
        "sortable": true
      },
      {
        "name": "accountName",
        "label": "Account Name",
        "type": "text",
        "required": true,
        "inTable": true,
        "sortable": true
      },
      {
        "name": "accountGroup",
        "label": "Group",
        "type": "text",
        "inTable": true
      },
      {
        "name": "currentBalance",
        "label": "Current Balance",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "isActive",
        "label": "Status",
        "type": "boolean",
        "format": "statusBadge",
        "enumKey": "accountStatus",
        "inTable": true
      }
    ]
  },
  "sales-invoices": {
    "key": "sales-invoices",
    "name": "Sales Invoice",
    "pluralName": "Sales Invoices",
    "module": "ACCOUNT",
    "feature": "SALES_INVOICES",
    "idField": "id",
    "codeField": "invoiceNumber",
    "nameField": "invoiceNumber",
    "listPath": "/api/account/sales/invoices",
    "detailPath": "/api/account/sales/invoices/:id",
    "createPath": "/api/account/sales/invoices",
    "updatePath": "/api/account/sales/invoices/:id",
    "route": "/accounts/transactions/sales",
    "permissions": {
      "read": "SALES_INVOICES:READ",
      "create": "SALES_INVOICES:CREATE",
      "update": "SALES_INVOICES:UPDATE",
      "delete": "SALES_INVOICES:DELETE",
      "post": "SALES_INVOICES:POST",
      "cancel": "SALES_INVOICES:CANCEL"
    },
    "listCapabilities": {
      "searchParam": "search",
      "searchedFields": [
        "invoiceNumber",
        "customerName"
      ],
      "defaultSort": "invoiceDate,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      },
      "filters": [
        {
          "name": "status",
          "label": "Status",
          "type": "select",
          "enumKey": "invoiceStatus"
        },
        {
          "name": "customerId",
          "label": "Customer",
          "type": "relation",
          "relationResource": "customers"
        },
        {
          "name": "startDate",
          "label": "From Date",
          "type": "date"
        },
        {
          "name": "endDate",
          "label": "To Date",
          "type": "date"
        }
      ]
    },
    "fields": [
      {
        "name": "invoiceNumber",
        "label": "Invoice #",
        "type": "text",
        "inTable": true,
        "sortable": true
      },
      {
        "name": "invoiceDate",
        "label": "Invoice Date",
        "type": "date",
        "format": "date",
        "inTable": true,
        "sortable": true
      },
      {
        "name": "customerName",
        "label": "Customer",
        "type": "text",
        "inTable": true
      },
      {
        "name": "totalAmount",
        "label": "Total Amount",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "enumKey": "invoiceStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "purchase-invoices": {
    "key": "purchase-invoices",
    "name": "Purchase Invoice",
    "pluralName": "Purchase Invoices",
    "module": "ACCOUNT",
    "feature": "PURCHASE_INVOICES",
    "idField": "id",
    "codeField": "invoiceNumber",
    "nameField": "invoiceNumber",
    "listPath": "/api/account/invoices",
    "detailPath": "/api/account/invoices/:id",
    "createPath": "/api/account/invoices",
    "updatePath": "/api/account/invoices/:id",
    "route": "/accounts/transactions/purchase",
    "permissions": {
      "read": "PURCHASE_INVOICES:READ",
      "create": "PURCHASE_INVOICES:CREATE",
      "update": "PURCHASE_INVOICES:UPDATE",
      "delete": "PURCHASE_INVOICES:DELETE",
      "post": "PURCHASE_INVOICES:POST",
      "approve": "PURCHASE_INVOICES:APPROVE",
      "cancel": "PURCHASE_INVOICES:CANCEL"
    },
    "listCapabilities": {
      "searchParam": "search",
      "searchedFields": [
        "invoiceNumber",
        "vendorName",
        "vendorBillNumber"
      ],
      "defaultSort": "invoiceDate,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      },
      "filters": [
        {
          "name": "status",
          "label": "Status",
          "type": "select",
          "enumKey": "documentStatus"
        },
        {
          "name": "vendorId",
          "label": "Vendor",
          "type": "relation",
          "relationResource": "vendors"
        }
      ]
    },
    "fields": [
      {
        "name": "invoiceNumber",
        "label": "Invoice #",
        "type": "text",
        "inTable": true,
        "sortable": true
      },
      {
        "name": "vendorBillNumber",
        "label": "Vendor Bill #",
        "type": "text",
        "inTable": true
      },
      {
        "name": "vendorName",
        "label": "Vendor",
        "type": "text",
        "inTable": true
      },
      {
        "name": "invoiceDate",
        "label": "Invoice Date",
        "type": "date",
        "format": "date",
        "inTable": true
      },
      {
        "name": "totalAmount",
        "label": "Total Amount",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "enumKey": "documentStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "payment-vouchers": {
    "key": "payment-vouchers",
    "name": "Payment Voucher",
    "pluralName": "Payment Vouchers",
    "module": "ACCOUNT",
    "feature": "PAYMENT_VOUCHERS",
    "idField": "id",
    "codeField": "voucherNumber",
    "nameField": "voucherNumber",
    "listPath": "/api/account/payment-vouchers",
    "detailPath": "/api/account/payment-vouchers/:id",
    "createPath": "/api/account/payment-vouchers",
    "route": "/accounts/transactions/payments",
    "permissions": {
      "read": "PAYMENT_VOUCHERS:READ",
      "create": "PAYMENT_VOUCHERS:CREATE",
      "post": "PAYMENT_VOUCHERS:POST",
      "cancel": "PAYMENT_VOUCHERS:CANCEL"
    },
    "listCapabilities": {
      "searchParam": "search",
      "defaultSort": "voucherDate,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      },
      "filters": [
        {
          "name": "status",
          "label": "Status",
          "type": "select",
          "enumKey": "paymentVoucherStatus"
        },
        {
          "name": "vendorId",
          "label": "Vendor",
          "type": "relation",
          "relationResource": "vendors"
        }
      ]
    },
    "fields": [
      {
        "name": "voucherNumber",
        "label": "Voucher #",
        "type": "text",
        "inTable": true,
        "sortable": true
      },
      {
        "name": "voucherDate",
        "label": "Date",
        "type": "date",
        "format": "date",
        "inTable": true
      },
      {
        "name": "vendorName",
        "label": "Vendor",
        "type": "text",
        "inTable": true
      },
      {
        "name": "amount",
        "label": "Amount",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "enumKey": "paymentVoucherStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "credit-notes": {
    "key": "credit-notes",
    "name": "Credit Note",
    "pluralName": "Credit Notes",
    "module": "ACCOUNT",
    "feature": "CREDIT_NOTES",
    "idField": "id",
    "codeField": "creditNoteNumber",
    "nameField": "creditNoteNumber",
    "listPath": "/api/account/credit-notes",
    "detailPath": "/api/account/credit-notes/:id",
    "createPath": "/api/account/credit-notes",
    "updatePath": "/api/account/credit-notes/:id",
    "route": "/accounts/transactions/credit-notes",
    "permissions": {
      "read": "CREDIT_NOTES:READ",
      "create": "CREDIT_NOTES:CREATE",
      "post": "CREDIT_NOTES:POST",
      "cancel": "CREDIT_NOTES:CANCEL"
    },
    "listCapabilities": {
      "searchParam": "search",
      "defaultSort": "createdAt,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      }
    },
    "fields": [
      {
        "name": "creditNoteNumber",
        "label": "Note #",
        "type": "text",
        "inTable": true
      },
      {
        "name": "customerName",
        "label": "Customer",
        "type": "text",
        "inTable": true
      },
      {
        "name": "totalAmount",
        "label": "Amount",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "enumKey": "documentStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "debit-notes": {
    "key": "debit-notes",
    "name": "Debit Note",
    "pluralName": "Debit Notes",
    "module": "ACCOUNT",
    "feature": "DEBIT_NOTES",
    "idField": "id",
    "codeField": "debitNoteNumber",
    "nameField": "debitNoteNumber",
    "listPath": "/api/account/debit-notes",
    "detailPath": "/api/account/debit-notes/:id",
    "createPath": "/api/account/debit-notes",
    "updatePath": "/api/account/debit-notes/:id",
    "route": "/accounts/transactions/debit-notes",
    "permissions": {
      "read": "DEBIT_NOTES:READ",
      "create": "DEBIT_NOTES:CREATE",
      "post": "DEBIT_NOTES:POST",
      "cancel": "DEBIT_NOTES:CANCEL"
    },
    "listCapabilities": {
      "searchParam": "search",
      "defaultSort": "createdAt,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      }
    },
    "fields": [
      {
        "name": "debitNoteNumber",
        "label": "Note #",
        "type": "text",
        "inTable": true
      },
      {
        "name": "vendorName",
        "label": "Vendor",
        "type": "text",
        "inTable": true
      },
      {
        "name": "totalAmount",
        "label": "Amount",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "enumKey": "documentStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "gl-journals": {
    "key": "gl-journals",
    "name": "GL Journal",
    "pluralName": "GL Journals",
    "module": "ACCOUNT",
    "feature": "GL_JOURNALS",
    "idField": "id",
    "codeField": "journalNumber",
    "nameField": "journalNumber",
    "listPath": "/api/account/gl-journals",
    "detailPath": "/api/account/gl-journals/:id",
    "createPath": "/api/account/gl-journals",
    "updatePath": "/api/account/gl-journals/:id",
    "route": "/accounts/transactions/journal",
    "permissions": {
      "read": "GL_JOURNALS:READ",
      "create": "GL_JOURNALS:CREATE",
      "update": "GL_JOURNALS:UPDATE",
      "post": "GL_JOURNALS:POST",
      "reverse": "GL_JOURNALS:REVERSE"
    },
    "listCapabilities": {
      "searchParam": "search",
      "defaultSort": "journalDate,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      }
    },
    "fields": [
      {
        "name": "journalNumber",
        "label": "Journal #",
        "type": "text",
        "inTable": true,
        "sortable": true
      },
      {
        "name": "journalDate",
        "label": "Date",
        "type": "date",
        "format": "date",
        "inTable": true
      },
      {
        "name": "referenceNumber",
        "label": "Reference",
        "type": "text",
        "inTable": true
      },
      {
        "name": "totalDebit",
        "label": "Total Debit",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "totalCredit",
        "label": "Total Credit",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "enumKey": "journalStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "budget-headers": {
    "key": "budget-headers",
    "name": "Budget Header",
    "pluralName": "Budget Headers",
    "module": "ACCOUNT",
    "feature": "BUDGET_HEADERS",
    "idField": "id",
    "codeField": "budgetCode",
    "nameField": "budgetName",
    "listPath": "/api/account/budget-headers",
    "detailPath": "/api/account/budget-headers/:id",
    "createPath": "/api/account/budget-headers",
    "updatePath": "/api/account/budget-headers/:id",
    "route": "/accounts/budget/budget-headers",
    "permissions": {
      "read": "BUDGET_HEADERS:READ",
      "create": "BUDGET_HEADERS:CREATE",
      "update": "BUDGET_HEADERS:UPDATE",
      "approve": "BUDGET_HEADERS:APPROVE"
    },
    "listCapabilities": {
      "searchParam": "search",
      "defaultSort": "createdAt,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      }
    },
    "fields": [
      {
        "name": "budgetCode",
        "label": "Code",
        "type": "text",
        "inTable": true
      },
      {
        "name": "budgetName",
        "label": "Budget Name",
        "type": "text",
        "inTable": true
      },
      {
        "name": "fiscalYearName",
        "label": "Fiscal Year",
        "type": "text",
        "inTable": true
      },
      {
        "name": "totalBudgetAmount",
        "label": "Allocated",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "enumKey": "budgetStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "expenses": {
    "key": "expenses",
    "name": "Expense Claim",
    "pluralName": "Expense Claims",
    "module": "ACCOUNT",
    "feature": "EXPENSES",
    "idField": "id",
    "codeField": "expenseNumber",
    "nameField": "description",
    "listPath": "/api/account/v1/expenses",
    "detailPath": "/api/account/v1/expenses/:id",
    "createPath": "/api/account/v1/expenses",
    "updatePath": "/api/account/v1/expenses/:id",
    "route": "/accounts/transactions/expenses",
    "permissions": {
      "read": "EXPENSES:READ",
      "create": "EXPENSES:CREATE",
      "update": "EXPENSES:UPDATE",
      "approve": "EXPENSES:APPROVE",
      "reject": "EXPENSES:REJECT"
    },
    "listCapabilities": {
      "searchParam": "search",
      "defaultSort": "createdAt,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      }
    },
    "fields": [
      {
        "name": "expenseNumber",
        "label": "Expense #",
        "type": "text",
        "inTable": true
      },
      {
        "name": "expenseDate",
        "label": "Date",
        "type": "date",
        "format": "date",
        "inTable": true
      },
      {
        "name": "employeeName",
        "label": "Claimant",
        "type": "text",
        "inTable": true
      },
      {
        "name": "totalAmount",
        "label": "Amount",
        "type": "decimal",
        "format": "currency",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "enumKey": "expenseStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "inventory-products": {
    "key": "inventory-products",
    "name": "Product",
    "pluralName": "Products",
    "module": "INVENTORY",
    "feature": "PRODUCTS",
    "idField": "id",
    "codeField": "sku",
    "nameField": "name",
    "listPath": "/api/inventory/products",
    "detailPath": "/api/inventory/products/:id",
    "createPath": "/api/inventory/products",
    "updatePath": "/api/inventory/products/:id",
    "deletePath": "/api/inventory/products/:id",
    "route": "/inventory/products",
    "permissions": {
      "read": "PRODUCTS:READ",
      "create": "PRODUCTS:CREATE",
      "update": "PRODUCTS:UPDATE",
      "delete": "PRODUCTS:DELETE"
    },
    "listCapabilities": {
      "searchParam": "search",
      "defaultSort": "createdAt,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      }
    },
    "fields": [
      {
        "name": "sku",
        "label": "SKU",
        "type": "text",
        "inTable": true,
        "sortable": true
      },
      {
        "name": "name",
        "label": "Product Name",
        "type": "text",
        "required": true,
        "inTable": true,
        "sortable": true
      },
      {
        "name": "categoryName",
        "label": "Category",
        "type": "text",
        "inTable": true
      },
      {
        "name": "uomName",
        "label": "UOM",
        "type": "text",
        "inTable": true
      },
      {
        "name": "currentStock",
        "label": "Stock",
        "type": "integer",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "enumKey": "productStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "inventory-warehouses": {
    "key": "inventory-warehouses",
    "name": "Warehouse",
    "pluralName": "Warehouses",
    "module": "INVENTORY",
    "feature": "WAREHOUSES",
    "idField": "id",
    "codeField": "code",
    "nameField": "name",
    "listPath": "/api/inventory/warehouses",
    "detailPath": "/api/inventory/warehouses/:id",
    "createPath": "/api/inventory/warehouses",
    "updatePath": "/api/inventory/warehouses/:id",
    "deletePath": "/api/inventory/warehouses/:id",
    "route": "/inventory/warehouses",
    "permissions": {
      "read": "WAREHOUSES:READ",
      "create": "WAREHOUSES:CREATE",
      "update": "WAREHOUSES:UPDATE",
      "delete": "WAREHOUSES:DELETE"
    },
    "listCapabilities": {
      "searchParam": "search",
      "defaultSort": "createdAt,desc",
      "defaultPageBase": 0,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "size",
      "responseKeys": {
        "itemsKey": "data.content",
        "totalKey": "data.totalElements"
      }
    },
    "fields": [
      {
        "name": "code",
        "label": "Warehouse Code",
        "type": "text",
        "inTable": true,
        "sortable": true
      },
      {
        "name": "name",
        "label": "Warehouse Name",
        "type": "text",
        "required": true,
        "inTable": true,
        "sortable": true
      },
      {
        "name": "city",
        "label": "City",
        "type": "text",
        "inTable": true
      },
      {
        "name": "state",
        "label": "State",
        "type": "text",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "select",
        "enumKey": "accountStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "sso-users": {
    "key": "sso-users",
    "name": "User",
    "pluralName": "Users",
    "module": "SSO",
    "feature": "USERS",
    "idField": "id",
    "codeField": "username",
    "nameField": "fullName",
    "listPath": "/api/sso/users",
    "detailPath": "/api/sso/users/:id",
    "createPath": "/api/sso/users",
    "updatePath": "/api/sso/users/:id",
    "deletePath": "/api/sso/users/:id",
    "route": "/settings/users",
    "permissions": {
      "read": "USERS:READ",
      "create": "USERS:CREATE",
      "update": "USERS:UPDATE",
      "delete": "USERS:DELETE"
    },
    "listCapabilities": {
      "searchParam": "search",
      "defaultSort": "createdAt,desc",
      "defaultPageBase": 1,
      "defaultPageSize": 10,
      "pageParam": "page",
      "sizeParam": "pageSize",
      "responseKeys": {
        "itemsKey": "data",
        "totalKey": "data.length"
      }
    },
    "fields": [
      {
        "name": "username",
        "label": "Username",
        "type": "text",
        "inTable": true
      },
      {
        "name": "fullName",
        "label": "Full Name",
        "type": "text",
        "inTable": true
      },
      {
        "name": "email",
        "label": "Email",
        "type": "email",
        "inTable": true
      },
      {
        "name": "roleName",
        "label": "Role",
        "type": "text",
        "inTable": true
      },
      {
        "name": "accountStatus",
        "label": "Status",
        "type": "select",
        "enumKey": "accountStatus",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  },
  "sso-roles": {
    "key": "sso-roles",
    "name": "Role",
    "pluralName": "Roles",
    "module": "SSO",
    "feature": "ROLES",
    "idField": "id",
    "codeField": "name",
    "nameField": "name",
    "listPath": "/api/sso/roles",
    "detailPath": "/api/sso/roles/:id",
    "createPath": "/api/sso/roles",
    "updatePath": "/api/sso/roles/:id",
    "deletePath": "/api/sso/roles/:id",
    "route": "/settings/roles",
    "permissions": {
      "read": "ROLES:READ",
      "create": "ROLES:CREATE",
      "update": "ROLES:UPDATE",
      "delete": "ROLES:DELETE"
    },
    "listCapabilities": {
      "searchParam": "search",
      "defaultSort": "name,asc",
      "defaultPageBase": 1,
      "defaultPageSize": 20,
      "pageParam": "page",
      "sizeParam": "pageSize",
      "responseKeys": {
        "itemsKey": "data",
        "totalKey": "data.length"
      }
    },
    "fields": [
      {
        "name": "name",
        "label": "Role Name",
        "type": "text",
        "inTable": true,
        "sortable": true
      },
      {
        "name": "description",
        "label": "Description",
        "type": "text",
        "inTable": true
      },
      {
        "name": "status",
        "label": "Status",
        "type": "boolean",
        "format": "statusBadge",
        "inTable": true
      }
    ]
  }
};

export function getResourceConfig(resourceKey) {
  const cfg = RESOURCE_REGISTRY[resourceKey];
  if (!cfg) {
    console.warn(`[ResourceRegistry] Resource '${resourceKey}' not found in registry.`);
    return null;
  }
  return cfg;
}

export function getAllResources() {
  return Object.values(RESOURCE_REGISTRY);
}

export default RESOURCE_REGISTRY;
