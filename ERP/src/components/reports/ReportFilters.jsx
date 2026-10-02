import React, { useState } from 'react';
import { Filter, Search } from 'lucide-react';

export default function ReportFilters({ children, onApply, isLoading, isSticky = false, hideButton = false }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`bg-white rounded-lg shadow mb-6 ${isSticky ? 'sticky top-[70.4px] z-10' : ''}`}>
      <div 
        className="px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center text-gray-700 font-medium">
          <Filter size={18} className="mr-2 text-indigo-500" />
          Report Filters
        </div>
        <div className="text-sm text-gray-500">
          {isOpen ? 'Collapse' : 'Expand'}
        </div>
      </div>
      
      {isOpen && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {children}
          </div>
          
          {!hideButton && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={onApply}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search size={16} className="mr-2" />
                )}
                Generate Report
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
