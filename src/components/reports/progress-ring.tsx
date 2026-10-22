"use client";

import * as React from "react";
import { cn } from "cn";

export interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // diameter in px
  strokeWidth?: number;
  color?: string; // stroke color (e.g. #00c5a3, #5b51ef, #ef4444)
  trackColor?: string; // background ring color
  className?: string;
  showText?: boolean;
  textSize?: string;
}

export function ProgressRing({
  progress,
  size = 24,
  strokeWidth = 3.5,
  color = "#00c5a3",
  trackColor = "#eef1f6",
  className,
  showText = false,
  textSize = "text-[10px]",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Active Progress */}
        {clampedProgress > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>
      {showText && (
        <span
          className={cn(
            "absolute font-bold text-slate-800 select-none",
            textSize
          )}
        >
          {clampedProgress}%
        </span>
      )}
    </div>
  );
}
