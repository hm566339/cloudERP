import React from 'react';
import { Plus } from 'lucide-react';

export default function AccountWorkflow() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Account Workflow Settings</h1>
        <button className="bg-zinc-900 text-white px-4 py-2 rounded-md hover:bg-zinc-800 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow Rule
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Configured Workflows</h2>
        <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 border border-dashed border-zinc-300 rounded">
          <p>No workflow rules configured yet.</p>
        </div>
      </div>
    </div>
  );
}
