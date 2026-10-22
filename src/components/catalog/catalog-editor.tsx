"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { useCatalogOptions, useUpdateCatalogItem } from "@/features/catalog";
import type { CatalogItem, CatalogItemInput } from "@/features/catalog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function jsonText(value: unknown) {
  return value == null ? "[]" : JSON.stringify(value, null, 2);
}

function parseArray(value: string) {
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error("Presentation fields must be JSON arrays.");
  return parsed;
}

export function CatalogEditor({ item, onClose }: { item: CatalogItem; onClose: () => void }) {
  const updateMutation = useUpdateCatalogItem();
  const { data: options } = useCatalogOptions();
  const [title, setTitle] = React.useState(item.title);
  const [slug, setSlug] = React.useState(item.slug);
  const [category, setCategory] = React.useState(item.category);
  const [categoryId, setCategoryId] = React.useState(item.categoryId ?? "");
  const [skillIds, setSkillIds] = React.useState<string[]>(item.skills?.map((entry) => entry.skill.id) ?? []);
  const [toolIds, setToolIds] = React.useState<string[]>(item.tools?.map((entry) => entry.tool.id) ?? []);
  const [description, setDescription] = React.useState(item.description ?? "");
  const [provider, setProvider] = React.useState(item.provider ?? "");
  const [durationLabel, setDurationLabel] = React.useState(item.durationLabel ?? "");
  const [status, setStatus] = React.useState(item.status);
  const [stats, setStats] = React.useState(jsonText(item.stats));
  const [learningOutcomes, setLearningOutcomes] = React.useState(jsonText(item.learningOutcomes));
  const [details, setDetails] = React.useState(jsonText(item.details));
  const [error, setError] = React.useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const input: CatalogItemInput & { id: string } = {
        id: item.id,
        title: title.trim(),
        slug: slug.trim(),
        category: category.trim(),
        categoryId: categoryId || null,
        skillIds,
        toolIds,
        description: description.trim() || null,
        provider: provider.trim() || null,
        durationLabel: durationLabel.trim() || null,
        status,
        stats: parseArray(stats),
        learningOutcomes: parseArray(learningOutcomes),
        details: parseArray(details),
      };
      setError(null);
      updateMutation.mutate(input, { onSuccess: onClose, onError: (mutationError) => setError(mutationError.message) });
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Check the presentation JSON.");
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>Edit catalog item</DialogTitle><DialogDescription>Update content, workflow state, and ordered presentation blocks.</DialogDescription></DialogHeader>

        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2"><Label htmlFor="edit-title">Title</Label><Input id="edit-title" value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label className="grid gap-2"><Label htmlFor="edit-slug">Slug</Label><Input id="edit-slug" value={slug} onChange={(event) => setSlug(event.target.value)} required /></label>
          <label className="grid gap-2"><Label htmlFor="edit-category">Category</Label>{options?.categories.length ? <select id="edit-category" value={categoryId} onChange={(event) => { const selected = options.categories.find((entry) => entry.id === event.target.value); setCategoryId(event.target.value); setCategory(selected?.name ?? category); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm" required><option value="">Select category</option>{options.categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select> : <Input id="edit-category" value={category} onChange={(event) => setCategory(event.target.value)} required />}</label>
          <label className="grid gap-2"><Label htmlFor="edit-provider">Provider</Label><Input id="edit-provider" value={provider} onChange={(event) => setProvider(event.target.value)} /></label>
          <fieldset className="grid gap-2"><legend className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0a1f44]">Skills</legend><div className="grid max-h-32 gap-2 overflow-y-auto rounded-md border border-input p-3 sm:grid-cols-2">{options?.skills.length ? options.skills.map((entry) => <label key={entry.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={skillIds.includes(entry.id)} onChange={(event) => setSkillIds((current) => event.target.checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))} />{entry.name}</label>) : <span className="text-xs text-muted-foreground">No skills configured.</span>}</div></fieldset>
          <fieldset className="grid gap-2"><legend className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0a1f44]">Tools</legend><div className="grid max-h-32 gap-2 overflow-y-auto rounded-md border border-input p-3 sm:grid-cols-2">{options?.tools.length ? options.tools.map((entry) => <label key={entry.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={toolIds.includes(entry.id)} onChange={(event) => setToolIds((current) => event.target.checked ? [...current, entry.id] : current.filter((id) => id !== entry.id))} />{entry.name}</label>) : <span className="text-xs text-muted-foreground">No tools configured.</span>}</div></fieldset>          <label className="grid gap-2"><Label htmlFor="edit-duration">Duration label</Label><Input id="edit-duration" value={durationLabel} onChange={(event) => setDurationLabel(event.target.value)} placeholder="1–2 months" /></label>
          <label className="grid gap-2 lg:col-span-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="grid gap-2"><Label htmlFor="edit-status">Status</Label><select id="edit-status" value={status} onChange={(event) => setStatus(event.target.value as CatalogItem["status"])} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
          <label className="grid gap-2"><Label htmlFor="edit-stats">Stats JSON</Label><Textarea id="edit-stats" value={stats} onChange={(event) => setStats(event.target.value)} className="font-mono text-xs" /></label>
          <label className="grid gap-2"><Label htmlFor="edit-outcomes">Learning outcomes JSON</Label><Textarea id="edit-outcomes" value={learningOutcomes} onChange={(event) => setLearningOutcomes(event.target.value)} className="font-mono text-xs" /></label>
          <label className="grid gap-2"><Label htmlFor="edit-details">Details JSON</Label><Textarea id="edit-details" value={details} onChange={(event) => setDetails(event.target.value)} className="font-mono text-xs" /></label>
          {error ? <p className="lg:col-span-2 text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 lg:col-span-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={updateMutation.isPending}><Save className="size-4" />{updateMutation.isPending ? "Saving…" : "Save changes"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
