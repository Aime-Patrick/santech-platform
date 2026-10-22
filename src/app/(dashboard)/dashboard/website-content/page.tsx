import { Suspense } from "react";
import { redirect } from "next/navigation";
import { WebsiteContentDashboard } from "@/components/website-content/website-content-dashboard";

export default async function WebsiteContentPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams;
  if (!params.type) redirect("/dashboard/website-content?type=certificate");
  return <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading collection...</div>}><WebsiteContentDashboard /></Suspense>;
}