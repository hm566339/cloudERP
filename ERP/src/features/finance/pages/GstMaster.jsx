import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, MapPin, BadgeCheck } from 'lucide-react';
import GstRegistrations from './GstRegistrations';
import GstStateMaster from './GstStateMaster';
import PageHeader from '../../../components/common/PageHeader';

export default function GstMaster() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'states' ? 'states' : 'registrations';

  const handleTabChange = (tab) => {
    setSearchParams(tab === 'registrations' ? {} : { tab });
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in">
      {/* Top Navigation Tabs */}
      <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center overflow-x-auto border-b border-zinc-200 dark:border-[#2A2F3D] hide-scrollbar px-4 pt-2">
          <button
            onClick={() => handleTabChange('registrations')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap transition-colors relative ${
              activeTab === 'registrations'
                ? 'text-indigo-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-blue-950/20 rounded-t-lg'
                : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#1D212C] hover:text-zinc-900 dark:hover:text-[#E6E8EE]'
            }`}
          >
            <Building2 size={15} />
            <span>GST Registrations</span>
            {activeTab === 'registrations' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-blue-500" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('states')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold whitespace-nowrap transition-colors relative ${
              activeTab === 'states'
                ? 'text-indigo-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-blue-950/20 rounded-t-lg'
                : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#1D212C] hover:text-zinc-900 dark:hover:text-[#E6E8EE]'
            }`}
          >
            <MapPin size={15} />
            <span>GST State Codes</span>
            {activeTab === 'states' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'registrations' ? <GstRegistrations /> : <GstStateMaster />}
      </div>
    </div>
  );
}

