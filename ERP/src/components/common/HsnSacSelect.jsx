import React, { useEffect, useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { 
  fetchHsnSacs, 
  selectHsnSacItems, 
  selectHsnSacLoading, 
  selectHsnSacError, 
  selectHsnSacIsLoaded 
} from '../../features/account/store/hsnSacSlice';
import ComboBox from './ComboBox';
import useDebounce from '../../hooks/useDebounce';

/**
 * Reusable Redux-Backed HSN/SAC Dropdown Component.
 * 
 * - Dispatches fetchHsnSacs thunk (GET /api/account/hsn-sac) via Redux Toolkit.
 * - Caches state in Redux: loads once and reuses across Sales Invoice, Purchase Invoice, Credit/Debit Notes, etc.
 * - Displays options formatted as: <CODE> - <DESCRIPTION> (e.g. 1001 - Rice).
 * - Stores selected hsnSacId in form state.
 * - Shows loading spinner, error message, search filter, and "No HSN/SAC Found" when list is empty.
 * - Supports debounced server-side searching against backend API.
 */
export default function HsnSacSelect({
  value,
  onChange,
  name = "hsnSacId",
  placeholder = "Select HSN/SAC...",
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  disabled = false,
  required = false,
  error = null,
  onAddNew = null,
  preSelectedCode = null,
  preSelectedName = null
}) {
  const dispatch = useDispatch();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const items = useSelector(selectHsnSacItems);
  const loading = useSelector(selectHsnSacLoading);
  const apiError = useSelector(selectHsnSacError);
  const isLoaded = useSelector(selectHsnSacIsLoaded);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Dispatch thunk when debounced search term changes, or initially
  useEffect(() => {
    // Only dispatch if not loaded, or if we actively searched
    if (!isLoaded && !loading && !debouncedSearchTerm) {
      dispatch(fetchHsnSacs({ companyId, searchKey: '', page: 0 }));
    } else if (debouncedSearchTerm !== undefined) {
      dispatch(fetchHsnSacs({ companyId, searchKey: debouncedSearchTerm, page: 0 }));
    }
  }, [dispatch, companyId, debouncedSearchTerm]);

  // Format options dynamically: <CODE> - <DESCRIPTION>
  const options = useMemo(() => {
    const opts = items.map(item => ({
      value: item.id,
      label: item.description ? `${item.code} - ${item.description}` : String(item.code),
      code: item.code,
      description: item.description,
      type: item.type
    }));

    if (value && preSelectedCode && !opts.some(o => o.value === value)) {
      opts.push({
        value: value,
        label: preSelectedName ? `${preSelectedCode} - ${preSelectedName}` : String(preSelectedCode),
        code: preSelectedCode,
        description: preSelectedName,
        type: 'PRESELECTED'
      });
    }
    
    return opts;
  }, [items, value, preSelectedCode, preSelectedName]);

  const handleChange = (val) => {
    if (onChange) {
      const selectedItem = items.find(item => item.id === val) || null;
      // Mock event object for compatibility with consumers
      onChange({ target: { name, value: val } }, selectedItem);
    }
  };

  const errorMessage = error || (apiError ? (typeof apiError === 'string' ? apiError : "Failed to load HSN/SAC") : null);

  return (
    <div className={className}>
      <ComboBox
        value={value}
        onChange={handleChange}
        options={options}
        placeholder={loading ? "Loading HSN/SAC..." : placeholder}
        required={required}
        onCreateClick={onAddNew}
        createSubtext="Add New HSN/SAC"
        onSearchChange={setSearchTerm}
        serverSideSearch={true}
        inputClassName="w-full h-8 pl-8 pr-8 bg-white border border-zinc-200 rounded-md text-[8.8px] hover:border-zinc-300 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
      />
      {errorMessage && <div className="text-red-500 text-xs mt-1">{errorMessage}</div>}
    </div>
  );
}
