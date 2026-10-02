import { useGetCashFlowReportQuery } from '../../api/account';

export const useCashFlow = (params, options = {}) => {
  return useGetCashFlowReportQuery(params, {
    ...options,
    refetchOnMountOrArgChange: true, // Always fetch fresh data on filter change
  });
};
