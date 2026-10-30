import { createSlice } from '@reduxjs/toolkit';
import {
  loadSavedAppearance,
  applyAppearance,
  resolveEffectiveMode,
  DEFAULT_APPEARANCE_SETTINGS,
  isPublicLandingPath,
  applyLandingSageTheme,
} from './themePresets.js';

// Load persisted settings on module load
const initialSettings = loadSavedAppearance();
const initialResolved = resolveEffectiveMode(initialSettings.mode);

// Apply immediately to prevent FOUC, ensuring public Landing Page stays locked to Sage Nature
if (typeof document !== 'undefined') {
  if (isPublicLandingPath()) {
    applyLandingSageTheme();
  } else {
    applyAppearance(initialSettings);
  }
}

let osChangeHandler = null;

function setupOsListener(mode) {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  if (mode === 'system') {
    if (!osChangeHandler) {
      osChangeHandler = () => {
        if (typeof document !== 'undefined') {
          const current = loadSavedAppearance();
          applyAppearance(current);
        }
      };
      mq.addEventListener?.('change', osChangeHandler);
    }
  } else {
    if (osChangeHandler) {
      mq.removeEventListener?.('change', osChangeHandler);
      osChangeHandler = null;
    }
  }
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    // Mode: 'light' | 'dark' | 'system'
    mode: initialSettings.mode,
    // Resolved actual applied theme: 'light' | 'dark'
    resolvedTheme: initialResolved,
    // Legacy boolean for backward compatibility
    darkMode: initialResolved === 'dark',
    // Active theme preset: 'sage' | 'ocean' | 'lavender' | 'terracotta' | 'slate'
    themePreset: initialSettings.themePreset || 'sage',
    // Layout customization options
    layout: initialSettings.layout || DEFAULT_APPEARANCE_SETTINGS.layout,
    // Typography customization options
    typography: initialSettings.typography || DEFAULT_APPEARANCE_SETTINGS.typography,
    // Optional advanced custom colors
    customColors: initialSettings.customColors || null,
  },
  reducers: {
    setThemeMode: (state, action) => {
      const mode = action.payload; // 'light' | 'dark' | 'system'
      state.mode = mode;
      const resolved = resolveEffectiveMode(mode);
      state.resolvedTheme = resolved;
      state.darkMode = resolved === 'dark';

      const fullSettings = {
        themePreset: state.themePreset,
        mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      };
      applyAppearance(fullSettings);
      setupOsListener(mode);
    },

    setThemePreset: (state, action) => {
      const preset = action.payload;
      state.themePreset = preset;
      state.customColors = null; // Reset custom overrides when picking a preset

      const fullSettings = {
        themePreset: preset,
        mode: state.mode,
        layout: state.layout,
        typography: state.typography,
        customColors: null,
      };
      applyAppearance(fullSettings);
    },

    setLayoutSettings: (state, action) => {
      state.layout = { ...state.layout, ...action.payload };

      const fullSettings = {
        themePreset: state.themePreset,
        mode: state.mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      };
      applyAppearance(fullSettings);
    },

    setTypographySettings: (state, action) => {
      state.typography = { ...state.typography, ...action.payload };

      const fullSettings = {
        themePreset: state.themePreset,
        mode: state.mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      };
      applyAppearance(fullSettings);
    },

    setCustomColors: (state, action) => {
      state.customColors = { ...state.customColors, ...action.payload };

      const fullSettings = {
        themePreset: state.themePreset,
        mode: state.mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      };
      applyAppearance(fullSettings);
    },

    applyAllAppearanceSettings: (state, action) => {
      const payload = action.payload || {};
      if (payload.themePreset) state.themePreset = payload.themePreset;
      if (payload.mode) {
        state.mode = payload.mode;
        const resolved = resolveEffectiveMode(payload.mode);
        state.resolvedTheme = resolved;
        state.darkMode = resolved === 'dark';
      }
      if (payload.layout) state.layout = { ...state.layout, ...payload.layout };
      if (payload.typography) state.typography = { ...state.typography, ...payload.typography };
      state.customColors = payload.customColors || null;

      applyAppearance({
        themePreset: state.themePreset,
        mode: state.mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      });
      setupOsListener(state.mode);
    },

    resetAppearanceDefaults: (state) => {
      state.themePreset = DEFAULT_APPEARANCE_SETTINGS.themePreset;
      state.mode = DEFAULT_APPEARANCE_SETTINGS.mode;
      const resolved = resolveEffectiveMode(state.mode);
      state.resolvedTheme = resolved;
      state.darkMode = resolved === 'dark';
      state.layout = { ...DEFAULT_APPEARANCE_SETTINGS.layout };
      state.typography = { ...DEFAULT_APPEARANCE_SETTINGS.typography };
      state.customColors = null;

      applyAppearance(DEFAULT_APPEARANCE_SETTINGS);
      setupOsListener(state.mode);
    },

    // Legacy actions — kept for backward compatibility
    toggleDarkMode: (state) => {
      const next = state.resolvedTheme === 'dark' ? 'light' : 'dark';
      state.mode = next;
      state.resolvedTheme = next;
      state.darkMode = next === 'dark';

      applyAppearance({
        themePreset: state.themePreset,
        mode: next,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      });
    },

    setDarkMode: (state, action) => {
      const isDark = Boolean(action.payload);
      const mode = isDark ? 'dark' : 'light';
      state.mode = mode;
      state.resolvedTheme = mode;
      state.darkMode = isDark;

      applyAppearance({
        themePreset: state.themePreset,
        mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      });
    },
  },
});

export const {
  setThemeMode,
  setThemePreset,
  setLayoutSettings,
  setTypographySettings,
  setCustomColors,
  applyAllAppearanceSettings,
  resetAppearanceDefaults,
  toggleDarkMode,
  setDarkMode,
} = themeSlice.actions;

export default themeSlice.reducer;
