import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStrapiMigrationJob, importStrapiMigration, uploadStrapiDump } from "../api/strapi-migration-api";
import { strapiMigrationKeys } from "../queryKeys";
export function useStrapiMigrationJob(id: string | null) {
  return useQuery({
    queryKey: strapiMigrationKeys.job(id ?? ""),
    queryFn: () => getStrapiMigrationJob(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.job.status;
      return status === "UPLOADING" || status === "RESTORING" || status === "IMPORTING" ? 2000 : false;
    },
  });
}

export function useUploadStrapiDump() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadStrapiDump,
    onSuccess: ({ job }) => queryClient.setQueryData(strapiMigrationKeys.job(job.id), { job }),
  });
}

export function useImportStrapiMigration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importStrapiMigration,
    onSuccess: ({ job }) => queryClient.setQueryData(strapiMigrationKeys.job(job.id), { job }),
    onSettled: (_data, _error, id) => queryClient.invalidateQueries({ queryKey: strapiMigrationKeys.job(id) }),
  });
}
