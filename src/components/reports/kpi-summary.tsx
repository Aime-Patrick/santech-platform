"use client";

import * as React from "react";
import { Info, TrendingUp, Calendar } from "lucide-react";
import { ProgressRing } from "./progress-ring";
import { cn } from "cn";

export interface KpiMetricItem {
  value: number | string;
  change: string;
  changeDirection?: "up" | "down";
  changeColor?: string; // e.g. text-emerald-600 or text-rose-500
  label: string;
}

export interface KpiSummaryProps {
  trainedPercent?: number;
  overviewLabel?: string;
  metrics?: KpiMetricItem[];
  className?: string;
}

const defaultMetrics: KpiMetricItem[] = [
  {
    value: 50,
    change: "3%",
    changeDirection: "up",
    changeColor: "text-emerald-500",
    label: "In progress",
  },
  {
    value: 35,
    change: "2%",
    changeDirection: "up",
    changeColor: "text-rose-500",
    label: "Overdue",
  },
  {
    value: 75,
    change: "5%",
    changeDirection: "up",
    changeColor: "text-emerald-500",
    label: "Passed",
  },
  {
    value: 75,
    change: "5%",
    changeDirection: "up",
    changeColor: "text-rose-500",
    label: "Failed",
  },
];

export function KpiSummary({
  trainedPercent = 50,
  overviewLabel = "This week progress overview",
  metrics = defaultMetrics,
  className,
}: KpiSummaryProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-none",
        className
      )}
    >
      {/* 1. Trained Donut Gauge */}
      <div className="flex items-center gap-3.5">
        <ProgressRing
          progress={trainedPercent}
          size={56}
          strokeWidth={6}
          color="#00c5a3"
          trackColor="#eef2f6"
        />
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <span>Trained</span>
            <Info className="size-3 text-slate-400" />
          </div>
          <p className="text-[26px] font-black tracking-tight text-slate-900 leading-none mt-0.5">
            {trainedPercent}%
          </p>
        </div>
      </div>

      <div className="hidden h-10 w-px bg-slate-100 md:block" aria-hidden="true" />

      {/* 2. Overview Capsule */}
      <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-slate-50/70 px-3.5 py-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-white border border-gray-200/60 shadow-2xs">
          <Calendar className="size-3.5 text-slate-500" />
        </div>
        <span className="text-[12px] font-semibold text-slate-700">{overviewLabel}</span>
      </div>

      <div className="hidden h-10 w-px bg-slate-100 lg:block" aria-hidden="true" />

      {/* 3. Stat Metrics */}
      <div className="flex flex-1 flex-wrap items-center justify-around gap-6">
        {metrics.map((item, idx) => (
          <div key={idx} className="min-w-[70px]">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[20px] font-extrabold text-slate-900 leading-none">
                {item.value}
              </span>
              <span
                className={cn(
                  "inline-flex items-center text-[11px] font-bold",
                  item.changeColor || "text-emerald-500"
                )}
              >
                <TrendingUp className="mr-0.5 size-3 inline" />
                {item.change}
              </span>
            </div>
            <p className="mt-1 text-[12px] font-medium text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
