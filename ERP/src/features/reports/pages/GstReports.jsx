import React from 'react';
import { Plus } from 'lucide-react';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function GstReports() {
  const { buildPath } = useRoutePath();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">GST Reports</h1>
        <button className="bg-zinc-900 text-white px-4 py-2 rounded-md hover:bg-zinc-800 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Generate Report
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Reports</h2>
        <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 border border-dashed border-zinc-300 rounded">
          <p>No GST reports generated yet.</p>
        </div>
      </div>
    </div>
  );
}
