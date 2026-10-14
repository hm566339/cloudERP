import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, AlertCircle, FileText, 
  Database, Info, Clock, CheckCircle2, Box, Package
} from 'lucide-react';
import apiClient from '../../../api/client';
import { copyToClipboard } from '../../../utils/clipboard';

/**
 * Generic Details Page
 * Dynamically fetches and renders the details of any inventory entity.
 * URL Pattern: /inventory/details/:entityType/:id
 */
export default function GenericDetailsPage() {
  const { entityType, id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!entityType || !id) return;
    
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    
    // Construct the endpoint, e.g. /api/inventory/products/123
    const endpoint = `/api/inventory/${entityType}/${id}`;
    
    apiClient.get(endpoint, { signal: controller.signal })
      .then(res => {
        const d = res.data;
        const unwrapped = d?.data || d;
        setData(unwrapped);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'CanceledError' || err.message === 'canceled') return;
        setError(err?.response?.data?.message || err.message || 'Failed to load details');
        setLoading(false);
      });

    return () => controller.abort();
  }, [entityType, id]);

  const formatKey = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const formatValue = (key, value) => {
    if (value === null || value === undefined) return <span className="text-zinc-400 italic">Not set</span>;
    
    if (Array.isArray(value)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8.8px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
          Array ({value.length} items)
        </span>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8.8px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
          Object
        </span>
      );
    }

    if (key.toLowerCase() === 'status' || value === 'ACTIVE' || value === 'INACTIVE') {
      const isPositive = value === 'ACTIVE' || value === 'COMPLETED' || value === 'CONFIRMED' || value === 'APPROVED';
      return (
        <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
          isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {value}
        </span>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8.8px] font-medium border ${value ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'}`}>
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
    
    if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('balance') || key.toLowerCase().includes('total') || key.toLowerCase().includes('price') || key.toLowerCase().includes('cost')) {
      const num = parseFloat(value);
      if (!isNaN(num)) return <span className="font-semibold text-zinc-800">₹{num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>;
    }
    
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-zinc-500">Loading details...</p>
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
        <p className="text-sm text-zinc-500 mb-6">{error || "We couldn't find the requested record."}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Derive title from entityType (e.g. 'products' -> 'Product', 'product-categories' -> 'Product Category')
  const title = entityType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').replace(/s$/, '');
  const mainName = data.name || data.productName || data.categoryName || data.warehouseName || data.title || `${title} Details`;
  const code = data.code || data.sku || data.referenceNo || data.batchNo || data.serialNo || data.id;
  const status = data.status || null;

  // Separate flat primitive fields from objects/arrays
  const primitives = Object.entries(data).filter(([_, v]) => v !== null && typeof v !== 'object');
  const complexObjects = Object.entries(data).filter(([_, v]) => v !== null && typeof v === 'object');

  // Split primitives into groups of 6 for cards
  const primitiveChunks = [];
  for (let i = 0; i < primitives.length; i += 6) {
    primitiveChunks.push(primitives.slice(i, i + 6));
  }

  return (
    <div className="pb-12 animate-fade-in">
      {/* Header Section */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5 mb-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors w-fit"
            >
              <ArrowLeft size={14} /> Back
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <Box size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{mainName}</h1>
                  {status && (
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[8.8px] font-bold uppercase tracking-wider border ${
                      status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {status}
                    </span>
                  )}
                </div>
                {code && (
                  <p className="text-sm font-mono text-zinc-500 mt-0.5 flex items-center gap-2">
                    <span className="text-[8px] uppercase tracking-wider font-sans font-bold text-zinc-400">ID / CODE:</span> {code}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="btn-secondary whitespace-nowrap" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'overview' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2"><Info size={16} /> Overview</div>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'raw' 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2"><Database size={16} /> Raw JSON</div>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Flat Data Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {primitiveChunks.map((chunk, index) => (
                <div key={index} className="card bg-white p-5">
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
                    <FileText size={16} className="text-zinc-400" />
                    <h3 className="text-sm font-bold text-zinc-800">
                      {index === 0 ? 'Basic Information' : \`Additional Details \${index + 1}\`}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-y-4">
                    {chunk.map(([k, v]) => (
                      <div key={k} className="grid grid-cols-3 gap-4 items-start">
                        <span className="text-[8.8px] font-bold text-zinc-500 uppercase tracking-wider pt-0.5 break-words">
                          {formatKey(k)}
                        </span>
                        <div className="col-span-2 text-sm text-zinc-900 font-medium break-words">
                          {formatValue(k, v)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Complex Objects / Arrays */}
            {complexObjects.length > 0 && (
              <>
                <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <Database size={18} className="text-indigo-600" />
                  Related Data & Collections
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {complexObjects.map(([k, v]) => (
                    <div key={k} className="card bg-zinc-50/50 p-5 overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wider">{formatKey(k)}</h4>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                          {Array.isArray(v) ? 'List' : 'Object'}
                        </span>
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-lg p-3 max-h-60 overflow-y-auto custom-scrollbar">
                        <pre className="text-[8.8px] text-zinc-700 font-mono whitespace-pre-wrap break-all">
                          {JSON.stringify(v, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="card overflow-hidden">
              <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Database size={16} />
                  <span className="text-xs font-mono">Response Payload</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(JSON.stringify(data, null, 2)).catch(() => {})}
                  className="text-[8px] uppercase tracking-wider font-bold text-zinc-400 hover:text-white transition-colors border border-zinc-700 px-2 py-1 rounded"
                >
                  Copy JSON
                </button>
              </div>
              <div className="bg-[#1e1e1e] p-6 overflow-x-auto">
                <pre className="text-[10.4px] text-emerald-400 font-mono leading-relaxed">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
