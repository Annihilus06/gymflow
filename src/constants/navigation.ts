import {
  LayoutDashboard,
  Dumbbell,
  Calendar,
  LineChart,
  Target,
  Utensils,
  BookOpen,
  Settings,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

/**
 * Mobile bottom navigation items (primary actions for mobile phone screen)
 */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Plan',
    href: '/workout',
    icon: Calendar,
  },
  {
    label: 'Workout',
    href: '/execute',
    icon: Dumbbell,
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: LineChart,
  },
  {
    label: 'Profile',
    href: '/settings',
    icon: Settings,
  },
];

/**
 * Desktop sidebar navigation items
 */
export const DESKTOP_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Routine',
    href: '/workout',
    icon: Dumbbell,
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    label: 'Exercise Library',
    href: '/exercises',
    icon: BookOpen,
  },
  {
    label: 'Progress & Stats',
    href: '/progress',
    icon: LineChart,
  },
  {
    label: 'Goals',
    href: '/goals',
    icon: Target,
  },
  {
    label: 'Nutrition',
    href: '/nutrition',
    icon: Utensils,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
