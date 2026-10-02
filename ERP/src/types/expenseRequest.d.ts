export type RequestType = 'EXPENSE_REQUEST' | 'ADVANCE_REQUEST';
export type RoleType = 'EMPLOYEE' | 'DRIVER';
export type ExpenseRequestStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CONVERTED_TO_EXPENSE';

export interface ExpenseRequest {
  id: string;
  companyId: string;
  requestNumber: string;
  requestType: RequestType;
  date: string; // YYYY-MM-DD
  requesterId: string;
  employeeDriverId: string;
  roleType: RoleType;
  categoryId: string;
  categoryName: string;
  requestedAmount: number;
  approvedAmount?: number | null;
  purposeDescription?: string;
  additionalNotes?: string;
  status: ExpenseRequestStatus;
  approvalStatus?: ExpenseRequestStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  requiresAdvance?: boolean;
  advanceAmount?: number | null;
  salesOrderId?: string | null;
  deliveryChallanId?: string | null;
  vehicleId?: string | null;
  vehicleNumber?: string | null;
  claimId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ExpenseRequestCreatePayload {
  requestType: RequestType;
  date: string; // YYYY-MM-DD
  employeeDriverId: string; // UUID
  roleType: RoleType;
  categoryId: string; // UUID
  requestedAmount: number;
  purposeDescription?: string;
  additionalNotes?: string;
  requiresAdvance?: boolean;
  advanceAmount?: number;
  salesOrderId?: string;
  deliveryChallanId?: string;
  vehicleId?: string;
  vehicleNumber?: string;
}

export interface ExpenseRequestUpdatePayload {
  requestType?: RequestType;
  date?: string;
  employeeDriverId?: string;
  roleType?: RoleType;
  categoryId?: string;
  requestedAmount?: number;
  purposeDescription?: string;
  additionalNotes?: string;
  requiresAdvance?: boolean;
  advanceAmount?: number;
  salesOrderId?: string;
  deliveryChallanId?: string;
  vehicleId?: string;
  vehicleNumber?: string;
}

export interface ExpenseRequestApprovePayload {
  approvedAmount?: number;
  remarks?: string;
}

export interface ExpenseRequestRejectPayload {
  reason: string;
}

export interface ExpenseRequestFilterParams {
  search?: string;
  status?: ExpenseRequestStatus;
  requestType?: RequestType;
  roleType?: RoleType;
  employeeDriverId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ExpenseRequestPagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  currentPage?: number;
  pageSize?: number;
  numberOfElements?: number;
}

export interface ExpenseRequestApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  status: number;
  timestamp: string;
  pagination?: ExpenseRequestPagination;
  metadata?: Record<string, unknown>;
}
