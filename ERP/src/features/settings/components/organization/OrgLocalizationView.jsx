import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Globe,
  Calendar,
  Clock,
  Save,
  Check,
  Coins,
} from 'lucide-react';

export default function OrgLocalizationView({
  initialCurrency = 'INR',
  initialTimezone = 'Asia/Kolkata (IST)',
  initialFiscalYear = 'April',
  initialDateFormat = 'DD/MM/YYYY',
  initialTimeFormat = '12h',
  onSaveLocalization,
  isSaving = false,
}) {
  const [currency, setCurrency] = useState(initialCurrency);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [fiscalYearStart, setFiscalYearStart] = useState(initialFiscalYear);
  const [dateFormat, setDateFormat] = useState(initialDateFormat);
  const [timeFormat, setTimeFormat] = useState(initialTimeFormat);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSaveLocalization) {
      await onSaveLocalization({
        currency,
        timezone,
        fiscalYearStartMonth: fiscalYearStart,
        dateFormat,
        timeFormat,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D] gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            <SlidersHorizontal size={22} className="text-[#485942] dark:text-[#A0A6B5]" />
            Localization & Formats
          </h1>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1">
            Default formatting, currency, timezone, and fiscal calendar preferences inherited by new operating companies.
          </p>
        </div>
      </div>

      {/* ── Form Card ── */}
      <form onSubmit={handleSubmit} className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5 flex items-center gap-1.5">
              <Coins size={14} className="text-[#485942] dark:text-[#A0A6B5]" />
              Default Operating Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20 text-zinc-900 dark:text-[#E6E8EE]"
            >
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
              <option value="AED">AED — UAE Dirham (د.إ)</option>
              <option value="CAD">CAD — Canadian Dollar (C$)</option>
              <option value="AUD">AUD — Australian Dollar (A$)</option>
            </select>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
              Base financial currency for consolidated organization reporting.
            </p>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5 flex items-center gap-1.5">
              <Globe size={14} className="text-[#485942] dark:text-[#A0A6B5]" />
              Organization Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20 text-zinc-900 dark:text-[#E6E8EE]"
            >
              <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, UTC+05:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York (EST)">America/New_York (EST/EDT, UTC-05:00)</option>
              <option value="Europe/London (GMT)">Europe/London (GMT/BST, UTC+00:00)</option>
              <option value="Asia/Dubai (GST)">Asia/Dubai (GST, UTC+04:00)</option>
              <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT, UTC+08:00)</option>
            </select>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
              Used for audit log timestamps and scheduled task execution.
            </p>
          </div>

          {/* Fiscal Year Start */}
          <div>
            <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-[#485942] dark:text-[#A0A6B5]" />
              Fiscal Year Start Month
            </label>
            <select
              value={fiscalYearStart}
              onChange={(e) => setFiscalYearStart(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20 text-zinc-900 dark:text-[#E6E8EE]"
            >
              <option value="April">April (e.g. India standard: Apr 1 - Mar 31)</option>
              <option value="January">January (e.g. Calendar year: Jan 1 - Dec 31)</option>
              <option value="July">July (e.g. Australia / US fiscal)</option>
              <option value="October">October (e.g. US Federal fiscal)</option>
            </select>
            <p className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1">
              Determines annual financial closure and ledger reporting cycles.
            </p>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-[#485942] dark:text-[#A0A6B5]" />
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20 text-zinc-900 dark:text-[#E6E8EE]"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 15/10/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/15/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
            </select>
          </div>

          {/* Time Format */}
          <div>
            <label className="block text-xs font-semibold text-[#2E3D28] dark:text-[#E6E8EE] mb-1.5 flex items-center gap-1.5">
              <Clock size={14} className="text-[#485942] dark:text-[#A0A6B5]" />
              Time Format
            </label>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20 text-zinc-900 dark:text-[#E6E8EE]"
            >
              <option value="12h">12-Hour (e.g. 02:45 PM)</option>
              <option value="24h">24-Hour (e.g. 14:45)</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] dark:hover:bg-primary-600 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Defaults...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Defaults Saved</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Regional Defaults</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

