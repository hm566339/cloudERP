import React from 'react';
import { ClipboardList, Receipt, CreditCard, BarChart3 } from 'lucide-react';

export default function ExpenseNavigation({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'requests', label: 'Expense Requests', icon: ClipboardList },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reimbursements', label: 'Reimbursements', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-2.5 overflow-x-auto hide-scrollbar shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-1.5 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10.4px] font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-zinc-700' : 'text-zinc-400'} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
