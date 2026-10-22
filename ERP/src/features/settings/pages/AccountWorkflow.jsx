import React from 'react';
import { Plus } from 'lucide-react';

export default function AccountWorkflow() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Account Workflow Settings</h1>
        <button className="bg-zinc-900 hover:bg-zinc-800 dark:bg-primary dark:hover:bg-primary-600 text-white px-4 py-2 rounded-md flex items-center transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow Rule
        </button>
      </div>

      <div className="bg-white dark:bg-card-dark shadow rounded-lg p-6 border border-zinc-200 dark:border-border-dark">
        <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Configured Workflows</h2>
        <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-border-dark rounded">
          <p>No workflow rules configured yet.</p>
        </div>
      </div>
    </div>
  );
}
