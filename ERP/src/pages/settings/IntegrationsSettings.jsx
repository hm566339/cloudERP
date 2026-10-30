import React, { useState } from 'react';
import {
  SettingsLayout,
  SettingsPageHeader,
  SettingsCard,
} from '../../components/settings/shared';

export default function IntegrationsSettings() {
  const [connected, setConnected] = useState({
    slack: true,
    stripe: false,
    salesforce: false
  });

  const toggleConnection = (service) => {
    setConnected(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const integrations = [
    { id: 'slack', name: 'Slack', description: 'Send system notifications to Slack channels.', icon: '💬' },
    { id: 'stripe', name: 'Stripe', description: 'Process payments and handle subscriptions.', icon: '💳' },
    { id: 'salesforce', name: 'Salesforce', description: 'Sync customer data with your CRM.', icon: '☁️' }
  ];

  return (
    <SettingsLayout>
      <SettingsPageHeader
        title="Integrations"
        description="Connect third-party services and configure API access."
      />

      <SettingsCard title="Connected Services" description="Manage connections to external applications.">
        <div className="space-y-4">
          {integrations.map(service => (
            <div key={service.id} className="flex items-center justify-between p-4 border border-[#D5D8CA] dark:border-border-dark rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{service.icon}</div>
                <div>
                  <h3 className="font-semibold text-[#2E3D28] dark:text-zinc-100">{service.name}</h3>
                  <p className="text-sm text-[#485942] dark:text-zinc-400">{service.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleConnection(service.id)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${connected[service.id]
                    ? 'bg-[#DCE2CF]/60 dark:bg-hover-dark text-[#2E3D28] dark:text-zinc-300 hover:bg-[#DCE2CF] dark:hover:bg-zinc-700 focus:ring-[#2E3D28] border border-[#BAC3A6] dark:border-border-dark'
                    : 'bg-[#2E3D28] dark:bg-primary text-white hover:bg-[#3C4E34] dark:hover:bg-primary-600 focus:ring-[#2E3D28] dark:focus:ring-primary border border-[#2E3D28] dark:border-primary'
                  }`}
              >
                {connected[service.id] ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}
