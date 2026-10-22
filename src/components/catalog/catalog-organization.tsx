"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTaxonomy, useDeleteTaxonomy, useTaxonomy, useUpdateTaxonomy } from "@/features/catalog";
import type { TaxonomyItem, TaxonomyType } from "@/features/catalog/api/taxonomy-api";

const tabs: Array<{ type: TaxonomyType; label: string }> = [{ type: "category", label: "Categories" }, { type: "skill", label: "Skills" }, { type: "tool", label: "Tools" }];
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export function CatalogOrganization() {
  const [type, setType] = React.useState<TaxonomyType>("category");
  const { data, isLoading } = useTaxonomy(type);
  const createMutation = useCreateTaxonomy();
  const updateMutation = useUpdateTaxonomy();
  const deleteMutation = useDeleteTaxonomy();
  const [dialog, setDialog] = React.useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = React.useState<TaxonomyItem | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function openCreate() { setEditing(null); setName(""); setSlug(""); setError(null); setDialog("create"); }
  function openEdit(item: TaxonomyItem) { setEditing(item); setName(item.name); setSlug(item.slug); setError(null); setDialog("edit"); }
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const cleanName = name.trim(); const cleanSlug = (slug.trim() || slugify(cleanName)); if (!cleanName) return; setError(null); if (editing) updateMutation.mutate({ type, id: editing.id, input: { name: cleanName, slug: cleanSlug } }, { onSuccess: () => setDialog(null), onError: (e) => setError(e.message) }); else createMutation.mutate({ type, input: { name: cleanName, slug: cleanSlug } }, { onSuccess: () => setDialog(null), onError: (e) => setError(e.message) }); }
  function remove(item: TaxonomyItem) { if (!window.confirm(`Delete ${item.name}? Items in use cannot be deleted.`)) return; deleteMutation.mutate({ type, id: item.id }, { onError: (e) => setError(e.message) }); }

  const columns: DataTableColumn<TaxonomyItem>[] = [
    { id: "name", header: "Name", accessorKey: "name", sortable: true, cell: (item) => <div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">/{item.slug}</p></div> },
    { id: "category", header: "Group", accessorKey: "category", cell: (item) => item.category ?? "—" },
    { id: "status", header: "Status", accessorKey: "status", sortable: true, cell: (item) => <Badge variant={item.status === "PUBLISHED" ? "default" : "secondary"}>{item.status ?? "DRAFT"}</Badge> },
    { id: "actions", header: "", align: "right", cell: (item) => <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${item.name}`}><MoreHorizontal className="size-4" /></Button>} /><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEdit(item)}><Pencil className="size-4" /> Edit</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => remove(item)}><Trash2 className="size-4" /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu> },
  ];

  return <section className="space-y-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">Catalog organization</h1><p className="mt-1 text-sm text-muted-foreground">Manage categories, skills, and tools used by catalog editors.</p></div><Button onClick={openCreate}><Plus className="size-4" /> Add {type}</Button></div><div className="flex flex-wrap gap-2">{tabs.map((tab) => <Button key={tab.type} type="button" size="sm" variant={type === tab.type ? "default" : "outline"} onClick={() => { setType(tab.type); setError(null); }}>{tab.label}</Button>)}</div><DataTable data={data?.data ?? []} columns={columns} getRowId={(item) => item.id} searchKey="name" searchPlaceholder={`Search ${type}s...`} pagination pageSize={10} pageSizeOptions={[10, 20, 50]} showPageSizeSelector variant="card" isLoading={isLoading} emptyMessage={`No ${type}s found.`} />{error ? <p className="text-sm text-destructive">{error}</p> : null}<Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} {type}</DialogTitle><DialogDescription>{editing ? "Update this catalog organization item." : "Create a controlled item for catalog editors."}</DialogDescription></DialogHeader><form onSubmit={submit} className="grid gap-4"><label className="grid gap-2"><Label htmlFor="organization-name">Name</Label><Input id="organization-name" value={name} onChange={(event) => { setName(event.target.value); if (!editing) setSlug(slugify(event.target.value)); }} required /></label><label className="grid gap-2"><Label htmlFor="organization-slug">Slug</Label><Input id="organization-slug" value={slug} onChange={(event) => setSlug(event.target.value)} required /></label>{error ? <p className="text-sm text-destructive">{error}</p> : null}<Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? (updateMutation.isPending ? "Saving…" : "Save changes") : (createMutation.isPending ? "Adding…" : `Add ${type}`)}</Button></form></DialogContent></Dialog></section>;
}