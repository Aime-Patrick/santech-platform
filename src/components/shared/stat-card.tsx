import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon | React.ReactNode;
  description?: string;
  trend?: { value: string; positive?: boolean };
  badge?: string;
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  description,
  trend,
  badge,
  href,
  className,
}: StatCardProps) {
  const iconElement = React.isValidElement(icon)
    ? icon
    : icon
      ? React.createElement(icon as LucideIcon, {
          "aria-hidden": true,
          className: "size-4",
        })
      : null;

  return (
    <Card className={cn("h-full gap-0 py-0 transition-colors hover:border-foreground/15", className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          {iconElement ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {iconElement}
            </div>
          ) : null}
          <p className="text-2xl font-bold tracking-tight tabular-nums text-card-foreground">
            {value}
          </p>
        </div>
        <CardTitle className="mt-2 truncate text-sm font-semibold text-card-foreground">
          {label}
        </CardTitle>
        {description || href ? (
          <div className="mt-0.5 flex min-w-0 items-center justify-between gap-2">
            {description ? (
              <CardDescription className="min-w-0 flex-1 truncate text-xs">
                {description}
              </CardDescription>
            ) : <span className="flex-1" />}
            {href ? (
              <Link
                href={href}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        ) : null}
        {badge || trend ? (
          <div className="mt-2 flex justify-end">
            {badge ? <Badge variant="secondary">{badge}</Badge> : null}
            {!badge && trend ? (
              <Badge variant={trend.positive ? "secondary" : "destructive"}>
                {trend.value}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
