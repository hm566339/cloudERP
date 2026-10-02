import { useGetTrialBalanceReportQuery } from '../../api/account';

export const useTrialBalance = (params, options = {}) => {
  return useGetTrialBalanceReportQuery(params, {
    ...options,
    refetchOnMountOrArgChange: true, // Always fetch fresh data on filter change
  });
};
