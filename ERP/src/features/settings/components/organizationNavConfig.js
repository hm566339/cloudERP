import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  ShieldCheck,
  Globe,
  Bell,
  SlidersHorizontal,
  Palette,
} from 'lucide-react';

/**
 * Navigation configuration for Organization Management module vertical sub-sidebar.
 * Exactly 9 dedicated submenu pages.
 * Explicitly excludes Subscription & Billing (which belongs in the primary Owner Dashboard sidebar).
 */
export const ORG_NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Workspace summary & quick stats',
  },
  {
    id: 'profile',
    label: 'Organization Profile',
    icon: Building2,
    description: 'Entity details, identity & contact',
  },
  {
    id: 'companies',
    label: 'Companies Management',
    icon: Briefcase,
    description: 'Registered operating companies',
  },
  {
    id: 'users',
    label: 'Users & Permissions',
    icon: Users,
    description: 'Members & cross-company access',
  },
  {
    id: 'security',
    label: 'Security & Authentication',
    icon: ShieldCheck,
    description: '2FA policy & session timeouts',
  },
  {
    id: 'login-portal',
    label: 'Organization Login Portal',
    icon: Globe,
    description: 'Dedicated sign-in vanity URL',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Organization alert preferences',
  },
  {
    id: 'localization',
    label: 'Localization & Formats',
    icon: SlidersHorizontal,
    description: 'Currency, timezone & fiscal dates',
  },
  {
    id: 'appearance',
    label: 'Appearance & Themes',
    icon: Palette,
    description: 'Theme studio, palette & typography',
  },
];

/**
 * Helper to resolve link path for a given submenu item.
 */
export function resolveOrgSubmenuPath(basePath, itemId) {
  const cleanBase = (basePath || '/owner/settings').replace(/\/+$/, '');
  if (itemId === 'overview') {
    return cleanBase;
  }
  return `${cleanBase}/${itemId}`;
}

