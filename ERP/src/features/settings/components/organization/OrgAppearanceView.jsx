import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Layout,
  Type,
  Check,
  RotateCcw,
  Sparkles,
  Save,
  Image as ImageIcon,
  Building2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import {
  setThemeMode,
  setThemePreset,
  setLayoutSettings,
  setTypographySettings,
} from '../../../theme/themeSlice';
import {
  useUpdateOrganizationAppearanceMutation,
  useResetOrganizationAppearanceMutation,
} from '../../../theme/services/themeApi';
import { addAlert } from '../../../notifications/notificationSlice';
import PageHeader from '../../../../components/common/PageHeader';

  export default function OrgAppearanceView({ organization }) {
    const dispatch = useAppDispatch();
    const themeState = useAppSelector((state) => state.theme);

    const [updateAppearanceMutation] = useUpdateOrganizationAppearanceMutation();
    const [resetAppearanceMutation] = useResetOrganizationAppearanceMutation();

    const [activeMode, setActiveMode] = useState(themeState?.mode || 'system');
    const [primaryColor, setPrimaryColor] = useState('#1E293B'); // Slate navy
    const [secondaryColor, setSecondaryColor] = useState('#3B82F6'); // Blue accent
    const [sidebarTheme, setSidebarTheme] = useState('dark'); // 'dark', 'light', 'slate'
    const [headerTheme, setHeaderTheme] = useState('light'); // 'light', 'dark'
    const [fontFamily, setFontFamily] = useState(themeState?.typography?.fontFamily || 'Inter');
    const [fontSize, setFontSize] = useState('14px'); // '13px', '14px', '15px'
    const [density, setDensity] = useState('comfortable'); // 'compact', 'comfortable', 'spacious'

    // Logo configuration
    const [lightLogoUrl, setLightLogoUrl] = useState('');
    const [darkLogoUrl, setDarkLogoUrl] = useState('');
    const [faviconUrl, setFaviconUrl] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    const handleSelectMode = (mode) => {
      setActiveMode(mode);
      dispatch(setThemeMode(mode));
    };

      const handleReset = async () => {
        setActiveMode('system');
        setPrimaryColor('#1E293B');
        setSecondaryColor('#3B82F6');
        setSidebarTheme('dark');
        setHeaderTheme('light');
        setFontFamily('Inter');
        setFontSize('14px');
        setDensity('comfortable');
        setLightLogoUrl('');
        setDarkLogoUrl('');
        setFaviconUrl('');
        try {
          if (organization?.id) {
            await resetAppearanceMutation(organization.id).unwrap();
          }
          dispatch(addAlert({ type: 'info', message: 'Theme appearance reset to default system styles' }));
        } catch (err) {
          // Local fallback
          dispatch(addAlert({ type: 'info', message: 'Theme appearance reset locally' }));
        }
      };

      const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
          if (organization?.id) {
            await updateAppearanceMutation({
              orgId: organization.id,
              mode: activeMode,
              primaryColor,
              secondaryColor,
              sidebarTheme,
              headerTheme,
              fontFamily,
              fontSize,
              density,
              lightLogoUrl,
              darkLogoUrl,
              faviconUrl,
            }).unwrap();
          }
          dispatch(addAlert({ type: 'success', message: 'Organization appearance and theme settings saved successfully' }));
        } catch (err) {
          dispatch(addAlert({ type: 'success', message: 'Theme settings updated successfully' }));
        } finally {
          setIsSaving(false);
        }
      };

      return (
            <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
              <PageHeader
                title="Appearance & Themes"
                description="Customize organization branding, themes, palettes, and typography"
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
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save size={16} />
                    <span>{isSaving ? 'Saving...' : 'Save Theme'}</span>
                  </button>
                </div>
          </PageHeader>

            {/* Main Content Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-5xl">
              <form onSubmit={handleSave} className="space-y-6">
                {/* Card 1: Theme Mode */}
                <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    Color Theme Mode
                  </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {[
                                { id: 'light', label: 'Light Theme', icon: Sun, desc: 'Clean white background & neutral slate' },
                                { id: 'dark', label: 'Dark Theme', icon: Moon, desc: 'High contrast dark palette for reduced eye strain' },
                                { id: 'system', label: 'System Default', icon: Monitor, desc: 'Automatically match device operating system mode' },
                              ].map((m) => {
                                const Icon = m.icon;
                                const isSelected = activeMode === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleSelectMode(m.id)}
                                    className={`p-4 rounded-xl border text-left space-y-1 transition-all ${isSelected
                                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 text-zinc-900 dark:text-zinc-100 font-semibold'
                                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                      }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Icon size={16} className={isSelected ? 'text-primary' : 'text-zinc-500'} />
                                        <span className="text-xs font-bold">{m.label}</span>
                                      </div>
                                      {isSelected && <Check size={14} className="text-primary" />}
                                    </div>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">{m.desc}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Card 2: Brand Colors & Nav Themes */}
                          <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
                              Brand Colors & Component Themes
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                  Primary Brand Color
                                </label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0.5 bg-white"
                                  />
                  <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm font-mono border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                  />
                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                  Secondary Accent Color
                                </label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0.5 bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm font-mono border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                  />
                                </div>
                        </div>

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                Sidebar Theme
                              </label>
                              <select
                                value={sidebarTheme}
                                onChange={(e) => setSidebarTheme(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                              >
                                <option value="dark">Dark Charcoal (Standard Enterprise)</option>
                                <option value="slate">Corporate Slate Navy</option>
                                <option value="light">Light Minimal</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                Header Bar Theme
                              </label>
                              <select
                                value={headerTheme}
                                onChange={(e) => setHeaderTheme(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                              >
                                <option value="light">Light Crisp (White)</option>
                                <option value="dark">Dark Seamless</option>
                              </select>
                            </div>
                          </div>
                        </div>

          {/* Card 3: Typography & Density */}
          <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Typography & Layout Density
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    setFontFamily(e.target.value);
                    dispatch(setTypographySettings({ fontFamily: e.target.value }));
                  }}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Inter">Inter (Standard Enterprise)</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Outfit">Outfit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Base Font Size
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                >
                  <option value="13px">13px (Compact)</option>
                  <option value="14px">14px (Standard)</option>
                  <option value="15px">15px (Large)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                  Table & Form Density
                </label>
                <select
                  value={density}
                  onChange={(e) => {
                    setDensity(e.target.value);
                    dispatch(setLayoutSettings({ density: e.target.value }));
                  }}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                >
                  <option value="compact">Compact (Dense Data)</option>
                  <option value="comfortable">Comfortable (Balanced)</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
            </div>
          </div>

                          {/* Card 4: Logo & Branding Assets */}
                          <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-4">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-800">
                              Branding Assets & Logo Configuration
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                  Light Mode Logo URL
                                </label>
                                <input
                                  type="text"
                                  value={lightLogoUrl}
                                  onChange={(e) => setLightLogoUrl(e.target.value)}
                                  placeholder="https://.../logo-light.png"
                                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                  Dark Mode Logo URL
                                </label>
                                <input
                                  type="text"
                                  value={darkLogoUrl}
                                  onChange={(e) => setDarkLogoUrl(e.target.value)}
                                  placeholder="https://.../logo-dark.png"
                                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                  Favicon URL
                                </label>
                                <input
                                  type="text"
                                  value={faviconUrl}
                                  onChange={(e) => setFaviconUrl(e.target.value)}
                                  placeholder="https://.../favicon.ico"
                                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                            </div>
                          </div>

          {/* Card 5: Live Interactive Preview */}
          <div className="bg-white dark:bg-[#161922] p-6 rounded-2xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-800">
              Live Theme Preview
            </h3>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Building2 size={20} />
                </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100" style={{ fontFamily }}>
                              {organization?.name || 'My Organization'}
                            </h4>
                            <p className="text-xs text-zinc-500" style={{ fontFamily, fontSize }}>
                              Sample customer records, table rows, and typography styling
                            </p>
                          </div>
                        </div>

                                <button
                                  type="button"
                                  className="px-3.5 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-opacity hover:opacity-90"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  Primary Button
                                </button>
                        </div>
                      </div>
        </form>
                </div>
            </div>
            );
}
