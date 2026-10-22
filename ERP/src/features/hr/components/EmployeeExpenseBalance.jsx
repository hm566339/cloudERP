import React, { useState, useEffect } from 'react';
import { expenseRequestService } from '../../../api/account/expenseRequests';
import { PieChart, Info, CreditCard } from 'lucide-react';

export default function EmployeeExpenseBalance({ employeeId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!employeeId) return;
    
    const fetchBalances = async () => {
      try {
        setLoading(true);
        const response = await expenseRequestService.getEmployeeBalances({ employeeId });
        const balanceData = response?.data || response;
        setData(balanceData);
      } catch (err) {
        setError('Failed to load expense balances.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [employeeId]);

  if (!employeeId) {
    // For debugging purposes, if employeeId is missing, let's still render something to show it's here
    return (
      <div className="card p-4 text-red-500 font-bold border border-red-500">
        EmployeeExpenseBalance is mounted but employeeId is missing!
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-4 flex items-center justify-center min-h-[200px]">
        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 min-h-[200px] flex flex-col items-center justify-center text-rose-500">
        <Info size={24} className="mb-2" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!data || data.totalRequestedAmount === undefined) {
    return (
      <div className="card p-4 min-h-[200px] flex flex-col items-center justify-center text-zinc-500">
        <CreditCard size={24} className="mb-2 opacity-50" />
        <p className="text-sm font-medium">No expense records found.</p>
      </div>
    );
  }

  const {
    totalRequestedAmount = 0,
    totalApprovedAmount = 0,
    totalUsedAmount = 0,
    totalRemainingAmount = 0,
    requests = []
  } = data;

  const usedPercentage = totalApprovedAmount > 0 ? Math.min(100, (totalUsedAmount / totalApprovedAmount) * 100) : 0;
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="card p-5 space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-[#2A2F3D] pb-3">
        <PieChart size={18} className="text-indigo-600" />
        <h3 className="text-sm font-bold text-zinc-800">Employee Expense Balance</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Requested</p>
          <p className="text-lg font-extrabold text-zinc-800">{formatCurrency(totalRequestedAmount)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Company Approved</p>
          <p className="text-lg font-extrabold text-indigo-800">{formatCurrency(totalApprovedAmount)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 shadow-sm">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Amount Used</p>
          <p className="text-lg font-extrabold text-amber-700">{formatCurrency(totalUsedAmount)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Remaining Balance</p>
          <p className="text-lg font-extrabold text-emerald-700">{formatCurrency(totalRemainingAmount)}</p>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex justify-between text-xs font-bold text-zinc-600">
          <span>Used: {formatCurrency(totalUsedAmount)} / {formatCurrency(totalApprovedAmount)}</span>
          <span>Remaining: {formatCurrency(totalRemainingAmount)}</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700 rounded-full" 
            style={{ width: `${usedPercentage}%` }}
          />
        </div>
      </div>

      {requests.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-zinc-100">
          <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Expense Request Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requests.map((req, idx) => (
              <div key={req.id || idx} className="p-3.5 rounded-xl border border-zinc-200 dark:border-border-dark bg-white dark:bg-card-dark shadow-sm text-xs space-y-2">
                <div className="flex justify-between items-start border-b border-zinc-100 dark:border-[#2A2F3D] pb-2 mb-2">
                  <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                    {req.id || req.requestNumber || req.expenseRequestNo || `REQ-${idx + 1}`}
                  </span>
                  <span className="font-bold text-zinc-500">{req.category || 'General'}</span>
                </div>
                <div className="text-zinc-600 space-y-1.5">
                  <p><span className="text-zinc-400 font-medium">Purpose:</span> <span className="font-semibold text-zinc-800">{req.purpose}</span></p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                    <p><span className="text-zinc-400">Requested:</span> <span className="font-bold">{formatCurrency(req.requestedAmount || req.requested || 0)}</span></p>
                    <p className="text-right"><span className="text-zinc-400">Approved:</span> <span className="font-bold">{formatCurrency(req.approvedAmount || req.approved || 0)}</span></p>
                    <p><span className="text-zinc-400">Used:</span> <span className="font-bold text-amber-600">{formatCurrency(req.usedAmount || req.used || 0)}</span></p>
                    <p className="text-right font-extrabold text-emerald-600 bg-emerald-50 rounded px-1">
                      Rem: {formatCurrency(req.remainingAmount || req.remaining || 0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
