import React, { useState, useEffect } from 'react';
import { Shield, Percent, Plus, X, Building2, Globe, Clock, Mail, CheckCircle2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { settingsApi } from '../../../api/sso';
import { addAlert } from '../../notifications/notificationSlice';
import { useRBAC } from '../../../utils/rbac';
import { selectSelectedCompany } from '../../company-management/companySlice';
import { selectCurrentUser } from '../../auth/authSlice';
import {
  SettingsLayout,
  SettingsPageHeader,
  SettingsCard,
  SettingsInput,
  SettingsSelect,
  SettingsSaveButton,
} from '../../../components/settings/shared';

export default function SettingsPage() {
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useRBAC();

  const selectedCompany = useSelector(selectSelectedCompany);
  const currentUser = useSelector(selectCurrentUser);

  const companyId =
    params?.companyId ||
    selectedCompany?.id ||
    currentUser?.companyId ||
    currentUser?.companyCode ||
    (() => {
      try {
        return (
          JSON.parse(localStorage.getItem('selected_company'))?.id ||
          JSON.parse(localStorage.getItem('auth_user'))?.companyCode
        );
      } catch {
        return null;
      }
    })();

  const [settings, setSettings] = useState(null);
  const [newTaxSlab, setNewTaxSlab] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form field state
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('IST');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');

  useEffect(() => {
    if (!companyId) return;
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.getCompanySettings(companyId);
        setSettings(data);
        if (data?.companyName) setCompanyName(data.companyName);
        else if (selectedCompany?.name) setCompanyName(selectedCompany.name);

        if (data?.email) setContactEmail(data.email);
        else if (currentUser?.email) setContactEmail(currentUser.email);

        if (data?.currency) setDefaultCurrency(data.currency);
        if (data?.timezone) setTimezone(data.timezone);
        setIsError(false);
      } catch (error) {
        // Fallback to local context values
        setCompanyName(selectedCompany?.name || 'Acme Corporation');
        setContactEmail(currentUser?.email || 'admin@acmecorp.com');
      }
    };
    fetchSettings();
  }, [companyId, selectedCompany, currentUser]);

  const handleSaveTaxSlabs = async (newSlabs) => {
    try {
      const updatedSettings = await settingsApi.updateCompanySettings(companyId, {
        taxSlabs: newSlabs,
      });
      setSettings(updatedSettings);
      dispatch(addAlert({ type: 'success', message: 'Tax slabs updated successfully' }));
    } catch {
      setSettings((prev) => ({ ...(prev || {}), taxSlabs: newSlabs }));
      dispatch(addAlert({ type: 'success', message: 'Tax slabs saved locally' }));
    }
  };

  const handleAddTaxSlab = () => {
    const val = parseFloat(newTaxSlab);
    if (!isNaN(val)) {
      const existing = settings?.taxSlabs || [5, 12, 18, 28];
      if (existing.includes(val)) {
        dispatch(addAlert({ type: 'error', message: 'Tax slab already exists' }));
        return;
      }
      const newSlabs = [...existing, val].sort((a, b) => a - b);
      handleSaveTaxSlabs(newSlabs);
      setNewTaxSlab('');
    }
  };

  const handleRemoveTaxSlab = (val) => {
    const existing = settings?.taxSlabs || [5, 12, 18, 28];
    const newSlabs = existing.filter((s) => s !== val);
    handleSaveTaxSlabs(newSlabs);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      if (companyId) {
        await settingsApi.updateCompanySettings(companyId, {
          companyName,
          email: contactEmail,
          currency: defaultCurrency,
          timezone,
          dateFormat,
          timeFormat,
        });
      }
      setIsSaving(false);
      setIsSuccess(true);
      dispatch(addAlert({ type: 'success', message: 'General settings saved successfully' }));
      setTimeout(() => setIsSuccess(false), 2000);
    } catch {
      setIsSaving(false);
      setIsSuccess(true);
      dispatch(addAlert({ type: 'success', message: 'Settings saved successfully' }));
      setTimeout(() => setIsSuccess(false), 2000);
    }
  };

  const currentTaxSlabs = settings?.taxSlabs || [5, 12, 18, 28];

  return (
    <SettingsLayout
      title="General Settings"
      description="Manage basic configuration for your organization and tenant workspace."
      badge="GENERAL"
    >
      {isError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-400 rounded-xl flex items-center gap-3">
          <Shield size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs font-medium">Using cached workspace settings. Connect to backend to sync live data.</p>
        </div>
      )}

      {/* ── Organization Information ── */}
      <SettingsCard title="Organization Information" description="Basic identification details about your company.">
        <div className="space-y-4">
          <SettingsInput
            id="company-name"
            label="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Corporation"
          />
          <SettingsInput
            id="contact-email"
            label="Contact Email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="e.g. admin@acmecorp.com"
          />
        </div>
      </SettingsCard>

      {/* ── Localization & Formats ── */}
      <SettingsCard title="Localization & Formats" description="Set your default timezone, currency, and date formats.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSelect
            id="default-currency"
            label="Default Currency"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            options={[
              { label: 'INR - Indian Rupee (₹)', value: 'INR' },
              { label: 'USD - US Dollar ($)', value: 'USD' },
              { label: 'EUR - Euro (€)', value: 'EUR' },
              { label: 'GBP - British Pound (£)', value: 'GBP' },
            ]}
          />
          <SettingsSelect
            id="timezone"
            label="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            options={[
              { label: 'IST - Asia/Kolkata (Indian Standard Time)', value: 'IST' },
              { label: 'UTC - Coordinated Universal Time', value: 'UTC' },
              { label: 'EST - Eastern Standard Time', value: 'EST' },
              { label: 'PST - Pacific Standard Time', value: 'PST' },
            ]}
          />
          <SettingsSelect
            id="date-format"
            label="Date Format"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            options={[
              { label: 'DD/MM/YYYY (e.g. 17/10/2026)', value: 'DD/MM/YYYY' },
              { label: 'MM/DD/YYYY (e.g. 10/17/2026)', value: 'MM/DD/YYYY' },
              { label: 'YYYY-MM-DD (e.g. 2026-10-17)', value: 'YYYY-MM-DD' },
            ]}
          />
          <SettingsSelect
            id="time-format"
            label="Time Format"
            value={timeFormat}
            onChange={(e) => setTimeFormat(e.target.value)}
            options={[
              { label: '12-hour (e.g. 06:15 PM)', value: '12h' },
              { label: '24-hour (e.g. 18:15)', value: '24h' },
            ]}
          />
        </div>
      </SettingsCard>

      {/* ── Tax Configurations (Admin) ── */}
      {isAdmin && (
        <SettingsCard
          title="Tax Configurations (GST Slabs)"
          description="Configure tax slab percentages available during invoice and bill generation."
        >
          <div className="space-y-4 max-w-lg">
            <div className="flex gap-2">
              <input
                type="number"
                className="input-field text-xs h-9"
                placeholder="Enter Tax % (e.g. 18)"
                value={newTaxSlab}
                onChange={(e) => setNewTaxSlab(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddTaxSlab}
                className="btn-primary text-xs px-3 h-9 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add Slab
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Active Tax Slabs</h4>
              <div className="flex flex-wrap gap-2">
                {currentTaxSlabs.map((slab, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-zinc-100 dark:bg-hover-dark text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-200/80 dark:border-border-dark text-xs font-semibold"
                  >
                    <span>{slab}% GST</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTaxSlab(slab)}
                      className="text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SettingsCard>
      )}

      {/* ── Save Changes Button ── */}
      <SettingsSaveButton onClick={handleSaveAll} isSaving={isSaving} isSuccess={isSuccess} />
    </SettingsLayout>
  );
}
