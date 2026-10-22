"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Search, BookOpen, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard, type CourseCardData } from "@/components/courses/course-card";
import { EmptyState } from "@/components/dashboard/empty-state";

interface CourseListClientProps {
  courses: CourseCardData[];
}

export function CourseListClient({ courses }: CourseListClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  const publishedCount = useMemo(
    () => courses.filter((c) => c.status === "PUBLISHED").length,
    [courses]
  );
  const draftCount = useMemo(
    () => courses.filter((c) => c.status === "DRAFT").length,
    [courses]
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Status filter
      if (statusFilter !== "ALL" && course.status !== statusFilter) {
        return false;
      }

      // Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchTitle = course.title.toLowerCase().includes(q);
      const matchSummary = course.summary?.toLowerCase().includes(q) ?? false;
      const matchLevel = course.level?.toLowerCase().includes(q) ?? false;
      const matchInstructor = course.instructors.some(
        ({ instructor }) =>
          instructor.firstName.toLowerCase().includes(q) ||
          instructor.lastName.toLowerCase().includes(q)
      );

      return matchTitle || matchSummary || matchLevel || matchInstructor;
    });
  }, [courses, search, statusFilter]);

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No courses yet"
        description="Courses will appear here once an instructor or administrator creates and publishes them."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: Search & Status Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant={statusFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <span>All Courses</span>
            <Badge
              variant={statusFilter === "ALL" ? "secondary" : "outline"}
              className="px-1.5 py-0 text-[10px]"
            >
              {courses.length}
            </Badge>
          </Button>

          <Button
            variant={statusFilter === "PUBLISHED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("PUBLISHED")}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <span>Published</span>
            <Badge
              variant={statusFilter === "PUBLISHED" ? "secondary" : "outline"}
              className="px-1.5 py-0 text-[10px]"
            >
              {publishedCount}
            </Badge>
          </Button>

          {draftCount > 0 && (
            <Button
              variant={statusFilter === "DRAFT" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("DRAFT")}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <span>Drafts</span>
              <Badge
                variant={statusFilter === "DRAFT" ? "secondary" : "outline"}
                className="px-1.5 py-0 text-[10px]"
              >
                {draftCount}
              </Badge>
            </Button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, level, instructor..."
            className="h-8 pl-8 pr-7 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Courses */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">No matching courses</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            No pathways matched your search &quot;{search}&quot;. Try another query or clear your filter.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {search && (
              <Button variant="outline" size="sm" onClick={() => setSearch("")} className="text-xs">
                Clear search
              </Button>
            )}
            {statusFilter !== "ALL" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter("ALL")}
                className="text-xs"
              >
                Show all courses
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
