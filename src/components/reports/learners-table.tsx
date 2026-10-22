"use client";

import * as React from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProgressRing } from "./progress-ring";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export interface LearnerReportRow {
  id: string;
  name: string;
  division: string;
  roleTitle: string;
  avatarBg: string;
  avatarInitials: string;
  avatarUrl?: string;
  status: "Not started" | "Overdue" | "In progress" | "Passed" | "Failed";
  score: number;
  progress: number; // 0 - 100
  assignedBy: {
    name: string;
    avatarUrl?: string;
    initials: string;
  };
}

export interface LearnersTableProps {
  contentTitle?: string;
  contentIndex?: number;
  totalContents?: number;
  onPrevContent?: () => void;
  onNextContent?: () => void;
  data: LearnerReportRow[];
  searchQuery?: string;
}

export function LearnersTable({
  contentTitle = "A Designer's Toolkit for Crafting Exceptional User Interfaces",
  contentIndex = 1,
  totalContents = 5,
  onPrevContent,
  onNextContent,
  data,
  searchQuery,
}: LearnersTableProps) {
  // Columns definition for the reusable DataTable
  const columns = React.useMemo<DataTableColumn<LearnerReportRow>[]>(
    () => [
      {
        id: "name",
        header: "Full name",
        sortable: true,
        accessorKey: "name",
        cell: (item) => (
          <div className="flex items-center gap-3">
            <Avatar size="sm" className={cn("size-8 text-[11px] font-bold text-white", item.avatarBg)}>
              {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.name} />}
              <AvatarFallback className={cn("text-[11px] font-bold", item.avatarBg)}>
                {item.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 hover:text-[#5b51ef] cursor-pointer">
                  {item.name}
                </span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  {item.division}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{item.roleTitle}</p>
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        accessorKey: "status",
        cell: (item) => {
          let dotColor = "bg-slate-300";
          let textColor = "text-slate-500";

          if (item.status === "Overdue") {
            dotColor = "bg-rose-500";
            textColor = "text-rose-500 font-medium";
          } else if (item.status === "In progress") {
            dotColor = "bg-amber-500";
            textColor = "text-amber-600 font-medium";
          } else if (item.status === "Passed") {
            dotColor = "bg-emerald-500";
            textColor = "text-emerald-600 font-medium";
          }

          return (
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", dotColor)} />
              <span className={cn("text-[12px]", textColor)}>{item.status}</span>
            </div>
          );
        },
      },
      {
        id: "score",
        header: "Score",
        sortable: true,
        accessorKey: "score",
        cell: (item) => (
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-100" />
            <span>{item.score} pts</span>
          </div>
        ),
      },
      {
        id: "progress",
        header: "Progress",
        sortable: true,
        accessorKey: "progress",
        cell: (item) => {
          const color =
            item.progress === 100
              ? "#00c5a3"
              : item.progress > 50
              ? "#00c5a3"
              : item.progress > 0
              ? "#06b6d4"
              : "#cbd5e1";

          return (
            <div className="flex items-center gap-2.5">
              <ProgressRing
                progress={item.progress}
                size={22}
                strokeWidth={3}
                color={color}
              />
              <span className="font-semibold text-slate-700 text-[12px]">
                {item.progress}%
              </span>
            </div>
          );
        },
      },
      {
        id: "assignedBy",
        header: "Assigned by",
        sortable: true,
        cell: (item) => (
          <div className="flex items-center gap-2">
            <Avatar size="sm" className="size-6 bg-slate-200">
              {item.assignedBy.avatarUrl && (
                <AvatarImage src={item.assignedBy.avatarUrl} alt={item.assignedBy.name} />
              )}
              <AvatarFallback className="text-[10px] font-bold text-slate-600 bg-slate-200">
                {item.assignedBy.initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-slate-800 text-[12px]">
              {item.assignedBy.name}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <Button
            variant="ghost"
            size="xs"
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
          >
            <Plus className="size-3.5" />
          </Button>
        ),
        align: "right",
        cell: () => null,
      },
    ],
    []
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-none">
      {/* Table Card Top Content Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-lg bg-[#00a8e8] text-white shadow-2xs">
            <BookOpen className="size-3.5" />
          </span>
          <span className="text-[14px] font-bold text-slate-900 truncate">
            {contentTitle}
          </span>
        </div>

        {/* Carousel Content Navigator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <Button
            variant="ghost"
            size="xs"
            onClick={onPrevContent}
            disabled={contentIndex <= 1}
            className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-30"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span>
            {contentIndex}/{totalContents} Content
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={onNextContent}
            disabled={contentIndex >= totalContents}
            className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-30"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Table via reusable DataTable */}
      <div className="p-0">
        <DataTable
          data={data}
          columns={columns}
          getRowId={(item) => item.id}
          selectable={true}
          searchKey="name"
          searchFilter={(item, query) => {
            const q = (searchQuery || query).toLowerCase();
            return (
              item.name.toLowerCase().includes(q) ||
              item.division.toLowerCase().includes(q) ||
              item.status.toLowerCase().includes(q)
            );
          }}
          pagination={true}
          pageSize={10}
          pageSizeOptions={[5, 10, 25, 50]}
          variant="flush"
        />
      </div>
    </div>
  );
}
