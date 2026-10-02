import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  SettingsLayout,
  SettingsPageHeader,
  SettingsCard,
  SettingsSelect,
  SettingsToggle,
  SettingsSaveButton
} from '../../components/settings/shared';
import ModuleTabs, { securityTabs } from '../../components/module-tabs';
import { Layout, Key, Shield } from 'lucide-react';

export default function SecuritySettings() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [enforcePasswordPolicy, setEnforcePasswordPolicy] = useState(true);
  const [developerMode, setDeveloperMode] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 relative">
      <ModuleTabs tabs={securityTabs} activeKey="security-overview" />
      <div className="flex-1 overflow-y-auto">
        <SettingsLayout>
          <SettingsPageHeader
            title="Security Settings"
            description="Manage authentication, password policies, and access controls."
          />

      <SettingsCard title="Authentication" description="Configure how users sign in to the system.">
        <SettingsToggle
          label="Two-Factor Authentication (2FA)"
          description="Require all users in the organization to set up 2FA."
          checked={mfaEnabled}
          onChange={setMfaEnabled}
        />
        <div className="border-t border-slate-100 my-4"></div>
        <SettingsSelect
          id="session-timeout"
          label="Session Timeout"
          description="Automatically log users out after a period of inactivity."
          options={[
            { label: '15 Minutes', value: '15' },
            { label: '30 Minutes', value: '30' },
            { label: '1 Hour', value: '60' },
            { label: '4 Hours', value: '240' },
            { label: 'Never', value: 'never' },
          ]}
        />
      </SettingsCard>

      <SettingsCard title="Password Policy" description="Enforce strong password rules for all users.">
        <SettingsToggle
          label="Enforce Strict Password Policy"
          description="Require at least 8 characters, one uppercase, one number, and one special character."
          checked={enforcePasswordPolicy}
          onChange={setEnforcePasswordPolicy}
        />
        <div className="border-t border-slate-100 my-4"></div>
        <SettingsSelect
          id="password-expiration"
          label="Password Expiration"
          options={[
            { label: 'Never expire', value: 'never' },
            { label: 'Every 30 days', value: '30' },
            { label: 'Every 60 days', value: '60' },
            { label: 'Every 90 days', value: '90' },
          ]}
        />
      </SettingsCard>

      <SettingsCard title="Feature Management" description="Manage system features, action-level permissions and access controls.">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            Configure read, write, and delete permissions for application features.
          </div>
          <button
            onClick={() => navigate(`/company/${companyId}/portal-access`)}
            className="btn-primary"
          >
            Manage Features
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="Role & Permissions" description="Configure action-level permissions and access matrices for system roles.">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            Define role capabilities using granular READ, WRITE, and DELETE permissions.
          </div>
          <button
            onClick={() => navigate(`/company/${companyId}/settings/security/roles`)}
            className="btn-primary"
          >
            Manage Roles
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="User Permissions" description="Manage direct permission grants, overrides, and view effective user access.">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            Grant or revoke specific actions directly for individual users.
          </div>
          <button
            onClick={() => navigate(`/company/${companyId}/settings/security/users`)}
            className="btn-primary"
          >
            Manage Users
          </button>
        </div>
      </SettingsCard>

      <SettingsCard title="System & Developer" description="Advanced system configuration and developer options.">
        <SettingsToggle
          label="Developer Mode"
          description="Enable advanced debugging, experimental features, and API configuration."
          checked={developerMode}
          onChange={setDeveloperMode}
        />
      </SettingsCard>

      <SettingsSaveButton
        onClick={handleSave}
        isSaving={isSaving}
        isSuccess={isSuccess}
      />
        </SettingsLayout>
      </div>
    </div>
  );
}
