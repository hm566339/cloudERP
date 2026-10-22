import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, Building2, Globe, Calendar, Settings } from 'lucide-react';
import { addAlert } from '../../notifications/notificationSlice';
import { getCompanyModuleById } from '../../../api/sso/companyModules';
import SkeletonLoader from '../../../components/common/SkeletonLoader';
import StatusBadge from '../components/StatusBadge';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function CompanyModuleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useDispatch();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await getCompanyModuleById(id);
        setData(response);
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: 'Failed to load details' }));
        navigate(buildPath('/super-admin/company-modules'));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id, navigate, dispatch]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <SkeletonLoader count={1} height={60} />
        <SkeletonLoader count={3} height={200} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(buildPath('/super-admin/company-modules'))}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-xl transition-colors text-zinc-500 hover:text-zinc-900 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE]">Assignment Details</h1>
          <p className="text-sm text-zinc-500 dark:text-[#A0A6B5]">View detailed properties of this company module assignment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Card */}
        <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center gap-2 font-bold text-zinc-700 dark:text-[#E6E8EE]">
            <Building2 size={18} className="text-primary dark:text-[#4C8DFF]" />
            Company Information
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div className="flex items-center gap-4 mb-6">
              {data.company?.logoUrl ? (
                <img src={data.company.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-zinc-100 dark:border-[#2A2F3D]" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary dark:text-[#4C8DFF]">
                  <Building2 size={32} />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">{data.company?.companyName}</h3>
                <p className="text-zinc-500 dark:text-[#A0A6B5]">Code: {data.company?.companyCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">Legal Name</span>
                <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{data.company?.legalName || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">Company Type</span>
                <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{data.company?.companyType || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">GSTIN</span>
                <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{data.company?.gstin || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">PAN</span>
                <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{data.company?.pan || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">Email</span>
                <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{data.company?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">Phone</span>
                <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{data.company?.phone || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">Address</span>
                <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">
                  {data.company?.addressLine1} {data.company?.addressLine2 && `, ${data.company.addressLine2}`}
                  <br />
                  {data.company?.city}, {data.company?.state} {data.company?.postalCode} - {data.company?.country}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Module Card */}
          <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center gap-2 font-bold text-zinc-700 dark:text-[#E6E8EE]">
              <Globe size={18} className="text-indigo-500" />
              Module Information
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div className="col-span-2">
                  <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">Module Name</span>
                  <span className="font-bold text-lg text-zinc-900 dark:text-[#E6E8EE]">{data.module?.name}</span>
                </div>
                <div>
                  <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">Host</span>
                  <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{data.module?.host}</span>
                </div>
                <div>
                  <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">Module Status</span>
                  <StatusBadge active={data.module?.moduleStatus} activeText="Enabled" inactiveText="Disabled" />
                </div>
                <div className="col-span-2">
                  <span className="block text-zinc-400 dark:text-[#6B7184] text-xs mb-1">Client ID</span>
                  <span className="font-mono text-xs text-zinc-600 dark:text-[#A0A6B5] bg-zinc-50 dark:bg-[#1D212C] px-2 py-1 rounded border border-zinc-100 dark:border-[#2A2F3D]">
                    {data.module?.clientId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Status Card */}
          <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-[#1D212C] flex items-center gap-2 font-bold text-zinc-700 dark:text-[#E6E8EE]">
              <Settings size={18} className="text-emerald-500" />
              Assignment Details
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div className="col-span-2 flex items-center justify-between">
                  <span className="block text-zinc-400 dark:text-[#6B7184] text-xs">Assignment Status</span>
                  <StatusBadge active={data.active} />
                </div>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-[#A0A6B5]">
                  <Calendar size={14} />
                  <div>
                    <span className="block text-[8px] text-zinc-400 dark:text-[#6B7184]">Created At</span>
                    <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{new Date(data.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-[#A0A6B5]">
                  <Calendar size={14} />
                  <div>
                    <span className="block text-[8px] text-zinc-400 dark:text-[#6B7184]">Updated At</span>
                    <span className="font-medium text-zinc-800 dark:text-[#E6E8EE]">{new Date(data.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
