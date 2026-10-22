"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ArrowUpRight, BookOpen, CheckCircle2, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DashboardData } from "@/lib/services/dashboard-service";

const icons = [BookOpen, GraduationCap, CheckCircle2, ShieldCheck, Users];
const chartConfig = { value: { label: "Records", color: "#5146e5" } } satisfies ChartConfig;

export function DashboardClient({ userName, dashboard }: { userName: string; dashboard: DashboardData }) {
  const [greeting, setGreeting] = React.useState("Welcome");

  React.useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const roleLabel = dashboard.roles.length
    ? dashboard.roles.map((role) => role.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())).join(" · ")
    : "Member";
  const chartData = dashboard.metrics.map((metric) => ({ name: metric.label, value: metric.value }));

  return (
    <div className="relative min-h-full pb-10">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 sm:text-[30px]">{greeting}, {userName}</h1>
            <p className="mt-1 text-sm text-slate-500">Your SAN TECH workspace at a glance.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600">{roleLabel}</span>
        </div>
      </motion.div>

      {dashboard.metrics.length > 0 ? (
        <>
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {dashboard.metrics.map((metric, index) => {
              const Icon = icons[index % icons.length];
              return (
                <motion.div key={metric.key} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                  <Card className="border-slate-200/80 bg-white shadow-none ring-0 transition-shadow hover:shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-[#eef0ff] text-[#5146e5]"><Icon className="size-4.5" /></div>
                        <span className="text-2xl font-extrabold tracking-tight text-slate-900">{metric.value}</span>
                      </div>
                      <p className="mt-3 truncate text-sm font-bold text-slate-800">{metric.label}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{metric.detail}</p>
                      <Link href={metric.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#5146e5] hover:underline">Open <ArrowUpRight className="size-3.5" /></Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-slate-200/80 bg-white shadow-none ring-0">
              <CardHeader className="px-5 pb-1 pt-5"><CardTitle className="text-base">Access overview</CardTitle><p className="text-xs text-slate-500">Live records available to your role</p></CardHeader>
              <CardContent className="px-3 pb-4 pt-1 sm:px-5">
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <AreaChart accessibilityLayer data={chartData} margin={{ left: 4, right: 8, top: 12, bottom: 0 }}>
                    <defs><linearGradient id="dashboard-area" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.03} /></linearGradient></defs>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => String(value).split(" ")[0]} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <Area dataKey="value" type="monotone" fill="url(#dashboard-area)" stroke="var(--color-value)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-value)" }} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white shadow-none ring-0">
              <CardHeader className="px-5 pb-1 pt-5"><CardTitle className="text-base">Dashboard records</CardTitle><p className="text-xs text-slate-500">Permission-filtered summary</p></CardHeader>
              <CardContent className="px-3 pb-3 pt-1 sm:px-5">
                <Table>
                  <TableHeader><TableRow><TableHead className="h-9 text-xs">Metric</TableHead><TableHead className="h-9 text-right text-xs">Value</TableHead></TableRow></TableHeader>
                  <TableBody>{dashboard.metrics.map((metric) => <TableRow key={metric.key}><TableCell className="py-2 text-xs font-medium text-slate-700">{metric.label}</TableCell><TableCell className="py-2 text-right text-sm font-bold text-slate-900">{metric.value}</TableCell></TableRow>)}</TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="mt-6 border-slate-200 bg-white shadow-none"><CardContent className="p-8 text-center"><p className="font-semibold text-slate-800">No dashboard metrics are assigned to this role.</p><p className="mt-1 text-sm text-slate-500">Ask an administrator to review your role permissions.</p></CardContent></Card>
      )}
    </div>
  );
}

