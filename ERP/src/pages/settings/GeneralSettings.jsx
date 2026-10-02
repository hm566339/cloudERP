import React, { useState } from 'react';
import {
  SettingsLayout,
  SettingsPageHeader,
  SettingsCard,
  SettingsInput,
  SettingsSelect,
  SettingsSaveButton
} from '../../components/settings/shared';

export default function GeneralSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    }, 800);
  };

  return (
    <SettingsLayout>
      <SettingsPageHeader
        title="General Settings"
        description="Manage basic configuration for your organization and tenant workspace."
      />

      <SettingsCard title="Organization Information" description="Basic details about your company.">
        <SettingsInput
          id="company-name"
          label="Company Name"
          defaultValue="Acme Corporation"
        />
        <SettingsInput
          id="contact-email"
          label="Contact Email"
          defaultValue="admin@acmecorp.com"
          type="email"
        />
      </SettingsCard>

      <SettingsCard title="Localization & Formats" description="Set your default timezone, currency, and date formats.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSelect
            id="default-currency"
            label="Default Currency"
            options={[
              { label: 'USD - US Dollar', value: 'USD' },
              { label: 'EUR - Euro', value: 'EUR' },
              { label: 'GBP - British Pound', value: 'GBP' },
              { label: 'INR - Indian Rupee', value: 'INR' },
            ]}
          />
          <SettingsSelect
            id="timezone"
            label="Timezone"
            options={[
              { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
              { label: 'EST (Eastern Standard Time)', value: 'EST' },
              { label: 'IST (Indian Standard Time)', value: 'IST' },
            ]}
          />
          <SettingsSelect
            id="date-format"
            label="Date Format"
            options={[
              { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
              { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
              { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
            ]}
          />
          <SettingsSelect
            id="time-format"
            label="Time Format"
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
