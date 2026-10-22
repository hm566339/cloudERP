import React, { useState, useEffect, useMemo } from 'react';
import { X, ClipboardList, IndianRupee, Loader2, RefreshCw } from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import CustomSelect from '../../../../components/common/CustomSelect';
import { expenseCategoriesApi } from '../../../../api/account/expenseCategories';
import { employeeDriverService } from '../../services/employeeDriverService';

export default function ExpenseRequestModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  companyId,
  isSubmitting = false
}) {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    requestType: 'EXPENSE_REQUEST', // 'EXPENSE_REQUEST' | 'ADVANCE_REQUEST'
    date: new Date().toISOString().split('T')[0],
    employeeDriverId: '',
    employeeDriverName: '',
    roleType: 'EMPLOYEE', // 'EMPLOYEE' | 'DRIVER'
    categoryId: '',
    categoryName: '',
    requestedAmount: '',
    purposeDescription: '',
    additionalNotes: '',
    requiresAdvance: false,
    advanceAmount: '',
    vehicleNumber: ''
  });

  // People (Employees & Drivers) state
  const [peopleData, setPeopleData] = useState({ all: [], employees: [], drivers: [] });
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [peopleError, setPeopleError] = useState(null);

  // Categories state
  const [categoriesList, setCategoriesList] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const [validationErrors, setValidationErrors] = useState({});

  // ─────────────────────────────────────────────────────────
  // 1. Fetch Real Employees & Drivers from backend API
  // ─────────────────────────────────────────────────────────
  const fetchPeople = async () => {
    setIsLoadingPeople(true);
    setPeopleError(null);
    try {
      const data = await employeeDriverService.getCompanyPeople(companyId);
      setPeopleData(data);

      // Auto-select present user and lock on Employee / Driver
      if (!initialData) {
        const personToSelect = data.currentUser || data.all?.[0];
        if (personToSelect) {
          setFormData((prev) => ({
            ...prev,
            employeeDriverId: personToSelect.id,
            employeeDriverName: personToSelect.name,
            roleType: personToSelect.isDriver ? 'DRIVER' : (prev.roleType || 'EMPLOYEE'),
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching company employees/drivers:', err);
      const msg = err?.message || 'Failed to load employees/drivers';
      setPeopleError(msg);
      dispatch(addAlert({ type: 'error', message: 'Failed to load company employees/drivers' }));
    } finally {
      setIsLoadingPeople(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // 2. Fetch Categories from backend API
  // ─────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    setCategoriesError(null);
    try {
      const catRes = await expenseCategoriesApi.getList({ 
        page: 0, 
        size: 100, 
        sortDir: 'asc', 
        sortBy: 'categoryName',
        isActive: true
      });
      
      const catItems = catRes?.data?.content || catRes?.content || (Array.isArray(catRes?.data) ? catRes.data : []);

      if (Array.isArray(catItems)) {
        const resolved = catItems
          .filter((c) => c.isActive !== false) // client-side fallback just in case
          .map((c) => ({
            id: c.id,
            name: c.categoryName || c.name || c.categoryCode,
          }))
          .filter((c) => !!c.id);

        setCategoriesList(resolved);
      } else {
        setCategoriesList([]);
      }
    } catch (err) {
      console.error('Could not fetch categories:', err);
      setCategoriesError('Failed to load categories');
      setCategoriesList([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPeople();
      fetchCategories();
    }
  }, [isOpen, companyId]);

  // ─────────────────────────────────────────────────────────
  // 3. Sync initialData when editing or reset when opening
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setValidationErrors({});
      if (initialData) {
        const reqType =
          initialData.requestType === 'ADVANCE_REQUEST' || initialData.requestType === 'Advance'
            ? 'ADVANCE_REQUEST'
            : 'EXPENSE_REQUEST';

        const role = String(initialData.roleType || initialData.employeeType || 'EMPLOYEE')
          .toUpperCase()
          .includes('DRIVER')
          ? 'DRIVER'
          : 'EMPLOYEE';

        setFormData({
          requestType: reqType,
          date: initialData.date || initialData.requestDate || new Date().toISOString().split('T')[0],
          employeeDriverId: initialData.employeeDriverId || initialData.employeeId || '',
          employeeDriverName: initialData.employeeDriverName || initialData.requesterName || '',
          roleType: role,
          categoryId: initialData.categoryId || initialData.expenseCategoryId || '',
          categoryName: initialData.categoryName || initialData.category || '',
          requestedAmount: initialData.requestedAmount !== undefined ? String(initialData.requestedAmount) : '',
          purposeDescription: initialData.purposeDescription || initialData.purpose || '',
          additionalNotes: initialData.additionalNotes || initialData.notes || '',
          requiresAdvance: Boolean(initialData.requiresAdvance || reqType === 'ADVANCE_REQUEST'),
          advanceAmount:
            initialData.advanceAmount !== undefined && initialData.advanceAmount !== null
              ? String(initialData.advanceAmount)
              : '',
          vehicleNumber: initialData.vehicleNumber || initialData.vehicleNo || '',
        });
      } else {
        // Auto-select present employee/driver immediately from cache or service
        const defaultPerson =
          peopleData.currentUser ||
          employeeDriverService.getCurrentUser() ||
          employeeDriverService.getCurrentUserCached();

        setFormData({
          requestType: 'EXPENSE_REQUEST',
          date: new Date().toISOString().split('T')[0],
          employeeDriverId: defaultPerson?.id || '',
          employeeDriverName: defaultPerson?.name || '',
          roleType: defaultPerson?.isDriver ? 'DRIVER' : 'EMPLOYEE',
          categoryId: '',
          categoryName: '',
          requestedAmount: '',
          purposeDescription: '',
          additionalNotes: '',
          requiresAdvance: false,
          advanceAmount: '',
          vehicleNumber: '',
        });
      }
    }
  }, [isOpen, initialData]);

  // ─────────────────────────────────────────────────────────
  // 4. ROLE / TYPE Switch Handler
  // ─────────────────────────────────────────────────────────
  const handleRoleTypeChange = (e) => {
    const newRole = e.target.value;
    setFormData((prev) => ({
      ...prev,
      roleType: newRole,
    }));
    if (validationErrors.employeeDriverId) {
      setValidationErrors((prev) => ({ ...prev, employeeDriverId: undefined }));
    }
  };

  // Filter people list based on selected ROLE / TYPE
  const filteredPeople = useMemo(() => {
    if (formData.roleType === 'DRIVER') {
      return peopleData.drivers;
    }
    return peopleData.employees;
  }, [peopleData, formData.roleType]);

  // Format options for CustomSelect with name and rich subLabel
  const employeeDropdownOptions = useMemo(() => {
    const options = filteredPeople.map((person) => {
      const metaParts = [
        person.displayType || (person.isDriver ? 'Driver' : 'Employee'),
        person.empId ? person.empId : null,
        person.email || person.username || null,
      ].filter(Boolean);

      return {
        value: person.id,
        label: person.name,
        subLabel: metaParts.join(' • '),
        person,
      };
    });

    // If editing and the initial person is not in filtered list, preserve it
    if (formData.employeeDriverId && !options.some((opt) => String(opt.value) === String(formData.employeeDriverId))) {
      options.unshift({
        value: formData.employeeDriverId,
        label: formData.employeeDriverName || 'Selected Person',
        subLabel: `${formData.roleType === 'DRIVER' ? 'Driver' : 'Employee'} (ID: ${formData.employeeDriverId.slice(0, 8)}...)`,
      });
    }

    return options;
  }, [filteredPeople, formData.employeeDriverId, formData.employeeDriverName, formData.roleType]);

  // Handle employee/driver selection
  const handleEmployeeChange = (e) => {
    const selectedId = e.target.value;
    const selectedOpt = employeeDropdownOptions.find((opt) => String(opt.value) === String(selectedId));

    setFormData((prev) => ({
      ...prev,
      employeeDriverId: selectedId, // Stores actual UUID
      employeeDriverName: selectedOpt ? selectedOpt.label : '',
    }));

    if (validationErrors.employeeDriverId) {
      setValidationErrors((prev) => ({ ...prev, employeeDriverId: undefined }));
    }
  };

  // Handle category selection
  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    const cat = categoriesList.find((item) => String(item.id) === String(selectedId));
    setFormData((prev) => ({
      ...prev,
      categoryId: selectedId,
      categoryName: cat ? cat.name : '',
    }));
    if (validationErrors.categoryId) {
      setValidationErrors((prev) => ({ ...prev, categoryId: undefined }));
    }
  };

  // ─────────────────────────────────────────────────────────
  // 5. Validation
  // ─────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!formData.requestType) errors.requestType = 'Request type is required';
    if (!formData.date) errors.date = 'Date is required';

    if (!formData.employeeDriverId) {
      errors.employeeDriverId = 'Please select an employee or driver.';
    }

    if (!formData.roleType) errors.roleType = 'Role type is required';
    if (!formData.categoryId) errors.categoryId = 'Expense Category is required';

    const amt = parseFloat(formData.requestedAmount);
    if (isNaN(amt) || amt <= 0) {
      errors.requestedAmount = 'Requested amount must be greater than zero';
    }

    if (!formData.purposeDescription || !formData.purposeDescription.trim()) {
      errors.purposeDescription = 'Purpose / description is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      if (!formData.employeeDriverId) {
        dispatch(addAlert({ type: 'error', message: 'Please select an employee or driver.' }));
      }
      return;
    }

    const payload = {
      requestType: formData.requestType,
      date: formData.date,
      employeeDriverId: formData.employeeDriverId, // Sends actual UUID
      roleType: formData.roleType,
      categoryId: formData.categoryId,
      requestedAmount: parseFloat(formData.requestedAmount),
      purposeDescription: formData.purposeDescription.trim(),
      additionalNotes: formData.additionalNotes ? formData.additionalNotes.trim() : undefined,
      requiresAdvance: formData.requestType === 'ADVANCE_REQUEST' || formData.requiresAdvance,
      advanceAmount:
        formData.requestType === 'ADVANCE_REQUEST'
          ? parseFloat(formData.advanceAmount) || parseFloat(formData.requestedAmount)
          : formData.advanceAmount
          ? parseFloat(formData.advanceAmount)
          : undefined,
      vehicleNumber: formData.vehicleNumber ? formData.vehicleNumber.trim() : undefined,
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#161922] rounded-xl shadow-2xl border border-zinc-200 dark:border-[#2A2F3D] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-blue-600 text-white flex items-center justify-center">
              <ClipboardList size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">
                {initialData ? 'Edit Expense Request' : 'New Expense Request'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#6B7184]">Submit an authorization or advance request to the finance module</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#E6E8EE] rounded-lg hover:bg-zinc-100 dark:hover:bg-[#222736] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Request Type & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[8.8px] font-bold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                Request Type <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={formData.requestType}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    requestType: val,
                    requiresAdvance: val === 'ADVANCE_REQUEST',
                  }));
                }}
                className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
              >
                <option value="EXPENSE_REQUEST">Expense Request</option>
                <option value="ADVANCE_REQUEST">Advance Request</option>
              </CustomSelect>
            </div>

            <div>
              <label className="text-[8.8px] font-bold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
              />
              {validationErrors.date && <p className="text-[8px] text-rose-500 mt-0.5">{validationErrors.date}</p>}
            </div>
          </div>

          {/* Role Type & Employee/Driver Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* ROLE / TYPE Dropdown */}
            <div>
              <label className="text-[8.8px] font-bold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                Role / Type <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={formData.roleType}
                onChange={handleRoleTypeChange}
                className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
              >
                <option value="EMPLOYEE">Employee (Staff)</option>
                <option value="DRIVER">Driver / Fleet</option>
              </CustomSelect>
            </div>

            {/* EMPLOYEE / DRIVER Searchable Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[8.8px] font-bold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider block">
                  Employee / Driver <span className="text-rose-500">*</span>
                </label>
                {peopleError && (
                  <button
                    type="button"
                    onClick={fetchPeople}
                    title="Retry loading employees"
                    className="text-[8px] text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Retry
                  </button>
                )}
              </div>

              <CustomSelect
                value={formData.employeeDriverId}
                onChange={handleEmployeeChange}
                options={employeeDropdownOptions}
                searchable={true}
                isLoading={isLoadingPeople}
                disabled={true}
                placeholder={
                  isLoadingPeople
                    ? '[ Loading employees/drivers... ]'
                    : formData.roleType === 'DRIVER'
                    ? '-- Choose Driver --'
                    : '-- Choose Employee --'
                }
                emptyMessage={
                  formData.roleType === 'DRIVER' ? 'No drivers found' : 'No employees found'
                }
                className="w-full h-9 px-3 bg-zinc-50 dark:bg-[#1D212C]/60 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none cursor-not-allowed"
              />

              {validationErrors.employeeDriverId && (
                <p className="text-[8px] text-rose-500 mt-1 font-medium">
                  {validationErrors.employeeDriverId}
                </p>
              )}
            </div>
          </div>

          {/* Category & Requested Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[8.8px] font-bold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider block">
                  Category <span className="text-rose-500">*</span>
                </label>
                {categoriesError && (
                  <button
                    type="button"
                    onClick={fetchCategories}
                    title="Retry loading categories"
                    className="text-[8px] text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Retry
                  </button>
                )}
              </div>
              <CustomSelect
                value={formData.categoryId}
                onChange={handleCategoryChange}
                searchable={true}
                isLoading={isLoadingCategories}
                disabled={isLoadingCategories || !!categoriesError}
                placeholder={
                  isLoadingCategories
                    ? '[ Loading categories... ]'
                    : categoriesError
                    ? 'Failed to load categories'
                    : '-- Choose Category --'
                }
                emptyMessage="No categories found"
                className={`w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none ${
                  categoriesError ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30' : ''
                } ${(isLoadingCategories || !!categoriesError) ? 'cursor-not-allowed' : ''}`}
              >
                <option value="">
                  {isLoadingCategories
                    ? 'Loading...'
                    : categoriesError
                    ? 'Failed to load categories'
                    : '-- Choose Category --'}
                </option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </CustomSelect>
              {validationErrors.categoryId && (
                <p className="text-[8px] text-rose-500 mt-0.5">{validationErrors.categoryId}</p>
              )}
            </div>

            <div>
              <label className="text-[8.8px] font-bold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                Requested Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-2.5 text-zinc-400 dark:text-[#6B7184]" />
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.requestedAmount}
                  onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                  className="w-full h-9 pl-8 pr-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-bold text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
                />
              </div>
              {validationErrors.requestedAmount && (
                <p className="text-[8px] text-rose-500 mt-0.5">{validationErrors.requestedAmount}</p>
              )}
            </div>
          </div>

          {/* Vehicle Number (optional if Driver) */}
          {formData.roleType === 'DRIVER' && (
            <div>
              <label className="text-[8.8px] font-bold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
                Vehicle Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. MH-12-AB-1234"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
              />
            </div>
          )}

          {/* Purpose / Description */}
          <div>
            <label className="text-[8.8px] font-bold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
              Purpose / Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Fuel and toll charges for dispatch to client warehouse"
              value={formData.purposeDescription}
              onChange={(e) => setFormData({ ...formData, purposeDescription: e.target.value })}
              className="w-full p-2.5 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
            />
            {validationErrors.purposeDescription && (
              <p className="text-[8px] text-rose-500 mt-0.5">{validationErrors.purposeDescription}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="text-[8.8px] font-bold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider mb-1 block">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Optional trip reference, delivery challan, or remarks"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="w-full h-9 px-3 bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs font-medium text-zinc-800 dark:text-[#E6E8EE] focus:border-zinc-400 dark:focus:border-[#4C8DFF] outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-[#2A2F3D]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg shadow-sm transition-colors active:scale-98 disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              {initialData ? 'Update Request' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
