import { CalendarRange } from "lucide-react";

type DateValue = Date | string | null;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function asDate(value: DateValue) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

interface CohortScheduleCellProps {
  startsAt: DateValue;
  endsAt: DateValue;
}

export function CohortScheduleCell({ startsAt, endsAt }: CohortScheduleCellProps) {
  const start = asDate(startsAt);
  const end = asDate(endsAt);

  if (!start && !end) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/40">
          <CalendarRange aria-hidden="true" className="size-4" />
        </span>
        <span className="text-xs font-medium">Schedule not set</span>
      </div>
    );
  }

  const duration = start && end
    ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000))
    : null;

  return (
    <div className="flex min-w-72 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600">
        <CalendarRange aria-hidden="true" className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-foreground">
          <time dateTime={start?.toISOString()}>{start ? dateFormatter.format(start) : "Not set"}</time>
          <time dateTime={end?.toISOString()}>{end ? dateFormatter.format(end) : "Not set"}</time>
        </div>
        <div className="flex items-center" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-indigo-500" />
          <span className="h-px flex-1 bg-indigo-200" />
          <span className="size-1.5 rounded-full border-2 border-indigo-500 bg-card" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {duration ? `${duration}-day term` : "Cohort term"}
        </span>
      </div>
    </div>
  );
}
