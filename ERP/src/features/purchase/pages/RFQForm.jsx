import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Trash2, Send, Save, AlertCircle, RefreshCw, X, Search, FileText } from 'lucide-react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { rfqsApi, purchaseRequisitionsApi, vendorsApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import ErrorState from '../../../components/common/ErrorState';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import { getRfqBasePath } from '../../../components/common/PurchaseNavigation';
import { useRoutePath } from '../../../hooks/useRoutePath';
import CustomSelect from '../../../components/common/CustomSelect';

const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function RFQForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preSelectedPR = searchParams.get('purchaseRequisitionId') || '';
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const rfqBasePath = getRfqBasePath(location.pathname);

  const isEditing = !!id;

  const [formData, setFormData] = useState({
    purchaseRequisitionId: preSelectedPR,
    issueDate: getTodayLocalDate(),
    quotationDeadline: '',
    expectedDeliveryDate: '',
    terms: '',
    notes: '',
  });

  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingType, setSubmittingType] = useState(null);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setIsVendorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { data: existing, isLoading: isLoadingExisting } = useApiQuery(
    rfqsApi.getById,
    id,
    { enabled: !!id }
  );

  const rfqRaw = existing?.data?.data || existing?.data || existing;
  const rfq = (rfqRaw && typeof rfqRaw === 'object' && 'rfqNumber' in rfqRaw) ? rfqRaw : (rfqRaw?.data || rfqRaw);

  const { data: vendorsResp, isLoading: vendorsLoading } = useApiQuery(
    vendorsApi.getActiveVendors,
    undefined,
    { enabled: true }
  );

  const vendorList = useMemo(() => {
    const list = Array.isArray(vendorsResp) ? vendorsResp : (vendorsResp?.data || vendorsResp?.content || []);
    return Array.isArray(list) ? list : [];
  }, [vendorsResp]);

  const prQuery = useApiQuery(
    purchaseRequisitionsApi.getById,
    formData.purchaseRequisitionId,
    { enabled: !!formData.purchaseRequisitionId }
  );

  const prRaw = prQuery.data?.data?.data || prQuery.data?.data || prQuery.data;
  const pr = (prRaw && typeof prRaw === 'object' && ('requisitionNumber' in prRaw || 'items' in prRaw || 'status' in prRaw))
    ? prRaw
    : (prRaw?.data || prRaw);

  const { data: approvedPRsResp, isLoading: prsLoading } = useApiQuery(
    purchaseRequisitionsApi.getList,
    [{ status: 'APPROVED', companyId }, { page: 0, size: 100 }],
    { enabled: !isEditing && !formData.purchaseRequisitionId }
  );

  const approvedPRs = useMemo(() => {
    const list = Array.isArray(approvedPRsResp) ? approvedPRsResp : (approvedPRsResp?.data?.content || approvedPRsResp?.content || []);
    const arr = Array.isArray(list) ? list : [];
    return arr.filter(pr => pr.status === 'APPROVED');
  }, [approvedPRsResp]);

  useEffect(() => {
    if (isEditing && rfq) {
      setFormData(prev => ({
        ...prev,
        purchaseRequisitionId: rfq.purchaseRequisitionId || prev.purchaseRequisitionId,
        issueDate: rfq.issueDate ? String(rfq.issueDate).slice(0, 10) : '',
        quotationDeadline: rfq.quotationDeadline ? String(rfq.quotationDeadline).slice(0, 10) : '',
        expectedDeliveryDate: rfq.expectedDeliveryDate ? String(rfq.expectedDeliveryDate).slice(0, 10) : '',
        terms: rfq.terms || '',
        notes: rfq.notes || '',
      }));
      if (rfq.vendors && Array.isArray(rfq.vendors)) {
        setSelectedVendorIds(rfq.vendors.map(v => v.vendorId).filter(Boolean));
      }
      if (rfq.items && Array.isArray(rfq.items)) {
        setItems(rfq.items.map(item => ({
          itemId: item.itemId || '',
          itemName: item.itemName || '',
          description: item.description || '',
          itemType: item.itemType || 'PRODUCT',
          quantity: item.quantity ?? '',
          unit: item.unit || '',
          requiredDate: item.requiredDate ? String(item.requiredDate).slice(0, 10) : '',
          specifications: item.specifications || '',
        })));
      }
    }
  }, [isEditing, rfq]);

  useEffect(() => {
    if (isEditing) return;
    if (!pr || !pr.items || !Array.isArray(pr.items) || pr.items.length === 0) return;
    setItems(pr.items.map(item => ({
      itemId: item.itemId || item.id || '',
      itemName: item.itemName || '',
      description: item.description || '',
      itemType: item.itemType || 'PRODUCT',
      quantity: item.quantity ?? item.requestedQuantity ?? '',
      unit: item.unit || '',
      requiredDate: (item.requiredDate || pr.requiredDate || '').slice ? String(item.requiredDate || pr.requiredDate || '').slice(0, 10) : (item.requiredDate || pr.requiredDate || ''),
      specifications: item.specifications || item.remarks || '',
    })));
  }, [pr]);

  const createMutation = useApiMutation(rfqsApi.create);
  const updateMutation = useApiMutation(rfqsApi.update);
  const sendMutation = useApiMutation(rfqsApi.send);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleSelectPR = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, purchaseRequisitionId: value }));
    if (!value) {
      setItems([]);
    }
    if (errors.purchaseRequisitionId) setErrors(prev => { const next = { ...prev }; delete next.purchaseRequisitionId; return next; });
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`item_${index}_${field}`];
        return next;
      });
    }
  };

  const toggleVendor = (vendorId) => {
    setSelectedVendorIds(prev => {
      const isSelected = prev.includes(vendorId);
      const next = isSelected ? prev.filter(id => id !== vendorId) : [...prev, vendorId];
      if (errors.vendors && next.length > 0) {
        setErrors(errs => { const newErrs = { ...errs }; delete newErrs.vendors; return newErrs; });
      }
      return next;
    });
  };

  const removeVendor = (vendorId) => {
    setSelectedVendorIds(prev => prev.filter(id => id !== vendorId));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.purchaseRequisitionId) {
      newErrors.purchaseRequisitionId = 'Purchase Requisition is required';
    } else if (pr && pr.status && pr.status !== 'APPROVED') {
      newErrors.purchaseRequisitionId = 'Only approved purchase requisitions can be used to create an RFQ.';
    }

    if (!formData.issueDate) newErrors.issueDate = 'Issue date is required';
    if (!formData.quotationDeadline) newErrors.quotationDeadline = 'Quotation deadline is required';
    if (formData.issueDate && formData.quotationDeadline && formData.quotationDeadline < formData.issueDate) {
      newErrors.quotationDeadline = 'Quotation deadline cannot be earlier than issue date';
    }
    if (formData.issueDate && formData.expectedDeliveryDate && formData.expectedDeliveryDate < formData.issueDate) {
      newErrors.expectedDeliveryDate = 'Expected delivery cannot be earlier than issue date';
    }
    if (items.length === 0) newErrors.items = 'At least one item is required';
    else {
      items.forEach((item, idx) => {
        if (!item.itemName) newErrors[`item_${idx}_itemName`] = 'Item name is required';
        if (item.quantity === '' || item.quantity === null || item.quantity === undefined || Number(item.quantity) <= 0) {
          newErrors[`item_${idx}_quantity`] = 'Quantity must be > 0';
        }
      });
    }
    if (selectedVendorIds.length === 0) newErrors.vendors = 'At least one vendor is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => {
    const processedItems = items
      .filter(item => item.itemName && item.itemName.trim())
      .map(item => ({
        itemId: item.itemId || undefined,
        itemName: item.itemName,
        description: item.description || undefined,
        itemType: item.itemType || 'PRODUCT',
        quantity: item.quantity !== '' && item.quantity !== null && item.quantity !== undefined ? Number(item.quantity) : undefined,
        unit: item.unit || undefined,
        requiredDate: item.requiredDate || undefined,
        specifications: item.specifications || undefined,
      }));

    return {
      data: {
        purchaseRequisitionId: formData.purchaseRequisitionId,
        issueDate: formData.issueDate || undefined,
        quotationDeadline: formData.quotationDeadline || undefined,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        terms: formData.terms || undefined,
        notes: formData.notes || undefined,
        items: processedItems,
        vendorIds: selectedVendorIds,
      }
    };
  };

  const extractId = (result) => result?.id || result?.data?.id;

  const handleSaveDraft = async () => {
    if (isSubmitting) return;
    if (!validate()) {
      dispatch(addAlert({ type: 'error', message: 'Please fix validation errors before saving.' }));
      return;
    }
    setIsSubmitting(true);
    setSubmittingType('draft');
    try {
      const payload = buildPayload();
      if (isEditing) {
        await updateMutation.mutateAsync([id, payload, companyId]);
        dispatch(addAlert({ type: 'success', message: 'RFQ updated successfully' }));
        if (id) {
          navigate(buildPath(`${rfqBasePath}/${id}`));
        } else {
          navigate(buildPath(rfqBasePath));
        }
      } else {
        await createMutation.mutateAsync([payload, companyId]);
        dispatch(addAlert({ type: 'success', message: 'RFQ saved as draft successfully.' }));
        // Stay on the same New RFQ form - do NOT redirect or close
      }
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to save RFQ' }));
    } finally {
      setIsSubmitting(false);
      setSubmittingType(null);
    }
  };

  const handleSaveAndSend = async () => {
    if (isSubmitting) return;
    if (!validate()) {
      dispatch(addAlert({ type: 'error', message: 'Please fix validation errors before submitting.' }));
      return;
    }
    setIsSubmitting(true);
    setSubmittingType('send');
    try {
      const payload = buildPayload();
      if (isEditing) {
        await updateMutation.mutateAsync([id, payload, companyId]);
        await sendMutation.mutateAsync([id, companyId]);
        dispatch(addAlert({ type: 'success', message: 'RFQ created and sent successfully.' }));
        if (id) {
          navigate(buildPath(`${rfqBasePath}/${id}`));
        } else {
          navigate(buildPath(rfqBasePath));
        }
      } else {
        const result = await createMutation.mutateAsync([payload, companyId]);
        const rfqId = extractId(result);
        if (rfqId) {
          await sendMutation.mutateAsync([rfqId, companyId]);
        }
        dispatch(addAlert({ type: 'success', message: 'RFQ created and sent successfully.' }));
        // Stay on the same New RFQ form - do NOT redirect or close
      }
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to send RFQ' }));
    } finally {
      setIsSubmitting(false);
      setSubmittingType(null);
    }
  };

  const handleCancel = () => {
    navigate(buildPath(rfqBasePath));
  };

  if (isEditing && isLoadingExisting) return <PageLoader message="Loading RFQ..." />;
  if (isEditing && !existing) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
        <ErrorState
          title="RFQ Not Found"
          message="The requested RFQ could not be found."
          onRetry={() => navigate(buildPath(rfqBasePath))}
        />
      </div>
    );
  }

  const vendorNameMap = {};
  vendorList.forEach(v => { vendorNameMap[v.id] = v.vendorName || v.name || v.id; });

  const filteredVendors = vendorList.filter(v =>
    (v.vendorName || v.name || '').toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
    (v.vendorCode || v.code || '').toLowerCase().includes(vendorSearchTerm.toLowerCase())
  );

  /* ── Shared style tokens (mirror PurchaseRequisitionForm) ── */
  const sidebarCard = 'flex-none border border-zinc-200 dark:border-border-dark rounded-lg p-3 bg-white dark:bg-card-dark shadow-2xs space-y-2';
  const cardHead = 'flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-[#2A2F3D]';
  const cardTitle = 'text-[9.6px] font-bold text-zinc-800 uppercase tracking-wider';
  const label = 'text-[9.6px] font-semibold text-zinc-700 block mb-1';
  const field = (hasErr = false) => `input-field w-full h-8 text-[9.6px] text-zinc-700 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md px-2 focus:ring-1 focus:ring-zinc-900/10 focus:border-zinc-400 outline-none transition-all ${hasErr ? 'border-rose-300' : ''}`;
  const tableField = (hasErr = false) => `input-field w-full h-8 text-[9.6px] text-zinc-700 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md px-1.5 focus:ring-1 focus:ring-zinc-900/10 focus:border-zinc-400 outline-none transition-all ${hasErr ? 'border-rose-300' : ''}`;
  const errText = 'text-[8.8px] text-rose-600 mt-0.5 font-medium';
  const btnSecondary = 'px-4 py-2 text-xs font-semibold text-zinc-600 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md hover:bg-zinc-50 shadow-xs transition-colors flex items-center gap-2';
  const btnPrimary = 'px-4 py-2 text-xs font-bold text-white bg-primary rounded-md hover:bg-primary/90 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2';
  const colTemplate = 'grid-cols-[4%_16%_16%_12%_12%_10%_12%_18%]';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-50 animate-fade-in w-full h-full overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap xl:flex-nowrap items-center justify-between p-3 bg-white dark:bg-card-dark border-b border-zinc-200 dark:border-border-dark shadow-sm flex-none">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 flex-none text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-[15px] font-bold text-zinc-900 tracking-tight truncate">
              {isEditing ? 'Edit RFQ' : 'New RFQ'}
            </h2>
            <div className="text-[10px] text-zinc-500 truncate mt-0.5">
              {isEditing ? 'Update request for quotation details' : 'Create a new request for quotation based on an approved purchase requisition'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-none">
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 flex-none text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN WORKSPACE: TWO COLUMN LAYOUT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-border-dark bg-white dark:bg-page-dark">

        {/* ── LEFT COLUMN (FORM SIDEBAR) ── */}
        <div className="w-full lg:w-[260px] flex-none p-2.5 bg-zinc-50/40 overflow-y-auto overflow-x-hidden flex flex-col gap-2.5">

          {/* 1. RFQ INFORMATION */}
          <div className={sidebarCard}>
            <div className={cardHead}>
              <h3 className={cardTitle}>RFQ Information</h3>
            </div>
            <div className="space-y-2.5">
              <div>
                <label className={label}>Purchase Requisition *</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={pr?.requisitionNumber || formData.purchaseRequisitionId}
                    disabled
                    className={`${field()} bg-zinc-50 text-zinc-500 cursor-not-allowed`}
                  />
                ) : (
                  <CustomSelect
                    value={formData.purchaseRequisitionId}
                    onChange={handleSelectPR}
                    options={[
                      ...approvedPRs.map(p => ({
                        value: p.id,
                        label: `${p.requisitionNumber || p.id} ${p.purpose ? `- ${p.purpose}` : ''}`
                      })),
                      ...(formData.purchaseRequisitionId && !approvedPRs.find(p => p.id === formData.purchaseRequisitionId)
                        ? [{
                          value: formData.purchaseRequisitionId,
                          label: pr?.requisitionNumber || formData.purchaseRequisitionId
                        }]
                        : [])
                    ]}
                    placeholder="Select an approved purchase requisition"
                    error={errors.purchaseRequisitionId}
                  />
                )}
                {errors.purchaseRequisitionId && <p className={errText}>{errors.purchaseRequisitionId}</p>}
                {prsLoading && <p className="text-[8.8px] text-zinc-400 mt-0.5">Loading requisitions...</p>}
              </div>

              <div>
                <label className={label}>Issue Date *</label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                  className={field(errors.issueDate)}
                />
                {errors.issueDate && <p className={errText}>{errors.issueDate}</p>}
              </div>

              <div>
                <label className={label}>Quotation Deadline *</label>
                <input
                  type="date"
                  value={formData.quotationDeadline}
                  onChange={(e) => handleFieldChange('quotationDeadline', e.target.value)}
                  className={field(errors.quotationDeadline)}
                />
                {errors.quotationDeadline && <p className={errText}>{errors.quotationDeadline}</p>}
              </div>

              <div>
                <label className={label}>Expected Delivery Date</label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => handleFieldChange('expectedDeliveryDate', e.target.value)}
                  className={field(errors.expectedDeliveryDate)}
                />
                {errors.expectedDeliveryDate && <p className={errText}>{errors.expectedDeliveryDate}</p>}
              </div>
            </div>
          </div>

          {/* 2. SUPPLIERS */}
          <div className={sidebarCard}>
            <div className={cardHead}>
              <h3 className={cardTitle}>Suppliers</h3>
              <span className="text-[9.6px] font-semibold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-md">
                {selectedVendorIds.length} selected
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative" ref={vendorDropdownRef}>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={vendorSearchTerm}
                    onChange={(e) => {
                      setVendorSearchTerm(e.target.value);
                      setIsVendorDropdownOpen(true);
                    }}
                    onFocus={() => setIsVendorDropdownOpen(true)}
                    placeholder="Add a vendor..."
                    className={`w-full h-8 pl-8 pr-2 text-[9.6px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-surface-dark border dark:border-border-dark rounded-md outline-none transition-all ${errors.vendors ? 'border-rose-300' : 'border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900/10'}`}
                  />
                </div>

                {isVendorDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md shadow-lg max-h-48 overflow-y-auto py-1">
                    {vendorsLoading ? (
                      <div className="px-3 py-2 text-[10px] text-zinc-500 text-center">Loading vendors...</div>
                    ) : filteredVendors.length === 0 ? (
                      <div className="px-3 py-2 text-[10px] text-zinc-500 text-center">No vendors found.</div>
                    ) : (
                      filteredVendors.map(vendor => {
                        const isSelected = selectedVendorIds.includes(vendor.id);
                        return (
                          <div
                            key={vendor.id}
                            onClick={() => toggleVendor(vendor.id)}
                            className={`px-3 py-1.5 cursor-pointer flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-3.5 h-3.5 rounded border-zinc-300 text-primary focus:ring-primary"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-medium text-zinc-800 truncate">{vendor.vendorName || vendor.name}</span>
                              {(vendor.vendorCode || vendor.code) && (
                                <span className="text-[9px] text-zinc-500 truncate">{vendor.vendorCode || vendor.code}</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              {errors.vendors && <p className={errText}>{errors.vendors}</p>}

              <div className="flex flex-col gap-1.5 mt-2">
                {selectedVendorIds.length === 0 ? (
                  <div className="text-[9.6px] text-zinc-500 text-center py-3 bg-zinc-50 rounded-md border border-dashed border-zinc-200">
                    No vendors selected yet.
                  </div>
                ) : (
                  selectedVendorIds.map(vid => {
                    const vendor = vendorList.find(v => v.id === vid) || { vendorName: vendorNameMap[vid] || vid };
                    return (
                      <div key={vid} className="flex items-center justify-between gap-2 p-1.5 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-md shadow-2xs group">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9.6px] font-medium text-zinc-800 truncate">{vendor.vendorName || vendor.name}</span>
                          {(vendor.vendorCode || vendor.code) && (
                            <span className="text-[8.8px] text-zinc-500 truncate">{vendor.vendorCode || vendor.code}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVendor(vid)}
                          className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors flex-none"
                          title="Remove vendor"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 3. TERMS & NOTES */}
          <div className={sidebarCard}>
            <div className={cardHead}>
              <h3 className={cardTitle}>Terms & Notes</h3>
            </div>
            <div className="space-y-2">
              <div>
                <label className={label}>Terms</label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => handleFieldChange('terms', e.target.value)}
                  placeholder="Payment and delivery terms"
                  rows={2}
                  className={`${field()} py-1.5 resize-none h-auto min-h-[50px]`}
                />
              </div>
              <div>
                <label className={label}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Additional notes"
                  rows={3}
                  className={`${field()} py-1.5 resize-none h-auto min-h-[64px]`}
                />
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: LARGE REQUESTED ITEMS AREA ── */}
        <div className="w-full flex-1 flex flex-col overflow-y-auto min-h-0 bg-white dark:bg-page-dark">
          {/* Requested Items Section Header */}
          <div className="px-4 py-3 bg-zinc-50/80 border-b border-zinc-200 flex items-center justify-between flex-none sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider">Requested Items</h3>
              {items.length > 0 && (
                <span className="text-[9.6px] font-semibold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-surface-dark px-2 py-0.5 rounded-full border border-zinc-200 dark:border-border-dark shadow-2xs">
                  {items.length} {items.length === 1 ? 'item' : 'items'} loaded
                </span>
              )}
            </div>
          </div>

          {errors.items && (
            <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-medium">
              <AlertCircle size={14} />
              {errors.items}
            </div>
          )}

          {/* Items Table */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
              <div className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-full flex items-center justify-center mb-3 shadow-2xs">
                <FileText size={20} className="text-zinc-400" />
              </div>
              <p className="text-[13px] font-semibold text-zinc-700 mb-1">No items loaded</p>
              <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed">
                Select an approved purchase requisition from the left sidebar to automatically load items for this RFQ.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <div className="min-w-[1040px]">
                {/* Table Header */}
                <div className="w-full text-left bg-zinc-100/80 text-zinc-600 border-b border-zinc-200 flex-none">
                  <div className={`grid ${colTemplate} w-full min-w-0`}>
                    <div className="p-2 font-semibold truncate text-[10px] uppercase text-center tracking-wider">#</div>
                    <div className="p-2 font-semibold truncate text-[10px] uppercase tracking-wider">Item Name *</div>
                    <div className="p-2 font-semibold truncate text-[10px] uppercase tracking-wider">Description</div>
                    <div className="p-2 font-semibold truncate text-[10px] uppercase tracking-wider text-center">Item Type</div>
                    <div className="p-2 font-semibold truncate text-[10px] uppercase tracking-wider text-center">Quantity *</div>
                    <div className="p-2 font-semibold truncate text-[10px] uppercase tracking-wider text-center">Unit</div>
                    <div className="p-2 font-semibold truncate text-[10px] uppercase tracking-wider">Required Date</div>
                    <div className="p-2 font-semibold truncate text-[10px] uppercase tracking-wider">Specifications</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="w-full bg-white dark:bg-card-dark divide-y divide-zinc-100 dark:divide-border-dark/60 flex-1 overflow-y-auto pb-4">
                  {items.map((item, index) => (
                    <div key={index} className={`grid ${colTemplate} w-full min-w-0 hover:bg-zinc-50/50 transition-colors`}>
                      <div className="p-1.5 flex items-center justify-center text-[10.4px] text-zinc-400 font-medium">
                        {index + 1}
                      </div>
                      <div className="p-1.5 flex items-center">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          placeholder="Item Name"
                          className={tableField(errors[`item_${index}_itemName`])}
                        />
                      </div>
                      <div className="p-1.5 flex items-center">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description"
                          className={tableField()}
                        />
                      </div>
                      <div className="p-1.5 flex items-center">
                        <CustomSelect
                          value={item.itemType}
                          onChange={(e) => handleItemChange(index, 'itemType', e.target.value)}
                          options={[
                            { value: 'PRODUCT', label: 'Product' },
                            { value: 'SERVICE', label: 'Service' }
                          ]}
                          className={tableField()}
                          searchable={false}
                        />
                      </div>
                      <div className="p-1.5 flex items-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          min="0"
                          step="0.01"
                          className={`${tableField(errors[`item_${index}_quantity`])} text-center`}
                        />
                      </div>
                      <div className="p-1.5 flex items-center">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          placeholder="Unit"
                          className={`${tableField()} text-center`}
                        />
                      </div>
                      <div className="p-1.5 flex items-center">
                        <input
                          type="date"
                          value={item.requiredDate}
                          onChange={(e) => handleItemChange(index, 'requiredDate', e.target.value)}
                          className={tableField()}
                        />
                      </div>
                      <div className="p-1.5 flex items-center">
                        <input
                          type="text"
                          value={item.specifications}
                          onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                          placeholder="Specifications"
                          className={tableField()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REQUEST SUMMARY - pinned to bottom of the Right Area */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/40 mt-auto flex-none">
            <div className="bg-white dark:bg-card-dark p-3.5 rounded-xl border border-zinc-200 dark:border-border-dark flex flex-col shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-[#2A2F3D]">
                <h3 className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider">Request Summary</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10.4px]">
                  <span className="text-zinc-600 font-medium">Total Items</span>
                  <span className="font-semibold text-zinc-800">{items.length}</span>
                </div>
                <div className="flex justify-between items-center text-[10.4px]">
                  <span className="text-zinc-600 font-medium">Selected Vendors</span>
                  <span className="font-semibold text-zinc-800">{selectedVendorIds.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM ACTION BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex justify-between items-center p-3 border-t border-zinc-200 bg-zinc-100 flex-none shadow-sm z-50">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className={btnSecondary}
        >
          Cancel
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className={btnSecondary}
          >
            {isSubmitting && submittingType === 'draft' ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Draft</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleSaveAndSend}
            disabled={isSubmitting}
            className={btnPrimary}
          >
            {isSubmitting && submittingType === 'send' ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving &amp; Sending...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Save &amp; Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}