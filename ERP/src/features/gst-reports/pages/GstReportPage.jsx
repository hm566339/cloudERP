import React from 'react';
import { GST_REPORT_TYPES, gstReportMeta, gstReportFetchers } from '../gstReportsConfig';
import GstReportViewer from '../components/GstReportViewer';
import GstSummaryDashboardPage from './GstSummaryDashboardPage';
import Gstr1Page from './Gstr1Page';
import Gstr3bPage from './Gstr3bPage';
import HsnSummaryPage from './HsnSummaryPage';
import ItcPage from './ItcPage';
import { useRoutePath } from "../../../hooks/useRoutePath";

export default function GstReportPage({ reportType }) {
  const { buildPath } = useRoutePath();

  // The summary report type renders the dedicated GST Summary Dashboard.
  if (reportType === GST_REPORT_TYPES.SUMMARY) {
    return <GstSummaryDashboardPage />;
  }
  
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
      <div className="bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-2xl p-10 text-center">
        <p className="text-sm font-semibold text-zinc-500">Unknown report type: {reportType}</p>
      </div>
    );
  }

  return <GstReportViewer reportType={reportType} meta={meta} fetcher={fetcher} />;
}
