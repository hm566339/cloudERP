import React from 'react';
import SupplierQuotationForm from './SupplierQuotationForm';

export default function SupplierQuotationStandalone() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden w-full h-screen">
      <SupplierQuotationForm />
    </div>
  );
}
