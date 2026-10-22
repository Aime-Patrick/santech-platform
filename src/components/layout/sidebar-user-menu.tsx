"use client";

import { useRouter } from "next/navigation";
import { ChevronUp, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function SidebarUserMenu({ userName, roles }: { userName: string; roles: string[] }) {
  const router = useRouter();
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join("");

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            tooltip={userName}
            className="h-12 data-open:bg-sidebar-accent"
          />
        }
      >
        <Avatar size="sm" className="size-7 rounded-md">
          <AvatarFallback className="rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
            {initials || "ST"}
          </AvatarFallback>
        </Avatar>
        <span className="grid min-w-0 flex-1 text-left leading-tight">
          <span className="truncate text-[13px] font-medium">{userName}</span>
          <span className="truncate text-[11px] text-sidebar-foreground/55">
            {roles[0] || "Member"}
          </span>
        </span>
        <ChevronUp className="ml-auto size-3.5 text-sidebar-foreground/45" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2">
            <span className="block truncate text-sm font-medium text-foreground">{userName}</span>
            <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
              {roles.join(" · ") || "Member"}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="px-2 py-2">
            <LogOut aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
