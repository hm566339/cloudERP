import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Copy,
  Check,
  Save,
  RotateCcw,
  Edit2,
  Paperclip,
  Globe,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';
import PageHeader from '../../../../components/common/PageHeader';

export default function OrgProfileView({
  organization,
  initialName = '',
  initialEmail = '',
  onSaveProfile,
  isSaving = false,
}) {
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState(initialName || organization?.name || '');
  const [code, setCode] = useState((organization?.code || '').toUpperCase());
  const [email, setEmail] = useState(initialEmail || organization?.email || organization?.primaryEmail || '');
  const [phone, setPhone] = useState(organization?.phone || '+91 98765 43210');
  const [website, setWebsite] = useState(organization?.website || 'https://www.example.com');
  const [logoUrl, setLogoUrl] = useState(organization?.logoUrl || '');
  const [address, setAddress] = useState(organization?.address || '123 Business Boulevard, Sector 62');
  const [city, setCity] = useState(organization?.city || 'Noida');
  const [state, setState] = useState(organization?.state || 'Uttar Pradesh');
  const [country, setCountry] = useState(organization?.country || 'India');
  const [postalCode, setPostalCode] = useState(organization?.postalCode || '201301');
  const [gstin, setGstin] = useState(organization?.gstin || '09AAAAA0000A1Z5');
  const [pan, setPan] = useState(organization?.pan || 'AAAAA0000A');
  const [description, setDescription] = useState(
    organization?.description || 'Central Multi-Company Enterprise Parent Organization.'
  );

  const [copiedId, setCopiedId] = useState(false);
  const orgId = organization?.id || '';

  const handleCopyId = () => {
    if (!orgId) return;
    navigator.clipboard.writeText(orgId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

    const handleCancel = () => {
      setName(initialName || organization?.name || '');
      setEmail(initialEmail || organization?.email || organization?.primaryEmail || '');
      setIsEditing(false);
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (onSaveProfile) {
        onSaveProfile({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          postalCode: postalCode.trim(),
          gstin: gstin.trim(),
          pan: pan.trim(),
          description: description.trim(),
        });
      }
      setIsEditing(false);
    };

    return (
          <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
            <PageHeader
              title="Organization Profile"
              description="Manage organization identity, legal business details, and contact information"
            >
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
            </div>
          </PageHeader>

                {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
                  {/* Identity & Legal Entity Card */}
                  <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                        Organization Identity & Logo
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-500">ID: {orgId || '—'}</span>
                        {orgId && (
                          <button
                            type="button"
                            onClick={handleCopyId}
                            className="p-1 hover:text-primary text-zinc-400"
                            title="Copy ID"
                          >
                            {copiedId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                          Organization Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!isEditing}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                          Organization Code
                        </label>
                        <input
                          type="text"
                          disabled
                          value={code}
                          className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                          Organization Logo
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-700 dark:text-zinc-300">
                            {name ? name.charAt(0).toUpperCase() : 'O'}
                          </div>
                          {isEditing ? (
                            <input
                              type="text"
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                              placeholder="Logo URL..."
                              className="flex-1 px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg"
                            />
                          ) : (
                            <span className="text-xs text-zinc-400">Default brand avatar</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                        Organization Description
                      </label>
                      <textarea
                        rows={2}
                        disabled={!isEditing}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                      />
                    </div>
                  </div>

                      {/* Contact Details Card */}
                      <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          Contact & Communication
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Primary Email <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              disabled={!isEditing}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Website URL
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address & Taxation Card */}
                      <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          Registered Address & Tax Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Street Address
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              State / Province
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Country
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              Postal Code / PIN
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={postalCode}
                              onChange={(e) => setPostalCode(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              GSTIN / Tax Registration
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={gstin}
                              onChange={(e) => setGstin(e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                              PAN Number
                            </label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={pan}
                              onChange={(e) => setPan(e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                            />
                          </div>
                        </div>
                      </div>

                      {isEditing && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          )}
              </form>
            </div>
          </div>
          );
}
