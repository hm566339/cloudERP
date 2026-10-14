import React from 'react';
import ReimbursementDetailsModal from './ReimbursementDetailsModal';
import ProcessReimbursementModal from './ProcessReimbursementModal';
import {
  ReimbursementApproveModal,
  ReimbursementRejectModal,
  ReimbursementCancelModal,
  ReimbursementDeleteModal,
} from './ReimbursementActionModals';

export default function ReimbursementModalsGroup({
  isReimbursementDetailsModalOpen,
  setIsReimbursementDetailsModalOpen,
  selectedReimbursementForDetails,
  setSelectedReimbursementForDetails,

  isReimbursementModalOpen,
  setIsReimbursementModalOpen,
  selectedReimbursement,
  setSelectedReimbursement,
  handleConfirmReimbursementPay,

  isReimbursementApproveModalOpen,
  setIsReimbursementApproveModalOpen,
  selectedReimbursementForApprove,
  setSelectedReimbursementForApprove,
  handleConfirmReimbursementApprove,
  isReimbursementApproving,

  isReimbursementRejectModalOpen,
  setIsReimbursementRejectModalOpen,
  selectedReimbursementForReject,
  setSelectedReimbursementForReject,
  handleConfirmReimbursementReject,
  isReimbursementRejecting,

  isReimbursementCancelModalOpen,
  setIsReimbursementCancelModalOpen,
  selectedReimbursementForCancel,
  setSelectedReimbursementForCancel,
  handleConfirmReimbursementCancel,
  isReimbursementCancelling,

  isReimbursementDeleteModalOpen,
  setIsReimbursementDeleteModalOpen,
  selectedReimbursementForDelete,
  setSelectedReimbursementForDelete,
  handleConfirmReimbursementDelete,
  isReimbursementDeleting,
}) {
  return (
    <>
      <ReimbursementDetailsModal
        isOpen={isReimbursementDetailsModalOpen}
        onClose={() => {
          setIsReimbursementDetailsModalOpen(false);
          setSelectedReimbursementForDetails(null);
        }}
        reimbursement={selectedReimbursementForDetails}
      />

      <ProcessReimbursementModal
        isOpen={isReimbursementModalOpen}
        onClose={() => {
          setIsReimbursementModalOpen(false);
          setSelectedReimbursement(null);
        }}
        reimbursement={selectedReimbursement}
        onSubmit={handleConfirmReimbursementPay}
      />

      <ReimbursementApproveModal
        isOpen={isReimbursementApproveModalOpen}
        onClose={() => {
          setIsReimbursementApproveModalOpen(false);
          setSelectedReimbursementForApprove(null);
        }}
        reimbursement={selectedReimbursementForApprove}
        onConfirm={handleConfirmReimbursementApprove}
        isLoading={isReimbursementApproving}
      />

      <ReimbursementRejectModal
        isOpen={isReimbursementRejectModalOpen}
        onClose={() => {
          setIsReimbursementRejectModalOpen(false);
          setSelectedReimbursementForReject(null);
        }}
        reimbursement={selectedReimbursementForReject}
        onConfirm={handleConfirmReimbursementReject}
        isLoading={isReimbursementRejecting}
      />

      <ReimbursementCancelModal
        isOpen={isReimbursementCancelModalOpen}
        onClose={() => {
          setIsReimbursementCancelModalOpen(false);
          setSelectedReimbursementForCancel(null);
        }}
        reimbursement={selectedReimbursementForCancel}
        onConfirm={handleConfirmReimbursementCancel}
        isLoading={isReimbursementCancelling}
      />

      <ReimbursementDeleteModal
        isOpen={isReimbursementDeleteModalOpen}
        onClose={() => {
          setIsReimbursementDeleteModalOpen(false);
          setSelectedReimbursementForDelete(null);
        }}
        reimbursement={selectedReimbursementForDelete}
        onConfirm={handleConfirmReimbursementDelete}
        isLoading={isReimbursementDeleting}
      />
    </>
  );
}
