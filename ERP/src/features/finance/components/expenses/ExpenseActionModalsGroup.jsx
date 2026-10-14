import React from 'react';
import RecordExpenseModal from './RecordExpenseModal';
import ExpenseAccountingModal from './ExpenseAccountingModal';
import ExpenseDetailsModal from './ExpenseDetailsModal';
import {
  ExpenseApproveModal,
  ExpenseRejectModal,
  ExpenseCancelModal,
  ExpenseDeleteModal,
} from './ExpenseActionModals';

export default function ExpenseActionModalsGroup({
  isExpenseModalOpen,
  setIsExpenseModalOpen,
  editingExpense,
  setEditingExpense,
  requestRefForExpense,
  setRequestRefForExpense,
  handleSaveExpense,
  companyId,
  isSubmittingExpense,

  isAccountingModalOpen,
  setIsAccountingModalOpen,
  accountingModalExpense,
  setAccountingModalExpense,
  accountingModalReimbursement,
  setAccountingModalReimbursement,

  isExpenseDetailsModalOpen,
  setIsExpenseDetailsModalOpen,
  selectedExpenseForDetails,
  setSelectedExpenseForDetails,
  handleSubmitExpenseForApproval,
  handleViewAccountingForExpense,
  expenseActionProcessingId,

  isExpenseApproveModalOpen,
  setIsExpenseApproveModalOpen,
  selectedExpenseForApprove,
  setSelectedExpenseForApprove,
  handleConfirmExpenseApprove,
  isExpenseApproving,

  isExpenseRejectModalOpen,
  setIsExpenseRejectModalOpen,
  selectedExpenseForReject,
  setSelectedExpenseForReject,
  handleConfirmExpenseReject,
  isExpenseRejecting,

  isExpenseCancelModalOpen,
  setIsExpenseCancelModalOpen,
  selectedExpenseForCancel,
  setSelectedExpenseForCancel,
  handleConfirmExpenseCancel,
  isExpenseCancelling,

  isExpenseDeleteModalOpen,
  setIsExpenseDeleteModalOpen,
  selectedExpenseForDelete,
  setSelectedExpenseForDelete,
  handleConfirmExpenseDelete,
  isExpenseDeleting,
}) {
  return (
    <>
      <RecordExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
          setRequestRefForExpense(null);
        }}
        onSubmit={handleSaveExpense}
        initialData={editingExpense}
        requestRefData={requestRefForExpense}
        companyId={companyId}
        isSubmitting={isSubmittingExpense}
      />

      <ExpenseAccountingModal
        isOpen={isAccountingModalOpen}
        onClose={() => {
          setIsAccountingModalOpen(false);
          setAccountingModalExpense(null);
          setAccountingModalReimbursement(null);
        }}
        expense={accountingModalExpense}
        reimbursement={accountingModalReimbursement}
      />

      <ExpenseDetailsModal
        isOpen={isExpenseDetailsModalOpen}
        onClose={() => {
          setIsExpenseDetailsModalOpen(false);
          setSelectedExpenseForDetails(null);
        }}
        expenseId={selectedExpenseForDetails?.id}
        initialExpense={selectedExpenseForDetails}
        onEdit={(exp) => {
          setIsExpenseDetailsModalOpen(false);
          setEditingExpense(exp);
          setIsExpenseModalOpen(true);
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
        onOpenAccounting={(exp) => {
          setIsExpenseDetailsModalOpen(false);
          handleViewAccountingForExpense(exp);
        }}
        actionLoading={!!expenseActionProcessingId}
      />

      <ExpenseApproveModal
        isOpen={isExpenseApproveModalOpen}
        onClose={() => {
          setIsExpenseApproveModalOpen(false);
          setSelectedExpenseForApprove(null);
        }}
        expense={selectedExpenseForApprove}
        onConfirm={handleConfirmExpenseApprove}
        isLoading={isExpenseApproving}
      />

      <ExpenseRejectModal
        isOpen={isExpenseRejectModalOpen}
        onClose={() => {
          setIsExpenseRejectModalOpen(false);
          setSelectedExpenseForReject(null);
        }}
        expense={selectedExpenseForReject}
        onConfirm={handleConfirmExpenseReject}
        isLoading={isExpenseRejecting}
      />

      <ExpenseCancelModal
        isOpen={isExpenseCancelModalOpen}
        onClose={() => {
          setIsExpenseCancelModalOpen(false);
          setSelectedExpenseForCancel(null);
        }}
        expense={selectedExpenseForCancel}
        onConfirm={handleConfirmExpenseCancel}
        isLoading={isExpenseCancelling}
      />

      <ExpenseDeleteModal
        isOpen={isExpenseDeleteModalOpen}
        onClose={() => {
          setIsExpenseDeleteModalOpen(false);
          setSelectedExpenseForDelete(null);
        }}
        expense={selectedExpenseForDelete}
        onConfirm={handleConfirmExpenseDelete}
        isLoading={isExpenseDeleting}
      />
    </>
  );
}
