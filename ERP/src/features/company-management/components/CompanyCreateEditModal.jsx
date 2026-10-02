import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, Building2, Paperclip, ExternalLink } from "lucide-react";
import CustomSelect from "../../../components/common/CustomSelect";

export default function CompanyCreateEditModal({
  isOpen,
  onClose,
  isSubmitting,
  editingId,
  name, setName,
  code, setCode,
  domain, setDomain,
  legalName, setLegalName,
  companyType, setCompanyType,
  gst, setGst,
  pan, setPan,
  address, setAddress,
  addressLine2, setAddressLine2,
  city, setCity,
  state, setState,
  country, setCountry,
  postalCode, setPostalCode,
  email, setEmail,
  phone, setPhone,
  website, setWebsite,
  logo, setLogo,
  moduleId, setModuleId,
  baseCurrency, setBaseCurrency,
  status, setStatus,
  modulesLoading,
  modulesData,
  handleSave
}) {
  const fileInputRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogo(e.target.files[0]);
    }
  };

  const handleClearLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const inputCls = "w-full h-[38px] px-3 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all";
  const labelCls = "block text-xs font-semibold text-zinc-700 mb-1.5";
  const sectionTitleCls = "text-xs font-bold text-zinc-700 uppercase tracking-[0.02em] pb-1.5 border-b border-zinc-200/80 mb-3.5";

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div 
        className="bg-white w-[calc(100vw-24px)] sm:w-[min(1120px,calc(100vw-48px))] max-w-[1120px] max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 my-auto shrink-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        
        {/* ── Fixed Header ── */}
        <div className="flex items-center justify-between px-[22px] py-[16px] border-b border-zinc-200 bg-zinc-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <Building2 size={20} />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-zinc-900 tracking-tight leading-snug">
                {editingId ? "Edit Company" : "Provision New Tenant"}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {editingId 
                  ? "Update tenant organization details, tax IDs and contact info."
                  : "Create and configure a new tenant organization."}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
            aria-label="Close dialog"
            title="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Scrollable Form Body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-[24px] py-5 custom-scrollbar bg-white">
          <form id="company-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ── LEFT COLUMN ── */}
            <div className="space-y-5">
              
              {/* Basic Information */}
              <div>
                <h3 className={sectionTitleCls}>Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelCls}>
                      Company Code <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={code} 
                      onChange={(e) => setCode(e.target.value)} 
                      className={`${inputCls} uppercase placeholder:normal-case`} 
                      placeholder="e.g. MARK" 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className={inputCls} 
                      placeholder="e.g. Mark Enterprises" 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Domain <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={domain} 
                      onChange={(e) => setDomain(e.target.value)} 
                      className={`${inputCls} lowercase placeholder:normal-case`} 
                      placeholder="e.g. mark.com" 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Legal Name</label>
                    <input 
                      type="text" 
                      value={legalName} 
                      onChange={(e) => setLegalName(e.target.value)} 
                      className={inputCls} 
                      placeholder="e.g. Mark Pvt Ltd" 
                    />
                  </div>
                </div>
              </div>

              {/* Legal & Tax Details */}
              <div>
                <h3 className={sectionTitleCls}>Legal & Tax Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelCls}>Company Type</label>
                    <CustomSelect
                      value={companyType || ""}
                      onChange={(e) => setCompanyType(e.target.value)}
                      searchable={false}
                      placeholder="Select Type"
                      buttonClassName={`${inputCls} cursor-pointer`}
                    >
                      <option value="">Select Type</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="Public Limited">Public Limited</option>
                      <option value="LLP">LLP</option>
                      <option value="Proprietorship">Proprietorship</option>
                    </CustomSelect>
                  </div>

                  <div>
                    <label className={labelCls}>Base Currency</label>
                    <CustomSelect
                      value={baseCurrency || "INR"}
                      onChange={(e) => setBaseCurrency(e.target.value)}
                      searchable={false}
                      placeholder="Select Currency"
                      buttonClassName={`${inputCls} cursor-pointer`}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </CustomSelect>
                  </div>

                  <div>
                    <label className={labelCls}>PAN Number</label>
                    <input 
                      type="text" 
                      value={pan} 
                      onChange={(e) => setPan(e.target.value)} 
                      className={`${inputCls} uppercase placeholder:normal-case`} 
                      placeholder="10-char PAN" 
                    />
                  </div>

                  <div>
                    <label className={labelCls}>GSTIN</label>
                    <input 
                      type="text" 
                      value={gst} 
                      onChange={(e) => setGst(e.target.value)} 
                      className={`${inputCls} uppercase placeholder:normal-case`} 
                      placeholder="15-char GST" 
                    />
                  </div>

                  {/* Company Logo Upload */}
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Company Logo</label>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    <div className="flex items-center justify-between gap-3 p-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-md text-xs font-semibold text-zinc-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                        >
                          <Paperclip size={13} className="text-zinc-500" />
                          <span>Choose File</span>
                        </button>
                        <span className="text-xs text-zinc-500 truncate">
                          {logo instanceof File 
                            ? logo.name 
                            : typeof logo === 'string' && logo 
                            ? "Current logo uploaded" 
                            : "No file chosen (PNG, JPG)"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {logo && typeof logo === 'string' && (
                          <a 
                            href={logo} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium hover:underline px-2 py-1"
                          >
                            <span>View</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                        {logo && (
                          <button
                            type="button"
                            onClick={handleClearLogo}
                            className="text-xs text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors"
                            title="Remove file"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active Tenant Row */}
                  <div className="sm:col-span-2 pt-0.5">
                    <label className="flex items-start gap-3 p-3 bg-zinc-50/70 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-100/60 transition-colors group">
                      <input 
                        type="checkbox" 
                        checked={status === 'Active'}
                        onChange={(e) => setStatus(e.target.checked ? 'Active' : 'Inactive')}
                        className="w-4 h-4 mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/20 cursor-pointer"
                      />
                      <div className="flex flex-col select-none">
                        <span className="text-xs font-semibold text-zinc-800 group-hover:text-zinc-900">
                          Active Tenant
                        </span>
                        <span className="text-[11px] text-zinc-500 mt-0.5">
                          Tenant instance will be activated and accessible immediately upon provisioning.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-5">
              
              {/* Contact & Digital */}
              <div>
                <h3 className={sectionTitleCls}>Contact & Digital</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Email Address</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className={inputCls} 
                      placeholder="contact@company.com" 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className={inputCls} 
                      placeholder="+1 234 567 8900" 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Website URL</label>
                    <input 
                      type="url" 
                      value={website} 
                      onChange={(e) => setWebsite(e.target.value)} 
                      className={inputCls} 
                      placeholder="https://www.company.com" 
                    />
                  </div>
                </div>
              </div>

              {/* Registered Address */}
              <div>
                <h3 className={sectionTitleCls}>Registered Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Address Line 1</label>
                    <input 
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      className={inputCls} 
                      placeholder="Street address, P.O. box" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Address Line 2</label>
                    <input 
                      type="text" 
                      value={addressLine2} 
                      onChange={(e) => setAddressLine2(e.target.value)} 
                      className={inputCls} 
                      placeholder="Apartment, suite, unit, etc." 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input 
                      type="text" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                      className={inputCls} 
                      placeholder="City" 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>State / Province</label>
                    <input 
                      type="text" 
                      value={state} 
                      onChange={(e) => setState(e.target.value)} 
                      className={inputCls} 
                      placeholder="State or Province" 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input 
                      type="text" 
                      value={country} 
                      onChange={(e) => setCountry(e.target.value)} 
                      className={inputCls} 
                      placeholder="Country" 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Postal Code</label>
                    <input 
                      type="text" 
                      value={postalCode} 
                      onChange={(e) => setPostalCode(e.target.value)} 
                      className={inputCls} 
                      placeholder="ZIP / Postal code" 
                    />
                  </div>
                </div>
              </div>

            </div>

          </form>
        </div>

        {/* ── Fixed Footer ── */}
        <div className="flex justify-end items-center gap-2.5 px-[22px] py-[14px] border-t border-zinc-200 bg-zinc-50/80 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="h-[38px] px-4 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="company-form"
            disabled={isSubmitting}
            className="h-[38px] px-5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>{editingId ? "Updating..." : "Provisioning..."}</span>
              </>
            ) : (
              <>
                <Check size={15} strokeWidth={2.5} />
                <span>{editingId ? "Update Tenant" : "Provision Tenant"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
