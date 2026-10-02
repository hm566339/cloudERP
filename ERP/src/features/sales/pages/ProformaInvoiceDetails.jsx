import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetProformaInvoiceByIdQuery, 
  useSendProformaInvoiceMutation,
  useConfirmProformaInvoiceMutation,
  useCancelProformaInvoiceMutation 
} from '../../../api/sales-crm/sales.api';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import ProformaInvoiceFormModal from '../components/ProformaInvoiceFormModal';
import SalesOrderFromPiModal from '../components/SalesOrderFromPiModal';

// Detail Components
import ProformaInvoiceHeader from '../components/proforma-invoice-details/ProformaInvoiceHeader';
import ProformaInvoiceSummary from '../components/proforma-invoice-details/ProformaInvoiceSummary';
import CustomerInformation from '../components/proforma-invoice-details/CustomerInformation';
import SourceQuotationCard from '../components/proforma-invoice-details/SourceQuotationCard';
import ProformaInvoiceItems from '../components/proforma-invoice-details/ProformaInvoiceItems';
import AmountSummary from '../components/proforma-invoice-details/AmountSummary';
import PaymentSummary from '../components/proforma-invoice-details/PaymentSummary';
import AddressSection from '../components/proforma-invoice-details/AddressSection';
import BankDetails from '../components/proforma-invoice-details/BankDetails';
import AuditInformation from '../components/proforma-invoice-details/AuditInformation';

export default function ProformaInvoiceDetails() {
  const { id: piId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const { canEdit, canApprove } = useRBAC();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showSoModal, setShowSoModal] = useState(false);

  const { data: response, isLoading, error, refetch } = useGetProformaInvoiceByIdQuery({ id: piId, companyId }, { skip: !piId });
  const [sendPI, { isLoading: isSending }] = useSendProformaInvoiceMutation();
  const [confirmPI, { isLoading: isConfirming }] = useConfirmProformaInvoiceMutation();
  const [cancelPI, { isLoading: isCanceling }] = useCancelProformaInvoiceMutation();
  
  const isUpdating = isSending || isConfirming || isCanceling;

  const raw = response?.data?.data || response?.data || response;
  const pi = raw && typeof raw === 'object' ? raw : null;

  const handleSend = async () => {
    try {
      await sendPI({ id: piId, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Proforma Invoice marked as SENT' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to email PI' }));
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmPI({ id: piId, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Proforma Invoice marked as CONFIRMED' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to confirm PI' }));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelPI({ id: piId, companyId }).unwrap();
      dispatch(addAlert({ type: 'success', message: 'Proforma Invoice marked as CANCELLED' }));
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.data?.message || 'Failed to cancel PI' }));
    }
  };

  if (isLoading) return <PageLoader message="Loading Proforma Invoice details..." />;

  if (error || !pi) {
    return (
      <ErrorState
        title="Proforma Invoice Not Found"
        message={error?.message || "The requested PI could not be found."}
        onRetry={refetch}
        actionButton={
           <button onClick={() => navigate('/accounts/transactions/proforma-invoices')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors">
              &larr; Back to Proforma Invoices
           </button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <ProformaInvoiceHeader
        pi={pi}
        canEdit={canEdit}
        canApprove={canApprove}
        isUpdating={isUpdating}
        onBack={() => navigate('/accounts/transactions/proforma-invoices')}
        onEdit={() => setShowEditModal(true)}
        onSend={handleSend}
        onConfirm={handleConfirm}
        onCreateSO={() => setShowSoModal(true)}
        onCancel={handleCancel}
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          
          <ProformaInvoiceSummary pi={pi} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <CustomerInformation pi={pi} />
              
              <SourceQuotationCard 
                quotation={pi.quotation} 
                sourceQuotationId={pi.sourceQuotationId} 
                sourceQuotationNumber={pi.sourceQuotationNumber} 
              />
              
              <ProformaInvoiceItems 
                items={pi.items} 
                currency={pi.currency} 
              />

              <AddressSection 
                billingAddress={pi.billingAddressSnapshot} 
                deliveryAddress={pi.deliveryAddressSnapshot} 
              />
              
              <BankDetails 
                bankDetailsSnapshot={pi.bankDetailsSnapshot} 
              />
            </div>
            
            <div className="space-y-6">
              <AmountSummary pi={pi} />
              
              <PaymentSummary 
                paymentSummary={pi.paymentSummary} 
                currency={pi.currency} 
              />
              
              {pi.notes && (
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <h3 className="text-[10.4px] font-bold text-zinc-800 uppercase tracking-wider">Notes</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">{pi.notes}</p>
                  </div>
                </div>
              )}
              
              <AuditInformation 
                createdAt={pi.audit?.created?.on || pi.createdAt} 
                createdBy={pi.audit?.created?.by?.username || pi.createdByName || (pi.createdBy ? String(pi.createdBy).slice(0, 8) : null)} 
                updatedAt={pi.audit?.updated?.on || pi.updatedAt} 
                updatedBy={pi.audit?.updated?.by?.username || pi.updatedByName || (pi.updatedBy ? String(pi.updatedBy).slice(0, 8) : null)} 
              />
            </div>
          </div>
          
        </div>
      </div>

      {showEditModal && (
        <ProformaInvoiceFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          companyId={companyId}
          mode="edit"
          existingPI={pi}
          onSuccess={() => {
            setShowEditModal(false);
            refetch();
          }}
        />
      )}

      {showSoModal && (
        <SalesOrderFromPiModal
          isOpen={showSoModal}
          onClose={() => setShowSoModal(false)}
          companyId={companyId}
          proformaInvoice={pi}
          onSuccess={() => {
            setShowSoModal(false);
            refetch(); // to update remaining qty
          }}
        />
      )}
    </div>
  );
}
