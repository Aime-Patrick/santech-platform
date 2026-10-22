import { createHash } from "node:crypto";
import type { Buffer } from "node:buffer";
import { getServerEnv } from "@/lib/env";

type CloudinaryUploadInput = { data: Buffer; fileName: string; mimeType: string; folder: string };
type CloudinaryUploadResult = { public_id: string; secure_url: string; resource_type: string; bytes: number };

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
  const params = { folder, timestamp };
  const formData = new FormData();
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  formData.append("file", new Blob([bytes.buffer], { type: mimeType }), fileName);
  formData.append("api_key", env.apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("signature", signature(params, env.apiSecret));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudName}/auto/upload`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(`CLOUDINARY_UPLOAD_FAILED:${response.status}:${(await response.text()).slice(0, 240)}`);
  return (await response.json()) as CloudinaryUploadResult;
}
