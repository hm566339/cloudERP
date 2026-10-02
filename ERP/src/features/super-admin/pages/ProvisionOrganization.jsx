import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, User, Layers, CheckCircle2, ChevronRight, ChevronLeft,
  PlusCircle, Trash2, Globe, Mail, Phone, MapPin, Lock, Eye, EyeOff,
  AlertTriangle, Info
} from 'lucide-react';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import {
  useCreateOrganizationMutation,
  useGetModulesQuery,
} from '../../../api/sso';
import { useRoutePath } from '../../../hooks/useRoutePath';

/**
 * ProvisionOrganization — Multi-step wizard to create a new organization.
 *
 * Route: /super-admin/organizations/provision
 *
 * Steps:
 *   1. Organization Information
 *   2. Organization Admin
 *   3. Companies (optional — add one or more companies)
 *   4. Modules (assign platform modules)
 *   5. Review & Provision
 *
 * Calls: POST /api/sso/signup (or /api/sso/admin/organizations)
 */
export default function ProvisionOrganization() {
  const { buildPath } = useRoutePath();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 5;

  // ── Form state
  const [orgInfo, setOrgInfo] = useState({
    name: '', code: '', email: '', phone: '',
    address: '', city: '', state: '', country: '', timezone: '', currency: 'INR',
  });
  const [adminInfo, setAdminInfo] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'org_admin',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState([
    { name: '', code: '', email: '' }
  ]);
  const [selectedModules, setSelectedModules] = useState([]);

  const [createOrganization, { isLoading: creating }] = useCreateOrganizationMutation();
  const { data: modulesData, isLoading: modulesLoading } = useGetModulesQuery({ page: 0, pageSize: 100 });
  const modulesList = Array.isArray(modulesData) ? modulesData :
    modulesData?.modules || modulesData?.data?.content || modulesData?.content || modulesData?.data || [];

  // ── Validation
  const isStep1Valid = orgInfo.name.trim() && orgInfo.code.trim() && orgInfo.email.trim();
  const isStep2Valid = adminInfo.firstName.trim() && adminInfo.email.trim();
  const isStep3Valid = true; // companies are optional
  const isStep4Valid = true; // modules are optional

  const canGoNext = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    return true;
  };

  const handleAddCompany = () => {
    setCompanies([...companies, { name: '', code: '', email: '' }]);
  };

  const handleRemoveCompany = (idx) => {
    setCompanies(companies.filter((_, i) => i !== idx));
  };

  const handleCompanyChange = (idx, field, value) => {
    const updated = [...companies];
    updated[idx] = { ...updated[idx], [field]: value };
    setCompanies(updated);
  };

  const handleToggleModule = (moduleId) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleProvision = async () => {
    try {
      await createOrganization({
        name: orgInfo.name,
        code: orgInfo.code,
        email: orgInfo.email,
        phone: orgInfo.phone,
        address: orgInfo.address,
        city: orgInfo.city,
        state: orgInfo.state,
        country: orgInfo.country,
        timezone: orgInfo.timezone,
        currency: orgInfo.currency,
        adminEmail: adminInfo.email,
        adminFirstName: adminInfo.firstName,
        adminLastName: adminInfo.lastName,
        adminPassword: adminInfo.password,
        modules: selectedModules,
        companies: companies.filter(c => c.name.trim()),
      }).unwrap();

      dispatch(addAlert({ type: 'success', message: `Organization "${orgInfo.name}" provisioned successfully!` }));
      navigate(buildPath('/super-admin/organizations'));
    } catch (e) {
      dispatch(addAlert({ type: 'error', message: 'Failed to provision organization. Backend API may not be implemented yet.' }));
    }
  };

  const stepDefs = [
    { label: 'Organization Info', icon: Globe },
    { label: 'Admin', icon: User },
    { label: 'Companies', icon: Building2 },
    { label: 'Modules', icon: Layers },
    { label: 'Review', icon: CheckCircle2 },
  ];

  return (
    <div className="w-full px-6 lg:px-8 py-6 space-y-5 animate-fade-in pb-16">

      {/* ── Header & Breadcrumb ── */}
      <div>
        <nav className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium mb-2">
          <Link to={buildPath('/super-admin/dashboard')} className="hover:text-zinc-600 transition-colors">Global Console</Link>
          <ChevronRight size={12} />
          <Link to={buildPath('/super-admin/organizations')} className="hover:text-zinc-600 transition-colors">Organizations</Link>
          <ChevronRight size={12} />
          <span className="text-zinc-700">Provision Organization</span>
        </nav>
        <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
          <PlusCircle size={20} className="text-blue-600 shrink-0" />
          Provision Organization
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Create a new organization as the top-level tenant on the platform.
        </p>
      </div>

      {/* ── API info notice ── */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
        <Info size={15} className="shrink-0 mt-0.5 text-blue-500" />
        <div>
          <span className="font-semibold">Organization Provisioning</span>{' '}
          Submits to <code className="font-mono bg-blue-100 px-1 rounded">POST /api/sso/signup</code>.
          Ensure you have System Admin access before provisioning.
        </div>
      </div>

      {/* ── Step Indicator ── */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-4">
        <div className="flex items-center justify-between">
          {stepDefs.map((s, i) => {
            const stepNum = i + 1;
            const Icon = s.icon;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <React.Fragment key={s.label}>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                    isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                    isActive ? 'bg-blue-500 border-blue-500 text-white' :
                    'bg-white border-zinc-300 text-zinc-400'
                  }`}>
                    {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-[10px] font-semibold text-center leading-tight ${
                    isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-zinc-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < stepDefs.length - 1 && (
                  <div className={`h-0.5 flex-1 max-w-[60px] mx-1 rounded transition-all ${
                    step > stepNum ? 'bg-emerald-400' : 'bg-zinc-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-6">

        {/* Step 1: Organization Information */}
        {step === 1 && (
          <StepSection title="Organization Information" subtitle="Basic details about the organization.">
            <FormGrid>
              <FormField label="Organization Name *" hint="Full legal or trading name">
                <Input
                  value={orgInfo.name}
                  onChange={e => setOrgInfo({ ...orgInfo, name: e.target.value })}
                  placeholder="Acme Group"
                />
              </FormField>
              <FormField label="Organization Code *" hint="Unique short identifier (e.g. ACME)">
                <Input
                  value={orgInfo.code}
                  onChange={e => setOrgInfo({ ...orgInfo, code: e.target.value.toUpperCase() })}
                  placeholder="ACME"
                />
              </FormField>
              <FormField label="Email *" hint="Primary contact email">
                <Input
                  type="email"
                  value={orgInfo.email}
                  onChange={e => setOrgInfo({ ...orgInfo, email: e.target.value })}
                  placeholder="admin@acmegroup.com"
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  value={orgInfo.phone}
                  onChange={e => setOrgInfo({ ...orgInfo, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </FormField>
              <FormField label="Address">
                <Input
                  value={orgInfo.address}
                  onChange={e => setOrgInfo({ ...orgInfo, address: e.target.value })}
                  placeholder="123 Business Park"
                />
              </FormField>
              <FormField label="City">
                <Input
                  value={orgInfo.city}
                  onChange={e => setOrgInfo({ ...orgInfo, city: e.target.value })}
                  placeholder="Mumbai"
                />
              </FormField>
              <FormField label="State">
                <Input
                  value={orgInfo.state}
                  onChange={e => setOrgInfo({ ...orgInfo, state: e.target.value })}
                  placeholder="Maharashtra"
                />
              </FormField>
              <FormField label="Country">
                <Input
                  value={orgInfo.country}
                  onChange={e => setOrgInfo({ ...orgInfo, country: e.target.value })}
                  placeholder="India"
                />
              </FormField>
              <FormField label="Timezone">
                <Input
                  value={orgInfo.timezone}
                  onChange={e => setOrgInfo({ ...orgInfo, timezone: e.target.value })}
                  placeholder="Asia/Kolkata"
                />
              </FormField>
              <FormField label="Base Currency">
                <Input
                  value={orgInfo.currency}
                  onChange={e => setOrgInfo({ ...orgInfo, currency: e.target.value.toUpperCase() })}
                  placeholder="INR"
                />
              </FormField>
            </FormGrid>
          </StepSection>
        )}

        {/* Step 2: Organization Admin */}
        {step === 2 && (
          <StepSection title="Organization Admin" subtitle="The primary administrator for this organization.">
            <FormGrid>
              <FormField label="First Name *">
                <Input
                  value={adminInfo.firstName}
                  onChange={e => setAdminInfo({ ...adminInfo, firstName: e.target.value })}
                  placeholder="Rahul"
                />
              </FormField>
              <FormField label="Last Name">
                <Input
                  value={adminInfo.lastName}
                  onChange={e => setAdminInfo({ ...adminInfo, lastName: e.target.value })}
                  placeholder="Sharma"
                />
              </FormField>
              <FormField label="Email *" hint="Will be used for the admin account">
                <Input
                  type="email"
                  value={adminInfo.email}
                  onChange={e => setAdminInfo({ ...adminInfo, email: e.target.value })}
                  placeholder="rahul@acmegroup.com"
                />
              </FormField>
              <FormField label="Password / Invitation">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={adminInfo.password}
                    onChange={e => setAdminInfo({ ...adminInfo, password: e.target.value })}
                    placeholder="Temporary password or leave blank to send invitation"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </FormField>
              <FormField label="Admin Role">
                <select
                  value={adminInfo.role}
                  onChange={e => setAdminInfo({ ...adminInfo, role: e.target.value })}
                  className="w-full h-9 px-3 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white text-zinc-900"
                >
                  <option value="org_admin">Organization Admin</option>
                  <option value="org_member">Organization Member</option>
                </select>
              </FormField>
            </FormGrid>
          </StepSection>
        )}

        {/* Step 3: Companies */}
        {step === 3 && (
          <StepSection title="Companies" subtitle="Optionally create one or more companies under this organization. Companies are child entities — not separate tenants.">
            <div className="space-y-4">
              {companies.map((c, idx) => (
                <div key={idx} className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/40 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-zinc-700">Company #{idx + 1}</span>
                    {companies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCompany(idx)}
                        className="p-1.5 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <FormGrid columns={3}>
                    <FormField label="Company Name">
                      <Input
                        value={c.name}
                        onChange={e => handleCompanyChange(idx, 'name', e.target.value)}
                        placeholder="Acme India Pvt Ltd"
                      />
                    </FormField>
                    <FormField label="Code">
                      <Input
                        value={c.code}
                        onChange={e => handleCompanyChange(idx, 'code', e.target.value.toUpperCase())}
                        placeholder="ACMEIN"
                      />
                    </FormField>
                    <FormField label="Email">
                      <Input
                        type="email"
                        value={c.email}
                        onChange={e => handleCompanyChange(idx, 'email', e.target.value)}
                        placeholder="india@acmegroup.com"
                      />
                    </FormField>
                  </FormGrid>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddCompany}
                className="w-full h-10 rounded-lg border-2 border-dashed border-zinc-200 text-zinc-500 hover:border-blue-300 hover:text-blue-600 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle size={14} /> Add Another Company
              </button>

              <p className="text-[11px] text-zinc-400 text-center">
                You can also add companies later from the organization detail page.
              </p>
            </div>
          </StepSection>
        )}

        {/* Step 4: Modules */}
        {step === 4 && (
          <StepSection title="Platform Modules" subtitle="Assign available platform modules to this organization.">
            {modulesLoading ? (
              <div className="text-center py-8 text-xs text-zinc-400">Loading modules…</div>
            ) : modulesList.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400">No platform modules available.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {modulesList.map((m) => {
                  const isSelected = selectedModules.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleToggleModule(m.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-blue-400 bg-blue-50 text-blue-900'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
                          <Layers size={16} className={isSelected ? 'text-blue-600' : 'text-zinc-500'} />
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-zinc-300'
                        }`}>
                          {isSelected && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-semibold">{m.name || m.moduleName}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{m.code || m.moduleCode}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </StepSection>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <StepSection title="Review & Provision" subtitle="Review the details before provisioning the organization.">
            <div className="space-y-5">
              {/* Org Summary */}
              <ReviewSection title="Organization" icon={Globe}>
                <ReviewRow label="Name" value={orgInfo.name} />
                <ReviewRow label="Code" value={orgInfo.code} mono />
                <ReviewRow label="Email" value={orgInfo.email} />
                <ReviewRow label="Country" value={orgInfo.country} />
                <ReviewRow label="Currency" value={orgInfo.currency} />
              </ReviewSection>

              {/* Admin Summary */}
              <ReviewSection title="Organization Admin" icon={User}>
                <ReviewRow label="Name" value={`${adminInfo.firstName} ${adminInfo.lastName}`.trim()} />
                <ReviewRow label="Email" value={adminInfo.email} />
                <ReviewRow label="Role" value={adminInfo.role} />
              </ReviewSection>

              {/* Companies Summary */}
              <ReviewSection title="Companies" icon={Building2}>
                {companies.filter(c => c.name.trim()).length === 0 ? (
                  <p className="text-xs text-zinc-400">No companies — you can add them later.</p>
                ) : (
                  companies.filter(c => c.name.trim()).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <div className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold border border-blue-100">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-zinc-800 font-medium">{c.name}</span>
                      {c.code && <span className="font-mono text-[10px] text-zinc-400">({c.code})</span>}
                    </div>
                  ))
                )}
              </ReviewSection>

              {/* Modules Summary */}
              <ReviewSection title="Modules" icon={Layers}>
                {selectedModules.length === 0 ? (
                  <p className="text-xs text-zinc-400">No modules selected — you can assign them later.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedModules.map(id => {
                      const m = modulesList.find(x => x.id === id);
                      return (
                        <span key={id} className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                          {m?.name || id}
                        </span>
                      );
                    })}
                  </div>
                )}
              </ReviewSection>
            </div>
          </StepSection>
        )}
      </div>

      {/* ── Navigation Buttons ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate(buildPath('/super-admin/organizations'))}
          className="btn-secondary h-9 px-4 text-xs flex items-center gap-1.5"
        >
          <ChevronLeft size={14} />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">Step {step} of {TOTAL_STEPS}</span>
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canGoNext()}
              className="btn-primary h-9 px-5 text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleProvision}
              disabled={creating}
              className="btn-primary h-9 px-5 text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {creating ? (
                <><span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Provisioning…</>
              ) : (
                <><CheckCircle2 size={14} /> Provision Organization</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Layout Helpers ────────────────────────────────────────────────
function StepSection({ title, subtitle, children }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-zinc-900">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function FormGrid({ children, columns = 2 }) {
  return (
    <div className={`grid grid-cols-1 ${columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
      {children}
    </div>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wide block">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-zinc-400">{hint}</p>}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-9 px-3 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white text-zinc-900 placeholder-zinc-400 ${className}`}
    />
  );
}

function ReviewSection({ title, icon: Icon, children }) {
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-zinc-50/80 border-b border-zinc-100 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Icon size={13} />
        </div>
        <span className="text-xs font-bold text-zinc-800">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

function ReviewRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-zinc-400 font-medium">{label}</span>
      <span className={`text-zinc-800 font-semibold ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}
