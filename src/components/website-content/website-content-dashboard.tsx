"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Save, Settings2, MoreHorizontal, ExternalLink, Copy, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type WebsiteEntry = { id: string; contentType: string; sourceDocumentId: string; sourceId?: string | null; slug: string | null; title: string | null; status: string; sourceUpdatedAt: string | null; payload: unknown };
type PayloadRecord = Record<string, unknown>;
function payloadOf(entry: WebsiteEntry): PayloadRecord { return entry.payload && typeof entry.payload === "object" && !Array.isArray(entry.payload) ? entry.payload as PayloadRecord : {}; }
function textField(entry: WebsiteEntry, key: string) { const value = payloadOf(entry)[key]; return value == null ? String.fromCharCode(8212) : String(value); }

function EntryActions({ entry, contentType, onDelete, onDuplicate }: { entry: WebsiteEntry; contentType: string | null; onDelete: (entry: WebsiteEntry) => void; onDuplicate: (entry: WebsiteEntry) => void }) {
  const [open, setOpen] = React.useState(false);
  const href = `/dashboard/website-content/${entry.id}?type=${contentType ?? entry.contentType}`;
  return <div className="relative flex justify-end"><button type="button" aria-label="Entry actions" onClick={() => setOpen((value) => !value)} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><MoreHorizontal className="size-4" /></button>{open ? <div className="absolute right-0 top-8 z-20 w-44 rounded-md border bg-white p-1 text-sm shadow-lg"><Link href={href} className="flex items-center gap-2 rounded px-3 py-2 hover:bg-slate-50"><Pencil className="size-4 text-slate-500" />Edit</Link><a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded px-3 py-2 hover:bg-slate-50"><ExternalLink className="size-4 text-slate-500" />Open in new tab</a><button type="button" onClick={() => onDuplicate(entry)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-slate-50"><Copy className="size-4 text-slate-500" />Duplicate</button><button type="button" onClick={() => onDelete(entry)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-red-600 hover:bg-red-50"><Trash2 className="size-4" />Delete entry</button></div> : null}</div>;
}

function labelForType(type: string | null) { return type ? type.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "Website Content"; }

export function WebsiteContentDashboard() {
  const searchParams = useSearchParams();
  const contentType = searchParams.get("type");
  const collectionLabel = labelForType(contentType);
  const [entries, setEntries] = React.useState<WebsiteEntry[]>([]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<WebsiteEntry | null>(null);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [status, setStatus] = React.useState("DRAFT");
  const [payloadText, setPayloadText] = React.useState("{}");
  const [saving, setSaving] = React.useState(false);

  const loadEntries = React.useCallback(() => {
    const query = contentType ? `?contentType=${encodeURIComponent(contentType)}` : "";
    setLoading(true);
    fetch(`/api/admin/website-content${query}`).then((response) => response.json()).then((result) => setEntries(result.data ?? [])).finally(() => setLoading(false));
  }, [contentType]);
  React.useEffect(() => { loadEntries(); }, [loadEntries]);

  const filtered = entries.filter((entry) => {
    if (statusFilter !== "ALL" && entry.status !== statusFilter) return false;
    return [entry.title ?? "", entry.contentType, entry.slug ?? ""].join(" ").toLowerCase().includes(search.toLowerCase());
  });

  function openEditor(entry?: WebsiteEntry) {
    setEditing(entry ?? { id: "", contentType: contentType ?? "", sourceDocumentId: "", slug: null, title: "", status: "DRAFT", sourceUpdatedAt: null, payload: {} });
    setTitle(entry?.title ?? ""); setSlug(entry?.slug ?? ""); setStatus(entry?.status ?? "DRAFT"); setPayloadText(JSON.stringify(entry?.payload ?? {}, null, 2));
  }
  async function saveEntry() {
    if (!editing || !title.trim()) return;
    let payload: unknown;
    try { payload = JSON.parse(payloadText); } catch { window.alert("Content JSON is not valid."); return; }
    setSaving(true);
    const method = editing.id ? "PATCH" : "POST";
    const body = editing.id ? { id: editing.id, title, slug, status, payload } : { contentType: editing.contentType, title, slug, payload };
    const response = await fetch("/api/admin/website-content", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json(); setSaving(false);
    if (!response.ok) { window.alert(result.error ?? "Unable to save content."); return; }
    setEditing(null); setEntries((current) => editing.id ? current.map((entry) => entry.id === editing.id ? result.data : entry) : [result.data, ...current]);
  }

  const dynamicKeys = Array.from(new Set(filtered.flatMap((entry) => Object.keys(payloadOf(entry)).filter((key) => !["id","documentId","createdAt","updatedAt","publishedAt"].includes(key)))));
  const displayValue = (entry: WebsiteEntry, key: string) => { const value = payloadOf(entry)[key]; if (value == null) return String.fromCharCode(8212); if (typeof value === "object") { const url = (value as { url?: unknown }).url; return url ? String(url) : "Media"; } return String(value); };
  const renderValue = (entry: WebsiteEntry, key: string) => { const value = payloadOf(entry)[key]; const url = value && typeof value === "object" ? (value as { url?: unknown }).url : typeof value === "string" && /^(https?:\/\/|\/)/.test(value) ? value : null; return url && /image|logo|media|photo|thumbnail/i.test(key) ? <img src={String(url)} alt="" className="size-9 rounded object-contain" /> : <span className="block max-w-[25rem] truncate" title={displayValue(entry,key)}>{displayValue(entry,key)}</span>; };
  const columns: DataTableColumn<WebsiteEntry>[] = dynamicKeys.map((key) => ({ id: key, header: labelForType(key), cell: (entry) => renderValue(entry, key) }));
  columns.push({ id: "status", header: "Status", accessorKey: "status", cell: (entry) => <Badge variant={entry.status === "PUBLISHED" ? "default" : "secondary"}>{entry.status}</Badge> });
  columns.push({ id: "actions", header: "", cell: (entry) => <EntryActions entry={entry} contentType={contentType} onDelete={(item) => { if (window.confirm("Delete this entry?")) fetch(`/api/admin/website-content?id=${item.id}`, { method: "DELETE" }).then(() => loadEntries()); }} onDuplicate={(item) => fetch("/api/admin/website-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType: item.contentType, title: `Copy of ${item.title || "entry"}`, slug: item.slug ? `${item.slug}-copy` : null, payload: item.payload }) }).then(() => loadEntries())} /> });
  return <section className="min-h-full space-y-8 px-1 pb-10">
    <header className="flex items-start justify-between gap-6"><div><h1 className="text-3xl font-medium tracking-tight text-[#1f2c55]">{collectionLabel}</h1><p className="mt-4 text-base text-[#536184]">{loading ? "Loading entries…" : `${filtered.length} entries found`}</p></div><Button onClick={() => openEditor()} className="bg-[#4a45ff] hover:bg-[#3934db]"><Plus className="size-4" /> Create new entry</Button></header>
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="h-9 w-52 bg-white pl-9" /></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-md border bg-white px-3 text-sm"><option value="ALL">Filters</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></div><Button variant="outline" size="icon" aria-label="Collection settings"><Settings2 className="size-4 text-slate-500" /></Button></div>
    {filtered.length ? <DataTable columns={columns} data={filtered} getRowId={(entry) => entry.id} emptyMessage="No content found" /> : <div className="flex min-h-[350px] flex-col items-center justify-center rounded-md border bg-white shadow-sm"><img src="/empty-documents.svg" alt="" aria-hidden="true" className="mb-5 h-[121px] w-[217px] object-contain" /><p className="text-lg text-[#536184]">No content found</p><Button variant="outline" onClick={() => openEditor()} className="mt-5 border-[#d9d7ff] text-[#4a45ff]"><Plus className="size-4" /> Create new entry</Button></div>}
    <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{editing?.id ? "Edit entry" : "Create new entry"}</DialogTitle><DialogDescription>{collectionLabel} · save a draft or publish this entry.</DialogDescription></DialogHeader><div className="grid gap-4"><label className="grid gap-2 text-sm font-medium">Title<input value={title} onChange={(event) => setTitle(event.target.value)} className="h-10 rounded-md border bg-background px-3" /></label><label className="grid gap-2 text-sm font-medium">Slug<input value={slug} onChange={(event) => setSlug(event.target.value)} className="h-10 rounded-md border bg-background px-3" /></label><label className="grid gap-2 text-sm font-medium">Content JSON<Textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} className="min-h-[300px] font-mono text-xs" /></label>{editing?.id ? <label className="grid gap-2 text-sm font-medium">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border bg-background px-3"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label> : null}</div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveEntry} disabled={saving || !title.trim()}><Save className="size-4" /> {saving ? "Saving…" : "Save entry"}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}


