import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowRight, X } from 'lucide-react';

/**
 * Accessible Organization & Company Portal Finder Modal
 * Allows existing Mark2 ERP customers to seamlessly navigate to their dedicated login portal:
 * - /o/:organizationCode/login (Organization Portal)
 * - /c/:companyCode/login (Company Subsidiary Portal)
 * - /admin-login (Platform Administrator)
 */
export default function LandingSignInModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loginMode, setLoginMode] = useState('org'); // 'org' | 'company'
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toLowerCase();
    if (!cleanCode) {
      setError(`Please enter your ${loginMode === 'org' ? 'Organization' : 'Company'} code.`);
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(cleanCode)) {
      setError('Code may only contain letters, numbers, hyphens, and underscores.');
      return;
    }

    onClose();
    if (loginMode === 'org') {
      navigate(`/o/${encodeURIComponent(cleanCode)}/login`);
    } else {
      navigate(`/c/${encodeURIComponent(cleanCode)}/login`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-md bg-[#F7F7F0] dark:bg-[#161D17] rounded-3xl border border-[#D5D8CA] dark:border-[#26382B] p-6 sm:p-8 shadow-2xl text-[#2E3D28] dark:text-[#ECF2EC] animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#485942] dark:text-[#A3B5A5] hover:bg-[#EDEEE4] dark:hover:bg-[#202E23] hover:text-[#2E3D28] dark:hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#2E3D28] dark:bg-[#1F2C21] text-white dark:text-[#34D399] border dark:border-[#2E3D31] flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <h3 id="modal-title" className="text-lg font-bold text-[#2E3D28] dark:text-white leading-tight">
              Sign In to Mark2 ERP
            </h3>
            <p className="text-xs text-[#485942] dark:text-[#A3B5A5]">Access your dedicated tenant workspace</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex p-1 bg-[#EDEEE4] dark:bg-[#101712] rounded-xl border border-[#D5D8CA] dark:border-[#26382B] mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setLoginMode('org'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              loginMode === 'org'
                ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-xs font-bold'
                : 'text-[#485942] dark:text-[#A3B5A5] hover:text-[#2E3D28] dark:hover:text-white'
            }`}
          >
            Organization Portal
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('company'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              loginMode === 'company'
                ? 'bg-[#2E3D28] dark:bg-[#34D399] text-white dark:text-[#051A0E] shadow-xs font-bold'
                : 'text-[#485942] dark:text-[#A3B5A5] hover:text-[#2E3D28] dark:hover:text-white'
            }`}
          >
            Company Subsidiary
          </button>
        </div>

        {/* Portal Finder Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2E3D28] dark:text-[#ECF2EC] mb-1.5">
              {loginMode === 'org' ? 'Organization Code / Slug' : 'Company Subsidiary Code'}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder={loginMode === 'org' ? 'e.g. apex, mohit, corp' : 'e.g. APEX-01, HQ'}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5D8CA] dark:border-[#26382B] bg-white dark:bg-[#101712] text-sm text-[#2E3D28] dark:text-white placeholder-[#7A8A6E] dark:placeholder-[#6C7E6E] focus:outline-none focus:ring-2 focus:ring-[#2E3D28]/30 dark:focus:ring-[#34D399]/40 focus:border-[#2E3D28] dark:focus:border-[#34D399] transition-all font-mono"
              />
            </div>
            {error && (
              <p className="text-xs text-[#B91C1C] dark:text-[#F87171] mt-1.5 font-medium">{error}</p>
            )}
            <p className="text-[11px] text-[#7A8A6E] dark:text-[#889B89] mt-1.5">
              Portal URL: <span className="font-mono text-[#2E3D28] dark:text-[#34D399]">/o/{code ? code.trim().toLowerCase() : 'your-code'}/login</span>
            </p>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#2E3D28] dark:bg-[#10B981] text-white dark:text-[#051A0E] text-sm font-bold hover:bg-[#3C4E34] dark:hover:bg-[#34D399] active:bg-[#243320] transition-colors shadow-sm"
          >
            <span>Continue to Sign In</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Modal Footer Shortcuts */}
        <div className="mt-5 pt-4 border-t border-[#D5D8CA] dark:border-[#26382B] flex items-center justify-between text-xs text-[#485942] dark:text-[#A3B5A5]">
          <Link
            to="/try-free"
            onClick={onClose}
            className="text-[#2E3D28] dark:text-[#34D399] font-semibold hover:underline flex items-center gap-1"
          >
            New user? Start free trial &rarr;
          </Link>
          <Link
            to="/admin-login"
            onClick={onClose}
            className="text-[#7A8A6E] dark:text-[#889B89] hover:text-[#2E3D28] dark:hover:text-white transition-colors"
          >
            Platform Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
