export interface Transaction {
  lineId: string;
  journalEntryId: string;
  voucherDate: string; // YYYY-MM-DD
  referenceNo?: string;
  description?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface LedgerPagination {
  page?: number;
  size?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  totalElements?: number;
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface LedgerData {
  transactions?: Transaction[];
  openingBalance?: number;
  closingBalance?: number;
  totalDebit?: number;
  totalCredit?: number;
  pagination?: LedgerPagination;
  generatedAt?: string;
}

export interface GeneralLedgerResponse {
  success: boolean;
  message?: string;
  data?: LedgerData;
}

export interface GeneralLedgerRequestParams {
  accountId: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  page?: number;
  pageSize?: number;
}
