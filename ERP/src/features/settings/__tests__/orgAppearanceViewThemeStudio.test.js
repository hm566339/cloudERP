import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  THEME_PRESETS,
  DEFAULT_APPEARANCE_SETTINGS,
  resolveEffectiveMode,
} from '../../theme/themePresets.js';
import themeReducer, {
  setThemeMode,
  setThemePreset,
  setLayoutSettings,
  setTypographySettings,
  setBrandingSettings,
  setCustomOverridesEnabled,
  setCustomColors,
  applyAllAppearanceSettings,
  resetAppearanceDefaults,
} from '../../theme/themeSlice.js';

describe('Organization Appearance & Themes - Theme Studio Redesign Test Suite', () => {
  describe('1. Organization Header & Tenant Isolation Specifications', () => {
    it('verifies default organization appearance settings structure', () => {
      assert.ok(DEFAULT_APPEARANCE_SETTINGS);
      assert.strictEqual(DEFAULT_APPEARANCE_SETTINGS.themePreset, 'sage');
      assert.strictEqual(DEFAULT_APPEARANCE_SETTINGS.mode, 'system');
      assert.strictEqual(DEFAULT_APPEARANCE_SETTINGS.layout.density, 'comfortable');
      assert.strictEqual(DEFAULT_APPEARANCE_SETTINGS.typography.fontFamily, 'default');
    });

    it('confirms 5 enterprise Theme Studio presets are available for organization theme', () => {
      const ids = THEME_PRESETS.map((t) => t.id);
      assert.deepStrictEqual(ids, ['sage', 'ocean', 'lavender', 'terracotta', 'slate']);
      assert.strictEqual(THEME_PRESETS.length, 5);
    });
  });

  describe('2. Appearance Mode Selection (Light, Dark, System)', () => {
    it('handles light mode selection', () => {
      const state = themeReducer(undefined, setThemeMode('light'));
      assert.strictEqual(state.mode, 'light');
      assert.strictEqual(state.resolvedTheme, 'light');
      assert.strictEqual(state.darkMode, false);
    });

    it('handles dark mode selection', () => {
      const state = themeReducer(undefined, setThemeMode('dark'));
      assert.strictEqual(state.mode, 'dark');
      assert.strictEqual(state.resolvedTheme, 'dark');
      assert.strictEqual(state.darkMode, true);
    });

    it('handles system default mode selection', () => {
      const state = themeReducer(undefined, setThemeMode('system'));
      assert.strictEqual(state.mode, 'system');
      assert.ok(state.resolvedTheme === 'light' || state.resolvedTheme === 'dark');
    });
  });

  describe('3. Layout Customization Controls', () => {
    it('updates sidebar default state (expanded / collapsed)', () => {
      let state = themeReducer(undefined, setLayoutSettings({ sidebarCollapsed: true }));
      assert.strictEqual(state.layout.sidebarCollapsed, true);

      state = themeReducer(state, setLayoutSettings({ sidebarCollapsed: false }));
      assert.strictEqual(state.layout.sidebarCollapsed, false);
    });

    it('updates layout density (comfortable / compact)', () => {
      const state = themeReducer(undefined, setLayoutSettings({ density: 'compact' }));
      assert.strictEqual(state.layout.density, 'compact');
    });

    it('updates content width (standard / wide)', () => {
      const state = themeReducer(undefined, setLayoutSettings({ contentWidth: 'wide' }));
      assert.strictEqual(state.layout.contentWidth, 'wide');
    });

    it('updates border radius (small, medium, large)', () => {
      const stateSmall = themeReducer(undefined, setLayoutSettings({ borderRadius: 'small' }));
      assert.strictEqual(stateSmall.layout.borderRadius, 'small');

      const stateLarge = themeReducer(undefined, setLayoutSettings({ borderRadius: 'large' }));
      assert.strictEqual(stateLarge.layout.borderRadius, 'large');
    });

    it('updates card shadows (elevated / flat)', () => {
      const stateFlat = themeReducer(undefined, setLayoutSettings({ cardShadows: false }));
      assert.strictEqual(stateFlat.layout.cardShadows, false);
    });

    it('updates table density (comfortable rows / compact scan rows)', () => {
      const state = themeReducer(undefined, setLayoutSettings({ tableDensity: 'compact' }));
      assert.strictEqual(state.layout.tableDensity, 'compact');
    });
  });

  describe('4. Typography & Fonts Controls', () => {
    it('updates interface font size (small 13px, default 14px, large 15px)', () => {
      const state = themeReducer(undefined, setTypographySettings({ fontSize: 'small' }));
      assert.strictEqual(state.typography.fontSize, 'small');
    });

    it('updates font family (Inter, Plus Jakarta, Roboto, System Sans)', () => {
      const families = ['Inter', 'Plus Jakarta', 'Roboto', 'System Sans'];
      for (const fam of families) {
        const state = themeReducer(undefined, setTypographySettings({ fontFamily: fam }));
        assert.strictEqual(state.typography.fontFamily, fam);
      }
    });
  });

  describe('5. Branding Assets & Logo Configuration', () => {
    it('updates light and dark logos and browser favicon URLs', () => {
      const branding = {
        lightLogoUrl: 'https://cdn.mark2.in/logos/org-light.png',
        darkLogoUrl: 'https://cdn.mark2.in/logos/org-dark.png',
        faviconUrl: 'https://cdn.mark2.in/logos/org-favicon.ico',
      };
      const state = themeReducer(undefined, setBrandingSettings(branding));
      assert.strictEqual(state.branding.lightLogoUrl, branding.lightLogoUrl);
      assert.strictEqual(state.branding.darkLogoUrl, branding.darkLogoUrl);
      assert.strictEqual(state.branding.faviconUrl, branding.faviconUrl);
    });
  });

  describe('6. Custom Palette Overrides', () => {
    it('toggles custom color overrides and preserves custom tokens', () => {
      let state = themeReducer(undefined, setCustomOverridesEnabled(true));
      assert.strictEqual(state.customOverridesEnabled, true);

      const custom = {
        primary: '#1D4ED8',
        secondary: '#93C5FD',
        accent: '#1E40AF',
        background: '#EFF6FF',
      };
      state = themeReducer(state, setCustomColors(custom));
      assert.strictEqual(state.customColors.primary, '#1D4ED8');
      assert.strictEqual(state.customColors.background, '#EFF6FF');
    });
  });

  describe('7. Global Application & Reset Defaults Contract', () => {
    it('applies all appearance settings in a single unified atomic action', () => {
      const payload = {
        organizationId: 'org-tenant-uuid-1234',
        themePreset: 'ocean',
        mode: 'dark',
        layout: {
          density: 'compact',
          sidebarCollapsed: true,
          contentWidth: 'wide',
          borderRadius: 'small',
          cardShadows: false,
          tableDensity: 'compact',
        },
        typography: {
          fontFamily: 'Plus Jakarta',
          fontSize: 'small',
        },
        branding: {
          lightLogoUrl: 'https://mark2.in/light.png',
          darkLogoUrl: 'https://mark2.in/dark.png',
          faviconUrl: 'https://mark2.in/favicon.ico',
        },
      };

      const state = themeReducer(undefined, applyAllAppearanceSettings(payload));
      assert.strictEqual(state.organizationId, 'org-tenant-uuid-1234');
      assert.strictEqual(state.themePreset, 'ocean');
      assert.strictEqual(state.mode, 'dark');
      assert.strictEqual(state.layout.density, 'compact');
      assert.strictEqual(state.typography.fontFamily, 'Plus Jakarta');
      assert.strictEqual(state.branding.lightLogoUrl, 'https://mark2.in/light.png');
    });

    it('resets organization appearance back to default system settings', () => {
      let state = themeReducer(undefined, setThemePreset('lavender'));
      state = themeReducer(state, setThemeMode('dark'));
      assert.strictEqual(state.themePreset, 'lavender');
      assert.strictEqual(state.mode, 'dark');

      state = themeReducer(state, resetAppearanceDefaults({ orgId: 'org-123' }));
      assert.strictEqual(state.themePreset, 'sage');
      assert.strictEqual(state.mode, 'system');
      assert.strictEqual(state.layout.density, 'comfortable');
      assert.strictEqual(state.typography.fontFamily, 'default');
    });
  });
});
