"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileText,
  Folder,
  GraduationCap,
  Globe,
  History,
  Home,
  Layers,
  LogOut,
  MessageSquare,
  PieChart,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export type AppSidebarProps = {
  permissions: string[];
  userName: string;
  roles: string[];
};

export type SidebarSection = "reports" | "learning" | "content" | "users" | "analytics" | "search" | "settings" | null;
const websiteContentTypes = [
  "certificate", "company-value", "course-category", "course-skill", "course-tool",
  "driving-change-story", "driving-change-topic", "e-visitors-feature", "faq-item",
  "focus-area", "home-story-slide", "innovation-product", "innovation-service",
  "innovation-solution", "journey-stage", "opportunity", "partner-brand",
  "product-milestone", "recognition", "san-hub-book", "san-hub-book-category",
  "site-stat", "team-member", "tech-pulse-article", "technology-category",
  "testimonial", "trainee-award",
] as const;

const contentTypeLabel = (value: string) => value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");



export function getSectionFromPath(pathname: string): SidebarSection {
  if (pathname.startsWith("/dashboard/reports")) {
    return "reports";
  }
  if (
    pathname.startsWith("/dashboard/courses") ||
    pathname.startsWith("/dashboard/cohorts") ||
    pathname.startsWith("/dashboard/enrollments") ||
    pathname.startsWith("/dashboard/certificates")
  ) {
    return "learning";
  }
  if (
    pathname.startsWith("/dashboard/users") ||
    pathname.startsWith("/dashboard/applications")
  ) {
    return "users";
  }
  if (pathname.startsWith("/dashboard/website-content")) {
    return "content";
  }
  if (pathname.startsWith("/dashboard/attendance")) {
    return "analytics";
  }
  if (
    pathname.startsWith("/dashboard/roles") ||
    pathname.startsWith("/dashboard/audit-logs") ||
    pathname.startsWith("/dashboard/catalog")
  ) {
    return "settings";
  }
  return null;
}

export function AppSidebar({ permissions = [], userName, roles }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const routerReadyRef = React.useRef(false);
  React.useEffect(() => {
    routerReadyRef.current = true;
  }, []);

  // Permission evaluation helpers
  const permSet = React.useMemo(() => new Set(permissions), [permissions]);
  const can = React.useCallback((p: string) => permSet.has(p), [permSet]);
  const canAny = React.useCallback((ps: string[]) => ps.some((p) => permSet.has(p)), [permSet]);

  // Section visibility based on permissions
  const canAnalytics = canAny(["attendance.view", "grades.view"]);
  const canLearning = canAny(["courses.view", "enrollments.apply", "cohorts.manage"]);
  const canContent = canAny(["courses.view", "courses.create", "courses.update"]);
  const canUsers = canAny(["users.view", "users.manage", "applications.review"]);
  const canReports = canAny(["grades.view", "attendance.view", "courses.view", "enrollments.review"]);
  const canSettings = canAny(["roles.view", "roles.manage", "audit_logs.view", "courses.view"]);

  // Detect section from current path
  const currentPathSection = getSectionFromPath(pathname);
  const [activeSection, setActiveSection] = React.useState<SidebarSection>(currentPathSection);
  const [panelOpen, setPanelOpen] = React.useState<boolean>(currentPathSection !== null);

  // Search input state inside search panel
  const [searchQuery, setSearchQuery] = React.useState("");
  const [contentSearch, setContentSearch] = React.useState("");
  const filteredContentTypes = React.useMemo(() => websiteContentTypes.filter((type) => contentTypeLabel(type).toLowerCase().includes(contentSearch.toLowerCase())), [contentSearch]);

  // Collapsible states
  const [tracksOpen, setTracksOpen] = React.useState(true);
  const [rolesOpen, setRolesOpen] = React.useState(true);
  const [auditOpen, setAuditOpen] = React.useState(true);
  const [learningContentOpen, setLearningContentOpen] = React.useState(true);

  // Sync state when route changes
  const prevPathnameRef = React.useRef(pathname);
  React.useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      const detected = getSectionFromPath(pathname);
      if (detected !== null) {
        setActiveSection(detected);
        setPanelOpen(true);
      } else {
        // Home (/dashboard)
        setActiveSection(null);
        setPanelOpen(false);
      }
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "RF";

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (routerReadyRef.current) router.replace("/login");
  };

  const handleRailClick = (section: SidebarSection, defaultRoute?: string) => {
    if (section === null) {
      // Home
      setActiveSection(null);
      setPanelOpen(false);
      if (pathname !== "/dashboard") {
        if (routerReadyRef.current) router.push("/dashboard");
      }
      return;
    }

    if (activeSection === section) {
      // Toggle panel if clicking already selected section
      setPanelOpen(!panelOpen);
    } else {
      setActiveSection(section);
      setPanelOpen(true);
      if (defaultRoute && !pathname.startsWith(defaultRoute)) {
        if (routerReadyRef.current) router.push(defaultRoute);
      }
    }
  };

  return (
    <motion.aside
      animate={{ width: panelOpen ? 320 : 68 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="relative flex shrink-0 select-none"
    >
      {/* ------------------------------------------------------------- */}
      {/* FLOATING COLLAPSE / EXPAND BUTTON (Straddles outer border)    */}
      {/* ------------------------------------------------------------- */}
      <motion.button
        type="button"
        initial={false}
        animate={{ left: panelOpen ? 320 : 68 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setPanelOpen(!panelOpen)}
        aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
        title={panelOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute top-4 z-40 flex size-6 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-200/90 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
      >
        {panelOpen ? (
          <ArrowLeftToLine className="size-3" strokeWidth={2.2} />
        ) : (
          <ArrowRightToLine className="size-3" strokeWidth={2.2} />
        )}
      </motion.button>

      {/* ------------------------------------------------------------- */}
      {/* PANEL 1: PRIMARY ICON RAIL (68px)                             */}
      {/* ------------------------------------------------------------- */}
      <div className="sticky top-0 z-30 flex h-svh w-[68px] shrink-0 flex-col items-center justify-between border-r border-[#eef0f4] bg-white py-4 shadow-[1px_0_0_0_#f1f3f6]">
        {/* Top: Logo */}
        <div className="flex flex-col items-center">
          <Link
            href="/dashboard"
            onClick={() => {
              setActiveSection(null);
              setPanelOpen(false);
            }}
            aria-label="SAN TECH Platform"
            className="group flex size-11 items-center justify-center rounded-lg transition-transform active:scale-95"
          >
            <Image src="/santech-mark.png" alt="SAN TECH" width={38} height={35} className="size-9 object-contain" priority />
          </Link>

          {/* Navigation Icons Stack */}
          <nav aria-label="Main Navigation" className="mt-6 flex flex-col items-center gap-2">
            {/* 1. Home (No second panel) */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href="/dashboard"
                    onClick={() => {
                      setActiveSection(null);
                      setPanelOpen(false);
                    }}
                    aria-label="Home"
                    data-active={pathname === "/dashboard" && !panelOpen ? "" : undefined}
                    className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800 data-active:bg-[#f0f2f5] data-active:text-slate-900"
                  />
                }
              >
                <Home className="size-5" strokeWidth={pathname === "/dashboard" ? 2.3 : 1.8} />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Home
              </TooltipContent>
            </Tooltip>

            {/* 2. Search (Has Search Panel) */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Search"
                    onClick={() => handleRailClick("search")}
                    data-active={activeSection === "search" && panelOpen ? "" : undefined}
                    className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800 data-active:bg-[#f0f2f5] data-active:text-slate-900"
                  />
                }
              >
                <Search className="size-5" strokeWidth={1.8} />
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Quick Search
              </TooltipContent>
            </Tooltip>

            {/* 3. Analytics / Attendance (Has Analytics Panel) */}
            {canAnalytics && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Analytics & Metrics"
                      onClick={() => handleRailClick("analytics", "/dashboard/attendance")}
                      data-active={activeSection === "analytics" && panelOpen ? "" : undefined}
                      className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800 data-active:bg-[#f0f2f5] data-active:text-slate-900"
                    />
                  }
                >
                  <TrendingUp className="size-5" strokeWidth={1.8} />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  Analytics & Reports
                </TooltipContent>
              </Tooltip>
            )}

            {/* 4. Learning Hub (Has Learning Panel) */}
            {canLearning && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => handleRailClick("learning", "/dashboard/courses")}
                      aria-label="Learning Hub"
                      data-active={activeSection === "learning" && panelOpen ? "" : undefined}
                      className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800 data-active:bg-[#f0f2f5] data-active:text-slate-900"
                    />
                  }
                >
                  <BookOpen className="size-5" strokeWidth={1.8} />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  Learning Hub
                </TooltipContent>
              </Tooltip>

            )}
            {/* Content Manager (dedicated content section) */}
            {canContent && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => handleRailClick("content", "/dashboard/website-content")}
                      aria-label="Content Manager"
                      data-active={activeSection === "content" && panelOpen ? "" : undefined}
                      className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800 data-active:bg-[#f0f2f5] data-active:text-slate-900"
                    />
                  }
                >
                  <Globe className="size-5" strokeWidth={1.8} />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>Content Manager</TooltipContent>
              </Tooltip>
            )}

            {/* 5. Users & Access (Has People & Access Panel) */}
            {canUsers && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => handleRailClick("users", "/dashboard/users")}
                      aria-label="People & Access"
                      data-active={activeSection === "users" && panelOpen ? "" : undefined}
                      className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800 data-active:bg-[#f0f2f5] data-active:text-slate-900"
                    />
                  }
                >
                  <Users className="size-5" strokeWidth={1.8} />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  People & Access
                </TooltipContent>
              </Tooltip>
            )}

            {/* 6. Reports (Has Reports Panel) */}
            {canReports && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => handleRailClick("reports", "/dashboard/reports")}
                      aria-label="Reports"
                      data-active={activeSection === "reports" && panelOpen ? "" : undefined}
                      className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800 data-active:bg-[#f0f2f5] data-active:text-slate-900"
                    />
                  }
                >
                  <PieChart className="size-5" strokeWidth={1.8} />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  Reports
                </TooltipContent>
              </Tooltip>
            )}

            {/* 7. Settings & Administration (Has Settings Panel) */}
            {canSettings && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => handleRailClick("settings", "/dashboard/roles")}
                      aria-label="System & Settings"
                      data-active={activeSection === "settings" && panelOpen ? "" : undefined}
                      className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-800 data-active:bg-[#f0f2f5] data-active:text-slate-900"
                    />
                  }
                >
                  <Settings className="size-5" strokeWidth={1.8} />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  System & Settings
                </TooltipContent>
              </Tooltip>
            )}
          </nav>
        </div>

        {/* Bottom Rail Actions */}
        <div className="flex flex-col items-center gap-3">
          {/* User Profile Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="User profile"
                  className="mt-1 flex cursor-pointer items-center justify-center rounded-full transition-transform hover:ring-2 hover:ring-[#0a1f44]/30 active:scale-95"
                />
              }
            >
              <Avatar size="sm" className="size-9 bg-[#0a1f44] text-[12px] font-bold text-white shadow-xs">
                <AvatarFallback className="bg-transparent text-[12px] font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56 p-1.5 shadow-lg">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-2">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {userName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
                    {roles.join(" Â· ") || "Member"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer px-2 py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600">
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PANEL 2: DEDICATED CONTENT PER ICON (None share same content) */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {panelOpen && activeSection !== null && (
          <motion.div
            key={activeSection}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 252, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="sticky top-0 z-20 flex h-svh shrink-0 flex-col justify-between overflow-hidden border-r border-[#eef0f4] bg-[#fbfcfd] shadow-[1px_0_0_0_#f4f5f7]"
          >
            <div className="flex h-full w-[252px] flex-col justify-between">
              {/* SECTION 0: REPORTS PANEL (Exact Match to Reference Screenshot) */}
              {activeSection === "reports" && (
                <>
                  <div className="flex h-16 shrink-0 items-center px-5">
                    <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
                      Reports
                    </h2>
                  </div>

                  <div className="flex flex-1 flex-col overflow-y-auto px-3.5 pb-4">
                    <nav aria-label="Reports Navigation" className="space-y-1">
                      <Link
                        href="/dashboard/reports"
                        data-active={pathname === "/dashboard/reports" ? "" : undefined}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                      >
                        <UserCheck className="size-4 text-slate-500" strokeWidth={1.8} />
                        <span>Learners</span>
                      </Link>
                      <Link
                        href="/dashboard/reports"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900"
                      >
                        <Trophy className="size-4 text-slate-500" strokeWidth={1.8} />
                        <span>Leaderboards</span>
                      </Link>
                      <Link
                        href="/dashboard/users"
                        data-active={pathname === "/dashboard/users" ? "" : undefined}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                      >
                        <Users className="size-4 text-slate-500" strokeWidth={1.8} />
                        <span>Users</span>
                      </Link>
                    </nav>

                    {/* Collapsible: Learning content */}
                    <Collapsible open={learningContentOpen} onOpenChange={setLearningContentOpen} className="mt-5">
                      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-[13px] font-semibold text-slate-900 transition-colors hover:text-slate-700">
                        <span>Learning content</span>
                        <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-200 ${learningContentOpen ? "" : "-rotate-90"}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-1 space-y-1">
                          <Link href="/dashboard/courses" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70">
                            <span className="flex size-5 items-center justify-center rounded-md bg-[#00a8e8] text-white">
                              <BookOpen className="size-3" />
                            </span>
                            <span>Course</span>
                          </Link>
                          <Link href="/dashboard/courses" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70">
                            <span className="flex size-5 items-center justify-center rounded-md bg-[#f97316] text-white">
                              <FileText className="size-3" />
                            </span>
                            <span>Page</span>
                          </Link>
                          <Link href="/dashboard/enrollments" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70">
                            <span className="flex size-5 items-center justify-center rounded-md bg-[#5b51ef] text-white">
                              <ClipboardList className="size-3" />
                            </span>
                            <span>Assignment</span>
                          </Link>
                          <Link href="/dashboard/courses" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70">
                            <span className="flex size-5 items-center justify-center rounded-md bg-[#eab308] text-white">
                              <MessageSquare className="size-3" />
                            </span>
                            <span>Quiz</span>
                          </Link>
                          <Link href="/dashboard/cohorts" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70">
                            <span className="flex size-5 items-center justify-center rounded-md bg-[#ec4899] text-white">
                              <Layers className="size-3" />
                            </span>
                            <span>Learning Path</span>
                          </Link>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* Promo Card matching screenshot */}
                  <div className="p-3">
                    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-none">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-[#e0e0fc] text-[#5b51ef]">
                        <Sparkles className="size-4" />
                      </div>
                      <h3 className="mt-2.5 text-[14px] font-bold tracking-tight text-slate-900">
                        Get SAN TECH AI
                      </h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        Use AI in every action on the webapp.
                      </p>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#5b51ef] hover:underline"
                      >
                        <span>Try it now</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* SECTION 1: LEARNING HUB PANEL */}
              {activeSection === "learning" && (
                <>
                  <div className="flex h-16 shrink-0 items-center px-5">
                    <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
                      Learning Hub
                    </h2>
                  </div>

                  <div className="flex flex-1 flex-col overflow-y-auto px-3.5 pb-4">
                    <nav aria-label="Learning Quick Links" className="space-y-1">
                      {can("courses.view") && (
                        <Link
                          href="/dashboard/courses"
                          data-active={pathname === "/dashboard/courses" ? "" : undefined}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                        >
                          <BookOpen className="size-4 text-slate-500" strokeWidth={1.8} />
                          <span>Course Catalog</span>
                        </Link>
                      )}
                      {(can("cohorts.manage") || can("courses.view")) && (
                        <Link
                          href="/dashboard/cohorts"
                          data-active={pathname.startsWith("/dashboard/cohorts") ? "" : undefined}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                        >
                          <Folder className="size-4 text-slate-500" strokeWidth={1.8} />
                          <span>Cohorts & Batches</span>
                        </Link>
                      )}
                      {can("enrollments.apply") && (
                        <Link
                          href="/dashboard/enrollments"
                          data-active={pathname === "/dashboard/enrollments" ? "" : undefined}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                        >
                          <GraduationCap className="size-4 text-slate-500" strokeWidth={1.8} />
                          <span>My Enrollments</span>
                        </Link>
                      )}
                      {can("certificates.view") && (
                        <Link
                          href="/dashboard/certificates"
                          data-active={pathname === "/dashboard/certificates" ? "" : undefined}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                        >
                          <Award className="size-4 text-slate-500" strokeWidth={1.8} />
                          <span>Certificates</span>
                        </Link>
                      )}
                    </nav>

                    <Collapsible open={tracksOpen} onOpenChange={setTracksOpen} className="mt-5">
                      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-[13px] font-semibold text-slate-900 transition-colors hover:text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>Programs & Tracks</span>
                          <Badge variant="outline" className="h-4 border-transparent bg-slate-200/60 px-1.5 text-[11px] font-medium text-slate-600 tabular-nums">
                            4
                          </Badge>
                        </div>
                        <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-200 ${tracksOpen ? "" : "-rotate-90"}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-1 space-y-1">
                          <Link href="/dashboard/courses" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70">
                            <span className="flex size-5 items-center justify-center rounded-md bg-[#0ea5e9] text-white">
                              <BookOpen className="size-3" />
                            </span>
                            <span className="truncate">Full-Stack Development</span>
                          </Link>
                          <Link href="/dashboard/courses" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70">
                            <span className="flex size-5 items-center justify-center rounded-md bg-[#059669] text-white">
                              <Folder className="size-3" />
                            </span>
                            <span className="truncate">Cloud & DevOps</span>
                          </Link>
                          <Link href="/dashboard/courses" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70">
                            <span className="flex size-5 items-center justify-center rounded-md bg-[#7c3aed] text-white">
                              <Sparkles className="size-3" />
                            </span>
                            <span className="truncate">Data & AI Engineering</span>
                          </Link>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  <div className="p-3">
                    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-none">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                        <GraduationCap className="size-4 text-[#5b51ef]" />
                      </div>
                      <h3 className="mt-2.5 text-[14px] font-bold tracking-tight text-slate-900">
                        SAN TECH Academy
                      </h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        Curriculum management, cohort sessions, and verified credentials.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* SECTION: CONTENT MANAGER */}
              {activeSection === "content" && (
                <>
                  <div className="flex h-16 shrink-0 items-center px-5"><h2 className="text-[17px] font-bold tracking-tight text-slate-900">Content Manager</h2></div>
                  <div className="flex flex-1 flex-col overflow-y-auto px-3.5 pb-4">
                    <div className="relative mb-4 px-1"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><Input value={contentSearch} onChange={(event) => setContentSearch(event.target.value)} placeholder="Search" className="h-9 rounded-md border-slate-200 bg-white pl-8 text-sm" /></div>
                    <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Collection types <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">{websiteContentTypes.length}</span></div>
                    <nav aria-label="Website content collections" className="space-y-0.5">
                      {filteredContentTypes.map((type) => (
                        <Link key={type} href={`/dashboard/website-content?type=${type}`} data-active={new URLSearchParams(searchParams.toString()).get("type") === type ? "" : undefined} className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#eef0ff] data-active:font-semibold data-active:text-[#4038c9]"><span className="text-[10px]">•</span><span>{contentTypeLabel(type)}</span></Link>
                      ))}
                    </nav>
                  </div>
                </>
              )}
              {/* SECTION 2: PEOPLE & ACCESS PANEL */}
              {activeSection === "users" && (
                <>
                  <div className="flex h-16 shrink-0 items-center px-5"><h2 className="text-[17px] font-bold tracking-tight text-slate-900">People & Access</h2></div>
                  <div className="flex flex-1 flex-col overflow-y-auto px-3.5 pb-4">
                    <nav aria-label="Users Quick Links" className="space-y-1">
                      <Link href="/dashboard/users" data-active={pathname === "/dashboard/users" ? "" : undefined} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"><Users className="size-4 text-slate-500" strokeWidth={1.8} /><span>Users</span></Link>
                      <Link href="/dashboard/applications" data-active={pathname.startsWith("/dashboard/applications") ? "" : undefined} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"><UserPlus className="size-4 text-slate-500" strokeWidth={1.8} /><span>Applications</span></Link>
                    </nav>
                  </div>
                </>
              )}
              {/* SECTION 3: ANALYTICS & REPORTS PANEL */}
              {activeSection === "analytics" && (
                <>
                  <div className="flex h-16 shrink-0 items-center px-5">
                    <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
                      Analytics & Reports
                    </h2>
                  </div>

                  <div className="flex flex-1 flex-col overflow-y-auto px-3.5 pb-4">
                    <nav aria-label="Analytics Quick Links" className="space-y-1">
                      <Link
                        href="/dashboard/attendance"
                        data-active={pathname === "/dashboard/attendance" ? "" : undefined}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                      >
                        <Calendar className="size-4 text-slate-500" strokeWidth={1.8} />
                        <span>Attendance Logs</span>
                      </Link>
                      <Link
                        href="/dashboard/enrollments"
                        data-active={pathname === "/dashboard/enrollments" ? "" : undefined}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                      >
                        <TrendingUp className="size-4 text-slate-500" strokeWidth={1.8} />
                        <span>Completion Rates</span>
                      </Link>
                      <Link
                        href="/dashboard/courses"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900"
                      >
                        <PieChart className="size-4 text-slate-500" strokeWidth={1.8} />
                        <span>Assessment Scores</span>
                      </Link>
                    </nav>

                    <div className="mt-5 space-y-2 px-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Live Highlights
                      </p>
                      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-none">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Average Attendance</span>
                          <span className="font-bold text-emerald-600">92.4%</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-[92%] rounded-full bg-emerald-500" />
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-none">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Quiz Pass Rate</span>
                          <span className="font-bold text-[#5b51ef]">84.0%</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-[84%] rounded-full bg-[#5b51ef]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-none">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                        <TrendingUp className="size-4 text-[#00a8e8]" />
                      </div>
                      <h3 className="mt-2.5 text-[14px] font-bold tracking-tight text-slate-900">
                        Export Metrics
                      </h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        Download weekly attendance and learning velocity CSV summaries.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* SECTION 4: QUICK SEARCH PANEL */}
              {activeSection === "search" && (
                <>
                  <div className="flex h-16 shrink-0 items-center px-5">
                    <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
                      Quick Search
                    </h2>
                  </div>

                  <div className="flex flex-1 flex-col overflow-y-auto px-3.5 pb-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search workspace..."
                        className="h-8 rounded-lg border-gray-200 pl-8 text-xs"
                      />
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Quick Jump
                      </p>
                      <Link
                        href="/dashboard/courses"
                        onClick={() => setPanelOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70"
                      >
                        <BookOpen className="size-3.5 text-slate-400" />
                        <span>Courses Catalog</span>
                      </Link>
                      <Link
                        href="/dashboard/cohorts"
                        onClick={() => setPanelOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70"
                      >
                        <Folder className="size-3.5 text-slate-400" />
                        <span>Cohort Management</span>
                      </Link>
                      <Link
                        href="/dashboard/users"
                        onClick={() => setPanelOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70"
                      >
                        <Users className="size-3.5 text-slate-400" />
                        <span>User Accounts</span>
                      </Link>
                      <Link
                        href="/dashboard/attendance"
                        onClick={() => setPanelOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100/70"
                      >
                        <Calendar className="size-3.5 text-slate-400" />
                        <span>Attendance Tracker</span>
                      </Link>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="rounded-xl border border-gray-200/60 bg-slate-50/60 p-3 text-[11px] text-slate-500">
                      Press <kbd className="rounded border bg-white px-1 font-mono text-[10px]">Ctrl</kbd> + <kbd className="rounded border bg-white px-1 font-mono text-[10px]">K</kbd> to search anytime.
                    </div>
                  </div>
                </>
              )}

              {/* SECTION 5: SYSTEM & SETTINGS PANEL */}
              {activeSection === "settings" && (
                <>
                  <div className="flex h-16 shrink-0 items-center px-5">
                    <h2 className="text-[17px] font-bold tracking-tight text-slate-900">
                      System & Settings
                    </h2>
                  </div>

                  <div className="flex flex-1 flex-col overflow-y-auto px-3.5 pb-4">
                    <nav aria-label="Settings Quick Links" className="space-y-1">
                      <Link
                        href="/dashboard/roles"
                        data-active={pathname === "/dashboard/roles" ? "" : undefined}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                      >
                        <Shield className="size-4 text-slate-500" strokeWidth={1.8} />
                        <span>Roles & RBAC</span>
                      </Link>
                      <Link
                        href="/dashboard/catalog"
                        data-active={pathname === "/dashboard/catalog" ? "" : undefined}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                      >
                        <BookOpen className="size-4 text-slate-500" strokeWidth={1.8} />
                        <span>Content catalog</span>
                      </Link>
                      <Link
                        href="/dashboard/catalog/organization"
                        data-active={pathname === "/dashboard/catalog/organization" ? "" : undefined}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                      >
                        <Layers className="size-4 text-slate-500" strokeWidth={1.8} />
                        <span>Catalog organization</span>
                      </Link>
                      <Link
                        href="/dashboard/audit-logs"
                        data-active={pathname === "/dashboard/audit-logs" ? "" : undefined}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100/70 hover:text-slate-900 data-active:bg-[#f0f2f5] data-active:font-semibold data-active:text-slate-900"
                      >
                        <History className="size-4 text-slate-500" strokeWidth={1.8} />
                        <span>Audit Logs</span>
                      </Link>

                    </nav>

                    <Collapsible open={auditOpen} onOpenChange={setAuditOpen} className="mt-5">
                      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-[13px] font-semibold text-slate-900 transition-colors hover:text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>Security Policies</span>
                          <Badge variant="outline" className="h-4 border-transparent bg-slate-200/60 px-1.5 text-[11px] font-medium text-slate-600 tabular-nums">
                            Active
                          </Badge>
                        </div>
                        <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-200 ${auditOpen ? "" : "-rotate-90"}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-1 space-y-1 text-xs text-slate-600">
                          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                            <span className="font-semibold text-slate-800">Session Timeout:</span> 24h
                          </div>
                          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                            <span className="font-semibold text-slate-800">MFA Status:</span> Optional
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  <div className="p-3">
                    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 shadow-none">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                        <ShieldAlert className="size-4 text-amber-500" />
                      </div>
                      <h3 className="mt-2.5 text-[14px] font-bold tracking-tight text-slate-900">
                        Admin Workspace
                      </h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        SAN TECH operations and enterprise security configuration.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}























