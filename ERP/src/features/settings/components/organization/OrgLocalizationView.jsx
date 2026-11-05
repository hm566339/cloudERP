import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Globe,
  Calendar,
  Clock,
  Save,
  RotateCcw,
  Check,
  Coins,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import PageHeader from '../../../../components/common/PageHeader';

export default function OrgLocalizationView({
  initialCurrency = 'INR',
  initialTimezone = 'Asia/Kolkata (IST)',
  initialFiscalYear = 'April',
  initialDateFormat = 'DD/MM/YYYY',
  initialTimeFormat = '12h',
  onSaveLocalization,
  isSaving = false,
}) {
  const dispatch = useAppDispatch();

  // State
  const [language, setLanguage] = useState('en-IN');
  const [country, setCountry] = useState('India');
  const [currency, setCurrency] = useState(initialCurrency);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [dateFormat, setDateFormat] = useState(initialDateFormat);
  const [timeFormat, setTimeFormat] = useState(initialTimeFormat);
  const [numberFormat, setNumberFormat] = useState('indian'); // 'indian' or 'international'
  const [firstDayOfWeek, setFirstDayOfWeek] = useState('Monday');
  const [fiscalYearStart, setFiscalYearStart] = useState(initialFiscalYear);

  const handleReset = () => {
    setLanguage('en-IN');
    setCountry('India');
    setCurrency('INR');
    setTimezone('Asia/Kolkata (IST)');
    setDateFormat('DD/MM/YYYY');
    setTimeFormat('12h');
    setNumberFormat('indian');
    setFirstDayOfWeek('Monday');
    setFiscalYearStart('April');
    dispatch(addAlert({ type: 'info', message: 'Localization settings reset to standard defaults' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSaveLocalization) {
      await onSaveLocalization({
        language,
        country,
        currency,
        timezone,
        fiscalYearStartMonth: fiscalYearStart,
        dateFormat,
        timeFormat,
        numberFormat,
        firstDayOfWeek,
      });
    } else {
      dispatch(addAlert({ type: 'success', message: 'Localization preferences saved successfully' }));
    }
  };

  // Preview formatting calculation
  const sampleAmount = numberFormat === 'indian' ? '₹ 12,34,567.89' : '$ 1,234,567.89';
  const sampleDate =
    dateFormat === 'DD/MM/YYYY'
      ? '05/11/2026'
      : dateFormat === 'MM/DD/YYYY'
        ? '11/05/2026'
        : '2026-11-05';
  const sampleTime = timeFormat === '12h' ? '08:30 PM' : '20:30';

  return (
          <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
            <PageHeader
              title="Localization & Formats"
              description="Configure default language, timezone, currency, and date formats across the organization"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Saving...' : 'Save Formats'}</span>
                </button>
              </div>
        </PageHeader>

            {/* Main Content Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-5xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Card 1: Regional & Language */}
                <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    Language & Regional Standards
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                        Default Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="en-IN">English (India)</option>
                        <option value="en-US">English (United States)</option>
                        <option value="en-GB">English (United Kingdom)</option>
                        <option value="hi-IN">Hindi (India)</option>
                      </select>
                    </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                          Default Country / Jurisdiction
                        </label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                          <option value="Singapore">Singapore</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                          Time Zone
                        </label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST - UTC+05:30)</option>
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                          <option value="America/New_York (EST)">America/New_York (EST/EDT)</option>
                          <option value="Europe/London (GMT)">Europe/London (GMT/BST)</option>
                          <option value="Asia/Dubai (GST)">Asia/Dubai (GST - UTC+04:00)</option>
                          <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT - UTC+08:00)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                          First Day of Week
                        </label>
                        <select
                          value={firstDayOfWeek}
                          onChange={(e) => setFirstDayOfWeek(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="Monday">Monday (Standard)</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>
                    </div>
                  </div>

                    {/* Card 2: Formats & Currency */}
                    <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
                        Date, Time & Financial Formats
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                            Date Format
                          </label>
                          <select
                            value={dateFormat}
                            onChange={(e) => setDateFormat(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 05/11/2026)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/05/2026)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                            Time Format
                          </label>
                          <select
                            value={timeFormat}
                            onChange={(e) => setTimeFormat(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="12h">12-Hour (e.g. 08:30 PM)</option>
                            <option value="24h">24-Hour (e.g. 20:30)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                            Base Currency
                          </label>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="INR">INR (₹ - Indian Rupee)</option>
                            <option value="USD">USD ($ - US Dollar)</option>
                            <option value="EUR">EUR (€ - Euro)</option>
                            <option value="GBP">GBP (£ - British Pound)</option>
                            <option value="AED">AED (د.إ - UAE Dirham)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                            Number & Currency Formatting
                          </label>
                          <select
                            value={numberFormat}
                            onChange={(e) => setNumberFormat(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="indian">Indian System (Lakhs & Crores: 1,23,456.78)</option>
                            <option value="international">International System (Millions: 123,456.78)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                            Fiscal Year Starting Month
                          </label>
                          <select
                            value={fiscalYearStart}
                            onChange={(e) => setFiscalYearStart(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="April">April (Standard Indian Fiscal)</option>
                            <option value="January">January (Calendar Year)</option>
                            <option value="July">July</option>
                            <option value="October">October</option>
                          </select>
                        </div>
                      </div>
                    </div>

                      {/* Live Preview Card */}
                      <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-3">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-800">
                          Live Formatting Preview
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl space-y-1">
                            <span className="font-bold text-zinc-500 uppercase tracking-wider">Formatted Date</span>
                            <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{sampleDate}</p>
                          </div>
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl space-y-1">
                            <span className="font-bold text-zinc-500 uppercase tracking-wider">Formatted Time</span>
                            <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">{sampleTime}</p>
                          </div>
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl space-y-1">
                            <span className="font-bold text-zinc-500 uppercase tracking-wider">Sample Amount</span>
                            <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{sampleAmount}</p>
                          </div>
                        </div>
                      </div>
              </form>
            </div>
          </div>
          );
}
