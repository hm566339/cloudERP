import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, MapPin, AlertCircle,
  Warehouse as WarehouseIcon, Trash2, LayoutDashboard, FileText
} from 'lucide-react';
import { 
  useWarehouseDetail, 
  useWarehouseDelete, 
  useWarehouseUpdate,
  WAREHOUSE_TYPES 
} from '../../../api/inventory';
import RequirePermission from '../../../components/common/RequirePermission';
import WarehouseFormModal from '../components/WarehouseFormModal';
import WarehouseLocationManagement from '../components/WarehouseLocationManagement';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { confirmDialog } from '../../../utils/confirmDialog';
import { useRoutePath } from '../../../hooks/useRoutePath';

export default function WarehouseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedRowId, setExpandedRowId] = React.useState(null);
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data
  const { warehouse, isLoading, error, refetch } = useWarehouseDetail(id);
  
  // Mutations
  const deleteWarehouse = useWarehouseDelete();
  const updateWarehouse = useWarehouseUpdate();

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: 'Delete Warehouse',
      message: 'Are you sure you want to delete this warehouse? This action cannot be undone.',
    });

    if (confirmed) {
      try {
        await deleteWarehouse.mutateAsync(id);
        dispatch(addAlert({ type: 'success', message: 'Warehouse deleted successfully' }));
        navigate('..', { relative: 'path' });
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete warehouse' }));
      }
    }
  };

  const handleEditSubmit = async (payload) => {
    try {
      await updateWarehouse.mutateAsync([payload.id, payload]);
      dispatch(addAlert({ type: 'success', message: 'Warehouse updated successfully' }));
      setIsEditModalOpen(false);
      refetch();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update warehouse' }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-zinc-200 dark:border-[#2A2F3D] border-t-zinc-900 dark:border-t-[#4C8DFF] rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-zinc-500 dark:text-[#A0A6B5]">Loading warehouse details...</p>
        </div>
      </div>
    );
  }

  if (error || !warehouse) {
    const errorMessage = error?.response?.status === 404 
      ? "Warehouse Not Found" 
      : (error?.message || "Warehouse Not Found");

    return (
      <div className="p-8 mt-6 max-w-lg mx-auto bg-white dark:bg-card-dark rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-sm text-center animate-fade-in">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">{errorMessage}</h2>
        <p className="text-sm text-zinc-500 mb-6">We couldn't find the requested warehouse record.</p>
        <button 
          onClick={() => navigate('..', { relative: 'path' })} 
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getTypeName = (val) => {
    return WAREHOUSE_TYPES.find(t => t.value === val)?.label || val;
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'audit', label: 'Audit Log', icon: FileText },
  ];

  return (
    <div className="animate-fade-in pb-12 bg-zinc-50/30 min-h-screen">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white dark:bg-card-dark border-b border-zinc-200 dark:border-border-dark shadow-sm pt-4 pb-0 mb-6">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('..', { relative: 'path' })}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                  <WarehouseIcon size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                      {warehouse.warehouseName}
                    </h1>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${
                      warehouse.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {warehouse.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-zinc-500 mt-0.5">Code: {warehouse.warehouseCode}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <RequirePermission module="INVENTORY" action="EDIT">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold transition-all shadow-2xs"
                >
                  <Edit2 size={16} /> Edit
                </button>
              </RequirePermission>
              
              <RequirePermission module="INVENTORY" action="DELETE">
                <button 
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-card-dark border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-semibold transition-all shadow-2xs"
                  title="Delete Warehouse"
                >
                  <Trash2 size={16} />
                </button>
              </RequirePermission>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto hide-scrollbar">
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-1 mr-8 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <Icon size={16} className={activeTab === tab.id ? 'text-primary' : 'text-zinc-400'} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
            
            {/* Basic Info Card */}
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]/50">
                <h3 className="font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                  <WarehouseIcon size={16} className="text-zinc-400" /> Basic Information
                </h3>
              </div>
              <div className="p-5">
                <dl className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                    <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Type</dt>
                    <dd className="col-span-2 text-sm font-medium text-zinc-900">{getTypeName(warehouse.warehouseType)}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                    <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</dt>
                    <dd className="col-span-2 text-sm font-medium text-zinc-900">{warehouse.warehouseName}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</dt>
                    <dd className="col-span-2 text-sm font-medium text-zinc-900">{warehouse.status || 'ACTIVE'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C]/50">
                <h3 className="font-semibold text-zinc-800 flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-zinc-400" /> Location Details
                </h3>
              </div>
              <div className="p-5">
                <dl className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                    <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Street</dt>
                    <dd className="col-span-2 text-sm text-zinc-900">
                      {warehouse.addressLine1}
                      {warehouse.addressLine2 && <><br/>{warehouse.addressLine2}</>}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                    <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">City/State</dt>
                    <dd className="col-span-2 text-sm text-zinc-900">{warehouse.city}, {warehouse.state}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-b border-zinc-50 pb-4">
                    <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Country</dt>
                    <dd className="col-span-2 text-sm text-zinc-900">{warehouse.country}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">PIN/Zip</dt>
                    <dd className="col-span-2 text-sm text-zinc-900">{warehouse.pinCode}</dd>
                  </div>
                </dl>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'locations' && (
          <div className="animate-slide-up">
            <WarehouseLocationManagement warehouseId={id} />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden p-6 animate-slide-up">
            <h3 className="font-semibold text-zinc-800 mb-6 text-sm">System Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Created At</p>
                <p className="text-sm text-zinc-900">{new Date(warehouse.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Created By</p>
                <p className="text-sm font-mono text-zinc-600">{warehouse.createdBy || 'System'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Last Updated</p>
                <p className="text-sm text-zinc-900">{new Date(warehouse.updatedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Last Updated By</p>
                <p className="text-sm font-mono text-zinc-600">{warehouse.updatedBy || 'System'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Record ID</p>
                <p className="text-sm font-mono text-zinc-600">{warehouse.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Version</p>
                <p className="text-sm text-zinc-900">{warehouse.version}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <WarehouseFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={warehouse}
      />
    </div>
  );
}
