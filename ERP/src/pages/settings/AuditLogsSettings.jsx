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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-[#222736] transition-colors">
              <Filter size={16} /> Filter
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm hover:bg-zinc-800 transition-colors">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse min-w-[540px]" aria-label="Audit Logs Table">
            <thead className="text-xs font-semibold text-zinc-600 bg-zinc-50 uppercase border-b border-zinc-200 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Action</th>
                <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">User</th>
                <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Date & Time</th>
                <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-zinc-900 whitespace-nowrap">{log.action}</td>
                  <td className="px-4 py-3.5 text-zinc-600 whitespace-nowrap">{log.user}</td>
                  <td className="px-4 py-3.5 text-zinc-600 whitespace-nowrap tabular-nums">{log.date}</td>
                  <td className="px-4 py-3.5 text-zinc-500 font-mono text-xs whitespace-nowrap tabular-nums">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-zinc-500">
          <span>Showing 1 to 5 of 248 entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-zinc-200 rounded-lg hover:bg-zinc-50">Prev</button>
            <button className="px-3 py-1 bg-zinc-900 text-white rounded-lg font-bold">1</button>
            <button className="px-3 py-1 border border-zinc-200 rounded-lg hover:bg-zinc-50">2</button>
            <button className="px-3 py-1 border border-zinc-200 rounded-lg hover:bg-zinc-50">3</button>
            <button className="px-3 py-1 border border-zinc-200 rounded-lg hover:bg-zinc-50">Next</button>
          </div>
        </div>
      </SettingsCard>
    </SettingsLayout>
  );
}
