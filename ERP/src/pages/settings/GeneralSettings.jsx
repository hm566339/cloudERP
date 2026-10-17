import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectSelectedCompany } from '../../features/company-management/companySlice';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { addAlert } from '../../features/notifications/notificationSlice';
import {
  SettingsLayout,
  SettingsPageHeader,
  SettingsCard,
  SettingsInput,
  SettingsSelect,
  SettingsSaveButton,
} from '../../components/settings/shared';

export default function GeneralSettings() {
  const dispatch = useAppDispatch();
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const currentUser = useAppSelector(selectCurrentUser);

  const [companyName, setCompanyName] = useState(selectedCompany?.name || 'Acme Corporation');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || 'admin@acmecorp.com');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('IST');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSuccess(true);
      dispatch(
        addAlert({
          type: 'success',
          message: 'General settings saved successfully',
        })
      );
      setTimeout(() => setIsSuccess(false), 2000);
    }, 600);
  };

  return (
    <SettingsLayout
      title="General Settings"
      description="Manage basic configuration for your organization and tenant workspace."
      badge="GENERAL"
    >
      <SettingsCard title="Organization Information" description="Basic details about your company.">
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
      </SettingsCard>

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
              { label: 'IST (Indian Standard Time)', value: 'IST' },
              { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
              { label: 'EST (Eastern Standard Time)', value: 'EST' },
              { label: 'PST (Pacific Standard Time)', value: 'PST' },
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
              { label: '12-hour (AM/PM)', value: '12h' },
              { label: '24-hour', value: '24h' },
            ]}
          />
        </div>
      </SettingsCard>

      <SettingsSaveButton
        onClick={handleSave}
        isSaving={isSaving}
        isSuccess={isSuccess}
      />
    </SettingsLayout>
  );
}
