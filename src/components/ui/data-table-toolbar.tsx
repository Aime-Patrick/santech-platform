"use client";

import type * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DataTableToolbarProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  searchEnabled: boolean;
  searchQuery: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  searchSlot?: React.ReactNode;
  headerSlot?: React.ReactNode;
}

export function DataTableToolbar({
  title,
  description,
  searchEnabled,
  searchQuery,
  searchPlaceholder,
  onSearchChange,
  searchSlot,
  headerSlot,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {title ? <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2> : null}
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
        {searchEnabled ? (
          <div className="relative w-full sm:w-64">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="bg-background pl-8"
            />
          </div>
        ) : null}
        {searchSlot}
        {headerSlot}
      </div>
    </div>
  );
}
