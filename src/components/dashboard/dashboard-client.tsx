"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardList, GraduationCap, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import type { DashboardData } from "@/lib/services/dashboard-service";

const icons = [BookOpen, GraduationCap, CheckCircle2, ShieldCheck, Users];
const chartConfig = { value: { label: "Records", color: "#5146e5" } } satisfies ChartConfig;

export function DashboardClient({ dashboard }: { dashboard: DashboardData }) {
  const chartData = dashboard.metrics.map((metric) => ({ name: metric.label, value: metric.value }));

  return (
    <div className="relative min-h-full pb-10">
      {dashboard.metrics.length > 0 ? (
        <>
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {dashboard.metrics.map((metric, index) => {
              const Icon = icons[index % icons.length];
              return (
                <motion.div key={metric.key} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                  <StatCard
                    label={metric.label}
                    value={metric.value}
                    icon={Icon}
                    description={metric.detail}
                    href={metric.href}
                    className="border-slate-200/80 bg-white shadow-none ring-0 transition-shadow hover:shadow-sm"
                  />
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

          {dashboard.permissions.includes("applications.review") ? (
            <Card className="mt-5 overflow-hidden border-slate-200/80 bg-white shadow-none ring-0">
              <CardHeader className="flex flex-row items-center justify-between gap-4 px-5 pb-3 pt-5">
                <div>
                  <CardTitle className="text-base">Recent applications</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Latest submissions waiting for a decision</p>
                </div>
                <Link
                  href="/dashboard/application-review"
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-[#5146e5] transition-colors hover:bg-violet-50"
                >
                  View all <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardHeader>
              {dashboard.recentApplications.length > 0 ? (
                <CardContent className="px-0 pb-1 pt-0">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[680px]">
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                          <TableHead className="h-10 pl-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Applicant</TableHead>
                          <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-slate-500">Course / program</TableHead>
                          <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</TableHead>
                          <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</TableHead>
                          <TableHead className="h-10 pr-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard.recentApplications.map((application) => (
                          <TableRow key={application.id}>
                            <TableCell className="py-3 pl-5">
                              <div className="font-medium text-slate-900">{application.applicantName}</div>
                              <div className="mt-0.5 text-xs text-slate-500">{application.email}</div>
                            </TableCell>
                            <TableCell className="max-w-64 truncate py-3 text-sm text-slate-700">{application.courseTitle}</TableCell>
                            <TableCell className="py-3 text-sm capitalize text-slate-600">{application.type.toLowerCase()}</TableCell>
                            <TableCell className="py-3 text-sm text-slate-600">
                              {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(application.submittedAt))}
                            </TableCell>
                            <TableCell className="py-3 pr-5">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${application.status === "UNDER_REVIEW" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                                {application.status === "UNDER_REVIEW" ? "Under review" : "Submitted"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="border-t border-slate-100 py-10 text-center">
                  <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-violet-50 text-[#5146e5]">
                    <ClipboardList className="size-5" aria-hidden="true" />
                  </div>
                  <p className="font-medium text-slate-800">No applications are waiting for review</p>
                  <p className="mt-1 text-sm text-slate-500">New submissions will appear here.</p>
                </CardContent>
              )}
            </Card>
          ) : null}
        </>
      ) : (
        <Card className="border-slate-200 bg-white shadow-none"><CardContent className="p-8 text-center"><p className="font-semibold text-slate-800">No dashboard metrics are assigned to this role.</p><p className="mt-1 text-sm text-slate-500">Ask an administrator to review your role permissions.</p></CardContent></Card>
      )}
    </div>
  );
}


