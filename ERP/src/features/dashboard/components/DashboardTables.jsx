import React from 'react';
import { ShieldCheck, Globe } from 'lucide-react';

export function RoleTable({ roles = {} }) {
  const items = roles.items || [];
  const total = roles.total || 0;

  return (
    <div className="card overflow-hidden flex flex-col bg-white border border-zinc-200 rounded-xl shadow-sm">
      <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
        <h3 className="font-bold text-zinc-800">Role Distribution</h3>
        <span className="text-xs font-semibold text-zinc-500 bg-white px-2 py-1 rounded-md border border-zinc-200 shadow-sm">{total} Total Roles</span>
      </div>
      <div className="overflow-y-auto max-h-[256px]">
        {items.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white shadow-sm border-b border-zinc-100 z-10">
              <tr>
                <th className="w-12 text-center py-3">S.No.</th>
                <th className="py-3 px-5 text-xs font-bold text-zinc-400 uppercase tracking-wider">Role Name</th>
                <th className="py-3 px-5 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Assigned Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {[...items].map((role, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50">
                  <td className="text-center font-medium text-zinc-500">{idx + 1}</td>
                  <td className="py-3 px-5 font-semibold text-zinc-700">{role.roleName}</td>
                  <td className="py-3 px-5 text-right">
                    <span className="inline-block bg-zinc-100 text-zinc-700 font-bold px-2.5 py-0.5 rounded-full text-xs border border-zinc-200">
                      {role.assignedUsers}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-zinc-400">
            <ShieldCheck size={32} className="opacity-50 mb-3" />
            <p className="text-sm font-medium">No roles configured</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PortalAccessTable({ portalAccess = {} }) {
  const items = portalAccess.items || [];
  const total = portalAccess.total || 0;

  return (
    <div className="card overflow-hidden flex flex-col bg-white border border-zinc-200 rounded-xl shadow-sm">
      <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
        <h3 className="font-bold text-zinc-800">Portal Access Distribution</h3>
        <span className="text-xs font-semibold text-zinc-500 bg-white px-2 py-1 rounded-md border border-zinc-200 shadow-sm">{total} Total Accesses</span>
      </div>
      <div className="overflow-y-auto max-h-[256px]">
        {items.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white shadow-sm border-b border-zinc-100 z-10">
              <tr>
                <th className="w-12 text-center py-3">S.No.</th>
                <th className="py-3 px-5 text-xs font-bold text-zinc-400 uppercase tracking-wider">Module Name</th>
                <th className="py-3 px-5 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Granted Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {[...items].map((pa, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50">
                  <td className="text-center font-medium text-zinc-500">{idx + 1}</td>
                  <td className="py-3 px-5 font-semibold text-zinc-700">{pa.moduleName}</td>
                  <td className="py-3 px-5 text-right">
                    <span className="inline-block bg-zinc-100 text-zinc-700 font-bold px-2.5 py-0.5 rounded-full text-xs border border-zinc-200">
                      {pa.grantedUsers}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-zinc-400">
            <Globe size={32} className="opacity-50 mb-3" />
            <p className="text-sm font-medium">No portal accesses granted</p>
          </div>
        )}
      </div>
    </div>
  );
}
