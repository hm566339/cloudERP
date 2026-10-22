import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  ShieldCheck,
  RefreshCw,
  Receipt,
  FileText,
  DollarSign,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  getAdminOrganizationSubscription,
  getAdminOrganizationPayments,
  getAdminOrganizationInvoices,
} from '../../../api/sso/subscriptionPlan.api';
import { formatINR } from '../../../constants/subscriptionConstants';
import { formatPlanLimit } from '../../../utils/subscriptionPlanHelper';

export default function SubscriptionTab({ organizationId, org }) {
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);

    try {
      const [subRes, payRes, invRes] = await Promise.allSettled([
        getAdminOrganizationSubscription(organizationId),
        getAdminOrganizationPayments(organizationId),
        getAdminOrganizationInvoices(organizationId),
      ]);

      if (subRes.status === 'fulfilled') {
        setSubscription(subRes.value);
      } else {
        // Fallback: If dedicated admin endpoint returns 404, use org.subscription if available
        setSubscription(org?.subscription || null);
      }

      if (payRes.status === 'fulfilled') {
        const payData = payRes.value;
        const list = Array.isArray(payData) ? payData : payData?.content || [];
        setPayments(list);
      } else {
        setPayments([]);
      }

      if (invRes.status === 'fulfilled') {
        const invData = invRes.value;
        const list = Array.isArray(invData) ? invData : invData?.content || [];
        setInvoices(list);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-8 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-[#A0A6B5] font-semibold">
          <RefreshCw size={16} className="animate-spin text-zinc-700 dark:text-[#E6E8EE]" />
          <span>Loading organization subscription & billing telemetry...</span>
        </div>
      </div>
    );
  }

  const accessMode = subscription?.accessMode || org?.accessMode || 'FULL';
  const planCode = subscription?.planCode || subscription?.code || org?.planCode || 'NONE';
  const planName = subscription?.planName || subscription?.name || planCode.replace(/_/g, ' ');
  const status = (subscription?.status || org?.subscriptionStatus || 'INACTIVE').toUpperCase();
  const isTrial = subscription?.trialing || status === 'TRIAL' || status === 'TRIALING';
  const daysRemaining = subscription?.daysRemaining ?? null;
  const trialEndsAt = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : null;
  const currentPeriodEnd = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header Actions ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">
            Tenant Subscription & Billing Console
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A0A6B5]">
            Administrative overview of licensing tier, quotas, transaction receipts, and access state.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="btn-secondary h-8 px-3 text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Subscription Status Overview Card ── */}
      <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-[#2A2F3D] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-[#1D212C] border border-zinc-200/80 dark:border-[#2A2F3D] flex items-center justify-center text-zinc-800 dark:text-[#E6E8EE] shadow-2xs">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider">
                  Active Subscription Tier
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  status === 'ACTIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                    : isTrial
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60'
                    : 'bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' || isTrial ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                  {isTrial ? 'Trialing' : status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight mt-0.5">
                {planName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-[#A0A6B5] font-medium">
              Access Mode:
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
              accessMode === 'FULL'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                : accessMode === 'READ_ONLY'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
            }`}>
              <Lock size={12} />
              <span>{accessMode}</span>
            </span>
          </div>
        </div>

        {/* Quota & Dates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-zinc-50/80 dark:bg-[#1D212C] rounded-xl p-3 border border-zinc-100 dark:border-[#2A2F3D] space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Validity / Expiry</span>
            <span className="font-bold text-zinc-900 dark:text-[#E6E8EE] block text-sm">
              {currentPeriodEnd || trialEndsAt || 'No expiry configured'}
            </span>
            {daysRemaining !== null && (
              <span className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">{daysRemaining} days remaining</span>
            )}
          </div>

          <div className="bg-zinc-50/80 dark:bg-[#1D212C] rounded-xl p-3 border border-zinc-100 dark:border-[#2A2F3D] space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Max Companies</span>
            <span className="font-bold text-zinc-900 dark:text-[#E6E8EE] block text-sm">
              {formatPlanLimit(subscription?.maxCompanies ?? subscription?.plan?.maxCompanies, 'companies')}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">Allowed corporate entities</span>
          </div>

          <div className="bg-zinc-50/80 dark:bg-[#1D212C] rounded-xl p-3 border border-zinc-100 dark:border-[#2A2F3D] space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Users Per Company</span>
            <span className="font-bold text-zinc-900 dark:text-[#E6E8EE] block text-sm">
              {formatPlanLimit(subscription?.maxUsersPerCompany ?? subscription?.plan?.maxUsersPerCompany, 'users')}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">Seat quota per company</span>
          </div>

          <div className="bg-zinc-50/80 dark:bg-[#1D212C] rounded-xl p-3 border border-zinc-100 dark:border-[#2A2F3D] space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Plan Code</span>
            <span className="font-mono font-bold text-zinc-800 dark:text-[#E6E8EE] block text-sm">{planCode}</span>
            <span className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">System identifier</span>
          </div>
        </div>
      </div>

      {/* ── Payments & Transaction History ── */}
      <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#2A2F3D] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] flex items-center justify-center">
              <Receipt size={14} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">Payment Transactions</h4>
              <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">Razorpay order records and verified gateway settlements</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-[#A0A6B5]">
            {payments.length} Records
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 dark:text-[#6B7184] text-xs">
            <Receipt size={24} className="mx-auto mb-2 text-zinc-300 dark:text-[#6B7184]" />
            <p className="font-semibold text-zinc-600 dark:text-[#E6E8EE]">No payment records found for this organization</p>
            <p className="text-zinc-400 dark:text-[#6B7184] mt-0.5">Payments processed via checkout will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[580px]" aria-label="Payment Transactions Table">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider bg-zinc-50/80 dark:bg-[#1D212C] sticky top-0 z-10">
                  <th scope="col" className="py-2.5 px-3">Transaction / Order ID</th>
                  <th scope="col" className="py-2.5 px-3">Gateway Payment ID</th>
                  <th scope="col" className="py-2.5 px-3">Amount</th>
                  <th scope="col" className="py-2.5 px-3">Status</th>
                  <th scope="col" className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] text-zinc-700 dark:text-[#E6E8EE]">
                {payments.map((p, idx) => (
                  <tr key={p.id || p.orderId || idx} className="hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]/60">
                    <td className="py-2.5 px-3 font-mono font-semibold text-zinc-900 dark:text-[#E6E8EE]">
                      {p.orderId || p.subscriptionId || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-[#A0A6B5]">
                      {p.paymentId || p.razorpayPaymentId || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-[#E6E8EE] tabular-nums">
                      {p.amount ? formatINR(p.amount, false) : (p.amountInPaise ? formatINR(p.amountInPaise, true) : '—')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === 'SUCCESS' || p.status === 'PAID' || p.status === 'CAPTURED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          : 'bg-zinc-100 dark:bg-[#1D212C] text-zinc-600 dark:text-[#A0A6B5]'
                      }`}>
                        {p.status || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-[#A0A6B5] tabular-nums">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Generated Invoices ── */}
      <div className="bg-white dark:bg-[#161922] rounded-2xl border border-zinc-200/90 dark:border-[#2A2F3D] shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#2A2F3D] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#1D212C] text-zinc-700 dark:text-[#A0A6B5] flex items-center justify-center">
              <FileText size={14} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">Generated Billing Invoices</h4>
              <p className="text-[11px] text-zinc-500 dark:text-[#A0A6B5]">Official GST-compliant tax invoices issued to the organization</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-[#A0A6B5]">
            {invoices.length} Invoices
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 dark:text-[#6B7184] text-xs">
            <FileText size={24} className="mx-auto mb-2 text-zinc-300 dark:text-[#6B7184]" />
            <p className="font-semibold text-zinc-600 dark:text-[#E6E8EE]">No invoices generated yet</p>
            <p className="text-zinc-400 dark:text-[#6B7184] mt-0.5">Invoices will automatically generate following successful recurring billing or checkout.</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[580px]" aria-label="Billing Invoices Table">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-[#2A2F3D] text-xs font-semibold text-zinc-600 dark:text-[#A0A6B5] uppercase tracking-wider bg-zinc-50/80 dark:bg-[#1D212C] sticky top-0 z-10">
                  <th scope="col" className="py-2.5 px-3">Invoice Number</th>
                  <th scope="col" className="py-2.5 px-3">Period</th>
                  <th scope="col" className="py-2.5 px-3">Total Amount</th>
                  <th scope="col" className="py-2.5 px-3">Status</th>
                  <th scope="col" className="py-2.5 px-3">Issued Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D] text-zinc-700 dark:text-[#E6E8EE]">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id || inv.invoiceNumber || idx} className="hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]/60">
                    <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-[#E6E8EE]">
                      {inv.invoiceNumber || `#INV-${idx + 1}`}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-[#A0A6B5]">
                      {inv.period || 'Annual Cycle'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-[#E6E8EE] tabular-nums">
                      {inv.amount ? formatINR(inv.amount, false) : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                        {inv.status || 'PAID'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-[#A0A6B5] tabular-nums">
                      {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
