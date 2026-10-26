"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return <DayPicker className={cn("p-3", className)} classNames={{ months: "flex flex-col gap-4", month: "space-y-4", month_caption: "flex items-center justify-between px-1", caption_label: "text-sm font-semibold", nav: "flex items-center gap-1", button_previous: "grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100", button_next: "grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100", month_grid: "w-full border-collapse", weekdays: "flex", weekday: "w-9 rounded-md text-[0.8rem] font-medium text-slate-500", week: "mt-1 flex w-full", day: "relative size-9 p-0 text-center text-sm", day_button: "size-9 rounded-md font-normal hover:bg-indigo-50", selected: "bg-indigo-600 text-white hover:bg-indigo-600", today: "border border-indigo-300", outside: "text-slate-300", disabled: "text-slate-300 opacity-50", ...classNames }} {...props} />;
}
