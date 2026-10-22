import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, FileSearch, FileText, ShoppingCart, Truck, Receipt, CreditCard } from 'lucide-react';
import { useRoutePath } from '../../hooks/useRoutePath';

export const PurchaseNavigationContext = React.createContext(false);

export function getRfqBasePath(pathname) {
  if (pathname.includes('/accounts/transactions')) return '/accounts/transactions/rfqs';
  if (pathname.includes('/purchases/')) return '/purchases/rfqs';
  return '/rfqs';
}

export default function PurchaseNavigation() {
  const suppress = useContext(PurchaseNavigationContext);
  const location = useLocation();
  const { buildPath } = useRoutePath();
  const pathname = location.pathname;

  if (suppress) return null;

  const isAccountsTxn = pathname.includes('/accounts/transactions');
  const isPurchasesPrefix = pathname.includes('/purchases/');

  const matchesBoundary = (pattern) => {
    const at = pathname.indexOf(pattern);
    if (at === -1) return false;
    const beforeOk = at === 0 || pathname[at - 1] === '/';
    const end = at + pattern.length;
    const afterOk = end === pathname.length || pathname[end] === '/';
    return beforeOk && afterOk;
  };

  const navItems = [
    {
      id: 'requisitions',
      label: 'Purchase Requisitions',
      path: isAccountsTxn
        ? '/accounts/transactions/purchase-requisitions'
        : isPurchasesPrefix
        ? '/purchases/requisitions'
        : '/purchase-requisitions',
      matches: ['/purchase-requisitions', '/transactions/purchase-requisitions', '/purchases/requisitions'],
      icon: ClipboardList,
    },
    {
      id: 'rfqs',
      label: 'RFQs',
      path: isAccountsTxn
        ? '/accounts/transactions/rfqs'
        : isPurchasesPrefix
        ? '/purchases/rfqs'
        : '/rfqs',
      matches: ['/rfqs', '/transactions/rfqs', '/purchases/rfqs'],
      icon: FileSearch,
    },
    {
      id: 'supplier-quotes',
      label: 'Supplier Quotes',
      path: isAccountsTxn
        ? '/accounts/transactions/purchase-quotations'
        : isPurchasesPrefix
        ? '/purchases/quotations'
        : '/supplier-quotes',
      matches: ['/supplier-quotes', '/supplier-quotations', '/transactions/purchase-quotations', '/transactions/supplier-quotes', '/transactions/supplier-quotations', '/purchases/quotations', '/purchases/supplier-quotations'],
      icon: FileText,
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      path: isAccountsTxn
        ? '/accounts/transactions/purchase-orders'
        : isPurchasesPrefix
        ? '/purchases/purchase-orders'
        : '/purchase-orders',
      matches: ['/purchase-orders', '/transactions/purchase-orders', '/purchases/purchase-orders', '/purchases/orders'],
      icon: ShoppingCart,
    },
    {
      id: 'goods-receipts',
      label: 'Goods Receipts',
      path: isAccountsTxn
        ? '/accounts/transactions/goods-receipts'
        : isPurchasesPrefix
        ? '/purchases/goods-receipts'
        : '/goods-receipts',
      matches: ['/goods-receipts', '/transactions/goods-receipts', '/purchases/goods-receipts'],
      icon: Truck,
    },
    {
      id: 'purchase-invoices',
      label: 'Purchase Invoices',
      path: isAccountsTxn
        ? '/accounts/transactions/purchase'
        : isPurchasesPrefix
        ? '/purchases/invoices'
        : '/purchase-invoices',
      matches: ['/purchase-invoices', '/transactions/purchase', '/transactions/purchase-invoices', '/purchases/invoices'],
      icon: Receipt,
    },
    {
      id: 'payments',
      label: 'Payments',
      path: isAccountsTxn
        ? '/accounts/transactions/payments'
        : isPurchasesPrefix
        ? '/purchases/payments'
        : '/payments',
      matches: ['/payments', '/transactions/payments', '/purchases/payments'],
      icon: CreditCard,
    },
  ];

  return (
    <div className="bg-white/80 dark:bg-card-dark/80 backdrop-blur-md border-b border-zinc-200 dark:border-border-dark px-6 py-2.5 overflow-x-auto hide-scrollbar shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-1 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const targetUrl = buildPath(item.path);
          // Match robustly against either the base path or the built path
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/') || location.pathname === targetUrl || location.pathname.startsWith(targetUrl + '/');

          return (
            <Link
              key={item.id}
              to={targetUrl}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10.4px] font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-zinc-100 dark:bg-hover-dark text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-border-dark'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-hover-dark border border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
