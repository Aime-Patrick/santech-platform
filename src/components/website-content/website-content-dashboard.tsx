"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Trash2,
  Pencil,
  FileText,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCreateWebsiteEntry,
  useDeleteWebsiteEntry,
  useWebsiteEntries,
} from "@/features/website-content";

// ─── Types ───────────────────────────────────────────────────────────────────

type WebsiteEntry = {
  id: string;
  contentType: string;
  sourceDocumentId: string;
  sourceId?: string | null;
  slug: string | null;
  title: string | null;
  status: string;
  sourceUpdatedAt: string | null;
  payload: unknown;
};

type PayloadRecord = Record<string, unknown>;

function payloadOf(entry: WebsiteEntry): PayloadRecord {
  return entry.payload && typeof entry.payload === "object" && !Array.isArray(entry.payload)
    ? (entry.payload as PayloadRecord)
    : {};
}

function labelForType(type: string | null) {
  return type
    ? type.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")
    : "Website Content";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "PUBLISHED")
    return (
      <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Published
      </span>
    );
  if (status === "ARCHIVED")
    return (
      <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        Archived
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      Draft
    </span>
  );
}

// ─── Row Actions Dropdown ─────────────────────────────────────────────────────

function EntryActions({
  entry,
  contentType,
  openId,
  setOpenId,
  onDelete,
  onDuplicate,
}: {
  entry: WebsiteEntry;
  contentType: string | null;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onDelete: (entry: WebsiteEntry) => void;
  onDuplicate: (entry: WebsiteEntry) => void;
}) {
  const isOpen = openId === entry.id;
  const href = `/dashboard/website-content/${entry.id}?type=${contentType ?? entry.contentType}`;

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => setOpenId(open ? entry.id : null)}
    >
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Actions for ${entry.title ?? "entry"}`}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreHorizontal className="size-4" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          render={<Link href={href} />}
          className="gap-2.5 px-3 py-2 text-slate-700"
        >
          <Pencil className="size-3.5 text-slate-400" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<a href={href} target="_blank" rel="noreferrer" />}
          className="gap-2.5 px-3 py-2 text-slate-700"
        >
          <ExternalLink className="size-3.5 text-slate-400" />
          Open in new tab
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDuplicate(entry)}
          className="gap-2.5 px-3 py-2 text-slate-700"
        >
          <Copy className="size-3.5 text-slate-400" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(entry)}
          className="gap-2.5 px-3 py-2"
        >
          <Trash2 className="size-3.5" />
          Delete entry
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ label, onCreate }: { label: string; onCreate: () => void }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-slate-100">
        <FileText className="size-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">No {label.toLowerCase()} entries yet</p>
      <p className="mt-1 text-xs text-slate-400">Create your first entry to get started.</p>
      <Button
        onClick={onCreate}
        variant="outline"
        size="sm"
        className="mt-5 border-[#d9d7ff] text-[#4a45ff] hover:bg-[#f0efff]"
      >
        <Plus className="size-3.5" />
        Create entry
      </Button>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-slate-50 px-4 py-3 last:border-0">
          <div className="h-3.5 w-48 animate-pulse rounded bg-slate-100" />
          <div className="h-3.5 w-24 animate-pulse rounded bg-slate-100" />
          <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function WebsiteContentDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentType = searchParams.get("type");
  const collectionLabel = labelForType(contentType);

  const entriesQuery = useWebsiteEntries(contentType);
  const entries = entriesQuery.data?.data ?? [];
  const createMutation = useCreateWebsiteEntry();
  const deleteMutation = useDeleteWebsiteEntry();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [openId, setOpenId] = React.useState<string | null>(null);

  // ── Filter ──────────────────────────────────────────────────────────────
  const filtered = entries.filter((entry) => {
    if (statusFilter !== "ALL" && entry.status !== statusFilter) return false;
    return [entry.title ?? "", entry.contentType, entry.slug ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  // ── Create new entry → navigate straight to editor ──────────────────────
  const isSiteSetting = contentType === "site-setting";
  const isCertificate = contentType === "certificate";

  function handleCreate() {
    const defaultPayload = isSiteSetting
      ? {
          siteName: "SAN TECH",
          siteTitle: "SAN TECH | Technology. Innovation. Impact.",
          siteDescription:
            "SAN TECH builds technology, skills, and innovation systems for a more connected Africa.",
          homepageVideo: null,
          homepageVideoPoster: null,
          eVisitorsVideo: null,
          eVisitorsVideoPoster: null,
          logo: null,
          favicon: null,
          calendlyUrl: "",
          companyProfilePdf: null,
        }
      : isCertificate
        ? {
            title: "New certificate",
            issuer: "",
            owner: "SAN TECH",
            ownerType: "company",
            description: "",
            orientation: "portrait",
            image: null,
            imageAlt: "",
            file: null,
          }
        : {};

    createMutation.mutate(
      {
        contentType: contentType ?? "page",
        title: isSiteSetting ? "SAN TECH Site Settings" : isCertificate ? "New certificate" : "New entry",
        slug: isSiteSetting ? "site-settings" : null,
        payload: defaultPayload,
        status: isSiteSetting ? "PUBLISHED" : "DRAFT",
      },
      {
        onSuccess(result) {
          router.push(
            `/dashboard/website-content/${result.data.id}?type=${contentType ?? "page"}`
          );
        },
      }
    );
  }

  // ── Duplicate ────────────────────────────────────────────────────────────
  function handleDuplicate(entry: WebsiteEntry) {
    createMutation.mutate(
      {
        contentType: entry.contentType,
        title: "Copy of " + (entry.title ?? "entry"),
        slug: entry.slug ? entry.slug + "-copy" : null,
        payload: entry.payload,
        status: "DRAFT",
      },
      {
        onSuccess(result) {
          router.push(
            `/dashboard/website-content/${result.data.id}?type=${entry.contentType}`
          );
        },
      }
    );
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  function handleDelete(entry: WebsiteEntry) {
    if (!window.confirm(`Delete "${entry.title ?? "this entry"}"? This cannot be undone.`)) return;
    deleteMutation.mutate(entry.id);
  }

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: DataTableColumn<WebsiteEntry>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      cell: (entry) => (
        <Link
          href={`/dashboard/website-content/${entry.id}?type=${contentType ?? entry.contentType}`}
          className="font-medium text-slate-900 hover:text-[#4a45ff]"
        >
          {entry.title ?? <span className="italic text-slate-400">Untitled</span>}
        </Link>
      ),
    },
    {
      id: "slug",
      header: "Slug",
      accessorKey: "slug",
      cell: (entry) => (
        <span className="font-mono text-xs text-slate-500">{entry.slug ?? "—"}</span>
      ),
    },
    {
      id: "updatedAt",
      header: "Last updated",
      accessorKey: "sourceUpdatedAt",
      cell: (entry) => (
        <span className="text-sm text-slate-500">{formatDate(entry.sourceUpdatedAt)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (entry) => <StatusBadge status={entry.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: (entry) => (
        <EntryActions
          entry={entry}
          contentType={contentType}
          openId={openId}
          setOpenId={setOpenId}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <section className="min-h-full space-y-6 pb-10">
      {/* Header */}
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1f2c55]">
            {collectionLabel}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {entriesQuery.isLoading
              ? "Loading…"
              : `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`}
          </p>
        </div>

        <Button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="bg-[#4a45ff] text-white shadow-sm hover:bg-[#3934db] disabled:opacity-60"
        >
          <Plus className="size-4" />
          {createMutation.isPending ? "Creating…" : "New entry"}
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries…"
            className="h-9 w-56 rounded-lg border-slate-200 bg-white pl-9 text-sm placeholder:text-slate-400 focus-visible:ring-[#4a45ff]/30"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4a45ff]/30"
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <div className="ml-auto">
          <Button
            variant="outline"
            size="icon"
            aria-label="Collection settings"
            className="size-9 rounded-lg border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            <Settings2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Table / skeleton / empty */}
      {entriesQuery.isLoading ? (
        <TableSkeleton />
      ) : filtered.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <DataTable
            columns={columns}
            data={filtered}
            getRowId={(entry) => entry.id}
            emptyMessage="No content found"
          />
        </div>
      ) : (
        <EmptyState label={collectionLabel} onCreate={handleCreate} />
      )}
    </section>
  );
}
