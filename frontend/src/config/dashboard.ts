import {
  BarChart3,
  Bell,
  CreditCard,
  FileText,
  Grid,
  Key,
  Layers,
  Palette,
  ScrollText,
  Settings,
  Shield,
  Users,
  Wand2,
  Activity,
  PenTool,
  Search,
  Gauge,
  Image,
  Send,
  Mail,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const dashboardNavItems: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: Grid },
      { title: 'AI Usage', href: '/usage', icon: Activity },
      { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, disabled: true },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { title: 'Projects', href: '/projects', icon: Layers },
      { title: 'Landing Pages', href: '/landing-pages', icon: Wand2 },
      { title: 'Content Studio', href: '/content-studio', icon: PenTool },
    ],
  },
  {
    title: 'SEO',
    items: [
      { title: 'SEO Studio', href: '/seo-studio', icon: Search },
      { title: 'Performance', href: '/performance-studio', icon: Gauge },
      { title: 'Brand Studio', href: '/brand-studio', icon: Palette },
      { title: 'Image Studio', href: '/image-studio', icon: Image },
      { title: 'Social Studio', href: '/social-studio', icon: Send },
      { title: 'Email Studio', href: '/email-studio', icon: Mail },
    ],
  },
  {
    title: 'Organization',
    items: [
      { title: 'Members', href: '/organizations', icon: Users },
      { title: 'Activity Log', href: '/dashboard/activity', icon: ScrollText, disabled: true },
    ],
  },
  {
    title: 'Settings',
    items: [
      { title: 'General', href: '/settings/general', icon: Settings },
      { title: 'Security', href: '/settings/security', icon: Shield },
      { title: 'Notifications', href: '/settings/notifications', icon: Bell },
      { title: 'Appearance', href: '/settings/appearance', icon: Palette },
      { title: 'Billing', href: '/settings/billing', icon: CreditCard },
      { title: 'API Keys', href: '/settings/api-keys', icon: Key },
    ],
  },
];

export const settingsNavItems: NavItem[] = [
  { title: 'General', href: '/settings/general', icon: Settings },
  { title: 'Security', href: '/settings/security', icon: Shield },
  { title: 'Notifications', href: '/settings/notifications', icon: Bell },
  { title: 'Appearance', href: '/settings/appearance', icon: Palette },
  { title: 'Billing', href: '/settings/billing', icon: CreditCard },
  { title: 'API Keys', href: '/settings/api-keys', icon: Key },
];
