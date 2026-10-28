import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRoutePath } from '../../hooks/useRoutePath';
import { documentFlowApi } from '../../api/common/documentFlow.api';
import {
  salesTabs,
  purchaseTabs,
  expenseTabs,
  accountingTabs,
  securityTabs,
  userTabs,
  gstTabs,
  DOC_TYPE_TO_KEY,
  detectModuleFromTabs,
} from './tabConfig.js';

export {
    salesTabs,
    purchaseTabs,
    expenseTabs,
    accountingTabs,
    securityTabs,
    userTabs,
    gstTabs,
    DOC_TYPE_TO_KEY,
    detectModuleFromTabs,
  };

export default function ModuleTabs({ tabs = salesTabs, module, activeKey, activeTab, onTabChange }) {
  const location = useLocation();
  const { buildPath } = useRoutePath();

  const detectedModule = module || detectModuleFromTabs(tabs);
  const [dynamicTabs, setDynamicTabs] = useState(null);

  useEffect(() => {
    if (!detectedModule) return;
    let isMounted = true;
    documentFlowApi.getTabs(detectedModule)
      .then((data) => {
        if (!isMounted) return;
        const flowTabs = data?.tabs || [];
        if (flowTabs.length > 0) {
          const tabMap = new Map();
          tabs.forEach((t) => {
            tabMap.set(t.key, t);
          });

          const ordered = [];
          flowTabs.forEach((item) => {
            if (item.isActive === false) return;
            const mappedKey = DOC_TYPE_TO_KEY[item.documentType] || item.key;
            const existing = tabMap.get(mappedKey);
            if (existing) {
              ordered.push({
                ...existing,
                label: item.label || existing.label,
                orderIndex: item.orderIndex
              });
              tabMap.delete(mappedKey);
            }
          });

          // Append any non-document tabs that remain in tabMap (e.g. analytical/reporting tabs)
          tabMap.forEach((v) => ordered.push(v));

          if (ordered.length > 0) {
            setDynamicTabs(ordered);
          }
        }
      })
      .catch(() => {
        // Fallback gracefully to default static tabs on network error or missing config
      });
    return () => {
      isMounted = false;
    };
  }, [detectedModule, tabs]);

  const effectiveTabs = dynamicTabs || tabs;

  const currentPath = (location.pathname || '').replace(/\/+$/, '').toLowerCase();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryTab = searchParams.get('tab')?.toLowerCase();

  // Strip company prefix for clean normalized comparison: /company/[id]/path -> /path
  const stripCompanyPrefix = (p) => (p ? p.replace(/^\/company\/[^/]+/, '') : '');
  const cleanCurrentPath = stripCompanyPrefix(currentPath);

  // Compute the single best active tab key
  const activeItemKey = useMemo(() => {
    // 1. Explicit prop passed
    const explicit = activeKey || activeTab;
    if (explicit) {
      const match = effectiveTabs.find((t) => (t.key || t.label)?.toLowerCase() === explicit.toLowerCase());
      if (match) return match.key || match.label;
    }

    // 2. Query param matching (e.g. ?tab=reports)
    if (queryTab) {
      const match = effectiveTabs.find((t) => t.key?.toLowerCase() === queryTab || t.label?.toLowerCase() === queryTab);
      if (match) return match.key || match.label;
    }

    // 3. Path segment / route matching with specific scoring
    let bestKey = null;
    let highestScore = -1;

    effectiveTabs.forEach((item) => {
      const key = item.key || item.label;
      const targetPath = buildPath(item.path);
      const allPaths = [
        item.path,
        targetPath,
        stripCompanyPrefix(item.path),
        stripCompanyPrefix(targetPath),
        ...(item.aliases || []),
        ...(item.aliases ? item.aliases.map((a) => buildPath(a)) : []),
        ...(item.aliases ? item.aliases.map((a) => stripCompanyPrefix(a)) : [])
      ].filter(Boolean);

      allPaths.forEach((p) => {
        const norm = p.replace(/\/+$/, '').toLowerCase();
        if (!norm) return;

        // Exact match
        if (currentPath === norm || cleanCurrentPath === norm) {
          const score = 1000 + norm.length;
          if (score > highestScore) {
            highestScore = score;
            bestKey = key;
          }
        }
        // Sub-path match: currentPath starts with norm + '/'
        else if (currentPath.startsWith(`${norm}/`) || cleanCurrentPath.startsWith(`${norm}/`)) {
          const isGenericParent =
            norm === '/accounts/transactions/expenses' ||
            norm.endsWith('/transactions/expenses') ||
            norm === '/finance/expenses' ||
            norm.endsWith('/finance/expenses');
          const score = isGenericParent ? 10 : 200 + norm.length;
          if (score > highestScore) {
            highestScore = score;
            bestKey = key;
          }
        }
        // Tab key segment match
        else if (
          item.key &&
          (cleanCurrentPath.endsWith(`/${item.key.toLowerCase()}`) ||
            cleanCurrentPath.includes(`/${item.key.toLowerCase()}/`))
        ) {
          const score = 500 + item.key.length;
          if (score > highestScore) {
            highestScore = score;
            bestKey = key;
          }
        }
      });
    });

    // 4. Default fallback: if in sales module or on sales route, default to first tab (quotations)
    if (!bestKey && effectiveTabs.length > 0 && (detectedModule === 'SALES' || cleanCurrentPath.includes('sales') || cleanCurrentPath.includes('quotations'))) {
      return effectiveTabs[0].key || effectiveTabs[0].label;
    }

    // 5. Default fallback: if in expenses module but on base route, default to first tab (requests)
    if (!bestKey && effectiveTabs.length > 0 && cleanCurrentPath.includes('expenses')) {
      return effectiveTabs[0].key || effectiveTabs[0].label;
    }

    return bestKey;
  }, [effectiveTabs, currentPath, cleanCurrentPath, queryTab, activeKey, activeTab, buildPath]);

  return (
    <div className="bg-white/80 dark:bg-[#161922]/90 backdrop-blur-md border-b border-zinc-200 dark:border-[#2A2F3D] px-6 py-2.5 overflow-x-auto hide-scrollbar shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-1 min-w-max">
        {effectiveTabs.map((item) => {
          const Icon = item.icon;
          const targetPath = buildPath(item.path);
          const itemKey = item.key || item.label;
          const isActive = itemKey === activeItemKey;

          const tabClassName = `flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10.4px] font-semibold transition-all duration-200 ${isActive
              ? 'bg-zinc-900 text-white shadow-xs border border-zinc-900 dark:bg-[#4C8DFF] dark:text-white dark:border-[#4C8DFF]'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] dark:hover:bg-[#222736] border border-transparent'
            }`;

          if (onTabChange) {
            return (
              <button
                key={itemKey}
                type="button"
                onClick={() => onTabChange(itemKey)}
                className={tabClassName}
                aria-current={isActive ? 'page' : undefined}
              >
                {Icon && <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400 dark:text-[#6B7184]'} />}
                {item.label}
              </button>
            );
          }

          return (
            <Link
              key={itemKey}
              to={targetPath}
              className={tabClassName}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon && <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400 dark:text-[#6B7184]'} />}
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
