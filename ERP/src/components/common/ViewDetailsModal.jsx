import React, { useState, useEffect } from 'react';
import { X, Eye, Loader2 } from 'lucide-react';
import apiClient from '../../api/common/client';

/**
 * ViewDetailsModal — Reusable "View Details" modal.
 *
 * Accepts EITHER:
 *   a) `data` prop — renders fields from the object directly
 *   b) `id` + `endpoint` — fetches the record via apiClient, then renders
 *
 * Config:
 *   - hiddenKeys: fields to exclude from rendering
 *   - fieldLabels: { key: 'Custom Label' } for overriding auto-generated labels
 *   - children: slot-based custom content rendered below the auto grid
 *
 * Usage:
 *   <ViewDetailsModal
 *     isOpen={showDetails}
 *     onClose={() => setShowDetails(false)}
 *     data={selectedRecord}  // OR: id={selectedId} endpoint="/api/..."
 *     title="Bank Account Details"
 *     onEdit={() => openEditModal(selectedRecord)}
 *     hiddenKeys={['id', 'companyId']}
 *   />
 */
export default function ViewDetailsModal({
  isOpen,
  onClose,
  data: dataProp,
  id,
  endpoint,
  title = 'Details',
  onEdit,
  onDelete,
  hiddenKeys = ['id', 'companyId', 'isDeleted'],
  fieldLabels = {},
  extraActions = [],
  children,
}) {
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data if id + endpoint provided and no dataProp
  useEffect(() => {
    if (!isOpen) {
      setFetchedData(null);
      setError(null);
      return;
    }
    if (dataProp) {
      setFetchedData(null);
      return;
    }
    
    let controller = null;
    
    if (id && endpoint) {
      setLoading(true);
      setError(null);
      controller = new AbortController();
      
      apiClient.get(endpoint, { signal: controller.signal })
        .then(res => {
          const d = res.data;
          // Unwrap common envelopes
          const unwrapped = d?.data || d;
          setFetchedData(unwrapped);
          setLoading(false);
        })
        .catch(err => {
          if (err.name === 'CanceledError' || err.message === 'canceled') return;
          setError(err?.response?.data?.message || err.message || 'Failed to load details');
          setLoading(false);
        });
    }
    
    return () => {
      if (controller) controller.abort();
    };
  }, [isOpen, id, endpoint, dataProp]);

  if (!isOpen) return null;

  const data = dataProp || fetchedData;

  // Format camelCase keys to human-readable labels
  const formatKey = (key) => {
    if (fieldLabels[key]) return fieldLabels[key];
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/ Id$/, ' ID');
  };

  // Format values for display
  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === '') return <span className="text-zinc-400 italic">—</span>;
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8.8px] font-medium border ${value ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' : 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    if ((key.toLowerCase().includes('date') || key.endsWith('At')) && typeof value === 'string') {
      try { 
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }); 
      }
      catch { return String(value); }
    }
    if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('balance') || key.toLowerCase().includes('total') || key.toLowerCase().includes('limit')) {
      const num = parseFloat(value);
      if (!isNaN(num)) return <span className="font-semibold text-zinc-800">₹{num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>;
    }
    return String(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/60 backdrop-blur-sm px-3 py-6 sm:px-4 sm:py-8">
      <div className="card my-auto w-full max-w-2xl animate-slide-up flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden bg-white shadow-xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-zinc-100 shrink-0 bg-zinc-50/50 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Eye size={20} />
            </div>
            <h2 className="text-xl font-bold text-zinc-800">{title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {extraActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => { onClose(); action.onClick(); }}
                className={`btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5 whitespace-nowrap ${action.className || ''}`}
                title={action.tooltip}
              >
                {action.icon}
                <span className="hidden sm:inline">{action.label || action.tooltip}</span>
              </button>
            ))}
            {onEdit && (
              <button
                onClick={() => { onClose(); onEdit(data); }}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto min-h-0 flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
              <span className="ml-3 text-sm text-zinc-500">Loading details...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                  {Object.entries(data).map(([key, value]) => {
                    if (hiddenKeys.includes(key)) return null;
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) return null;
                    if (Array.isArray(value)) return null;
                    if (key === 'lineItems' || key === 'items') return null; // handled separately

                    return (
                      <div key={key} className="break-words">
                        <dt className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{formatKey(key)}</dt>
                        <dd className="text-sm font-medium text-slate-800 break-all sm:break-words">
                          {formatValue(key, value)}
                        </dd>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Render nested items (line items for invoices etc.) */}
              {((data.items && Array.isArray(data.items) && data.items.length > 0) || (data.lineItems && Array.isArray(data.lineItems) && data.lineItems.length > 0)) && (
                <div className="mt-8">
                  <h3 className="text-[10.4px] font-bold text-zinc-800 mb-4 uppercase tracking-widest border-b border-zinc-100 pb-2">
                    Line Items
                  </h3>
                  <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 text-[8.8px] uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-bold">Item / Description</th>
                          <th className="px-6 py-4 font-bold text-right">Qty</th>
                          <th className="px-6 py-4 font-bold text-right">Rate</th>
                          <th className="px-6 py-4 font-bold text-right">Tax</th>
                          <th className="px-6 py-4 font-bold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {(data.items || data.lineItems).map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-zinc-800">
                              {item.name || item.itemName || item.description || item.product || `Item ${idx + 1}`}
                            </td>
                            <td className="px-6 py-4 text-right text-zinc-600 font-medium">
                              {item.qty || item.quantity || 1}
                            </td>
                            <td className="px-6 py-4 text-right text-zinc-600">
                              ₹{parseFloat(item.rate || item.price || item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right text-zinc-600">
                              {item.taxAmount ? `₹${parseFloat(item.taxAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-zinc-900">
                              ₹{parseFloat(item.totalAmount || item.total || ((item.qty || item.quantity || 1) * (item.rate || item.price || item.unitPrice || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Slot for custom content */}
              {children}
            </>
          )}

          {!loading && !error && !data && (
            <div className="p-8 text-center text-zinc-500">No data available.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 flex justify-end shrink-0 bg-zinc-50/50">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}
