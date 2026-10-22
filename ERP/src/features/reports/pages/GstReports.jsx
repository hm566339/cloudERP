import React from 'react';
import { Plus } from 'lucide-react';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function GstReports() {
  const { buildPath } = useRoutePath();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">GST Reports</h1>
        <button className="btn-primary px-4 py-2 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Generate Report
        </button>
      </div>

      <div className="bg-white dark:bg-card-dark shadow-sm border border-zinc-200 dark:border-border-dark rounded-xl p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Recent Reports</h2>
        <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 border border-dashed border-zinc-200 dark:border-border-dark rounded-xl text-zinc-500 dark:text-zinc-400">
          <p>No GST reports generated yet.</p>
        </div>
      </div>
    </div>
  );
}
