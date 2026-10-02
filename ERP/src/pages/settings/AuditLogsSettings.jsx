import React from 'react';
import {
  SettingsLayout,
  SettingsPageHeader,
  SettingsCard,
} from '../../components/settings/shared';
import { Search, Download, Filter } from 'lucide-react';

export default function AuditLogsSettings() {
  const logs = [
    { id: 1, action: 'User Login', user: 'admin@acmecorp.com', date: '2023-10-25 09:12:33', ip: '192.168.1.1' },
    { id: 2, action: 'Updated Settings', user: 'admin@acmecorp.com', date: '2023-10-25 09:15:10', ip: '192.168.1.1' },
    { id: 3, action: 'Created User', user: 'manager@acmecorp.com', date: '2023-10-24 14:20:00', ip: '192.168.1.42' },
    { id: 4, action: 'Failed Login', user: 'unknown', date: '2023-10-23 23:59:10', ip: '203.0.113.4' },
    { id: 5, action: 'Exported Data', user: 'admin@acmecorp.com', date: '2023-10-22 11:30:45', ip: '192.168.1.1' },
  ];

  return (
    <SettingsLayout>
      <SettingsPageHeader
        title="Audit & Logs"
        description="Review system activity, security events, and user actions."
      />

      <SettingsCard>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">
              <Filter size={16} /> Filter
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm hover:bg-indigo-100 transition-colors">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Date & Time</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{log.action}</td>
                  <td className="px-4 py-3 text-slate-600">{log.user}</td>
                  <td className="px-4 py-3 text-slate-600">{log.date}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
          <span>Showing 1 to 5 of 248 entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Prev</button>
            <button className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">2</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">3</button>
            <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Next</button>
          </div>
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}
