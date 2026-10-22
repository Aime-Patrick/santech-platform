import {
  Activity,
  Archive,
  Award,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileCode2,
  FileStack,
  Folder,
  GraduationCap,
  History,
  LayoutTemplate,
  MessageSquare,
  Share2,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Tile color for the small rounded icon chip shown in the panel. */
  color?: string;
  /** Optional content for the count badge (e.g., "3"). */
  badge?: string;
  /** Permission keys required to see this item (all sources OR'd by callers). */
  permissions?: string[];
};

export type NavigationGroup = {
  id: string;
  /** Omit for a borderless quick-nav group that never collapses. */
  label?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  items: NavigationItem[];
};

/** Items rendered as quick links at the top of the panel (no collapse). */
export const quickNavGroup: NavigationGroup = {
  id: "quick",
  items: [
    { href: "/dashboard", label: "Overview", icon: Clock, permissions: ["dashboard.view"] },
    { href: "/dashboard/courses", label: "Courses", icon: FileCode2, permissions: ["courses.view"] },
    { href: "/dashboard/cohorts", label: "Cohorts", icon: Folder, permissions: ["cohorts.manage", "attendance.mark"] },
    { href: "/dashboard/certificates", label: "Certificates", icon: LayoutTemplate, permissions: ["certificates.view", "certificates.issue"] },
  ],
};

/** Collapsible sections with counts, mirroring the reference "Favorites/Projects" pattern. */
export const navigationGroups: NavigationGroup[] = [
  {
    id: "learning",
    label: "Learning",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { href: "/dashboard/courses", label: "Courses", icon: BookOpen, color: "bg-sky-500", permissions: ["courses.view"], badge: "3" },
      { href: "/dashboard/enrollments", label: "Enrollments", icon: GraduationCap, color: "bg-teal-500", permissions: ["enrollments.apply", "enrollments.review"] },
      { href: "/dashboard/certificates", label: "Certificates", icon: Award, color: "bg-violet-500", permissions: ["certificates.view", "certificates.issue"] },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    collapsible: true,
    defaultExpanded: true,
    items: [
            { href: "/dashboard/applications", label: "Applications", icon: ClipboardList, color: "bg-indigo-500", permissions: ["applications.create"] },
      { href: "/dashboard/application-review", label: "Application management", icon: ClipboardList, color: "bg-indigo-600", permissions: ["applications.review"] },
      { href: "/dashboard/enrollment-review", label: "Enrollment review", icon: ClipboardList, color: "bg-teal-600", permissions: ["enrollments.review"] },
      { href: "/dashboard/cohorts", label: "Cohorts", icon: ClipboardCheck, color: "bg-amber-500", permissions: ["cohorts.manage", "attendance.mark"] },
      { href: "/dashboard/attendance", label: "Attendance", icon: Activity, color: "bg-rose-500", permissions: ["attendance.view", "attendance.mark"] },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { href: "/dashboard/users", label: "Users", icon: Users, color: "bg-emerald-500", permissions: ["users.view"] },
      { href: "/dashboard/catalog", label: "Courses", icon: BookOpen, color: "bg-orange-500", permissions: ["courses.view"] },
      { href: "/dashboard/course-feedback", label: "Course feedback", icon: MessageSquare, color: "bg-fuchsia-500", permissions: ["courses.update"] },
      { href: "/dashboard/roles", label: "Roles & permissions", icon: ShieldCheck, color: "bg-cyan-600", permissions: ["roles.view"] },
      { href: "/dashboard/audit-logs", label: "Audit log", icon: History, color: "bg-slate-600", permissions: ["audit_logs.view"] },
    ],
  },
];

/** Secondary utility links shown small below the main groups. */
export const utilityGroup: NavigationGroup = {
  id: "utility",
  label: "General",
  items: [
    { href: "/dashboard/courses", label: "Shared with me", icon: Share2, permissions: ["courses.view"] },
    { href: "/dashboard/audit-logs", label: "Archived items", icon: Archive, permissions: ["audit_logs.view"] },
    { href: "/dashboard/applications", label: "My applications", icon: FileStack, permissions: ["applications.create"] },
  ],
};

export function getNavigationItem(pathname: string) {
  const all = [quickNavGroup, ...navigationGroups, utilityGroup]
    .flatMap((group) => group.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length);
  return all[0];
}



