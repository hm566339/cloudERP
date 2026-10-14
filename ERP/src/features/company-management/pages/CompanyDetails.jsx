import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Edit, Trash2, ShieldAlert, CheckCircle, XCircle, 
  Users, Info, Mail, Phone, MapPin, Shield, Calendar, Loader2, Plus, Layers,
  CheckCircle2, AlertCircle, X, ExternalLink, Globe
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { setSelectedCompany } from '../companySlice';
import { 
  useGetCompanyByIdQuery,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  useUpdateCompanyStatusMutation
} from '../../../api/sso';
import { useGetModulesQuery } from '../../../api/sso';
import {
  useGetCompanyModulesQuery,
  useGetCompanyModulesByCompanyIdQuery,
  useCreateCompanyModuleMutation,
  useDeleteCompanyModuleMutation,
  useUpdateCompanyModuleStatusMutation
} from '../../../api/sso';

import CompanyCreateEditModal from '../components/CompanyCreateEditModal';
import CompanyAssignModulesModal from '../components/CompanyAssignModulesModal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isOwnerPortal = location.pathname.startsWith('/owner');
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  
  const { data: tenant, isLoading, isError, refetch } = useGetCompanyByIdQuery(id);
  
  const [updateCompanyStatus] = useUpdateCompanyStatusMutation();
  const [deleteCompany] = useDeleteCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();

  const [createCompanyModule] = useCreateCompanyModuleMutation();
  const [deleteCompanyModule] = useDeleteCompanyModuleMutation();
  const [updateCompanyModuleStatus] = useUpdateCompanyModuleStatusMutation();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModulesOpen, setIsAssignModulesOpen] = useState(false);
  const [assignTenant, setAssignTenant] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);

  // Form State for edit
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState("");
  const [legalName, setLegalName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [gst, setGst] = useState("");
  const [pan, setPan] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [logo, setLogo] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("INR");
  const [status, setStatus] = useState("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState("");

  // Always fetch modules and company modules for displaying in the new UI
  const { data: modulesData, isLoading: modulesLoading } = useGetModulesQuery(
    { page: 0, pageSize: 1000 },
    { skip: !tenant?.id }
  );
  
  const { data: companyModulesData, isLoading: companyModulesLoading } = useGetCompanyModulesByCompanyIdQuery(
    { companyId: tenant?.id },
    { skip: !tenant?.id }
  );

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center h-full w-full">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="p-12 text-center text-slate-500 card">
        <Building2 size={32} className="mx-auto mb-4 text-slate-300" />
        <p>Error loading company details or company not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 btn-secondary mx-auto">Go Back</button>
      </div>
    );
  }

  const handleToggleStatus = async () => {
    try {
      await updateCompanyStatus({ id: tenant.id, active: !tenant.active }).unwrap();
      dispatch(addAlert({ type: "success", message: "Company status updated" }));

    } catch (error) {
      dispatch(addAlert({ type: "error", message: "Failed to update company status" }));
    }
  };

  const handleOpenDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeletingCompany) return;
    setIsDeletingCompany(true);
    try {
      await deleteCompany(tenant.id).unwrap();
      dispatch(addAlert({ type: "success", message: `Company deleted permanently.` }));
      setDeleteConfirmOpen(false);
      navigate(isOwnerPortal ? '/owner/companies' : buildPath("/super-admin/companies"));
    } catch (error) {
      dispatch(addAlert({ type: "error", message: error?.data?.message || "Failed to delete company" }));
      setIsDeletingCompany(false);
    }
  };

  const handleCancelDelete = () => {
    if (!isDeletingCompany) {
      setDeleteConfirmOpen(false);
    }
  };

  const handleOpenEdit = () => {
    setEditFormError("");
    setEditingId(tenant.id);
    setName(tenant.name || "");
    setCode(tenant.code || "");
    setDomain(tenant.domain || "");
    setLegalName(tenant.legalName || "");
    setCompanyType(tenant.companyType || "");
    setGst(tenant.gstin || "");
    setPan(tenant.pan || "");
    setEmail(tenant.email || "");
    setPhone(tenant.phone || "");
    setWebsite(tenant.website || "");
    setAddress(tenant.address || "");
    setAddressLine2(tenant.addressLine2 || "");
    setCity(tenant.city || "");
    setState(tenant.state || "");
    setCountry(tenant.country || "");
    setPostalCode(tenant.postalCode || "");
    setLogo(tenant.logoUrl || tenant.logo || "");
    setModuleId(tenant.modulesid || "");
    setBaseCurrency(tenant.baseCurrency || "INR");
    setStatus(tenant.active ? "Active" : "Inactive");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setEditFormError("");

    if (!name?.trim() || !code?.trim() || !domain?.trim()) {
      const msg = "Please complete all required fields (Company Code, Company Name, Domain)";
      setEditFormError(msg);
      dispatch(addAlert({ type: "warning", message: msg }));
      return;
    }

    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      const msg = "Please enter a valid email address";
      setEditFormError(msg);
      dispatch(addAlert({ type: "warning", message: msg }));
      return;
    }

    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (phone && phone.trim()) {
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        const msg = "Phone number must contain 10 to 15 digits (e.g. 9876543210 or +91 98765 43210)";
        setEditFormError(msg);
        dispatch(addAlert({ type: "warning", message: msg }));
        return;
      }
    }

    if (gst && gst.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.trim().toUpperCase())) {
      const msg = "Please enter a valid 15-character GSTIN (e.g. 07ABCDE1234F1Z5)";
      setEditFormError(msg);
      dispatch(addAlert({ type: "warning", message: msg }));
      return;
    }

    if (pan && pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase())) {
      const msg = "Please enter a valid PAN (e.g. ABCDE1234F)";
      setEditFormError(msg);
      dispatch(addAlert({ type: "warning", message: msg }));
      return;
    }

    if (website && website.trim()) {
      try {
        const urlToTest = website.startsWith("http://") || website.startsWith("https://")
          ? website.trim()
          : `https://${website.trim()}`;
        new URL(urlToTest);
      } catch {
        const msg = "Please enter a valid website URL (e.g. https://www.markenterprises.com)";
        setEditFormError(msg);
        dispatch(addAlert({ type: "warning", message: msg }));
        return;
      }
    }

    const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim().toLowerCase();

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        domain: cleanDomain,
        legalName: legalName ? legalName.trim() : undefined,
        companyType: companyType || undefined,
        gstin: gst && gst.trim() ? gst.trim().toUpperCase() : undefined,
        pan: pan && pan.trim() ? pan.trim().toUpperCase() : undefined,
        email: email ? email.trim() : undefined,
        phone: cleanPhone || undefined,
        website: website ? website.trim() : undefined,
        address: address ? address.trim() : undefined,
        addressLine2: addressLine2 ? addressLine2.trim() : undefined,
        city: city ? city.trim() : undefined,
        state: state ? state.trim() : undefined,
        country: country ? country.trim() : undefined,
        postalCode: postalCode ? postalCode.trim() : undefined,
        logo: logo || undefined,
        modulesid: moduleId || undefined,
        baseCurrency: baseCurrency || "INR",
        active: status === "Active"
      };

      await updateCompany({ id: editingId, ...payload }).unwrap();
      dispatch(addAlert({ type: "success", message: `Company "${name}" updated successfully` }));
      setIsEditModalOpen(false);

    } catch (error) {
      const errMessage = error?.data?.message || error?.message || "Failed to save company";
      setEditFormError(errMessage);
      dispatch(addAlert({ type: "error", message: errMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAssign = async (m, isAssigned, assignedCompanyModule) => {
    try {
      if (isAssigned) {
        await deleteCompanyModule(assignedCompanyModule.id).unwrap();
        dispatch(addAlert({ type: "success", message: `Removed ${m.name} from ${tenant.name}` }));
      } else {
        await createCompanyModule({
          company: tenant.id,
          module: m.moduleId || m.id
        }).unwrap();
        dispatch(addAlert({ type: "success", message: `Assigned ${m.name} to ${tenant.name}` }));
      }
    } catch (error) {
      dispatch(addAlert({ type: "error", message: "Failed to update module assignment" }));
    }
  };

  const handleToggleModuleStatus = async (cm) => {
    try {
      const newStatus = !cm.status;
      
      await updateCompanyModuleStatus({ id: cm.id, active: newStatus }).unwrap();
      

      dispatch(addAlert({ 
        type: "success", 
        message: `Module status updated to ${newStatus ? 'Active' : 'Inactive'}` 
      }));
    } catch (error) {
      console.error("Status update error details:", {
        status: error?.status,
        statusText: error?.statusText,
        data: error?.data,
        message: error?.message,
        fullError: error
      });
      
      let errorMessage = "Failed to update module status";
      
      if (error?.status === 403) {
        errorMessage = "You don't have permission to update this module status. Please contact your administrator.";
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      dispatch(addAlert({ 
        type: "error", 
        message: errorMessage 
      }));
    }
  };

  const handleUnassignModule = async (cm) => {
    if (!window.confirm(`Are you sure you want to unassign this module? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCompanyModule(cm.id).unwrap();
      
      dispatch(addAlert({ 
        type: "success", 
        message: `Module unassigned successfully` 
      }));
    } catch (error) {
      console.error("Unassign error details:", {
        status: error?.status,
        data: error?.data,
        message: error?.message,
        fullError: error
      });
      
      let errorMessage = "Failed to unassign module";
      
      if (error?.status === 403) {
        errorMessage = "You don't have permission to unassign this module.";
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      dispatch(addAlert({ 
        type: "error", 
        message: errorMessage 
      }));
    }
  };

  const handleOpenAssignModules = () => {
    setAssignTenant(tenant);
    setIsAssignModulesOpen(true);
  };

  // Calculate assigned modules
  const companyModules = Array.isArray(companyModulesData) ? companyModulesData : (companyModulesData?.data || []);
  
  // The API returns the assigned modules directly with all module details
  const assignedModulesList = companyModules.map(m => ({
    id: m.id,
    name: m.name,
    host: m.host,
    apiPattern: m.host,
    status: m.status,
    companyModule: m,
    isAssigned: true,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt
  }));

  return (
    <div className="w-full max-w-none px-6 sm:px-8 py-6 space-y-6 animate-fade-in pb-12">
      {/* Header Area */}
      <div className="flex flex-col gap-4">
        {/* Back Link */}
        <div>
          <button 
            onClick={() => navigate(isOwnerPortal ? '/owner/companies' : buildPath("/super-admin/companies"))} 
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors py-1 px-2 -ml-2 rounded-md hover:bg-zinc-100 cursor-pointer"
          >
            <ArrowLeft size={15} /> Back to Companies
          </button>
        </div>

        {/* Company Identity & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center border border-zinc-200 shrink-0 overflow-hidden shadow-2xs">
              {tenant.logoUrl || tenant.logo ? (
                <img 
                  src={tenant.logoUrl || tenant.logo} 
                  alt={tenant.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'; }}
                />
              ) : null}
              <Building2 size={24} className={tenant.logoUrl || tenant.logo ? "hidden" : "block text-zinc-500"} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate">
                {tenant.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs font-mono font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                  {tenant.code}
                </span>
                <span className="text-zinc-300">•</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${
                  tenant.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {tenant.active ? 'ACTIVE' : 'SUSPENDED'}
                </span>
                {tenant.domain && (
                  <>
                    <span className="text-zinc-300">•</span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
                      <ExternalLink size={12} className="text-zinc-400" />
                      {tenant.domain}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button 
              onClick={handleOpenDelete} 
              className="h-[38px] px-3.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
              title="Decommission Tenant"
            >
              <Trash2 size={15} /> <span>Delete</span>
            </button>
            <button 
              onClick={handleToggleStatus} 
              className="h-[38px] px-3.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
            >
              {tenant.active ? <XCircle size={15} className="text-amber-500" /> : <CheckCircle size={15} className="text-emerald-600" />}
              <span>{tenant.active ? "Suspend" : "Activate"}</span>
            </button>
            <button 
              onClick={() => {
                dispatch(setSelectedCompany(tenant));
                navigate(`/company/${tenant.id}/users`);
              }} 
              className="h-[38px] px-3.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
            >
              <Users size={15} className="text-zinc-500" /> <span>Users</span>
            </button>
            <button 
              onClick={handleOpenAssignModules} 
              className="h-[38px] px-3.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
            >
              <ShieldAlert size={15} className="text-zinc-500" /> <span>Modules</span>
            </button>
            <button 
              onClick={handleOpenEdit} 
              className="h-[38px] px-4 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
            >
              <Edit size={15} /> <span>Edit Company</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Left 30-35%, Right 65-70% */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.75fr)] gap-5 items-start">
        
        {/* Left Column - Core Info Cards */}
        <div className="space-y-5 min-w-0">
          
          {/* Company Info */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-zinc-100">
              <Info size={15} className="text-zinc-500" />
              <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Company Information</h2>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="text-zinc-500 mb-1 font-medium">Legal Name</div>
                <div className="font-semibold text-zinc-900 truncate" title={tenant.legalName || "-"}>{tenant.legalName || "-"}</div>
              </div>
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div>
                  <div className="text-zinc-500 mb-1 font-medium">Company Type</div>
                  <div className="font-semibold text-zinc-900 truncate" title={tenant.companyType || "-"}>{tenant.companyType || "-"}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1 font-medium">Base Currency</div>
                  <div className="font-semibold text-zinc-900 truncate" title={tenant.baseCurrency || "INR"}>{tenant.baseCurrency || "INR"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-zinc-100">
              <Phone size={15} className="text-zinc-500" />
              <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Contact Details</h2>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="text-zinc-500 flex items-center gap-1.5 mb-1 font-medium"><Mail size={13} className="text-zinc-400"/> Email Address</div>
                <div className="font-semibold text-zinc-900 truncate" title={tenant.email || "-"}>
                  {tenant.email ? <a href={`mailto:${tenant.email}`} className="hover:underline hover:text-indigo-600">{tenant.email}</a> : "-"}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 flex items-center gap-1.5 mb-1 font-medium"><Phone size={13} className="text-zinc-400"/> Phone Number</div>
                <div className="font-semibold text-zinc-900 truncate" title={tenant.phone || "-"}>
                  {tenant.phone ? <a href={`tel:${tenant.phone}`} className="hover:underline hover:text-indigo-600">{tenant.phone}</a> : "-"}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 flex items-center gap-1.5 mb-1 font-medium"><Globe size={13} className="text-zinc-400"/> Website</div>
                <div className="font-semibold text-zinc-900 truncate" title={tenant.website || "-"}>
                  {tenant.website ? (
                    <a 
                      href={tenant.website.startsWith('http') ? tenant.website : `https://${tenant.website}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{tenant.website}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  ) : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-zinc-100">
              <MapPin size={15} className="text-zinc-500" />
              <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Location Details</h2>
            </div>
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="text-zinc-500 mb-1 font-medium">Address Line 1</div>
                <div className="font-semibold text-zinc-900 truncate" title={tenant.address || "-"}>{tenant.address || "-"}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1 font-medium">Address Line 2</div>
                <div className="font-semibold text-zinc-900 truncate" title={tenant.addressLine2 || "-"}>{tenant.addressLine2 || "-"}</div>
              </div>
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div>
                  <div className="text-zinc-500 mb-1 font-medium">City / State</div>
                  <div className="font-semibold text-zinc-900 truncate" title={[tenant.city, tenant.state].filter(Boolean).join(", ") || "-"}>
                    {[tenant.city, tenant.state].filter(Boolean).join(", ") || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1 font-medium">Country / Postal</div>
                  <div className="font-semibold text-zinc-900 truncate" title={[tenant.country, tenant.postalCode].filter(Boolean).join(" - ") || "-"}>
                    {[tenant.country, tenant.postalCode].filter(Boolean).join(" - ") || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Legal Records & Assigned Modules */}
        <div className="space-y-5 min-w-0">
          
          {/* Legal & Tax Records */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-zinc-100">
              <Shield size={15} className="text-zinc-500" />
              <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Legal & Tax Records</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <div className="text-zinc-500 mb-1 font-medium">GSTIN</div>
                <div className="font-mono font-semibold text-zinc-900 truncate" title={tenant.gstin || "-"}>{tenant.gstin || "-"}</div>
              </div>
              <div>
                <div className="text-zinc-500 mb-1 font-medium">PAN</div>
                <div className="font-mono font-semibold text-zinc-900 truncate" title={tenant.pan || "-"}>{tenant.pan || "-"}</div>
              </div>
              <div className="pt-2 sm:pt-1 border-t border-zinc-100 sm:border-t-0">
                <div className="text-zinc-500 mb-1 font-medium flex items-center gap-1.5"><Calendar size={13} className="text-zinc-400"/> Provision Date</div>
                <div className="font-medium text-zinc-900">
                  {tenant.created ? new Date(tenant.created).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : "-"}
                </div>
              </div>
              <div className="pt-2 sm:pt-1 border-t border-zinc-100 sm:border-t-0">
                <div className="text-zinc-500 mb-1 font-medium flex items-center gap-1.5"><Calendar size={13} className="text-zinc-400"/> Last Updated</div>
                <div className="font-medium text-zinc-900">
                  {tenant.updated ? new Date(tenant.updated).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Modules Table */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-zinc-600" />
                <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Assigned Application Modules</h2>
              </div>
              <button 
                onClick={handleOpenAssignModules} 
                className="h-8 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Plus size={14} strokeWidth={2.5} /> <span>Assign New Module</span>
              </button>
            </div>

            <div className="w-full overflow-hidden border border-zinc-200 rounded-lg bg-white">
              <table className="w-full table-fixed text-left text-xs divide-y divide-zinc-200">
                <colgroup>
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '23%' }} />
                  <col style={{ width: '32%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '7%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-zinc-50/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-3 text-center">S.No.</th>
                    <th className="py-3 px-3 text-left">Module Name</th>
                    <th className="py-3 px-3 text-left">Host API Pattern</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Assigned Date</th>
                    <th className="py-3 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {companyModulesLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10">
                        <Loader2 className="mx-auto animate-spin text-zinc-400" size={24} />
                      </td>
                    </tr>
                  ) : assignedModulesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10">
                        <AlertCircle className="mx-auto text-zinc-300 mb-2.5" size={28} strokeWidth={1.5} />
                        <p className="text-zinc-600 font-medium text-xs">No modules assigned to this company.</p>
                        <button 
                          onClick={handleOpenAssignModules} 
                          className="mt-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                          Assign a module now
                        </button>
                      </td>
                    </tr>
                  ) : (
                    assignedModulesList.map((m, idx) => (
                      <tr key={idx} className="h-12 hover:bg-zinc-50/70 transition-colors group">
                        <td className="py-2.5 px-3 text-center text-zinc-500 font-mono text-xs">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900 truncate" title={m.name}>
                          {m.name}
                        </td>
                        <td className="py-2.5 px-3 truncate">
                          {m.host || m.apiPattern ? (
                            <a 
                              href={m.host || m.apiPattern} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="font-mono text-xs text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 max-w-full truncate"
                              title={m.host || m.apiPattern}
                            >
                              <span className="truncate">{m.host || m.apiPattern}</span>
                              <ExternalLink size={12} className="shrink-0 text-zinc-400" />
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-400 italic">Not Configured</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleModuleStatus(m.companyModule)}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase cursor-pointer hover:opacity-85 transition-opacity ${
                              m.companyModule?.status !== false 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                            title={`Click to ${m.companyModule?.status !== false ? 'disable' : 'enable'} module`}
                          >
                            {m.companyModule?.status !== false ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-center text-zinc-500 font-mono text-[11px]">
                          {m.companyModule?.createdAt 
                            ? new Date(m.companyModule.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                            : "-"}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleUnassignModule(m.companyModule)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Unassign this module"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {isEditModalOpen && (
        <CompanyCreateEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          isSubmitting={isSubmitting}
          editingId={editingId}
          name={name} setName={setName}
          code={code} setCode={setCode}
          domain={domain} setDomain={setDomain}
          legalName={legalName} setLegalName={setLegalName}
          companyType={companyType} setCompanyType={setCompanyType}
          gst={gst} setGst={setGst}
          pan={pan} setPan={setPan}
          address={address} setAddress={setAddress}
          addressLine2={addressLine2} setAddressLine2={setAddressLine2}
          city={city} setCity={setCity}
          state={state} setState={setState}
          country={country} setCountry={setCountry}
          postalCode={postalCode} setPostalCode={setPostalCode}
          email={email} setEmail={setEmail}
          phone={phone} setPhone={setPhone}
          website={website} setWebsite={setWebsite}
          logo={logo} setLogo={setLogo}
          moduleId={moduleId} setModuleId={setModuleId}
          baseCurrency={baseCurrency} setBaseCurrency={setBaseCurrency}
          status={status} setStatus={setStatus}
          modulesLoading={modulesLoading}
          modulesData={modulesData}
          formError={editFormError}
          handleSave={handleSaveEdit}
        />
      )}

      {isAssignModulesOpen && (
        <CompanyAssignModulesModal
          assignTenant={assignTenant}
          setAssignTenant={setAssignTenant}
          modulesLoading={modulesLoading}
          companyModulesLoading={companyModulesLoading}
          modulesData={modulesData}
          companyModulesData={companyModulesData}
          handleToggleAssign={handleToggleAssign}
          onClose={() => setIsAssignModulesOpen(false)}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmModal
        open={deleteConfirmOpen}
        title="Delete Company"
        message={
          <span>
            Are you sure you want to delete <span className="font-semibold text-zinc-900">"{tenant.name}"</span>?
          </span>
        }
        details="This action is irreversible and will permanently remove this company and its associated configuration."
        confirmLabel="Delete Company"
        cancelLabel="Cancel"
        loading={isDeletingCompany}
        loadingText="Deleting..."
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
