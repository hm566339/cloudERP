import { adminFilters, miscFilters, salesFilters, purchaseFilters, financeFilters, inventoryFilters, hrFilters } from './filters';

export const FILTER_CONFIGS = {
  ...adminFilters,
  ...miscFilters,
  ...salesFilters,
  ...purchaseFilters,
  ...financeFilters,
  ...inventoryFilters,
  ...hrFilters
};

export default FILTER_CONFIGS;
