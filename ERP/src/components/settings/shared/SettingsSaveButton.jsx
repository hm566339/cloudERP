import React from 'react';
import { Save, Check } from 'lucide-react';

export function SettingsSaveButton({ onClick, isSaving = false, isSuccess = false, label = "Save Changes" }) {
  return (
    <div className="flex justify-end mt-6 pt-6 border-t border-slate-100">
      <button
        type="button"
        onClick={onClick}
        disabled={isSaving}
        className={`flex items-center gap-2 px-6 py-2.5 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed ${
          isSuccess 
            ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' 
            : 'bg-zinc-900 hover:bg-zinc-800 focus:ring-zinc-900'
        }`}
      >
        {isSuccess ? <Check size={16} /> : <Save size={16} />}
        {isSaving ? "Saving..." : isSuccess ? "Saved!" : label}
      </button>
    </div>
  );
}
