export * from './trialBalance';
export * from './profitLoss';
export * from './balanceSheet';
export * from './generalLedger';
export * from './cashFlow';
export * from './gst';

import { trialBalanceApi } from './trialBalance';
import { profitLossApi } from './profitLoss';
import { balanceSheetApi } from './balanceSheet';
import { generalLedgerApi } from './generalLedger';
import { cashFlowApi } from './cashFlow';
import { gstReportsApi } from './gst';

export const reportsApi = {
  ...trialBalanceApi,
  ...profitLossApi,
  ...balanceSheetApi,
  ...generalLedgerApi,
  ...cashFlowApi,
  ...gstReportsApi,
};
