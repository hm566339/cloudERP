import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileSpreadsheet, Landmark, PieChart, BarChart3, ArrowRight } from 'lucide-react';
import ReportHeader from '../../../components/reports/ReportHeader';

export default function FinancialReports() {
  const navigate = useNavigate();

  const reports = [
    {
      title: 'Trial Balance',
      description: 'View the balance of all ledger accounts to ensure debits and credits match.',
      icon: <FileSpreadsheet className="w-8 h-8 text-blue-500" />,
      path: '/finance/reports/trial-balance',
      color: 'bg-blue-50',
    },
    {
      title: 'Profit & Loss',
      description: 'Analyze company revenues, costs, and expenses over a specific period.',
      icon: <PieChart className="w-8 h-8 text-indigo-500" />,
      path: '/finance/reports/profit-loss',
      color: 'bg-indigo-50',
    },
    {
      title: 'Balance Sheet',
      description: 'Review the company\'s assets, liabilities, and equity at a specific point in time.',
      icon: <Landmark className="w-8 h-8 text-emerald-500" />,
      path: '/finance/reports/balance-sheet',
      color: 'bg-emerald-50',
    },
    {
      title: 'General Ledger',
      description: 'Detailed record of all financial transactions across all accounts.',
      icon: <FileText className="w-8 h-8 text-amber-500" />,
      path: '/finance/reports/general-ledger',
      color: 'bg-amber-50',
    },
    {
      title: 'Cash Flow',
      description: 'Track how cash enters and leaves the business across operations, investing, and financing.',
      icon: <BarChart3 className="w-8 h-8 text-purple-500" />,
      path: '/finance/reports/cash-flow',
      color: 'bg-purple-50',
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <ReportHeader 
        title="Financial Reports" 
        subtitle="Access all key financial statements and accounting reports"
      />
      
      <div className="px-4 sm:px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
              onClick={() => navigate(report.path)}
            >
              <div className="p-6 flex-grow">
                <div className={`w-14 h-14 rounded-xl ${report.color} flex items-center justify-center mb-4`}>
                  {report.icon}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{report.title}</h3>
                <p className="text-zinc-500">{report.description}</p>
              </div>
              <div className="bg-zinc-50 px-6 py-3 border-t border-zinc-100 flex items-center justify-between text-indigo-600 font-medium">
                <span>View Report</span>
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
