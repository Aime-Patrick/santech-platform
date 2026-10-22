import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-[11px] font-bold uppercase tracking-[0.14em] text-[#0a1f44]", className)}
      {...props}
    />
  );
}
