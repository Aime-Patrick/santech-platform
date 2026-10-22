"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LineChart, Line } from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

// ---------------------------------------------------------------------------
// 1. Dynamic Sparkline Chart for "Most issued content"
// ---------------------------------------------------------------------------
export interface SparklinePoint {
  day: string;
  value: number;
}

export interface SparklineChartProps {
  data?: SparklinePoint[];
  color?: string;
  className?: string;
}

const defaultSparklineData: SparklinePoint[] = [
  { day: "1", value: 6 },
  { day: "2", value: 10 },
  { day: "3", value: 7 },
  { day: "4", value: 14 },
  { day: "5", value: 12 },
  { day: "6", value: 16 },
];

export function SparklineChart({
  data = defaultSparklineData,
  color = "#00c5a3",
  className,
}: SparklineChartProps) {
  const sparklineConfig = {
    value: {
      label: "Issues",
      color: color,
    },
  } satisfies ChartConfig;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className || "h-8 w-20 shrink-0"}
    >
      <ChartContainer config={sparklineConfig} className="h-full w-full">
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
          />
        </LineChart>
      </ChartContainer>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 2. Semicircular Arc Gauge Chart (180° arch, flat baseline, dynamic data)
// ---------------------------------------------------------------------------
export type GaugeSegment = {
  label: string;
  value: number; // percentage or relative count
  color: string; // hex color for arc segment
  dotColor?: string; // tailwind color class for legend
};

export interface LearningGaugeChartProps {
  total?: number | string;
  label?: string;
  segments: GaugeSegment[];
  className?: string;
}

// Semicircular arc geometry (180° arch from 180° left to 0° right)
const CX = 110;
const CY = 100;
const R = 76;
const STROKE_W = 18;
const R_OUTER = R + STROKE_W / 2 + 5; // Subtle outer guide ring

// Converts degrees to radians
function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// Cartesian coordinates for angle (in standard unit circle where 0° is right, 90° is top, 180° is left)
function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = degToRad(angleInDegrees);
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy - r * Math.sin(angleInRadians), // SVG y-axis is inverted
  };
}

// Generates an SVG arc path going clockwise over the top from startAngle to endAngle
function createArcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const angleDiff = startAngle - endAngle;
  const largeArcFlag = angleDiff > 180 ? 1 : 0;

  // Sweep flag 1 = clockwise (over the top of the semicircle)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function LearningGaugeChart({
  total = 140,
  label = "Contents",
  segments,
  className,
}: LearningGaugeChartProps) {
  // Compute total percentage across all segments to determine scale
  const totalValue = React.useMemo(() => {
    const sum = segments.reduce((acc, s) => acc + s.value, 0);
    return sum > 0 ? sum : 100;
  }, [segments]);

  // Full 180-degree arch paths (from 180° left down to 0° right)
  const fullTrackPath = React.useMemo(
    () => createArcPath(CX, CY, R, 180, 0),
    []
  );
  const outerGuidePath = React.useMemo(
    () => createArcPath(CX, CY, R_OUTER, 180, 0),
    []
  );

  // Calculate arc angles for each colored segment
  // In the image, a crisp white divider (gap) separates adjacent segments
  const GAP_DEG = 1.2; // degrees of white gap between segments

  let currentAngle = 180; // starts at left baseline (180°)
  const segmentItems: Array<{
    segment: GaugeSegment;
    path: string;
    key: string;
    divider?: { x1: number; y1: number; x2: number; y2: number };
  }> = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.value <= 0) continue;

    // Angle span corresponding to this segment's share of 180°
    const angleSpan = (seg.value / totalValue) * 180;
    const startA = currentAngle;
    const endA = Math.max(0, currentAngle - angleSpan);

    if (startA > endA) {
      segmentItems.push({
        segment: seg,
        path: createArcPath(CX, CY, R, startA, endA),
        key: `seg-${seg.label}-${i}`,
      });

      // Divider line at the joint between segments
      if (i < segments.length - 1 && endA > 0) {
        const pInner = polarToCartesian(CX, CY, R - STROKE_W / 2 - 0.5, endA);
        const pOuter = polarToCartesian(CX, CY, R + STROKE_W / 2 + 0.5, endA);
        segmentItems[segmentItems.length - 1].divider = {
          x1: pInner.x,
          y1: pInner.y,
          x2: pOuter.x,
          y2: pOuter.y,
        };
      }
    }

    currentAngle = endA;
  }

  return (
    <div className={className || "relative flex shrink-0 items-center justify-center"}>
      <div className="h-[120px] w-[220px]">
        <svg
          viewBox="0 0 220 115"
          className="size-full overflow-visible"
          role="img"
          aria-label={`${label}: ${total}`}
        >
          {/* 1. Subtle Outer Guide Arc Line (as seen in the reference image) */}
          <path
            d={outerGuidePath}
            fill="none"
            stroke="#eef2f6"
            strokeWidth="1.5"
            strokeLinecap="butt"
          />

          {/* 2. Background Track Arc (flat butt baseline, #f1f4f8) */}
          <path
            d={fullTrackPath}
            fill="none"
            stroke="#f1f4f8"
            strokeWidth={STROKE_W}
            strokeLinecap="butt"
          />

          {/* 3. Colored Segments */}
          {segmentItems.map((item, idx) => (
            <motion.path
              key={item.key}
              d={item.path}
              fill="none"
              stroke={item.segment.color}
              strokeWidth={STROKE_W}
              strokeLinecap="butt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
            />
          ))}

          {/* 4. Crisp White Radial Dividers Between Adjacent Segments */}
          {segmentItems.map(
            (item, idx) =>
              item.divider && (
                <line
                  key={`div-${idx}`}
                  x1={item.divider.x1}
                  y1={item.divider.y1}
                  x2={item.divider.x2}
                  y2={item.divider.y2}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="butt"
                />
              )
          )}
        </svg>
      </div>

      {/* Center Metrics (Contents 140) */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="pointer-events-none absolute bottom-1 text-center"
      >
        <p className="text-[12px] font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 text-[28px] font-black leading-none tracking-tight text-slate-900">
          {total}
        </p>
      </motion.div>
    </div>
  );
}
