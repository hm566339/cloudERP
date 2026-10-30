/**
 * Global Theme Presets & Appearance Architecture for Mark2 ERP.
 * Implements strict 60-30-10 color balance with light and dark mode variants.
 */

export const THEME_PRESETS = [
  {
    id: 'sage',
    name: 'Sage Nature',
    tagline: 'Default Brand Palette',
    description: 'Calming earthy tones with natural sage highlights and deep forest green accents.',
    dominantHex: '#E8E9DF',   // 60%
    secondaryHex: '#A9B887',  // 30%
    accentHex: '#2E3D28',     // 10%
    light: {
      background: '#E8E9DF',
      surface: '#F7F7F0',
      surface2: '#EDEEE4',
      surface3: '#F2F3EC',
      border: '#D5D8CA',
      borderHover: '#BEC2B0',
      textPrimary: '#2E3D28',
      textSecondary: '#485942',
      textMuted: '#7A8A6E',
      sidebarBg: '#DCE2CF',
      sidebarHover: '#CFD7BF',
      sidebarActiveBg: '#2E3D28',
      sidebarActiveText: '#FFFFFF',
      primary: '#2E3D28',
      primaryHover: '#3C4E34',
      primaryActive: '#243320',
      primaryLight: 'rgba(169, 184, 135, 0.22)',
      tableHeaderBg: '#E2E7D7',
      focusRing: 'rgba(46, 61, 40, 0.18)',
    },
    dark: {
      background: '#101411',
      surface: '#181E19',
      surface2: '#202922',
      surface3: '#29342B',
      border: '#2E3D31',
      borderHover: '#3E5242',
      textPrimary: '#ECF2EC',
      textSecondary: '#A3B5A5',
      textMuted: '#708573',
      sidebarBg: '#141A15',
      sidebarHover: '#202922',
      sidebarActiveBg: '#8FA87B',
      sidebarActiveText: '#101411',
      primary: '#8FA87B',
      primaryHover: '#A2B98F',
      primaryActive: '#7D966A',
      primaryLight: 'rgba(143, 168, 123, 0.2)',
      tableHeaderBg: '#1C241E',
      focusRing: 'rgba(143, 168, 123, 0.35)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    tagline: 'Modern Corporate',
    description: 'Crisp nautical palette with serene soft blues and authoritative navy contrasts.',
    dominantHex: '#EAF1F8',   // 60%
    secondaryHex: '#8EABC9',  // 30%
    accentHex: '#24476B',     // 10%
    light: {
      background: '#EAF1F8',
      surface: '#F7FAFD',
      surface2: '#DFEAF4',
      surface3: '#D5E4F0',
      border: '#D2DFEB',
      borderHover: '#ADC3D9',
      textPrimary: '#24476B',
      textSecondary: '#506C87',
      textMuted: '#65829E',
      sidebarBg: '#DFEAF4',
      sidebarHover: '#D0DFEE',
      sidebarActiveBg: '#24476B',
      sidebarActiveText: '#FFFFFF',
      primary: '#24476B',
      primaryHover: '#315A80',
      primaryActive: '#1D3B59',
      primaryLight: 'rgba(142, 171, 201, 0.25)',
      tableHeaderBg: '#D8E5F1',
      focusRing: 'rgba(36, 71, 107, 0.18)',
    },
    dark: {
      background: '#0D131A',
      surface: '#141C26',
      surface2: '#1C2735',
      surface3: '#243345',
      border: '#2B3B4E',
      borderHover: '#3A4F68',
      textPrimary: '#EBF1F7',
      textSecondary: '#9BB2C9',
      textMuted: '#698199',
      sidebarBg: '#101821',
      sidebarHover: '#1C2735',
      sidebarActiveBg: '#5B8EC2',
      sidebarActiveText: '#0D131A',
      primary: '#5B8EC2',
      primaryHover: '#719ECF',
      primaryActive: '#4A7AA9',
      primaryLight: 'rgba(91, 142, 194, 0.2)',
      tableHeaderBg: '#182230',
      focusRing: 'rgba(91, 142, 194, 0.35)',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    tagline: 'Creative & Sophisticated',
    description: 'Elegant lilac and deep violet tones crafted for innovative enterprise workspaces.',
    dominantHex: '#F0EDF7',   // 60%
    secondaryHex: '#B7A8D1',  // 30%
    accentHex: '#554274',     // 10%
    light: {
      background: '#F0EDF7',
      surface: '#F8F6FC',
      surface2: '#E9E3F3',
      surface3: '#DDD4EC',
      border: '#D4CBE5',
      borderHover: '#BEAFD6',
      textPrimary: '#3E2E57',
      textSecondary: '#5F4D7A',
      textMuted: '#84739E',
      sidebarBg: '#E4DCF0',
      sidebarHover: '#D5CBE3',
      sidebarActiveBg: '#554274',
      sidebarActiveText: '#FFFFFF',
      primary: '#554274',
      primaryHover: '#42325C',
      primaryActive: '#322547',
      primaryLight: 'rgba(183, 168, 209, 0.25)',
      tableHeaderBg: '#E2D8EE',
      focusRing: 'rgba(85, 66, 116, 0.18)',
    },
    dark: {
      background: '#111019',
      surface: '#1B1925',
      surface2: '#252130',
      surface3: '#2F2A3D',
      border: '#393246',
      borderHover: '#4D435F',
      textPrimary: '#F4F0FA',
      textSecondary: '#B3AABD',
      textMuted: '#80778C',
      sidebarBg: '#151320',
      sidebarHover: '#252130',
      sidebarActiveBg: '#B7A8D1',
      sidebarActiveText: '#111019',
      primary: '#B7A8D1',
      primaryHover: '#C9BDDE',
      primaryActive: '#A392BF',
      primaryLight: 'rgba(183, 168, 209, 0.2)',
      tableHeaderBg: '#211E2E',
      focusRing: 'rgba(183, 168, 209, 0.35)',
    },
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    tagline: 'Warm & Grounded',
    description: 'Warm clay, soft sandstone and rustic russet notes offering organic warmth.',
    dominantHex: '#F6EEE8',   // 60%
    secondaryHex: '#D6A58D',  // 30%
    accentHex: '#794633',     // 10%
    light: {
      background: '#F6EEE8',
      surface: '#FDF9F6',
      surface2: '#F0E2D9',
      surface3: '#E6D3C7',
      border: '#E3CEBF',
      borderHover: '#CFAF9D',
      textPrimary: '#573022',
      textSecondary: '#754837',
      textMuted: '#9E6E5A',
      sidebarBg: '#ECDCCF',
      sidebarHover: '#DFCBBD',
      sidebarActiveBg: '#794633',
      sidebarActiveText: '#FFFFFF',
      primary: '#794633',
      primaryHover: '#643828',
      primaryActive: '#4F2B1D',
      primaryLight: 'rgba(214, 165, 141, 0.25)',
      tableHeaderBg: '#E9D6C8',
      focusRing: 'rgba(121, 70, 51, 0.18)',
    },
    dark: {
      background: '#151110',
      surface: '#1F1917',
      surface2: '#2B221F',
      surface3: '#382C28',
      border: '#423430',
      borderHover: '#57443E',
      textPrimary: '#F7EFEB',
      textSecondary: '#BDA9A2',
      textMuted: '#8B7670',
      sidebarBg: '#191412',
      sidebarHover: '#2B221F',
      sidebarActiveBg: '#C9866B',
      sidebarActiveText: '#151110',
      primary: '#C9866B',
      primaryHover: '#D79A81',
      primaryActive: '#B67357',
      primaryLight: 'rgba(201, 134, 107, 0.2)',
      tableHeaderBg: '#251D1B',
      focusRing: 'rgba(201, 134, 107, 0.35)',
    },
  },
  {
    id: 'slate',
    name: 'Slate Professional',
    tagline: 'Technical & Clean',
    description: 'Engineered cool neutrals and industrial slate designed for dense operational clarity.',
    dominantHex: '#ECEFF2',   // 60%
    secondaryHex: '#9CAAB7',  // 30%
    accentHex: '#344454',     // 10%
    light: {
      background: '#ECEFF2',
      surface: '#F6F8FA',
      surface2: '#E2E7EC',
      surface3: '#D5DCE2',
      border: '#CBD3DC',
      borderHover: '#B0BAC6',
      textPrimary: '#232E3A',
      textSecondary: '#475768',
      textMuted: '#6D7E8F',
      sidebarBg: '#D8DFE6',
      sidebarHover: '#C8D2DC',
      sidebarActiveBg: '#344454',
      sidebarActiveText: '#FFFFFF',
      primary: '#344454',
      primaryHover: '#283542',
      primaryActive: '#1F2933',
      primaryLight: 'rgba(156, 170, 183, 0.25)',
      tableHeaderBg: '#D3DBE2',
      focusRing: 'rgba(52, 68, 84, 0.18)',
    },
    dark: {
      background: '#111418',
      surface: '#181D23',
      surface2: '#222931',
      surface3: '#2B343E',
      border: '#333E4A',
      borderHover: '#455363',
      textPrimary: '#EEF2F6',
      textSecondary: '#A2B1C0',
      textMuted: '#708091',
      sidebarBg: '#14181D',
      sidebarHover: '#222931',
      sidebarActiveBg: '#8BA3BA',
      sidebarActiveText: '#111418',
      primary: '#8BA3BA',
      primaryHover: '#9FB5C9',
      primaryActive: '#778FA8',
      primaryLight: 'rgba(139, 163, 186, 0.2)',
      tableHeaderBg: '#1D232A',
      focusRing: 'rgba(139, 163, 186, 0.35)',
    },
  },
];

export const DEFAULT_APPEARANCE_SETTINGS = {
  themePreset: 'sage',
  mode: 'system', // 'light' | 'dark' | 'system'
  layout: {
    sidebarCollapsed: false,
    density: 'comfortable',    // 'comfortable' | 'compact'
    contentWidth: 'standard',   // 'standard' | 'wide'
    borderRadius: 'medium',     // 'small' | 'medium' | 'large'
    cardShadows: true,          // boolean
    tableDensity: 'comfortable',// 'comfortable' | 'compact'
  },
  typography: {
    fontSize: 'default',        // 'small' | 'default' | 'large'
    fontFamily: 'default',      // 'default' | 'jakarta' | 'roboto' | 'system'
  },
  customColors: null, // null or { primary, secondary, accent, background }
};

const STORAGE_KEY = 'erp_appearance_settings';

/**
 * Loads saved appearance preferences from localStorage.
 */
export function loadSavedAppearance() {
  if (typeof localStorage === 'undefined') return DEFAULT_APPEARANCE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_APPEARANCE_SETTINGS,
        ...parsed,
        layout: { ...DEFAULT_APPEARANCE_SETTINGS.layout, ...(parsed.layout || {}) },
        typography: { ...DEFAULT_APPEARANCE_SETTINGS.typography, ...(parsed.typography || {}) },
      };
    }
    // Backward compatibility with legacy theme_mode
    const legacyMode = localStorage.getItem('theme_mode');
    if (legacyMode) {
      return { ...DEFAULT_APPEARANCE_SETTINGS, mode: legacyMode };
    }
  } catch (err) {
    console.warn('Failed to read appearance settings:', err);
  }
  return DEFAULT_APPEARANCE_SETTINGS;
}

/**
 * Resolves whether the UI should currently render in light or dark mode.
 */
export function resolveEffectiveMode(mode) {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Immutable Public Landing Page Sage Nature Palette.
 * These HEX values are permanently locked and must never be altered or overridden by ERP Theme Studio.
 */
export const LANDING_PAGE_COLORS = {
  background: '#E8E9DF',       // 60% dominant canvas
  secondary: '#A9B887',        // 30% secondary sage surface & accent
  primary: '#2E3D28',          // 10% primary forest action & heading
  primaryHover: '#3C4E34',
  primaryActive: '#243320',
  surface: '#F7F7F0',          // Card surface
  surface2: '#EDEEE4',         // Secondary surface
  surface3: '#F2F3EC',         // Tertiary surface
  border: '#D5D8CA',           // Soft border
  borderHover: '#BEC2B0',
  textPrimary: '#2E3D28',
  textSecondary: '#485942',
  textMuted: '#7A8A6E',
  sidebarBg: '#DCE2CF',
  sidebarHover: '#CFD7BF',
  tableHeaderBg: '#E2E7D7',
};

/**
 * Checks whether the current path is the public landing page.
 */
export function isPublicLandingPath(pathname = typeof window !== 'undefined' ? window.location.pathname : '') {
  if (!pathname) return false;
  const clean = pathname.replace(/\/$/, '') || '/';
  const basename = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_BASE_PATH || import.meta.env.BASE_URL))
    ? (import.meta.env.VITE_BASE_PATH || import.meta.env.BASE_URL).replace(/\/$/, '')
    : '/erp';

  return (
    clean === '' ||
    clean === '/' ||
    clean === '/landing' ||
    clean === basename ||
    clean === `${basename}/` ||
    clean === `${basename}/landing`
  );
}

/**
 * Permanently locks the root variables to the original Sage Nature palette for the public Landing Page.
 */
export function applyLandingSageTheme() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Force light mode on documentElement for the public website
  root.classList.remove('dark');
  root.style.colorScheme = 'light';

  // 2. Set immutable brand tokens
  root.style.setProperty('--color-bg-base', LANDING_PAGE_COLORS.background);
  root.style.setProperty('--bg', LANDING_PAGE_COLORS.background);
  root.style.setProperty('--color-surface', LANDING_PAGE_COLORS.surface);
  root.style.setProperty('--surface', LANDING_PAGE_COLORS.surface);
  root.style.setProperty('--color-surface-2', LANDING_PAGE_COLORS.surface2);
  root.style.setProperty('--surface-2', LANDING_PAGE_COLORS.surface2);
  root.style.setProperty('--color-surface-3', LANDING_PAGE_COLORS.surface3);
  root.style.setProperty('--color-border', LANDING_PAGE_COLORS.border);
  root.style.setProperty('--border', LANDING_PAGE_COLORS.border);
  root.style.setProperty('--color-border-hover', LANDING_PAGE_COLORS.borderHover);
  root.style.setProperty('--color-primary', LANDING_PAGE_COLORS.primary);
  root.style.setProperty('--primary', LANDING_PAGE_COLORS.primary);
  root.style.setProperty('--color-primary-hover', LANDING_PAGE_COLORS.primaryHover);
  root.style.setProperty('--primary-hover', LANDING_PAGE_COLORS.primaryHover);
  root.style.setProperty('--color-primary-active', LANDING_PAGE_COLORS.primaryActive);
  root.style.setProperty('--color-primary-light', 'rgba(169, 184, 135, 0.22)');
  root.style.setProperty('--color-text-primary', LANDING_PAGE_COLORS.textPrimary);
  root.style.setProperty('--text', LANDING_PAGE_COLORS.textPrimary);
  root.style.setProperty('--color-text-secondary', LANDING_PAGE_COLORS.textSecondary);
  root.style.setProperty('--color-text-muted', LANDING_PAGE_COLORS.textMuted);
  root.style.setProperty('--color-sidebar-bg', LANDING_PAGE_COLORS.sidebarBg);
  root.style.setProperty('--color-sidebar-hover-bg', LANDING_PAGE_COLORS.sidebarHover);
  root.style.setProperty('--color-sidebar-active-bg', LANDING_PAGE_COLORS.primary);
  root.style.setProperty('--color-sidebar-active-text', '#FFFFFF');
  root.style.setProperty('--color-sidebar-text', LANDING_PAGE_COLORS.textSecondary);
  root.style.setProperty('--ring', 'rgba(46, 61, 40, 0.18)');
  root.style.setProperty('--color-input-bg', '#FFFFFF');
  root.style.setProperty('--input-bg', '#FFFFFF');
  root.style.setProperty('--color-input-border', LANDING_PAGE_COLORS.border);
  root.style.setProperty('--color-table-header', LANDING_PAGE_COLORS.tableHeaderBg);
  root.style.setProperty('--color-table-row-hover', LANDING_PAGE_COLORS.surface3);
  root.style.setProperty('--color-navbar-bg', LANDING_PAGE_COLORS.surface);
  root.style.setProperty('--color-navbar-border', LANDING_PAGE_COLORS.border);
  root.style.setProperty('--color-footer-bg', LANDING_PAGE_COLORS.sidebarBg);
  root.style.setProperty('--color-modal-bg', LANDING_PAGE_COLORS.surface);
  root.style.setProperty('--color-dropdown-bg', LANDING_PAGE_COLORS.surface);

  root.setAttribute('data-theme', 'sage');
}

/**
 * Applies all appearance settings (CSS Variables, DOM attributes, HTML classes) globally.
 */
export function applyAppearance(settings) {
  if (typeof document === 'undefined') return;

  // Always persist appearance settings for the ERP application
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem('theme_mode', settings.mode);
    if (settings.layout?.sidebarCollapsed !== undefined) {
      localStorage.setItem('erp_sidebar_collapsed', String(settings.layout.sidebarCollapsed));
      localStorage.setItem('owner_sidebar_collapsed', String(settings.layout.sidebarCollapsed));
    }
  } catch (err) {
    console.warn('Failed to persist appearance settings:', err);
  }

  // If the browser is currently viewing the public Landing Page, keep Sage Nature locked
  if (isPublicLandingPath()) {
    applyLandingSageTheme();
    return;
  }

  const root = document.documentElement;
  const effectiveMode = resolveEffectiveMode(settings.mode);
  const isDark = effectiveMode === 'dark';

  // 1. Sync Dark Mode class & color scheme
  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  // 2. Resolve Color Palette from preset or custom
  const preset = THEME_PRESETS.find((p) => p.id === settings.themePreset) || THEME_PRESETS[0];
  const palette = isDark ? preset.dark : preset.light;

  // CSS variables mapped globally across all components
  root.style.setProperty('--color-bg-base', palette.background);
  root.style.setProperty('--bg', palette.background);
  root.style.setProperty('--color-surface', palette.surface);
  root.style.setProperty('--surface', palette.surface);
  root.style.setProperty('--color-surface-2', palette.surface2);
  root.style.setProperty('--surface-2', palette.surface2);
  root.style.setProperty('--color-surface-3', palette.surface3);
  root.style.setProperty('--color-border', palette.border);
  root.style.setProperty('--border', palette.border);
  root.style.setProperty('--color-border-hover', palette.borderHover);
  root.style.setProperty('--color-primary', palette.primary);
  root.style.setProperty('--primary', palette.primary);
  root.style.setProperty('--color-primary-hover', palette.primaryHover);
  root.style.setProperty('--primary-hover', palette.primaryHover);
  root.style.setProperty('--color-primary-active', palette.primaryActive);
  root.style.setProperty('--color-primary-light', palette.primaryLight);
  root.style.setProperty('--color-text-primary', palette.textPrimary);
  root.style.setProperty('--text', palette.textPrimary);
  root.style.setProperty('--color-text-secondary', palette.textSecondary);
  root.style.setProperty('--color-text-muted', palette.textMuted);
  root.style.setProperty('--color-sidebar-bg', palette.sidebarBg);
  root.style.setProperty('--color-sidebar-hover-bg', palette.sidebarHover || palette.sidebarHoverBg);
  root.style.setProperty('--color-sidebar-active-bg', palette.sidebarActiveBg);
  root.style.setProperty('--color-sidebar-active-text', palette.sidebarActiveText);
  root.style.setProperty('--color-sidebar-text', palette.textSecondary);
  root.style.setProperty('--ring', palette.focusRing);
  root.style.setProperty('--color-input-bg', isDark ? palette.surface2 : '#FFFFFF');
  root.style.setProperty('--input-bg', isDark ? palette.surface2 : '#FFFFFF');
  root.style.setProperty('--color-input-border', palette.border);
  root.style.setProperty('--input-border', palette.border);
  root.style.setProperty('--color-input-focus', palette.primary);
  root.style.setProperty('--color-table-header', palette.tableHeaderBg || palette.surface2);
  root.style.setProperty('--color-table-row-hover', palette.surface3 || palette.surface2);
  root.style.setProperty('--color-navbar-bg', palette.surface);
  root.style.setProperty('--color-navbar-border', palette.border);
  root.style.setProperty('--color-footer-bg', palette.sidebarBg || palette.surface);
  root.style.setProperty('--color-modal-bg', palette.surface);
  root.style.setProperty('--color-dropdown-bg', palette.surface);

  // If custom color overrides are present
  if (settings.customColors) {
    if (settings.customColors.primary) {
      root.style.setProperty('--color-primary', settings.customColors.primary);
      root.style.setProperty('--primary', settings.customColors.primary);
      root.style.setProperty('--color-sidebar-active-bg', settings.customColors.primary);
    }
    if (settings.customColors.secondary) {
      root.style.setProperty('--color-primary-light', settings.customColors.secondary);
      root.style.setProperty('--color-text-secondary', settings.customColors.secondary);
    }
    if (settings.customColors.background) {
      root.style.setProperty('--color-bg-base', settings.customColors.background);
      root.style.setProperty('--bg', settings.customColors.background);
    }
  }

  // 3. Set Global Data Attributes for Layout & Typography
  root.setAttribute('data-theme', settings.themePreset || 'sage');
  root.setAttribute('data-density', settings.layout?.density || 'comfortable');
  root.setAttribute('data-content-width', settings.layout?.contentWidth || 'standard');
  root.setAttribute('data-border-radius', settings.layout?.borderRadius || 'medium');
  root.setAttribute('data-card-shadows', settings.layout?.cardShadows ? 'on' : 'off');
  root.setAttribute('data-table-density', settings.layout?.tableDensity || 'comfortable');
  root.setAttribute('data-font-size', settings.typography?.fontSize || 'default');
  root.setAttribute('data-font-family', settings.typography?.fontFamily || 'default');

  // 4. Update Border Radius variable
  const radiusMap = {
    small: '6px',
    medium: '12px',
    large: '18px',
  };
  root.style.setProperty('--radius-card', radiusMap[settings.layout?.borderRadius] || '12px');

  // 5. Update Root Font Size variable
  const fontSizeMap = {
    small: '13px',
    default: '14px',
    large: '15px',
  };
  root.style.setProperty('--font-size-root', fontSizeMap[settings.typography?.fontSize] || '14px');

  // 6. Update Font Family variable
  const fontFamMap = {
    default: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    jakarta: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    roboto: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Segoe UI Web (West European)", "Helvetica Neue", sans-serif',
  };
  root.style.setProperty('--font-family-base', fontFamMap[settings.typography?.fontFamily] || fontFamMap.default);

  // 7. Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem('theme_mode', settings.mode);
    if (settings.layout?.sidebarCollapsed !== undefined) {
      localStorage.setItem('erp_sidebar_collapsed', String(settings.layout.sidebarCollapsed));
      localStorage.setItem('owner_sidebar_collapsed', String(settings.layout.sidebarCollapsed));
    }
  } catch (err) {
    console.warn('Failed to persist appearance settings:', err);
  }
}
