"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useCreateTaxonomy, useTaxonomy } from "@/features/catalog";
import type { TaxonomyType } from "@/features/catalog/api/taxonomy-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const tabs: Array<{ type: TaxonomyType; label: string }> = [
  { type: "category", label: "Categories" },
  { type: "skill", label: "Skills" },
  { type: "tool", label: "Tools" },
];

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export function CatalogTaxonomyPanel() {
  const [type, setType] = React.useState<TaxonomyType>("category");
  const { data, isLoading } = useTaxonomy(type);
  const createMutation = useCreateTaxonomy();
  const [name, setName] = React.useState("");
  const [showCreate, setShowCreate] = React.useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    createMutation.mutate({ type, input: { name: cleanName, slug: slugify(cleanName) } }, { onSuccess: () => { setName(""); setShowCreate(false); } });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Catalog taxonomy</CardTitle><CardDescription>Manage the controlled categories, skills, and tools used by catalog editors.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">{tabs.map((tab) => <Button key={tab.type} type="button" size="sm" variant={type === tab.type ? "default" : "outline"} onClick={() => setType(tab.type)}>{tab.label}</Button>)}</div>
        <Button type="button" onClick={() => setShowCreate(true)}><Plus className="size-4" /> Add {type}</Button><Dialog open={showCreate} onOpenChange={setShowCreate}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add {type}</DialogTitle><DialogDescription>Create a controlled {type} for catalog editors.</DialogDescription></DialogHeader><form onSubmit={submit} className="grid gap-4"><label className="grid gap-2"><Label htmlFor="taxonomy-name">Name</Label><Input id="taxonomy-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={`e.g. ${type === "category" ? "Data & AI" : type === "skill" ? "Data analysis" : "Excel"}`} required /></label><Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Adding…" : "Add"}</Button></form>{createMutation.isError ? <p className="text-sm text-destructive">{createMutation.error.message}</p> : null}</DialogContent></Dialog>
        {createMutation.isError ? <p className="text-sm text-destructive">{createMutation.error.message}</p> : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Loading {type}s…</p> : <div className="flex flex-wrap gap-2">{(data?.data ?? []).map((item) => <span key={item.id} className="rounded-full border bg-muted/40 px-3 py-1 text-xs">{item.name}</span>)}{data?.data.length === 0 ? <p className="text-sm text-muted-foreground">No {type}s configured yet.</p> : null}</div>}
      </CardContent>
    </Card>
  );
}
