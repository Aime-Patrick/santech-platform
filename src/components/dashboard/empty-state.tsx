import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  icon: Icon = Inbox,
  eyebrow = "Nothing here yet",
  title,
  description,
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex min-h-52 flex-col items-center justify-center border-dashed text-center shadow-none">
      <span className="grid size-11 place-items-center rounded-full bg-[#e7f4fb] text-[#0a1f44]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#00a3e0]">{eyebrow}</p>
      <h2 className="mt-2 text-lg font-bold text-[#0a1f44]">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </Card>
  );
}

