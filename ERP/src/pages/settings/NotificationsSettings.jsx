import React, { useState } from 'react';
import { 
  SettingsLayout, 
  SettingsPageHeader, 
  SettingsCard, 
  SettingsToggle,
  SettingsSaveButton 
} from '../../components/settings/shared';

export default function NotificationsSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [state, setState] = useState({
    emailAlerts: true,
    systemAlerts: true,
    accountActivity: true,
    transactions: false,
    marketing: false
  });

  const handleChange = (key) => (checked) => {
    setState(prev => ({ ...prev, [key]: checked }));
  };

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
        title="Notifications Settings" 
        description="Configure how and when you receive system alerts and emails."
      />

      <SettingsCard title="Email Notifications" description="Manage what emails are sent to your inbox.">
        <SettingsToggle 
          label="Email Alerts"
          description="Receive critical system alerts via email."
          checked={state.emailAlerts}
          onChange={handleChange('emailAlerts')}
        />
        <div className="border-t border-slate-100 my-2"></div>
        <SettingsToggle 
          label="Account Activity"
          description="Get notified about logins, password changes, and security events."
          checked={state.accountActivity}
          onChange={handleChange('accountActivity')}
        />
        <div className="border-t border-slate-100 my-2"></div>
        <SettingsToggle 
          label="Product Updates"
          description="Receive news, updates, and marketing emails."
          checked={state.marketing}
          onChange={handleChange('marketing')}
        />
      </SettingsCard>

      <SettingsCard title="System Alerts" description="Manage alerts displayed within the application dashboard.">
        <SettingsToggle 
          label="In-App System Alerts"
          description="Show critical system and maintenance alerts in the UI."
          checked={state.systemAlerts}
          onChange={handleChange('systemAlerts')}
        />
        <div className="border-t border-slate-100 my-2"></div>
        <SettingsToggle 
          label="Transaction Notifications"
          description="Show alerts when large transactions or anomalies occur."
          checked={state.transactions}
          onChange={handleChange('transactions')}
        />
      </SettingsCard>
      
      <SettingsSaveButton 
        onClick={handleSave} 
        isSaving={isSaving} 
        isSuccess={isSuccess} 
      />
    </SettingsLayout>
  );
}
