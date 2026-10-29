import React from 'react';
import { ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import ModuleTabs, { gstTabs } from '../../../components/module-tabs';
import { useRoutePath } from '../../../hooks/useRoutePath';

export default function GstReports() {
  const { toPath } = useRoutePath();
  const navigate = useNavigate();

  const reports = [
    {
      title: 'GSTR-1 Outward Supplies',
      desc: 'Monthly/quarterly statement of outward supplies and invoice line details.',
      path: 'reports/gst/gstr1',
      badge: 'Return Form',
    },
    {
      title: 'GSTR-3B Summary Return',
      desc: 'Summary return of outward supplies, eligible input tax credit, and net liability.',
      path: 'reports/gst/gstr3b',
      badge: 'Return Form',
    },
    {
      title: 'HSN Summary',
      desc: 'Harmonized System of Nomenclature wise commodity summary of outward supplies.',
      path: 'reports/gst/hsn-summary',
      badge: 'Audit Report',
    },
    {
      title: 'Input Tax Credit (ITC)',
      desc: 'Detailed statement of input tax credit availed, reversed, and closing balance.',
      path: 'reports/gst/itc',
      badge: 'Ledger Audit',
    },
    {
      title: 'GSTR-2B Reconciliation',
      desc: 'Auto-drafted counterparty return matching and invoice credit verification.',
      path: 'reports/gst/gstr2b',
      badge: 'Reconciliation',
    },
    {
      title: 'Government Export Formats',
      desc: 'Download certified JSON filing packages for direct upload to GSTN portal.',
      path: 'reports/gst/export',
      badge: 'Filing Export',
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-6.5rem)] h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="GST Reports & Returns"
        description="Manage GST compliance, returns, reconciliations, and filing export archives"
        icon={FileText}
      />

      <ModuleTabs tabs={gstTabs} />

      <div className="p-6 space-y-6 flex-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r, i) => (
          <div
            key={i}
            onClick={() => navigate(toPath(r.path))}
            className="bg-white dark:bg-card-dark rounded-xl border border-zinc-200 dark:border-border-dark p-5 shadow-xs hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {r.badge}
                </span>
                <FileText size={16} className="text-zinc-400 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE] group-hover:text-primary transition-colors">
                {r.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                {r.desc}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-zinc-100 dark:border-border-dark flex items-center justify-between text-xs font-semibold text-primary">
              <span>View Report</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
          </div>
    </div>
  );
}
