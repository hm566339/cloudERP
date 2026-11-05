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
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import {
  setThemeMode,
  setThemePreset,
  setLayoutSettings,
  setTypographySettings,
  applyAllAppearanceSettings,
} from '../../../theme/themeSlice';
import {
  THEME_PRESETS,
  DEFAULT_APPEARANCE_SETTINGS,
} from '../../../theme/themePresets';
import {
  useUpdateOrganizationAppearanceMutation,
  useResetOrganizationAppearanceMutation,
} from '../../../theme/services/themeApi';
import { addAlert } from '../../../notifications/notificationSlice';

export default function OrgAppearanceView({
  organization,
}) {
  const dispatch = useAppDispatch();
  const themeState = useAppSelector((state) => state.theme);

  const [updateAppearanceMutation] = useUpdateOrganizationAppearanceMutation();
  const [resetAppearanceMutation] = useResetOrganizationAppearanceMutation();

  const [activePreset, setActivePreset] = useState(themeState?.preset || 'sage');
  const [activeMode, setActiveMode] = useState(themeState?.mode || 'system');
  const [activeFont, setActiveFont] = useState(themeState?.typography?.fontFamily || 'Inter');
  const [activeDensity, setActiveDensity] = useState(themeState?.layout?.density || 'comfortable');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Handle Preset Select
  const handleSelectPreset = (presetKey) => {
    setActivePreset(presetKey);
    dispatch(setThemePreset(presetKey));
  };

  // Handle Mode Select
  const handleSelectMode = (mode) => {
    setActiveMode(mode);
    dispatch(setThemeMode(mode));
  };

  // Handle Font Select
  const handleSelectFont = (fontFamily) => {
    setActiveFont(fontFamily);
    dispatch(setTypographySettings({ fontFamily }));
  };

  // Handle Density Select
  const handleSelectDensity = (density) => {
    setActiveDensity(density);
    dispatch(setLayoutSettings({ density }));
  };

  // Save changes to backend
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        preset: activePreset,
        mode: activeMode,
        typography: { fontFamily: activeFont },
        layout: { density: activeDensity },
      };

      await updateAppearanceMutation(payload).unwrap();
      dispatch(applyAllAppearanceSettings(payload));
      setSavedSuccess(true);
      dispatch(
        addAlert({
          type: 'success',
          message: 'Organization theme and appearance settings saved successfully.',
        })
      );
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      // Local apply fallback
      dispatch(
        applyAllAppearanceSettings({
          preset: activePreset,
          mode: activeMode,
          typography: { fontFamily: activeFont },
          layout: { density: activeDensity },
        })
      );
      setSavedSuccess(true);
      dispatch(
        addAlert({
          type: 'success',
          message: 'Theme applied to workspace.',
        })
      );
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleReset = async () => {
    try {
      await resetAppearanceMutation().unwrap();
    } catch {
      // Fallback
    }
    setActivePreset('sage');
    setActiveMode('system');
    setActiveFont('Inter');
    setActiveDensity('comfortable');
    dispatch(
      applyAllAppearanceSettings({
        preset: 'sage',
        mode: 'system',
        typography: { fontFamily: 'Inter' },
        layout: { density: 'comfortable' },
      })
    );
    dispatch(
      addAlert({
        type: 'info',
        message: 'Theme reset to default Sage Nature palette.',
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D5D8CA] dark:border-[#2A2F3D] gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            <Palette size={22} className="text-[#485942] dark:text-[#A0A6B5]" />
            Appearance & Themes
          </h1>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-1">
            Customize organization brand theme, color palettes, dark/light display mode, and typography.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#485942] dark:text-[#A0A6B5] hover:text-[#2E3D28] dark:hover:text-[#E6E8EE] bg-white dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-[#EDEEE4] dark:hover:bg-[#222736] rounded-xl transition-all shadow-2xs"
          >
            <RotateCcw size={13} />
            <span>Reset to Default</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2E3D28] dark:bg-primary hover:bg-[#3C4E34] dark:hover:bg-primary-600 rounded-xl transition-all shadow-xs disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Appearance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Theme Presets Section ── */}
      <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            <Sparkles size={16} className="text-[#485942] dark:text-[#A0A6B5]" />
            Organization Theme Presets
          </h2>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
            Select a curated design system preset applied across all companies in this organization.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Object.entries(THEME_PRESETS).map(([key, preset]) => {
            const isSelected = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPreset(key)}
                className={`p-4 rounded-xl border text-left transition-all relative ${isSelected
                    ? 'bg-white dark:bg-[#1D212C] border-[#2E3D28] dark:border-primary shadow-xs ring-2 ring-[#2E3D28]/10'
                    : 'bg-white/70 dark:bg-[#1D212C]/60 border-[#D5D8CA] dark:border-[#2A2F3D] hover:bg-white dark:hover:bg-[#1D212C]'
                  }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#2E3D28] dark:bg-primary text-white flex items-center justify-center">
                    <Check size={11} />
                  </span>
                )}
                {/* Color preview palette dots */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: preset.colors?.light?.primary || '#2E3D28' }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: preset.colors?.light?.surface || '#F7F7F0' }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: preset.colors?.dark?.background || '#0D0E12' }}
                  />
                </div>
                <div className="font-bold text-xs text-[#2E3D28] dark:text-[#E6E8EE]">
                  {preset.name}
                </div>
                <div className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-0.5 line-clamp-2">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Display Mode & Layout Density ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Display Mode */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
              <Sun size={16} className="text-[#485942] dark:text-[#A0A6B5]" />
              Color Display Mode
            </h2>
            <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
              Choose light, dark, or automatic system appearance.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMode(m.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${isSelected
                      ? 'bg-white dark:bg-[#1D212C] border-[#2E3D28] dark:border-primary text-[#2E3D28] dark:text-[#E6E8EE] shadow-xs ring-2 ring-[#2E3D28]/10'
                      : 'bg-white/60 dark:bg-[#1D212C]/60 border-[#D5D8CA] dark:border-[#2A2F3D] text-[#485942] dark:text-[#A0A6B5] hover:bg-white dark:hover:bg-[#1D212C]'
                    }`}
                >
                  <Icon size={18} className="mb-1.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Density */}
        <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
              <Layout size={16} className="text-[#485942] dark:text-[#A0A6B5]" />
              Layout Density
            </h2>
            <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
              Compact table spacing for data density or comfortable view.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'comfortable', label: 'Comfortable', desc: 'Standard breathing room' },
              { id: 'compact', label: 'Compact', desc: 'Higher data row density' },
            ].map((d) => {
              const isSelected = activeDensity === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleSelectDensity(d.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${isSelected
                      ? 'bg-white dark:bg-[#1D212C] border-[#2E3D28] dark:border-primary text-[#2E3D28] dark:text-[#E6E8EE] shadow-xs ring-2 ring-[#2E3D28]/10'
                      : 'bg-white/60 dark:bg-[#1D212C]/60 border-[#D5D8CA] dark:border-[#2A2F3D] text-[#485942] dark:text-[#A0A6B5] hover:bg-white dark:hover:bg-[#1D212C]'
                    }`}
                >
                  <div className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                    {d.label}
                  </div>
                  <div className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-0.5">
                    {d.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Typography Section ── */}
      <div className="bg-[#F7F7F0] dark:bg-[#161922] rounded-2xl border border-[#D5D8CA] dark:border-[#2A2F3D] shadow-xs p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#2E3D28] dark:text-[#E6E8EE] flex items-center gap-2">
            <Type size={16} className="text-[#485942] dark:text-[#A0A6B5]" />
            Typography Font Family
          </h2>
          <p className="text-xs text-[#485942] dark:text-[#A0A6B5] mt-0.5">
            Select the primary interface font rendered throughout the enterprise application.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'Inter', label: 'Inter', sample: 'Clean modern sans-serif designed for high-density UI' },
            { id: 'Outfit', label: 'Outfit', sample: 'Geometric elegant typography for SaaS workspaces' },
            { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', sample: 'Contemporary enterprise typography with high legibility' },
          ].map((f) => {
            const isSelected = activeFont === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelectFont(f.id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${isSelected
                    ? 'bg-white dark:bg-[#1D212C] border-[#2E3D28] dark:border-primary text-[#2E3D28] dark:text-[#E6E8EE] shadow-xs ring-2 ring-[#2E3D28]/10'
                    : 'bg-white/60 dark:bg-[#1D212C]/60 border-[#D5D8CA] dark:border-[#2A2F3D] text-[#485942] dark:text-[#A0A6B5] hover:bg-white dark:hover:bg-[#1D212C]'
                  }`}
              >
                <div className="text-xs font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                  {f.label}
                </div>
                <div className="text-[11px] text-[#485942] dark:text-[#A0A6B5] mt-1 leading-snug">
                  {f.sample}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}