import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Receipt, ClipboardList, CreditCard, BarChart3, Plus, Columns, Download } from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';

import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { expenseTabs } from '../../../components/module-tabs';
import ExpenseRequestsTab from '../components/expenses/ExpenseRequestsTab';
import ExpensesTab from '../components/expenses/ExpensesTab';
import ReimbursementsTab from '../components/expenses/ReimbursementsTab';
import ExpenseReportsTab from '../components/expenses/ExpenseReportsTab';

import ExpenseRequestModalsGroup from '../components/expenses/ExpenseRequestModalsGroup';
import ExpenseActionModalsGroup from '../components/expenses/ExpenseActionModalsGroup';
import ReimbursementModalsGroup from '../components/expenses/ReimbursementModalsGroup';
import { expenseRequestsApi } from '../../../api/account/expenseRequests';
import { expensesApi } from '../../../api/account/expenses';
import { reimbursementsApi } from '../../../api/account/reimbursements';
import { expenseStorageService } from '../services/expenseStorageService';

export default function ExpenseTracking({ forcedTab }) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const companyId =
    params.companyId ||
    JSON.parse(localStorage.getItem('selected_company') || '{}')?.id ||
    JSON.parse(localStorage.getItem('auth_user') || '{}')?.companyCode ||
    'default';

  // Determine active tab from forcedTab prop, URL param (:tab), search param (?tab=...), or path
  const currentPath = (location.pathname || '').toLowerCase();
  const queryTab = new URLSearchParams(location.search).get('tab')?.toLowerCase();
  const pathTab = params.tab?.toLowerCase();

  let resolvedTab = forcedTab?.toLowerCase() || pathTab || queryTab;
  if (!resolvedTab) {
    if (currentPath.includes('expense-requests') || currentPath.endsWith('/requests')) {
      resolvedTab = 'requests';
    } else if (currentPath.includes('reimbursement')) {
      resolvedTab = 'reimbursements';
    } else if (currentPath.includes('report') || currentPath.includes('analytics')) {
      resolvedTab = 'reports';
    } else if (currentPath.endsWith('/expenses') || currentPath.endsWith('/expenses/expenses')) {
      resolvedTab = 'expenses';
    } else {
      resolvedTab = 'requests';
    }
  }

  const validTabs = ['requests', 'expenses', 'reimbursements', 'reports'];
  const activeTab = validTabs.includes(resolvedTab) ? resolvedTab : 'requests';

  // Base path for navigation
  const basePath = useMemo(() => {
    return location.pathname.includes('/company/')
      ? `/company/${params.companyId}/accounts/transactions/expenses`
      : '/accounts/transactions/expenses';
  }, [location.pathname, params.companyId]);

  const handleTabChange = useCallback(
    (newTab) => {
      navigate(`${basePath}/${newTab}`);
    },
    [basePath, navigate]
  );

  // ─────────────────────────────────────────────────────────
  // LIVE API STATE: Expense Requests (GET /api/account/v1/expense-requests)
  // ─────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [requestsPagination, setRequestsPagination] = useState(null);
  const [requestsPage, setRequestsPage] = useState(0); // 0-based index
  const [requestsPageSize, setRequestsPageSize] = useState(10);
  const [requestsSearchTerm, setRequestsSearchTerm] = useState('');
  const [requestsStatusFilter, setRequestsStatusFilter] = useState('ALL');
  const [requestsDateFrom, setRequestsDateFrom] = useState('');
  const [requestsDateTo, setRequestsDateTo] = useState('');
  const [requestsRoleType, setRequestsRoleType] = useState('');
  const [requestsCategory, setRequestsCategory] = useState('');
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState(null);

  // Modal / Action States for Requests
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedRequestForApprove, setSelectedRequestForApprove] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [selectedRequestForReject, setSelectedRequestForReject] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const [selectedRequestForCancel, setSelectedRequestForCancel] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [actionProcessingId, setActionProcessingId] = useState(null);

  // ─────────────────────────────────────────────────────────
  // LIVE API STATE: Expenses (GET /api/account/v1/expenses)
  // ─────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState([]);
  const [expensesPagination, setExpensesPagination] = useState(null);
  const [expensesPage, setExpensesPage] = useState(0); // 0-based index
  const [expensesPageSize, setExpensesPageSize] = useState(10);
  const [expensesSearchTerm, setExpensesSearchTerm] = useState('');
  const [expensesStatusFilter, setExpensesStatusFilter] = useState('ALL');
  const [expensesDateFrom, setExpensesDateFrom] = useState('');
  const [expensesDateTo, setExpensesDateTo] = useState('');
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState(null);

  // Modal / Action States for Expenses
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [requestRefForExpense, setRequestRefForExpense] = useState(null);

  const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState(null);
  const [isExpenseDetailsModalOpen, setIsExpenseDetailsModalOpen] = useState(false);

  const [selectedExpenseForApprove, setSelectedExpenseForApprove] = useState(null);
  const [isExpenseApproveModalOpen, setIsExpenseApproveModalOpen] = useState(false);
  const [isExpenseApproving, setIsExpenseApproving] = useState(false);

  const [selectedExpenseForReject, setSelectedExpenseForReject] = useState(null);
  const [isExpenseRejectModalOpen, setIsExpenseRejectModalOpen] = useState(false);
  const [isExpenseRejecting, setIsExpenseRejecting] = useState(false);

  const [selectedExpenseForCancel, setSelectedExpenseForCancel] = useState(null);
  const [isExpenseCancelModalOpen, setIsExpenseCancelModalOpen] = useState(false);
  const [isExpenseCancelling, setIsExpenseCancelling] = useState(false);

  const [selectedExpenseForDelete, setSelectedExpenseForDelete] = useState(null);
  const [isExpenseDeleteModalOpen, setIsExpenseDeleteModalOpen] = useState(false);
  const [isExpenseDeleting, setIsExpenseDeleting] = useState(false);

  const [expenseActionProcessingId, setExpenseActionProcessingId] = useState(null);

  // ─────────────────────────────────────────────────────────
  // LIVE API STATE: Reimbursements (GET /api/account/v1/reimbursements)
  // ─────────────────────────────────────────────────────────
  const [reimbursements, setReimbursements] = useState([]);
  const [reimbursementsPagination, setReimbursementsPagination] = useState(null);
  const [reimbursementsPage, setReimbursementsPage] = useState(0);
  const [reimbursementsPageSize, setReimbursementsPageSize] = useState(10);
  const [reimbursementsSearchTerm, setReimbursementsSearchTerm] = useState('');
  const [reimbursementsStatusFilter, setReimbursementsStatusFilter] = useState('ALL');
  const [reimbursementsDateFrom, setReimbursementsDateFrom] = useState('');
  const [reimbursementsDateTo, setReimbursementsDateTo] = useState('');
  const [isReimbursementsLoading, setIsReimbursementsLoading] = useState(false);
  const [reimbursementsError, setReimbursementsError] = useState(null);

  const [selectedReimbursementForDetails, setSelectedReimbursementForDetails] = useState(null);
  const [isReimbursementDetailsModalOpen, setIsReimbursementDetailsModalOpen] = useState(false);

  const [isReimbursementModalOpen, setIsReimbursementModalOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);

  const [selectedReimbursementForApprove, setSelectedReimbursementForApprove] = useState(null);
  const [isReimbursementApproveModalOpen, setIsReimbursementApproveModalOpen] = useState(false);
  const [isReimbursementApproving, setIsReimbursementApproving] = useState(false);

  const [selectedReimbursementForReject, setSelectedReimbursementForReject] = useState(null);
  const [isReimbursementRejectModalOpen, setIsReimbursementRejectModalOpen] = useState(false);
  const [isReimbursementRejecting, setIsReimbursementRejecting] = useState(false);

  const [selectedReimbursementForCancel, setSelectedReimbursementForCancel] = useState(null);
  const [isReimbursementCancelModalOpen, setIsReimbursementCancelModalOpen] = useState(false);
  const [isReimbursementCancelling, setIsReimbursementCancelling] = useState(false);

  const [selectedReimbursementForDelete, setSelectedReimbursementForDelete] = useState(null);
  const [isReimbursementDeleteModalOpen, setIsReimbursementDeleteModalOpen] = useState(false);
  const [isReimbursementDeleting, setIsReimbursementDeleting] = useState(false);

  const [reimbursementActionProcessingId, setReimbursementActionProcessingId] = useState(null);

  const [isAccountingModalOpen, setIsAccountingModalOpen] = useState(false);
  const [accountingModalExpense, setAccountingModalExpense] = useState(null);
  const [accountingModalReimbursement, setAccountingModalReimbursement] = useState(null);

  // Helper to extract human-readable error messages from backend responses
  const extractErrorMessage = (err, fallback = 'Operation failed') => {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      (Array.isArray(err?.response?.data?.errors) && err.response.data.errors[0]) ||
      err?.message ||
      fallback
    );
  };

  // ─────────────────────────────────────────────────────────
  // Fetch live Expense Requests from backend
  // ─────────────────────────────────────────────────────────
  const fetchExpenseRequests = useCallback(async () => {
    setIsRequestsLoading(true);
    setRequestsError(null);
    try {
      const filters = {};
      if (requestsSearchTerm) filters.search = requestsSearchTerm;
      if (requestsStatusFilter && requestsStatusFilter !== 'ALL') {
        filters.status = requestsStatusFilter;
      }
      if (requestsDateFrom) filters.dateFrom = requestsDateFrom;
      if (requestsDateTo) filters.dateTo = requestsDateTo;
      if (requestsRoleType) filters.roleType = requestsRoleType;
      if (requestsCategory) filters.categoryId = requestsCategory;

      const pageable = {
        page: requestsPage,
        size: requestsPageSize,
      };

      const response = await expenseRequestsApi.getList(filters, pageable);
      const data = response?.data || [];
      const pagination = response?.pagination || {
        page: requestsPage + 1,
        size: requestsPageSize,
        totalElements: data.length,
        totalPages: Math.ceil(data.length / requestsPageSize) || 1,
      };

      setRequests(Array.isArray(data) ? data : []);
      setRequestsPagination(pagination);
    } catch (err) {
      console.error('Error loading expense requests:', err);
      const msg = extractErrorMessage(err, 'Failed to fetch expense requests from server');
      setRequestsError(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsRequestsLoading(false);
    }
  }, [requestsPage, requestsPageSize, requestsSearchTerm, requestsStatusFilter, requestsDateFrom, requestsDateTo, requestsRoleType, requestsCategory, dispatch]);

  // Trigger load when on requests tab or when filters change
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchExpenseRequests();
    }
  }, [activeTab, fetchExpenseRequests]);

  // ─────────────────────────────────────────────────────────
  // Fetch live Expenses from backend
  // ─────────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    setIsExpensesLoading(true);
    setExpensesError(null);
    try {
      const filters = {};
      if (expensesSearchTerm) filters.search = expensesSearchTerm;
      if (expensesStatusFilter && expensesStatusFilter !== 'ALL') {
        filters.status = expensesStatusFilter;
      }
      if (expensesDateFrom) filters.dateFrom = expensesDateFrom;
      if (expensesDateTo) filters.dateTo = expensesDateTo;

      const pageable = {
        page: expensesPage,
        size: expensesPageSize,
      };

      const response = await expensesApi.getList(filters, pageable);
      const data = response?.data || [];
      const pagination = response?.pagination || {
        page: expensesPage + 1,
        size: expensesPageSize,
        totalElements: data.length,
        totalPages: Math.ceil(data.length / expensesPageSize) || 1,
      };

      setExpenses(Array.isArray(data) ? data : []);
      setExpensesPagination(pagination);
    } catch (err) {
      console.error('Error loading expenses:', err);
      const msg = extractErrorMessage(err, 'Failed to fetch expenses from server');
      setExpensesError(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsExpensesLoading(false);
    }
  }, [expensesPage, expensesPageSize, expensesSearchTerm, expensesStatusFilter, expensesDateFrom, expensesDateTo, dispatch]);

  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses();
    }
  }, [activeTab, fetchExpenses]);

  // ─────────────────────────────────────────────────────────
  // Fetch live Reimbursements from backend
  // ─────────────────────────────────────────────────────────
  const fetchReimbursements = useCallback(async () => {
    setIsReimbursementsLoading(true);
    setReimbursementsError(null);
    try {
      const filters = {};
      if (reimbursementsSearchTerm) filters.search = reimbursementsSearchTerm;
      if (reimbursementsStatusFilter && reimbursementsStatusFilter !== 'ALL') {
        filters.status = reimbursementsStatusFilter;
      }
      if (reimbursementsDateFrom) filters.dateFrom = reimbursementsDateFrom;
      if (reimbursementsDateTo) filters.dateTo = reimbursementsDateTo;

      const pageable = {
        page: reimbursementsPage,
        size: reimbursementsPageSize,
      };

      const response = await reimbursementsApi.getList(filters, pageable);
      const data = response?.data || [];
      const pagination = response?.pagination || {
        page: reimbursementsPage + 1,
        size: reimbursementsPageSize,
        totalElements: data.length,
        totalPages: Math.ceil(data.length / reimbursementsPageSize) || 1,
      };

      setReimbursements(Array.isArray(data) ? data : []);
      setReimbursementsPagination(pagination);
    } catch (err) {
      console.error('Error loading reimbursements:', err);
      const msg = extractErrorMessage(err, 'Failed to fetch reimbursements from server');
      setReimbursementsError(msg);
      dispatch(addAlert({ type: 'error', message: msg }));
    } finally {
      setIsReimbursementsLoading(false);
    }
  }, [reimbursementsPage, reimbursementsPageSize, reimbursementsSearchTerm, reimbursementsStatusFilter, reimbursementsDateFrom, reimbursementsDateTo, dispatch]);

  useEffect(() => {
    if (activeTab === 'reimbursements') {
      fetchReimbursements();
    }
  }, [activeTab, fetchReimbursements]);

  // ─────────────────────────────────────────────────────────
  // Request Operations Handlers
  // ─────────────────────────────────────────────────────────

  // 1. Create or Update (DRAFT)
  const handleSaveRequest = async (requestPayload) => {
    setIsSubmittingRequest(true);
    try {
      if (editingRequest?.id) {
        // PUT /api/account/v1/expense-requests/{id}
        const updated = await expenseRequestsApi.update(editingRequest.id, requestPayload);
        dispatch(
          addAlert({
            type: 'success',
            message: `Expense request ${updated?.data?.requestNumber || editingRequest.requestNumber} updated successfully`,
          })
        );
      } else {
        // POST /api/account/v1/expense-requests
        const created = await expenseRequestsApi.create(requestPayload);
        const reqNo = created?.data?.requestNumber || 'Draft';
        dispatch(
          addAlert({
            type: 'success',
            message: `Expense request ${reqNo} created successfully in DRAFT status`,
          })
        );
      }

      setIsRequestModalOpen(false);
      setEditingRequest(null);
      fetchExpenseRequests();
    } catch (err) {
      console.error('Error saving expense request:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to save expense request'),
        })
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // 2. Submit Request for Approval (POST /api/account/v1/expense-requests/{id}/submit)
  const handleSubmitForApproval = async (req) => {
    setActionProcessingId(req.id);
    try {
      const response = await expenseRequestsApi.submit(req.id);
      const newStatus = response?.data?.status || 'PENDING_APPROVAL';
      dispatch(
        addAlert({
          type: 'success',
          message: `Request ${req.requestNumber} submitted for approval (Status: ${newStatus})`,
        })
      );
      fetchExpenseRequests();
      if (selectedRequestForDetails?.id === req.id) {
        setSelectedRequestForDetails(response?.data || { ...req, status: newStatus });
      }
    } catch (err) {
      console.error('Submit error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to submit request for approval'),
        })
      );
    } finally {
      setActionProcessingId(null);
    }
  };

  // 3. Approve Request (POST /api/account/v1/expense-requests/{id}/approve)
  const handleConfirmApprove = async ({ approvedAmount, remarks }) => {
    if (!selectedRequestForApprove) return;
    setIsApproving(true);
    try {
      const response = await expenseRequestsApi.approve(selectedRequestForApprove.id, {
        approvedAmount,
        remarks,
      });
      dispatch(
        addAlert({
          type: 'success',
          message: `Expense request ${selectedRequestForApprove.requestNumber} approved successfully`,
        })
      );
      setIsApproveModalOpen(false);
      setSelectedRequestForApprove(null);
      fetchExpenseRequests();
      if (selectedRequestForDetails?.id === selectedRequestForApprove.id) {
        setSelectedRequestForDetails(response?.data);
      }
    } catch (err) {
      console.error('Approve error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to approve expense request'),
        })
      );
    } finally {
      setIsApproving(false);
    }
  };

  // 4. Reject Request (POST /api/account/v1/expense-requests/{id}/reject)
  const handleConfirmReject = async ({ reason }) => {
    if (!selectedRequestForReject) return;
    setIsRejecting(true);
    try {
      const response = await expenseRequestsApi.reject(selectedRequestForReject.id, { reason });
      dispatch(
        addAlert({
          type: 'success',
          message: `Expense request ${selectedRequestForReject.requestNumber} rejected`,
        })
      );
      setIsRejectModalOpen(false);
      setSelectedRequestForReject(null);
      fetchExpenseRequests();
      if (selectedRequestForDetails?.id === selectedRequestForReject.id) {
        setSelectedRequestForDetails(response?.data);
      }
    } catch (err) {
      console.error('Reject error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to reject expense request'),
        })
      );
    } finally {
      setIsRejecting(false);
    }
  };

  // 5. Cancel Request (POST /api/account/v1/expense-requests/{id}/cancel)
  const handleConfirmCancel = async () => {
    if (!selectedRequestForCancel) return;
    setIsCancelling(true);
    try {
      const response = await expenseRequestsApi.cancel(selectedRequestForCancel.id);
      dispatch(
        addAlert({
          type: 'success',
          message: `Expense request ${selectedRequestForCancel.requestNumber} cancelled`,
        })
      );
      setIsCancelModalOpen(false);
      setSelectedRequestForCancel(null);
      fetchExpenseRequests();
      if (selectedRequestForDetails?.id === selectedRequestForCancel.id) {
        setSelectedRequestForDetails(response?.data);
      }
    } catch (err) {
      console.error('Cancel error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to cancel expense request'),
        })
      );
    } finally {
      setIsCancelling(false);
    }
  };

  // 6. Convert Approved Request to Expense
  const handleConvertToExpense = (req) => {
    setRequestRefForExpense(req);
    setIsExpenseModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────
  // Expense Claim Operations Handlers
  // ─────────────────────────────────────────────────────────

  // 1. Create or Update (DRAFT)
  const handleSaveExpense = async (expensePayload) => {
    setIsSubmittingExpense(true);
    try {
      if (editingExpense?.id) {
        // PUT /api/account/v1/expenses/{id}?companyId={companyId}
        const updated = await expensesApi.update(editingExpense.id, expensePayload, companyId);
        dispatch(
          addAlert({
            type: 'success',
            message: `Expense claim ${updated?.data?.claimNo || editingExpense.claimNo} updated successfully`,
          })
        );
      } else {
        // POST /api/account/v1/expenses?companyId={companyId}
        const created = await expensesApi.create(expensePayload, companyId);
        const claimNo = created?.data?.claimNo || 'Draft';
        dispatch(
          addAlert({
            type: 'success',
            message: `Expense claim ${claimNo} created successfully in DRAFT status`,
          })
        );
      }

      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      setRequestRefForExpense(null);
      fetchExpenses();
    } catch (err) {
      console.error('Error saving expense claim:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to save expense claim'),
        })
      );
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // 2. Submit Claim for Approval (POST /api/account/v1/expenses/{id}/submit)
  const handleSubmitExpenseForApproval = async (exp) => {
    setExpenseActionProcessingId(exp.id);
    try {
      const response = await expensesApi.submit(exp.id);
      const newStatus = response?.data?.status || 'PENDING_APPROVAL';
      dispatch(
        addAlert({
          type: 'success',
          message: `Expense ${exp.claimNo} submitted for approval (Status: ${newStatus})`,
        })
      );
      fetchExpenses();
      if (selectedExpenseForDetails?.id === exp.id) {
        setSelectedExpenseForDetails(response?.data || { ...exp, status: newStatus });
      }
    } catch (err) {
      console.error('Submit expense error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to submit expense for approval'),
        })
      );
    } finally {
      setExpenseActionProcessingId(null);
    }
  };

  // 3. Approve Claim (POST /api/account/v1/expenses/{id}/approve)
  const handleConfirmExpenseApprove = async ({ notes, employeePayableAccountId, bankOrCashAccountId }) => {
    if (!selectedExpenseForApprove) return;
    setIsExpenseApproving(true);
    try {
      const response = await expensesApi.approve(selectedExpenseForApprove.id, {
        notes,
        employeePayableAccountId,
        bankOrCashAccountId
      });
      dispatch(
        addAlert({
          type: 'success',
          message: `Expense claim ${selectedExpenseForApprove.claimNo} approved successfully`,
        })
      );
      setIsExpenseApproveModalOpen(false);
      setSelectedExpenseForApprove(null);
      fetchExpenses();
      if (selectedExpenseForDetails?.id === selectedExpenseForApprove.id) {
        setSelectedExpenseForDetails(response?.data);
      }
    } catch (err) {
      console.error('Approve expense error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to approve expense claim'),
        })
      );
    } finally {
      setIsExpenseApproving(false);
    }
  };

  // 4. Reject Claim (POST /api/account/v1/expenses/{id}/reject)
  const handleConfirmExpenseReject = async ({ rejectionReason }) => {
    if (!selectedExpenseForReject) return;
    setIsExpenseRejecting(true);
    try {
      const response = await expensesApi.reject(selectedExpenseForReject.id, { rejectionReason });
      dispatch(
        addAlert({
          type: 'success',
          message: `Expense claim ${selectedExpenseForReject.claimNo} rejected`,
        })
      );
      setIsExpenseRejectModalOpen(false);
      setSelectedExpenseForReject(null);
      fetchExpenses();
      if (selectedExpenseForDetails?.id === selectedExpenseForReject.id) {
        setSelectedExpenseForDetails(response?.data);
      }
    } catch (err) {
      console.error('Reject expense error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to reject expense claim'),
        })
      );
    } finally {
      setIsExpenseRejecting(false);
    }
  };

  // 5. Cancel Claim (POST /api/account/v1/expenses/{id}/cancel)
  const handleConfirmExpenseCancel = async () => {
    if (!selectedExpenseForCancel) return;
    setIsExpenseCancelling(true);
    try {
      const response = await expensesApi.cancel(selectedExpenseForCancel.id);
      dispatch(
        addAlert({
          type: 'success',
          message: `Expense claim ${selectedExpenseForCancel.claimNo} cancelled`,
        })
      );
      setIsExpenseCancelModalOpen(false);
      setSelectedExpenseForCancel(null);
      fetchExpenses();
      if (selectedExpenseForDetails?.id === selectedExpenseForCancel.id) {
        setSelectedExpenseForDetails(response?.data);
      }
    } catch (err) {
      console.error('Cancel expense error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to cancel expense claim'),
        })
      );
    } finally {
      setIsExpenseCancelling(false);
    }
  };

  // 6. Delete Claim (DELETE /api/account/v1/expenses/{id})
  const handleConfirmExpenseDelete = async () => {
    if (!selectedExpenseForDelete) return;
    setIsExpenseDeleting(true);
    try {
      await expensesApi.delete(selectedExpenseForDelete.id);
      dispatch(
        addAlert({
          type: 'success',
          message: `Expense claim ${selectedExpenseForDelete.claimNo} deleted`,
        })
      );
      setIsExpenseDeleteModalOpen(false);
      setSelectedExpenseForDelete(null);
      fetchExpenses();
      if (selectedExpenseForDetails?.id === selectedExpenseForDelete.id) {
        setIsExpenseDetailsModalOpen(false);
        setSelectedExpenseForDetails(null);
      }
    } catch (err) {
      console.error('Delete expense error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to delete expense claim'),
        })
      );
    } finally {
      setIsExpenseDeleting(false);
    }
  };

  const handlePostToAccounting = (expenseId) => {
    const posted = expenseStorageService.postExpenseToAccounting(companyId, expenseId);
    setExpenses(expenseStorageService.getExpenses(companyId));
    setReimbursements(expenseStorageService.getReimbursements(companyId));

    dispatch(
      addAlert({
        type: 'success',
        message: `Posted to General Ledger! Voucher ${posted.journalVoucherNo} generated.`,
      })
    );

    setAccountingModalExpense(posted);
    setAccountingModalReimbursement(null);
    setIsAccountingModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────
  // Reimbursement Operations Handlers
  // ─────────────────────────────────────────────────────────

  // 1. Submit Reimbursement (POST /api/account/v1/reimbursements/{id}/submit)
  const handleSubmitReimbursementForApproval = async (r) => {
    setReimbursementActionProcessingId(r.id);
    try {
      const response = await reimbursementsApi.submit(r.id);
      dispatch(
        addAlert({
          type: 'success',
          message: `Reimbursement ${r.reimbursementNo} submitted for approval`,
        })
      );
      fetchReimbursements();
      if (selectedReimbursementForDetails?.id === r.id) {
        setSelectedReimbursementForDetails(response?.data || { ...r, status: 'SUBMITTED' });
      }
    } catch (err) {
      console.error('Submit reimbursement error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to submit reimbursement'),
        })
      );
    } finally {
      setReimbursementActionProcessingId(null);
    }
  };

  // 2. Approve Reimbursement (POST /api/account/v1/reimbursements/{id}/approve)
  const handleConfirmReimbursementApprove = async ({ notes }) => {
    if (!selectedReimbursementForApprove) return;
    setIsReimbursementApproving(true);
    try {
      const response = await reimbursementsApi.approve(selectedReimbursementForApprove.id, { notes });
      dispatch(
        addAlert({
          type: 'success',
          message: `Reimbursement ${selectedReimbursementForApprove.reimbursementNo} approved successfully`,
        })
      );
      setIsReimbursementApproveModalOpen(false);
      setSelectedReimbursementForApprove(null);
      fetchReimbursements();
      if (selectedReimbursementForDetails?.id === selectedReimbursementForApprove.id) {
        setSelectedReimbursementForDetails(response?.data);
      }
    } catch (err) {
      console.error('Approve reimbursement error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to approve reimbursement'),
        })
      );
    } finally {
      setIsReimbursementApproving(false);
    }
  };

  // 3. Reject Reimbursement (POST /api/account/v1/reimbursements/{id}/reject)
  const handleConfirmReimbursementReject = async ({ rejectionReason }) => {
    if (!selectedReimbursementForReject) return;
    setIsReimbursementRejecting(true);
    try {
      const response = await reimbursementsApi.reject(selectedReimbursementForReject.id, { rejectionReason });
      dispatch(
        addAlert({
          type: 'success',
          message: `Reimbursement ${selectedReimbursementForReject.reimbursementNo} rejected`,
        })
      );
      setIsReimbursementRejectModalOpen(false);
      setSelectedReimbursementForReject(null);
      fetchReimbursements();
      if (selectedReimbursementForDetails?.id === selectedReimbursementForReject.id) {
        setSelectedReimbursementForDetails(response?.data);
      }
    } catch (err) {
      console.error('Reject reimbursement error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to reject reimbursement'),
        })
      );
    } finally {
      setIsReimbursementRejecting(false);
    }
  };

  // 4. Cancel Reimbursement (POST /api/account/v1/reimbursements/{id}/cancel)
  const handleConfirmReimbursementCancel = async () => {
    if (!selectedReimbursementForCancel) return;
    setIsReimbursementCancelling(true);
    try {
      const response = await reimbursementsApi.cancel(selectedReimbursementForCancel.id);
      dispatch(
        addAlert({
          type: 'success',
          message: `Reimbursement ${selectedReimbursementForCancel.reimbursementNo} cancelled`,
        })
      );
      setIsReimbursementCancelModalOpen(false);
      setSelectedReimbursementForCancel(null);
      fetchReimbursements();
      if (selectedReimbursementForDetails?.id === selectedReimbursementForCancel.id) {
        setSelectedReimbursementForDetails(response?.data);
      }
    } catch (err) {
      console.error('Cancel reimbursement error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to cancel reimbursement'),
        })
      );
    } finally {
      setIsReimbursementCancelling(false);
    }
  };

  // 5. Delete Reimbursement (DELETE /api/account/v1/reimbursements/{id})
  const handleConfirmReimbursementDelete = async () => {
    if (!selectedReimbursementForDelete) return;
    setIsReimbursementDeleting(true);
    try {
      await reimbursementsApi.delete(selectedReimbursementForDelete.id);
      dispatch(
        addAlert({
          type: 'success',
          message: `Reimbursement ${selectedReimbursementForDelete.reimbursementNo} deleted`,
        })
      );
      setIsReimbursementDeleteModalOpen(false);
      setSelectedReimbursementForDelete(null);
      fetchReimbursements();
      if (selectedReimbursementForDetails?.id === selectedReimbursementForDelete.id) {
        setIsReimbursementDetailsModalOpen(false);
        setSelectedReimbursementForDetails(null);
      }
    } catch (err) {
      console.error('Delete reimbursement error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to delete reimbursement'),
        })
      );
    } finally {
      setIsReimbursementDeleting(false);
    }
  };

  // 6. Pay Reimbursement (POST /api/account/v1/reimbursements/{id}/pay)
  const handleConfirmReimbursementPay = async (id, paymentData) => {
    if (!selectedReimbursement) return;
    try {
      const response = await reimbursementsApi.pay(id, paymentData);
      dispatch(
        addAlert({
          type: 'success',
          message: `Reimbursement payout processed successfully. Status is now PAID.`,
        })
      );
      setIsReimbursementModalOpen(false);
      setSelectedReimbursement(null);
      fetchReimbursements();
      if (selectedReimbursementForDetails?.id === id) {
        setSelectedReimbursementForDetails(response?.data);
      }
    } catch (err) {
      console.error('Pay reimbursement error:', err);
      dispatch(
        addAlert({
          type: 'error',
          message: extractErrorMessage(err, 'Failed to process payout for reimbursement'),
        })
      );
    }
  };

  const handleViewAccountingForExpense = (exp) => {
    setAccountingModalExpense(exp);
    setAccountingModalReimbursement(null);
    setIsAccountingModalOpen(true);
  };

  const handleViewAccountingForReimbursement = (reimb) => {
    setAccountingModalExpense(null);
    setAccountingModalReimbursement(reimb);
    setIsAccountingModalOpen(true);
  };

  // Header Titles
  const { title, subtitle, icon: HeaderIcon } = useMemo(() => {
    switch (activeTab) {
      case 'expenses':
        return {
          title: 'Expenses',
          subtitle: 'Track operational spends, link delivery challans and post to General Ledger',
          icon: Receipt,
        };
      case 'reimbursements':
        return {
          title: 'Reimbursements',
          subtitle: 'Review self-paid driver and employee expenses awaiting settlement',
          icon: CreditCard,
        };
      case 'reports':
        return {
          title: 'Expense Reports & Analytics',
          subtitle: 'Category-wise spending, vehicle fuel burn, and reimbursement summaries',
          icon: BarChart3,
        };
      case 'requests':
      default:
        return {
          title: 'Expense Requests',
          subtitle: 'Advance and expense authorizations with manager approval and status tracking',
          icon: ClipboardList,
        };
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      {/* Top Page Header */}
      <PageHeader
        title={title}
        description={subtitle}
        icon={HeaderIcon}
      >
        {activeTab === 'requests' && (
          <button
            type="button"
            onClick={() => {
              setEditingRequest(null);
              setIsRequestModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> <span>New Expense Request</span>
          </button>
        )}

        {activeTab === 'expenses' && (
          <button
            type="button"
            onClick={() => {
              setRequestRefForExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> <span>Record Expense</span>
          </button>
        )}

        {activeTab === 'reimbursements' && (
          <button
            type="button"
            onClick={() => {
              setSelectedReimbursement(null);
              setIsReimbursementModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> <span>Process Reimbursement</span>
          </button>
        )}
      </PageHeader>

      {/* ── Module Tabs ── */}
      <ModuleTabs tabs={expenseTabs} activeKey={activeTab} />

      {/* Main Tab Body */}
      <div className="p-6 flex-1 min-h-0 overflow-y-auto flex flex-col">
        {activeTab === 'requests' && (
          <ExpenseRequestsTab
            requests={requests}
            pagination={requestsPagination}
            page={requestsPage}
            pageSize={requestsPageSize}
            onPageChange={(newPage) => setRequestsPage(newPage)}
            onPageSizeChange={(newSize) => {
              setRequestsPageSize(newSize);
              setRequestsPage(0);
            }}
            isLoading={isRequestsLoading}
            error={requestsError}
            onRefresh={fetchExpenseRequests}
            searchTerm={requestsSearchTerm}
            onSearchChange={(val) => {
              setRequestsSearchTerm(val);
              setRequestsPage(0);
            }}
            statusFilter={requestsStatusFilter}
            onStatusFilterChange={(val) => {
              setRequestsStatusFilter(val);
              setRequestsPage(0);
            }}
            dateFrom={requestsDateFrom}
            onDateFromChange={(val) => {
              setRequestsDateFrom(val);
              setRequestsPage(0);
            }}
            dateTo={requestsDateTo}
            onDateToChange={(val) => {
              setRequestsDateTo(val);
              setRequestsPage(0);
            }}
            roleType={requestsRoleType}
            onRoleTypeChange={(val) => {
              setRequestsRoleType(val);
              setRequestsPage(0);
            }}
            category={requestsCategory}
            onCategoryChange={(val) => {
              setRequestsCategory(val);
              setRequestsPage(0);
            }}
            onResetFilters={() => {
              setRequestsSearchTerm('');
              setRequestsStatusFilter('ALL');
              setRequestsDateFrom('');
              setRequestsDateTo('');
              setRequestsRoleType('');
              setRequestsCategory('');
              setRequestsPage(0);
            }}
            onNewRequest={() => {
              setEditingRequest(null);
              setIsRequestModalOpen(true);
            }}
            onViewDetails={(req) => {
              setSelectedRequestForDetails(req);
              setIsDetailsModalOpen(true);
            }}
            onEditRequest={(req) => {
              setEditingRequest(req);
              setIsRequestModalOpen(true);
            }}
            onSubmitForApproval={handleSubmitForApproval}
            onApprove={(req) => {
              setSelectedRequestForApprove(req);
              setIsApproveModalOpen(true);
            }}
            onReject={(req) => {
              setSelectedRequestForReject(req);
              setIsRejectModalOpen(true);
            }}
            onCancel={(req) => {
              setSelectedRequestForCancel(req);
              setIsCancelModalOpen(true);
            }}
            onConvertToExpense={handleConvertToExpense}
            actionProcessingId={actionProcessingId}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            expenses={expenses}
            pagination={expensesPagination}
            page={expensesPage}
            pageSize={expensesPageSize}
            onPageChange={(newPage) => setExpensesPage(newPage)}
            onPageSizeChange={(newSize) => {
              setExpensesPageSize(newSize);
              setExpensesPage(0);
            }}
            isLoading={isExpensesLoading}
            error={expensesError}
            onRefresh={fetchExpenses}
            searchTerm={expensesSearchTerm}
            onSearchChange={(val) => {
              setExpensesSearchTerm(val);
              setExpensesPage(0);
            }}
            statusFilter={expensesStatusFilter}
            onStatusFilterChange={(val) => {
              setExpensesStatusFilter(val);
              setExpensesPage(0);
            }}
            dateFrom={expensesDateFrom}
            onDateFromChange={(val) => {
              setExpensesDateFrom(val);
              setExpensesPage(0);
            }}
            dateTo={expensesDateTo}
            onDateToChange={(val) => {
              setExpensesDateTo(val);
              setExpensesPage(0);
            }}
            onResetFilters={() => {
              setExpensesSearchTerm('');
              setExpensesStatusFilter('ALL');
              setExpensesDateFrom('');
              setExpensesDateTo('');
              setExpensesPage(0);
            }}
            onRecordExpense={() => {
              setEditingExpense(null);
              setRequestRefForExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setIsExpenseModalOpen(true);
            }}
            onViewDetails={(exp) => {
              setSelectedExpenseForDetails(exp);
              setIsExpenseDetailsModalOpen(true);
            }}
            onSubmitForApproval={handleSubmitExpenseForApproval}
            onApprove={(exp) => {
              setSelectedExpenseForApprove(exp);
              setIsExpenseApproveModalOpen(true);
            }}
            onReject={(exp) => {
              setSelectedExpenseForReject(exp);
              setIsExpenseRejectModalOpen(true);
            }}
            onCancel={(exp) => {
              setSelectedExpenseForCancel(exp);
              setIsExpenseCancelModalOpen(true);
            }}
            onDelete={(exp) => {
              setSelectedExpenseForDelete(exp);
              setIsExpenseDeleteModalOpen(true);
            }}
            onPostToAccounting={handlePostToAccounting}
            onViewAccounting={handleViewAccountingForExpense}
            actionProcessingId={expenseActionProcessingId}
          />
        )}

        {activeTab === 'reimbursements' && (
          <ReimbursementsTab
            reimbursements={reimbursements}
            pagination={reimbursementsPagination}
            page={reimbursementsPage}
            pageSize={reimbursementsPageSize}
            onPageChange={(newPage) => setReimbursementsPage(newPage)}
            onPageSizeChange={(newSize) => {
              setReimbursementsPageSize(newSize);
              setReimbursementsPage(0);
            }}
            isLoading={isReimbursementsLoading}
            error={reimbursementsError}
            onRefresh={fetchReimbursements}
            searchTerm={reimbursementsSearchTerm}
            onSearchChange={(val) => {
              setReimbursementsSearchTerm(val);
              setReimbursementsPage(0);
            }}
            statusFilter={reimbursementsStatusFilter}
            onStatusFilterChange={(val) => {
              setReimbursementsStatusFilter(val);
              setReimbursementsPage(0);
            }}
            dateFrom={reimbursementsDateFrom}
            onDateFromChange={(val) => {
              setReimbursementsDateFrom(val);
              setReimbursementsPage(0);
            }}
            dateTo={reimbursementsDateTo}
            onDateToChange={(val) => {
              setReimbursementsDateTo(val);
              setReimbursementsPage(0);
            }}
            onResetFilters={() => {
              setReimbursementsSearchTerm('');
              setReimbursementsStatusFilter('ALL');
              setReimbursementsDateFrom('');
              setReimbursementsDateTo('');
              setReimbursementsPage(0);
            }}
            onViewDetails={(r) => {
              setSelectedReimbursementForDetails(r);
              setIsReimbursementDetailsModalOpen(true);
            }}
            onEdit={(r) => {
              // Edit for DRAFT/REJECTED — future: open edit modal
              // For now use view as placeholder until edit modal is built
              setSelectedReimbursementForDetails(r);
              setIsReimbursementDetailsModalOpen(true);
            }}
            onSubmit={handleSubmitReimbursementForApproval}
            onApprove={(r) => {
              setSelectedReimbursementForApprove(r);
              setIsReimbursementApproveModalOpen(true);
            }}
            onReject={(r) => {
              setSelectedReimbursementForReject(r);
              setIsReimbursementRejectModalOpen(true);
            }}
            onPay={(r) => {
              setSelectedReimbursement(r);
              setIsReimbursementModalOpen(true);
            }}
            onCancel={(r) => {
              setSelectedReimbursementForCancel(r);
              setIsReimbursementCancelModalOpen(true);
            }}
            onDelete={(r) => {
              setSelectedReimbursementForDelete(r);
              setIsReimbursementDeleteModalOpen(true);
            }}
            actionProcessingId={reimbursementActionProcessingId}
          />
        )}

        {activeTab === 'reports' && (
          <ExpenseReportsTab
            companyId={companyId}
            expenses={expenses}
            requests={requests}
            reimbursements={reimbursements}
          />
        )}
      </div>

      {/* ────────────────────────────────────────────────── */}
      {/* MODALS */}
      {/* ────────────────────────────────────────────────── */}
      <ExpenseRequestModalsGroup
        isRequestModalOpen={isRequestModalOpen}
        setIsRequestModalOpen={setIsRequestModalOpen}
        editingRequest={editingRequest}
        setEditingRequest={setEditingRequest}
        handleSaveRequest={handleSaveRequest}
        companyId={companyId}
        isSubmittingRequest={isSubmittingRequest}
        isDetailsModalOpen={isDetailsModalOpen}
        setIsDetailsModalOpen={setIsDetailsModalOpen}
        selectedRequestForDetails={selectedRequestForDetails}
        setSelectedRequestForDetails={setSelectedRequestForDetails}
        handleSubmitForApproval={handleSubmitForApproval}
        handleConvertToExpense={handleConvertToExpense}
        actionProcessingId={actionProcessingId}
        isApproveModalOpen={isApproveModalOpen}
        setIsApproveModalOpen={setIsApproveModalOpen}
        selectedRequestForApprove={selectedRequestForApprove}
        setSelectedRequestForApprove={setSelectedRequestForApprove}
        handleConfirmApprove={handleConfirmApprove}
        isApproving={isApproving}
        isRejectModalOpen={isRejectModalOpen}
        setIsRejectModalOpen={setIsRejectModalOpen}
        selectedRequestForReject={selectedRequestForReject}
        setSelectedRequestForReject={setSelectedRequestForReject}
        handleConfirmReject={handleConfirmReject}
        isRejecting={isRejecting}
        isCancelModalOpen={isCancelModalOpen}
        setIsCancelModalOpen={setIsCancelModalOpen}
        selectedRequestForCancel={selectedRequestForCancel}
        setSelectedRequestForCancel={setSelectedRequestForCancel}
        handleConfirmCancel={handleConfirmCancel}
        isCancelling={isCancelling}
      />

      <ExpenseActionModalsGroup
        isExpenseModalOpen={isExpenseModalOpen}
        setIsExpenseModalOpen={setIsExpenseModalOpen}
        editingExpense={editingExpense}
        setEditingExpense={setEditingExpense}
        requestRefForExpense={requestRefForExpense}
        setRequestRefForExpense={setRequestRefForExpense}
        handleSaveExpense={handleSaveExpense}
        companyId={companyId}
        isSubmittingExpense={isSubmittingExpense}
        isAccountingModalOpen={isAccountingModalOpen}
        setIsAccountingModalOpen={setIsAccountingModalOpen}
        accountingModalExpense={accountingModalExpense}
        setAccountingModalExpense={setAccountingModalExpense}
        accountingModalReimbursement={accountingModalReimbursement}
        setAccountingModalReimbursement={setAccountingModalReimbursement}
        isExpenseDetailsModalOpen={isExpenseDetailsModalOpen}
        setIsExpenseDetailsModalOpen={setIsExpenseDetailsModalOpen}
        selectedExpenseForDetails={selectedExpenseForDetails}
        setSelectedExpenseForDetails={setSelectedExpenseForDetails}
        handleSubmitExpenseForApproval={handleSubmitExpenseForApproval}
        handleViewAccountingForExpense={handleViewAccountingForExpense}
        expenseActionProcessingId={expenseActionProcessingId}
        isExpenseApproveModalOpen={isExpenseApproveModalOpen}
        setIsExpenseApproveModalOpen={setIsExpenseApproveModalOpen}
        selectedExpenseForApprove={selectedExpenseForApprove}
        setSelectedExpenseForApprove={setSelectedExpenseForApprove}
        handleConfirmExpenseApprove={handleConfirmExpenseApprove}
        isExpenseApproving={isExpenseApproving}
        isExpenseRejectModalOpen={isExpenseRejectModalOpen}
        setIsExpenseRejectModalOpen={setIsExpenseRejectModalOpen}
        selectedExpenseForReject={selectedExpenseForReject}
        setSelectedExpenseForReject={setSelectedExpenseForReject}
        handleConfirmExpenseReject={handleConfirmExpenseReject}
        isExpenseRejecting={isExpenseRejecting}
        isExpenseCancelModalOpen={isExpenseCancelModalOpen}
        setIsExpenseCancelModalOpen={setIsExpenseCancelModalOpen}
        selectedExpenseForCancel={selectedExpenseForCancel}
        setSelectedExpenseForCancel={setSelectedExpenseForCancel}
        handleConfirmExpenseCancel={handleConfirmExpenseCancel}
        isExpenseCancelling={isExpenseCancelling}
        isExpenseDeleteModalOpen={isExpenseDeleteModalOpen}
        setIsExpenseDeleteModalOpen={setIsExpenseDeleteModalOpen}
        selectedExpenseForDelete={selectedExpenseForDelete}
        setSelectedExpenseForDelete={setSelectedExpenseForDelete}
        handleConfirmExpenseDelete={handleConfirmExpenseDelete}
        isExpenseDeleting={isExpenseDeleting}
      />

      <ReimbursementModalsGroup
        isReimbursementDetailsModalOpen={isReimbursementDetailsModalOpen}
        setIsReimbursementDetailsModalOpen={setIsReimbursementDetailsModalOpen}
        selectedReimbursementForDetails={selectedReimbursementForDetails}
        setSelectedReimbursementForDetails={setSelectedReimbursementForDetails}
        isReimbursementModalOpen={isReimbursementModalOpen}
        setIsReimbursementModalOpen={setIsReimbursementModalOpen}
        selectedReimbursement={selectedReimbursement}
        setSelectedReimbursement={setSelectedReimbursement}
        handleConfirmReimbursementPay={handleConfirmReimbursementPay}
        isReimbursementApproveModalOpen={isReimbursementApproveModalOpen}
        setIsReimbursementApproveModalOpen={setIsReimbursementApproveModalOpen}
        selectedReimbursementForApprove={selectedReimbursementForApprove}
        setSelectedReimbursementForApprove={setSelectedReimbursementForApprove}
        handleConfirmReimbursementApprove={handleConfirmReimbursementApprove}
        isReimbursementApproving={isReimbursementApproving}
        isReimbursementRejectModalOpen={isReimbursementRejectModalOpen}
        setIsReimbursementRejectModalOpen={setIsReimbursementRejectModalOpen}
        selectedReimbursementForReject={selectedReimbursementForReject}
        setSelectedReimbursementForReject={setSelectedReimbursementForReject}
        handleConfirmReimbursementReject={handleConfirmReimbursementReject}
        isReimbursementRejecting={isReimbursementRejecting}
        isReimbursementCancelModalOpen={isReimbursementCancelModalOpen}
        setIsReimbursementCancelModalOpen={setIsReimbursementCancelModalOpen}
        selectedReimbursementForCancel={selectedReimbursementForCancel}
        setSelectedReimbursementForCancel={setSelectedReimbursementForCancel}
        handleConfirmReimbursementCancel={handleConfirmReimbursementCancel}
        isReimbursementCancelling={isReimbursementCancelling}
        isReimbursementDeleteModalOpen={isReimbursementDeleteModalOpen}
        setIsReimbursementDeleteModalOpen={setIsReimbursementDeleteModalOpen}
        selectedReimbursementForDelete={selectedReimbursementForDelete}
        setSelectedReimbursementForDelete={setSelectedReimbursementForDelete}
        handleConfirmReimbursementDelete={handleConfirmReimbursementDelete}
        isReimbursementDeleting={isReimbursementDeleting}
      />
    </div>
  );
}
