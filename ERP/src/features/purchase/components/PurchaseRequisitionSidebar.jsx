import React from 'react';
import { RefreshCw } from 'lucide-react';
import CustomSelect from '../../../components/common/CustomSelect';

export default function PurchaseRequisitionSidebar({
  formData,
  handleFieldChange,
  errors,
  items,
  meUserId,
  meDisplayName,
  isMeLoading,
  requesterError,
}) {
  const sidebarCard = 'flex-none border border-zinc-200 dark:border-[#2A2F3D] rounded-lg p-2.5 bg-white dark:bg-[#161922] shadow-2xs space-y-1.5';
  const cardHead = 'flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-[#2A2F3D]';
  const cardTitle = 'text-[8px] font-bold text-zinc-800 dark:text-[#E6E8EE] uppercase tracking-wider';
  const label = 'text-[8px] font-semibold text-zinc-700 dark:text-[#A0A6B5] block mb-1';
  const field = (hasErr = false) =>
    `input-field w-full h-8 text-[8.8px] text-zinc-700 dark:text-[#E6E8EE] bg-white dark:bg-[#1D212C] dark:border-[#2A2F3D] ${hasErr ? 'border-rose-300' : ''}`;
  const errText = 'text-[7.2px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium';

  return (
    <div className="w-full lg:w-[300px] xl:w-[320px] flex-none p-2.5 sm:p-3 bg-zinc-50/40 dark:bg-[#0F1117] overflow-y-auto overflow-x-hidden sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-2.5 sm:gap-3">
      {/* 1. REQUISITION INFORMATION */}
      <div className={sidebarCard}>
        <div className={cardHead}>
          <h3 className={cardTitle}>Requisition Information</h3>
        </div>
        <div className="space-y-2">
          <div>
            <label className={label}>Requester Name</label>
            <div className="relative">
              <input
                type="text"
                value={meUserId ? meDisplayName : ''}
                readOnly
                disabled
                placeholder={isMeLoading ? 'Loading user...' : 'Requester'}
                className={`${field(errors.requesterId)} cursor-not-allowed bg-zinc-50 dark:bg-[#161922] text-zinc-500 dark:text-[#6B7184]`}
              />
              {isMeLoading && (
                <RefreshCw size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#6B7184] animate-spin" />
              )}
            </div>
            {requesterError && (
              <p className={errText}>Unable to load current user. You cannot save until user data is available.</p>
            )}
          </div>
          <div>
            <label className={label}>Requisition Name *</label>
            <input
              type="text"
              value={formData.requisitionName}
              onChange={(e) => handleFieldChange('requisitionName', e.target.value)}
              placeholder="Enter requisition name"
              className={field(errors.requisitionName)}
            />
            {errors.requisitionName && <p className={errText}>{errors.requisitionName}</p>}
          </div>
          <div>
            <label className={label}>Required Date *</label>
            <input
              type="date"
              value={formData.requiredDate}
              onChange={(e) => handleFieldChange('requiredDate', e.target.value)}
              className={field(errors.requiredDate)}
            />
            {errors.requiredDate && <p className={errText}>{errors.requiredDate}</p>}
          </div>
          <div>
            <label className={label}>Department ID</label>
            <input
              type="text"
              value={formData.departmentId}
              onChange={(e) => handleFieldChange('departmentId', e.target.value)}
              placeholder="Enter department ID"
              className={field()}
            />
          </div>
          <div>
            <label className={label}>Priority *</label>
            <CustomSelect
              value={formData.priority}
              onChange={(e) => handleFieldChange('priority', e.target.value)}
              className={field(errors.priority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </CustomSelect>
            {errors.priority && <p className={errText}>{errors.priority}</p>}
          </div>
          <div>
            <label className={label}>Purpose *</label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => handleFieldChange('purpose', e.target.value)}
              placeholder="Enter purpose"
              className={field(errors.purpose)}
            />
            {errors.purpose && <p className={errText}>{errors.purpose}</p>}
          </div>
          <div>
            <label className={label}>Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => handleFieldChange('remarks', e.target.value)}
              placeholder="Additional remarks or notes"
              rows={3}
              className={`${field()} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* 2. COST CENTER */}
      <div className={sidebarCard}>
        <div className={cardHead}>
          <h3 className={cardTitle}>Cost Center</h3>
        </div>
        <div className="space-y-2">
          <div>
            <label className={label}>Cost Center ID</label>
            <input
              type="text"
              value={formData.costCenterId}
              onChange={(e) => handleFieldChange('costCenterId', e.target.value)}
              placeholder="Enter cost center ID"
              className={field()}
            />
          </div>
          <div>
            <label className={label}>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="Select location"
              className={field()}
            />
          </div>
        </div>
      </div>

      {/* 3. REQUEST DETAILS */}
      <div className={sidebarCard}>
        <div className={cardHead}>
          <h3 className={cardTitle}>Request Details</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[9.6px]">
            <span className="text-zinc-600 dark:text-[#A0A6B5] font-medium">Total Items</span>
            <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">{items.length}</span>
          </div>
          <div className="flex justify-between items-center text-[9.6px]">
            <span className="text-zinc-600 dark:text-[#A0A6B5] font-medium">Pending Approval</span>
            <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE]">0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
