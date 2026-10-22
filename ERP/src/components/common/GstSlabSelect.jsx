import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { 
  fetchGstSlabs, 
  selectGstSlabItems, 
  selectGstSlabLoading, 
  selectGstSlabError, 
  selectGstSlabIsLoaded 
} from '../../features/account/store/gstSlabSlice';
import CustomSelect from './CustomSelect';
import { Plus } from 'lucide-react';
import GstSlabFormModal from '../../features/finance/components/GstSlabFormModal';

/**
 * Reusable Redux-Backed GST Slab Dropdown Component.
 * 
 * - Dispatches fetchGstSlabs thunk (GET /api/account/gst-slabs) via Redux Toolkit.
 * - Caches state in Redux: loads once and reuses across HSN/SAC Master, Sales Invoice, Purchase Invoice, Credit/Debit Notes, etc.
 * - Displays options formatted as: <Slab Name> (e.g. 0%, 5%, 12%, 18%, 28%).
 * - Stores selected gstSlabId in form state.
 * - Shows loading spinner, error message, search filter, and "No GST Slabs Found" when list is empty.
 */
export default function GstSlabSelect({
  value,
  onChange,
  name = "gstSlabId",
  placeholder = "Select GST Slab...",
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  disabled = false,
  required = false,
  error = null
}) {
  const dispatch = useDispatch();
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const items = useSelector(selectGstSlabItems);
  const loading = useSelector(selectGstSlabLoading);
  const apiError = useSelector(selectGstSlabError);
  const isLoaded = useSelector(selectGstSlabIsLoaded);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Dispatch thunk once on mount if data is not already loaded in Redux
  useEffect(() => {
    if (!isLoaded && !loading) {
      dispatch(fetchGstSlabs(companyId));
    }
  }, [dispatch, isLoaded, loading, companyId]);

  const handleCreateSuccess = (newSlab) => {
    dispatch(fetchGstSlabs(companyId));
    if (onChange) {
      onChange({ target: { name, value: newSlab.id } });
    }
  };

  // Format options dynamically: <Slab Name> (e.g. 5%, 18%)
  const options = items.map(item => {
    let label = item.slabName || `${item.igstRate}%`;
    if (item.igstRate !== undefined && !label.includes('%')) {
      label = `${label} (${item.igstRate}%)`;
    }
    return {
      value: item.id,
      label,
      subLabel: item.igstRate !== undefined ? `CGST: ${item.cgstRate}% | SGST: ${item.sgstRate}% | IGST: ${item.igstRate}%` : null
    };
  });

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const errorMessage = error || (apiError ? (typeof apiError === 'string' ? apiError : "Failed to load GST Slabs") : null);
  const isEmpty = options.length === 0;

  return (
    <>
      <CustomSelect
        name={name}
        value={value}
        onChange={handleChange}
        options={options}
        placeholder={loading ? "Loading GST Slabs..." : placeholder}
        emptyMessage={isEmpty ? "No GST Slabs available." : "No GST Slab found."}
        emptyStateAction={({ closeDropdown }) => (
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              closeDropdown();
              setIsCreateModalOpen(true);
            }} 
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 text-sm font-semibold text-primary dark:text-blue-400 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 rounded-lg transition-colors"
          >
            <Plus size={16} />
            {isEmpty ? 'Create First GST Slab' : 'Create New GST Slab'}
          </button>
        )}
        bottomAction={!isEmpty ? ({ closeDropdown }) => (
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              closeDropdown();
              setIsCreateModalOpen(true);
            }} 
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10.4px] font-semibold text-primary dark:text-blue-400 bg-primary/5 dark:bg-primary/20 hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Create New GST Slab
          </button>
        ) : null}
        placement="top"
        disabled={disabled || loading}
        required={required}
        isLoading={loading}
        searchable={true}
        className={className}
        buttonClassName={buttonClassName}
        dropdownClassName={dropdownClassName}
        error={errorMessage}
      />
      <GstSlabFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
