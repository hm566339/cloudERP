import React from 'react';

const BankAccountStatusBadge = ({ isActive, status, isPrimary }) => {
  let badgeColor = 'bg-zinc-50 text-zinc-600 border-zinc-200';
  let badgeLabel = 'Inactive';

  if (isActive === true || status?.toUpperCase() === 'ACTIVE') {
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    badgeLabel = 'Active';
  } else if (isActive === false || status?.toUpperCase() === 'INACTIVE') {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    badgeLabel = 'Inactive';
  }

  return (
    <div className="flex items-center gap-1.5 justify-center">
      <span className={`px-2.5 py-1 text-[8.8px] font-semibold rounded-md border ${badgeColor}`}>
        {badgeLabel}
      </span>
      {isPrimary && (
        <span className="px-2 py-1 text-[8.5px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200" title="Primary Account">
          PRIMARY
        </span>
      )}
    </div>
  );
};

export default BankAccountStatusBadge;
