"use client";

import * as React from "react";
import { FilterBar, type ActiveFilter } from "./filter-bar";
import { KpiSummary } from "./kpi-summary";
import { LearnersTable, type LearnerReportRow } from "./learners-table";

const initialLearnersData: LearnerReportRow[] = [
  {
    id: "learner-1",
    name: "Adit irwan",
    division: "Design",
    roleTitle: "Jr UI/UX Designer",
    avatarBg: "bg-[#0ea5e9]",
    avatarInitials: "AI",
    status: "Not started",
    score: 0,
    progress: 0,
    assignedBy: {
      name: "Rehan Baiq",
      initials: "RB",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face",
    },
  },
  {
    id: "learner-2",
    name: "Arif Brata",
    division: "Design",
    roleTitle: "Jr UI/UX Designer",
    avatarBg: "bg-[#f59e0b]",
    avatarInitials: "AB",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face",
    status: "Overdue",
    score: 8,
    progress: 100,
    assignedBy: {
      name: "Rehan Baiq",
      initials: "RB",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face",
    },
  },
  {
    id: "learner-3",
    name: "Bagus Yuli",
    division: "HR",
    roleTitle: "Ld Human Resources",
    avatarBg: "bg-[#10b981]",
    avatarInitials: "BY",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face",
    status: "In progress",
    score: 10,
    progress: 70,
    assignedBy: {
      name: "Pandji Manjiw",
      initials: "PM",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face",
    },
  },
  {
    id: "learner-4",
    name: "Bani Naon",
    division: "Design",
    roleTitle: "Jr UI/UX Designer",
    avatarBg: "bg-[#ec4899]",
    avatarInitials: "BN",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=96&h=96&fit=crop&crop=face",
    status: "In progress",
    score: 4,
    progress: 30,
    assignedBy: {
      name: "Pandji Manjiw",
      initials: "PM",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face",
    },
  },
  {
    id: "learner-5",
    name: "Brian Domani",
    division: "HR",
    roleTitle: "Staff Human Resources",
    avatarBg: "bg-[#ef4444]",
    avatarInitials: "BR",
    status: "Not started",
    score: 0,
    progress: 0,
    assignedBy: {
      name: "Pandji Manjiw",
      initials: "PM",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face",
    },
  },
  {
    id: "learner-6",
    name: "Depe Prada",
    division: "Design",
    roleTitle: "PM UI/UX Designer",
    avatarBg: "bg-[#6366f1]",
    avatarInitials: "DP",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=96&h=96&fit=crop&crop=face",
    status: "Not started",
    score: 0,
    progress: 0,
    assignedBy: {
      name: "Rehan Baiq",
      initials: "RB",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face",
    },
  },
  {
    id: "learner-7",
    name: "Fauzan Aziz",
    division: "Design",
    roleTitle: "Md UI/UX Designer",
    avatarBg: "bg-[#eab308]",
    avatarInitials: "FA",
    status: "In progress",
    score: 4,
    progress: 70,
    assignedBy: {
      name: "Pandji Manjiw",
      initials: "PM",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face",
    },
  },
];

function exportLearnersCsv(rows: LearnerReportRow[]) {
  const header = ["Learner", "Division", "Role", "Status", "Score", "Progress", "Assigned by"];
  const lines = rows.map((row) => [row.name, row.division, row.roleTitle, row.status, row.score, row.progress, row.assignedBy.name].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `learners-report-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
}

export function LearnersReport() {
  const [activeTab, setActiveTab] = React.useState("Progress");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([
    { id: "content", label: "Learning content", value: "5 selected content" },
    { id: "division", label: "Division", value: "2 selected division" },
  ]);
  const [contentIndex, setContentIndex] = React.useState(1);
  const visibleLearners = initialLearnersData.filter((row) => {
    const query = searchQuery.trim().toLowerCase();
    return !query || [row.name, row.division, row.roleTitle, row.status].join(" ").toLowerCase().includes(query);
  });
  const averageProgress = visibleLearners.length ? Math.round(visibleLearners.reduce((sum, row) => sum + row.progress, 0) / visibleLearners.length) : 0;
  const statusCounts = visibleLearners.reduce<Record<string, number>>((acc, row) => { acc[row.status] = (acc[row.status] ?? 0) + 1; return acc; }, {});

  const handleRemoveFilter = (filterId: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title, Tabs, Search & Filters */}
      <FilterBar
        title="Learners"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        peopleCount={visibleLearners.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearFilters={handleClearFilters}
        onExport={() => exportLearnersCsv(visibleLearners)}
      />

      {/* 2. KPI Summary Card */}
      <KpiSummary
        trainedPercent={averageProgress}
        overviewLabel={`${visibleLearners.length} learners · live overview`}
        metrics={[
          { value: statusCounts["In progress"] ?? 0, change: `${averageProgress}%`, label: "In progress", changeDirection: "up", changeColor: "text-emerald-500" },
          { value: statusCounts.Overdue ?? 0, change: "needs review", label: "Overdue", changeColor: "text-rose-500" },
          { value: statusCounts.Passed ?? 0, change: `${visibleLearners.length ? Math.round(((statusCounts.Passed ?? 0) / visibleLearners.length) * 100) : 0}%`, label: "Passed", changeColor: "text-emerald-500" },
          { value: statusCounts["Not started"] ?? 0, change: "queued", label: "Not started", changeColor: "text-slate-500" },
        ]}
      />

      {/* 3. Learners Table Card */}
      <LearnersTable
        contentTitle="A Designer's Toolkit for Crafting Exceptional User Interfaces"
        contentIndex={contentIndex}
        totalContents={5}
        onPrevContent={() => setContentIndex((i) => Math.max(1, i - 1))}
        onNextContent={() => setContentIndex((i) => Math.min(5, i + 1))}
        data={visibleLearners}
        searchQuery={searchQuery}
      />
    </div>
  );
}
