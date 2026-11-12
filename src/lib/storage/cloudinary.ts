import { createHash } from "node:crypto";
import type { Buffer } from "node:buffer";
import { getServerEnv } from "@/lib/env";

type CloudinaryUploadInput = { data: Buffer; fileName: string; mimeType: string; folder: string };
type CloudinaryUploadResult = { public_id: string; secure_url: string; resource_type: string; bytes: number; width?: number; height?: number };
function cloudinaryResourceType(value = "image") {
  const normalized = value.toLowerCase();
  if (normalized === "video" || /(^|\.)(mp4|webm|mov|m4v|mp3|wav|m4a)$/i.test(normalized)) return "video";
  if (normalized === "raw") return "raw";
  return "image";
}

function cloudinaryConfig() {
  const env = getServerEnv();
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function signature(params: Record<string, string | number>, secret: string) {
  const payload = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&");
  return createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

export function cloudinaryIsConfigured() { return Boolean(cloudinaryConfig()); }

export async function uploadBufferToCloudinary({ data, fileName, mimeType, folder }: CloudinaryUploadInput) {
  const env = cloudinaryConfig();
  if (!env) throw new Error("CLOUDINARY_NOT_CONFIGURED");
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = { timestamp };
  if (folder) params.folder = folder;
  const formData = new FormData();
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  formData.append("file", new Blob([bytes.buffer], { type: mimeType }), fileName);
  formData.append("api_key", env.apiKey);
  formData.append("timestamp", String(timestamp));
  if (folder) formData.append("folder", folder);
  formData.append("signature", signature(params, env.apiSecret));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudName}/auto/upload`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(`CLOUDINARY_UPLOAD_FAILED:${response.status}:${(await response.text()).slice(0, 240)}`);
  return (await response.json()) as CloudinaryUploadResult;
}

export async function renameCloudinaryAsset(fromPublicId: string, toPublicId: string, resourceType = "image") {
  const env = cloudinaryConfig();
  if (!env) return;
  const type = cloudinaryResourceType(resourceType);
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { from_public_id: fromPublicId, to_public_id: toPublicId, timestamp };
  const formData = new FormData();
  formData.append("from_public_id", fromPublicId); formData.append("to_public_id", toPublicId);
  formData.append("api_key", env.apiKey); formData.append("timestamp", String(timestamp));
  formData.append("signature", signature(params, env.apiSecret));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudName}/${type}/rename`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(`CLOUDINARY_RENAME_FAILED:${response.status}:${(await response.text()).slice(0, 240)}`);
  const result = (await response.json()) as { public_id: string; secure_url?: string };
  return result;
}

export async function destroyCloudinaryAsset(publicId: string, resourceType = "image") {
  const env = cloudinaryConfig();
  if (!env) return;
  const type = cloudinaryResourceType(resourceType);
  const timestamp = Math.floor(Date.now() / 1000);
  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", env.apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature({ public_id: publicId, timestamp }, env.apiSecret));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudName}/${type}/destroy`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(`CLOUDINARY_DESTROY_FAILED:${response.status}:${(await response.text()).slice(0, 240)}`);
}
