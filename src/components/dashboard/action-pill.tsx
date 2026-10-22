"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Layers,
  MessageSquare,
  Plus,
} from "lucide-react";
import { usePermissions } from "@/components/providers/permission-provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ActionPillItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  permission?: string;
};

// ---------------------------------------------------------------------------
// Data – all quick-action pills rendered in the dashboard greeting row
// ---------------------------------------------------------------------------
export const actionPillItems: ActionPillItem[] = [
  {
    label: "Course",
    href: "/dashboard/courses",
    icon: BookOpen,
    color: "bg-[#00a8e8]",
    permission: "courses.create",
  },
  {
    label: "Page",
    href: "/dashboard/courses",
    icon: FileText,
    color: "bg-[#5b51ef]",
    permission: "courses.update",
  },
  {
    label: "Assignment",
    href: "/dashboard/enrollments",
    icon: ClipboardList,
    color: "bg-[#f97316]",
    permission: "grades.manage",
  },
  {
    label: "Quiz",
    href: "/dashboard/courses",
    icon: MessageSquare,
    color: "bg-[#059669]",
    permission: "grades.manage",
  },
  {
    label: "Learning Path",
    href: "/dashboard/cohorts",
    icon: Layers,
    color: "bg-[#ec4899]",
    permission: "cohorts.manage",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ActionPill({ item }: { item: ActionPillItem }) {
  const Icon = item.icon;
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Link
        href={item.href}
        className="group inline-flex items-center gap-2 rounded-xl bg-transparent px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100"
      >
        <span
          className={`flex size-6 items-center justify-center rounded-lg ${item.color} text-white shadow-2xs`}
        >
          <Icon className="size-3.5" />
        </span>
        <span>{item.label}</span>
        <Plus className="size-3 text-slate-400 group-hover:text-slate-700" strokeWidth={2.5} />
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Convenience Row – renders pills matching user permissions
// ---------------------------------------------------------------------------
export function ActionPillRow() {
  const { hasPermission, permissions } = usePermissions();

  const visiblePills = React.useMemo(() => {
    // If no permissions loaded yet (e.g. initial mount), display based on permission check
    return actionPillItems.filter(
      (pill) => !pill.permission || (permissions.length > 0 && hasPermission(pill.permission))
    );
  }, [hasPermission, permissions]);

  if (visiblePills.length === 0) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-1.5 sm:gap-2">
      {visiblePills.map((pill, index) => (
        <React.Fragment key={pill.label}>
          <ActionPill item={pill} />
          {index < visiblePills.length - 1 && (
            <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
