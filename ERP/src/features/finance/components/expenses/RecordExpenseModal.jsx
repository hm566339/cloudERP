import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Receipt, AlertCircle, Loader2, RefreshCw, FileText, Upload, Check, Eye } from 'lucide-react';
import CustomSelect from '../../../../components/common/CustomSelect';
import { getCurrentUser, expensesApi } from '../../../../api/account/expenses';
import { expenseRequestsApi } from '../../../../api/account/expenseRequests';
import { expenseCategoriesApi } from '../../../../api/account/expenseCategories';

export default function RecordExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  requestRefData = null,
  initialData = null,
  companyId,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    employeeRole: '',
    claimDate: new Date().toISOString().split('T')[0],
    expenseRequestId: null,
    expenseRequestNumber: null,
    items: [
      {
        id: Date.now().toString(),
        expenseCategoryId: '',
        expenseDate: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        billAttachmentUrl: '',
        paymentType: 'CASH'
      }
    ]
  });

  // Current Logged-in User State (from GET /api/account/auth/me)
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);

  // Expense Requests State (for optional linked request)
  const [employeeBalance, setEmployeeBalance] = useState(null);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [uploadingItemIndex, setUploadingItemIndex] = useState(null);
  const [attachmentError, setAttachmentError] = useState(null);
  const [selectedRequestObj, setSelectedRequestObj] = useState(null);

  // Categories State
  const [categoriesList, setCategoriesList] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  // Load current user from GET /api/account/auth/me
  const fetchCurrentUser = async () => {
    setIsLoadingUser(true);
    setUserError(null);
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        throw new Error('Logged-in user information is unavailable from /api/account/auth/me');
      }
      setCurrentUser(user);

      const resolvedRole =
        (Array.isArray(user.role) && user.role[0]?.name) ||
        (Array.isArray(user.roles) && user.roles[0]?.name) ||
        (typeof user.role === 'string' ? user.role : '') ||
        '';

      setFormData((prev) => ({
        ...prev,
        employeeId: user.id,
        employeeName: user.fullName || user.name || '',
        employeeRole: resolvedRole,
      }));
    } catch (err) {
      console.error('Failed to load authenticated user profile:', err);
      setUserError(err?.message || 'Failed to retrieve logged-in employee information');
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCurrentUser();

      const fetchCategories = async () => {
        setIsLoadingCategories(true);
        setCategoriesError(null);
        try {
          const catRes = await expenseCategoriesApi.getList({
            page: 0,
            size: 100,
            isActive: true,
          });
          const catItems =
            catRes?.data?.content ||
            catRes?.content ||
            (Array.isArray(catRes?.data) ? catRes.data : []);
          setCategoriesList(
            Array.isArray(catItems)
              ? catItems.map((c) => ({
                  id: c.id,
                  name: c.categoryName || c.name || c.categoryCode,
                }))
              : []
          );
        } catch (err) {
          console.error('Could not fetch categories:', err);
          setCategoriesError('Failed to load expense categories');
        } finally {
          setIsLoadingCategories(false);
        }
      };

      fetchCategories();
    }
  }, [isOpen, companyId]);

  // Sync initialData or requestRefData when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode
        setFormData((prev) => ({
          ...prev,
          employeeId: initialData.employeeId || prev.employeeId,
          employeeName: initialData.employeeName || prev.employeeName,
          employeeRole: initialData.employeeRole || prev.employeeRole,
          claimDate:
            initialData.claimDate ||
            initialData.createdAt?.split('T')[0] ||
            new Date().toISOString().split('T')[0],
          expenseRequestId: initialData.expenseRequestId || null,
          expenseRequestNumber: initialData.expenseRequestNumber || null,
          items:
            initialData.items?.length > 0
              ? initialData.items.map((i) => ({
                  id: i.id || Math.random().toString(),
                  expenseCategoryId: i.expenseCategoryId || i.categoryId || '',
                  expenseDate:
                    i.expenseDate ||
                    initialData.claimDate ||
                    new Date().toISOString().split('T')[0],
                  description: i.description || '',
                  amount: i.amount || 0,
                  billAttachmentUrl: i.billAttachmentUrl || i.receiptAttachment || '',
                  paymentType: i.paymentType || 'CASH',
                }))
              : [
                  {
                    id: Date.now().toString(),
                    expenseCategoryId: '',
                    expenseDate: new Date().toISOString().split('T')[0],
                    description: '',
                    amount: 0,
                    billAttachmentUrl: '',
                    paymentType: 'CASH',
                  },
                ],
        }));
      } else if (requestRefData) {
        // Pre-fill from an existing Request
        setFormData((prev) => ({
          ...prev,
          claimDate: new Date().toISOString().split('T')[0],
          expenseRequestId: requestRefData.id || null,
          expenseRequestNumber: requestRefData.requestNumber || null,
          items: [
            {
              id: Date.now().toString(),
              expenseCategoryId: requestRefData.categoryId || '',
              expenseDate: requestRefData.date || new Date().toISOString().split('T')[0],
              description: requestRefData.purposeDescription || requestRefData.purpose || '',
              amount: requestRefData.approvedAmount || requestRefData.requestedAmount || 0,
              billAttachmentUrl: '',
              paymentType: 'CASH',
            },
          ],
        }));
      } else {
        // Empty default
        setFormData((prev) => ({
          ...prev,
          claimDate: new Date().toISOString().split('T')[0],
          expenseRequestId: null,
          expenseRequestNumber: null,
          items: [
            {
              id: Date.now().toString(),
              expenseCategoryId: '',
              expenseDate: new Date().toISOString().split('T')[0],
              description: '',
              amount: 0,
              billAttachmentUrl: '',
              paymentType: 'CASH',
            },
          ],
        }));
      }
    }
  }, [isOpen, initialData, requestRefData]);

  // Fetch approved requests for the logged-in user
  useEffect(() => {
    const fetchApprovedRequests = async () => {
      if (!formData.employeeId || !isOpen) return;
      setIsLoadingRequests(true);
      try {
        const res = await expenseRequestsApi.getEmployeeBalances({
          employeeDriverId: formData.employeeId,
        });

        const balances = res?.data || [];
        const empBalance = Array.isArray(balances) && balances.length > 0 ? balances[0] : null;
        setEmployeeBalance(empBalance);

        const requests = empBalance?.requests || [];
        setApprovedRequests(Array.isArray(requests) ? requests : []);

        if (formData.expenseRequestId && Array.isArray(requests)) {
          const matched = requests.find((r) => (r.expenseRequestId === formData.expenseRequestId || r.id === formData.expenseRequestId));
          if (matched) setSelectedRequestObj(matched);
        } else if (!formData.expenseRequestId && Array.isArray(requests) && requests.length === 1) {
          const singleReq = requests[0];
          setFormData((prev) => ({
            ...prev,
            expenseRequestId: singleReq.expenseRequestId || singleReq.id,
            expenseRequestNumber: singleReq.requestNumber,
          }));
          setSelectedRequestObj(singleReq);
        }
      } catch (err) {
        console.error('Error fetching approved requests:', err);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    fetchApprovedRequests();
  }, [isOpen, formData.employeeId]);

  useEffect(() => {
    if (isOpen && requestRefData && !selectedRequestObj) {
      setSelectedRequestObj(requestRefData);
    }
  }, [isOpen, requestRefData, selectedRequestObj]);

  if (!isOpen) return null;

  const handleFileUpload = async (index, file) => {
    if (!file) return;
    setAttachmentError(null);

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      setAttachmentError('File size exceeds the maximum limit of 10MB.');
      return;
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setAttachmentError('Unsupported file type. Only JPG, JPEG, PNG, and PDF files are allowed.');
      return;
    }

    setUploadingItemIndex(index);
    try {
      const res = await expensesApi.uploadAttachment(file, companyId);
      if (res?.data?.fileUrl) {
        const updated = [...formData.items];
        updated[index] = {
          ...updated[index],
          billAttachmentUrl: res.data.fileUrl,
          attachmentFileName: res.data.fileName || file.name,
          attachmentContentType: res.data.contentType || file.type,
        };
        setFormData((prev) => ({ ...prev, items: updated }));
      }
    } catch (err) {
      console.error('Failed to upload bill attachment:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to upload attachment.';
      setAttachmentError(errMsg);
    } finally {
      setUploadingItemIndex(null);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString(),
      expenseCategoryId: '',
      expenseDate: formData.claimDate || new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      billAttachmentUrl: '',
      paymentType: 'CASH',
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updated });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 9. Before submitting the expense, make sure /auth/me has successfully loaded
    if (!formData.employeeId || !formData.employeeName) {
      setUserError('Logged-in user information is unavailable. Cannot submit expense claim.');
      return;
    }

    if (totalAmount <= 0) return;

    // Validate line items
    for (let idx = 0; idx < formData.items.length; idx++) {
      const item = formData.items[idx];
      if (!item.expenseCategoryId) {
        alert(`Please select an Expense Category for item #${idx + 1}`);
        return;
      }
      if (!item.description?.trim()) {
        alert(`Please enter a Description for item #${idx + 1}`);
        return;
      }
      if (Number(item.amount) <= 0) {
        alert(`Please enter an amount greater than 0 for item #${idx + 1}`);
        return;
      }
    }

    // Validate that claim total does not exceed remaining amount for linked Expense Request
    if (selectedRequestObj) {
      const reqAmt = Number(selectedRequestObj.approvedAmount ?? selectedRequestObj.requestedAmount ?? 0);
      const usedAmt = Number(selectedRequestObj.usedAmount ?? 0);
      const remAmt = Number(selectedRequestObj.remainingAmount ?? (reqAmt - usedAmt));
      if (totalAmount > remAmt) {
        alert(`Total claim amount (₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) exceeds remaining approved amount (₹${remAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) for request ${selectedRequestObj.requestNumber}. Please adjust your claim items.`);
        return;
      }
    }

    // 6. Request payload structure matching backend contract
    const payload = {
      data: {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        employeeRole: formData.employeeRole || '',
        claimDate: formData.claimDate,
        expenseRequestId: formData.expenseRequestId || null,
        items: formData.items.map((i) => ({
          expenseCategoryId: i.expenseCategoryId,
          expenseDate: i.expenseDate || formData.claimDate,
          description: i.description.trim(),
          amount: Number(i.amount) || 0,
          billAttachmentUrl: i.billAttachmentUrl?.trim() || null,
          paymentType: i.paymentType || 'CASH',
        })),
      },
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Receipt size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                {initialData ? 'Edit Expense Claim' : 'Record Expense Claim'}
              </h2>
              <p className="text-xs text-zinc-500">Record company/employee expense with itemized lines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* User error warning if /auth/me failed */}
          {userError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-500 shrink-0" />
                <span>{userError}</span>
              </div>
              <button
                type="button"
                onClick={fetchCurrentUser}
                className="text-xs font-semibold text-rose-800 underline hover:no-underline ml-2 flex items-center gap-1"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* Form Fields: Only user-input fields (Claim Date & Expense Request) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                Claim Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.claimDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    claimDate: newDate,
                    items: prev.items.map((it) => (it.expenseDate ? it : { ...it, expenseDate: newDate })),
                  }));
                }}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:border-zinc-400 outline-none"
              />
            </div>

            <div>
              <label className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                Expense Request (Optional)
              </label>
              <CustomSelect
                value={formData.expenseRequestId || ''}
                onChange={(e) => {
                  const reqId = e.target.value;
                  if (!reqId) {
                    setFormData({ ...formData, expenseRequestId: null, expenseRequestNumber: null });
                    setSelectedRequestObj(null);
                    return;
                  }
                  const matched = approvedRequests.find((r) => (r.expenseRequestId === reqId || r.id === reqId));
                  if (matched) {
                    setFormData({
                      ...formData,
                      expenseRequestId: matched.expenseRequestId || matched.id,
                      expenseRequestNumber: matched.requestNumber,
                    });
                    setSelectedRequestObj(matched);
                  }
                }}
                disabled={isLoadingRequests || !formData.employeeId}
                className="w-full h-9 px-3 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:border-zinc-400 outline-none"
              >
                <option value="">-- Select Expense Request (Optional) --</option>
                {approvedRequests.map((req) => {
                  const remAmt = req.remainingAmount != null ? req.remainingAmount : ((req.approvedAmount || req.requestedAmount || 0) - (req.usedAmount || 0));
                  return (
                    <option key={req.id} value={req.id}>
                      {req.requestNumber} — Remaining: ₹{Number(remAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({req.purposeDescription || req.purpose || 'Expense Request'})
                    </option>
                  );
                })}
              </CustomSelect>
            </div>
          </div>

          {/* Consolidated Employee Expense Balance Card */}
          {employeeBalance && (
            <div className="p-4 rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50/90 to-white shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">
                    {employeeBalance.employeeName || formData.employeeName}
                  </h4>
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {employeeBalance.role || employeeBalance.employeeRole || formData.employeeRole || 'EMPLOYEE'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Consolidated Employee Balance
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 py-1">
                <div className="bg-white p-2.5 rounded-lg border border-zinc-100">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Total Approved
                  </span>
                  <span className="font-bold text-base text-zinc-900">
                    ₹{Number(employeeBalance.totalApprovedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-zinc-100">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Used
                  </span>
                  <span className="font-bold text-base text-amber-600">
                    ₹{Number(employeeBalance.totalUsedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200/60">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">
                    Available
                  </span>
                  <span className="font-bold text-base text-emerald-700">
                    ₹{Number(employeeBalance.totalRemainingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {employeeBalance.requests && employeeBalance.requests.length > 0 && (
                <div className="pt-2 border-t border-zinc-100">
                  <div className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                    Expense Details
                  </div>
                  <ul className="space-y-1 text-xs text-zinc-700">
                    {employeeBalance.requests.map((r, idx) => (
                      <li key={r.expenseRequestId || r.id || idx} className="flex items-center justify-between py-0.5">
                        <span className="flex items-center gap-2">
                          <span className="text-zinc-400">•</span>
                          <span className="font-medium text-zinc-800">{r.categoryName || 'Expense'}</span>
                          <span className="text-zinc-400">—</span>
                          <span className="text-zinc-600">{r.description || r.purposeDescription || 'No description'}</span>
                        </span>
                        <span className="font-semibold text-zinc-700 text-[11px]">
                          ₹{Number(r.remainingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Linked Request Details Chip */}
          {selectedRequestObj && (() => {
            const reqAmt = Number(selectedRequestObj.approvedAmount ?? selectedRequestObj.requestedAmount ?? 0);
            const usedAmt = Number(selectedRequestObj.usedAmount ?? 0);
            const remAmt = Number(selectedRequestObj.remainingAmount ?? (reqAmt - usedAmt));
            const isExceeded = totalAmount > remAmt;

            return (
              <div className={`p-3.5 rounded-xl border text-xs transition-all ${
                isExceeded ? 'bg-rose-50/70 border-rose-200' : 'bg-zinc-50/80 border-zinc-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-zinc-900 flex items-center gap-2">
                    <span>{selectedRequestObj.requestNumber}</span>
                    <span className="text-zinc-400 font-normal">—</span>
                    <span className="text-zinc-600 truncate max-w-[280px]">
                      {selectedRequestObj.purposeDescription || selectedRequestObj.purpose || 'Expense Request'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    APPROVED
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-200/70">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Request Amount
                    </span>
                    <span className="font-bold text-sm text-zinc-800">
                      ₹{reqAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Already Used
                    </span>
                    <span className="font-bold text-sm text-amber-600">
                      ₹{usedAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Remaining Amount
                    </span>
                    <span className={`font-bold text-sm ${isExceeded ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{remAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                {isExceeded && (
                  <div className="mt-2.5 pt-2 border-t border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium">
                    <AlertCircle size={14} className="shrink-0 text-rose-600" />
                    <span>Total claim amount (₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) exceeds remaining approved amount (₹{remAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).</span>
                  </div>
                )}
              </div>
            );
          })()}

          {attachmentError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-600 shrink-0" />
                <span>{attachmentError}</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachmentError(null)}
                className="text-rose-400 hover:text-rose-600"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Multi-Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[8.8px] font-bold text-zinc-700 uppercase tracking-wider">
                Expense Line Items <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-zinc-900 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-md transition-colors"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100/75 border-b border-zinc-200 text-zinc-600 font-bold uppercase text-[8px] tracking-wider">
                    <th className="p-2.5 w-32 pl-3">Expense Date</th>
                    <th className="p-2.5 w-40">Expense Category</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 w-24">Payment Type</th>
                    <th className="p-2.5 w-28 text-right">Amount (₹)</th>
                    <th className="p-2.5 w-36">Bill Attachment</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white font-medium">
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                      {/* Expense Date */}
                      <td className="p-2 pl-3">
                        <input
                          type="date"
                          required
                          value={item.expenseDate || formData.claimDate}
                          onChange={(e) => handleItemChange(index, 'expenseDate', e.target.value)}
                          className="w-full h-8 px-2 bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-400 focus:bg-white rounded text-xs outline-none"
                        />
                      </td>

                      {/* Expense Category */}
                      <td className="p-2">
                        <CustomSelect
                          value={item.expenseCategoryId || ''}
                          onChange={(e) => handleItemChange(index, 'expenseCategoryId', e.target.value)}
                          className="w-full h-8 px-2 bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-400 focus:bg-white rounded text-xs outline-none"
                        >
                          <option value="" disabled>Select...</option>
                          {categoriesList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </CustomSelect>
                      </td>

                      {/* Description */}
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Taxi Fare"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full h-8 px-2 bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-400 focus:bg-white rounded text-xs outline-none"
                        />
                      </td>

                      {/* Payment Type */}
                      <td className="p-2">
                        <CustomSelect
                          value={item.paymentType || 'CASH'}
                          onChange={(e) => handleItemChange(index, 'paymentType', e.target.value)}
                          className="w-full h-8 px-2 bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-400 focus:bg-white rounded text-xs outline-none uppercase font-semibold text-[10px]"
                        >
                          <option value="CASH">CASH</option>
                          <option value="BANK">BANK</option>
                          <option value="CARD">CARD</option>
                          <option value="UPI">UPI</option>
                          <option value="OTHER">OTHER</option>
                        </CustomSelect>
                      </td>

                      {/* Amount */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.amount}
                          onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                          className="w-full h-8 text-right bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-400 focus:bg-white rounded text-xs outline-none font-medium text-zinc-900"
                        />
                      </td>

                      {/* Bill Attachment Upload & Preview */}
                      <td className="p-2 w-48">
                        {uploadingItemIndex === index ? (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 py-1">
                            <Loader2 size={13} className="animate-spin text-zinc-700" />
                            <span>Uploading...</span>
                          </div>
                        ) : item.billAttachmentUrl ? (
                          <div className="flex items-center gap-1.5 p-1 px-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs">
                            {item.billAttachmentUrl.toLowerCase().endsWith('.pdf') || item.attachmentFileName?.toLowerCase().endsWith('.pdf') ? (
                              <FileText size={14} className="text-rose-500 shrink-0" />
                            ) : (
                              <img
                                src={item.billAttachmentUrl}
                                alt="Receipt"
                                className="w-5 h-5 object-cover rounded shrink-0 border border-zinc-200"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="truncate max-w-[90px] text-[11px] font-medium text-zinc-800" title={item.attachmentFileName || 'Attachment'}>
                                {item.attachmentFileName || item.billAttachmentUrl.split('/').pop()}
                              </span>
                              <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-0.5">
                                <Check size={10} /> Uploaded
                              </span>
                            </div>
                            <a
                              href={item.billAttachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="View file"
                              className="p-1 hover:bg-emerald-100 rounded text-emerald-800 transition-colors"
                            >
                              <Eye size={12} />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...formData.items];
                                updated[index] = {
                                  ...updated[index],
                                  billAttachmentUrl: '',
                                  attachmentFileName: '',
                                };
                                setFormData((prev) => ({ ...prev, items: updated }));
                              }}
                              title="Remove attachment"
                              className="p-1 hover:bg-emerald-100 rounded text-zinc-400 hover:text-rose-600 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-dashed border-zinc-300 hover:border-zinc-500 bg-zinc-50/50 hover:bg-zinc-100/70 text-[11px] font-medium text-zinc-700 transition-colors">
                            <Upload size={12} className="text-zinc-500" />
                            <span>Upload Bill</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(index, file);
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          disabled={formData.items.length <= 1}
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-zinc-300 hover:text-rose-500 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-50 border-t border-zinc-200">
                    <td colSpan={4} className="p-3 text-right font-bold text-xs text-zinc-600 uppercase tracking-wider">
                      Total Claim Amount:
                    </td>
                    <td className="p-3 text-right font-extrabold text-sm text-zinc-900 pr-3">
                      ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end pt-4 border-t border-zinc-100 gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalAmount <= 0 || !formData.employeeId || isLoadingUser || !!userError || (selectedRequestObj && totalAmount > Number(selectedRequestObj.remainingAmount ?? ((selectedRequestObj.approvedAmount ?? selectedRequestObj.requestedAmount ?? 0) - (selectedRequestObj.usedAmount ?? 0))))}
              className="h-9 px-5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm transition-colors active:scale-98 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {isSubmitting ? 'Saving...' : 'Save Draft Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
