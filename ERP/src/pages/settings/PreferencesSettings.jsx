import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setThemeMode } from '../../features/theme/themeSlice';
import {
  SettingsLayout,
  SettingsPageHeader,
  SettingsCard,
  SettingsSelect,
  SettingsSaveButton
} from '../../components/settings/shared';

export default function PreferencesSettings() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.theme?.mode || 'system');
  const [density, setDensity] = useState('comfortable');
  const [language, setLanguage] = useState('en-US');
  const [rowsPerPage, setRowsPerPage] = useState('25');
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
        title="Preferences"
        description="Customize your personal interface, language, and display settings."
      />

      <SettingsCard title="Display Settings" description="Adjust how the application looks and feels.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSelect
            id="theme"
            label="Theme"
            value={themeMode}
            onChange={(e, val) => {
              const selected = val || e?.target?.value;
              if (selected) dispatch(setThemeMode(selected));
            }}
            options={[
              { label: 'System Default', value: 'system' },
              { label: 'Light Mode', value: 'light' },
              { label: 'Dark Mode', value: 'dark' },
            ]}
          />
          <SettingsSelect
            id="density"
            label="Layout Density"
            options={[
              { label: 'Comfortable', value: 'comfortable' },
              { label: 'Compact', value: 'compact' },
            ]}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Application Preferences" description="Set your language and table behaviors.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSelect
            id="language"
            label="Language"
            options={[
              { label: 'English (US)', value: 'en-US' },
              { label: 'English (UK)', value: 'en-GB' },
              { label: 'Spanish', value: 'es' },
              { label: 'French', value: 'fr' },
            ]}
          />
          <SettingsSelect
            id="rows-per-page"
            label="Table Rows Per Page"
            options={[
              { label: '10 Rows', value: '10' },
              { label: '25 Rows', value: '25' },
              { label: '50 Rows', value: '50' },
              { label: '100 Rows', value: '100' },
            ]}
          />
        </div>
      </SettingsCard>

      <SettingsSaveButton
        onClick={handleSave}
        isSaving={isSaving}
        isSuccess={isSuccess}
        label="Save Preferences"
      />
    </SettingsLayout>
  );
}
