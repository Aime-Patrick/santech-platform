"use client";

import * as React from "react";
import { Bell, LogOut, PanelLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/features/auth";

type SidebarActions = {
  togglePanel: () => void;
  openSearch: () => void;
};

type DashboardHeaderContextValue = {
  hasSecondaryPanel: boolean;
  registerSidebarActions: (
    actions: SidebarActions | null,
    hasSecondaryPanel: boolean,
  ) => void;
  togglePanel: () => void;
  openSearch: () => void;
};

const DashboardHeaderContext = React.createContext<DashboardHeaderContextValue | null>(null);

export function DashboardHeaderProvider({ children }: { children: React.ReactNode }) {
  const actionsRef = React.useRef<SidebarActions | null>(null);
  const [hasSecondaryPanel, setHasSecondaryPanel] = React.useState(false);

  const registerSidebarActions = React.useCallback(
    (actions: SidebarActions | null, hasPanel: boolean) => {
      actionsRef.current = actions;
      setHasSecondaryPanel(hasPanel);
    },
    [],
  );
  const togglePanel = React.useCallback(() => actionsRef.current?.togglePanel(), []);
  const openSearch = React.useCallback(() => actionsRef.current?.openSearch(), []);

  const value = React.useMemo(
    () => ({ hasSecondaryPanel, registerSidebarActions, togglePanel, openSearch }),
    [hasSecondaryPanel, registerSidebarActions, togglePanel, openSearch],
  );

  return (
    <DashboardHeaderContext.Provider value={value}>
      {children}
    </DashboardHeaderContext.Provider>
  );
}

export function useDashboardHeaderActions() {
  const context = React.useContext(DashboardHeaderContext);
  if (!context) {
    throw new Error("DashboardHeaderProvider is missing from the dashboard shell.");
  }
  return context;
}

export function DashboardHeader({ userName, roles }: { userName: string; roles: string[] }) {
  const router = useRouter();
  const { hasSecondaryPanel, togglePanel, openSearch } = useDashboardHeaderActions();
  const logoutMutation = useLogout();
  const firstName = userName.trim().split(/\s+/)[0] || "there";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join("") || "ST";

  const onLogout = () =>
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.replace("/login");
        router.refresh();
      },
    });

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-background px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {hasSecondaryPanel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle navigation panel"
            title="Toggle navigation panel"
            onClick={togglePanel}
            className="size-9 shrink-0 text-muted-foreground"
          >
            <PanelLeft className="size-[18px]" strokeWidth={1.8} />
          </Button>
        ) : null}
        <p className="truncate text-base font-medium text-foreground sm:text-[17px]">
          Welcome back, <span className="font-semibold">{firstName}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open search"
          title="Search workspace"
          onClick={openSearch}
          className="size-9 text-muted-foreground"
        >
          <Search className="size-[18px]" strokeWidth={1.8} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                title="Notifications"
                className="size-9 text-muted-foreground"
              />
            }
          >
            <Bell className="size-[18px]" strokeWidth={1.8} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Notifications aren't available here yet.
            </p>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                aria-label="Open account menu"
                className="ml-1 size-9 rounded-full p-0"
              />
            }
          >
            <Avatar size="sm" className="size-8 border border-border">
              <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-2">
                <span className="block truncate text-sm font-medium text-foreground">
                  {userName}
                </span>
                <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                  {roles.join(" \u00b7 ") || "Member"}
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
      </div>
    </header>
  );
}
