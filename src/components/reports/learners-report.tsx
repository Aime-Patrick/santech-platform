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

export function LearnersReport() {
  const [activeTab, setActiveTab] = React.useState("Progress");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([
    { id: "content", label: "Learning content", value: "5 selected content" },
    { id: "division", label: "Division", value: "2 selected division" },
  ]);
  const [contentIndex, setContentIndex] = React.useState(1);

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
        peopleCount={100}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearFilters={handleClearFilters}
        onExport={() => alert("Exporting report...")}
      />

      {/* 2. KPI Summary Card */}
      <KpiSummary
        trainedPercent={50}
        overviewLabel="This week progress overview"
      />

      {/* 3. Learners Table Card */}
      <LearnersTable
        contentTitle="A Designer's Toolkit for Crafting Exceptional User Interfaces"
        contentIndex={contentIndex}
        totalContents={5}
        onPrevContent={() => setContentIndex((i) => Math.max(1, i - 1))}
        onNextContent={() => setContentIndex((i) => Math.min(5, i + 1))}
        data={initialLearnersData}
        searchQuery={searchQuery}
      />
    </div>
  );
}
