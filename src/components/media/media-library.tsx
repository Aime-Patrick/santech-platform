"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Check,
  Copy,
  Download,
  FileImage,
  Filter,
  Folder,
  FolderPlus,
  Grid2X2,
  Info,
  List,
  Link2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useAssets,
  useDeleteAsset,
  useInfiniteAssets,
  useUpdateAsset,
  useUploadAsset,
} from "@/features/website-content";
import type { Asset } from "@/features/website-content/types";

function isVideo(asset: Asset) {
  return (
    asset.format === "video" || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(asset.url)
  );
}

function folderName(path: string) {
  return path.split("/").pop() ?? path;
}

export function MediaLibrary({ folder = "" }: { folder?: string }) {
  const [search, setSearch] = React.useState("");
  const [view, setView] = React.useState<"grid" | "table">("grid");
  const [newOpen, setNewOpen] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(null);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [sort, setSort] = React.useState("recent");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const upload = useUploadAsset();
  const assetsQuery = useInfiniteAssets(folder || undefined);
  const allAssetsQuery = useAssets(undefined, !folder);
  const assets = assetsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const allAssets = allAssetsQuery.data?.data ?? assets;
  const folders = React.useMemo(() => {
    const paths = new Set<string>();
    for (const asset of allAssets) {
      const parts = asset.publicId.split("/");
      if (parts.length > 1) paths.add(parts.slice(0, -1).join("/"));
    }
    return Array.from(paths).sort();
  }, [allAssets]);
  const filtered = assets.filter((asset) => {
    const matchesSearch = `${asset.publicId} ${asset.alternativeText ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const video = isVideo(asset);
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "video" && video) ||
      (typeFilter === "image" && !video && asset.format !== "pdf") ||
      (typeFilter === "file" && !video && asset.format === "pdf");
    return matchesSearch && matchesType;
  });
  const visibleAssets = [...filtered].sort((a, b) => {
    if (sort === "oldest")
      return (
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime()
      );
    if (sort === "nameAsc")
      return folderName(a.publicId).localeCompare(folderName(b.publicId));
    if (sort === "nameDesc")
      return folderName(b.publicId).localeCompare(folderName(a.publicId));
    if (sort === "sizeAsc") return (a.bytes ?? 0) - (b.bytes ?? 0);
    if (sort === "sizeDesc") return (b.bytes ?? 0) - (a.bytes ?? 0);
    return (
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
    );
  });
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          assetsQuery.hasNextPage &&
          !assetsQuery.isFetchingNextPage
        )
          assetsQuery.fetchNextPage();
      },
      { rootMargin: "480px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    assetsQuery.hasNextPage,
    assetsQuery.isFetchingNextPage,
    assetsQuery.fetchNextPage,
  ]);
  const onUpload = (files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach((file) =>
      upload.mutate({
        file,
        folder: folder || "santech-platform/website-content",
      }),
    );
  };

  return (
    <section className="min-h-full text-[#172554]">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xl font-semibold">
              {folder ? folderName(folder) : "Home"}{" "}
              <span className="font-normal text-slate-500">
                ({assets.length} items)
              </span>
            </p>
            {folder ? (
              <Link
                href="/dashboard/media"
                className="mt-1 inline-block text-sm text-[#4a45ff] hover:underline"
              >
                Back to Home
              </Link>
            ) : null}
          </div>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              className="sr-only"
              onChange={(event) => {
                onUpload(event.target.files);
                event.currentTarget.value = "";
                setNewOpen(false);
              }}
            />
            <Button
              type="button"
              onClick={() => setNewOpen((open) => !open)}
              className="h-9 gap-2 rounded-md bg-[#4a45ff] px-4 text-sm font-semibold text-white hover:bg-[#3934db]"
            >
              New <ChevronDown className="size-4" />
            </Button>
            {newOpen ? (
              <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-md border border-slate-200 bg-white p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    window.alert(
                      "Folders are created when the first asset is uploaded into them.",
                    );
                    setNewOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-[#f1f0ff] hover:text-[#3730d8]"
                >
                  <FolderPlus className="size-4 text-slate-400" /> New folder
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-[#f1f0ff] hover:text-[#3730d8]"
                >
                  <Upload className="size-4 text-slate-400" /> File upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.alert(
                      "Paste a URL in the asset picker when attaching media to content.",
                    );
                    setNewOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-[#f1f0ff] hover:text-[#3730d8]"
                >
                  <Link2 className="size-4 text-slate-400" /> File upload from
                  URL
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilterOpen((open) => !open)}
              className="gap-2 bg-white"
            >
              <Filter className="size-4" /> Filter
            </Button>
            {filterOpen ? (
              <div className="absolute left-0 top-11 z-20 w-64 overflow-hidden rounded-md border border-slate-200 bg-white p-1.5 shadow-lg">
                <p className="px-3 py-2 text-xs font-medium text-slate-500">
                  Type
                </p>
                {[
                  ["all", "All files"],
                  ["image", "Images"],
                  ["video", "Videos"],
                  ["file", "Documents"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setTypeFilter(value);
                      setFilterOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-[#f1f0ff]"
                  >
                    {label}
                    {typeFilter === value ? (
                      <Check className="size-4 text-[#4a45ff]" />
                    ) : null}
                  </button>
                ))}
                <p className="mt-1 border-t border-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                  Creation date
                </p>
                <p className="px-3 pb-2 text-xs text-slate-400">
                  Use the Sort menu for date order.
                </p>
              </div>
            ) : null}
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#4a45ff] focus:ring-2 focus:ring-[#4a45ff]/15"
            />
          </div>
          <div className="relative ml-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSortOpen((open) => !open)}
              className="h-9 gap-2 text-sm text-slate-700"
            >
              Sort:{" "}
              {sort === "recent"
                ? "Most recent updates"
                : sort === "oldest"
                  ? "Oldest uploads"
                  : sort === "nameAsc"
                    ? "A to Z"
                    : sort === "nameDesc"
                      ? "Z to A"
                      : sort === "sizeAsc"
                        ? "File size ascending"
                        : "File size descending"}{" "}
              <ChevronDown className="size-4" />
            </Button>
            {sortOpen ? (
              <div className="absolute right-0 top-11 z-20 w-72 overflow-hidden rounded-md border border-slate-200 bg-white p-1.5 shadow-lg">
                <p className="px-3 py-2 text-xs font-medium text-slate-500">
                  SORT
                </p>
                {[
                  ["oldest", "Oldest uploads"],
                  ["recent", "Most recent updates"],
                  ["nameAsc", "A to Z"],
                  ["nameDesc", "Z to A"],
                  ["sizeAsc", "File size ascending"],
                  ["sizeDesc", "File size descending"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSort(value);
                      setSortOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-[#f1f0ff]"
                  >
                    {label}
                    {sort === value ? (
                      <Check className="size-4 text-[#4a45ff]" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs ${view === "table" ? "bg-slate-100 font-semibold text-slate-800" : "text-slate-500"}`}
            >
              <List className="size-4" /> Table view
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs ${view === "grid" ? "bg-[#eeedff] font-semibold text-[#3730d8]" : "text-slate-500"}`}
            >
              <Grid2X2 className="size-4" /> Grid view
            </button>
          </div>
        </div>

        {!folder && folders.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {folders.map((item) => (
              <Link
                key={item}
                href={`/dashboard/media?folder=${encodeURIComponent(item)}`}
                className="relative flex min-h-[56px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm shadow-sm transition hover:border-[#a7a3ff] hover:shadow"
              >
                <input
                  type="checkbox"
                  aria-label={`Select folder ${folderName(item)}`}
                  onClick={(event) => event.preventDefault()}
                  className="size-5 rounded border-slate-300 accent-[#4a45ff]"
                />
                <Folder className="size-5 fill-slate-500 text-slate-500" />
                <span className="truncate font-medium">{folderName(item)}</span>
                <span className="ml-auto text-slate-400">...</span>
              </Link>
            ))}
          </div>
        ) : null}

        <div
          className={
            view === "grid"
              ? "mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"
              : "mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white"
          }
        >
          {view === "grid" ? (
            visibleAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onOpen={() => setSelectedAsset(asset)}
              />
            ))
          ) : (
            <AssetTable
              assets={visibleAssets}
              folders={folder ? [] : folders}
              onOpen={setSelectedAsset}
            />
          )}
          {!assetsQuery.isLoading && visibleAssets.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
              No assets found in this location.
            </div>
          ) : null}
        </div>
        <div
          ref={loadMoreRef}
          className="flex min-h-16 items-center justify-center"
        >
          {assetsQuery.isFetchingNextPage ? (
            <span className="text-sm text-slate-500">
              Loading more assets...
            </span>
          ) : assetsQuery.hasNextPage ? (
            <span className="text-xs text-slate-400">Scroll to load more</span>
          ) : visibleAssets.length > 0 ? (
            <span className="text-xs text-slate-400">
              You have reached the end
            </span>
          ) : null}
        </div>
        {assetsQuery.isLoading ? (
          <p className="mt-8 text-center text-sm text-slate-500">
            Loading media...
          </p>
        ) : null}
        {upload.isError ? (
          <p className="mt-4 text-sm text-red-600">{upload.error.message}</p>
        ) : null}
        <AssetDetailsSheet
          asset={selectedAsset}
          open={Boolean(selectedAsset)}
          onOpenChange={(open) => {
            if (!open) setSelectedAsset(null);
          }}
        />
      </div>
    </section>
  );
}

function AssetCard({ asset, onOpen }: { asset: Asset; onOpen: () => void }) {
  const deleteAsset = useDeleteAsset();
  const name = folderName(asset.publicId);
  const copy = () => {
    if (typeof navigator !== "undefined")
      navigator.clipboard?.writeText(asset.url);
  };
  const download = () => {
    const link = document.createElement("a");
    link.href = asset.url;
    link.download = name;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.click();
  };
  const remove = () => {
    if (
      window.confirm(
        `Delete "${name}"? This permanently removes the media file.`,
      )
    )
      deleteAsset.mutate(asset.id);
  };
  return (
    <article
      onClick={onOpen}
      className="relative cursor-pointer overflow-visible rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[1.6] overflow-hidden rounded-t-lg bg-slate-100">
        <input
          type="checkbox"
          aria-label={`Select ${name}`}
          onClick={(event) => event.stopPropagation()}
          className="absolute left-3 top-3 z-10 size-5 rounded border-slate-300 bg-white accent-[#4a45ff]"
        />
        <MediaPreview asset={asset} />
      </div>
      <div className="flex h-14 items-center gap-2 rounded-b-lg border-t border-slate-200 px-3 text-sm">
        <FileImage className="size-4 shrink-0 text-slate-500" />
        <span className="truncate text-[#334a7d]" title={name}>
          {name}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Asset actions"
            onClick={(event) => event.stopPropagation()}
            className="ml-auto grid size-8 shrink-0 place-items-center rounded outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#4a45ff]/40 data-popup-open:bg-slate-100"
          >
            <MoreHorizontal className="size-4 text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="bottom"
            className="w-64 gap-0.5 p-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem className="gap-3 px-3 py-2.5">
              <RefreshCw className="size-4 text-slate-400" />
              Replace media
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 px-3 py-2.5" onClick={copy}>
              <Link2 className="size-4 text-slate-400" />
              Copy link to media
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 px-3 py-2.5" onClick={download}>
              <Download className="size-4 text-slate-400" />
              Download media
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-3 px-3 py-2.5">
              <ArrowRight className="size-4 text-slate-400" />
              Move to folder
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              className="gap-3 px-3 py-2.5"
              onClick={remove}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
function AssetRow({ asset }: { asset: Asset }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
      <div className="size-12 overflow-hidden rounded bg-slate-100">
        <MediaPreview asset={asset} />
      </div>
      <span className="truncate text-sm">{folderName(asset.publicId)}</span>
      <span className="ml-auto text-xs text-slate-500">
        {asset.format ?? "file"}
      </span>
    </div>
  );
}
function formatDate(value?: string | Date) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
function formatSize(bytes?: number | null) {
  if (!bytes) return "-";
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${(bytes / 1024).toFixed(1)}KB`;
}
function AssetTable({
  assets,
  folders,
  onOpen,
}: {
  assets: Asset[];
  folders: string[];
  onOpen: (asset: Asset) => void;
}) {
  const copy = (value: string) => {
    if (typeof navigator !== "undefined") navigator.clipboard?.writeText(value);
  };
  return (
    <div className="min-w-[880px] overflow-visible rounded-lg border border-slate-200 bg-white">
      <div className="grid grid-cols-[44px_minmax(300px,1fr)_155px_155px_90px_48px] items-center gap-2 bg-[#f7f7fa] px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-[#536184]">
        <span>
          <input
            type="checkbox"
            aria-label="Select all assets"
            className="size-5 rounded border-slate-300 accent-[#4a45ff]"
          />
        </span>
        <span>Name</span>
        <span>Creation date</span>
        <span>Last modified</span>
        <span>Size</span>
        <span />
      </div>
      {folders.map((folder) => (
        <TableFolderRow key={folder} folder={folder} onCopy={copy} />
      ))}
      {assets.map((asset) => (
        <TableAssetRow
          key={asset.id}
          asset={asset}
          onCopy={copy}
          onOpen={() => onOpen(asset)}
        />
      ))}
    </div>
  );
}
function TableFolderRow({
  folder,
  onCopy,
}: {
  folder: string;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[44px_minmax(300px,1fr)_155px_155px_90px_48px] items-center gap-2 border-t border-slate-200 px-4 py-3 text-sm text-[#334a7d]">
      <span>
        <input
          type="checkbox"
          aria-label={`Select folder ${folderName(folder)}`}
          className="size-5 rounded border-slate-300 accent-[#4a45ff]"
        />
      </span>
      <span className="flex items-center gap-3 font-semibold text-[#172554]">
        <Folder className="size-5 fill-slate-500 text-slate-500" />
        {folderName(folder)}
      </span>
      <span>-</span>
      <span>-</span>
      <span>-</span>
      <ActionButton label={`Actions for folder ${folderName(folder)}`}>
        <DropdownMenuItem
          className="gap-3"
          onClick={() => onCopy(folder)}
        >
          <Copy className="size-4" />
          Copy link to folder
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-3">
          <Pencil className="size-4" />
          Rename folder
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" className="gap-3">
          <Trash2 className="size-4" />
          Delete folder
        </DropdownMenuItem>
      </ActionButton>
    </div>
  );
}
function TableAssetRow({
  asset,
  onCopy,
  onOpen,
}: {
  asset: Asset;
  onCopy: (value: string) => void;
  onOpen: () => void;
}) {
  const missingMetadata = !asset.alternativeText;
  return (
    <div
      onClick={onOpen}
      className="grid cursor-pointer grid-cols-[44px_minmax(300px,1fr)_155px_155px_90px_48px] items-center gap-2 border-t border-slate-200 px-4 py-3 text-sm text-[#334a7d] hover:bg-[#f8f8ff]"
    >
      <span>
        <input
          type="checkbox"
          aria-label={`Select ${folderName(asset.publicId)}`}
          className="size-5 rounded border-slate-300 accent-[#4a45ff]"
        />
      </span>
      <span className="flex min-w-0 items-center gap-3 font-semibold text-[#172554]">
        <FileImage className="size-5 shrink-0 text-slate-500" />
        <span className="truncate" title={folderName(asset.publicId)}>
          {folderName(asset.publicId)}
        </span>
        {missingMetadata ? (
          <span
            title="This asset is missing metadata (caption or alternative text)."
            className="inline-flex shrink-0"
          >
            <Info className="size-4 fill-orange-400 text-white" />
          </span>
        ) : null}
      </span>
      <span>{formatDate(asset.createdAt)}</span>
      <span>{formatDate(asset.createdAt)}</span>
      <span>{formatSize(asset.bytes)}</span>
      <ActionButton
        label={`Actions for ${folderName(asset.publicId)}`}
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem
          className="gap-3"
          onClick={() => onCopy(asset.url)}
        >
          <Copy className="size-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-3"
          onClick={() => onOpen()}
        >
          <Pencil className="size-4" />
          Edit metadata
        </DropdownMenuItem>
      </ActionButton>
    </div>
  );
}
function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="flex justify-end" onClick={onClick}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={label}
          className="grid size-8 place-items-center rounded outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#4a45ff]/40 data-popup-open:bg-slate-100"
        >
          <MoreHorizontal className="size-4 text-slate-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          className="w-52"
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}
function AssetDetailsSheet({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateAsset();
  const remove = useDeleteAsset();
  const [caption, setCaption] = React.useState("");
  const [alternativeText, setAlternativeText] = React.useState("");
  React.useEffect(() => {
    setCaption(asset?.caption ?? "");
    setAlternativeText(asset?.alternativeText ?? "");
    update.reset();
    remove.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset]);
  if (!asset) return null;
  const name = folderName(asset.publicId);
  const location = asset.publicId.split("/").slice(0, -1).join("/") || "Home";
  const copy = () => {
    if (typeof navigator !== "undefined")
      navigator.clipboard?.writeText(asset.url);
  };
  const download = () => {
    const link = document.createElement("a");
    link.href = asset.url;
    link.download = name;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.click();
  };
  const handleDelete = () => {
    if (
      !window.confirm(
        `Delete "${name}"? This permanently removes the media file.`,
      )
    )
      return;
    remove.mutate(asset.id, { onSuccess: () => onOpenChange(false) });
  };
  const handleSave = () => {
    update.mutate({
      id: asset.id,
      alternativeText: alternativeText.trim() || null,
      caption: caption.trim() || null,
    });
  };
  const dirty =
    caption !== (asset.caption ?? "") ||
    alternativeText !== (asset.alternativeText ?? "");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto border-l border-slate-200 bg-white p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-slate-200 px-6 py-5 pr-14">
          <SheetTitle className="flex min-w-0 items-center gap-3 text-base text-slate-700">
            <FileImage className="size-5 shrink-0 text-slate-600" />
            <span className="truncate">{name}</span>
            <Link2 className="ml-auto size-5 shrink-0 text-slate-500" />
          </SheetTitle>
        </SheetHeader>
        <div className="bg-[linear-gradient(45deg,#f1f1f1_25%,transparent_25%),linear-gradient(-45deg,#f1f1f1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f1f1_75%),linear-gradient(-45deg,transparent_75%,#f1f1f1_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0px] p-8">
          <div className="mx-auto aspect-[1.35] max-w-[260px]">
            <MediaPreview asset={asset} />
          </div>
        </div>
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-700">File info</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 bg-[#f7f7fa] p-6 text-sm">
            <InfoField
              label="Creation date"
              value={formatDate(asset.createdAt)}
            />
            <InfoField
              label="Last updated"
              value={formatDate(asset.createdAt)}
            />
            <InfoField label="Created by" value="—" />
            <InfoField label="Size" value={formatSize(asset.bytes)} />
            <InfoField
              label="Dimensions"
              value={
                asset.width && asset.height
                  ? `${asset.width} × ${asset.height}`
                  : "—"
              }
            />
            <InfoField label="Extension" value={asset.format ?? "—"} />
            <InfoField label="Asset ID" value={asset.id} />
          </div>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1">File name <span className="text-red-500">*</span></span>
            <Input value={name} readOnly />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1">Location<span className="text-red-500">*</span></span>
            <div className="flex h-10 items-center justify-between rounded-md border border-slate-200 px-3 text-sm text-slate-600">
              {location}
              <ChevronDown className="size-4 text-slate-400" />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Caption
            <Input
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Alternative text
            <Input
              value={alternativeText}
              onChange={(event) => setAlternativeText(event.target.value)}
            />
          </label>
        </div>
        <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white">
          {update.isError || remove.isError ? (
            <p className="px-6 pt-3 text-sm text-red-600">
              {(update.error ?? remove.error) instanceof Error
                ? ((update.error ?? remove.error) as Error).message
                : "The action failed. Please try again."}
            </p>
          ) : null}
          {update.isSuccess ? (
            <p className="px-6 pt-3 text-sm text-emerald-600">
              Changes saved.
            </p>
          ) : null}
          <SheetFooter className="flex-row px-6 py-4">
            <Button
              type="button"
              variant="outline"
              aria-label="Delete media"
              title="Delete media"
              disabled={remove.isPending}
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-label="Copy link to media"
              title="Copy link to media"
              onClick={copy}
            >
              <Link2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-label="Download media"
              title="Download media"
              onClick={download}
            >
              <Download className="size-4" />
            </Button>
            <Button
              type="button"
              disabled={!dirty || update.isPending}
              onClick={handleSave}
              className="ml-auto"
            >
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-600">{value}</p>
    </div>
  );
}
function MediaPreview({ asset }: { asset: Asset }) {
  return isVideo(asset) ? (
    <video src={asset.url} muted className="size-full object-contain" />
  ) : (
    <img
      src={asset.url}
      alt={asset.alternativeText ?? folderName(asset.publicId)}
      className="size-full object-contain"
    />
  );
}
