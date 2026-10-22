import React from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';

export default function ExportToolbar({ options: rawOptions = [], exporting, canExport, canPrint, onExport, onPrint }) {
  const options = Array.isArray(rawOptions) ? rawOptions : [];
  return (
    <div className="flex items-center gap-2">
      {canExport && options.map((opt) => (
        <button
          key={opt.id || opt.type}
          type="button"
          disabled={!!exporting}
          onClick={() => onExport(opt.id || opt.type)}
          className="btn-secondary text-[9.6px] whitespace-nowrap"
          title={opt.description}
        >
          {exporting === (opt.id || opt.type) ? <Loader2 size={14} className="animate-spin text-zinc-500 dark:text-[#A0A6B5]" /> : <Download size={14} className="text-zinc-500 dark:text-[#A0A6B5]" />}
          Export {opt.label}
        </button>
      ))}
      {canPrint && (
        <button
          type="button"
          onClick={onPrint}
          className="btn-secondary text-[9.6px] whitespace-nowrap"
        >
          <Printer size={14} className="text-zinc-500 dark:text-[#A0A6B5]" />
          Print
        </button>
      )}
    </div>
  );
}
