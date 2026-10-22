"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getNavigationItem } from "@/components/layout/navigation";

export function Navbar({ roles }: { roles: string[] }) {
  const pathname = usePathname();
  const current = getNavigationItem(pathname);
  const isOverview = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/85 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1 text-muted-foreground" />
        <Separator orientation="vertical" className="h-5" />
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap text-[13px]">
            <BreadcrumbItem>
              {isOverview ? (
                <BreadcrumbPage className="font-medium">Workspace</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href="/dashboard" />}>Workspace</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isOverview ? <BreadcrumbSeparator /> : null}
            {!isOverview ? (
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate font-medium">
                  {current?.label || "Detail"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <Badge variant="outline" className="hidden max-w-72 truncate border-border bg-card text-[11px] font-medium text-muted-foreground sm:inline-flex">
        {roles.join(" · ") || "Member"}
      </Badge>
    </header>
  );
}
