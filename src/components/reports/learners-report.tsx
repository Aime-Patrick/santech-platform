"use client";

import * as React from "react";
import { Download, GraduationCap, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useLearnerProgress, type EnrollmentReportStatus, type LearnerProgressRow } from "@/features/reports";

const statusOptions: Array<{ value: EnrollmentReportStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All enrollment statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

function statusStyle(status: EnrollmentReportStatus) {
  switch (status) {
    case "PENDING": return "bg-amber-50 text-amber-800";
    case "APPROVED": return "bg-blue-50 text-blue-800";
    case "ACTIVE": return "bg-emerald-50 text-emerald-800";
    case "COMPLETED": return "bg-violet-50 text-violet-800";
    case "REJECTED": return "bg-rose-50 text-rose-800";
    case "WITHDRAWN": return "bg-slate-100 text-slate-700";
  }
}

function humanizeStatus(status: EnrollmentReportStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function downloadCsv(rows: LearnerProgressRow[]) {
  const header = ["Learner", "Email", "Course", "Cohort", "Enrollment status", "Lessons completed", "Total lessons", "Progress percent", "Average score", "Applied at"];
  const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const lines = rows.map((row) => [
    row.learnerName,
    row.email,
    row.courseTitle,
    row.cohortName,
    humanizeStatus(row.status),
    row.completedLessons,
    row.totalLessons,
    row.progress,
    row.averageScore ?? "",
    row.appliedAt,
  ].map(csvCell).join(","));
  const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `learner-progress-page-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);
  return debounced;
}

export function LearnersReport() {
  const [searchInput, setSearchInput] = React.useState("");
  const [status, setStatus] = React.useState<EnrollmentReportStatus | "ALL">("ALL");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const search = useDebouncedValue(searchInput.trim());
  const query = useLearnerProgress({ page, pageSize, search, status });
  const report = query.data;

  React.useEffect(() => setPage(1), [search, status]);

  const columns = React.useMemo<DataTableColumn<LearnerProgressRow>[]>(() => [
    {
      id: "learnerName",
      header: "Learner",
      accessorKey: "learnerName",
      sortable: true,
      cell: (row) => <div className="min-w-44"><p className="font-semibold text-slate-900">{row.learnerName}</p><p className="text-xs text-muted-foreground">{row.email}</p></div>,
    },
    { id: "courseTitle", header: "Course", accessorKey: "courseTitle", sortable: true, cell: (row) => <span className="block max-w-64 truncate" title={row.courseTitle}>{row.courseTitle}</span> },
    { id: "cohortName", header: "Cohort", accessorKey: "cohortName", sortable: true, cell: (row) => <span className="text-muted-foreground">{row.cohortName}</span> },
    {
      id: "status",
      header: "Enrollment",
      accessorKey: "status",
      sortable: true,
      cell: (row) => <Badge variant="secondary" className={statusStyle(row.status)}>{humanizeStatus(row.status)}</Badge>,
    },
    {
      id: "progress",
      header: "Course progress",
      accessorKey: "progress",
      sortable: true,
      cell: (row) => <div className="min-w-32"><div className="mb-1 flex justify-between gap-2 text-xs"><span>{row.completedLessons}/{row.totalLessons} lessons</span><span className="font-medium tabular-nums">{row.progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${row.progress}%` }} /></div></div>,
    },
    { id: "averageScore", header: "Avg. score", accessorKey: "averageScore", sortable: true, cell: (row) => row.averageScore === null ? <span className="text-muted-foreground">—</span> : <span className="font-medium tabular-nums">{row.averageScore}%</span> },
    { id: "appliedAt", header: "Enrolled", accessorKey: "appliedAt", sortable: true, cell: (row) => <time dateTime={row.appliedAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(row.appliedAt))}</time> },
  ], []);

  if (query.isError && !report) {
    return <div role="alert" className="rounded-xl border bg-white p-8 text-center"><p className="font-semibold text-slate-900">Could not load learner reports</p><p className="mt-1 text-sm text-muted-foreground">{query.error.message}</p><Button className="mt-4" variant="outline" onClick={() => void query.refetch()}>Try again</Button></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Learner progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enrollment, course completion, and grade data from the platform.</p>
        </div>
        <Button variant="outline" disabled={!report?.data.length} onClick={() => report && downloadCsv(report.data)}>
          <Download className="mr-2 size-4" /> Export current page
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Users className="size-4" />} label="Enrollments" value={report?.stats.total ?? 0} detail="All recorded enrollment requests" />
        <MetricCard icon={<GraduationCap className="size-4" />} label="Active learners" value={report?.stats.active ?? 0} detail="Approved or currently learning" />
        <MetricCard icon={<GraduationCap className="size-4" />} label="Completed" value={report?.stats.completed ?? 0} detail="Enrollment marked complete" />
        <MetricCard icon={<Users className="size-4" />} label="Pending review" value={report?.stats.pending ?? 0} detail="Awaiting an enrollment decision" />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">Learner enrollments{report ? <span className="ml-2 font-normal text-muted-foreground">{report.meta.total} records</span> : null}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchInput} onChange={(event) => { setPage(1); setSearchInput(event.target.value); }} placeholder="Search learner, course, cohort..." className="pl-9" aria-label="Search learner reports" />
            </div>
            <select aria-label="Filter by enrollment status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as EnrollmentReportStatus | "ALL"); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
        <DataTable
          data={report?.data ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          pagination
          manualPagination
          page={page}
          pageSize={pageSize}
          totalCount={report?.meta.total ?? 0}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          isLoading={query.isLoading || query.isFetching}
          emptyMessage="No enrollment records match these filters."
          showTotalCount
          variant="flush"
        />
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">{label}</span><span className="text-primary">{icon}</span></div><p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-slate-950">{value.toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}
