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
            <div key={service.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{service.icon}</div>
                <div>
                  <h3 className="font-semibold text-slate-900">{service.name}</h3>
                  <p className="text-sm text-slate-500">{service.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleConnection(service.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${connected[service.id]
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500 border border-slate-300'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500 border border-indigo-200'
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
