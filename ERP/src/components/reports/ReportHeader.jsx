import React from 'react';
import ExportButtons from './ExportButtons';

export default function ReportHeader({ title, subtitle, isLoading, onExportPdf, onExportExcel, onPrint, generatedAt }) {
  return (
    <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 sticky top-0 z-10 shadow-sm mb-6">
      <div className="-ml-4 -mt-4 flex justify-between items-center flex-wrap sm:flex-nowrap">
        <div className="ml-4 mt-4">
          <h3 className="text-xl leading-6 font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {generatedAt && (
            <p className="mt-1 text-xs text-gray-400">
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
