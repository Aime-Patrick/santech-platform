"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Globe,
  Save,
  Trash2,
  X,
  Eye,
  FilePen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssetPicker } from "@/components/website-content/asset-picker";
import { useDeleteWebsiteEntry, useUpdateWebsiteEntry, useWebsiteEntry } from "@/features/website-content";
import { useAdminAppointments, usePublishAdminAppointment } from "@/features/appointments/hooks/use-appointments";

function AppointmentLinkField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const appointmentsQuery = useAdminAppointments();
  const publishMutation = usePublishAdminAppointment();
  const schedules = appointmentsQuery.data?.data ?? [];
  const [selectedSlug, setSelectedSlug] = React.useState("");
  React.useEffect(() => {
    const slugMatch = value.match(/\/book\/([^/?#]+)/);
    try {
      setSelectedSlug(slugMatch?.[1] ? decodeURIComponent(slugMatch[1]) : "");
    } catch {
      setSelectedSlug("");
    }
  }, [value]);
  const selectedSchedule = schedules.find((schedule) => schedule.slug === selectedSlug);
  const externalUrl = selectedSchedule ? "" : value;

  return (
    <div className="grid gap-2 sm:col-span-2">
      <span className="text-xs font-medium text-slate-700">Public appointment link</span>
      <select
        value={selectedSchedule?.slug ?? ""}
        disabled={disabled || appointmentsQuery.isLoading}
        onChange={(event) => {
          const schedule = schedules.find((item) => item.slug === event.target.value);
          setSelectedSlug(schedule?.slug ?? "");
          onChange(schedule?.status === "PUBLISHED"
            ? `${window.location.origin}/book/${encodeURIComponent(schedule.slug)}`
            : "");
        }}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#7b79ff] focus:ring-2 focus:ring-[#d9d8ff] disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">{appointmentsQuery.isLoading ? "Loading appointment schedules…" : "Select a schedule"}</option>
        {schedules.map((schedule) => (
          <option key={schedule.id} value={schedule.slug} disabled={schedule.status === "ARCHIVED"}>
            {schedule.title}{schedule.status === "DRAFT" ? " — draft" : schedule.status === "ARCHIVED" ? " — archived" : ""}
          </option>
        ))}
      </select>
      {selectedSchedule?.status === "DRAFT" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="text-xs text-amber-900">This schedule is a draft. Publish it to make its booking link public.</p>
          <Button
            type="button"
            size="sm"
            disabled={disabled || publishMutation.isPending}
            onClick={() => publishMutation.mutate(selectedSchedule.id, {
              onSuccess: ({ data: published }) => {
                setSelectedSlug(published.slug);
                onChange(`${window.location.origin}/book/${encodeURIComponent(published.slug)}`);
              },
            })}
          >
            {publishMutation.isPending ? "Publishing…" : "Publish and select"}
          </Button>
        </div>
      ) : null}
      <Input
        type="url"
        value={externalUrl}
        disabled={disabled}
        onChange={(event) => {
          setSelectedSlug("");
          onChange(event.target.value);
        }}
        placeholder="Or enter an external booking URL"
        aria-label="External appointment booking URL"
        className="h-10"
      />
      {appointmentsQuery.isError ? (
        <p role="alert" className="text-xs text-red-600">
          Appointment schedules could not be loaded. You can still enter an external booking URL.
        </p>
      ) : schedules.filter((schedule) => schedule.status === "PUBLISHED").length === 0 ? (
        <p className="text-xs text-slate-500">
          No published schedules yet. Create and publish one in Appointments, then select it here.
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Select a published platform schedule or use an external booking link.
        </p>
      )}
      {publishMutation.isError ? (
        <p role="alert" className="text-xs text-red-600">{publishMutation.error.message}</p>
      ) : null}
    </div>
  );
}

// ─── Types & Helpers ─────────────────────────────────────────────────────────

type Entry = {
  id: string;
  contentType: string;
  sourceDocumentId: string;
  title: string | null;
  slug: string | null;
  status: string;
  payload: Record<string, unknown>;
  sourceUpdatedAt: string | null;
};

const hidden = new Set([
  "id", "documentId", "createdAt", "updatedAt", "publishedAt",
  "bookId", "pageLabel", "readerUrl",
]);

const fieldLabel = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const requiredFields = new Set(["label", "description", "title", "year", "stage", "name", "value", "issuer", "image", "orientation"]);
const isVideoField = (key: string) => /video/i.test(key) && !/poster|image|thumbnail/i.test(key);
const isMediaField = (key: string) =>
  /(image|logo|media|photo|thumbnail|video|poster|favicon|pdf|document|^file$)/i.test(key);

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "PUBLISHED")
    return (
      <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        Published
      </span>
    );
  if (status === "ARCHIVED")
    return (
      <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        Archived
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      Draft
    </span>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

// ─── Editor ───────────────────────────────────────────────────────────────────

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
  const [viewMode, setViewMode] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [certificatePublishError, setCertificatePublishError] = React.useState("");

  // Dropdown state
  const [saveMenuOpen, setSaveMenuOpen] = React.useState(false);
  const saveMenuRef = React.useRef<HTMLDivElement>(null);
  useOutsideClick(saveMenuRef, () => setSaveMenuOpen(false));

  // Populate from query
  React.useEffect(() => {
    const nextEntry = entryQuery.data?.data?.[0] as Entry | undefined;
    if (!nextEntry) return;

    const nextTitle =
      nextEntry.title ??
      String(
        nextEntry.payload?.label ??
        nextEntry.payload?.stage ??
        nextEntry.payload?.year ??
        nextEntry.payload?.title ??
        "Untitled entry"
      );

    const nextPayload = { ...(nextEntry.payload ?? {}) };

    if (nextEntry.contentType === "site-setting") {
      const defaults: Record<string, unknown> = {
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
      };
      for (const [key, val] of Object.entries(defaults)) {
        if (!(key in nextPayload)) nextPayload[key] = val;
      }
    }

    if (nextEntry.contentType === "certificate") {
      const defaults: Record<string, unknown> = {
        title: "New certificate",
        issuer: "",
        owner: "SAN TECH",
        ownerType: "company",
        description: "",
        orientation: "portrait",
        image: null,
        imageAlt: "",
        file: null,
      };
      for (const [key, val] of Object.entries(defaults)) {
        if (!(key in nextPayload)) nextPayload[key] = val;
      }
    }

    setEntry(nextEntry as Entry);
    setPayload(nextPayload);
    setTitle(nextTitle);
    setSlug(nextEntry.slug ?? "");
    setStatus(nextEntry.status ?? "DRAFT");
    setOriginal({ title: nextTitle, slug: nextEntry.slug ?? "", payload: JSON.stringify(nextPayload) });
  }, [entryQuery.data]);

  const dirty =
    title !== original.title ||
    slug !== original.slug ||
    JSON.stringify(payload) !== original.payload;

  const readOnly = viewMode === "PUBLISHED";
  const saving = updateMutation.isPending || deleteMutation.isPending;

  // ── Actions ────────────────────────────────────────────────────────────────

  function save(nextStatus: string) {
    if (!entry) return;
    if (entry.contentType === "certificate" && nextStatus === "PUBLISHED") {
      const required = ["title", "issuer", "description", "image"];
      const missing = required.filter((key) => !String(payload[key] ?? "").trim());
      if (missing.length > 0) {
        setCertificatePublishError("Add the certificate title, issuer, description, and image before publishing.");
        return;
      }
    }
    setCertificatePublishError("");
    const generatedPayload = { ...payload };
    Object.keys(generatedPayload)
      .filter((key) => isMediaField(key) && key !== "file")
      .forEach((key) => {
        if (generatedPayload[key] && !isVideoField(key))
          generatedPayload[key + "Alt"] = title.trim() || fieldLabel(key);
      });
    updateMutation.mutate(
      { id: entry.id, title: title.trim() || "Untitled entry", slug, payload: generatedPayload, status: nextStatus },
      {
        onSuccess: (result) => {
          setEntry(result.data as Entry);
          setPayload(generatedPayload);
          setStatus(result.data.status);
          setOriginal({ title: title.trim() || "Untitled entry", slug, payload: JSON.stringify(generatedPayload) });
          setSaveMenuOpen(false);
        },
      }
    );
  }

  function remove() {
    if (!entry || !window.confirm(`Delete "${entry.title ?? "this entry"}"? This cannot be undone.`)) return;
    deleteMutation.mutate(entry.id, { onSuccess: () => router.back() });
  }

  // ── Loading / error states ─────────────────────────────────────────────────

  if (entryQuery.isLoading)
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-slate-500">Loading entry…</div>
      </div>
    );
  if (!entry)
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-slate-500">{entryQuery.error?.message ?? "Entry not found."}</div>
      </div>
    );

  // ── Field helpers ──────────────────────────────────────────────────────────

  const maxLength = (key: string) =>
    /description|body|content/i.test(key) ? 400
    : /slug|label|title|name|stage/i.test(key) ? 100
    : /imageAlt/i.test(key) ? 255
    : null;

  const mediaUrl = (key: string) => {
    const val = payload[key];
    return typeof val === "string"
      ? val
      : val && typeof val === "object" && "url" in val
        ? String((val as { url?: unknown }).url ?? "")
        : "";
  };

  const fields = Object.entries(payload).filter(
    ([key, value]) =>
      !hidden.has(key) &&
      !/(alt)$/i.test(key) &&
      (["string", "number", "boolean"].includes(typeof value) || isMediaField(key))
  );

  // Split fields: media vs text
  const mediaFields = fields.filter(([key]) => isMediaField(key));
  const textFields = fields.filter(([key]) => !isMediaField(key));

  function renderTextField([key, value]: [string, unknown]) {
    const label = fieldLabel(key);
    const required = requiredFields.has(key);
    const hint = maxLength(key);
    const inputCls =
      "h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#7b79ff] focus:ring-2 focus:ring-[#d9d8ff] disabled:bg-slate-50 disabled:text-slate-400";

    if (key === "calendlyUrl") {
      return (
        <AppointmentLinkField
          key={key}
          value={String(value ?? "")}
          onChange={(nextValue) => setPayload((current) => ({ ...current, [key]: nextValue }))}
          disabled={readOnly}
        />
      );
    }

    if (key === "orientation" || key === "ownerType") {
      const options: [string, string][] = key === "orientation"
        ? [["portrait", "Portrait"], ["landscape", "Landscape"], ["square", "Square"]]
        : [["company", "Company"], ["personal", "Personal"]];
      return (
        <label key={key} className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-700">
            {label}{required && <sup className="text-red-500">*</sup>}
          </span>
          <select
            value={String(value ?? options[0][0])}
            disabled={readOnly}
            onChange={(event) => setPayload((current) => ({ ...current, [key]: event.target.value }))}
            className={inputCls}
          >
            {options.map(([optionValue, optionLabel]) => (
              <option key={optionValue} value={optionValue}>{optionLabel}</option>
            ))}
          </select>
        </label>
      );
    }

    if (/^(accent|coverInk|color|background|foreground|textColor)$/i.test(key)) {
      return (
        <label key={key} className="grid gap-1.5">
          <span className="text-xs font-medium text-slate-700">
            {label}{required && <sup className="text-red-500">*</sup>}
          </span>
          <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : "#000000"}
              disabled={readOnly}
              onChange={(e) => setPayload((p) => ({ ...p, [key]: e.target.value }))}
              className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="font-mono text-xs text-slate-500">{String(value ?? "")}</span>
          </div>
        </label>
      );
    }

    return (
      <label key={key} className="grid gap-1.5">
        <span className="text-xs font-medium text-slate-700">
          {label}{required && <sup className="text-red-500">*</sup>}
        </span>
        {typeof value === "string" && value.length > 90 ? (
          <textarea
            value={String(value)}
            disabled={readOnly}
            onChange={(e) => setPayload((p) => ({ ...p, [key]: e.target.value }))}
            className="min-h-[120px] w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7b79ff] focus:ring-2 focus:ring-[#d9d8ff] disabled:bg-slate-50 disabled:text-slate-400"
          />
        ) : (
          <input
            type={typeof value === "number" || /sortOrder|year/i.test(key) ? "number" : "text"}
            value={String(value ?? "")}
            disabled={readOnly}
            onChange={(e) =>
              setPayload((p) => ({
                ...p,
                [key]:
                  typeof value === "number" || /sortOrder|year/i.test(key)
                    ? Number(e.target.value)
                    : e.target.value,
              }))
            }
            className={inputCls}
          />
        )}
        {hint && <span className="text-[11px] text-slate-400">max. {hint} characters</span>}
      </label>
    );
  }

  function renderMediaField([key]: [string, unknown]) {
    const label = fieldLabel(key);
    const required = requiredFields.has(key);
    const isVideo = isVideoField(key);
    const url = mediaUrl(key);

    return (
      <div key={key} className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700">
            {label}{required && <sup className="text-red-500">*</sup>}
          </span>
          {url && !readOnly && (
            <button
              type="button"
              onClick={() => setPayload((p) => ({ ...p, [key]: null }))}
              className="text-xs text-red-500 hover:text-red-700 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
        <div>
          <AssetPicker
            kind={key === "file" ? "document" : isVideo ? "video" : "image"}
            value={url}
            disabled={readOnly}
            onChange={(newUrl) => setPayload((p) => ({ ...p, [key]: newUrl }))}
          />
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const backHref = `/dashboard/website-content?type=${search.get("type") ?? entry.contentType}`;

  return (
    <section className="min-h-full pb-16">
      <div className="mx-auto max-w-[1480px]">

        {/* Top bar */}
        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4a45ff] hover:opacity-80"
          >
            <ArrowLeft className="size-4" />
            Back to {fieldLabel(search.get("type") ?? entry.contentType)}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {entry.sourceUpdatedAt && (
              <span>Last updated {formatDate(entry.sourceUpdatedAt)}</span>
            )}
          </div>
        </div>

        {/* Page header */}
        <header className="mt-4">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1f2c55]">
              {title || "Untitled entry"}
            </h1>
            <div className="mt-0.5">
              <StatusBadge status={status} />
            </div>
          </div>
        </header>

        {/* View mode tabs */}
        <div className="mt-5 flex gap-0 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode("DRAFT")}
            className={`flex items-center gap-1.5 border-b-2 px-4 pb-3 text-xs font-medium transition-colors ${
              viewMode === "DRAFT"
                ? "border-[#4a45ff] text-[#4a45ff]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FilePen className="size-3.5" />
            Draft
          </button>
          <button
            type="button"
            disabled={status !== "PUBLISHED"}
            onClick={() => setViewMode("PUBLISHED")}
            className={`flex items-center gap-1.5 border-b-2 px-4 pb-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              viewMode === "PUBLISHED"
                ? "border-[#4a45ff] text-[#4a45ff]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Eye className="size-3.5" />
            Published
          </button>
        </div>

        {/* Body */}
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

          {/* ── Main content card ── */}
          <div className="space-y-6">
            {/* Text fields */}
            {textFields.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Content
                </p>
                <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                  {textFields.map(renderTextField)}
                </div>
              </div>
            )}

            {/* Media fields */}
            {mediaFields.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Media
                </p>
                <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                  {mediaFields.map(renderMediaField)}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="sticky top-6 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Entry
              </p>
            </div>

            <div className="p-4 space-y-3">
              {/* Status row */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Status</span>
                <StatusBadge status={status} />
              </div>
              {entry.sourceUpdatedAt && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Updated</span>
                  <span>{formatDate(entry.sourceUpdatedAt)}</span>
                </div>
              )}
              {certificatePublishError && (
                <p role="alert" className="text-xs leading-5 text-red-600">
                  {certificatePublishError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 p-4 space-y-2">
              {/* Save / Publish split button */}
              <div ref={saveMenuRef} className="relative flex gap-px">
                <Button
                  onClick={() => save(status === "PUBLISHED" ? "PUBLISHED" : "DRAFT")}
                  disabled={!dirty || saving || readOnly}
                  className="h-9 flex-1 rounded-r-none bg-[#4a45ff] text-xs text-white hover:bg-[#3934db] disabled:opacity-50"
                >
                  <Save className="size-3.5" />
                  {saving ? "Saving…" : status === "PUBLISHED" ? "Save changes" : "Save draft"}
                </Button>
                <Button
                  onClick={() => setSaveMenuOpen((o) => !o)}
                  disabled={saving || readOnly}
                  className="h-9 w-9 rounded-l-none border-l border-[#3934db] bg-[#4a45ff] text-white hover:bg-[#3934db] disabled:opacity-50"
                  aria-label="More save options"
                >
                  <ChevronDown className="size-3.5" />
                </Button>

                {saveMenuOpen && (
                  <div className="absolute right-0 top-10 z-30 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    <div className="p-1">
                      {status !== "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => save("PUBLISHED")}
                          className="flex w-full items-center gap-2 rounded-md bg-emerald-800 px-3 py-2 text-left text-sm font-semibold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                        >
                          <Globe className="size-3.5" aria-hidden="true" />
                          Publish
                        </button>
                      )}
                      {status === "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => save("DRAFT")}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <X className="size-3.5 text-slate-400" />
                          Unpublish
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setPayload(JSON.parse(original.payload)); setSaveMenuOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <X className="size-3.5 text-slate-400" />
                        Discard changes
                      </button>
                    </div>
                    <div className="border-t border-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => { setSaveMenuOpen(false); remove(); }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="size-3.5" />
                        Delete entry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
