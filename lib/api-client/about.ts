import { z } from "zod";
import { apiClient } from "@/lib/api-client/client";
import { normalizeApiError } from "@/lib/api-client/error";
import { aboutAdminSchema, aboutUpdateSchema, type AboutUsUpdateRequest } from "@/lib/about-schemas";

const responseSchema = z.object({ success: z.literal(true), data: aboutAdminSchema });
const missingSchema = z.object({ success: z.literal(false), error: z.object({ code: z.literal("CONTENT_NOT_FOUND") }) });
export const aboutApi = {
  async get(signal?: AbortSignal) {
    try { return responseSchema.parse((await apiClient.get("/admin/about", { signal })).data).data; }
    catch (error) {
      const failure = normalizeApiError(error);
      if (failure.status === 404 && missingSchema.safeParse(failure.responseData).success) return null;
      throw error;
    }
  },
  async update(input: AboutUsUpdateRequest) {
    return responseSchema.parse((await apiClient.patch("/admin/about", aboutUpdateSchema.parse(input))).data).data;
  },
};
