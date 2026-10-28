import React from 'react';
import { GST_REPORT_TYPES, gstReportMeta, gstReportFetchers } from '../gstReportsConfig';
import GstReportViewer from '../components/GstReportViewer';
import Gstr1Page from './Gstr1Page';
import Gstr3bPage from './Gstr3bPage';
import HsnSummaryPage from './HsnSummaryPage';
import ItcPage from './ItcPage';

export default function GstReportPage({ reportType }) {
  if (reportType === GST_REPORT_TYPES.GSTR1) {
    return <Gstr1Page />;
  }

  if (reportType === GST_REPORT_TYPES.GSTR3B) {
    return <Gstr3bPage />;
  }

  if (reportType === GST_REPORT_TYPES.HSN_SUMMARY) {
    return <HsnSummaryPage />;
  }

  if (reportType === GST_REPORT_TYPES.ITC) {
    return <ItcPage />;
  }

  const meta = gstReportMeta[reportType];
  const fetcher = gstReportFetchers[reportType];

  if (!meta || typeof fetcher !== 'function') {
    return (
      <div className="bg-white dark:bg-card-dark border border-zinc-200 dark:border-border-dark rounded-xl p-10 text-center">
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Unknown report type: {reportType}
        </p>
      </div>
    );
  }

  return <GstReportViewer reportType={reportType} meta={meta} fetcher={fetcher} />;
}
