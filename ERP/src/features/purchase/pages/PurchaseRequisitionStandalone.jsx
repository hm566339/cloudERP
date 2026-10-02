import React from 'react';
import PurchaseRequisitionForm from './PurchaseRequisitionForm';

export default function PurchaseRequisitionStandalone() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
      <PurchaseRequisitionForm />
    </div>
  );
}