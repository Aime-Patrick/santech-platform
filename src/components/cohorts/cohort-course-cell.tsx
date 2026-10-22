import { BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const coursePalettes = [
  "border-sky-200 bg-sky-50 text-sky-700",
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
];

function paletteFor(title: string) {
  const score = Array.from(title).reduce((total, character) => total + character.charCodeAt(0), 0);
  return coursePalettes[score % coursePalettes.length];
}

interface CohortCourseCellProps {
  cohortName: string;
  courseTitle: string;
}

export function CohortCourseCell({ cohortName, courseTitle }: CohortCourseCellProps) {
  return (
    <div className="flex min-w-72 items-center gap-3">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl border",
          paletteFor(courseTitle)
        )}
      >
        <BookOpenCheck aria-hidden="true" className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-foreground">{cohortName}</span>
        <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {courseTitle}
        </span>
      </span>
    </div>
  );
}
