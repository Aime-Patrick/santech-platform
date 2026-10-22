"use client";

import * as React from "react";
import { Archive, BookOpen, Grid2X2, List, MoreHorizontal, Pencil, Plus, Search, X } from "lucide-react";
import { useArchiveCatalogItem, useCatalogItems, useCreateCatalogItem } from "@/features/catalog";
import { CatalogEditor } from "@/components/catalog/catalog-editor";
import { CatalogTaxonomyPanel } from "@/components/catalog/catalog-taxonomy-panel";
import type { CatalogItem } from "@/features/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statuses = ["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"] as const;
type StatusFilter = (typeof statuses)[number];

function statusVariant(status: CatalogItem["status"]) {
  if (status === "PUBLISHED") return "default" as const;
  if (status === "ARCHIVED") return "destructive" as const;
  return "secondary" as const;
}

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CatalogDashboard() {
  const { data, isLoading, isError, error } = useCatalogItems();
  const createMutation = useCreateCatalogItem();
  const archiveMutation = useArchiveCatalogItem();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("ALL");
  const [showCreate, setShowCreate] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Courses");
  const [editingItem, setEditingItem] = React.useState<CatalogItem | null>(null);
  const [view, setView] = React.useState<"grid" | "table">("table");

  const items = data?.data ?? [];
  const filteredItems = items.filter((item) => {
    if (status !== "ALL" && item.status !== status) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [item.title, item.slug, item.category, item.provider ?? ""].some((value) => value.toLowerCase().includes(query));
  });

  const tableColumns: DataTableColumn<CatalogItem>[] = [
    { id: "sortOrder", header: "#", accessorKey: "sortOrder", sortable: true, className: "w-16 text-muted-foreground", headerClassName: "w-16" },
    { id: "title", header: "Title", sortable: true, cell: (item) => <div className="min-w-0"><p className="truncate font-medium">{item.title}</p><p className="truncate text-xs text-muted-foreground">/{item.slug}</p></div> },
    { id: "category", header: "Category", accessorKey: "category", sortable: true },
    { id: "provider", header: "Provider", accessorKey: "provider", sortable: true, cell: (item) => item.provider ?? "—" },
    { id: "status", header: "Status", accessorKey: "status", sortable: true, cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status}</Badge> },
    { id: "actions", header: "", align: "right", cell: (item) => <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${item.title}`}><MoreHorizontal className="size-4" /></Button>} /><DropdownMenuContent align="end" className="w-36"><DropdownMenuItem onClick={() => setEditingItem(item)}><Pencil className="size-4" /> Edit</DropdownMenuItem><DropdownMenuItem disabled={archiveMutation.isPending || item.status === "ARCHIVED"} onClick={() => archiveMutation.mutate(item.id)}><Archive className="size-4" /> Archive</DropdownMenuItem></DropdownMenuContent></DropdownMenu> },
  ];
  function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    createMutation.mutate({ title: cleanTitle, slug: toSlug(cleanTitle), category, status: "DRAFT" }, {
      onSuccess: () => { setTitle(""); setShowCreate(false); },
    });
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Content catalog"
        description="Manage public SAN HUB offerings with drafts, publishing status, ordering, and safe archival."
        actions={<Button onClick={() => setShowCreate((value) => !value)}><Plus className="size-4" /> New catalog item</Button>}
      />

      {editingItem ? <CatalogEditor item={editingItem} onClose={() => setEditingItem(null)} /> : null}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Create catalog item</DialogTitle><DialogDescription>New items start as drafts and can be enriched before publishing.</DialogDescription></DialogHeader>
          <form onSubmit={submitCreate} className="grid gap-5">
            <label className="grid gap-2"><Label htmlFor="catalog-title">Title</Label><Input id="catalog-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Advanced Excel & AI Tools" className="h-11" required /><span className="text-xs text-muted-foreground">The URL slug will be generated automatically.</span></label>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="grid gap-2"><Label htmlFor="catalog-category">Category</Label><select id="catalog-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm"><option>Courses</option><option>Programs</option><option>Upcoming training</option><option>Events</option><option>Innovation programs</option></select></label>
              <Button type="submit" className="h-11 sm:min-w-32" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating…" : "Create draft"}</Button>
            </div>
          </form>
          {createMutation.isError ? <p className="text-sm text-destructive">{createMutation.error.message}</p> : null}
        </DialogContent>
      </Dialog>


      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-muted-foreground"><BookOpen className="size-4" /> <span>{filteredItems.length} items</span></div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, category, provider…" className="pl-8 pr-8" />{search ? <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="size-4" /></button> : null}</div>
          <div className="flex shrink-0 items-center gap-1 rounded-lg border bg-background p-1" role="group" aria-label="Catalog view">
            <Button type="button" size="sm" variant={view === "grid" ? "secondary" : "ghost"} aria-pressed={view === "grid"} onClick={() => setView("grid")}><Grid2X2 className="size-4" /><span className="sr-only sm:not-sr-only">Grid</span></Button>
            <Button type="button" size="sm" variant={view === "table" ? "secondary" : "ghost"} aria-pressed={view === "table"} onClick={() => setView("table")}><List className="size-4" /><span className="sr-only sm:not-sr-only">Table</span></Button>
          </div>
        </div>
      </div>
      {isLoading ? <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Loading catalog…</div> : null}
      {isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">Unable to load the catalog: {error.message}</div> : null}
      {!isLoading && !isError && items.length === 0 ? <EmptyState icon={BookOpen} title="No catalog items yet" description="Create the first draft to begin migrating SAN HUB content." /> : null}
      {!isLoading && !isError && items.length > 0 && filteredItems.length === 0 ? <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">No catalog items match the current filter.</div> : null}
      {view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => <Card key={item.id} className="flex flex-col"><CardHeader><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate">{item.title}</CardTitle><CardDescription className="mt-1 truncate">/{item.slug}</CardDescription></div><Badge variant={statusVariant(item.status)}>{item.status}</Badge></div></CardHeader><CardContent className="flex flex-1 flex-col gap-3"><div className="grid grid-cols-2 gap-3 text-xs"><div><p className="text-muted-foreground">Category</p><p className="mt-1 font-medium">{item.category}</p></div><div><p className="text-muted-foreground">Provider</p><p className="mt-1 font-medium">{item.provider ?? "—"}</p></div></div><div className="mt-auto flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>Edit</Button><Button variant="ghost" size="sm" disabled={archiveMutation.isPending || item.status === "ARCHIVED"} onClick={() => archiveMutation.mutate(item.id)}><Archive className="size-4" /> Archive</Button></div></CardContent></Card>)}
        </div>
      ) : (
        <DataTable
          data={filteredItems}
          columns={tableColumns}
          getRowId={(item) => item.id}
          pagination
          defaultPage={1}
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
          showPageSizeSelector
          showTotalCount
          variant="card"
          emptyMessage="No catalog items match the current filters."
        />
      )}
    </section>
  );
}
