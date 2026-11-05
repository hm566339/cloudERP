import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Clock,
  Lock,
  Save,
  Check,
  AlertTriangle,
} from 'lucide-react';

export default function OrgSecurityView({
  initialTwoFactor = false,
  initialTimeout = '60',
  onSaveSecurity,
  isSaving = false,
}) {
  const [twoFactorRequired, setTwoFactorRequired] = useState(initialTwoFactor);
  const [sessionTimeout, setSessionTimeout] = useState(initialTimeout);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSaveSecurity) {
      await onSaveSecurity({
        twoFactorRequired,
        sessionTimeout,
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
            <ShieldCheck size={22} className="text-[#485942] dark:text-[#A0A6B5]" />
            Security & Authentication
          </h1>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1">
            Enforce organization-wide security baselines, multi-factor verification, and session lifecycle policies.
          </p>
        </div>
      </div>

      {/* ── Policies Form Card ── */}
      <form onSubmit={handleSubmit} className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-6">
        <div className="space-y-4">
          {/* Policy 1: 2FA Enforcement */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-[#2E3D28] dark:text-primary" />
                <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                  Enforce Multi-Factor Authentication (2FA)
                </h3>
              </div>
              <p className="text-xs text-[#485942] dark:text-[#A0A6B5] leading-relaxed max-w-xl">
                When enabled, all organization members and users in any affiliated company workspace will be required to register a two-factor authenticator app (TOTP) upon next sign-in.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 self-start sm:self-center">
              <input
                type="checkbox"
                checked={twoFactorRequired}
                onChange={(e) => setTwoFactorRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 dark:bg-[#2A2F3D] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 dark:after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E3D28] dark:peer-checked:bg-primary" />
            </label>
          </div>

          {/* Policy 2: Session Timeout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#2E3D28] dark:text-primary" />
                <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                  Automatic Inactivity Session Timeout
                </h3>
              </div>
              <p className="text-xs text-[#485942] dark:text-[#A0A6B5] leading-relaxed max-w-xl">
                Automatically terminate user sessions and revoke access tokens after a specified period of user idle time to prevent unauthorized physical terminal access.
              </p>
            </div>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl text-zinc-800 dark:text-[#E6E8EE] focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/20 shrink-0"
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="60">60 Minutes (Standard)</option>
              <option value="120">2 Hours</option>
              <option value="480">8 Hours</option>
            </select>
          </div>

          {/* Policy 3: Password Complexity Baseline */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-[#1D212C] border border-zinc-200/70 dark:border-[#2A2F3D]">
            <Lock size={16} className="text-[#2E3D28] dark:text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                Password Complexity & Salt Storage
              </h3>
              <p className="text-xs text-[#485942] dark:text-[#A0A6B5] leading-relaxed">
                All organization passwords are required to have a minimum length of 8 characters, combining uppercase, lowercase, numbers, and special symbols. All credentials are cryptographic hashes stored using BCrypt-12.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] dark:hover:bg-primary-600 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Policies...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Policies Updated</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Security Policies</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

