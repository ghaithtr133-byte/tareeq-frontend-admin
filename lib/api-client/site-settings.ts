import { z } from "zod";
import { apiClient } from "@/lib/api-client/client";
import { siteSettingsSchema, siteSettingsUpdateSchema, type SiteSettingsUpdate } from "@/lib/site-settings-schemas";
const envelope = z.object({ success: z.literal(true), data: siteSettingsSchema });
export const siteSettingsApi = {
  // GET is public, not /admin/site-settings. The development proxy also strips credentials.
  async get(signal?: AbortSignal) { const response = await apiClient.get("/site-settings", { signal, withCredentials: false }); return envelope.parse(response.data).data; },
  async update(input: SiteSettingsUpdate) { const response = await apiClient.patch("/admin/site-settings", siteSettingsUpdateSchema.parse(input)); return envelope.parse(response.data).data; },
};
