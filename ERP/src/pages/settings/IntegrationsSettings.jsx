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
            <div key={service.id} className="flex items-center justify-between p-4 border border-zinc-200 dark:border-border-dark rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{service.icon}</div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{service.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{service.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleConnection(service.id)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${connected[service.id]
                    ? 'bg-zinc-100 dark:bg-hover-dark text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:ring-zinc-500 border border-zinc-300 dark:border-border-dark'
                    : 'bg-zinc-900 dark:bg-primary text-white hover:bg-zinc-800 dark:hover:bg-primary-600 focus:ring-zinc-900 dark:focus:ring-primary border border-zinc-900 dark:border-primary'
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
