import {
  SlidersHorizontal,
  ShieldCheck,
  Bell,
  Boxes,
  ScrollText,
  Palette
} from 'lucide-react';

export const SETTINGS_MENU_ITEMS = [
  {
    id: 'general',
    title: 'General',
    description: 'Basic system settings',
    icon: SlidersHorizontal,
    route: '/settings/general',
    category: 'System',
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Authentication & access',
    icon: ShieldCheck,
    route: '/settings/security',
    category: 'Security',
  },
  {
    id: 'subscription_plans',
    title: 'Subscription Plans',
    description: 'Plans & module entitlements',
    icon: Boxes,
    route: '/settings/plans',
    category: 'System',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Email & system alerts',
    icon: Bell,
    route: '/settings/notifications',
    category: 'Preferences',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Third-party services',
    icon: Boxes,
    route: '/settings/integrations',
    category: 'System',
  },
  {
    id: 'audit_logs',
    title: 'Audit & Logs',
    description: 'System activity logs',
    icon: ScrollText,
    route: '/settings/audit-logs',
    category: 'Monitoring',
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'User interface & display',
    icon: Palette,
    route: '/settings/preferences',
    category: 'Preferences',
  },
  {
    id: 'appearance_themes',
    title: 'Appearance & Themes',
    description: 'Theme studio, color palettes & display',
    icon: Palette,
    route: '/settings/appearance',
    category: 'Preferences',
  },
];

export default SETTINGS_MENU_ITEMS;
