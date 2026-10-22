import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
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
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  description,
  trend,
  badge,
  className,
}: StatCardProps) {
  const iconElement = React.isValidElement(icon)
    ? icon
    : icon
      ? React.createElement(icon as LucideIcon, { "aria-hidden": true })
      : null;

  return (
    <Card className={cn("gap-0 py-0 transition-colors hover:border-foreground/15", className)}>
      <CardHeader className="p-5 pb-2">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
        {iconElement ? (
          <CardAction className="text-muted-foreground/60">{iconElement}</CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3 p-5 pt-2">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-2xl font-semibold tracking-tight text-card-foreground">{value}</p>
          {description ? <CardDescription className="line-clamp-1 text-xs">{description}</CardDescription> : null}
        </div>
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
        {!badge && trend ? (
          <Badge variant={trend.positive ? "secondary" : "destructive"}>{trend.value}</Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}
