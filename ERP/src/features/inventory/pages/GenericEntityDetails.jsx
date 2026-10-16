import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, FileText, LayoutDashboard, AlertCircle, Edit2, Loader2, Package, Tag, List
} from 'lucide-react';
import apiClient from '../../../api/common/client';
import { format } from 'date-fns';

/**
 * Generic Details Page for any inventory entity.
 * Uses a generic layout similar to WarehouseDetails.
 */
export default function GenericEntityDetails({ endpoint, entityName }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [resolvedProductName, setResolvedProductName] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`${endpoint}/${id}`);
        if (isMounted) {
          const detailData = res.data?.data || res.data;
          setData(detailData);
          setLoading(false);
          if (detailData?.productId) {
            apiClient.get(`/api/inventory/products/${detailData.productId}`)
              .then(pRes => {
                if (isMounted) {
                  const p = pRes.data?.data || pRes.data;
                  if (p?.productName) {
                    setResolvedProductName(`${p.productName}${p.sku ? ` (${p.sku})` : ''}`);
                  }
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load details');
          setLoading(false);
        }
      }
    };
    if (id && endpoint) fetchDetails();
    return () => { isMounted = false; };
  }, [id, endpoint]);

  const handleBack = () => {
    navigate('..', { relative: 'path' });
  };

  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase());
  };

  const formatValue = (key, val) => {
    if (val === null || val === undefined) return '-';
    if (key === 'productId') {
      return resolvedProductName ? `${resolvedProductName} [ID: ${val}]` : val;
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number') {
      if (key.toLowerCase().includes('cost') || key.toLowerCase().includes('price') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('value')) {
        return `₹${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      }
      return val;
    }
    if (typeof val === 'string') {
      if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        try { return format(new Date(val), 'dd MMM yyyy, hh:mm a'); } catch (e) { return val; }
      }
      return val;
    }
    return String(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium text-zinc-500">Loading {entityName} details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 mt-6 max-w-lg mx-auto bg-white rounded-xl border border-rose-200 shadow-sm text-center animate-fade-in">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Not Found</h2>
        <p className="text-sm text-zinc-500 mb-6">{error || `We couldn't find the requested ${entityName} record.`}</p>
        <button onClick={handleBack} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const title = (resolvedProductName ? `${resolvedProductName} — ${entityName}` : null) || data.name || data.productName || data.code || data.warehouseName || data.batchNumber || data.serialNumber || `${entityName} Details`;
  const subtitle = data.code || data.sku || data.referenceNumber || data.id;
  const status = data.status || null;

  return (
    <div className="pb-12 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
              <Package size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{title}</h1>
                {status && (
                  <span className={`px-2.5 py-1 text-[8.8px] font-bold rounded uppercase tracking-wider ${
                    status === 'ACTIVE' || status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    status === 'INACTIVE' ? 'bg-rose-100 text-rose-800' :
                    'bg-zinc-100 text-zinc-700'
                  }`}>
                    {status}
                  </span>
                )}
              </div>
              {subtitle && subtitle !== title && (
                <p className="text-sm font-mono text-zinc-500 mt-1 flex items-center gap-1.5">
                  <Tag size={12} /> {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 mb-6">
        <div className="flex gap-6 px-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors relative ${
              activeTab === 'overview' ? 'text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <LayoutDashboard size={16} /> Overview
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 rounded-t-md"></span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors relative ${
              activeTab === 'audit' ? 'text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <FileText size={16} /> Audit Log
            {activeTab === 'audit' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 rounded-t-md"></span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold text-zinc-800 mb-6 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <List size={16} className="text-indigo-500" /> Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {Object.entries(data).map(([key, value]) => {
                  if (['id', 'companyId', 'items', 'lineItems', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(key)) return null;
                  if (typeof value === 'object' && value !== null) return null;
                  
                  return (
                    <div key={key} className="break-words">
                      <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{formatKey(key)}</dt>
                      <dd className="text-sm font-semibold text-zinc-900 break-all sm:break-words">
                        {formatValue(key, value)}
                      </dd>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nested Lists (e.g. lineItems) */}
            {((data.items && Array.isArray(data.items)) || (data.lineItems && Array.isArray(data.lineItems))) && (
              <div>
                <h3 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <Package size={16} className="text-indigo-500" /> Associated Items
                </h3>
                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[8.8px] uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">Item details</th>
                        <th className="px-6 py-4 font-bold text-right">Quantity</th>
                        <th className="px-6 py-4 font-bold text-right">Unit Price</th>
                        <th className="px-6 py-4 font-bold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {(data.items || data.lineItems).map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-zinc-800">
                            {item.productName || item.product?.productName || item.name || item.itemName || `Item ${idx + 1}`}
                          </td>
                          <td className="px-6 py-4 text-right text-zinc-600 font-medium">
                            {item.quantity || item.qty || item.requestedQuantity || item.transferredQuantity || 1}
                          </td>
                          <td className="px-6 py-4 text-right text-zinc-600">
                            ₹{parseFloat(item.unitPrice || item.rate || item.price || item.unitCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-zinc-900">
                            ₹{parseFloat(item.totalAmount || item.totalPrice || item.totalCost || item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-800 mb-6 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <FileText size={16} className="text-indigo-500" /> Record History
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Created At</dt>
                <dd className="text-sm font-semibold text-zinc-900">{formatValue('createdAt', data.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Created By</dt>
                <dd className="text-sm font-semibold text-zinc-900">{data.createdBy || 'System'}</dd>
              </div>
              <div>
                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Last Updated At</dt>
                <dd className="text-sm font-semibold text-zinc-900">{formatValue('updatedAt', data.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Last Updated By</dt>
                <dd className="text-sm font-semibold text-zinc-900">{data.updatedBy || 'System'}</dd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
