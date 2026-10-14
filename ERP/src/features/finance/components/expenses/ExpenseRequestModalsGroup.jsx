import React from 'react';
import ExpenseRequestModal from './ExpenseRequestModal';
import ExpenseRequestDetailsModal from './ExpenseRequestDetailsModal';
import {
  ExpenseRequestApproveModal,
  ExpenseRequestRejectModal,
  ExpenseRequestCancelModal,
} from './ExpenseRequestActionModals';

export default function ExpenseRequestModalsGroup({
  isRequestModalOpen,
  setIsRequestModalOpen,
  editingRequest,
  setEditingRequest,
  handleSaveRequest,
  companyId,
  isSubmittingRequest,

  isDetailsModalOpen,
  setIsDetailsModalOpen,
  selectedRequestForDetails,
  setSelectedRequestForDetails,
  handleSubmitForApproval,
  handleConvertToExpense,
  actionProcessingId,

  isApproveModalOpen,
  setIsApproveModalOpen,
  selectedRequestForApprove,
  setSelectedRequestForApprove,
  handleConfirmApprove,
  isApproving,

  isRejectModalOpen,
  setIsRejectModalOpen,
  selectedRequestForReject,
  setSelectedRequestForReject,
  handleConfirmReject,
  isRejecting,

  isCancelModalOpen,
  setIsCancelModalOpen,
  selectedRequestForCancel,
  setSelectedRequestForCancel,
  handleConfirmCancel,
  isCancelling,
}) {
  return (
    <>
      <ExpenseRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setEditingRequest(null);
        }}
        onSubmit={handleSaveRequest}
        initialData={editingRequest}
        companyId={companyId}
        isSubmitting={isSubmittingRequest}
      />

      <ExpenseRequestDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRequestForDetails(null);
        }}
        requestId={selectedRequestForDetails?.id}
        initialRequest={selectedRequestForDetails}
        onEdit={(req) => {
          setIsDetailsModalOpen(false);
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
        actionLoading={!!actionProcessingId}
      />

      <ExpenseRequestApproveModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setSelectedRequestForApprove(null);
        }}
        request={selectedRequestForApprove}
        onConfirm={handleConfirmApprove}
        isLoading={isApproving}
      />

      <ExpenseRequestRejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedRequestForReject(null);
        }}
        request={selectedRequestForReject}
        onConfirm={handleConfirmReject}
        isLoading={isRejecting}
      />

      <ExpenseRequestCancelModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedRequestForCancel(null);
        }}
        request={selectedRequestForCancel}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
      />
    </>
  );
}
