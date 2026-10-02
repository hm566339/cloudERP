import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, MapPin, Building2, Map, Clock, ShieldCheck, FileText } from 'lucide-react';
import { useGetGstStateByIdQuery } from '../../../api/account/accounting.api';
import { format } from 'date-fns';
import { useRoutePath } from "../../../hooks/useRoutePath";

const SummaryCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
    <div className="flex justify-between items-start mb-2">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{title}</p>
      {Icon && <Icon size={16} className="text-zinc-400" />}
    </div>
    <p className={`text-xl font-black ${colorClass || 'text-zinc-900'} truncate`} title={value}>
      {value || '-'}
    </p>
  </div>
);

const DetailSection = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
    <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
      {Icon && <Icon size={18} className="text-blue-500" />}
      <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">{title}</h2>
    </div>
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {children}
    </div>
  </div>
);

const ReadOnlyField = ({ label, value, isBoolean }) => {
  let displayValue = value || '-';
  if (isBoolean) {
    displayValue = value ? 'Yes' : 'No';
  }
  return (
    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 flex flex-col justify-center">
      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-sm font-bold text-zinc-900">{displayValue}</p>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="flex flex-col min-h-screen bg-zinc-50/50">
    <div className="h-24 bg-white border-b border-zinc-200 animate-pulse" />
    <div className="p-6 max-w-[1280px] mx-auto w-full space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-zinc-200 rounded-xl animate-pulse" />)}
      </div>
      <div className="h-48 bg-zinc-200 rounded-xl animate-pulse" />
      <div className="h-48 bg-zinc-200 rounded-xl animate-pulse" />
    </div>
  </div>
);

const ErrorState = ({ onRetry }) => (
  <div className="flex flex-col min-h-screen bg-zinc-50/50 items-center justify-center p-6">
    <div className="bg-white p-8 rounded-xl shadow-sm border border-zinc-200 flex flex-col items-center max-w-md w-full text-center">
      <ShieldCheck size={48} className="text-red-400 mb-4" />
      <h3 className="text-lg font-bold text-zinc-900 mb-2">Unable to load GST State details.</h3>
      <p className="text-sm text-zinc-500 mb-6">There was a problem fetching the data from the server.</p>
      <button onClick={onRetry} className="btn-primary w-full">Retry</button>
    </div>
  </div>
);

const EmptyState = ({ onBack }) => (
  <div className="flex flex-col min-h-screen bg-zinc-50/50 items-center justify-center p-6">
    <div className="bg-white p-8 rounded-xl shadow-sm border border-zinc-200 flex flex-col items-center max-w-md w-full text-center">
      <MapPin size={48} className="text-zinc-300 mb-4" />
      <h3 className="text-lg font-bold text-zinc-900 mb-2">GST State not found.</h3>
      <p className="text-sm text-zinc-500 mb-6">The requested state code might have been deleted or does not exist.</p>
      <button onClick={onBack} className="btn-secondary w-full">Go Back</button>
    </div>
  </div>
);

export default function GstStateMasterDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  
  const companyId = JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
  
  const { data: apiResponse, isLoading, isError, refetch, isFetching } = useGetGstStateByIdQuery(
    { id, companyId },
    { skip: !id }
  );

  const stateData = useMemo(() => {
    if (!apiResponse) return null;
    return apiResponse.data || apiResponse;
  }, [apiResponse]);

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!stateData) return <EmptyState onBack={() => navigate(buildPath('/accounts/tax/gst-state-master'))} />;

  const formatTimestamp = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy hh:mm a');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm pt-4 pb-4 mb-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(buildPath('/accounts/tax/gst-state-master'))}
                className="p-2.5 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200 rounded-lg transition-colors shrink-0"
                title="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                    GST State Details
                  </h1>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm font-medium text-zinc-500">
                  <span className="flex items-center gap-1.5">Complete GST State Profile for {stateData.state?.stateName || '-'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => navigate(buildPath('/accounts/tax/gst-state-master'))} className="btn-secondary">
                Back
              </button>
              <button onClick={refetch} className="btn-secondary flex items-center gap-2">
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 mt-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard title="State Code" value={stateData.state?.stateCode} icon={FileText} colorClass="text-zinc-900" />
          <SummaryCard title="State Name" value={stateData.state?.stateName} icon={MapPin} colorClass="text-blue-600" />
          <SummaryCard title="Country" value={stateData.country?.countryCode || 'IN'} icon={Map} colorClass="text-emerald-600" />
          <SummaryCard 
            title="Registration Allowed" 
            value={stateData.gstInformation?.registrationAllowed !== false ? 'Yes' : 'No'} 
            icon={ShieldCheck} 
            colorClass={stateData.gstInformation?.registrationAllowed !== false ? 'text-emerald-600' : 'text-rose-600'} 
          />
        </div>

        {/* Section 1: State Information */}
        <DetailSection title="State Information" icon={MapPin}>
          <ReadOnlyField label="State Code" value={stateData.state?.stateCode} />
          <ReadOnlyField label="State Name" value={stateData.state?.stateName} />
          <ReadOnlyField label="Short Name" value={stateData.state?.shortName || stateData.state?.displayName} />
          <ReadOnlyField label="ISO State Code" value={stateData.state?.isoStateCode || stateData.state?.stateCode} />
          <ReadOnlyField label="Union Territory" value={stateData.state?.unionTerritory} isBoolean />
          <ReadOnlyField label="Capital City" value={stateData.state?.capitalCity} />
          <ReadOnlyField label="Region" value={stateData.state?.region} />
        </DetailSection>

        {/* Section 2: Country Information */}
        <DetailSection title="Country Information" icon={Map}>
          <ReadOnlyField label="Country Code" value={stateData.country?.countryCode || 'IN'} />
          <ReadOnlyField label="Country Name" value={stateData.country?.countryName || 'India'} />
          <ReadOnlyField label="ISO Country Code" value={stateData.country?.isoCountryCode || stateData.country?.countryCode || 'IN'} />
        </DetailSection>

        {/* Section 3: GST Information */}
        <DetailSection title="GST Information" icon={Building2}>
          <ReadOnlyField label="GST State Code" value={stateData.gstInformation?.gstStateCode || stateData.state?.stateCode} />
          <ReadOnlyField label="GST State Name" value={stateData.gstInformation?.gstStateName || stateData.state?.stateName} />
          <ReadOnlyField label="Registration Allowed" value={stateData.gstInformation?.registrationAllowed !== false} isBoolean />
          <ReadOnlyField label="Default Place Of Supply" value={stateData.gstInformation?.defaultPlaceOfSupply || stateData.state?.stateName} />
          <ReadOnlyField label="Reverse Charge Applicable" value={stateData.gstInformation?.reverseChargeApplicable} isBoolean />
        </DetailSection>

        {/* Section 4: Address Metadata */}
        <DetailSection title="Address Metadata" icon={FileText}>
          <ReadOnlyField label="Capital City" value={stateData.addressMetadata?.capitalCity} />
          <ReadOnlyField label="Region" value={stateData.addressMetadata?.region} />
          <ReadOnlyField label="Time Zone" value={stateData.addressMetadata?.timeZone || 'IST (UTC+5:30)'} />
          <ReadOnlyField label="Currency Code" value={stateData.addressMetadata?.currencyCode || 'INR'} />
          <ReadOnlyField label="Currency Name" value={stateData.addressMetadata?.currencyName || 'Indian Rupee'} />
        </DetailSection>

        {/* Section 5: Audit Information */}
        <DetailSection title="Audit Information" icon={Clock}>
          <ReadOnlyField label="Created By" value={stateData.audit?.createdBy} />
          <ReadOnlyField label="Created At" value={formatTimestamp(stateData.audit?.createdAt)} />
          <ReadOnlyField label="Updated By" value={stateData.audit?.updatedBy} />
          <ReadOnlyField label="Updated At" value={formatTimestamp(stateData.audit?.updatedAt)} />
          <ReadOnlyField label="Deleted" value={stateData.audit?.isDeleted || stateData.audit?.deleted} isBoolean />
        </DetailSection>
      </div>
    </div>
  );
}
