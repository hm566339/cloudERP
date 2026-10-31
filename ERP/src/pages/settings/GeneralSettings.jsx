import React, { useState, useEffect } from 'react';
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
import {
  useGetGeneralSettingsQuery,
  useUpdateGeneralSettingsMutation,
} from '../../features/settings/services/generalSettingsApi';

export default function GeneralSettings() {
  const dispatch = useAppDispatch();
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const currentUser = useAppSelector(selectCurrentUser);

  const { data: generalSettings, isLoading: isFetching, error: fetchError } = useGetGeneralSettingsQuery();
  const [updateGeneralSettingsMutation, { isLoading: isUpdating }] = useUpdateGeneralSettingsMutation();

  const [companyName, setCompanyName] = useState(selectedCompany?.name || 'Acme Corporation');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || 'admin@acmecorp.com');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('IST');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');

  const [isSuccess, setIsSuccess] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Synchronize local form state when backend settings are retrieved
  useEffect(() => {
    if (generalSettings && !hasInitialized) {
      if (generalSettings.companyName) setCompanyName(generalSettings.companyName);
      if (generalSettings.contactEmail) setContactEmail(generalSettings.contactEmail);
      if (generalSettings.defaultCurrency) setDefaultCurrency(generalSettings.defaultCurrency);
      if (generalSettings.timezone) setTimezone(generalSettings.timezone);
      if (generalSettings.dateFormat) setDateFormat(generalSettings.dateFormat);
      if (generalSettings.timeFormat) setTimeFormat(generalSettings.timeFormat);
      setHasInitialized(true);
    }
  }, [generalSettings, hasInitialized]);

  // Handle Save
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (isUpdating) return;

    // Simple frontend validation
    if (!companyName || companyName.trim().length < 2) {
      dispatch(addAlert({ type: 'error', message: 'Company name must be at least 2 characters' }));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail || !emailRegex.test(contactEmail.trim())) {
      dispatch(addAlert({ type: 'error', message: 'Please enter a valid contact email address' }));
      return;
    }

    try {
      const payload = {
        companyName: companyName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        defaultCurrency: defaultCurrency.trim().toUpperCase(),
        timezone: timezone.trim(),
        dateFormat: dateFormat.trim(),
        timeFormat: timeFormat.trim(),
      };

      const result = await updateGeneralSettingsMutation(payload).unwrap();

      // Ensure local state matches server response
      if (result) {
        if (result.companyName) setCompanyName(result.companyName);
        if (result.contactEmail) setContactEmail(result.contactEmail);
        if (result.defaultCurrency) setDefaultCurrency(result.defaultCurrency);
        if (result.timezone) setTimezone(result.timezone);
        if (result.dateFormat) setDateFormat(result.dateFormat);
        if (result.timeFormat) setTimeFormat(result.timeFormat);
      }

      setIsSuccess(true);
      dispatch(
        addAlert({
          type: 'success',
          message: 'General settings saved successfully',
        })
      );
      setTimeout(() => setIsSuccess(false), 2500);
    } catch (err) {
      const errorMsg =
        err?.data?.message ||
        err?.message ||
        'Failed to save general settings. Please try again.';
      dispatch(
        addAlert({
          type: 'error',
          message: errorMsg,
        })
      );
    }
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
          disabled={isFetching || isUpdating}
        />
        <SettingsInput
          id="contact-email"
          label="Contact Email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="e.g. admin@acmecorp.com"
          disabled={isFetching || isUpdating}
        />
      </SettingsCard>

      <SettingsCard title="Localization & Formats" description="Set your default timezone, currency, and date formats.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSelect
            id="default-currency"
            label="Default Currency"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            disabled={isFetching || isUpdating}
            options={[
              { label: 'INR - Indian Rupee (₹)', value: 'INR' },
              { label: 'USD - US Dollar ($)', value: 'USD' },
              { label: 'EUR - Euro (€)', value: 'EUR' },
              { label: 'GBP - British Pound (£)', value: 'GBP' },
              { label: 'AED - UAE Dirham (د.إ)', value: 'AED' },
              { label: 'CAD - Canadian Dollar (CA$)', value: 'CAD' },
              { label: 'AUD - Australian Dollar (A$)', value: 'AUD' },
              { label: 'SGD - Singapore Dollar (S$)', value: 'SGD' },
            ]}
          />
          <SettingsSelect
            id="timezone"
            label="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={isFetching || isUpdating}
            options={[
              { label: 'IST - Indian Standard Time (Asia/Kolkata)', value: 'IST' },
              { label: 'UTC - Coordinated Universal Time', value: 'UTC' },
              { label: 'EST - Eastern Standard Time (America/New_York)', value: 'EST' },
              { label: 'PST - Pacific Standard Time (America/Los_Angeles)', value: 'PST' },
              { label: 'CST - Central Standard Time (America/Chicago)', value: 'CST' },
              { label: 'GMT - Greenwich Mean Time (Europe/London)', value: 'GMT' },
              { label: 'CET - Central European Time (Europe/Paris)', value: 'CET' },
              { label: 'GST - Gulf Standard Time (Asia/Dubai)', value: 'Asia/Dubai' },
              { label: 'SGT - Singapore Time (Asia/Singapore)', value: 'Asia/Singapore' },
            ]}
          />
          <SettingsSelect
            id="date-format"
            label="Date Format"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            disabled={isFetching || isUpdating}
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
            disabled={isFetching || isUpdating}
            options={[
              { label: '12-hour (AM/PM)', value: '12h' },
              { label: '24-hour', value: '24h' },
            ]}
          />
        </div>
      </SettingsCard>

      <SettingsSaveButton
        onClick={handleSave}
        isSaving={isUpdating}
        isSuccess={isSuccess}
        disabled={isFetching || isUpdating}
      />
    </SettingsLayout>
  );
}
