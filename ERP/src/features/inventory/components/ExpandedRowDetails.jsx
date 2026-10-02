import React from 'react';

const SYSTEM_FIELDS = [
  'id', 'companyId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
  'tenantId', 'version', 'isDeleted', 'deletedAt', 'deletedBy'
];

/**
 * A generic component to display detailed key-value pairs for any inventory record.
 * Automatically excludes system fields and formats common types (Dates, Booleans).
 */
const ExpandedRowDetails = ({ data, colSpan }) => {
  if (!data || typeof data !== 'object') return null;

  // Filter out system fields and prepare display items
  const displayItems = Object.entries(data)
    .filter(([key, value]) => {
      // Exclude system fields
      if (SYSTEM_FIELDS.includes(key)) return false;
      // Exclude null, undefined, or empty arrays
      if (value === null || value === undefined) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      // Exclude complex objects unless they are dates
      if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) return false;
      // Exclude UUIDs
      if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return false;
      return true;
    })
    .map(([key, value]) => {
      // Format the key (camelCase to Title Case)
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .replace(/Id$/, '') // Remove 'Id' suffix if present
        .trim();

      // Format the value
      let formattedValue = value;
      let valueClass = "text-sm font-semibold text-zinc-900 break-all";

      if (typeof value === 'boolean') {
        formattedValue = value ? 'Yes' : 'No';
        if (key.toLowerCase().includes('status') || key.toLowerCase().includes('active') || key.toLowerCase().includes('approved')) {
          const isPositive = value === true || String(value).toUpperCase() === 'ACTIVE' || String(value).toUpperCase() === 'APPROVED';
          valueClass = `inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`;
        }
      } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        // Looks like an ISO date string
        formattedValue = new Date(value).toLocaleString();
      } else if (value instanceof Date) {
        formattedValue = value.toLocaleString();
      } else if (typeof value === 'string' && (value === 'ACTIVE' || value === 'INACTIVE' || value === 'APPROVED' || value === 'DRAFT' || value === 'SUBMITTED' || value === 'REJECTED')) {
        // Badge for string statuses
        const isPositive = value === 'ACTIVE' || value === 'APPROVED';
        const isNeutral = value === 'DRAFT' || value === 'SUBMITTED';
        valueClass = `inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isPositive ? 'bg-emerald-100 text-emerald-700' :
          isNeutral ? 'bg-blue-100 text-blue-700' :
            'bg-rose-100 text-rose-700'
          }`;
      } else if (Array.isArray(value)) {
        formattedValue = `${value.length} items`;
      } else if (typeof value === 'number' && (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('value'))) {
        // Format currency-like numbers
        formattedValue = value.toLocaleString(undefined, { minimumFractionDigits: 2 });
      } else {
        formattedValue = String(value);
      }

      return { key: formattedKey, value: formattedValue, valueClass };
    });

  if (displayItems.length === 0) return null;

  return (
    <tr>
      <td colSpan={colSpan || 100} className="p-0 border-b border-zinc-100 whitespace-normal">
        <div className="bg-zinc-50/50 p-6 shadow-inner border-y border-zinc-100 animate-slide-down">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {displayItems.map((item, idx) => (
              <div key={idx} className="space-y-1 min-w-0">
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 truncate block">
                  {item.key}
                </span>
                <div className="min-w-0">
                  {item.valueClass.includes('inline-flex') ? (
                    <span className={item.valueClass}>{item.value}</span>
                  ) : (
                    <p className={`${item.valueClass.replace('break-all', 'truncate')} block`} title={String(item.value)}>{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default ExpandedRowDetails;