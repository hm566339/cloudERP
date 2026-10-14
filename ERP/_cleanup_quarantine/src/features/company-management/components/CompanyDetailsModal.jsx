import React from "react";
import { Building2, X, Edit, Info, Mail, Phone, MapPin, Shield, Calendar, Trash2, Loader2, Users, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { useGetCompanyByIdQuery } from '../../../api/sso';

export default function CompanyDetailsModal({ isOpen, onClose, tenant: initialTenant, onEdit, onDelete, onToggleStatus, onAssignModules, onManageUsers }) {
  const { data: fetchedTenant, isLoading } = useGetCompanyByIdQuery(initialTenant?.id || initialTenant?.code, {
    skip: !isOpen || !(initialTenant?.id || initialTenant?.code)
  });

  const tenant = fetchedTenant || initialTenant;

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="card max-w-4xl w-full p-0 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 min-w-[44.8px] rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner overflow-hidden border border-indigo-200">
              {tenant.logoUrl || tenant.logo ? (
                <img 
                  src={tenant.logoUrl || tenant.logo} 
                  alt={tenant.name} 
                  className="w-full h-full object-cover text-[6.4px] text-center" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <Building2 size={28} className={tenant.logoUrl || tenant.logo ? "hidden" : "block"} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{tenant.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-[8.8px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md border border-slate-300">
                  {tenant.code}
                </span>
                <span className={`badge text-[8.8px] px-2 py-0.5 ${tenant.active ? 'badge-success' : 'badge-danger'}`}>
                  {tenant.active ? "Active" : "Suspended"}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 relative min-h-[160px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          )}
          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Company Info */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600"><Info size={16} /></div>
                Company Information
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Legal Name</div>
                  <div className="font-medium text-slate-900">{tenant.legalName || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Company Type</div>
                  <div className="font-medium text-slate-900">{tenant.companyType || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Domain</div>
                  <div className="font-medium text-slate-900">{tenant.domain || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Base Currency</div>
                  <div className="font-medium text-slate-900">{tenant.baseCurrency || "INR"}</div>
                </div>
              </div>
            </div>

            {/* Tax & Registration */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600"><Shield size={16} /></div>
                Legal & Tax Details
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">GSTIN</div>
                  <div className="font-mono font-medium text-slate-900">{tenant.gstin || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">PAN</div>
                  <div className="font-mono font-medium text-slate-900">{tenant.pan || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Provision Date</div>
                  <div className="font-medium text-slate-900">{tenant.created || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Updated Date</div>
                  <div className="font-medium text-slate-900">{tenant.updated || "-"}</div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><Phone size={16} /></div>
                Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Mail size={12}/> Email</div>
                  <div className="font-medium text-slate-900">{tenant.email || "-"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Phone size={12}/> Phone</div>
                  <div className="font-medium text-slate-900">{tenant.phone || "-"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">Website</div>
                  <div className="font-medium text-blue-600 hover:underline">
                    {tenant.website ? <a href={tenant.website.startsWith('http') ? tenant.website : `https://${tenant.website}`} target="_blank" rel="noreferrer">{tenant.website}</a> : "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600"><MapPin size={16} /></div>
                Address Details
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Address Line 1</div>
                  <div className="font-medium text-slate-900">{tenant.address || "-"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Address Line 2</div>
                  <div className="font-medium text-slate-900">{tenant.addressLine2 || "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">City / State</div>
                  <div className="font-medium text-slate-900">
                    {[tenant.city, tenant.state].filter(Boolean).join(", ") || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Country / Postal</div>
                  <div className="font-medium text-slate-900">
                    {[tenant.country, tenant.postalCode].filter(Boolean).join(" - ") || "-"}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {onDelete && (
              <button
                onClick={() => {
                  onClose();
                  onDelete(tenant.id, tenant.name);
                }}
                className="btn-danger flex items-center gap-2"
                title="Decommission Tenant"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            {onToggleStatus && (
              <button
                onClick={() => onToggleStatus(tenant.id, tenant.active)}
                className={`btn flex items-center gap-2 border ${tenant.active ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                title={tenant.active ? "Suspend Tenant" : "Activate Tenant"}
              >
                {tenant.active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                <span className="hidden sm:inline">{tenant.active ? "Suspend" : "Activate"}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-ghost">
              Close
            </button>
            {onManageUsers && (
              <button
                onClick={onManageUsers}
                className="btn border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                title="Manage Users"
              >
                <Users size={16} />
                <span className="hidden sm:inline">Users</span>
              </button>
            )}
            {onAssignModules && (
              <button
                onClick={onAssignModules}
                className="btn border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-2"
                title="Assign Modules"
              >
                <ShieldAlert size={16} />
                <span className="hidden sm:inline">Modules</span>
              </button>
            )}
            <button 
              onClick={() => {
                onClose();
                onEdit(tenant);
              }} 
              className="btn-primary flex items-center gap-2"
            >
              <Edit size={16} />
              <span className="hidden sm:inline">Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
