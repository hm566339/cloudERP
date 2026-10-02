import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  useGetPaymentTermsQuery, 
  useCreatePaymentTermMutation, 
  useUpdatePaymentTermMutation, 
  useDeletePaymentTermMutation,
  useGetTermsConditionsQuery, 
  useCreateTermsConditionMutation, 
  useUpdateTermsConditionMutation, 
  useDeleteTermsConditionMutation,
  useGetDeliveryTermsQuery, 
  useCreateDeliveryTermMutation, 
  useUpdateDeliveryTermMutation, 
  useDeleteDeliveryTermMutation,
  useGetWarrantyTermsQuery, 
  useCreateWarrantyTermMutation, 
  useUpdateWarrantyTermMutation, 
  useDeleteWarrantyTermMutation
} from '../../../api/sales-crm/salesSettings.api';
import { useAppSelector } from '../../../app/hooks';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  FileText, 
  CreditCard, 
  ScrollText, 
  Truck, 
  ShieldCheck, 
  Sliders,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { addAlert } from '../../notifications/notificationSlice';
import { useDispatch } from 'react-redux';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmModal from '../../../components/common/ConfirmModal';

const DOCUMENT_TYPES = [
  { value: 'QUOTATION', label: 'Quotation' },
  { value: 'SALES_ORDER', label: 'Sales Order' },
  { value: 'PROFORMA_INVOICE', label: 'Proforma Invoice' },
  { value: 'INVOICE', label: 'Sales Invoice' },
];

export default function SalesSettings() {
  const dispatch = useDispatch();
  const companyId = useAppSelector(s => s.company.selectedCompany?.id);
  const [docType, setDocType] = useState('QUOTATION');

  // Queries
  const { data: ptData, isLoading: isLoadingPt } = useGetPaymentTermsQuery({ documentType: docType, companyId }, { skip: !companyId });
  const { data: tcData, isLoading: isLoadingTc } = useGetTermsConditionsQuery({ documentType: docType, companyId }, { skip: !companyId });
  const { data: dtData, isLoading: isLoadingDt } = useGetDeliveryTermsQuery({ documentType: docType, companyId }, { skip: !companyId });
  const { data: wtData, isLoading: isLoadingWt } = useGetWarrantyTermsQuery({ documentType: docType, companyId }, { skip: !companyId });

  const paymentTerms = Array.isArray(ptData) ? ptData : (ptData?.data || []);
  const termsConditions = Array.isArray(tcData) ? tcData : (tcData?.data || []);
  const deliveryTerms = Array.isArray(dtData) ? dtData : (dtData?.data || []);
  const warrantyTerms = Array.isArray(wtData) ? wtData : (wtData?.data || []);

  // Modals state
  const [ptModal, setPtModal] = useState({ open: false, mode: 'create', data: null });
  const [tcModal, setTcModal] = useState({ open: false, mode: 'create', data: null });
  const [dtModal, setDtModal] = useState({ open: false, mode: 'create', data: null });
  const [wtModal, setWtModal] = useState({ open: false, mode: 'create', data: null });

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: null, // 'pt' | 'tc' | 'dt' | 'wt'
    id: null,
    title: '',
    itemName: '',
    loading: false,
  });

  // Delete mutations
  const [deletePt] = useDeletePaymentTermMutation();
  const [deleteTc] = useDeleteTermsConditionMutation();
  const [deleteDt] = useDeleteDeliveryTermMutation();
  const [deleteWt] = useDeleteWarrantyTermMutation();

  const handleConfirmDelete = async () => {
    const { type, id, itemName } = deleteDialog;
    if (!id || !type) return;

    setDeleteDialog(prev => ({ ...prev, loading: true }));
    try {
      if (type === 'pt') {
        await deletePt({ id, companyId, documentType: docType }).unwrap();
        dispatch(addAlert({ type: 'success', message: `Payment Term "${itemName}" deleted successfully` }));
      } else if (type === 'tc') {
        await deleteTc({ id, companyId, documentType: docType }).unwrap();
        dispatch(addAlert({ type: 'success', message: `Terms & Conditions "${itemName}" deleted successfully` }));
      } else if (type === 'dt') {
        await deleteDt({ id, companyId, documentType: docType }).unwrap();
        dispatch(addAlert({ type: 'success', message: `Delivery Term "${itemName}" deleted successfully` }));
      } else if (type === 'wt') {
        await deleteWt({ id, companyId, documentType: docType }).unwrap();
        dispatch(addAlert({ type: 'success', message: `Warranty Term "${itemName}" deleted successfully` }));
      }
      setDeleteDialog({ open: false, type: null, id: null, title: '', itemName: '', loading: false });
    } catch (e) {
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const activeDocLabel = DOCUMENT_TYPES.find(d => d.value === docType)?.label || 'Quotation';

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-zinc-50/50">
      {/* ── Page Header with Document Type Switcher ── */}
      <PageHeader
        title="Sales Settings"
        description="Configure default payment terms, terms & conditions, delivery terms, and warranty terms for sales documents."
        icon={<Sliders size={20} className="text-zinc-800" />}
        border={true}
        className="shrink-0 bg-white"
      >
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-lg border border-zinc-200/70 overflow-x-auto max-w-full">
          {DOCUMENT_TYPES.map(dt => {
            const isSelected = docType === dt.value;
            return (
              <button
                key={dt.value}
                type="button"
                onClick={() => setDocType(dt.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                }`}
              >
                {dt.label}
              </button>
            );
          })}
        </div>
      </PageHeader>

      {/* ── 4-Panel Grid Content ── */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-[640px]">

          {/* 1. Payment Terms Section */}
          <SectionCard
            title="Payment Terms"
            subtitle={`Default payment terms for ${activeDocLabel.toLowerCase()}s`}
            icon={<CreditCard size={17} className="text-zinc-700" />}
            count={paymentTerms.length}
            isLoading={isLoadingPt}
            onAdd={() => setPtModal({ open: true, mode: 'create', data: null })}
            emptyMessage={`No Payment Terms configured for ${activeDocLabel}.`}
          >
            {paymentTerms.map((pt) => (
              <div 
                key={pt.id} 
                className="group border border-zinc-200/80 rounded-xl p-3.5 hover:border-zinc-300 hover:shadow-2xs transition-all bg-white relative shrink-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-zinc-900 text-xs truncate">{pt.name}</h4>
                      {pt.isDefault && (
                        <span className="shrink-0 px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-semibold rounded-full">
                          Default
                        </span>
                      )}
                      {!pt.isActive && (
                        <span className="shrink-0 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {pt.description && (
                      <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap leading-relaxed line-clamp-2">
                        {pt.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-white shadow-2xs rounded-lg border border-zinc-200 p-0.5">
                    <button 
                      onClick={() => setPtModal({ open: true, mode: 'edit', data: pt })} 
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => setDeleteDialog({
                        open: true,
                        type: 'pt',
                        id: pt.id,
                        title: 'Delete Payment Term',
                        itemName: pt.name,
                        loading: false
                      })} 
                      className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>

          {/* 2. Terms & Conditions Section */}
          <SectionCard
            title="Terms & Conditions"
            subtitle={`Default legal terms & conditions for ${activeDocLabel.toLowerCase()}s`}
            icon={<ScrollText size={17} className="text-zinc-700" />}
            count={termsConditions.length}
            isLoading={isLoadingTc}
            onAdd={() => setTcModal({ open: true, mode: 'create', data: null })}
            emptyMessage={`No Terms & Conditions configured for ${activeDocLabel}.`}
          >
            {termsConditions.map((tc) => (
              <TermsConditionItem 
                key={tc.id} 
                tc={tc} 
                onEdit={(data) => setTcModal({ open: true, mode: 'edit', data })} 
                onDelete={(id, name) => setDeleteDialog({
                  open: true,
                  type: 'tc',
                  id,
                  title: 'Delete Terms & Conditions',
                  itemName: name,
                  loading: false
                })} 
              />
            ))}
          </SectionCard>

          {/* 3. Delivery Terms Section */}
          <SectionCard
            title="Delivery Terms"
            subtitle={`Default shipping and logistics terms for ${activeDocLabel.toLowerCase()}s`}
            icon={<Truck size={17} className="text-zinc-700" />}
            count={deliveryTerms.length}
            isLoading={isLoadingDt}
            onAdd={() => setDtModal({ open: true, mode: 'create', data: null })}
            emptyMessage={`No Delivery Terms configured for ${activeDocLabel}.`}
          >
            {deliveryTerms.map((dt) => (
              <div 
                key={dt.id} 
                className="group border border-zinc-200/80 rounded-xl p-3.5 hover:border-zinc-300 hover:shadow-2xs transition-all bg-white relative shrink-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-zinc-900 text-xs truncate">{dt.name}</h4>
                      {dt.isDefault && (
                        <span className="shrink-0 px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-semibold rounded-full">
                          Default
                        </span>
                      )}
                      {!dt.isActive && (
                        <span className="shrink-0 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {dt.description && (
                      <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap leading-relaxed line-clamp-2">
                        {dt.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-white shadow-2xs rounded-lg border border-zinc-200 p-0.5">
                    <button 
                      onClick={() => setDtModal({ open: true, mode: 'edit', data: dt })} 
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => setDeleteDialog({
                        open: true,
                        type: 'dt',
                        id: dt.id,
                        title: 'Delete Delivery Term',
                        itemName: dt.name,
                        loading: false
                      })} 
                      className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>

          {/* 4. Warranty Terms Section */}
          <SectionCard
            title="Warranty Terms"
            subtitle={`Default warranty coverage policies for ${activeDocLabel.toLowerCase()}s`}
            icon={<ShieldCheck size={17} className="text-zinc-700" />}
            count={warrantyTerms.length}
            isLoading={isLoadingWt}
            onAdd={() => setWtModal({ open: true, mode: 'create', data: null })}
            emptyMessage={`No Warranty Terms configured for ${activeDocLabel}.`}
          >
            {warrantyTerms.map((wt) => (
              <div 
                key={wt.id} 
                className="group border border-zinc-200/80 rounded-xl p-3.5 hover:border-zinc-300 hover:shadow-2xs transition-all bg-white relative shrink-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-zinc-900 text-xs truncate">{wt.name}</h4>
                      {wt.isDefault && (
                        <span className="shrink-0 px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-semibold rounded-full">
                          Default
                        </span>
                      )}
                      {!wt.isActive && (
                        <span className="shrink-0 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {wt.description && (
                      <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap leading-relaxed line-clamp-2">
                        {wt.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-white shadow-2xs rounded-lg border border-zinc-200 p-0.5">
                    <button 
                      onClick={() => setWtModal({ open: true, mode: 'edit', data: wt })} 
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => setDeleteDialog({
                        open: true,
                        type: 'wt',
                        id: wt.id,
                        title: 'Delete Warranty Term',
                        itemName: wt.name,
                        loading: false
                      })} 
                      className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>

        </div>
      </div>

      {/* ── Modals ── */}
      {ptModal.open && (
        <GenericTermModal
          title="Payment Term"
          mode={ptModal.mode}
          initialData={ptModal.data}
          documentType={docType}
          companyId={companyId}
          useCreateMutation={useCreatePaymentTermMutation}
          useUpdateMutation={useUpdatePaymentTermMutation}
          namePlaceholder="e.g. Net 30"
          descPlaceholder="Payment due within 30 calendar days from invoice date..."
          onClose={() => setPtModal({ open: false, mode: 'create', data: null })}
        />
      )}

      {tcModal.open && (
        <TermsConditionModal
          mode={tcModal.mode}
          initialData={tcModal.data}
          documentType={docType}
          companyId={companyId}
          onClose={() => setTcModal({ open: false, mode: 'create', data: null })}
        />
      )}

      {dtModal.open && (
        <GenericTermModal
          title="Delivery Term"
          mode={dtModal.mode}
          initialData={dtModal.data}
          documentType={docType}
          companyId={companyId}
          useCreateMutation={useCreateDeliveryTermMutation}
          useUpdateMutation={useUpdateDeliveryTermMutation}
          namePlaceholder="e.g. Ex-Works / FOB"
          descPlaceholder="Goods made available at the seller's location..."
          onClose={() => setDtModal({ open: false, mode: 'create', data: null })}
        />
      )}

      {wtModal.open && (
        <GenericTermModal
          title="Warranty Term"
          mode={wtModal.mode}
          initialData={wtModal.data}
          documentType={docType}
          companyId={companyId}
          useCreateMutation={useCreateWarrantyTermMutation}
          useUpdateMutation={useUpdateWarrantyTermMutation}
          namePlaceholder="e.g. 1 Year Standard Manufacturer"
          descPlaceholder="Covers all manufacturing defects and parts for 12 months..."
          onClose={() => setWtModal({ open: false, mode: 'create', data: null })}
        />
      )}

      {/* ── Reusable Confirm Delete Modal ── */}
      <ConfirmModal
        open={deleteDialog.open}
        title={deleteDialog.title}
        message={`Are you sure you want to delete "${deleteDialog.itemName}"?`}
        details="This setting will no longer appear as a preset option in future sales documents."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        loading={deleteDialog.loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog({ open: false, type: null, id: null, title: '', itemName: '', loading: false })}
      />
    </div>
  );
}

/**
 * Reusable Section Card Container for Sales Settings panels
 */
function SectionCard({ title, subtitle, icon, count, isLoading, onAdd, emptyMessage, children }) {
  return (
    <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-2xs flex flex-col h-full min-h-[300px] overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0 border border-zinc-200/70">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">{title}</h3>
              {count > 0 && (
                <span className="px-1.5 py-0.2 bg-zinc-200/80 text-zinc-700 text-[10px] font-semibold rounded-full">
                  {count}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button 
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs active:scale-95 shrink-0"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Add</span>
        </button>
      </div>

      {/* Card Content List */}
      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-2.5 bg-zinc-50/20">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-2 py-8">
            <Loader2 size={20} className="animate-spin text-zinc-400" />
            <span className="text-xs">Loading items...</span>
          </div>
        ) : count === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs p-6 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-white/50 my-auto">
            <FileText size={28} className="mb-2 text-zinc-300" />
            <p className="text-zinc-500 font-medium">{emptyMessage}</p>
            <p className="text-[11px] text-zinc-400 mt-1">Click "Add" above to create your first preset.</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/**
 * Expandable Terms & Conditions Item
 */
function TermsConditionItem({ tc, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="group border border-zinc-200/80 rounded-xl p-3.5 hover:border-zinc-300 hover:shadow-2xs transition-all bg-white relative shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-zinc-900 text-xs truncate">{tc.title}</h4>
            {tc.isDefault && (
              <span className="shrink-0 px-2 py-0.5 bg-zinc-900 text-white text-[10px] font-semibold rounded-full">
                Default
              </span>
            )}
            {!tc.isActive && (
              <span className="shrink-0 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium rounded-full">
                Inactive
              </span>
            )}
          </div>
          <div className={`text-xs text-zinc-600 mt-2 whitespace-pre-wrap leading-relaxed bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 ${expanded ? '' : 'line-clamp-3'}`}>
            {tc.content}
          </div>
          {tc.content && tc.content.length > 140 && (
            <button 
              type="button"
              onClick={() => setExpanded(!expanded)} 
              className="mt-1.5 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 focus:outline-none cursor-pointer"
            >
              {expanded ? (
                <>Show less <ChevronUp size={12} /></>
              ) : (
                <>Show full terms <ChevronDown size={12} /></>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-white shadow-2xs rounded-lg border border-zinc-200 p-0.5">
          <button 
            onClick={() => onEdit(tc)} 
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
          <button 
            onClick={() => onDelete(tc.id, tc.title)} 
            className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic Modal for Payment Terms, Delivery Terms, and Warranty Terms
 */
function GenericTermModal({
  title,
  mode,
  initialData,
  documentType,
  companyId,
  useCreateMutation,
  useUpdateMutation,
  namePlaceholder,
  descPlaceholder,
  onClose,
}) {
  const dispatch = useDispatch();
  const [createItem, { isLoading: isCreating }] = useCreateMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateMutation();

  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    isDefault: false,
    isActive: true,
  });

  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, documentType, companyId };
      if (mode === 'create') {
        await createItem(payload).unwrap();
        dispatch(addAlert({ type: 'success', message: `${title} created successfully` }));
      } else {
        await updateItem({ id: initialData.id, ...payload }).unwrap();
        dispatch(addAlert({ type: 'success', message: `${title} updated successfully` }));
      }
      onClose();
    } catch (e) {
      // Handled by baseApi
    }
  };

  const modal = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 animate-scale-in">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-sm sm:text-base font-bold text-zinc-900">
            {mode === 'create' ? `Add ${title}` : `Edit ${title}`}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Name <span className="text-rose-500">*</span>
            </label>
            <input 
              required
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-9 px-3 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
              placeholder={namePlaceholder}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea 
              required
              rows={3}
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all resize-y"
              placeholder={descPlaceholder}
            />
          </div>
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={formData.isDefault}
                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 border-zinc-300 cursor-pointer"
              />
              Set as Default
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 border-zinc-300 cursor-pointer"
              />
              Active
            </label>
          </div>
          <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="h-8 px-4 text-xs font-medium text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="h-8 px-4 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' && document.body ? createPortal(modal, document.body) : modal;
}

/**
 * Dedicated Terms & Conditions Modal
 */
function TermsConditionModal({ mode, initialData, documentType, companyId, onClose }) {
  const dispatch = useDispatch();
  const [createTc, { isLoading: isCreating }] = useCreateTermsConditionMutation();
  const [updateTc, { isLoading: isUpdating }] = useUpdateTermsConditionMutation();

  const [formData, setFormData] = useState(initialData || {
    title: '',
    content: '',
    isDefault: false,
    isActive: true,
  });

  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, documentType, companyId };
      if (mode === 'create') {
        await createTc(payload).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Terms & Conditions created successfully' }));
      } else {
        await updateTc({ id: initialData.id, ...payload }).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Terms & Conditions updated successfully' }));
      }
      onClose();
    } catch (e) {
      // Handled by baseApi
    }
  };

  const modal = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-zinc-200 animate-scale-in">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-sm sm:text-base font-bold text-zinc-900">
            {mode === 'create' ? 'Add Terms & Conditions' : 'Edit Terms & Conditions'}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input 
              required
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-9 px-3 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
              placeholder="e.g. Standard Quotation Terms & Conditions"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Content <span className="text-rose-500">*</span>
            </label>
            <textarea 
              required
              rows={8}
              value={formData.content} 
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 font-mono transition-all resize-y"
              placeholder="1. Payment must be made within the agreed timeline.&#10;2. Delivery is subject to inventory availability.&#10;3. Goods once sold are not returnable without prior approval."
            />
          </div>
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={formData.isDefault}
                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 border-zinc-300 cursor-pointer"
              />
              Set as Default
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 border-zinc-300 cursor-pointer"
              />
              Active
            </label>
          </div>
          <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="h-8 px-4 text-xs font-medium text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="h-8 px-4 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Terms</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' && document.body ? createPortal(modal, document.body) : modal;
}

