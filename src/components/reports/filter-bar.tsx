"use client";

import * as React from "react";
import {
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

export interface ActiveFilter {
  id: string;
  label: string;
  value: string;
}

export interface FilterBarProps {
  title?: string;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  peopleCount?: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (filterId: string) => void;
  onClearFilters?: () => void;
  onExport?: () => void;
}

export function FilterBar({
  title = "Learners",
  tabs = ["Overview", "Progress"],
  activeTab = "Progress",
  onTabChange,
  peopleCount = 100,
  searchQuery,
  onSearchChange,
  activeFilters = [
    { id: "content", label: "Learning content", value: "5 selected content" },
    { id: "division", label: "Division", value: "2 selected division" },
  ],
  onRemoveFilter,
  onClearFilters,
  onExport,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* 1. Page Title */}
      <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 sm:text-[30px]">
        {title}
      </h1>

      {/* 2. Tabs Row */}
      <div className="flex border-b border-gray-200/80">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange?.(tab)}
              className={cn(
                "relative pb-3 px-1 mr-7 text-[14px] font-semibold transition-colors",
                isActive
                  ? "text-slate-900 font-bold"
                  : "text-slate-400 hover:text-slate-700"
              )}
            >
              {tab}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-slate-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Action & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left: People Dropdown & Add Filter */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className="h-9 gap-2 rounded-xl border-gray-200/90 bg-white px-3 text-[13px] font-semibold text-slate-800 shadow-none hover:bg-slate-50"
                >
                  <Users className="size-4 text-slate-500" />
                  <span>Peoples ({peopleCount})</span>
                  <ChevronDown className="size-3.5 text-slate-400" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-48 shadow-md">
              <DropdownMenuItem>All Peoples ({peopleCount})</DropdownMenuItem>
              <DropdownMenuItem>Design Division (34)</DropdownMenuItem>
              <DropdownMenuItem>Human Resources (22)</DropdownMenuItem>
              <DropdownMenuItem>Engineering (44)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            className="h-9 gap-1.5 rounded-xl px-2.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
          >
            <Filter className="size-3.5" />
            <span>Add Filter</span>
          </Button>
        </div>

        {/* Right: Search, Export, More */}
        <div className="flex items-center gap-2">
          <div className="relative w-56 sm:w-64">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="h-9 rounded-xl border-gray-200/90 bg-white pl-9 text-[13px] shadow-none focus-visible:border-[#5b51ef]"
            />
          </div>

          <Button
            onClick={onExport}
            className="h-9 gap-1.5 rounded-xl bg-[#5b51ef] px-4 text-[13px] font-bold text-white shadow-none hover:bg-[#4d42e6]"
          >
            <span>Export</span>
          </Button>

          <Button
            variant="outline"
            className="h-9 w-9 p-0 rounded-xl border-gray-200/90 bg-white text-slate-600 shadow-none hover:bg-slate-50"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/* 4. Active Filter Tags */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {activeFilters.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e0e0fc] bg-[#f2f2fe] px-2.5 py-1 text-[12px] font-semibold text-[#5b51ef]"
            >
              <span>
                {f.label} : <strong className="font-bold">{f.value}</strong>
              </span>
              <button
                type="button"
                onClick={() => onRemoveFilter?.(f.id)}
                className="cursor-pointer text-[#5b51ef] hover:text-[#4338ca]"
                aria-label={`Remove filter ${f.label}`}
              >
                <X className="size-3" strokeWidth={2.5} />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={onClearFilters}
            className="cursor-pointer text-[12px] font-semibold text-[#5b51ef] hover:underline px-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
