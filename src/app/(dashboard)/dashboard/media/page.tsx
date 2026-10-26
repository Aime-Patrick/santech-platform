import { MediaLibrary } from "@/components/media/media-library";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const params = await searchParams;
  return <MediaLibrary folder={params.folder ?? ""} />;
}