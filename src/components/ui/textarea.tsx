import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#07152d] outline-none placeholder:text-slate-400 focus:border-[#00a3e0] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#00a3e0]/30",
        className,
      )}
      {...props}
    />
  );
}
