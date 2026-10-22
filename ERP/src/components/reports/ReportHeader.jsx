import React from 'react';
import ExportButtons from './ExportButtons';

export default function ReportHeader({ title, subtitle, isLoading, onExportPdf, onExportExcel, onPrint, generatedAt }) {
  return (
    <div className="bg-white dark:bg-[#161922] px-4 py-5 border-b border-zinc-200 dark:border-[#2A2F3D] sm:px-6 sticky top-0 z-10 shadow-sm mb-6">
      <div className="-ml-4 -mt-4 flex justify-between items-center flex-wrap sm:flex-nowrap">
        <div className="ml-4 mt-4">
          <h3 className="text-xl leading-6 font-bold text-zinc-900 dark:text-[#E6E8EE]">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-zinc-500 dark:text-[#A0A6B5]">{subtitle}</p>}
          {generatedAt && (
            <p className="mt-1 text-xs text-zinc-400 dark:text-[#6B7184]">
              Generated at: {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="ml-4 mt-4 flex-shrink-0">
          <ExportButtons 
            isLoading={isLoading}
            onExportPdf={onExportPdf}
            onExportExcel={onExportExcel}
            onPrint={onPrint}
          />
        </div>
      </div>
    </div>
  );
}
