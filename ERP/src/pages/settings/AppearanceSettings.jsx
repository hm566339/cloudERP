import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Layout,
  Type,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Table as TableIcon,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  CreditCard,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  Maximize2,
  Minimize2,
  MoveHorizontal
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  setThemeMode,
  setThemePreset,
  setLayoutSettings,
  setTypographySettings,
  setCustomColors,
  applyAllAppearanceSettings,
  resetAppearanceDefaults,
} from '../../features/theme/themeSlice';
import {
  THEME_PRESETS,
  DEFAULT_APPEARANCE_SETTINGS,
  resolveEffectiveMode,
} from '../../features/theme/themePresets';
import { useSidebar } from '../../layouts/SidebarContext';
import {
  SettingsLayout,
  SettingsPageHeader,
  SettingsCard,
  SettingsSaveButton,
} from '../../components/settings/shared';

export default function AppearanceSettings() {
  const dispatch = useAppDispatch();
  const themeState = useAppSelector((state) => state.theme);
  const sidebarContext = useSidebar();

  // Local draft state for real-time live preview before final apply
  const [draftMode, setDraftMode] = useState(themeState?.mode || 'system');
  const [draftPreset, setDraftPreset] = useState(themeState?.themePreset || 'sage');
  const [draftLayout, setDraftLayout] = useState(
    themeState?.layout || DEFAULT_APPEARANCE_SETTINGS.layout
  );
  const [draftTypography, setDraftTypography] = useState(
    themeState?.typography || DEFAULT_APPEARANCE_SETTINGS.typography
  );
  const [draftCustomColors, setDraftCustomColors] = useState(
    themeState?.customColors || {
      primary: '#2E3D28',
      secondary: '#A9B887',
      accent: '#3C4E34',
      background: '#E8E9DF',
    }
  );
  const [showAdvancedColors, setShowAdvancedColors] = useState(Boolean(themeState?.customColors));

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync with Redux if external updates happen (e.g. header ThemeToggle)
  useEffect(() => {
    if (themeState?.mode) setDraftMode(themeState.mode);
    if (themeState?.themePreset) setDraftPreset(themeState.themePreset);
    if (themeState?.layout) setDraftLayout(themeState.layout);
    if (themeState?.typography) setDraftTypography(themeState.typography);
  }, [themeState]);

  // Sync sidebar collapse with SidebarContext if available
  useEffect(() => {
    if (sidebarContext?.isCollapsed !== undefined) {
      setDraftLayout((prev) => ({ ...prev, sidebarCollapsed: sidebarContext.isCollapsed }));
    }
  }, [sidebarContext?.isCollapsed]);

  // Resolve currently active preset metadata for preview
  const activePreset = useMemo(() => {
    return THEME_PRESETS.find((p) => p.id === draftPreset) || THEME_PRESETS[0];
  }, [draftPreset]);

  // Preview effective palette
  const previewIsDark = useMemo(() => {
    return resolveEffectiveMode(draftMode) === 'dark';
  }, [draftMode]);

  const previewPalette = useMemo(() => {
    const base = previewIsDark ? activePreset.dark : activePreset.light;
    if (!showAdvancedColors || !draftCustomColors) return base;
    return {
      ...base,
      primary: draftCustomColors.primary || base.primary,
      secondary: draftCustomColors.secondary || base.secondary,
      background: draftCustomColors.background || base.background,
    };
  }, [activePreset, previewIsDark, showAdvancedColors, draftCustomColors]);

  // Handle Preset Selection
  const handleSelectPreset = (presetId) => {
    setDraftPreset(presetId);
    setShowAdvancedColors(false);
    // Instant preview & live feel
    dispatch(setThemePreset(presetId));
  };

  // Handle Mode Change (Light, Dark, System)
  const handleSelectMode = (mode) => {
    setDraftMode(mode);
    dispatch(setThemeMode(mode));
  };

  // Handle Layout Changes
  const handleLayoutChange = (key, value) => {
    const updated = { ...draftLayout, [key]: value };
    setDraftLayout(updated);
    dispatch(setLayoutSettings(updated));

    // If changing sidebar collapse, trigger SidebarContext
    if (key === 'sidebarCollapsed' && sidebarContext?.setCollapsed) {
      sidebarContext.setCollapsed(value);
    }
  };

  // Handle Typography Changes
  const handleTypographyChange = (key, value) => {
    const updated = { ...draftTypography, [key]: value };
    setDraftTypography(updated);
    dispatch(setTypographySettings(updated));
  };

  // Handle Custom Color Changes
  const handleCustomColorChange = (key, hex) => {
    const updated = { ...draftCustomColors, [key]: hex };
    setDraftCustomColors(updated);
    dispatch(setCustomColors(updated));
  };

  // Apply Changes globally
  const handleApplyAll = () => {
    setIsSaving(true);
    const fullPayload = {
      themePreset: draftPreset,
      mode: draftMode,
      layout: draftLayout,
      typography: draftTypography,
      customColors: showAdvancedColors ? draftCustomColors : null,
    };

    dispatch(applyAllAppearanceSettings(fullPayload));

    if (sidebarContext?.setCollapsed) {
      sidebarContext.setCollapsed(draftLayout.sidebarCollapsed);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }, 400);
  };

  // Reset to Defaults
  const handleReset = () => {
    dispatch(resetAppearanceDefaults());
    setDraftMode(DEFAULT_APPEARANCE_SETTINGS.mode);
    setDraftPreset(DEFAULT_APPEARANCE_SETTINGS.themePreset);
    setDraftLayout(DEFAULT_APPEARANCE_SETTINGS.layout);
    setDraftTypography(DEFAULT_APPEARANCE_SETTINGS.typography);
    setShowAdvancedColors(false);

    if (sidebarContext?.setCollapsed) {
      sidebarContext.setCollapsed(false);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <SettingsLayout activeTab="appearance_themes">
      {/* ── Page Header ── */}
      <SettingsPageHeader
        title="Appearance & Themes"
        description="Configure your enterprise theme studio, brand color palettes, display modes, typography, and layout density across all workspaces."
        badge="Theme Studio"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-xs font-semibold text-[var(--color-text-secondary)] transition-colors shadow-2xs"
            >
              <RotateCcw size={13} />
              <span>Reset to Defaults</span>
            </button>
            <SettingsSaveButton
              onClick={handleApplyAll}
              isSaving={isSaving}
              isSuccess={saveSuccess}
              label="Apply Changes"
            />
          </div>
        }
      />

      {/* ── Main Two-Column View: Controls (Left) + Live Preview (Right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Studio Controls (7 cols on xl) ── */}
        <div className="xl:col-span-7 space-y-6">

          {/* ── 1. Appearance Mode Card ── */}
          <SettingsCard
            title="Appearance Mode"
            description="Select how the ERP responds to lighting environments."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'light',
                  label: 'Light Mode',
                  description: 'Clean high-contrast daytime view',
                  icon: Sun,
                },
                {
                  id: 'dark',
                  label: 'Dark Mode',
                  description: 'Deep contrast for low-light focus',
                  icon: Moon,
                },
                {
                  id: 'system',
                  label: 'System Default',
                  description: 'Syncs automatically with device OS',
                  icon: Monitor,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = draftMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMode(item.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] shadow-2xs ring-2 ring-[var(--color-primary)]/20'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-primary)]">{item.label}</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </SettingsCard>

          {/* ── 2. Theme Studio (5 Predefined Brand Themes) ── */}
          <SettingsCard
            title="Theme Studio"
            description="Select from 5 predefined ERP enterprise palettes. Every theme follows the 60-30-10 color rule."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = draftPreset === preset.id && !showAdvancedColors;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] shadow-xs ring-2 ring-[var(--color-primary)]/20'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <div>
                      {/* Top Header of Theme Card */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">
                              {preset.name}
                            </span>
                            {preset.id === 'sage' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-[10.5px] text-[var(--color-text-muted)]">
                            {preset.tagline}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>

                      {/* 60-30-10 Color Bar Swatch Preview */}
                      <div className="my-2.5">
                        {(() => {
                          const activeVar = previewIsDark ? preset.dark : preset.light;
                          const sw60 = previewIsDark ? activeVar.background : preset.dominantHex;
                          const sw30 = previewIsDark ? activeVar.surface2 : preset.secondaryHex;
                          const sw10 = previewIsDark ? activeVar.primary : preset.accentHex;
                          const textCl60 = previewIsDark ? 'text-zinc-300' : 'text-zinc-700';
                          const textCl30 = previewIsDark ? 'text-zinc-200' : 'text-zinc-800';
                          const textCl10 = previewIsDark ? 'text-zinc-950 font-black' : 'text-white';
                          return (
                            <>
                              <div className="h-5 w-full rounded-lg overflow-hidden flex border border-black/10 dark:border-white/10 shadow-2xs">
                                <div
                                  className={`h-full flex items-center justify-center text-[9px] font-mono font-bold select-none ${textCl60}`}
                                  style={{ width: '60%', backgroundColor: sw60 }}
                                  title={`60% Dominant: ${sw60}`}
                                >
                                  60%
                                </div>
                                <div
                                  className={`h-full flex items-center justify-center text-[9px] font-mono font-bold select-none ${textCl30}`}
                                  style={{ width: '30%', backgroundColor: sw30 }}
                                  title={`30% Secondary: ${sw30}`}
                                >
                                  30%
                                </div>
                                <div
                                  className={`h-full flex items-center justify-center text-[9px] font-mono font-bold select-none ${textCl10}`}
                                  style={{ width: '10%', backgroundColor: sw10 }}
                                  title={`10% Accent: ${sw10}`}
                                >
                                  10%
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[9.5px] font-mono text-[#7A8A6E] dark:text-[#A0A6B5] mt-1 px-0.5">
                                <span>{sw60}</span>
                                <span>{sw30}</span>
                                <span>{sw10}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-between text-[11px]">
                      <span className="text-[var(--color-text-muted)]">
                        {isSelected ? 'Active Theme' : 'Click to select'}
                      </span>
                      <span
                        className={`font-semibold ${
                          isSelected
                            ? 'text-[var(--color-primary)] font-bold'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {isSelected ? 'Applied' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SettingsCard>

          {/* ── 3. Layout Customization Card ── */}
          <SettingsCard
            title="Layout Customization"
            description="Fine-tune workspace structure, sidebar behavior, border radius, and content widths."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sidebar State */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Sidebar Default State
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('sidebarCollapsed', false)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      !draftLayout.sidebarCollapsed
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <Maximize2 size={13} />
                    <span>Expanded (260px)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('sidebarCollapsed', true)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      draftLayout.sidebarCollapsed
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <Minimize2 size={13} />
                    <span>Collapsed (72px)</span>
                  </button>
                </div>
              </div>

              {/* Layout Density */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Layout Density
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('density', 'comfortable')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      draftLayout.density === 'comfortable'
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <span>Comfortable</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('density', 'compact')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      draftLayout.density === 'compact'
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <span>Compact</span>
                  </button>
                </div>
              </div>

              {/* Content Width */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Content Width
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('contentWidth', 'standard')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      draftLayout.contentWidth === 'standard'
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <span>Standard (1920px)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('contentWidth', 'wide')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      draftLayout.contentWidth === 'wide'
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <span>Wide (Fluid 100%)</span>
                  </button>
                </div>
              </div>

              {/* Border Radius */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Border Radius
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'Small (6px)' },
                    { id: 'medium', label: 'Medium (12px)' },
                    { id: 'large', label: 'Large (18px)' },
                  ].map((rad) => (
                    <button
                      key={rad.id}
                      type="button"
                      onClick={() => handleLayoutChange('borderRadius', rad.id)}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                        draftLayout.borderRadius === rad.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                      }`}
                    >
                      <span>{rad.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Shadows */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Card Shadows
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('cardShadows', true)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                      draftLayout.cardShadows
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <span>Elevated Shadows</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('cardShadows', false)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                      !draftLayout.cardShadows
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <span>Flat / Border Only</span>
                  </button>
                </div>
              </div>

              {/* Table Density */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Table Density
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('tableDensity', 'comfortable')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                      draftLayout.tableDensity === 'comfortable'
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <span>Comfortable Rows</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('tableDensity', 'compact')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                      draftLayout.tableDensity === 'compact'
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                    }`}
                  >
                    <span>Compact Scan Rows</span>
                  </button>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* ── 4. Typography Settings Card ── */}
          <SettingsCard
            title="Typography & Fonts"
            description="Adjust text scale and font families while maintaining strict accessibility and readability standards."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Font Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Interface Font Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'Small (13px)' },
                    { id: 'default', label: 'Default (14px)' },
                    { id: 'large', label: 'Large (15px)' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => handleTypographyChange('fontSize', sz.id)}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                        draftTypography.fontSize === sz.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                      }`}
                    >
                      <span>{sz.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Font Family
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'default', label: 'Inter (Default)' },
                    { id: 'jakarta', label: 'Plus Jakarta' },
                    { id: 'roboto', label: 'Roboto' },
                    { id: 'system', label: 'System Sans' },
                  ].map((fam) => (
                    <button
                      key={fam.id}
                      type="button"
                      onClick={() => handleTypographyChange('fontFamily', fam.id)}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                        draftTypography.fontFamily === fam.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] shadow-2xs'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                      }`}
                    >
                      <span>{fam.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* ── 5. Advanced Color Customization ── */}
          <SettingsCard
            title="Custom Palette Overrides (Advanced)"
            description="Fine-tune individual primary, secondary, and background tones. Overrides active theme preset."
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D5D8CA]/60 dark:border-[#2A2F3D]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable-custom-colors"
                    checked={showAdvancedColors}
                    onChange={(e) => setShowAdvancedColors(e.target.checked)}
                    className="w-4 h-4 rounded border-[#D5D8CA] text-[#2E3D28] focus:ring-[#2E3D28]"
                  />
                  <label
                    htmlFor="enable-custom-colors"
                    className="text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
                  >
                    Enable Custom Color Overrides
                  </label>
                </div>
                {showAdvancedColors && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftCustomColors({
                        primary: activePreset.accentHex,
                        secondary: activePreset.secondaryHex,
                        accent: activePreset.accentHex,
                        background: activePreset.dominantHex,
                      });
                      dispatch(setThemePreset(draftPreset));
                    }}
                    className="text-[11px] font-semibold text-[#485942] hover:text-[#2E3D28] dark:text-[#A0A6B5] dark:hover:text-[#E6E8EE] flex items-center gap-1"
                  >
                    <RotateCcw size={11} />
                    <span>Reset to Theme Defaults</span>
                  </button>
                )}
              </div>

              {showAdvancedColors && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#485942] dark:text-[#A0A6B5] uppercase tracking-wider">
                      Primary (10%)
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#D5D8CA] dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                      <input
                        type="color"
                        value={draftCustomColors.primary}
                        onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                        className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                        {draftCustomColors.primary}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#485942] dark:text-[#A0A6B5] uppercase tracking-wider">
                      Secondary (30%)
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#D5D8CA] dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                      <input
                        type="color"
                        value={draftCustomColors.secondary}
                        onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                        className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                        {draftCustomColors.secondary}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#485942] dark:text-[#A0A6B5] uppercase tracking-wider">
                      Accent Hover
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#D5D8CA] dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                      <input
                        type="color"
                        value={draftCustomColors.accent}
                        onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                        className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                        {draftCustomColors.accent}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#485942] dark:text-[#A0A6B5] uppercase tracking-wider">
                      Background (60%)
                    </label>
                    <div className="flex items-center gap-2 p-1.5 rounded-lg border border-[#D5D8CA] dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C]">
                      <input
                        type="color"
                        value={draftCustomColors.background}
                        onChange={(e) => handleCustomColorChange('background', e.target.value)}
                        className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-[#2E3D28] dark:text-[#E6E8EE]">
                        {draftCustomColors.background}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SettingsCard>
        </div>

        {/* ── RIGHT COLUMN: Interactive Live Preview (5 cols on xl, sticky) ── */}
        <div className="xl:col-span-5 sticky top-20 space-y-4">
          <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[var(--color-primary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Live UI Component Preview
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
                {previewIsDark ? 'Dark Mode' : 'Light Mode'} • {activePreset.name}
              </span>
            </div>

            {/* Live Interactive Preview Box (uses current draft colors directly) */}
            <div
              className="p-4 rounded-xl border space-y-4 transition-all"
              style={{
                backgroundColor: previewPalette.background,
                borderColor: previewPalette.border,
              }}
            >
              {/* 1. Preview Metric KPI Card */}
              <div
                className="p-3.5 rounded-xl border shadow-2xs flex items-center justify-between"
                style={{
                  backgroundColor: previewPalette.surface,
                  borderColor: previewPalette.border,
                }}
              >
                <div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: previewPalette.textSecondary }}
                  >
                    Fiscal Revenue (Q3)
                  </span>
                  <p
                    className="text-xl font-bold tracking-tight mt-0.5"
                    style={{ color: previewPalette.textPrimary }}
                  >
                    ₹1,28,45,000
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs"
                  style={{ backgroundColor: previewPalette.primary }}
                >
                  <CreditCard size={16} />
                </div>
              </div>

              {/* 2. Primary & Secondary Buttons Preview */}
              <div className="space-y-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider block"
                  style={{ color: previewPalette.textSecondary }}
                >
                  Action Controls
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-white shadow-2xs transition-all flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: previewPalette.primary,
                    }}
                  >
                    <span>Save Transaction</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1"
                    style={{
                      backgroundColor: previewPalette.surface,
                      borderColor: previewPalette.border,
                      color: previewPalette.textPrimary,
                    }}
                  >
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* 3. Navigation Links Sample */}
              <div className="space-y-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider block"
                  style={{ color: previewPalette.textSecondary }}
                >
                  Navigation Link States
                </span>
                <div
                  className="p-1.5 rounded-xl border space-y-1"
                  style={{
                    backgroundColor: previewPalette.sidebarBg,
                    borderColor: previewPalette.border,
                  }}
                >
                  {/* Active Link */}
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: previewPalette.primary }}
                  >
                    <div className="flex items-center gap-2">
                      <Layout size={14} />
                      <span>Owner Dashboard</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-white border border-white/20">
                      Active
                    </span>
                  </div>
                  {/* Inactive Link */}
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ color: previewPalette.textSecondary }}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={14} />
                      <span>Company Directory</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border" style={{ borderColor: previewPalette.border }}>
                      Secondary
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Form Input Field Sample */}
              <div className="space-y-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider block"
                  style={{ color: previewPalette.textSecondary }}
                >
                  Form Inputs
                </span>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: previewPalette.textSecondary }}
                  />
                  <input
                    type="text"
                    readOnly
                    value="INV-2026-00481 • Acme Corp"
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border font-medium focus:outline-none"
                    style={{
                      backgroundColor: previewIsDark ? previewPalette.surface : '#FFFFFF',
                      borderColor: previewPalette.border,
                      color: previewPalette.textPrimary,
                    }}
                  />
                </div>
              </div>

              {/* 5. Status Badges Preview */}
              <div className="space-y-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider block"
                  style={{ color: previewPalette.textSecondary }}
                >
                  Status Indicators
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Approved</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60">
                    <Clock size={11} />
                    <span>Pending</span>
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border"
                    style={{
                      backgroundColor: previewPalette.surface2,
                      borderColor: previewPalette.border,
                      color: previewPalette.textSecondary,
                    }}
                  >
                    <span>Draft</span>
                  </span>
                </div>
              </div>

              {/* 6. Mini Table Sample */}
              <div className="space-y-1.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider block"
                  style={{ color: previewPalette.textSecondary }}
                >
                  Data Table View
                </span>
                <div
                  className="rounded-lg border overflow-hidden text-xs"
                  style={{ borderColor: previewPalette.border }}
                >
                  <div
                    className="grid grid-cols-3 px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider border-b"
                    style={{
                      backgroundColor: previewPalette.tableHeaderBg || previewPalette.surface2,
                      borderColor: previewPalette.border,
                      color: previewPalette.textPrimary,
                    }}
                  >
                    <span>Entity</span>
                    <span>Status</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <div
                    className="grid grid-cols-3 px-3 py-2 items-center border-b"
                    style={{
                      backgroundColor: previewPalette.surface,
                      borderColor: previewPalette.border,
                      color: previewPalette.textPrimary,
                    }}
                  >
                    <span className="font-semibold truncate">Acme Industries</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Active</span>
                    <span className="text-right font-mono font-bold">₹42,500</span>
                  </div>
                  <div
                    className="grid grid-cols-3 px-3 py-2 items-center"
                    style={{
                      backgroundColor: previewPalette.surface2,
                      color: previewPalette.textPrimary,
                    }}
                  >
                    <span className="font-semibold truncate">Global Logistics</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">In Review</span>
                    <span className="text-right font-mono font-bold">₹18,200</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Preview */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-3 rounded-xl border border-[#D5D8CA] dark:border-[#2A2F3D] bg-white dark:bg-[#1D212C] text-xs font-semibold text-[#485942] dark:text-[#A0A6B5] hover:bg-[#EDEEE4] transition-colors"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleApplyAll}
                disabled={isSaving}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-[#2E3D28] hover:bg-[#3C4E34] active:bg-[#243320] text-white shadow-2xs transition-all flex items-center justify-center gap-2"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-300" />
                    <span>Applied Globally!</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>{isSaving ? 'Applying...' : 'Apply Appearance Globally'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}

