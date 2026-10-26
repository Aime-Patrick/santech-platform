"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  useUpdateApplicationStatus,
  type ApplicationDecisionStatus,
} from "@/features/applications";
import type { listApplicationsForReview } from "@/lib/services/application-service";

type ApplicationRow = Awaited<
  ReturnType<typeof listApplicationsForReview>
>[number];

type ApplicationDetail = {
  label: string;
  value: string;
};

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function applicationDetails(item: ApplicationRow): ApplicationDetail[] {
  try {
    const payload = JSON.parse(item.coverLetter ?? "") as Record<
      string,
      unknown
    >;
    return Object.entries(payload)
      .filter(([key]) => !["name", "email"].includes(key))
      .map(([key, value]) => ({
        label: key
          .replace(/[A-Z]/g, (letter) => ` ${letter}`)
          .replace(/^./, (letter) => letter.toUpperCase()),
        value: String(value ?? "Not provided"),
      }));
  } catch {
    return [{ label: "Statement", value: item.coverLetter ?? "Not provided" }];
  }
}

const decisionOptions = [
  {
    value: "UNDER_REVIEW",
    label: "Under review",
    hint: "Assessment in progress",
    active:
      "has-checked:border-amber-500/70 has-checked:bg-amber-500/10 has-checked:text-amber-700 has-checked:ring-1 has-checked:ring-amber-500/30 dark:has-checked:text-amber-400",
  },
  {
    value: "SHORTLISTED",
    label: "Shortlisted",
    hint: "Moved to the next stage",
    active:
      "has-checked:border-sky-500/70 has-checked:bg-sky-500/10 has-checked:text-sky-700 has-checked:ring-1 has-checked:ring-sky-500/30 dark:has-checked:text-sky-400",
  },
  {
    value: "ACCEPTED",
    label: "Accepted",
    hint: "Approved for the program",
    active:
      "has-checked:border-emerald-500/70 has-checked:bg-emerald-500/10 has-checked:text-emerald-700 has-checked:ring-1 has-checked:ring-emerald-500/30 dark:has-checked:text-emerald-400",
  },
  {
    value: "REJECTED",
    label: "Rejected",
    hint: "Not moving forward",
    active:
      "has-checked:border-rose-500/70 has-checked:bg-rose-500/10 has-checked:text-rose-700 has-checked:ring-1 has-checked:ring-rose-500/30 dark:has-checked:text-rose-400",
  },
  {
    value: "WITHDRAWN",
    label: "Withdrawn",
    hint: "Closed without a decision",
    active:
      "has-checked:border-slate-400/70 has-checked:bg-slate-500/10 has-checked:text-slate-700 has-checked:ring-1 has-checked:ring-slate-400/30 dark:has-checked:text-slate-300",
  },
] as const;

function statusTone(status: string) {
  if (status === "ACCEPTED")
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (status === "REJECTED")
    return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  if (status === "UNDER_REVIEW" || status === "SHORTLISTED") {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  return "bg-muted text-muted-foreground";
}

export function ApplicationReviewTable({
  applications,
}: {
  applications: ApplicationRow[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ApplicationRow | null>(null);
  const updateStatusMutation = useUpdateApplicationStatus();

  function handleDecisionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || updateStatusMutation.isPending) return;

    const formData = new FormData(event.currentTarget);
    updateStatusMutation.mutate(
      {
        applicationId: selected.id,
        status: String(formData.get("status")) as ApplicationDecisionStatus,
        reviewNotes:
          String(formData.get("reviewNotes") ?? "").trim() || undefined,
      },
      {
        onSuccess: () => {
          setSelected(null);
          router.refresh();
        },
      },
    );
  }

  const columns: DataTableColumn<ApplicationRow>[] = [
    {
      id: "number",
      header: "#",
      className: "w-14 text-muted-foreground",
      headerClassName: "w-14",
      cell: (_item, index) => <span className="tabular-nums">{index + 1}</span>,
    },
    {
      id: "applicant",
      header: "Applicant",
      accessorKey: "applicant",
      sortable: true,
      cell: (item) => (
        <div className="min-w-44">
          <p className="font-semibold leading-5">
            {item.applicant.firstName} {item.applicant.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {item.applicant.email}
          </p>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      accessorKey: "type",
      sortable: true,
      cell: (item) => formatStatus(item.type),
    },
    {
      id: "course",
      header: "Course",
      cell: (item) => (
        <span className="block max-w-56 truncate">
          {item.course?.title ?? "General application"}
        </span>
      ),
    },
    {
      id: "submitted",
      header: "Submitted",
      accessorKey: "submittedAt",
      sortable: true,
      cell: (item) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {item.submittedAt?.toLocaleDateString("en", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }) ?? "Not submitted"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (item) => (
        <span
          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(item.status)}`}
        >
          {formatStatus(item.status)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      className: "w-24",
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Actions for ${item.applicant.firstName} ${item.applicant.lastName}`}
              >
                <MoreHorizontal className="size-4" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => {
                updateStatusMutation.reset();
                setSelected(item);
              }}
            >
              View application
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                updateStatusMutation.reset();
                setSelected(item);
              }}
            >
              Review decision
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={applications}
        columns={columns}
        getRowId={(item) => item.id}
        searchFilter={(item, query) =>
          `${item.applicant.firstName} ${item.applicant.lastName} ${item.applicant.email} ${item.course?.title ?? ""}`
            .toLowerCase()
            .includes(query)
        }
        searchKey="type"
        searchPlaceholder="Search applicant, email, or course..."
        pagination
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
        showPageSizeSelector
        tableClassName="min-w-[980px]"
        variant="card"
        emptyMessage="No applications have been submitted yet."
      />

      {selected ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-review-title"
            className="flex h-[min(90vh,780px)] w-full max-w-5xl flex-col overflow-hidden rounde-md border border-border/70 bg-background shadow-[0_28px_90px_rgba(2,12,32,0.35)]"
          >
            <header className="flex shrink-0 items-start justify-between gap-5 border-b border-border/70 px-5 py-4 sm:px-7 sm:py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#123568]">
                    {formatStatus(selected.type)} application
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(selected.status)}`}
                  >
                    {formatStatus(selected.status)}
                  </span>
                </div>
                <h2
                  id="application-review-title"
                  className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground"
                >
                  {selected.applicant.firstName} {selected.applicant.lastName}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {selected.applicant.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close application review"
              >
                <X className="size-5" />
              </button>
            </header>

            <form
              onSubmit={handleDecisionSubmit}
              className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden"
            >
              <section className="min-w-0 px-5 py-5 sm:px-7 lg:overflow-y-auto lg:py-6">
                <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Application details
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Information provided by the learner.
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Submitted
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {selected.submittedAt?.toLocaleDateString("en", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }) ?? "Not submitted"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  {applicationDetails(selected).map((entry) => (
                    <div
                      key={entry.label}
                      className="min-w-0 border-b border-border/60 pb-5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                    >
                      <p className="text-xs font-semibold text-muted-foreground">
                        {entry.label}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {entry.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="flex min-h-0 flex-col border-t border-border/70 bg-muted/20 px-5 py-5 lg:overflow-y-auto lg:border-l lg:border-t-0">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Review decision
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Choose the next outcome. Changes are recorded in the audit
                    log.
                  </p>
                </div>

                <fieldset className="mt-4 grid gap-2">
                  <legend className="sr-only">Decision</legend>
                  {decisionOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-3 transition-all hover:border-foreground/25 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50 ${option.active}`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        defaultChecked={
                          option.value ===
                          (selected.status === "SUBMITTED"
                            ? "UNDER_REVIEW"
                            : selected.status)
                        }
                        className="size-4 shrink-0 accent-current"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold leading-tight">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                          {option.hint}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                <label className="mt-5 grid gap-2">
                  <span className="text-sm font-medium">
                    Review note{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </span>
                  <textarea
                    name="reviewNotes"
                    rows={4}
                    defaultValue={selected.reviewNotes ?? ""}
                    placeholder="Add requirements, next steps, or feedback for the applicant."
                    className="min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-5 outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </label>

                <div className="mt-auto pt-5">
                  {updateStatusMutation.error ? (
                    <p
                      role="alert"
                      className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                    >
                      {updateStatusMutation.error.message}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={updateStatusMutation.isPending}
                    aria-busy={updateStatusMutation.isPending}
                    className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#123568] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a1f44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123568]/40 disabled:cursor-wait disabled:opacity-70"
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <span
                          aria-hidden
                          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        />
                        <span>Saving decision...</span>
                      </>
                    ) : (
                      <span>Save decision</span>
                    )}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Visible to authorized reviewers only.
                  </p>
                </div>
              </aside>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
