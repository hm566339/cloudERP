package com.erp.account.modules.reporting.enums;

/**
 * Defines how Trial Balance rows are grouped.
 *
 * ACCOUNT          - one row per GL account (default, preserves legacy behavior)
 * ACCOUNT_GROUP    - one row per account group (ag)
 * ACCOUNT_TYPE     - one row per account nature (DEBIT / CREDIT)
 * PARENT_ACCOUNT   - one row per parent account (accounts without a parent roll into "No Parent")
 * BRANCH           - one row per branch dimension on the journal line
 * COST_CENTER      - one row per cost center dimension on the journal line
 * PROJECT          - one row per project dimension on the journal line
 */
public enum GroupBy {
    ACCOUNT,
    ACCOUNT_GROUP,
    ACCOUNT_TYPE,
    PARENT_ACCOUNT,
    BRANCH,
    COST_CENTER,
    PROJECT
}
