"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssetPicker } from "@/components/website-content/asset-picker";
import { useDeleteWebsiteEntry, useUpdateWebsiteEntry, useWebsiteEntry } from "@/features/website-content";

type Entry = { id: string; contentType: string; sourceDocumentId: string; title: string | null; slug: string | null; status: string; payload: Record<string, unknown>; sourceUpdatedAt: string | null };
const hidden = new Set(["id", "documentId", "createdAt", "updatedAt", "publishedAt", "bookId", "pageLabel", "readerUrl"]);
const fieldLabel = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
const requiredFields = new Set(["label", "description", "title", "year", "stage", "name", "value"]);

export function WebsiteContentEditor({ id }: { id: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const entryQuery = useWebsiteEntry(id);
  const updateMutation = useUpdateWebsiteEntry();
  const deleteMutation = useDeleteWebsiteEntry();
  const [entry, setEntry] = React.useState<Entry | null>(null);
  const [payload, setPayload] = React.useState<Record<string, unknown>>({});
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [original, setOriginal] = React.useState({ title: "", slug: "", payload: "" });
  const [status, setStatus] = React.useState("DRAFT");

  const [menu, setMenu] = React.useState(false);
  const [topMenu, setTopMenu] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT");

  React.useEffect(() => {
    const nextEntry = entryQuery.data?.data?.[0] as Entry | undefined;
    if (!nextEntry) return;
    const nextTitle = nextEntry.title ?? String(nextEntry.payload?.label ?? nextEntry.payload?.stage ?? nextEntry.payload?.year ?? nextEntry.payload?.title ?? "Untitled entry");
    setEntry(nextEntry as Entry); setPayload(nextEntry.payload ?? {}); setTitle(nextTitle); setSlug(nextEntry.slug ?? ""); setStatus(nextEntry.status ?? "DRAFT");
    setOriginal({ title: nextTitle, slug: nextEntry.slug ?? "", payload: JSON.stringify(nextEntry.payload ?? {}) });
  }, [entryQuery.data]);

  const dirty = title !== original.title || slug !== original.slug || JSON.stringify(payload) !== original.payload;
  const readOnly = viewMode === "PUBLISHED";
  const disabled = readOnly || updateMutation.isPending || deleteMutation.isPending || !dirty;

  function save(nextStatus: string) {
    if (!entry) return;
    const generatedPayload = { ...payload };
    Object.keys(generatedPayload).filter((key) => /(image|logo|media|photo|thumbnail|video)/i.test(key)).forEach((key) => { if (generatedPayload[key] && !/video/i.test(key)) generatedPayload[key + "Alt"] = title.trim() || fieldLabel(key); });
    updateMutation.mutate(
      { id: entry.id, title: title.trim() || "Untitled entry", slug, payload: generatedPayload, status: nextStatus },
      { onSuccess: (result) => { setEntry(result.data as Entry); setPayload(generatedPayload); setStatus(result.data.status); setOriginal({ title: title.trim() || "Untitled entry", slug, payload: JSON.stringify(generatedPayload) }); } },
    );
  }

  function remove() {
    if (!entry || !window.confirm("Delete this entry?")) return;
    deleteMutation.mutate(entry.id, { onSuccess: () => router.back() });
  }

  if (entryQuery.isLoading) return <div className="p-8 text-slate-500">Loading entry...</div>
  if (!entry) return <div className="p-8 text-slate-500">{entryQuery.error?.message ?? "Entry not found."}</div>;

  const fields = Object.entries(payload).filter(([key, value]) => !hidden.has(key) && !/(alt)$/i.test(key) && (["string", "number", "boolean"].includes(typeof value) || /(image|logo|media|photo|thumbnail)/i.test(key)));
  const mediaUrl = (key: string) => { const value = payload[key]; return typeof value === "string" ? value : value && typeof value === "object" && "url" in value ? String((value as { url?: unknown }).url ?? "") : ""; };
  const maxLength = (key: string) => /description|body|content/i.test(key) ? 400 : /slug|label|title|name|stage/i.test(key) ? 100 : /imageAlt/i.test(key) ? 255 : null;
  const renderField = ([key, value]: [string, unknown]) => {
    const label = fieldLabel(key);
    const required = requiredFields.has(key);
    const hint = maxLength(key);
    if (/^(accent|coverInk|color|background|foreground|textColor)$/i.test(key)) return <label key={key} className="grid gap-2 text-[12px] text-[#1f2c55]"><span>{label}{required ? <sup className="text-red-500">*</sup> : null}</span><div className="flex h-11 items-center gap-3 rounded-md border border-[#d9d9e3] bg-white px-3"><input type="color" value={/^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : "#000000"} disabled={readOnly} onChange={(event) => setPayload((current) => ({ ...current, [key]: event.target.value }))} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" /><span className="font-mono text-xs text-slate-500">{String(value ?? "")}</span></div></label>;
    if (/(image|logo|media|photo|thumbnail|video)/i.test(key)) return <div key={key} className="grid gap-2 text-[12px] text-[#1f2c55] sm:col-span-2"><span>{label}{required ? <sup className="text-red-500">*</sup> : null}</span><div className="rounded-md border border-dashed border-[#d9d9e3] bg-[#fafafd] p-4">{mediaUrl(key) ? (/video/i.test(key) ? <video src={mediaUrl(key)} controls className="mb-3 h-40 w-full rounded object-contain" /> : <img src={mediaUrl(key)} alt={String(payload[`${key}Alt`] ?? "")} className="mb-3 h-40 w-full rounded object-cover" />) : <p className="mb-3 text-sm font-normal text-slate-500">No asset assigned</p>}<AssetPicker kind={/video/i.test(key) ? "video" : "image"} value={mediaUrl(key)} disabled={readOnly} onChange={(url) => setPayload((current) => ({ ...current, [key]: url }))} /></div></div>;
    const inputClass = "h-11 w-full rounded-md border border-[#d9d9e3] bg-white px-4 text-sm text-[#1f2c55] outline-none focus:border-[#7b79ff] focus:ring-2 focus:ring-[#d9d8ff] disabled:bg-[#e8e8ee]";
    return <label key={key} className="grid gap-2 text-[12px] text-[#1f2c55]">{label}{required ? <sup className="text-red-500">*</sup> : null}{typeof value === "string" && value.length > 90 ? <textarea value={String(value)} disabled={readOnly} onChange={(event) => setPayload((current) => ({ ...current, [key]: event.target.value }))} className="min-h-[120px] w-full resize-y rounded-md border border-[#d9d9e3] bg-white px-4 py-3 text-sm text-[#1f2c55] outline-none focus:border-[#7b79ff] focus:ring-2 focus:ring-[#d9d8ff] disabled:bg-[#e8e8ee]" /> : <input type={typeof value === "number" || /sortOrder|year/i.test(key) ? "number" : "text"} value={String(value ?? "")} disabled={readOnly} onChange={(event) => setPayload((current) => ({ ...current, [key]: typeof value === "number" || /sortOrder|year/i.test(key) ? Number(event.target.value) : event.target.value }))} className={inputClass} />}{hint ? <span className="text-[11px] text-[#536184]">max. {hint} characters</span> : null}</label>;
  };

  return <section className="min-h-full bg-[#f7f7fa] px-5 pb-12 text-[#1f2c55]"><div className="mx-auto max-w-[1480px]"><div className="flex items-center justify-between pt-1"><button type="button" onClick={() => router.push(`/dashboard/website-content?type=${search.get("type") ?? entry.contentType}`)} className="inline-flex items-center gap-2 text-sm text-[#4a45ff]"><ArrowLeft className="size-4" />Back</button><div className="relative"><Button variant="outline" size="icon" className="h-9 w-9 border-[#d9d9e3] bg-white" aria-label="Entry actions" onClick={() => setTopMenu((open) => !open)}><MoreHorizontal className="size-4" /></Button>{topMenu ? <div className="absolute right-0 z-20 mt-2 w-52 rounded-md border border-[#e0e0e8] bg-white p-1.5 text-sm shadow-lg"><button type="button" className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-slate-50">Edit the model</button><button type="button" className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-slate-50">Configure the view</button><button type="button" className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-red-600 hover:bg-red-50" onClick={remove}><Trash2 className="size-4" />Delete entry</button><div className="my-1 border-t" /><button type="button" className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-slate-50">Copy document ID</button></div> : null}</div></div><header className="mt-5"><h1 className="text-[34px] font-medium tracking-tight">{title || "Untitled entry"}</h1><Badge className={status === "PUBLISHED" ? "mt-3 border border-[#b7ebc2] bg-[#e9f9ed] text-[#17833b]" : "mt-3 border-0 bg-[#e9e9f0] text-[#536184]"}>{status === "PUBLISHED" ? "Published" : "Draft"}</Badge></header><div className="mt-7 flex gap-7 border-b border-transparent"><button type="button" onClick={() => setViewMode("DRAFT")} className={`border-b-2 px-4 pb-4 text-[12px] font-medium ${viewMode === "DRAFT" ? "border-[#4a45ff] text-[#4a45ff]" : "border-transparent text-[#536184]"}`}>DRAFT</button><button type="button" disabled={status !== "PUBLISHED"} onClick={() => setViewMode("PUBLISHED")} className={`border-b-2 px-4 pb-4 text-[12px] font-medium ${viewMode === "PUBLISHED" ? "border-[#4a45ff] text-[#4a45ff]" : "border-transparent text-[#536184] disabled:cursor-not-allowed disabled:opacity-80"}`}>PUBLISHED</button></div><div className="mt-11 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_354px]"><div className="rounded-md border border-[#e0e0e8] bg-white p-7 shadow-[0_2px_6px_rgba(34,34,60,0.08)]"><div className="grid gap-x-5 gap-y-8 sm:grid-cols-2">{fields.map(renderField)}</div></div><aside className="rounded-md border border-[#e0e0e8] bg-white p-4 shadow-[0_2px_6px_rgba(34,34,60,0.08)]"><p className="text-[11px] font-medium text-[#536184]">ENTRY</p><div className="mt-4 flex gap-2"><Button variant="outline" className="h-9 flex-1 border-[#d9d9e3] bg-[#e8e8ee] text-[#536184] hover:bg-[#dedee6]" disabled={disabled} onClick={() => save("PUBLISHED")}>Publish</Button><div className="relative"><Button variant="outline" size="icon" className="h-9 w-9 border-[#d9d9e3] bg-white text-[#536184]" aria-label="Entry actions" onClick={() => setMenu((open) => !open)}><MoreHorizontal className="size-4" /></Button>{menu ? <div className="absolute right-0 top-10 z-20 w-48 rounded-md border border-[#e0e0e8] bg-white p-1 text-sm shadow-lg">{status === "PUBLISHED" ? <><button type="button" className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-red-600 hover:bg-red-50" onClick={() => save("DRAFT")}><X className="size-4" />Unpublish</button><button type="button" className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-red-600 hover:bg-red-50" onClick={() => setPayload(JSON.parse(original.payload))}><X className="size-4" />Discard changes</button></> : <button type="button" className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-red-600 hover:bg-red-50" onClick={remove}><Trash2 className="size-4" />Delete entry</button>}</div> : null}</div></div><Button variant="outline" className="mt-2 h-9 w-full border-[#d9d9e3] bg-[#e8e8ee] text-[#536184] hover:bg-[#dedee6]" disabled={disabled} onClick={() => save("DRAFT")}><Save className="size-4" />Save</Button></aside></div></div></section>;
}

