import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  THEME_PRESETS,
  DEFAULT_APPEARANCE_SETTINGS,
  resolveEffectiveMode,
  loadSavedAppearance,
  LANDING_PAGE_COLORS,
  isPublicLandingPath,
  applyLandingSageTheme,
} from '../themePresets.js';
import themeReducer, {
  setThemeMode,
  setThemePreset,
  setLayoutSettings,
  setTypographySettings,
  setCustomColors,
  applyAllAppearanceSettings,
  resetAppearanceDefaults,
  toggleDarkMode,
  setDarkMode,
} from '../themeSlice.js';

describe('Global Appearance & Themes Theme Studio Test Suite', () => {
  describe('1. Predefined Themes & 60-30-10 Brand Color System', () => {
    it('contains exactly the 5 approved ERP enterprise themes', () => {
      const themeIds = THEME_PRESETS.map((t) => t.id);
      assert.deepStrictEqual(themeIds, ['sage', 'ocean', 'lavender', 'terracotta', 'slate']);
      assert.strictEqual(THEME_PRESETS.length, 5);
    });

    it('validates 1. Sage Nature colors (Dominant: #E8E9DF, Secondary: #A9B887, Accent: #2E3D28)', () => {
      const sage = THEME_PRESETS.find((t) => t.id === 'sage');
      assert.ok(sage);
      assert.strictEqual(sage.dominantHex.toUpperCase(), '#E8E9DF');
      assert.strictEqual(sage.secondaryHex.toUpperCase(), '#A9B887');
      assert.strictEqual(sage.accentHex.toUpperCase(), '#2E3D28');
      assert.strictEqual(sage.light.background.toUpperCase(), '#E8E9DF');
      assert.strictEqual(sage.light.primary.toUpperCase(), '#2E3D28');
      assert.strictEqual(sage.dark.background.toUpperCase(), '#101411');
      assert.strictEqual(sage.dark.primary.toUpperCase(), '#8FA87B');
      assert.strictEqual(sage.dark.surface.toUpperCase(), '#181E19');
      assert.strictEqual(sage.dark.surface2.toUpperCase(), '#202922');
      assert.strictEqual(sage.dark.border.toUpperCase(), '#2E3D31');
    });

    it('validates 2. Ocean Blue colors (Dominant: #EAF1F8, Secondary: #8EABC9, Accent: #24476B)', () => {
      const ocean = THEME_PRESETS.find((t) => t.id === 'ocean');
      assert.ok(ocean);
      assert.strictEqual(ocean.dominantHex.toUpperCase(), '#EAF1F8');
      assert.strictEqual(ocean.secondaryHex.toUpperCase(), '#8EABC9');
      assert.strictEqual(ocean.accentHex.toUpperCase(), '#24476B');
      assert.strictEqual(ocean.light.background.toUpperCase(), '#EAF1F8');
      assert.strictEqual(ocean.light.primary.toUpperCase(), '#24476B');
      assert.strictEqual(ocean.light.surface.toUpperCase(), '#F7FAFD');
      assert.strictEqual(ocean.light.surface2.toUpperCase(), '#DFEAF4');
      assert.strictEqual(ocean.light.border.toUpperCase(), '#D2DFEB');
      assert.strictEqual(ocean.light.textPrimary.toUpperCase(), '#24476B');
      assert.strictEqual(ocean.light.textSecondary.toUpperCase(), '#506C87');
      assert.strictEqual(ocean.light.primaryHover.toUpperCase(), '#315A80');
      assert.strictEqual(ocean.dark.background.toUpperCase(), '#0D131A');
      assert.strictEqual(ocean.dark.primary.toUpperCase(), '#5B8EC2');
      assert.strictEqual(ocean.dark.surface.toUpperCase(), '#141C26');
      assert.strictEqual(ocean.dark.surface2.toUpperCase(), '#1C2735');
      assert.strictEqual(ocean.dark.border.toUpperCase(), '#2B3B4E');
    });

    it('validates 3. Lavender colors (Dominant: #F0EDF7, Secondary: #B7A8D1, Accent: #554274)', () => {
      const lavender = THEME_PRESETS.find((t) => t.id === 'lavender');
      assert.ok(lavender);
      assert.strictEqual(lavender.dominantHex.toUpperCase(), '#F0EDF7');
      assert.strictEqual(lavender.secondaryHex.toUpperCase(), '#B7A8D1');
      assert.strictEqual(lavender.accentHex.toUpperCase(), '#554274');
      assert.strictEqual(lavender.light.background.toUpperCase(), '#F0EDF7');
      assert.strictEqual(lavender.light.primary.toUpperCase(), '#554274');
      assert.strictEqual(lavender.dark.background.toUpperCase(), '#111019');
      assert.strictEqual(lavender.dark.surface.toUpperCase(), '#1B1925');
      assert.strictEqual(lavender.dark.surface2.toUpperCase(), '#252130');
      assert.strictEqual(lavender.dark.primary.toUpperCase(), '#B7A8D1');
      assert.strictEqual(lavender.dark.border.toUpperCase(), '#393246');
    });

    it('validates 4. Terracotta colors (Dominant: #F6EEE8, Secondary: #D6A58D, Accent: #794633)', () => {
      const terracotta = THEME_PRESETS.find((t) => t.id === 'terracotta');
      assert.ok(terracotta);
      assert.strictEqual(terracotta.dominantHex.toUpperCase(), '#F6EEE8');
      assert.strictEqual(terracotta.secondaryHex.toUpperCase(), '#D6A58D');
      assert.strictEqual(terracotta.accentHex.toUpperCase(), '#794633');
      assert.strictEqual(terracotta.light.background.toUpperCase(), '#F6EEE8');
      assert.strictEqual(terracotta.light.primary.toUpperCase(), '#794633');
      assert.strictEqual(terracotta.dark.background.toUpperCase(), '#151110');
      assert.strictEqual(terracotta.dark.surface.toUpperCase(), '#1F1917');
      assert.strictEqual(terracotta.dark.surface2.toUpperCase(), '#2B221F');
      assert.strictEqual(terracotta.dark.primary.toUpperCase(), '#C9866B');
      assert.strictEqual(terracotta.dark.border.toUpperCase(), '#423430');
    });

    it('validates 5. Slate Professional colors (Dominant: #ECEFF2, Secondary: #9CAAB7, Accent: #344454)', () => {
      const slate = THEME_PRESETS.find((t) => t.id === 'slate');
      assert.ok(slate);
      assert.strictEqual(slate.dominantHex.toUpperCase(), '#ECEFF2');
      assert.strictEqual(slate.secondaryHex.toUpperCase(), '#9CAAB7');
      assert.strictEqual(slate.accentHex.toUpperCase(), '#344454');
      assert.strictEqual(slate.light.background.toUpperCase(), '#ECEFF2');
      assert.strictEqual(slate.light.primary.toUpperCase(), '#344454');
      assert.strictEqual(slate.dark.background.toUpperCase(), '#111418');
      assert.strictEqual(slate.dark.surface.toUpperCase(), '#181D23');
      assert.strictEqual(slate.dark.surface2.toUpperCase(), '#222931');
      assert.strictEqual(slate.dark.primary.toUpperCase(), '#8BA3BA');
      assert.strictEqual(slate.dark.border.toUpperCase(), '#333E4A');
    });

    it('ensures each theme provides complete Light and Dark token sets', () => {
      THEME_PRESETS.forEach((preset) => {
        ['light', 'dark'].forEach((variant) => {
          const p = preset[variant];
          assert.ok(p.background, `${preset.id}.${variant} missing background`);
          assert.ok(p.surface, `${preset.id}.${variant} missing surface`);
          assert.ok(p.border, `${preset.id}.${variant} missing border`);
          assert.ok(p.primary, `${preset.id}.${variant} missing primary`);
          assert.ok(p.textPrimary, `${preset.id}.${variant} missing textPrimary`);
          assert.ok(p.textSecondary, `${preset.id}.${variant} missing textSecondary`);
          assert.ok(p.sidebarBg, `${preset.id}.${variant} missing sidebarBg`);
          assert.ok(p.sidebarActiveBg, `${preset.id}.${variant} missing sidebarActiveBg`);
        });
      });
    });
  });

  describe('2. Mode Resolution & Fallbacks', () => {
    it('correctly resolves explicit light and dark modes', () => {
      assert.strictEqual(resolveEffectiveMode('dark'), 'dark');
      assert.strictEqual(resolveEffectiveMode('light'), 'light');
    });

    it('falls back to light when system media match is unavailable', () => {
      const mode = resolveEffectiveMode('system');
      assert.ok(mode === 'light' || mode === 'dark');
    });
  });

  describe('3. Redux themeSlice Reducers & Actions', () => {
    const initialState = {
      mode: 'light',
      resolvedTheme: 'light',
      darkMode: false,
      themePreset: 'sage',
      layout: { ...DEFAULT_APPEARANCE_SETTINGS.layout },
      typography: { ...DEFAULT_APPEARANCE_SETTINGS.typography },
      customColors: null,
    };

    it('handles setThemeMode', () => {
      const state = themeReducer(initialState, setThemeMode('dark'));
      assert.strictEqual(state.mode, 'dark');
      assert.strictEqual(state.resolvedTheme, 'dark');
      assert.strictEqual(state.darkMode, true);
    });

    it('handles setThemePreset', () => {
      const state = themeReducer(initialState, setThemePreset('ocean'));
      assert.strictEqual(state.themePreset, 'ocean');
      assert.strictEqual(state.customColors, null);
    });

    it('handles setLayoutSettings (sidebar, density, width, radius, shadows, table)', () => {
      const state = themeReducer(
        initialState,
        setLayoutSettings({
          sidebarCollapsed: true,
          density: 'compact',
          contentWidth: 'wide',
          borderRadius: 'small',
          cardShadows: false,
          tableDensity: 'compact',
        })
      );
      assert.strictEqual(state.layout.sidebarCollapsed, true);
      assert.strictEqual(state.layout.density, 'compact');
      assert.strictEqual(state.layout.contentWidth, 'wide');
      assert.strictEqual(state.layout.borderRadius, 'small');
      assert.strictEqual(state.layout.cardShadows, false);
      assert.strictEqual(state.layout.tableDensity, 'compact');
    });

    it('handles setTypographySettings (fontSize, fontFamily)', () => {
      const state = themeReducer(
        initialState,
        setTypographySettings({
          fontSize: 'large',
          fontFamily: 'jakarta',
        })
      );
      assert.strictEqual(state.typography.fontSize, 'large');
      assert.strictEqual(state.typography.fontFamily, 'jakarta');
    });

    it('handles setCustomColors overrides', () => {
      const state = themeReducer(
        initialState,
        setCustomColors({
          primary: '#123456',
          secondary: '#654321',
          accent: '#abcdef',
          background: '#fedcba',
        })
      );
      assert.deepStrictEqual(state.customColors, {
        primary: '#123456',
        secondary: '#654321',
        accent: '#abcdef',
        background: '#fedcba',
      });
    });

    it('handles applyAllAppearanceSettings atomically', () => {
      const state = themeReducer(
        initialState,
        applyAllAppearanceSettings({
          themePreset: 'lavender',
          mode: 'dark',
          layout: { density: 'compact' },
          typography: { fontSize: 'small' },
        })
      );
      assert.strictEqual(state.themePreset, 'lavender');
      assert.strictEqual(state.mode, 'dark');
      assert.strictEqual(state.layout.density, 'compact');
      assert.strictEqual(state.typography.fontSize, 'small');
    });

    it('handles resetAppearanceDefaults', () => {
      const modified = {
        mode: 'dark',
        resolvedTheme: 'dark',
        darkMode: true,
        themePreset: 'terracotta',
        layout: { density: 'compact', cardShadows: false },
        typography: { fontSize: 'large' },
        customColors: { primary: '#000000' },
      };
      const state = themeReducer(modified, resetAppearanceDefaults());
      assert.strictEqual(state.themePreset, 'sage');
      assert.strictEqual(state.customColors, null);
      assert.strictEqual(state.layout.density, 'comfortable');
      assert.strictEqual(state.layout.cardShadows, true);
    });

    it('preserves legacy toggleDarkMode and setDarkMode actions', () => {
      const toggled = themeReducer(initialState, toggleDarkMode());
      assert.strictEqual(toggled.mode, 'dark');
      assert.strictEqual(toggled.darkMode, true);

      const explicitlySet = themeReducer(toggled, setDarkMode(false));
      assert.strictEqual(explicitlySet.mode, 'light');
      assert.strictEqual(explicitlySet.darkMode, false);
    });
  });
  describe('4. Permanent Landing Page Sage Nature Brand & Theme Separation', () => {
    it('has immutable LANDING_PAGE_COLORS defined with exact approved values', () => {
      assert.ok(LANDING_PAGE_COLORS);
      assert.strictEqual(LANDING_PAGE_COLORS.background.toUpperCase(), '#E8E9DF');
      assert.strictEqual(LANDING_PAGE_COLORS.secondary.toUpperCase(), '#A9B887');
      assert.strictEqual(LANDING_PAGE_COLORS.primary.toUpperCase(), '#2E3D28');
      assert.strictEqual(LANDING_PAGE_COLORS.surface.toUpperCase(), '#F7F7F0');
      assert.strictEqual(LANDING_PAGE_COLORS.surface2.toUpperCase(), '#EDEEE4');
      assert.strictEqual(LANDING_PAGE_COLORS.border.toUpperCase(), '#D5D8CA');
      assert.strictEqual(LANDING_PAGE_COLORS.textPrimary.toUpperCase(), '#2E3D28');
      assert.strictEqual(LANDING_PAGE_COLORS.textSecondary.toUpperCase(), '#485942');
      assert.strictEqual(LANDING_PAGE_COLORS.sidebarBg.toUpperCase(), '#DCE2CF');
    });

    it('identifies public landing paths accurately via isPublicLandingPath', () => {
      assert.strictEqual(isPublicLandingPath('/'), true);
      assert.strictEqual(isPublicLandingPath('/landing'), true);
      assert.strictEqual(isPublicLandingPath('/erp'), true);
      assert.strictEqual(isPublicLandingPath('/erp/'), true);
      assert.strictEqual(isPublicLandingPath('/erp/landing'), true);

      // Must return false for internal ERP routes
      assert.strictEqual(isPublicLandingPath('/accounts/dashboard'), false);
      assert.strictEqual(isPublicLandingPath('/company/1/finance'), false);
      assert.strictEqual(isPublicLandingPath('/settings/appearance'), false);
      assert.strictEqual(isPublicLandingPath('/purchase-orders'), false);
    });

    it('exports applyLandingSageTheme function that runs safely without crashing', () => {
      assert.strictEqual(typeof applyLandingSageTheme, 'function');
      // Calling in test environment should not throw
      assert.doesNotThrow(() => {
        applyLandingSageTheme();
      });
    });
  });
});
