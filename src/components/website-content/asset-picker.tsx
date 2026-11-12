"use client";

import * as React from "react";
import { FileText, Folder, ImagePlus, Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useAssetFolders,
  useCreateAssetFolder,
  useInfiniteAssets,
  useUploadAsset,
} from "@/features/website-content";

type Asset = {
  id: string;
  publicId: string;
  url: string;
  alternativeText: string | null;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
};

type AssetPickerProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  kind?: "image" | "video" | "document";
};

function isVideoAsset(asset: Asset) {
  return (
    asset.format === "video" ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(asset.url) ||
    /\/(?:video|raw)\/upload\//i.test(asset.url) ||
    /\b(?:video|mp4|webm|mov|m4v)\b/i.test(asset.format ?? "")
  );
}

function isDocumentAsset(asset: Asset) {
  return /\.pdf(?:\?|$)/i.test(asset.url) || asset.format?.toLowerCase() === "pdf";
}

export function AssetPicker({
  value,
  onChange,
  disabled,
  kind = "image",
}: AssetPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [folder, setFolder] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [showUpload, setShowUpload] = React.useState(false);
  // The picker root is an all-assets view; clicking a project folder narrows
  // the listing to that folder. This keeps legacy/unfiled assets selectable.
  const assetsQuery = useInfiniteAssets(folder || undefined, open);
  const foldersQuery = useAssetFolders(folder, open);
  const createFolderMutation = useCreateAssetFolder();
  const uploadMutation = useUploadAsset();
  const assets = assetsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const {
    isPending: assetsPending,
    isError: assetsError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = assetsQuery;

  function upload(files: FileList | null) {
    if (!files?.length) return;

    Array.from(files).forEach((file) =>
      uploadMutation.mutate({
        file,
        folder,
      }),
    );
    setShowUpload(false);
  }

  const folders = foldersQuery.data?.data ?? [];
  const createFolder = () => {
    const name = window.prompt("Folder name")?.trim();
    if (!name) return;
    createFolderMutation.mutate({ name, parent: folder }, {
      onSuccess: ({ data: createdFolder }) => setFolder(createdFolder.path),
    });
  };
  const filtered = assets.filter((asset) => {
    const matchesKind = kind === "video"
      ? isVideoAsset(asset)
      : kind === "document"
        ? isDocumentAsset(asset)
        : !isVideoAsset(asset) && !isDocumentAsset(asset);
    const matchesSearch = `${asset.publicId} ${asset.alternativeText ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesKind && matchesSearch;
  });

  React.useEffect(() => {
    if (
      !open ||
      assetsPending ||
      assetsError ||
      filtered.length > 0 ||
      !hasNextPage ||
      isFetchingNextPage
    ) {
      return;
    }
    void fetchNextPage();
  }, [
    open,
    assetsPending,
    assetsError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    filtered.length,
  ]);

  return (
    <>
      {value ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          {kind === "video" ? (
            <video
              src={value}
              autoPlay
              loop
              muted
              playsInline
              controls
              preload="auto"
              className="h-44 w-full bg-slate-950 object-contain"
            />
          ) : kind === "document" ? (
            <a href={value} target="_blank" rel="noreferrer" className="flex h-44 items-center justify-center bg-muted/40 text-primary" aria-label="Open selected document">
              <FileText className="size-10" aria-hidden="true" />
            </a>
          ) : (
            <img
              src={value}
              alt="Selected asset"
              className="h-44 w-full bg-muted/40 object-contain"
            />
          )}
          <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              Selected {kind}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              Change asset
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="flex h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ImagePlus className="mb-2 size-6" aria-hidden="true" />
          <span>Choose an asset or drop one here</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          overlayClassName="!bg-slate-950/40"
          className="flex flex-col w-[calc(100vw_-_2rem)] !max-w-[960px] max-h-[calc(100dvh_-_2rem)] gap-0 overflow-hidden rounded-xl p-0"
          showCloseButton
        >
          <DialogHeader className="border-b px-6 py-4 pr-14">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Add new assets
            </DialogTitle>
            <DialogDescription>
              Choose an existing file or upload a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={!showUpload ? "default" : "outline"}
                onClick={() => setShowUpload(false)}
              >
                Browse
              </Button>
              <Button
                type="button"
                size="sm"
                variant={showUpload ? "default" : "outline"}
                onClick={() => setShowUpload(true)}
              >
                <Upload className="size-4" aria-hidden="true" />
                Upload files
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={createFolder}
              disabled={createFolderMutation.isPending}
            >
              <Plus className="size-4" aria-hidden="true" />
              {createFolderMutation.isPending ? "Creating…" : "Add folder"}
            </Button>
          </div>

          {showUpload ? (
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                upload(event.dataTransfer.files);
              }}
              className="m-5 flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center"
            >
              <Upload className="mb-3 size-7 text-primary" aria-hidden="true" />
              <p className="mb-4 text-sm text-muted-foreground">
                Drag files here or choose them from your computer
              </p>
              <Input
                type="file"
                multiple
                accept={kind === "video" ? "video/*" : kind === "document" ? ".pdf,application/pdf" : "image/*"}
                onChange={(event) => upload(event.target.files)}
                disabled={uploadMutation.isPending}
                className="max-w-sm bg-background"
              />
              {uploadMutation.isPending ? (
                <p className="mt-3 text-xs text-muted-foreground">Uploading…</p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b px-5 py-3">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search assets"
                    aria-label="Search assets"
                    className="h-9 pl-9"
                  />
                </div>
                <span className="max-w-56 truncate text-sm text-muted-foreground">
                  {folder || "All assets"}
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {folder ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mb-4"
                    onClick={() => setFolder("")}
                  >
                    All assets
                  </Button>
                ) : null}
                {assetsQuery.isError ? (
                  <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <span>Assets could not be loaded. {assetsQuery.error.message}</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => void assetsQuery.refetch()}>
                      Try again
                    </Button>
                  </div>
                ) : null}
                {foldersQuery.isError ? (
                  <p role="alert" className="mb-4 text-sm text-destructive">
                    Folders could not be loaded. {foldersQuery.error.message}
                  </p>
                ) : null}
                {createFolderMutation.isError ? (
                  <p role="alert" className="mb-4 text-sm text-destructive">
                    {createFolderMutation.error.message}
                  </p>
                ) : null}
                {folders.length > 0 ? (
                  <section className="mb-6" aria-labelledby="asset-folders-heading">
                    <h3
                      id="asset-folders-heading"
                      className="mb-3 text-sm font-medium"
                    >
                      Folders
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {folders.map((assetFolder) => (
                        <Button
                          key={assetFolder.path}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFolder(assetFolder.path)}
                          className="max-w-full justify-start"
                        >
                          <Folder className="size-4 shrink-0 text-sky-600" aria-hidden="true" />
                          <span className="truncate">
                            {assetFolder.name}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section aria-labelledby="asset-results-heading">
                  <h3
                    id="asset-results-heading"
                    className="mb-3 text-sm font-medium"
                  >
                    Assets {assetsQuery.isError ? null : <span className="text-muted-foreground">({filtered.length})</span>}
                  </h3>
                  {filtered.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {filtered.map((asset) => (
                        <div
                          key={asset.id}
                          className={`overflow-hidden rounded-lg border bg-card transition-colors ${asset.url === value ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/50"}`}
                        >
                          {kind === "video" ? (
                            <video
                              src={asset.url}
                              autoPlay
                              loop
                              muted
                              playsInline
                              controls
                              preload="auto"
                              aria-label={`Preview ${asset.publicId.split("/").pop()}`}
                              className="h-36 w-full bg-slate-950 object-contain"
                            />
                          ) : kind === "document" ? (
                            <div className="flex h-36 items-center justify-center bg-muted/40 text-primary" aria-label={`PDF document ${asset.publicId.split("/").pop()}`}>
                              <FileText className="size-9" aria-hidden="true" />
                            </div>
                          ) : (
                            <img
                              src={asset.url}
                              alt={asset.alternativeText ?? ""}
                              className="h-36 w-full bg-muted/40 object-contain"
                            />
                          )}
                          <div className="flex items-center justify-between gap-2 border-t px-2.5 py-2">
                            <span className="min-w-0 flex-1 truncate text-xs text-foreground" title={asset.publicId.split("/").pop()}>
                              {asset.publicId.split("/").pop()}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant={asset.url === value ? "default" : "outline"}
                              className="h-7 shrink-0 px-2.5 text-xs"
                              onClick={() => {
                                onChange(asset.url);
                                setOpen(false);
                              }}
                            >
                              {asset.url === value ? "Selected" : "Select"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                      {assetsQuery.isError
                        ? "Assets could not be loaded. Use Try again above."
                        : assetsQuery.isLoading
                        ? "Loading assets…"
                        : assetsQuery.isFetchingNextPage
                          ? "Looking through the remaining media…"
                        : assetsQuery.hasNextPage
                          ? "No matching assets on this page yet. Load more to continue browsing."
                        : search
                          ? "No assets match your search."
                          : "No assets in this folder yet."}
                    </p>
                  )}
                  {assetsQuery.hasNextPage ? (
                    <div className="mt-4 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void assetsQuery.fetchNextPage()}
                        disabled={assetsQuery.isFetchingNextPage}
                      >
                        {assetsQuery.isFetchingNextPage ? "Loading more…" : "Load more assets"}
                      </Button>
                    </div>
                  ) : null}
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
