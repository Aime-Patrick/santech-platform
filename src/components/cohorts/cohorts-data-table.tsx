"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Users } from "lucide-react";
import { CohortCourseCell } from "@/components/cohorts/cohort-course-cell";
import { CohortMetricCell } from "@/components/cohorts/cohort-metric-cell";
import { CohortScheduleCell } from "@/components/cohorts/cohort-schedule-cell";
import { CohortTableHeading } from "@/components/cohorts/cohort-table-heading";
import { StatusBadge, getStatusVariant } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export interface CohortTableRecord {
  id: string;
  name: string;
  status: string;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  course: { title: string };
  _count: { members: number; attendance: number };
}

export function CohortsDataTable({ cohorts }: { cohorts: CohortTableRecord[] }) {
  const router = useRouter();
  const columns = React.useMemo<DataTableColumn<CohortTableRecord>[]>(
    () => [
      {
        id: "name",
        header: "Cohort and course",
        accessorKey: "name",
        sortable: true,
        cell: (cohort) => (
          <CohortCourseCell cohortName={cohort.name} courseTitle={cohort.course.title} />
        ),
      },
      {
        id: "status",
        header: "Session",
        accessorKey: "status",
        sortable: true,
        cell: (cohort) => (
          <StatusBadge label={cohort.status} variant={getStatusVariant(cohort.status)} />
        ),
      },
      {
        id: "schedule",
        header: "Term window",
        cell: (cohort) => (
          <CohortScheduleCell startsAt={cohort.startsAt} endsAt={cohort.endsAt} />
        ),
      },
      {
        id: "learners",
        header: "Learners",
        cell: (cohort) => (
          <CohortMetricCell
            icon={Users}
            value={cohort._count.members}
            label="Assigned"
            tone="orange"
          />
        ),
      },
      {
        id: "attendance",
        header: "Attendance",
        cell: (cohort) => (
          <CohortMetricCell
            icon={ClipboardCheck}
            value={cohort._count.attendance}
            label="Records"
            tone="indigo"
          />
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      data={cohorts}
      columns={columns}
      title={<CohortTableHeading count={cohorts.length} />}
      description="Courses, teaching windows, and cohort activity in one operational view."
      getRowId={(cohort) => cohort.id}
      searchKey="name"
      searchPlaceholder="Find a cohort or course"
      searchFilter={(cohort, query) =>
        cohort.name.toLowerCase().includes(query) ||
        cohort.course.title.toLowerCase().includes(query) ||
        cohort.status.toLowerCase().includes(query)
      }
      initialSortKey="name"
      onRowClick={(cohort) => router.push(`/dashboard/cohorts/${cohort.id}`)}
      pagination={cohorts.length > 10}
      pageSize={10}
      variant="card"
      tableClassName="[&_tbody_tr]:h-[88px]"
      emptyMessage="No assigned cohorts found."
    />
  );
}
