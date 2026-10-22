import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Calendar, Activity, Info, BarChart } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApi';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { hsnSacMasterApi } from '../../../api/account';
import { DetailsSkeleton } from '../../../components/common/SkeletonLoader';

const HsnSacDetails = () => {
  const { buildPath } = useRoutePath();
  const { id } = useParams();

  const { data, isLoading, error, refetch } = useApiQuery(hsnSacMasterApi.getHsnSacById, id);

  if (isLoading) return <DetailsSkeleton />;

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2>Failed to load HSN/SAC details.</h2>
        <p className="text-sm mt-2">{error?.response?.data?.message || error?.message || 'Unknown error occurred.'}</p>
        <button onClick={() => refetch()} className="btn-secondary mt-4">Retry</button>
      </div>
    );
  }

  const item = data?.data || data;

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 dark:bg-[#0F1117] min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#161922] border-b border-zinc-200 dark:border-[#2A2F3D] shadow-sm pt-4 pb-4 mb-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="flex items-center gap-4">
              <Link 
                to={buildPath("/accounts/masters/hsn-sac")} 
                className="p-2.5 bg-zinc-50 dark:bg-[#1D212C] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#222736] hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-[#2A2F3D] rounded-lg transition-colors shrink-0"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-zinc-900 dark:text-[#E6E8EE] tracking-tight flex items-center gap-2">
                    <Tag size={24} className="text-blue-600 dark:text-[#4C8DFF]" />
                    {item.code}
                  </h1>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border ${
                    item.deleted ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' : 'bg-green-50 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-400 border-green-200 dark:border-emerald-900/50'
                  }`}>
                    {item.deleted ? 'Deleted' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  <span>Type: {item.type}</span>
                  <span className="w-1 h-1 rounded-lg bg-zinc-300 dark:bg-zinc-700"></span>
                  <span>GST Slab: {item.gstSlabName || 'N/A'}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/50 flex items-center gap-2">
              <Info size={18} className="text-blue-500 dark:text-[#4C8DFF]" />
              <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Basic Information</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Code</p>
                <p className="font-mono text-base font-bold text-zinc-900 dark:text-[#E6E8EE]">{item.code}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Type</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                  item.type === 'HSN' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50'
                }`}>
                  {item.type}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D]">{item.description}</p>
              </div>
            </div>
          </div>

          {/* GST Information */}
          <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/50 flex items-center gap-2">
              <BarChart size={18} className="text-emerald-500 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">GST Information</h2>
            </div>
            <div className="p-5">
              <div className="mb-4 pb-4 border-b border-zinc-100 dark:border-[#2A2F3D]">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Linked GST Slab</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">{item.gstSlabName || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D] flex flex-col justify-center">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">CGST Rate</p>
                  <p className="font-mono text-xl font-black text-zinc-800 dark:text-[#E6E8EE]">{item.cgstRate != null ? `${item.cgstRate}%` : '-'}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D] flex flex-col justify-center">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">SGST Rate</p>
                  <p className="font-mono text-xl font-black text-zinc-800 dark:text-[#E6E8EE]">{item.sgstRate != null ? `${item.sgstRate}%` : '-'}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D] flex flex-col justify-center">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">IGST Rate</p>
                  <p className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">{item.igstRate != null ? `${item.igstRate}%` : '-'}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-[#1D212C] p-3 rounded-lg border border-zinc-100 dark:border-[#2A2F3D] flex flex-col justify-center">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">CESS Rate</p>
                  <p className="font-mono text-xl font-black text-zinc-800 dark:text-[#E6E8EE]">{item.cessRate != null ? `${item.cessRate}%` : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/50 flex items-center gap-2">
              <Activity size={18} className="text-purple-500 dark:text-purple-400" />
              <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Usage Statistics</h2>
            </div>
            <div className="p-5 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/40">
                <p className="text-3xl font-black text-purple-700 dark:text-purple-400">{item.itemMappingCount || 0}</p>
                <p className="text-[8.8px] font-bold text-purple-600/70 dark:text-purple-400/80 uppercase tracking-wider mt-2">Item Mappings</p>
              </div>
              <div className="text-center p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{item.invoiceUsageCount || 0}</p>
                <p className="text-[8.8px] font-bold text-blue-600/70 dark:text-blue-400/80 uppercase tracking-wider mt-2">Invoice Usages</p>
              </div>
              <div className="text-center p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{item.taxTransactionCount || 0}</p>
                <p className="text-[8.8px] font-bold text-emerald-600/70 dark:text-emerald-400/80 uppercase tracking-wider mt-2">Tax Txns</p>
              </div>
            </div>
          </div>

          {/* Audit Info */}
          <div className="bg-white dark:bg-[#161922] rounded-xl shadow-sm border border-zinc-200 dark:border-[#2A2F3D] overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C]/50 flex items-center gap-2">
              <Calendar size={18} className="text-orange-500 dark:text-orange-400" />
              <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Audit Information</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-[#2A2F3D]">
                <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Created At</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Updated At</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HsnSacDetails;
