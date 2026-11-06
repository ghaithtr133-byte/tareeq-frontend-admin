import { z } from "zod";
import { apiClient } from "@/lib/api-client/client";
export const mediaResources = ["countries", "universities", "scholarships", "services", "articles"] as const;
export type MediaResource = typeof mediaResources[number];
export const MAX_IMAGE_BYTES = 4_000_000;
export const MAX_MULTIPART_BYTES = 4_100_000;
const uploadSchema = z.object({ success: z.literal(true), data: z.object({ assetId: z.string(), publicId: z.string(), secureUrl: z.url().refine((url) => url.startsWith("https://")), format: z.enum(["jpg", "png", "webp"]), bytes: z.number().int().positive(), width: z.number().int().positive(), height: z.number().int().positive() }) });

export function validateImageFile(file: File): string | undefined {
  if (!file.size || file.size > MAX_IMAGE_BYTES) return "حجم الصورة يجب ألا يتجاوز 4,000,000 بايت.";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "اختر صورة JPEG أو PNG أو WebP.";
  if (file.size + new TextEncoder().encode(file.name).length + 1024 > MAX_MULTIPART_BYTES) return "حجم طلب الرفع يتجاوز الحد المسموح.";
}
export async function uploadImage(resource: MediaResource, file: File, onProgress?: (percent: number) => void, signal?: AbortSignal) {
  z.enum(mediaResources).parse(resource);
  const invalid = validateImageFile(file); if (invalid) throw new Error(invalid);
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const signature = file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : file.type === "image/png" ? [137,80,78,71,13,10,26,10].every((byte, i) => bytes[i] === byte)
    : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!signature) throw new Error("محتوى الملف لا يطابق صيغة الصورة المختارة.");
  const body = new FormData(); body.set("resource", resource); body.set("file", file);
  const response = await apiClient.post("/admin/uploads/images", body, { signal, onUploadProgress: (event) => { if (event.total) onProgress?.(Math.min(100, Math.round(event.loaded / event.total * 100))); } });
  return uploadSchema.parse(response.data).data;
}
