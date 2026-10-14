import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Loader2,
  DollarSign,
  FileText,
  Users,
  Package,
  Layers,
  Inbox,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatAmount } from '../../utils/formatters';

// Generic Icon Resolver
function WidgetIcon({ name, className = 'w-5 h-5' }) {
  const iconLower = String(name || '').toLowerCase();
  if (iconLower.includes('dollar') || iconLower.includes('money') || iconLower.includes('cash'))
    return <DollarSign className={className} />;
  if (iconLower.includes('user') || iconLower.includes('customer') || iconLower.includes('vendor'))
    return <Users className={className} />;
  if (iconLower.includes('invoice') || iconLower.includes('file') || iconLower.includes('doc'))
    return <FileText className={className} />;
  if (iconLower.includes('box') || iconLower.includes('product') || iconLower.includes('inventory'))
    return <Package className={className} />;
  return <Layers className={className} />;
}

// 1. Metric CARD Widget
function MetricCardWidget({ widget, currency }) {
  const data = widget.data || {};
  const value = data.value !== undefined ? data.value : data.amount !== undefined ? data.amount : data.count;
  const isCurrency = data.format === 'currency' || typeof value === 'number' && data.isCurrency !== false && !Number.isInteger(value);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{widget.title}</span>
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
          <WidgetIcon name={widget.icon || widget.id} className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {isCurrency ? formatCurrency(value, currency) : formatAmount(value, 0, 0)}
        </h3>

        {data.trend !== undefined && (
          <div className="flex items-center gap-1 mt-1 text-[11px] font-medium">
            {data.trend >= 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +{data.trend}%
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" /> {data.trend}%
              </span>
            )}
            <span className="text-zinc-400 ml-1">vs previous period</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 2. QUICK_ACTION / NAVIGATION Widget
function QuickActionWidget({ widget }) {
  const navigate = useNavigate();
  const path = widget.api || widget.data?.path || widget.data?.url;

  return (
    <button
      type="button"
      onClick={() => path && navigate(path)}
      className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 rounded-xl flex items-center justify-between text-left transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <WidgetIcon name={widget.icon} className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{widget.title}</h4>
          {widget.data?.description && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{widget.data.description}</p>
          )}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

// 3. ALERT Widget
function AlertWidget({ widget }) {
  const data = widget.data || {};
  return (
    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h5 className="font-semibold">{widget.title}</h5>
        <p className="mt-0.5 text-amber-800 dark:text-amber-300 text-[11px]">{data.message || data.description || 'Action required.'}</p>
      </div>
    </div>
  );
}

// 4. APPROVAL Widget
function ApprovalWidget({ widget }) {
  const navigate = useNavigate();
  const items = Array.isArray(widget.data) ? widget.data : widget.data?.items || [];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>{widget.title || 'Pending Approvals'}</span>
        </h4>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-4 text-center text-xs text-zinc-400">No approvals pending.</div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
          {items.slice(0, 5).map((it, idx) => (
            <div key={it.id || idx} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{it.title || it.documentNumber}</p>
                <p className="text-[11px] text-zinc-500">{it.requester || it.submittedBy || 'Unknown'}</p>
              </div>
              <button
                type="button"
                onClick={() => it.actionUrl && navigate(it.actionUrl)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Review &rarr;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Universal Dynamic Dashboard Engine
 */
export default function DynamicDashboard({
  endpoint = '/api/account/dashboard/summary',
  title = 'Executive Dashboard',
  subtitle = 'Live operations & real-time analytics',
  staleTime = 60000,
  className = '',
}) {
  const { organization, can, canAccessModule } = useAuth();
  const orgCurrency = organization?.currency || 'INR';

  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoint);
      const data = res.data?.data || res.data;

      let extractedWidgets = [];
      if (Array.isArray(data)) {
        extractedWidgets = data;
      } else if (data?.widgets && Array.isArray(data.widgets)) {
        extractedWidgets = data.widgets;
      } else if (typeof data === 'object') {
        // Fallback adapter for standard summary objects: convert to cards
        extractedWidgets = Object.entries(data).map(([key, val], idx) => ({
          id: key,
          title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
          type: 'CARD',
          order: idx,
          visible: true,
          data: typeof val === 'object' ? val : { value: val },
        }));
      }

      setWidgets(extractedWidgets);
    } catch (err) {
      console.error('[DynamicDashboard] Failed to fetch widgets:', err);
      setError(err);
      setWidgets([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, staleTime);
    return () => clearInterval(interval);
  }, [fetchDashboard, staleTime]);

  // Filter widgets by permissions and sort by order
  const authorizedWidgets = useMemo(() => {
    return widgets
      .filter((w) => {
        if (!w || !w.visible) return false;
        if (w.permission && !can(w.permission)) return false;
        if (w.module && !canAccessModule(w.module)) return false;
        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [widgets, can, canAccessModule]);

  // Group widgets by type for grid layout
  const cards = authorizedWidgets.filter((w) => (w.type || 'CARD').toUpperCase() === 'CARD');
  const quickActions = authorizedWidgets.filter(
    (w) => ['NAVIGATION', 'QUICK_ACTION'].includes((w.type || '').toUpperCase())
  );
  const alerts = authorizedWidgets.filter((w) => (w.type || '').toUpperCase() === 'ALERT');
  const approvals = authorizedWidgets.filter((w) => (w.type || '').toUpperCase() === 'APPROVAL');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error ? (
        <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Failed to load dashboard metrics</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">{error.message || 'Please check network connection.'}</p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg"
          >
            Retry
          </button>
        </div>
      ) : loading && widgets.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Alerts section */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((al) => (
                <AlertWidget key={al.id} widget={al} />
              ))}
            </div>
          )}

          {/* Metric KPI Cards */}
          {cards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((cd) => (
                <MetricCardWidget key={cd.id} widget={cd} currency={orgCurrency} />
              ))}
            </div>
          )}

          {/* Quick Actions & Approvals Grid */}
          {(quickActions.length > 0 || approvals.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              {quickActions.length > 0 && (
                <div className="lg:col-span-2 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickActions.map((qa) => (
                      <QuickActionWidget key={qa.id} widget={qa} />
                    ))}
                  </div>
                </div>
              )}

              {/* Approvals */}
              {approvals.length > 0 && (
                <div className="space-y-3">
                  <ApprovalWidget widget={approvals[0]} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

DynamicDashboard.propTypes = {
  endpoint: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  staleTime: PropTypes.number,
  className: PropTypes.string,
};
