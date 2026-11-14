import React, { useState } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
  Save,
  RotateCcw,
  Palette,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import PageHeader from '../../../../components/common/PageHeader';

export default function OrgLoginPortalView({
  organization,
  loginUrl: passedLoginUrl = '',
}) {
  const dispatch = useAppDispatch();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const orgCode = (organization?.code || '').toLowerCase();
  const orgName = organization?.name || 'My Organization';

  const defaultUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/erp/o/${orgCode}/login`
      : `https://www.mark2.in/erp/o/${orgCode}/login`;

  const [portalUrl, setPortalUrl] = useState(passedLoginUrl || defaultUrl);
  const [portalName, setPortalName] = useState(`${orgName} Sign-in Portal`);
  const [pageTitle, setPageTitle] = useState(`Welcome to ${orgName}`);
  const [welcomeMessage, setWelcomeMessage] = useState(
    'Please authenticate with your organization credentials to access operating companies and modules.'
  );
  const [loginTheme, setLoginTheme] = useState('corporate-navy'); // 'corporate-navy', 'sage-green', 'minimal-slate', 'dark-zinc'
  const [isPortalEnabled, setIsPortalEnabled] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [bgImageUrl, setBgImageUrl] = useState('');

  const handleCopyUrl = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

    const handlePreview = () => {
      window.open(portalUrl, '_blank');
    };

    const handleSave = (e) => {
      e.preventDefault();
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        dispatch(
          addAlert({
            type: 'success',
            message: 'Organization Login Portal configuration saved successfully.',
          })
        );
      }, 600);
    };

    return (
            <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
              <PageHeader
                title="Organization Login Portal"
                description="Configure dedicated vanity sign-in URL, login styling, and portal identity"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5"
                  >
                    <ExternalLink size={14} />
                    <span>Preview Portal</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save size={16} />
                    <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
          </PageHeader>

            {/* Main Content Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 w-full">
              <form onSubmit={handleSave} className="space-y-6">
                {/* Card 1: Vanity URL & Status */}
                <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                        Vanity Sign-In Portal URL
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Direct sign-in address specifically isolated to this organization tenant.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={isPortalEnabled}
                        onChange={(e) => setIsPortalEnabled(e.target.checked)}
                        className="rounded border-zinc-300 text-primary"
                      />
                      <span>Enable Branded Portal</span>
                    </label>
                  </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono text-xs text-zinc-800 dark:text-zinc-200 truncate">
                            {portalUrl}
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyUrl}
                            className="px-3.5 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            {copiedUrl ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                            <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                          </button>
                        </div>
                      </div>

                    {/* Card 2: Portal Appearance & Branding */}
                    <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
                        Branding & Login Page Content
                      </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                  Portal Name
                                </label>
                                <input
                                  type="text"
                                  value={portalName}
                                  onChange={(e) => setPortalName(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                  Login Page Header Title
                                </label>
                                <input
                                  type="text"
                                  value={pageTitle}
                                  onChange={(e) => setPageTitle(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                            </div>

                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                  Welcome Subtitle Message
                                </label>
                                <textarea
                                  rows={2}
                                  value={welcomeMessage}
                                  onChange={(e) => setWelcomeMessage(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                />
                              </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                      Custom Logo URL / Asset
                                    </label>
                                    <input
                                      type="text"
                                      value={logoUrl}
                                      onChange={(e) => setLogoUrl(e.target.value)}
                                      placeholder="https://.../brand-logo.png"
                                      className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                      Background Backdrop Image URL
                                    </label>
                                    <input
                                      type="text"
                                      value={bgImageUrl}
                                      onChange={(e) => setBgImageUrl(e.target.value)}
                                      placeholder="https://.../login-backdrop.jpg"
                                      className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                                    Login Theme Preset
                                  </label>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                      { id: 'corporate-navy', label: 'Corporate Navy', color: 'bg-slate-900' },
                                      { id: 'sage-green', label: 'Sage Green', color: 'bg-[#2E3D28]' },
                                      { id: 'minimal-slate', label: 'Minimal Slate', color: 'bg-zinc-700' },
                                      { id: 'dark-zinc', label: 'Dark Charcoal', color: 'bg-zinc-950' },
                                    ].map((th) => (
                                      <button
                                        key={th.id}
                                        type="button"
                                        onClick={() => setLoginTheme(th.id)}
                                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${loginTheme === th.id
                                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold text-zinc-900 dark:text-zinc-100'
                                            : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                          }`}
                                      >
                                        <span className={`w-4 h-4 rounded-full ${th.color} shrink-0`} />
                                        <span className="text-xs">{th.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                          </form>
                        </div>
                      </div>
                      );
}
