import { Suspense } from "react";
import { WebsiteContentEditor } from "@/components/website-content/website-content-editor";

export default async function WebsiteContentEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading entry...</div>}><WebsiteContentEditor id={id} /></Suspense>;
}