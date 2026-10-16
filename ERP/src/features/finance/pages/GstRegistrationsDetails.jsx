import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Building, Briefcase, FileText, Calendar, CheckCircle } from 'lucide-react';
import { useGetGstRegistrationByIdQuery } from '../../../api/account/accounting.api';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function GstRegistrationsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const { data: responseData, isLoading, error } = useGetGstRegistrationByIdQuery(id);

  const data = responseData?.data || responseData;

  const getTypeBadge = (type) => {
    switch (type) {
      case 'REGULAR': return <span className="px-3 py-1 text-xs font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200">Regular</span>;
      case 'COMPOSITION': return <span className="px-3 py-1 text-xs font-semibold rounded-md border bg-purple-50 text-purple-700 border-purple-200">Composition</span>;
      case 'UNREGISTERED': return <span className="px-3 py-1 text-xs font-semibold rounded-md border bg-zinc-50 text-zinc-700 border-zinc-200">Unregistered</span>;
      default: return <span className="px-3 py-1 text-xs font-semibold rounded-md border bg-zinc-50 text-zinc-700 border-zinc-200">{type}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-zinc-50/50 gap-4">
        <div className="text-zinc-500 font-medium text-lg">Failed to load GST Registration details</div>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm pt-4 pb-4 mb-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2.5 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200 rounded-lg transition-colors shrink-0"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                    {data.legalName}
                  </h1>
                  {getTypeBadge(data.registrationType)}
                  {data.default && <CheckCircle size={20} className="text-emerald-600" title="Default Registration" />}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm font-medium text-zinc-500">
                  <span className="flex items-center gap-1.5"><MapPin size={14} /> {data.stateCode?.stateName || 'No State'} ({data.stateCode?.stateCode || '-'})</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-8 space-y-6">
        
        {/* Core Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-zinc-500 font-medium mb-1">
              <FileText size={16} />
              <span className="text-xs uppercase tracking-wider font-bold">GSTIN</span>
            </div>
            <p className="text-xl font-black text-zinc-900 break-all">{data.gstin || '-'}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-zinc-500 font-medium mb-1">
              <FileText size={16} />
              <span className="text-xs uppercase tracking-wider font-bold">PAN</span>
            </div>
            <p className="text-xl font-black text-zinc-900 uppercase">{data.pan || '-'}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-zinc-500 font-medium mb-1">
              <Briefcase size={16} />
              <span className="text-xs uppercase tracking-wider font-bold">Trade Name</span>
            </div>
            <p className="text-lg font-bold text-zinc-900 truncate" title={data.tradeName}>{data.tradeName || '-'}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-zinc-500 font-medium mb-1">
              <Calendar size={16} />
              <span className="text-xs uppercase tracking-wider font-bold">Registered Date</span>
            </div>
            <p className="text-lg font-bold text-zinc-900">{data.registeredDate || '-'}</p>
          </div>
        </div>

        {/* Association Info */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
            <Building size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">Association Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Building size={14} /> Company
              </p>
              <p className="text-base font-semibold text-zinc-900 mt-1">
                {data.company?.name || '-'}
                <span className="block text-xs font-normal text-zinc-400 mt-1 break-all">ID: {data.company?.id || '-'}</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={14} /> Branch
              </p>
              <p className="text-base font-semibold text-zinc-900 mt-1">
                {data.branch?.name || '-'}
                <span className="block text-xs font-normal text-zinc-400 mt-1 break-all">ID: {data.branch?.id || '-'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* State Details */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-500" />
            <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">State Code Configuration</h2>
          </div>
          <div className="p-6">
            {data.stateCode ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 flex flex-col justify-center">
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">State Code</p>
                  <p className="font-bold text-zinc-900">{data.stateCode.stateCode}</p>
                </div>
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 flex flex-col justify-center">
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">State Name</p>
                  <p className="font-bold text-zinc-900">{data.stateCode.stateName}</p>
                </div>
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 flex flex-col justify-center">
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Country Code</p>
                  <p className="font-bold text-zinc-900">{data.stateCode.countryCode || '-'}</p>
                </div>
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 flex flex-col justify-center">
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Union Territory</p>
                  <p className="font-bold text-zinc-900">{data.stateCode.unionTerritory ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">No state configuration associated with this registration.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
