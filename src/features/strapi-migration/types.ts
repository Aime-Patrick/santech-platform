export type MigrationJobStatus =
  | "UPLOADING"
  | "RESTORING"
  | "PREVIEW_READY"
  | "IMPORTING"
  | "COMPLETED"
  | "FAILED";

export type MigrationPreview = {
  catalogItems: number;
  categories: number;
  media: number;
  contentEntries: number;
  users: number;
  duplicateSlugGroups: number;
  validationErrors: string[];
};

export type MigrationJob = {
  id: string;
  fileName: string;
  status: MigrationJobStatus;
  createdAt: string;
  updatedAt: string;
  preview?: MigrationPreview;
  imported?: { catalogItems: number; contentEntries: number; users: number; media: number };
  error?: string;
};
