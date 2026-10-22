import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

const variantStyles: Record<StatusVariant, { dot: string; badge: string }> = {
  success: { dot: "bg-emerald-500", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  warning: { dot: "bg-amber-500", badge: "border-amber-200 bg-amber-50 text-amber-700" },
  danger: { dot: "bg-destructive", badge: "border-destructive/20 bg-destructive/10 text-destructive" },
  info: { dot: "bg-sky-500", badge: "border-sky-200 bg-sky-50 text-sky-700" },
  neutral: { dot: "bg-muted-foreground", badge: "border-border bg-muted text-muted-foreground" },
};

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  showDot?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export function StatusBadge({
  label,
  variant = "neutral",
  showDot = true,
  icon: Icon,
  className,
}: StatusBadgeProps) {
  const style = variantStyles[variant];

  return (
    <Badge variant="outline" className={cn("h-6 gap-1.5 px-2.5 font-semibold", style.badge, className)}>
      {Icon ? <Icon data-icon="inline-start" aria-hidden="true" /> : null}
      {!Icon && showDot ? <span className={cn("size-1.5 rounded-full", style.dot)} /> : null}
      {label}
    </Badge>
  );
}

export function getStatusVariant(status: string): StatusVariant {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "PUBLISHED":
    case "APPROVED":
    case "COMPLETED":
    case "PRESENT":
    case "ISSUED":
      return "success";
    case "PENDING":
    case "DRAFT":
    case "INVITED":
    case "PLANNED":
    case "LATE":
      return "warning";
    case "REJECTED":
    case "SUSPENDED":
    case "ARCHIVED":
    case "REVOKED":
    case "ABSENT":
    case "WITHDRAWN":
      return "danger";
    case "IN_PROGRESS":
    case "REVIEW":
      return "info";
    default:
      return "neutral";
  }
}
