export type WebsiteEntry = {
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

export type WebsiteEntryInput = { contentType: string; title: string; slug?: string | null; payload: unknown; status?: string };
export type WebsiteEntryUpdateInput = { id: string; title: string; slug?: string | null; payload: unknown; status: string };
export type Asset = { id: string; publicId: string; url: string; alternativeText: string | null; caption?: string | null; format: string | null; width: number | null; height: number | null; bytes: number | null; createdAt?: string | Date };
export type AssetUpdateInput = { id: string; alternativeText?: string | null; caption?: string | null };