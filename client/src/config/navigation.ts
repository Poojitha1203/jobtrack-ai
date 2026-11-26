import {
  ChartColumn,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Users,
  MessagesSquare,
  Settings,
  SquareKanban,
  Target,
  type LucideIcon,
} from 'lucide-react';

// Single source of truth for the app's pages.
// The sidebar, the top bar title, and the router are all generated from this list,
// so adding a page means adding one entry here.

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Phase in which the page is built (shown on "coming soon" placeholders). */
  phase: number;
  description: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, phase: 2, description: 'Your job search at a glance.' },
      { label: 'Analytics', path: '/analytics', icon: ChartColumn, phase: 9, description: 'Charts for applications, response rates, sources and in-demand skills.' },
    ],
  },
  {
    title: 'Job search',
    items: [
      { label: 'Applications', path: '/applications', icon: BriefcaseBusiness, phase: 4, description: 'Add, search, filter and sort every job you apply to.' },
      { label: 'Kanban board', path: '/board', icon: SquareKanban, phase: 5, description: 'Drag applications from Wishlist to Offer.' },
      { label: 'Companies', path: '/companies', icon: Building2, phase: 6, description: 'Keep company details, contacts and notes in one place.' },
      { label: 'Interviews', path: '/interviews', icon: MessagesSquare, phase: 6, description: 'Schedule rounds, store prep notes and record feedback.' },
      { label: 'Calendar', path: '/calendar', icon: CalendarDays, phase: 6, description: 'See interviews, follow-ups and deadlines by date.' },
      { label: 'Reminders', path: '/reminders', icon: Bell, phase: 6, description: 'Follow-ups, deadlines and interview reminders.' },
    ],
  },
  {
    title: 'Career tools',
    items: [
      { label: 'Resumes', path: '/resumes', icon: FileText, phase: 7, description: 'Upload PDF resumes and assign them to applications.' },
      { label: 'Job match', path: '/job-match', icon: Target, phase: 7, description: 'Compare your resume with a job description (rule-based score).' },
      { label: 'Skill gap', path: '/skill-gap', icon: ListChecks, phase: 7, description: 'Find missing skills and track your learning progress.' },
      { label: 'Interview prep', path: '/interview-prep', icon: GraduationCap, phase: 8, description: 'Practise questions by topic and track what you have covered.' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Subscription', path: '/subscription', icon: CreditCard, phase: 10, description: 'Compare Free and Pro plans (Razorpay test mode only).' },
      { label: 'Settings', path: '/settings', icon: Settings, phase: 3, description: 'Profile, weekly goal and account preferences.' },
    ],
  },
];

/** Shown in the sidebar only for admins. The API enforces access separately. */
export const ADMIN_SECTION: NavSection = {
  title: 'Admin',
  items: [
    { label: 'Admin overview', path: '/admin', icon: ShieldCheck, phase: 11, description: 'Platform-wide users, applications, subscriptions and system health.' },
    { label: 'Users', path: '/admin/users', icon: Users, phase: 11, description: 'Search users, change roles and grant or revoke Pro.' },
  ],
};

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

const ALL_ITEMS = [...NAV_ITEMS, ...ADMIN_SECTION.items].sort((a, b) => b.path.length - a.path.length);

/** Finds the nav item for a URL, including nested pages like /applications/123 (longest match wins). */
export const findNavItem = (pathname: string) =>
  ALL_ITEMS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
