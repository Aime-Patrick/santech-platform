"use client";

import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  isInView = true,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  isInView?: boolean;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    Math.round(latest).toLocaleString(),
  );

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 1.2 });
      return controls.stop;
    }
  }, [value, isInView]);

  return (
    <span>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

export type WelcomeCardProps = {
  name?: string;
  greeting?: string;
  metric1Label?: string;
  metric1Value?: number;
  metric1Prefix?: string;
  metric1Suffix?: string;
  metric2Label?: string;
  metric2Value?: number;
  metric2Prefix?: string;
  metric2Suffix?: string;
  className?: string;
};

const WelcomeCard = ({
  name = "Learner",
  greeting = "Welcome Back",
  metric1Label = "Active Courses",
  metric1Value = 3,
  metric1Prefix = "",
  metric1Suffix = "",
  metric2Label = "Completed Lessons",
  metric2Value = 24,
  metric2Prefix = "",
  metric2Suffix = "",
  className,
}: WelcomeCardProps = {}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <Card className="p-6 sm:p-7 bg-gradient-to-r from-[#4338ca] via-[#4a45ff] to-[#3b82f6] pb-0 w-full relative overflow-hidden rounde-md shadow-sm border-0 text-white">
        <div className="grid grid-cols-12 items-center">
          {/* LEFT SIDE */}
          <div className="md:col-span-8 col-span-12">
            <div className="flex gap-3.5 items-center">
              <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 text-white">
                <GraduationCap size={22} className="text-white" />
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70 block">
                  Learning Portal
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {greeting}, {name}
                </h2>
              </div>
            </div>

            {/* COUNTERS */}
            <div className="flex w-full mt-6 sm:mt-8 mb-6 sm:mb-7">
              <div className="border-e border-white/20 pe-6">
                <p className="text-white/75 text-xs font-medium mb-1">
                  {metric1Label}
                </p>
                <div className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">
                  <AnimatedCounter
                    value={metric1Value}
                    isInView={isInView}
                    prefix={metric1Prefix}
                    suffix={metric1Suffix}
                  />
                </div>
              </div>

              <div className="ps-6">
                <p className="text-white/75 text-xs font-medium mb-1">
                  {metric2Label}
                </p>
                <div className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">
                  <AnimatedCounter
                    value={metric2Value}
                    isInView={isInView}
                    prefix={metric2Prefix}
                    suffix={metric2Suffix}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* IMAGE RIGHT */}
          <div className="md:col-span-4 col-span-12 md:ms-auto ms-auto me-auto hidden sm:block">
            <img
              src="https://images.shadcnspace.com/assets/backgrounds/welcome-bg-1.png"
              alt="welcome illustration"
              className="-mb-n5 max-w-[150px] lg:max-w-[170px] pointer-events-none drop-shadow-md"
              width={1024}
              height={195}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WelcomeCard;
export { WelcomeCard };
