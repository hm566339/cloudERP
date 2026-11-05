import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Shield,
  Save,
  Check,
  CreditCard,
  Users,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';

export default function OrgNotificationsView({
  organization,
}) {
  const dispatch = useAppDispatch();
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [preferences, setPreferences] = useState({
    systemAlerts: true,
    securityAlerts: true,
    memberActivity: true,
    billingInvoices: true,
    weeklyDigest: false,
  });

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      dispatch(
        addAlert({
          type: 'success',
          message: 'Organization notification preferences saved successfully.',
        })
      );
      setTimeout(() => setSavedSuccess(false), 2500);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D] gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            <Bell size={22} className="text-[#485942] dark:text-[#A0A6B5]" />
            Notifications & Alerts
          </h1>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1">
            Configure organization-wide alert routing, administrative notifications, and email delivery rules.
          </p>
        </div>
      </div>

      {/* ── Preferences Form ── */}
      <form onSubmit={handleSave} className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-5">
        <div className="space-y-3.5">
          {/* Item 1: Security Alerts */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D]">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg bg-[#EDEEE4] dark:bg-[#222736] text-[#2E3D28] dark:text-primary mt-0.5">
                <Shield size={16} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                  Security & Authentication Events
                </h3>
                <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                  Receive immediate alerts for unrecognized IP logins, failed admin credentials, and 2FA configuration changes.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={preferences.securityAlerts}
                onChange={() => handleToggle('securityAlerts')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 dark:bg-[#2A2F3D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 dark:after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E3D28] dark:peer-checked:bg-primary" />
            </label>
          </div>

          {/* Item 2: Team & Member Activity */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D]">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg bg-[#EDEEE4] dark:bg-[#222736] text-[#2E3D28] dark:text-primary mt-0.5">
                <Users size={16} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                  Membership & Company Access Changes
                </h3>
                <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                  Notify organization owners when a user is assigned to a new company or when their company-wise role is updated.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={preferences.memberActivity}
                onChange={() => handleToggle('memberActivity')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 dark:bg-[#2A2F3D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 dark:after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E3D28] dark:peer-checked:bg-primary" />
            </label>
          </div>

          {/* Item 3: Billing & Subscription Notices */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D]">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg bg-[#EDEEE4] dark:bg-[#222736] text-[#2E3D28] dark:text-primary mt-0.5">
                <CreditCard size={16} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                  Subscription, Invoices & Payment Confirmations
                </h3>
                <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                  Send PDF tax invoices, plan renewal reminders, and payment receipts to the primary organization email.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={preferences.billingInvoices}
                onChange={() => handleToggle('billingInvoices')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 dark:bg-[#2A2F3D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 dark:after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E3D28] dark:peer-checked:bg-primary" />
            </label>
          </div>

          {/* Item 4: Weekly Digest */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D]">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg bg-[#EDEEE4] dark:bg-[#222736] text-[#2E3D28] dark:text-primary mt-0.5">
                <Mail size={16} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                  Weekly Multi-Company Operational Digest
                </h3>
                <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                  A high-level weekly executive summary covering pending workflow approvals, invoicing totals, and active sessions across all companies.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={preferences.weeklyDigest}
                onChange={() => handleToggle('weeklyDigest')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 dark:bg-[#2A2F3D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 dark:after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E3D28] dark:peer-checked:bg-primary" />
            </label>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] dark:hover:bg-primary-600 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Preferences Saved</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Notification Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

