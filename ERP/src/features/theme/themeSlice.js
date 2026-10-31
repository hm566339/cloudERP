import { createSlice } from '@reduxjs/toolkit';
import {
  loadSavedAppearance,
  applyAppearance,
  resolveEffectiveMode,
  DEFAULT_APPEARANCE_SETTINGS,
  isPublicLandingPath,
  applyLandingSageTheme,
  setActiveOrgId,
  getActiveOrgId,
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

function setupOsListener(mode, orgId) {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  if (mode === 'system') {
    if (!osChangeHandler) {
      osChangeHandler = () => {
        if (typeof document !== 'undefined') {
          const current = loadSavedAppearance(orgId);
          applyAppearance(current, orgId);
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
    // Active Organization ID for tenant-isolated themes
    organizationId: initialSettings.organizationId || getActiveOrgId() || null,
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
    setOrganizationId: (state, action) => {
      const orgId = action.payload;
      state.organizationId = orgId;
      setActiveOrgId(orgId);

      if (orgId) {
        const saved = loadSavedAppearance(orgId);
        state.themePreset = saved.themePreset || 'sage';
        state.mode = saved.mode || 'system';
        const resolved = resolveEffectiveMode(state.mode);
        state.resolvedTheme = resolved;
        state.darkMode = resolved === 'dark';
        state.layout = { ...DEFAULT_APPEARANCE_SETTINGS.layout, ...(saved.layout || {}) };
        state.typography = { ...DEFAULT_APPEARANCE_SETTINGS.typography, ...(saved.typography || {}) };
        state.customColors = saved.customColors || null;

        applyAppearance({
          themePreset: state.themePreset,
          mode: state.mode,
          layout: state.layout,
          typography: state.typography,
          customColors: state.customColors,
        }, orgId);
        setupOsListener(state.mode, orgId);
      }
    },

    setThemeMode: (state, action) => {
      const mode = action.payload; // 'light' | 'dark' | 'system'
      state.mode = mode;
      const resolved = resolveEffectiveMode(mode);
      state.resolvedTheme = resolved;
      state.darkMode = resolved === 'dark';

      const fullSettings = {
        organizationId: state.organizationId,
        themePreset: state.themePreset,
        mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      };
      applyAppearance(fullSettings, state.organizationId);
      setupOsListener(mode, state.organizationId);
    },

    setThemePreset: (state, action) => {
      const preset = action.payload;
      state.themePreset = preset;
      state.customColors = null; // Reset custom overrides when picking a preset

      const fullSettings = {
        organizationId: state.organizationId,
        themePreset: preset,
        mode: state.mode,
        layout: state.layout,
        typography: state.typography,
        customColors: null,
      };
      applyAppearance(fullSettings, state.organizationId);
    },

    setLayoutSettings: (state, action) => {
      state.layout = { ...state.layout, ...action.payload };

      const fullSettings = {
        organizationId: state.organizationId,
        themePreset: state.themePreset,
        mode: state.mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      };
      applyAppearance(fullSettings, state.organizationId);
    },

    setTypographySettings: (state, action) => {
      state.typography = { ...state.typography, ...action.payload };

      const fullSettings = {
        organizationId: state.organizationId,
        themePreset: state.themePreset,
        mode: state.mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      };
      applyAppearance(fullSettings, state.organizationId);
    },

    setCustomColors: (state, action) => {
      state.customColors = { ...state.customColors, ...action.payload };

      const fullSettings = {
        organizationId: state.organizationId,
        themePreset: state.themePreset,
        mode: state.mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      };
      applyAppearance(fullSettings, state.organizationId);
    },

    applyAllAppearanceSettings: (state, action) => {
      const payload = action.payload || {};

      // Support both backend API DTO keys and frontend state keys
      const orgId = payload.orgId || payload.organizationId || state.organizationId;
      if (orgId) {
        state.organizationId = orgId;
        setActiveOrgId(orgId);
      }

      const preset = payload.themePreset || payload.activeTheme;
      if (preset) state.themePreset = preset;

      const mode = payload.mode || payload.appearanceMode;
      if (mode) {
        state.mode = mode;
        const resolved = resolveEffectiveMode(mode);
        state.resolvedTheme = resolved;
        state.darkMode = resolved === 'dark';
      }

      const layoutDensity = payload.layoutDensity || payload.layout?.density;
      if (layoutDensity) {
        state.layout = { ...state.layout, density: layoutDensity };
      }
      if (payload.layout) {
        state.layout = { ...state.layout, ...payload.layout };
      }

      const fontFamily = payload.fontFamily || payload.typography?.fontFamily;
      if (fontFamily) {
        state.typography = { ...state.typography, fontFamily };
      }
      if (payload.typography) {
        state.typography = { ...state.typography, ...payload.typography };
      }

      state.customColors = payload.customColors || null;

      applyAppearance({
        organizationId: state.organizationId,
        themePreset: state.themePreset,
        mode: state.mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      }, state.organizationId);

      setupOsListener(state.mode, state.organizationId);
    },

    resetAppearanceDefaults: (state, action) => {
      const orgId = action?.payload?.orgId || state.organizationId;
      state.themePreset = DEFAULT_APPEARANCE_SETTINGS.themePreset;
      state.mode = DEFAULT_APPEARANCE_SETTINGS.mode;
      const resolved = resolveEffectiveMode(state.mode);
      state.resolvedTheme = resolved;
      state.darkMode = resolved === 'dark';
      state.layout = { ...DEFAULT_APPEARANCE_SETTINGS.layout };
      state.typography = { ...DEFAULT_APPEARANCE_SETTINGS.typography };
      state.customColors = null;

      applyAppearance({
        ...DEFAULT_APPEARANCE_SETTINGS,
        organizationId: orgId,
      }, orgId);

      setupOsListener(state.mode, orgId);
    },

    // Legacy actions — kept for backward compatibility
    toggleDarkMode: (state) => {
      const next = state.resolvedTheme === 'dark' ? 'light' : 'dark';
      state.mode = next;
      state.resolvedTheme = next;
      state.darkMode = next === 'dark';

      applyAppearance({
        organizationId: state.organizationId,
        themePreset: state.themePreset,
        mode: next,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      }, state.organizationId);
    },

    setDarkMode: (state, action) => {
      const isDark = Boolean(action.payload);
      const mode = isDark ? 'dark' : 'light';
      state.mode = mode;
      state.resolvedTheme = mode;
      state.darkMode = isDark;

      applyAppearance({
        organizationId: state.organizationId,
        themePreset: state.themePreset,
        mode,
        layout: state.layout,
        typography: state.typography,
        customColors: state.customColors,
      }, state.organizationId);
    },
  },
  extraReducers: (builder) => {
    // When SSO canonical /me is fulfilled, bind organization context & load saved theme
    builder.addMatcher(
      (action) => action.type?.endsWith('/fulfilled') && action.meta?.arg?.endpointName === 'ssoGetMe',
      (state, { payload }) => {
        const orgId = payload?.data?.organization?.id || payload?.organization?.id;
        if (orgId && orgId !== state.organizationId) {
          state.organizationId = orgId;
          setActiveOrgId(orgId);
          const saved = loadSavedAppearance(orgId);
          if (saved) {
            state.themePreset = saved.themePreset || 'sage';
            state.mode = saved.mode || 'system';
            const resolved = resolveEffectiveMode(state.mode);
            state.resolvedTheme = resolved;
            state.darkMode = resolved === 'dark';
            state.layout = { ...DEFAULT_APPEARANCE_SETTINGS.layout, ...(saved.layout || {}) };
            state.typography = { ...DEFAULT_APPEARANCE_SETTINGS.typography, ...(saved.typography || {}) };
            state.customColors = saved.customColors || null;

            applyAppearance({
              organizationId: orgId,
              themePreset: state.themePreset,
              mode: state.mode,
              layout: state.layout,
              typography: state.typography,
              customColors: state.customColors,
            }, orgId);
          }
        }
      }
    );

    // When backend returns persistent organization appearance settings
    builder.addMatcher(
      (action) => action.type?.endsWith('/fulfilled') && action.meta?.arg?.endpointName === 'getOrganizationAppearance',
      (state, { payload }) => {
        const data = payload?.data || payload;
        if (!data) return;

        const orgId = data.organizationId || state.organizationId;
        if (orgId) {
          state.organizationId = orgId;
          setActiveOrgId(orgId);
        }

        if (data.activeTheme) state.themePreset = data.activeTheme;
        if (data.appearanceMode) {
          state.mode = data.appearanceMode;
          const resolved = resolveEffectiveMode(data.appearanceMode);
          state.resolvedTheme = resolved;
          state.darkMode = resolved === 'dark';
        }
        if (data.layoutDensity) {
          state.layout = { ...state.layout, density: data.layoutDensity };
        }
        if (data.fontFamily) {
          state.typography = { ...state.typography, fontFamily: data.fontFamily };
        }

        applyAppearance({
          organizationId: state.organizationId,
          themePreset: state.themePreset,
          mode: state.mode,
          layout: state.layout,
          typography: state.typography,
          customColors: state.customColors,
        }, state.organizationId);
      }
    );
  },
});

export const {
  setOrganizationId,
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
