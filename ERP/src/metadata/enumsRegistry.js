/**
 * Unified Backend Enum Registry
 * Single Source of Truth for all Backend Enums
 * Generated automatically from backend source code.
 */

export const ENUMS_REGISTRY = {
  "accountCategoryType": {
    "name": "AccountCategoryType",
    "service": "account-main",
    "options": [
      {
        "value": "AST",
        "label": "Assets",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "LIA",
        "label": "Liabilities",
        "color": "purple",
        "className": "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60"
      },
      {
        "value": "EQT",
        "label": "Equity",
        "color": "purple",
        "className": "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60"
      },
      {
        "value": "INC",
        "label": "Income",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "EXP",
        "label": "Expense",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "AST",
      "LIA",
      "EQT",
      "INC",
      "EXP"
    ]
  },
  "AccountCategoryType": {
    "name": "AccountCategoryType",
    "service": "account-main",
    "options": [
      {
        "value": "AST",
        "label": "Assets",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "LIA",
        "label": "Liabilities",
        "color": "purple",
        "className": "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60"
      },
      {
        "value": "EQT",
        "label": "Equity",
        "color": "purple",
        "className": "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60"
      },
      {
        "value": "INC",
        "label": "Income",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "EXP",
        "label": "Expense",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "AST",
      "LIA",
      "EQT",
      "INC",
      "EXP"
    ]
  },
  "accountNature": {
    "name": "AccountNature",
    "service": "account-main",
    "options": [
      {
        "value": "DEBIT",
        "label": "Debit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CREDIT",
        "label": "Credit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DEBIT",
      "CREDIT"
    ]
  },
  "AccountNature": {
    "name": "AccountNature",
    "service": "account-main",
    "options": [
      {
        "value": "DEBIT",
        "label": "Debit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CREDIT",
        "label": "Credit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DEBIT",
      "CREDIT"
    ]
  },
  "approvalStatus": {
    "name": "ApprovalStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "LEVEL1_APPROVED",
        "label": "Level1 Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "LEVEL2_APPROVED",
        "label": "Level2 Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "FINANCE_APPROVED",
        "label": "Finance Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "PAID",
        "label": "Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "LEVEL1_APPROVED",
      "LEVEL2_APPROVED",
      "FINANCE_APPROVED",
      "REJECTED",
      "PAID",
      "CANCELLED"
    ]
  },
  "ApprovalStatus": {
    "name": "ApprovalStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "LEVEL1_APPROVED",
        "label": "Level1 Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "LEVEL2_APPROVED",
        "label": "Level2 Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "FINANCE_APPROVED",
        "label": "Finance Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "PAID",
        "label": "Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "LEVEL1_APPROVED",
      "LEVEL2_APPROVED",
      "FINANCE_APPROVED",
      "REJECTED",
      "PAID",
      "CANCELLED"
    ]
  },
  "balanceType": {
    "name": "BalanceType",
    "service": "account-main",
    "options": [
      {
        "value": "DR",
        "label": "Debit (Dr)",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CR",
        "label": "Credit (Cr)",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DR",
      "CR"
    ]
  },
  "BalanceType": {
    "name": "BalanceType",
    "service": "account-main",
    "options": [
      {
        "value": "DR",
        "label": "Debit (Dr)",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CR",
        "label": "Credit (Cr)",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DR",
      "CR"
    ]
  },
  "bankAccountType": {
    "name": "BankAccountType",
    "service": "account-main",
    "options": [
      {
        "value": "SAVINGS",
        "label": "Savings",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "CURRENT",
        "label": "Current",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "CASH_CREDIT",
        "label": "Cash Credit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OVERDRAFT",
        "label": "Overdraft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      }
    ],
    "values": [
      "SAVINGS",
      "CURRENT",
      "CASH_CREDIT",
      "OVERDRAFT"
    ]
  },
  "BankAccountType": {
    "name": "BankAccountType",
    "service": "account-main",
    "options": [
      {
        "value": "SAVINGS",
        "label": "Savings",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "CURRENT",
        "label": "Current",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "CASH_CREDIT",
        "label": "Cash Credit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OVERDRAFT",
        "label": "Overdraft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      }
    ],
    "values": [
      "SAVINGS",
      "CURRENT",
      "CASH_CREDIT",
      "OVERDRAFT"
    ]
  },
  "bankTransactionType": {
    "name": "BankTransactionType",
    "service": "account-main",
    "options": [
      {
        "value": "DEPOSIT",
        "label": "Deposit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WITHDRAWAL",
        "label": "Withdrawal",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PAYMENT",
        "label": "Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RECEIPT",
        "label": "Receipt",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BANK_CHARGES",
        "label": "Bank Charges",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "INTEREST",
        "label": "Interest",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TRANSFER",
        "label": "Transfer",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REVERSAL",
        "label": "Reversal",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DEPOSIT",
      "WITHDRAWAL",
      "PAYMENT",
      "RECEIPT",
      "BANK_CHARGES",
      "INTEREST",
      "TRANSFER",
      "REVERSAL"
    ]
  },
  "BankTransactionType": {
    "name": "BankTransactionType",
    "service": "account-main",
    "options": [
      {
        "value": "DEPOSIT",
        "label": "Deposit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WITHDRAWAL",
        "label": "Withdrawal",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PAYMENT",
        "label": "Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RECEIPT",
        "label": "Receipt",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BANK_CHARGES",
        "label": "Bank Charges",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "INTEREST",
        "label": "Interest",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TRANSFER",
        "label": "Transfer",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REVERSAL",
        "label": "Reversal",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DEPOSIT",
      "WITHDRAWAL",
      "PAYMENT",
      "RECEIPT",
      "BANK_CHARGES",
      "INTEREST",
      "TRANSFER",
      "REVERSAL"
    ]
  },
  "budgetStatus": {
    "name": "BudgetStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "REVISED",
        "label": "Revised",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "APPROVED",
      "CLOSED",
      "REVISED"
    ]
  },
  "BudgetStatus": {
    "name": "BudgetStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "REVISED",
        "label": "Revised",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "APPROVED",
      "CLOSED",
      "REVISED"
    ]
  },
  "documentStatus": {
    "name": "DocumentStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "POSTED",
      "REJECTED",
      "CANCELLED",
      "REVERSED"
    ]
  },
  "DocumentStatus": {
    "name": "DocumentStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "POSTED",
      "REJECTED",
      "CANCELLED",
      "REVERSED"
    ]
  },
  "einvoiceStatus": {
    "name": "EinvoiceStatus",
    "service": "account-main",
    "options": [
      {
        "value": "PENDING",
        "label": "Pending",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "GENERATED",
        "label": "Generated",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "FAILED",
        "label": "Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "PENDING",
      "GENERATED",
      "FAILED",
      "CANCELLED"
    ]
  },
  "EinvoiceStatus": {
    "name": "EinvoiceStatus",
    "service": "account-main",
    "options": [
      {
        "value": "PENDING",
        "label": "Pending",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "GENERATED",
        "label": "Generated",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "FAILED",
        "label": "Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "PENDING",
      "GENERATED",
      "FAILED",
      "CANCELLED"
    ]
  },
  "expenseRequestStatus": {
    "name": "ExpenseRequestStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PENDING_APPROVAL",
        "label": "Pending Approval",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CONVERTED_TO_EXPENSE",
        "label": "Converted To Expense",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
      "CONVERTED_TO_EXPENSE"
    ]
  },
  "ExpenseRequestStatus": {
    "name": "ExpenseRequestStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PENDING_APPROVAL",
        "label": "Pending Approval",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CONVERTED_TO_EXPENSE",
        "label": "Converted To Expense",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
      "CONVERTED_TO_EXPENSE"
    ]
  },
  "exportFormat": {
    "name": "ExportFormat",
    "service": "account-main",
    "options": [
      {
        "value": "PDF",
        "label": "Pdf",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "XLSX",
        "label": "Xlsx",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CSV",
        "label": "Csv",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PDF",
      "XLSX",
      "CSV"
    ]
  },
  "ExportFormat": {
    "name": "ExportFormat",
    "service": "account-main",
    "options": [
      {
        "value": "PDF",
        "label": "Pdf",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "XLSX",
        "label": "Xlsx",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CSV",
        "label": "Csv",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PDF",
      "XLSX",
      "CSV"
    ]
  },
  "gstTreatment": {
    "name": "GstTreatment",
    "service": "account-main",
    "options": [
      {
        "value": "GST_APPLICABLE",
        "label": "Gst Applicable",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "GST_NOT_APPLICABLE",
        "label": "Gst Not Applicable",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REVERSE_CHARGE",
        "label": "Reverse Charge",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OTHER",
        "label": "Other",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "GST_APPLICABLE",
      "GST_NOT_APPLICABLE",
      "REVERSE_CHARGE",
      "OTHER"
    ]
  },
  "GstTreatment": {
    "name": "GstTreatment",
    "service": "account-main",
    "options": [
      {
        "value": "GST_APPLICABLE",
        "label": "Gst Applicable",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "GST_NOT_APPLICABLE",
        "label": "Gst Not Applicable",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REVERSE_CHARGE",
        "label": "Reverse Charge",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OTHER",
        "label": "Other",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "GST_APPLICABLE",
      "GST_NOT_APPLICABLE",
      "REVERSE_CHARGE",
      "OTHER"
    ]
  },
  "hsnSacType": {
    "name": "HsnSacType",
    "service": "account-main",
    "options": [
      {
        "value": "HSN",
        "label": "Hsn",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SAC",
        "label": "Sac",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "HSN",
      "SAC"
    ]
  },
  "HsnSacType": {
    "name": "HsnSacType",
    "service": "account-main",
    "options": [
      {
        "value": "HSN",
        "label": "Hsn",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SAC",
        "label": "Sac",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "HSN",
      "SAC"
    ]
  },
  "invoiceStatus": {
    "name": "InvoiceStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PENDING_APPROVAL",
        "label": "Pending Approval",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PARTIALLY_PAID",
        "label": "Partially Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PARTIALLY_RECEIVED",
        "label": "Partially Received",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PAID",
        "label": "Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "WRITTEN_OFF",
        "label": "Written Off",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "VOIDED",
        "label": "Voided",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "INVENTORY_FAILED",
        "label": "Inventory Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "FULLY_PAID",
        "label": "Fully Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "POSTED",
      "PARTIALLY_PAID",
      "PARTIALLY_RECEIVED",
      "PAID",
      "CANCELLED",
      "REJECTED",
      "WRITTEN_OFF",
      "VOIDED",
      "REVERSED",
      "INVENTORY_FAILED",
      "FULLY_PAID"
    ]
  },
  "InvoiceStatus": {
    "name": "InvoiceStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PENDING_APPROVAL",
        "label": "Pending Approval",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PARTIALLY_PAID",
        "label": "Partially Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PARTIALLY_RECEIVED",
        "label": "Partially Received",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PAID",
        "label": "Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "WRITTEN_OFF",
        "label": "Written Off",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "VOIDED",
        "label": "Voided",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "INVENTORY_FAILED",
        "label": "Inventory Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "FULLY_PAID",
        "label": "Fully Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "POSTED",
      "PARTIALLY_PAID",
      "PARTIALLY_RECEIVED",
      "PAID",
      "CANCELLED",
      "REJECTED",
      "WRITTEN_OFF",
      "VOIDED",
      "REVERSED",
      "INVENTORY_FAILED",
      "FULLY_PAID"
    ]
  },
  "itcEligibility": {
    "name": "ItcEligibility",
    "service": "account-main",
    "options": [
      {
        "value": "ITC_ELIGIBLE",
        "label": "Itc Eligible",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ITC_NOT_ELIGIBLE",
        "label": "Itc Not Eligible",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ITC_BLOCKED",
        "label": "Itc Blocked",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "NOT_APPLICABLE",
        "label": "Not Applicable",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ITC_ELIGIBLE",
      "ITC_NOT_ELIGIBLE",
      "ITC_BLOCKED",
      "NOT_APPLICABLE"
    ]
  },
  "ItcEligibility": {
    "name": "ItcEligibility",
    "service": "account-main",
    "options": [
      {
        "value": "ITC_ELIGIBLE",
        "label": "Itc Eligible",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ITC_NOT_ELIGIBLE",
        "label": "Itc Not Eligible",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ITC_BLOCKED",
        "label": "Itc Blocked",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "NOT_APPLICABLE",
        "label": "Not Applicable",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ITC_ELIGIBLE",
      "ITC_NOT_ELIGIBLE",
      "ITC_BLOCKED",
      "NOT_APPLICABLE"
    ]
  },
  "itemType": {
    "name": "ItemType",
    "service": "account-main",
    "options": [
      {
        "value": "PRODUCT",
        "label": "Product",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPENSE",
        "label": "Expense",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PRODUCT",
      "EXPENSE"
    ]
  },
  "ItemType": {
    "name": "ItemType",
    "service": "account-main",
    "options": [
      {
        "value": "PRODUCT",
        "label": "Product",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPENSE",
        "label": "Expense",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PRODUCT",
      "EXPENSE"
    ]
  },
  "paymentMode": {
    "name": "PaymentMode",
    "service": "account-main",
    "options": [
      {
        "value": "CASH",
        "label": "Cash",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BANK_TRANSFER",
        "label": "Bank Transfer",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CHEQUE",
        "label": "Cheque",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "UPI",
        "label": "Upi",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RTGS",
        "label": "Rtgs",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "NEFT",
        "label": "Neft",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "IMPS",
        "label": "Imps",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CARD",
        "label": "Card",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "CASH",
      "BANK_TRANSFER",
      "CHEQUE",
      "UPI",
      "RTGS",
      "NEFT",
      "IMPS",
      "CARD"
    ]
  },
  "PaymentMode": {
    "name": "PaymentMode",
    "service": "account-main",
    "options": [
      {
        "value": "CASH",
        "label": "Cash",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BANK_TRANSFER",
        "label": "Bank Transfer",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CHEQUE",
        "label": "Cheque",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "UPI",
        "label": "Upi",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RTGS",
        "label": "Rtgs",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "NEFT",
        "label": "Neft",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "IMPS",
        "label": "Imps",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CARD",
        "label": "Card",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "CASH",
      "BANK_TRANSFER",
      "CHEQUE",
      "UPI",
      "RTGS",
      "NEFT",
      "IMPS",
      "CARD"
    ]
  },
  "paymentStatus": {
    "name": "PaymentStatus",
    "service": "account-main",
    "options": [
      {
        "value": "UNPAID",
        "label": "Unpaid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PARTIAL",
        "label": "Partial",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PAID",
        "label": "Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CREATED",
        "label": "Created",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      }
    ],
    "values": [
      "UNPAID",
      "PARTIAL",
      "PAID",
      "CANCELLED",
      "REVERSED",
      "CREATED",
      "POSTED",
      "DRAFT",
      "SUBMITTED",
      "REJECTED",
      "APPROVED"
    ]
  },
  "PaymentStatus": {
    "name": "PaymentStatus",
    "service": "account-main",
    "options": [
      {
        "value": "UNPAID",
        "label": "Unpaid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PARTIAL",
        "label": "Partial",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PAID",
        "label": "Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CREATED",
        "label": "Created",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      }
    ],
    "values": [
      "UNPAID",
      "PARTIAL",
      "PAID",
      "CANCELLED",
      "REVERSED",
      "CREATED",
      "POSTED",
      "DRAFT",
      "SUBMITTED",
      "REJECTED",
      "APPROVED"
    ]
  },
  "paymentType": {
    "name": "PaymentType",
    "service": "account-main",
    "options": [
      {
        "value": "CREDIT",
        "label": "Credit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CASH",
        "label": "Cash",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BANK",
        "label": "Bank",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CARD",
        "label": "Card",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "UPI",
        "label": "Upi",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OTHER",
        "label": "Other",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "CREDIT",
      "CASH",
      "BANK",
      "CARD",
      "UPI",
      "OTHER"
    ]
  },
  "PaymentType": {
    "name": "PaymentType",
    "service": "account-main",
    "options": [
      {
        "value": "CREDIT",
        "label": "Credit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CASH",
        "label": "Cash",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BANK",
        "label": "Bank",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CARD",
        "label": "Card",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "UPI",
        "label": "Upi",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OTHER",
        "label": "Other",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "CREDIT",
      "CASH",
      "BANK",
      "CARD",
      "UPI",
      "OTHER"
    ]
  },
  "paymentVoucherStatus": {
    "name": "PaymentVoucherStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "POSTED",
      "REJECTED",
      "REVERSED",
      "CANCELLED"
    ]
  },
  "PaymentVoucherStatus": {
    "name": "PaymentVoucherStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "POSTED",
      "REJECTED",
      "REVERSED",
      "CANCELLED"
    ]
  },
  "postingStatus": {
    "name": "PostingStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "FAILED",
        "label": "Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "POSTED",
      "FAILED",
      "REVERSED",
      "CANCELLED"
    ]
  },
  "PostingStatus": {
    "name": "PostingStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "FAILED",
        "label": "Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "POSTED",
      "FAILED",
      "REVERSED",
      "CANCELLED"
    ]
  },
  "purchaseDocumentType": {
    "name": "PurchaseDocumentType",
    "service": "account-main",
    "options": [
      {
        "value": "TAX_INVOICE",
        "label": "Tax Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BILL_OF_SUPPLY",
        "label": "Bill Of Supply",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CASH_MEMO",
        "label": "Cash Memo",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OTHER_SUPPORTING_DOCUMENT",
        "label": "Other Supporting Document",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "NO_INVOICE",
        "label": "No Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "TAX_INVOICE",
      "BILL_OF_SUPPLY",
      "CASH_MEMO",
      "OTHER_SUPPORTING_DOCUMENT",
      "NO_INVOICE"
    ]
  },
  "PurchaseDocumentType": {
    "name": "PurchaseDocumentType",
    "service": "account-main",
    "options": [
      {
        "value": "TAX_INVOICE",
        "label": "Tax Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BILL_OF_SUPPLY",
        "label": "Bill Of Supply",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CASH_MEMO",
        "label": "Cash Memo",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OTHER_SUPPORTING_DOCUMENT",
        "label": "Other Supporting Document",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "NO_INVOICE",
        "label": "No Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "TAX_INVOICE",
      "BILL_OF_SUPPLY",
      "CASH_MEMO",
      "OTHER_SUPPORTING_DOCUMENT",
      "NO_INVOICE"
    ]
  },
  "purchaseNature": {
    "name": "PurchaseNature",
    "service": "account-main",
    "options": [
      {
        "value": "STOCK",
        "label": "Stock",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPENSE",
        "label": "Expense",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "STOCK",
      "EXPENSE"
    ]
  },
  "PurchaseNature": {
    "name": "PurchaseNature",
    "service": "account-main",
    "options": [
      {
        "value": "STOCK",
        "label": "Stock",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPENSE",
        "label": "Expense",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "STOCK",
      "EXPENSE"
    ]
  },
  "purchaseSource": {
    "name": "PurchaseSource",
    "service": "account-main",
    "options": [
      {
        "value": "PO",
        "label": "Po",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "GRN",
        "label": "Grn",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DIRECT_LOCAL_PURCHASE",
        "label": "Direct Local Purchase",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PO",
      "GRN",
      "DIRECT_LOCAL_PURCHASE"
    ]
  },
  "PurchaseSource": {
    "name": "PurchaseSource",
    "service": "account-main",
    "options": [
      {
        "value": "PO",
        "label": "Po",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "GRN",
        "label": "Grn",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DIRECT_LOCAL_PURCHASE",
        "label": "Direct Local Purchase",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PO",
      "GRN",
      "DIRECT_LOCAL_PURCHASE"
    ]
  },
  "receiptVoucherStatus": {
    "name": "ReceiptVoucherStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "POSTED",
      "REJECTED",
      "REVERSED",
      "CANCELLED"
    ]
  },
  "ReceiptVoucherStatus": {
    "name": "ReceiptVoucherStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "POSTED",
      "REJECTED",
      "REVERSED",
      "CANCELLED"
    ]
  },
  "reimbursementStatus": {
    "name": "ReimbursementStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "PAID",
        "label": "Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "PAID",
      "CANCELLED"
    ]
  },
  "ReimbursementStatus": {
    "name": "ReimbursementStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "PAID",
        "label": "Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "PAID",
      "CANCELLED"
    ]
  },
  "requestType": {
    "name": "RequestType",
    "service": "account-main",
    "options": [
      {
        "value": "EXPENSE_REQUEST",
        "label": "Expense Request",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ADVANCE_REQUEST",
        "label": "Advance Request",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "EXPENSE_REQUEST",
      "ADVANCE_REQUEST"
    ]
  },
  "RequestType": {
    "name": "RequestType",
    "service": "account-main",
    "options": [
      {
        "value": "EXPENSE_REQUEST",
        "label": "Expense Request",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ADVANCE_REQUEST",
        "label": "Advance Request",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "EXPENSE_REQUEST",
      "ADVANCE_REQUEST"
    ]
  },
  "roleType": {
    "name": "RoleType",
    "service": "account-main",
    "options": [
      {
        "value": "EMPLOYEE",
        "label": "Employee",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DRIVER",
        "label": "Driver",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "EMPLOYEE",
      "DRIVER"
    ]
  },
  "RoleType": {
    "name": "RoleType",
    "service": "account-main",
    "options": [
      {
        "value": "EMPLOYEE",
        "label": "Employee",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DRIVER",
        "label": "Driver",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "EMPLOYEE",
      "DRIVER"
    ]
  },
  "varianceType": {
    "name": "VarianceType",
    "service": "account-main",
    "options": [
      {
        "value": "FAVORABLE",
        "label": "Favorable",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "UNFAVORABLE",
        "label": "Unfavorable",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BREAKEVEN",
        "label": "Breakeven",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "FAVORABLE",
      "UNFAVORABLE",
      "BREAKEVEN"
    ]
  },
  "VarianceType": {
    "name": "VarianceType",
    "service": "account-main",
    "options": [
      {
        "value": "FAVORABLE",
        "label": "Favorable",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "UNFAVORABLE",
        "label": "Unfavorable",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BREAKEVEN",
        "label": "Breakeven",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "FAVORABLE",
      "UNFAVORABLE",
      "BREAKEVEN"
    ]
  },
  "accountingPeriodStatus": {
    "name": "AccountingPeriodStatus",
    "service": "account-main",
    "options": [
      {
        "value": "OPEN",
        "label": "Open",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "LOCKED",
        "label": "Locked",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      }
    ],
    "values": [
      "OPEN",
      "CLOSED",
      "LOCKED"
    ]
  },
  "AccountingPeriodStatus": {
    "name": "AccountingPeriodStatus",
    "service": "account-main",
    "options": [
      {
        "value": "OPEN",
        "label": "Open",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "LOCKED",
        "label": "Locked",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      }
    ],
    "values": [
      "OPEN",
      "CLOSED",
      "LOCKED"
    ]
  },
  "periodType": {
    "name": "PeriodType",
    "service": "account-main",
    "options": [
      {
        "value": "MONTHLY",
        "label": "Monthly",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "QUARTERLY",
        "label": "Quarterly",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "HALF_YEARLY",
        "label": "Half Yearly",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "YEARLY",
        "label": "Yearly",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CUSTOM",
        "label": "Custom",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "MONTHLY",
      "QUARTERLY",
      "HALF_YEARLY",
      "YEARLY",
      "CUSTOM"
    ]
  },
  "PeriodType": {
    "name": "PeriodType",
    "service": "account-main",
    "options": [
      {
        "value": "MONTHLY",
        "label": "Monthly",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "QUARTERLY",
        "label": "Quarterly",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "HALF_YEARLY",
        "label": "Half Yearly",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "YEARLY",
        "label": "Yearly",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CUSTOM",
        "label": "Custom",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "MONTHLY",
      "QUARTERLY",
      "HALF_YEARLY",
      "YEARLY",
      "CUSTOM"
    ]
  },
  "accountStatus": {
    "name": "AccountStatus",
    "service": "account-main",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INACTIVE",
        "label": "Inactive",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "BLOCKED",
        "label": "Blocked",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "ACTIVE",
      "INACTIVE",
      "BLOCKED"
    ]
  },
  "AccountStatus": {
    "name": "AccountStatus",
    "service": "account-main",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INACTIVE",
        "label": "Inactive",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "BLOCKED",
        "label": "Blocked",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "ACTIVE",
      "INACTIVE",
      "BLOCKED"
    ]
  },
  "status": {
    "name": "Status",
    "service": "account-main",
    "options": [
      {
        "value": "VERIFIED",
        "label": "Verified",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "UNVERIFIED",
        "label": "Unverified",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      }
    ],
    "values": [
      "VERIFIED",
      "UNVERIFIED"
    ]
  },
  "Status": {
    "name": "Status",
    "service": "account-main",
    "options": [
      {
        "value": "VERIFIED",
        "label": "Verified",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "UNVERIFIED",
        "label": "Unverified",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      }
    ],
    "values": [
      "VERIFIED",
      "UNVERIFIED"
    ]
  },
  "salesDocumentType": {
    "name": "SalesDocumentType",
    "service": "account-main",
    "options": [
      {
        "value": "QUOTATION",
        "label": "Quotation",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SALES_ORDER",
        "label": "Sales Order",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "INVOICE",
        "label": "Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PROFORMA_INVOICE",
        "label": "Proforma Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "QUOTATION",
      "SALES_ORDER",
      "INVOICE",
      "PROFORMA_INVOICE"
    ]
  },
  "SalesDocumentType": {
    "name": "SalesDocumentType",
    "service": "account-main",
    "options": [
      {
        "value": "QUOTATION",
        "label": "Quotation",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SALES_ORDER",
        "label": "Sales Order",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "INVOICE",
        "label": "Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PROFORMA_INVOICE",
        "label": "Proforma Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "QUOTATION",
      "SALES_ORDER",
      "INVOICE",
      "PROFORMA_INVOICE"
    ]
  },
  "deliveryChallanStatus": {
    "name": "DeliveryChallanStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "CONFIRMED",
        "label": "Confirmed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "CONFIRMED",
      "CANCELLED"
    ]
  },
  "DeliveryChallanStatus": {
    "name": "DeliveryChallanStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "CONFIRMED",
        "label": "Confirmed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "CONFIRMED",
      "CANCELLED"
    ]
  },
  "fiscalYearPreset": {
    "name": "FiscalYearPreset",
    "service": "account-main",
    "options": [
      {
        "value": "INDIA_APR_MAR",
        "label": "India Apr Mar",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "JAN_DEC",
        "label": "Jan Dec",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "JUL_JUN",
        "label": "Jul Jun",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OCT_SEP",
        "label": "Oct Sep",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CUSTOM",
        "label": "Custom",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "INDIA_APR_MAR",
      "JAN_DEC",
      "JUL_JUN",
      "OCT_SEP",
      "CUSTOM"
    ]
  },
  "FiscalYearPreset": {
    "name": "FiscalYearPreset",
    "service": "account-main",
    "options": [
      {
        "value": "INDIA_APR_MAR",
        "label": "India Apr Mar",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "JAN_DEC",
        "label": "Jan Dec",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "JUL_JUN",
        "label": "Jul Jun",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OCT_SEP",
        "label": "Oct Sep",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CUSTOM",
        "label": "Custom",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "INDIA_APR_MAR",
      "JAN_DEC",
      "JUL_JUN",
      "OCT_SEP",
      "CUSTOM"
    ]
  },
  "fiscalYearStatus": {
    "name": "FiscalYearStatus",
    "service": "account-main",
    "options": [
      {
        "value": "OPEN",
        "label": "Open",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "LOCKED",
        "label": "Locked",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      }
    ],
    "values": [
      "OPEN",
      "CLOSED",
      "LOCKED"
    ]
  },
  "FiscalYearStatus": {
    "name": "FiscalYearStatus",
    "service": "account-main",
    "options": [
      {
        "value": "OPEN",
        "label": "Open",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "LOCKED",
        "label": "Locked",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      }
    ],
    "values": [
      "OPEN",
      "CLOSED",
      "LOCKED"
    ]
  },
  "sourceModule": {
    "name": "SourceModule",
    "service": "account-main",
    "options": [
      {
        "value": "MANUAL",
        "label": "Manual",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "AP",
        "label": "Ap",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "AR",
        "label": "Ar",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PAYMENT",
        "label": "Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RECEIPT",
        "label": "Receipt",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BANK",
        "label": "Bank",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPENSE",
        "label": "Expense",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PAYROLL",
        "label": "Payroll",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "INVENTORY",
        "label": "Inventory",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "MANUFACTURING",
        "label": "Manufacturing",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TAX",
        "label": "Tax",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CREDIT_NOTE",
        "label": "Credit Note",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DEBIT_NOTE",
        "label": "Debit Note",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PAYMENT_VOUCHER",
        "label": "Payment Voucher",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "MANUAL",
      "AP",
      "AR",
      "PAYMENT",
      "RECEIPT",
      "BANK",
      "EXPENSE",
      "PAYROLL",
      "INVENTORY",
      "MANUFACTURING",
      "TAX",
      "CREDIT_NOTE",
      "DEBIT_NOTE",
      "PAYMENT_VOUCHER"
    ]
  },
  "SourceModule": {
    "name": "SourceModule",
    "service": "account-main",
    "options": [
      {
        "value": "MANUAL",
        "label": "Manual",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "AP",
        "label": "Ap",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "AR",
        "label": "Ar",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PAYMENT",
        "label": "Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RECEIPT",
        "label": "Receipt",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BANK",
        "label": "Bank",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPENSE",
        "label": "Expense",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PAYROLL",
        "label": "Payroll",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "INVENTORY",
        "label": "Inventory",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "MANUFACTURING",
        "label": "Manufacturing",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TAX",
        "label": "Tax",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CREDIT_NOTE",
        "label": "Credit Note",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DEBIT_NOTE",
        "label": "Debit Note",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PAYMENT_VOUCHER",
        "label": "Payment Voucher",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "MANUAL",
      "AP",
      "AR",
      "PAYMENT",
      "RECEIPT",
      "BANK",
      "EXPENSE",
      "PAYROLL",
      "INVENTORY",
      "MANUFACTURING",
      "TAX",
      "CREDIT_NOTE",
      "DEBIT_NOTE",
      "PAYMENT_VOUCHER"
    ]
  },
  "goodsReceiptStatus": {
    "name": "GoodsReceiptStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "VERIFIED",
        "label": "Verified",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CONFIRMED",
        "label": "Confirmed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DRAFT",
      "VERIFIED",
      "POSTED",
      "CONFIRMED",
      "CANCELLED",
      "REVERSED"
    ]
  },
  "GoodsReceiptStatus": {
    "name": "GoodsReceiptStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "VERIFIED",
        "label": "Verified",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CONFIRMED",
        "label": "Confirmed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DRAFT",
      "VERIFIED",
      "POSTED",
      "CONFIRMED",
      "CANCELLED",
      "REVERSED"
    ]
  },
  "gstRegistrationType": {
    "name": "GstRegistrationType",
    "service": "account-main",
    "options": [
      {
        "value": "REGULAR",
        "label": "Regular",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "COMPOSITION",
        "label": "Composition",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "UNREGISTERED",
        "label": "Unregistered",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SEZ_WITH_PAYMENT",
        "label": "Sez With Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SEZ_WITHOUT_PAYMENT",
        "label": "Sez Without Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPORT_WITH_PAYMENT",
        "label": "Export With Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPORT_WITHOUT_PAYMENT",
        "label": "Export Without Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DEEMED_EXPORT",
        "label": "Deemed Export",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CONSUMER",
        "label": "Consumer",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "REGULAR",
      "COMPOSITION",
      "UNREGISTERED",
      "SEZ_WITH_PAYMENT",
      "SEZ_WITHOUT_PAYMENT",
      "EXPORT_WITH_PAYMENT",
      "EXPORT_WITHOUT_PAYMENT",
      "DEEMED_EXPORT",
      "CONSUMER"
    ]
  },
  "GstRegistrationType": {
    "name": "GstRegistrationType",
    "service": "account-main",
    "options": [
      {
        "value": "REGULAR",
        "label": "Regular",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "COMPOSITION",
        "label": "Composition",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "UNREGISTERED",
        "label": "Unregistered",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SEZ_WITH_PAYMENT",
        "label": "Sez With Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SEZ_WITHOUT_PAYMENT",
        "label": "Sez Without Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPORT_WITH_PAYMENT",
        "label": "Export With Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPORT_WITHOUT_PAYMENT",
        "label": "Export Without Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DEEMED_EXPORT",
        "label": "Deemed Export",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CONSUMER",
        "label": "Consumer",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "REGULAR",
      "COMPOSITION",
      "UNREGISTERED",
      "SEZ_WITH_PAYMENT",
      "SEZ_WITHOUT_PAYMENT",
      "EXPORT_WITH_PAYMENT",
      "EXPORT_WITHOUT_PAYMENT",
      "DEEMED_EXPORT",
      "CONSUMER"
    ]
  },
  "gstSupplyType": {
    "name": "GstSupplyType",
    "service": "account-main",
    "options": [
      {
        "value": "INTRA_STATE",
        "label": "Intra State",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "INTER_STATE",
        "label": "Inter State",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPORT",
        "label": "Export",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "IMPORT",
        "label": "Import",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPORT_WITH_PAYMENT",
        "label": "Export With Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPORT_WITHOUT_PAYMENT",
        "label": "Export Without Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SEZ_WITH_PAYMENT",
        "label": "Sez With Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SEZ_WITHOUT_PAYMENT",
        "label": "Sez Without Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "INTRA_STATE",
      "INTER_STATE",
      "EXPORT",
      "IMPORT",
      "EXPORT_WITH_PAYMENT",
      "EXPORT_WITHOUT_PAYMENT",
      "SEZ_WITH_PAYMENT",
      "SEZ_WITHOUT_PAYMENT"
    ]
  },
  "GstSupplyType": {
    "name": "GstSupplyType",
    "service": "account-main",
    "options": [
      {
        "value": "INTRA_STATE",
        "label": "Intra State",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "INTER_STATE",
        "label": "Inter State",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPORT",
        "label": "Export",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "IMPORT",
        "label": "Import",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPORT_WITH_PAYMENT",
        "label": "Export With Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPORT_WITHOUT_PAYMENT",
        "label": "Export Without Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SEZ_WITH_PAYMENT",
        "label": "Sez With Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SEZ_WITHOUT_PAYMENT",
        "label": "Sez Without Payment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "INTRA_STATE",
      "INTER_STATE",
      "EXPORT",
      "IMPORT",
      "EXPORT_WITH_PAYMENT",
      "EXPORT_WITHOUT_PAYMENT",
      "SEZ_WITH_PAYMENT",
      "SEZ_WITHOUT_PAYMENT"
    ]
  },
  "gstTaxType": {
    "name": "GstTaxType",
    "service": "account-main",
    "options": [
      {
        "value": "CGST",
        "label": "Cgst",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SGST",
        "label": "Sgst",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "IGST",
        "label": "Igst",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CESS",
        "label": "Cess",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STATE_CESS",
        "label": "State Cess",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "CGST",
      "SGST",
      "IGST",
      "CESS",
      "STATE_CESS"
    ]
  },
  "GstTaxType": {
    "name": "GstTaxType",
    "service": "account-main",
    "options": [
      {
        "value": "CGST",
        "label": "Cgst",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SGST",
        "label": "Sgst",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "IGST",
        "label": "Igst",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CESS",
        "label": "Cess",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STATE_CESS",
        "label": "State Cess",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "CGST",
      "SGST",
      "IGST",
      "CESS",
      "STATE_CESS"
    ]
  },
  "syncStatus": {
    "name": "SyncStatus",
    "service": "account-main",
    "options": [
      {
        "value": "PENDING",
        "label": "Pending",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PROCESSING",
        "label": "Processing",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SUCCESS",
        "label": "Success",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "FAILED",
        "label": "Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "NOT_REQUIRED",
        "label": "Not Required",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "PENDING",
      "PROCESSING",
      "SUCCESS",
      "FAILED",
      "NOT_REQUIRED",
      "CANCELLED"
    ]
  },
  "SyncStatus": {
    "name": "SyncStatus",
    "service": "account-main",
    "options": [
      {
        "value": "PENDING",
        "label": "Pending",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PROCESSING",
        "label": "Processing",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SUCCESS",
        "label": "Success",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "FAILED",
        "label": "Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "NOT_REQUIRED",
        "label": "Not Required",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "PENDING",
      "PROCESSING",
      "SUCCESS",
      "FAILED",
      "NOT_REQUIRED",
      "CANCELLED"
    ]
  },
  "proformaInvoiceStatus": {
    "name": "ProformaInvoiceStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "ISSUED",
        "label": "Issued",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PARTIALLY_PAID",
        "label": "Partially Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PAID",
        "label": "Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PARTIALLY_CONVERTED",
        "label": "Partially Converted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "FULLY_CONVERTED",
        "label": "Fully Converted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CONFIRMED",
        "label": "Confirmed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "ISSUED",
      "PARTIALLY_PAID",
      "PAID",
      "PARTIALLY_CONVERTED",
      "FULLY_CONVERTED",
      "EXPIRED",
      "CONFIRMED",
      "CANCELLED"
    ]
  },
  "ProformaInvoiceStatus": {
    "name": "ProformaInvoiceStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "ISSUED",
        "label": "Issued",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PARTIALLY_PAID",
        "label": "Partially Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PAID",
        "label": "Paid",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PARTIALLY_CONVERTED",
        "label": "Partially Converted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "FULLY_CONVERTED",
        "label": "Fully Converted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CONFIRMED",
        "label": "Confirmed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "ISSUED",
      "PARTIALLY_PAID",
      "PAID",
      "PARTIALLY_CONVERTED",
      "FULLY_CONVERTED",
      "EXPIRED",
      "CONFIRMED",
      "CANCELLED"
    ]
  },
  "purchaseOrderStatus": {
    "name": "PurchaseOrderStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PENDING_APPROVAL",
        "label": "Pending Approval",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "SENT",
        "label": "Sent",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "PARTIALLY_RECEIVED",
        "label": "Partially Received",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "RECEIVED",
        "label": "Received",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "SENT",
      "PARTIALLY_RECEIVED",
      "RECEIVED",
      "CLOSED",
      "REJECTED",
      "CANCELLED"
    ]
  },
  "PurchaseOrderStatus": {
    "name": "PurchaseOrderStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PENDING_APPROVAL",
        "label": "Pending Approval",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "SENT",
        "label": "Sent",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "PARTIALLY_RECEIVED",
        "label": "Partially Received",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "RECEIVED",
        "label": "Received",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "SENT",
      "PARTIALLY_RECEIVED",
      "RECEIVED",
      "CLOSED",
      "REJECTED",
      "CANCELLED"
    ]
  },
  "purchaseRequisitionStatus": {
    "name": "PurchaseRequisitionStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "CANCELLED"
    ]
  },
  "PurchaseRequisitionStatus": {
    "name": "PurchaseRequisitionStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "CANCELLED"
    ]
  },
  "purchaseReturnStatus": {
    "name": "PurchaseReturnStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "CONFIRMED",
        "label": "Confirmed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "CONFIRMED",
      "CANCELLED"
    ]
  },
  "PurchaseReturnStatus": {
    "name": "PurchaseReturnStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "CONFIRMED",
        "label": "Confirmed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "CONFIRMED",
      "CANCELLED"
    ]
  },
  "quotationStatus": {
    "name": "QuotationStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SENT",
        "label": "Sent",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "ACCEPTED",
        "label": "Accepted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SENT",
      "ACCEPTED",
      "REJECTED",
      "EXPIRED",
      "CANCELLED"
    ]
  },
  "QuotationStatus": {
    "name": "QuotationStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SENT",
        "label": "Sent",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "ACCEPTED",
        "label": "Accepted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SENT",
      "ACCEPTED",
      "REJECTED",
      "EXPIRED",
      "CANCELLED"
    ]
  },
  "exportType": {
    "name": "ExportType",
    "service": "account-main",
    "options": [
      {
        "value": "PDF",
        "label": "Pdf",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXCEL",
        "label": "Excel",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CSV",
        "label": "Csv",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PDF",
      "EXCEL",
      "CSV"
    ]
  },
  "ExportType": {
    "name": "ExportType",
    "service": "account-main",
    "options": [
      {
        "value": "PDF",
        "label": "Pdf",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXCEL",
        "label": "Excel",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CSV",
        "label": "Csv",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PDF",
      "EXCEL",
      "CSV"
    ]
  },
  "reportType": {
    "name": "ReportType",
    "service": "account-main",
    "options": [
      {
        "value": "SUMMARY",
        "label": "Summary",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "GSTR1",
        "label": "Gstr1",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "GSTR3B",
        "label": "Gstr3B",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "HSN_SUMMARY",
        "label": "Hsn Summary",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ITC",
        "label": "Itc",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "SUMMARY",
      "GSTR1",
      "GSTR3B",
      "HSN_SUMMARY",
      "ITC"
    ]
  },
  "ReportType": {
    "name": "ReportType",
    "service": "account-main",
    "options": [
      {
        "value": "SUMMARY",
        "label": "Summary",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "GSTR1",
        "label": "Gstr1",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "GSTR3B",
        "label": "Gstr3B",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "HSN_SUMMARY",
        "label": "Hsn Summary",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ITC",
        "label": "Itc",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "SUMMARY",
      "GSTR1",
      "GSTR3B",
      "HSN_SUMMARY",
      "ITC"
    ]
  },
  "groupBy": {
    "name": "GroupBy",
    "service": "account-main",
    "options": [
      {
        "value": "ACCOUNT",
        "label": "Account",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ACCOUNT_GROUP",
        "label": "Account Group",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ACCOUNT_TYPE",
        "label": "Account Type",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PARENT_ACCOUNT",
        "label": "Parent Account",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BRANCH",
        "label": "Branch",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "COST_CENTER",
        "label": "Cost Center",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PROJECT",
        "label": "Project",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACCOUNT",
      "ACCOUNT_GROUP",
      "ACCOUNT_TYPE",
      "PARENT_ACCOUNT",
      "BRANCH",
      "COST_CENTER",
      "PROJECT"
    ]
  },
  "GroupBy": {
    "name": "GroupBy",
    "service": "account-main",
    "options": [
      {
        "value": "ACCOUNT",
        "label": "Account",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ACCOUNT_GROUP",
        "label": "Account Group",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ACCOUNT_TYPE",
        "label": "Account Type",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PARENT_ACCOUNT",
        "label": "Parent Account",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BRANCH",
        "label": "Branch",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "COST_CENTER",
        "label": "Cost Center",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PROJECT",
        "label": "Project",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACCOUNT",
      "ACCOUNT_GROUP",
      "ACCOUNT_TYPE",
      "PARENT_ACCOUNT",
      "BRANCH",
      "COST_CENTER",
      "PROJECT"
    ]
  },
  "rfqVendorStatus": {
    "name": "RfqVendorStatus",
    "service": "account-main",
    "options": [
      {
        "value": "INVITED",
        "label": "Invited",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RESPONDED",
        "label": "Responded",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DECLINED",
        "label": "Declined",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "INVITED",
      "RESPONDED",
      "DECLINED"
    ]
  },
  "RfqVendorStatus": {
    "name": "RfqVendorStatus",
    "service": "account-main",
    "options": [
      {
        "value": "INVITED",
        "label": "Invited",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RESPONDED",
        "label": "Responded",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DECLINED",
        "label": "Declined",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "INVITED",
      "RESPONDED",
      "DECLINED"
    ]
  },
  "rfqStatus": {
    "name": "RfqStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SENT",
        "label": "Sent",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "RESPONSE_RECEIVED",
        "label": "Response Received",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EVALUATION",
        "label": "Evaluation",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "AWARDED",
        "label": "Awarded",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SENT",
      "RESPONSE_RECEIVED",
      "EVALUATION",
      "AWARDED",
      "CLOSED",
      "CANCELLED"
    ]
  },
  "RfqStatus": {
    "name": "RfqStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SENT",
        "label": "Sent",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "RESPONSE_RECEIVED",
        "label": "Response Received",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EVALUATION",
        "label": "Evaluation",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "AWARDED",
        "label": "Awarded",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SENT",
      "RESPONSE_RECEIVED",
      "EVALUATION",
      "AWARDED",
      "CLOSED",
      "CANCELLED"
    ]
  },
  "rfqVendorResponseStatus": {
    "name": "RfqVendorResponseStatus",
    "service": "account-main",
    "options": [
      {
        "value": "INVITED",
        "label": "Invited",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RESPONDED",
        "label": "Responded",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DECLINED",
        "label": "Declined",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "INVITED",
      "RESPONDED",
      "DECLINED"
    ]
  },
  "RfqVendorResponseStatus": {
    "name": "RfqVendorResponseStatus",
    "service": "account-main",
    "options": [
      {
        "value": "INVITED",
        "label": "Invited",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RESPONDED",
        "label": "Responded",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DECLINED",
        "label": "Declined",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "INVITED",
      "RESPONDED",
      "DECLINED"
    ]
  },
  "salesOrderSourceType": {
    "name": "SalesOrderSourceType",
    "service": "account-main",
    "options": [
      {
        "value": "PROFORMA_INVOICE",
        "label": "Proforma Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "QUOTATION",
        "label": "Quotation",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "MANUAL",
        "label": "Manual",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PROFORMA_INVOICE",
      "QUOTATION",
      "MANUAL"
    ]
  },
  "SalesOrderSourceType": {
    "name": "SalesOrderSourceType",
    "service": "account-main",
    "options": [
      {
        "value": "PROFORMA_INVOICE",
        "label": "Proforma Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "QUOTATION",
        "label": "Quotation",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "MANUAL",
        "label": "Manual",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PROFORMA_INVOICE",
      "QUOTATION",
      "MANUAL"
    ]
  },
  "salesOrderStatus": {
    "name": "SalesOrderStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "CONFIRMED",
        "label": "Confirmed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "COMPLETED",
        "label": "Completed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED"
    ]
  },
  "SalesOrderStatus": {
    "name": "SalesOrderStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "CONFIRMED",
        "label": "Confirmed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "COMPLETED",
        "label": "Completed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED"
    ]
  },
  "supplierQuotationStatus": {
    "name": "SupplierQuotationStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "AWARDED",
        "label": "Awarded",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "AWARDED",
      "REJECTED",
      "CANCELLED"
    ]
  },
  "SupplierQuotationStatus": {
    "name": "SupplierQuotationStatus",
    "service": "account-main",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "AWARDED",
        "label": "Awarded",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "SUBMITTED",
      "AWARDED",
      "REJECTED",
      "CANCELLED"
    ]
  },
  "platformAdminStatus": {
    "name": "PlatformAdminStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INACTIVE",
        "label": "Inactive",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "SUSPENDED",
        "label": "Suspended",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED"
    ]
  },
  "PlatformAdminStatus": {
    "name": "PlatformAdminStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INACTIVE",
        "label": "Inactive",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "SUSPENDED",
        "label": "Suspended",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED"
    ]
  },
  "supportSessionStatus": {
    "name": "SupportSessionStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVOKED",
        "label": "Revoked",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACTIVE",
      "EXPIRED",
      "REVOKED"
    ]
  },
  "SupportSessionStatus": {
    "name": "SupportSessionStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVOKED",
        "label": "Revoked",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACTIVE",
      "EXPIRED",
      "REVOKED"
    ]
  },
  "accessMode": {
    "name": "AccessMode",
    "service": "ERP_System",
    "options": [
      {
        "value": "FULL",
        "label": "Full",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "READ_ONLY",
        "label": "Read Only",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "BLOCKED",
        "label": "Blocked",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "FULL",
      "READ_ONLY",
      "BLOCKED"
    ]
  },
  "AccessMode": {
    "name": "AccessMode",
    "service": "ERP_System",
    "options": [
      {
        "value": "FULL",
        "label": "Full",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "READ_ONLY",
        "label": "Read Only",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "BLOCKED",
        "label": "Blocked",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "FULL",
      "READ_ONLY",
      "BLOCKED"
    ]
  },
  "companySubscriptionStatus": {
    "name": "CompanySubscriptionStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "TRIALING",
        "label": "Trialing",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "TRIALING",
      "ACTIVE",
      "EXPIRED",
      "CANCELLED"
    ]
  },
  "CompanySubscriptionStatus": {
    "name": "CompanySubscriptionStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "TRIALING",
        "label": "Trialing",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "TRIALING",
      "ACTIVE",
      "EXPIRED",
      "CANCELLED"
    ]
  },
  "membershipStatus": {
    "name": "MembershipStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INVITED",
        "label": "Invited",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SUSPENDED",
        "label": "Suspended",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REMOVED",
        "label": "Removed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACTIVE",
      "INVITED",
      "SUSPENDED",
      "REMOVED"
    ]
  },
  "MembershipStatus": {
    "name": "MembershipStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INVITED",
        "label": "Invited",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SUSPENDED",
        "label": "Suspended",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REMOVED",
        "label": "Removed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACTIVE",
      "INVITED",
      "SUSPENDED",
      "REMOVED"
    ]
  },
  "memberType": {
    "name": "MemberType",
    "service": "ERP_System",
    "options": [
      {
        "value": "OWNER",
        "label": "Owner",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ADMIN",
        "label": "Admin",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "MEMBER",
        "label": "Member",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "OWNER",
      "ADMIN",
      "MEMBER"
    ]
  },
  "MemberType": {
    "name": "MemberType",
    "service": "ERP_System",
    "options": [
      {
        "value": "OWNER",
        "label": "Owner",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ADMIN",
        "label": "Admin",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "MEMBER",
        "label": "Member",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "OWNER",
      "ADMIN",
      "MEMBER"
    ]
  },
  "organizationStatus": {
    "name": "OrganizationStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "SUSPENDED",
        "label": "Suspended",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DELETED",
        "label": "Deleted",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACTIVE",
      "SUSPENDED",
      "DELETED"
    ]
  },
  "OrganizationStatus": {
    "name": "OrganizationStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "SUSPENDED",
        "label": "Suspended",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DELETED",
        "label": "Deleted",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACTIVE",
      "SUSPENDED",
      "DELETED"
    ]
  },
  "subscriptionStatus": {
    "name": "SubscriptionStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "TRIALING",
        "label": "Trialing",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PENDING",
        "label": "Pending",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PAST_DUE",
        "label": "Past Due",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "PAUSED",
        "label": "Paused",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "SUSPENDED",
        "label": "Suspended",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "TRIALING",
      "ACTIVE",
      "PENDING",
      "PAST_DUE",
      "PAUSED",
      "EXPIRED",
      "CANCELLED",
      "SUSPENDED"
    ]
  },
  "SubscriptionStatus": {
    "name": "SubscriptionStatus",
    "service": "ERP_System",
    "options": [
      {
        "value": "TRIALING",
        "label": "Trialing",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PENDING",
        "label": "Pending",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PAST_DUE",
        "label": "Past Due",
        "color": "sky",
        "className": "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60"
      },
      {
        "value": "PAUSED",
        "label": "Paused",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "SUSPENDED",
        "label": "Suspended",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "TRIALING",
      "ACTIVE",
      "PENDING",
      "PAST_DUE",
      "PAUSED",
      "EXPIRED",
      "CANCELLED",
      "SUSPENDED"
    ]
  },
  "tokenType": {
    "name": "TokenType",
    "service": "ERP_System",
    "options": [
      {
        "value": "EMAIL_VERIFICATION",
        "label": "Email Verification",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PASSWORD_RESET",
        "label": "Password Reset",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PASSWORD_SETUP",
        "label": "Password Setup",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "EMAIL_VERIFICATION",
      "PASSWORD_RESET",
      "PASSWORD_SETUP"
    ]
  },
  "TokenType": {
    "name": "TokenType",
    "service": "ERP_System",
    "options": [
      {
        "value": "EMAIL_VERIFICATION",
        "label": "Email Verification",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PASSWORD_RESET",
        "label": "Password Reset",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PASSWORD_SETUP",
        "label": "Password Setup",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "EMAIL_VERIFICATION",
      "PASSWORD_RESET",
      "PASSWORD_SETUP"
    ]
  },
  "adjustmentStatus": {
    "name": "AdjustmentStatus",
    "service": "inventory",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "APPROVED",
      "POSTED",
      "CANCELLED"
    ]
  },
  "AdjustmentStatus": {
    "name": "AdjustmentStatus",
    "service": "inventory",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "APPROVED",
      "POSTED",
      "CANCELLED"
    ]
  },
  "batchStatus": {
    "name": "BatchStatus",
    "service": "inventory",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "BLOCKED",
        "label": "Blocked",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACTIVE",
      "EXPIRED",
      "BLOCKED",
      "CLOSED"
    ]
  },
  "BatchStatus": {
    "name": "BatchStatus",
    "service": "inventory",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "BLOCKED",
        "label": "Blocked",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      }
    ],
    "values": [
      "ACTIVE",
      "EXPIRED",
      "BLOCKED",
      "CLOSED"
    ]
  },
  "inventoryPeriodStatus": {
    "name": "InventoryPeriodStatus",
    "service": "inventory",
    "options": [
      {
        "value": "OPEN",
        "label": "Open",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "LOCKED",
        "label": "Locked",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      }
    ],
    "values": [
      "OPEN",
      "CLOSED",
      "LOCKED"
    ]
  },
  "InventoryPeriodStatus": {
    "name": "InventoryPeriodStatus",
    "service": "inventory",
    "options": [
      {
        "value": "OPEN",
        "label": "Open",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CLOSED",
        "label": "Closed",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      },
      {
        "value": "LOCKED",
        "label": "Locked",
        "color": "slate",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
      }
    ],
    "values": [
      "OPEN",
      "CLOSED",
      "LOCKED"
    ]
  },
  "priceStatus": {
    "name": "PriceStatus",
    "service": "inventory",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INACTIVE",
        "label": "Inactive",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      }
    ],
    "values": [
      "ACTIVE",
      "INACTIVE"
    ]
  },
  "PriceStatus": {
    "name": "PriceStatus",
    "service": "inventory",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INACTIVE",
        "label": "Inactive",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      }
    ],
    "values": [
      "ACTIVE",
      "INACTIVE"
    ]
  },
  "priceType": {
    "name": "PriceType",
    "service": "inventory",
    "options": [
      {
        "value": "PURCHASE",
        "label": "Purchase",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SELLING",
        "label": "Selling",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "MRP",
        "label": "Mrp",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WHOLESALE",
        "label": "Wholesale",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RETAIL",
        "label": "Retail",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STANDARD",
        "label": "Standard",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PURCHASE",
      "SELLING",
      "MRP",
      "WHOLESALE",
      "RETAIL",
      "STANDARD"
    ]
  },
  "PriceType": {
    "name": "PriceType",
    "service": "inventory",
    "options": [
      {
        "value": "PURCHASE",
        "label": "Purchase",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SELLING",
        "label": "Selling",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "MRP",
        "label": "Mrp",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WHOLESALE",
        "label": "Wholesale",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RETAIL",
        "label": "Retail",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STANDARD",
        "label": "Standard",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "PURCHASE",
      "SELLING",
      "MRP",
      "WHOLESALE",
      "RETAIL",
      "STANDARD"
    ]
  },
  "productStatus": {
    "name": "ProductStatus",
    "service": "inventory",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INACTIVE",
        "label": "Inactive",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "BLOCKED",
        "label": "Blocked",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "ACTIVE",
      "INACTIVE",
      "BLOCKED"
    ]
  },
  "ProductStatus": {
    "name": "ProductStatus",
    "service": "inventory",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INACTIVE",
        "label": "Inactive",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "BLOCKED",
        "label": "Blocked",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "ACTIVE",
      "INACTIVE",
      "BLOCKED"
    ]
  },
  "productType": {
    "name": "ProductType",
    "service": "inventory",
    "options": [
      {
        "value": "GOODS",
        "label": "Goods",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SERVICE",
        "label": "Service",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "GOODS",
      "SERVICE"
    ]
  },
  "ProductType": {
    "name": "ProductType",
    "service": "inventory",
    "options": [
      {
        "value": "GOODS",
        "label": "Goods",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SERVICE",
        "label": "Service",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "GOODS",
      "SERVICE"
    ]
  },
  "referenceType": {
    "name": "ReferenceType",
    "service": "inventory",
    "options": [
      {
        "value": "MANUAL",
        "label": "Manual",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PURCHASE_RECEIPT",
        "label": "Purchase Receipt",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PURCHASE_RETURN",
        "label": "Purchase Return",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SALES_INVOICE",
        "label": "Sales Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SALES_RETURN",
        "label": "Sales Return",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DELIVERY",
        "label": "Delivery",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DELIVERY_CHALLAN",
        "label": "Delivery Challan",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STOCK_TRANSFER",
        "label": "Stock Transfer",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STOCK_ADJUSTMENT",
        "label": "Stock Adjustment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OPENING_STOCK",
        "label": "Opening Stock",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PRODUCTION",
        "label": "Production",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STOCK_RESERVATION",
        "label": "Stock Reservation",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "MANUAL",
      "PURCHASE_RECEIPT",
      "PURCHASE_RETURN",
      "SALES_INVOICE",
      "SALES_RETURN",
      "DELIVERY",
      "DELIVERY_CHALLAN",
      "STOCK_TRANSFER",
      "STOCK_ADJUSTMENT",
      "OPENING_STOCK",
      "PRODUCTION",
      "STOCK_RESERVATION"
    ]
  },
  "ReferenceType": {
    "name": "ReferenceType",
    "service": "inventory",
    "options": [
      {
        "value": "MANUAL",
        "label": "Manual",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PURCHASE_RECEIPT",
        "label": "Purchase Receipt",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PURCHASE_RETURN",
        "label": "Purchase Return",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SALES_INVOICE",
        "label": "Sales Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SALES_RETURN",
        "label": "Sales Return",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DELIVERY",
        "label": "Delivery",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DELIVERY_CHALLAN",
        "label": "Delivery Challan",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STOCK_TRANSFER",
        "label": "Stock Transfer",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STOCK_ADJUSTMENT",
        "label": "Stock Adjustment",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "OPENING_STOCK",
        "label": "Opening Stock",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "PRODUCTION",
        "label": "Production",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STOCK_RESERVATION",
        "label": "Stock Reservation",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "MANUAL",
      "PURCHASE_RECEIPT",
      "PURCHASE_RETURN",
      "SALES_INVOICE",
      "SALES_RETURN",
      "DELIVERY",
      "DELIVERY_CHALLAN",
      "STOCK_TRANSFER",
      "STOCK_ADJUSTMENT",
      "OPENING_STOCK",
      "PRODUCTION",
      "STOCK_RESERVATION"
    ]
  },
  "serialStatus": {
    "name": "SerialStatus",
    "service": "inventory",
    "options": [
      {
        "value": "AVAILABLE",
        "label": "Available",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RESERVED",
        "label": "Reserved",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SOLD",
        "label": "Sold",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DAMAGED",
        "label": "Damaged",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "LOST",
        "label": "Lost",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "IN_TRANSIT",
        "label": "In Transit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "AVAILABLE",
      "RESERVED",
      "SOLD",
      "DAMAGED",
      "LOST",
      "IN_TRANSIT"
    ]
  },
  "SerialStatus": {
    "name": "SerialStatus",
    "service": "inventory",
    "options": [
      {
        "value": "AVAILABLE",
        "label": "Available",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RESERVED",
        "label": "Reserved",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SOLD",
        "label": "Sold",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DAMAGED",
        "label": "Damaged",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "LOST",
        "label": "Lost",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "IN_TRANSIT",
        "label": "In Transit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "AVAILABLE",
      "RESERVED",
      "SOLD",
      "DAMAGED",
      "LOST",
      "IN_TRANSIT"
    ]
  },
  "stockMovementStatus": {
    "name": "StockMovementStatus",
    "service": "inventory",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DRAFT",
      "POSTED",
      "CANCELLED",
      "REVERSED"
    ]
  },
  "StockMovementStatus": {
    "name": "StockMovementStatus",
    "service": "inventory",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "POSTED",
        "label": "Posted",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "REVERSED",
        "label": "Reversed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "DRAFT",
      "POSTED",
      "CANCELLED",
      "REVERSED"
    ]
  },
  "trackingType": {
    "name": "TrackingType",
    "service": "inventory",
    "options": [
      {
        "value": "NONE",
        "label": "None",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BATCH",
        "label": "Batch",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SERIAL",
        "label": "Serial",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BATCH_AND_SERIAL",
        "label": "Batch And Serial",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "NONE",
      "BATCH",
      "SERIAL",
      "BATCH_AND_SERIAL"
    ]
  },
  "TrackingType": {
    "name": "TrackingType",
    "service": "inventory",
    "options": [
      {
        "value": "NONE",
        "label": "None",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BATCH",
        "label": "Batch",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SERIAL",
        "label": "Serial",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BATCH_AND_SERIAL",
        "label": "Batch And Serial",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "NONE",
      "BATCH",
      "SERIAL",
      "BATCH_AND_SERIAL"
    ]
  },
  "valuationMethod": {
    "name": "ValuationMethod",
    "service": "inventory",
    "options": [
      {
        "value": "FIFO",
        "label": "Fifo",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WEIGHTED_AVERAGE",
        "label": "Weighted Average",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STANDARD_COST",
        "label": "Standard Cost",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "FIFO",
      "WEIGHTED_AVERAGE",
      "STANDARD_COST"
    ]
  },
  "ValuationMethod": {
    "name": "ValuationMethod",
    "service": "inventory",
    "options": [
      {
        "value": "FIFO",
        "label": "Fifo",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WEIGHTED_AVERAGE",
        "label": "Weighted Average",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STANDARD_COST",
        "label": "Standard Cost",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "FIFO",
      "WEIGHTED_AVERAGE",
      "STANDARD_COST"
    ]
  },
  "reservationStatus": {
    "name": "ReservationStatus",
    "service": "inventory",
    "options": [
      {
        "value": "RESERVED",
        "label": "Reserved",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PARTIALLY_RELEASED",
        "label": "Partially Released",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "RELEASED",
        "label": "Released",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PARTIALLY_CONSUMED",
        "label": "Partially Consumed",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "CONSUMED",
        "label": "Consumed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "RESERVED",
      "PARTIALLY_RELEASED",
      "RELEASED",
      "PARTIALLY_CONSUMED",
      "CONSUMED",
      "EXPIRED",
      "CANCELLED"
    ]
  },
  "ReservationStatus": {
    "name": "ReservationStatus",
    "service": "inventory",
    "options": [
      {
        "value": "RESERVED",
        "label": "Reserved",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PARTIALLY_RELEASED",
        "label": "Partially Released",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "RELEASED",
        "label": "Released",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PARTIALLY_CONSUMED",
        "label": "Partially Consumed",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "CONSUMED",
        "label": "Consumed",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "RESERVED",
      "PARTIALLY_RELEASED",
      "RELEASED",
      "PARTIALLY_CONSUMED",
      "CONSUMED",
      "EXPIRED",
      "CANCELLED"
    ]
  },
  "stockMovementType": {
    "name": "StockMovementType",
    "service": "inventory",
    "options": [
      {
        "value": "OPENING",
        "label": "Opening",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "RECEIPT",
        "label": "Receipt",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ISSUE",
        "label": "Issue",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TRANSFER_OUT",
        "label": "Transfer Out",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TRANSFER_IN",
        "label": "Transfer In",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ADJUSTMENT_IN",
        "label": "Adjustment In",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ADJUSTMENT_OUT",
        "label": "Adjustment Out",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SALES_RETURN",
        "label": "Sales Return",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PURCHASE_RETURN",
        "label": "Purchase Return",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DAMAGE",
        "label": "Damage",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPIRY",
        "label": "Expiry",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PRODUCTION_IN",
        "label": "Production In",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PRODUCTION_OUT",
        "label": "Production Out",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "OPENING",
      "RECEIPT",
      "ISSUE",
      "TRANSFER_OUT",
      "TRANSFER_IN",
      "ADJUSTMENT_IN",
      "ADJUSTMENT_OUT",
      "SALES_RETURN",
      "PURCHASE_RETURN",
      "DAMAGE",
      "EXPIRY",
      "PRODUCTION_IN",
      "PRODUCTION_OUT"
    ]
  },
  "StockMovementType": {
    "name": "StockMovementType",
    "service": "inventory",
    "options": [
      {
        "value": "OPENING",
        "label": "Opening",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "RECEIPT",
        "label": "Receipt",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ISSUE",
        "label": "Issue",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TRANSFER_OUT",
        "label": "Transfer Out",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TRANSFER_IN",
        "label": "Transfer In",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ADJUSTMENT_IN",
        "label": "Adjustment In",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ADJUSTMENT_OUT",
        "label": "Adjustment Out",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SALES_RETURN",
        "label": "Sales Return",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PURCHASE_RETURN",
        "label": "Purchase Return",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DAMAGE",
        "label": "Damage",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EXPIRY",
        "label": "Expiry",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PRODUCTION_IN",
        "label": "Production In",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PRODUCTION_OUT",
        "label": "Production Out",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "OPENING",
      "RECEIPT",
      "ISSUE",
      "TRANSFER_OUT",
      "TRANSFER_IN",
      "ADJUSTMENT_IN",
      "ADJUSTMENT_OUT",
      "SALES_RETURN",
      "PURCHASE_RETURN",
      "DAMAGE",
      "EXPIRY",
      "PRODUCTION_IN",
      "PRODUCTION_OUT"
    ]
  },
  "transferStatus": {
    "name": "TransferStatus",
    "service": "inventory",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "IN_TRANSIT",
        "label": "In Transit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RECEIVED",
        "label": "Received",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "IN_TRANSIT",
      "RECEIVED",
      "CANCELLED"
    ]
  },
  "TransferStatus": {
    "name": "TransferStatus",
    "service": "inventory",
    "options": [
      {
        "value": "DRAFT",
        "label": "Draft",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "IN_TRANSIT",
        "label": "In Transit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RECEIVED",
        "label": "Received",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "DRAFT",
      "IN_TRANSIT",
      "RECEIVED",
      "CANCELLED"
    ]
  },
  "locationType": {
    "name": "LocationType",
    "service": "inventory",
    "options": [
      {
        "value": "ZONE",
        "label": "Zone",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RACK",
        "label": "Rack",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SHELF",
        "label": "Shelf",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BIN",
        "label": "Bin",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RECEIVING",
        "label": "Receiving",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PICKING",
        "label": "Picking",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PACKING",
        "label": "Packing",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DISPATCH",
        "label": "Dispatch",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "QUARANTINE",
        "label": "Quarantine",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STAGE",
        "label": "Stage",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "VIRTUAL",
        "label": "Virtual",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ZONE",
      "RACK",
      "SHELF",
      "BIN",
      "RECEIVING",
      "PICKING",
      "PACKING",
      "DISPATCH",
      "QUARANTINE",
      "STAGE",
      "VIRTUAL"
    ]
  },
  "LocationType": {
    "name": "LocationType",
    "service": "inventory",
    "options": [
      {
        "value": "ZONE",
        "label": "Zone",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RACK",
        "label": "Rack",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SHELF",
        "label": "Shelf",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BIN",
        "label": "Bin",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RECEIVING",
        "label": "Receiving",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PICKING",
        "label": "Picking",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PACKING",
        "label": "Packing",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DISPATCH",
        "label": "Dispatch",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "QUARANTINE",
        "label": "Quarantine",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STAGE",
        "label": "Stage",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "VIRTUAL",
        "label": "Virtual",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "ZONE",
      "RACK",
      "SHELF",
      "BIN",
      "RECEIVING",
      "PICKING",
      "PACKING",
      "DISPATCH",
      "QUARANTINE",
      "STAGE",
      "VIRTUAL"
    ]
  },
  "warehouseStatus": {
    "name": "WarehouseStatus",
    "service": "inventory",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INACTIVE",
        "label": "Inactive",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      }
    ],
    "values": [
      "ACTIVE",
      "INACTIVE"
    ]
  },
  "WarehouseStatus": {
    "name": "WarehouseStatus",
    "service": "inventory",
    "options": [
      {
        "value": "ACTIVE",
        "label": "Active",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "INACTIVE",
        "label": "Inactive",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      }
    ],
    "values": [
      "ACTIVE",
      "INACTIVE"
    ]
  },
  "warehouseType": {
    "name": "WarehouseType",
    "service": "inventory",
    "options": [
      {
        "value": "MAIN",
        "label": "Main",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BRANCH",
        "label": "Branch",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STORE",
        "label": "Store",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TRANSIT",
        "label": "Transit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "VIRTUAL",
        "label": "Virtual",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "MAIN",
      "BRANCH",
      "STORE",
      "TRANSIT",
      "VIRTUAL"
    ]
  },
  "WarehouseType": {
    "name": "WarehouseType",
    "service": "inventory",
    "options": [
      {
        "value": "MAIN",
        "label": "Main",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "BRANCH",
        "label": "Branch",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "STORE",
        "label": "Store",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TRANSIT",
        "label": "Transit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "VIRTUAL",
        "label": "Virtual",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "MAIN",
      "BRANCH",
      "STORE",
      "TRANSIT",
      "VIRTUAL"
    ]
  },
  "approverType": {
    "name": "ApproverType",
    "service": "workflow-service",
    "options": [
      {
        "value": "USER",
        "label": "User",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ROLE",
        "label": "Role",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DEPARTMENT",
        "label": "Department",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RULE",
        "label": "Rule",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DOCUMENT_OWNER",
        "label": "Document Owner",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "USER",
      "ROLE",
      "DEPARTMENT",
      "RULE",
      "DOCUMENT_OWNER"
    ]
  },
  "ApproverType": {
    "name": "ApproverType",
    "service": "workflow-service",
    "options": [
      {
        "value": "USER",
        "label": "User",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ROLE",
        "label": "Role",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DEPARTMENT",
        "label": "Department",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RULE",
        "label": "Rule",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DOCUMENT_OWNER",
        "label": "Document Owner",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "USER",
      "ROLE",
      "DEPARTMENT",
      "RULE",
      "DOCUMENT_OWNER"
    ]
  },
  "workflowActionType": {
    "name": "WorkflowActionType",
    "service": "workflow-service",
    "options": [
      {
        "value": "SUBMIT",
        "label": "Submit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "APPROVE",
        "label": "Approve",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REJECT",
        "label": "Reject",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RETURN",
        "label": "Return",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCEL",
        "label": "Cancel",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DELEGATE",
        "label": "Delegate",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ESCALATE",
        "label": "Escalate",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REASSIGN",
        "label": "Reassign",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "COMPLETE",
        "label": "Complete",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "SUBMIT",
      "APPROVE",
      "REJECT",
      "RETURN",
      "CANCEL",
      "DELEGATE",
      "ESCALATE",
      "REASSIGN",
      "COMPLETE"
    ]
  },
  "WorkflowActionType": {
    "name": "WorkflowActionType",
    "service": "workflow-service",
    "options": [
      {
        "value": "SUBMIT",
        "label": "Submit",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "APPROVE",
        "label": "Approve",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REJECT",
        "label": "Reject",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RETURN",
        "label": "Return",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCEL",
        "label": "Cancel",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DELEGATE",
        "label": "Delegate",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ESCALATE",
        "label": "Escalate",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "REASSIGN",
        "label": "Reassign",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "COMPLETE",
        "label": "Complete",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "SUBMIT",
      "APPROVE",
      "REJECT",
      "RETURN",
      "CANCEL",
      "DELEGATE",
      "ESCALATE",
      "REASSIGN",
      "COMPLETE"
    ]
  },
  "workflowChannel": {
    "name": "WorkflowChannel",
    "service": "workflow-service",
    "options": [
      {
        "value": "IN_APP",
        "label": "In App",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EMAIL",
        "label": "Email",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SMS",
        "label": "Sms",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "IN_APP",
      "EMAIL",
      "SMS"
    ]
  },
  "WorkflowChannel": {
    "name": "WorkflowChannel",
    "service": "workflow-service",
    "options": [
      {
        "value": "IN_APP",
        "label": "In App",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "EMAIL",
        "label": "Email",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SMS",
        "label": "Sms",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "IN_APP",
      "EMAIL",
      "SMS"
    ]
  },
  "workflowExecutionType": {
    "name": "WorkflowExecutionType",
    "service": "workflow-service",
    "options": [
      {
        "value": "SEQUENTIAL",
        "label": "Sequential",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PARALLEL",
        "label": "Parallel",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "SEQUENTIAL",
      "PARALLEL"
    ]
  },
  "WorkflowExecutionType": {
    "name": "WorkflowExecutionType",
    "service": "workflow-service",
    "options": [
      {
        "value": "SEQUENTIAL",
        "label": "Sequential",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PARALLEL",
        "label": "Parallel",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "SEQUENTIAL",
      "PARALLEL"
    ]
  },
  "workflowNotificationType": {
    "name": "WorkflowNotificationType",
    "service": "workflow-service",
    "options": [
      {
        "value": "TASK_ASSIGNED",
        "label": "Task Assigned",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WORKFLOW_APPROVED",
        "label": "Workflow Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "WORKFLOW_REJECTED",
        "label": "Workflow Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "WORKFLOW_CANCELLED",
        "label": "Workflow Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "WORKFLOW_RETURNED",
        "label": "Workflow Returned",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SLA_REMINDER",
        "label": "Sla Reminder",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SLA_ESCALATED",
        "label": "Sla Escalated",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TASK_ESCALATED",
        "label": "Task Escalated",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TASK_DELEGATED",
        "label": "Task Delegated",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WORKFLOW_COMPLETED",
        "label": "Workflow Completed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      }
    ],
    "values": [
      "TASK_ASSIGNED",
      "WORKFLOW_APPROVED",
      "WORKFLOW_REJECTED",
      "WORKFLOW_CANCELLED",
      "WORKFLOW_RETURNED",
      "SLA_REMINDER",
      "SLA_ESCALATED",
      "TASK_ESCALATED",
      "TASK_DELEGATED",
      "WORKFLOW_COMPLETED"
    ]
  },
  "WorkflowNotificationType": {
    "name": "WorkflowNotificationType",
    "service": "workflow-service",
    "options": [
      {
        "value": "TASK_ASSIGNED",
        "label": "Task Assigned",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WORKFLOW_APPROVED",
        "label": "Workflow Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "WORKFLOW_REJECTED",
        "label": "Workflow Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "WORKFLOW_CANCELLED",
        "label": "Workflow Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "WORKFLOW_RETURNED",
        "label": "Workflow Returned",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SLA_REMINDER",
        "label": "Sla Reminder",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SLA_ESCALATED",
        "label": "Sla Escalated",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TASK_ESCALATED",
        "label": "Task Escalated",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "TASK_DELEGATED",
        "label": "Task Delegated",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WORKFLOW_COMPLETED",
        "label": "Workflow Completed",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      }
    ],
    "values": [
      "TASK_ASSIGNED",
      "WORKFLOW_APPROVED",
      "WORKFLOW_REJECTED",
      "WORKFLOW_CANCELLED",
      "WORKFLOW_RETURNED",
      "SLA_REMINDER",
      "SLA_ESCALATED",
      "TASK_ESCALATED",
      "TASK_DELEGATED",
      "WORKFLOW_COMPLETED"
    ]
  },
  "workflowRejectionAction": {
    "name": "WorkflowRejectionAction",
    "service": "workflow-service",
    "options": [
      {
        "value": "REJECT_DOCUMENT",
        "label": "Reject Document",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RETURN_TO_INITIATOR",
        "label": "Return To Initiator",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "REJECT_DOCUMENT",
      "RETURN_TO_INITIATOR"
    ]
  },
  "WorkflowRejectionAction": {
    "name": "WorkflowRejectionAction",
    "service": "workflow-service",
    "options": [
      {
        "value": "REJECT_DOCUMENT",
        "label": "Reject Document",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RETURN_TO_INITIATOR",
        "label": "Return To Initiator",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "REJECT_DOCUMENT",
      "RETURN_TO_INITIATOR"
    ]
  },
  "workflowTaskStatus": {
    "name": "WorkflowTaskStatus",
    "service": "workflow-service",
    "options": [
      {
        "value": "PENDING",
        "label": "Pending",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "RETURNED",
        "label": "Returned",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DELEGATED",
        "label": "Delegated",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "RETURNED",
      "DELEGATED",
      "CANCELLED",
      "EXPIRED"
    ]
  },
  "WorkflowTaskStatus": {
    "name": "WorkflowTaskStatus",
    "service": "workflow-service",
    "options": [
      {
        "value": "PENDING",
        "label": "Pending",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "APPROVED",
        "label": "Approved",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "REJECTED",
        "label": "Rejected",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "RETURNED",
        "label": "Returned",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "DELEGATED",
        "label": "Delegated",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CANCELLED",
        "label": "Cancelled",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      },
      {
        "value": "EXPIRED",
        "label": "Expired",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "RETURNED",
      "DELEGATED",
      "CANCELLED",
      "EXPIRED"
    ]
  },
  "communicationChannel": {
    "name": "CommunicationChannel",
    "service": "communication-service",
    "options": [
      {
        "value": "EMAIL",
        "label": "Email",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WHATSAPP",
        "label": "Whatsapp",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SMS",
        "label": "Sms",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PUSH",
        "label": "Push",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "IN_APP",
        "label": "In App",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "EMAIL",
      "WHATSAPP",
      "SMS",
      "PUSH",
      "IN_APP"
    ]
  },
  "CommunicationChannel": {
    "name": "CommunicationChannel",
    "service": "communication-service",
    "options": [
      {
        "value": "EMAIL",
        "label": "Email",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "WHATSAPP",
        "label": "Whatsapp",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SMS",
        "label": "Sms",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PUSH",
        "label": "Push",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "IN_APP",
        "label": "In App",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "EMAIL",
      "WHATSAPP",
      "SMS",
      "PUSH",
      "IN_APP"
    ]
  },
  "deliveryStatus": {
    "name": "DeliveryStatus",
    "service": "communication-service",
    "options": [
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "FAILED",
        "label": "Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "SUBMITTED",
      "FAILED"
    ]
  },
  "DeliveryStatus": {
    "name": "DeliveryStatus",
    "service": "communication-service",
    "options": [
      {
        "value": "SUBMITTED",
        "label": "Submitted",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "FAILED",
        "label": "Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "SUBMITTED",
      "FAILED"
    ]
  },
  "notificationStatus": {
    "name": "NotificationStatus",
    "service": "communication-service",
    "options": [
      {
        "value": "PENDING",
        "label": "Pending",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PROCESSING",
        "label": "Processing",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ACCEPTED_BY_PROVIDER",
        "label": "Accepted By Provider",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "FAILED",
        "label": "Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "PENDING",
      "PROCESSING",
      "ACCEPTED_BY_PROVIDER",
      "FAILED"
    ]
  },
  "NotificationStatus": {
    "name": "NotificationStatus",
    "service": "communication-service",
    "options": [
      {
        "value": "PENDING",
        "label": "Pending",
        "color": "amber",
        "className": "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      },
      {
        "value": "PROCESSING",
        "label": "Processing",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ACCEPTED_BY_PROVIDER",
        "label": "Accepted By Provider",
        "color": "emerald",
        "className": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
      },
      {
        "value": "FAILED",
        "label": "Failed",
        "color": "rose",
        "className": "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      }
    ],
    "values": [
      "PENDING",
      "PROCESSING",
      "ACCEPTED_BY_PROVIDER",
      "FAILED"
    ]
  },
  "templateCode": {
    "name": "TemplateCode",
    "service": "communication-service",
    "options": [
      {
        "value": "EMPLOYEE_PROVISIONING",
        "label": "Employee Provisioning",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "USER_VERIFICATION",
        "label": "User Verification",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PASSWORD_RESET",
        "label": "Password Reset",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ORGANIZATION_CREATED",
        "label": "Organization Created",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "QUOTATION_EMAIL",
        "label": "Quotation Email",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RFQ_VENDOR_INVITATION",
        "label": "Rfq Vendor Invitation",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SALES_INVOICE",
        "label": "Sales Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PURCHASE_INVOICE",
        "label": "Purchase Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CUSTOM",
        "label": "Custom",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "EMPLOYEE_PROVISIONING",
      "USER_VERIFICATION",
      "PASSWORD_RESET",
      "ORGANIZATION_CREATED",
      "QUOTATION_EMAIL",
      "RFQ_VENDOR_INVITATION",
      "SALES_INVOICE",
      "PURCHASE_INVOICE",
      "CUSTOM"
    ]
  },
  "TemplateCode": {
    "name": "TemplateCode",
    "service": "communication-service",
    "options": [
      {
        "value": "EMPLOYEE_PROVISIONING",
        "label": "Employee Provisioning",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "USER_VERIFICATION",
        "label": "User Verification",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PASSWORD_RESET",
        "label": "Password Reset",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "ORGANIZATION_CREATED",
        "label": "Organization Created",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "QUOTATION_EMAIL",
        "label": "Quotation Email",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "RFQ_VENDOR_INVITATION",
        "label": "Rfq Vendor Invitation",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "SALES_INVOICE",
        "label": "Sales Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "PURCHASE_INVOICE",
        "label": "Purchase Invoice",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      },
      {
        "value": "CUSTOM",
        "label": "Custom",
        "color": "zinc",
        "className": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      }
    ],
    "values": [
      "EMPLOYEE_PROVISIONING",
      "USER_VERIFICATION",
      "PASSWORD_RESET",
      "ORGANIZATION_CREATED",
      "QUOTATION_EMAIL",
      "RFQ_VENDOR_INVITATION",
      "SALES_INVOICE",
      "PURCHASE_INVOICE",
      "CUSTOM"
    ]
  }
};

export function getEnumOptions(enumKey) {
  const entry = ENUMS_REGISTRY[enumKey];
  return entry ? entry.options : [];
}

export function getEnumMeta(enumKey, value) {
  if (value === null || value === undefined) return null;
  const entry = ENUMS_REGISTRY[enumKey];
  if (!entry) {
    return {
      value,
      label: String(value),
      color: 'zinc',
      className: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
    };
  }
  const match = entry.options.find(o => String(o.value).toUpperCase() === String(value).toUpperCase());
  return match || {
    value,
    label: String(value).replace(/_/g, ' '),
    color: 'zinc',
    className: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
  };
}

export default ENUMS_REGISTRY;
