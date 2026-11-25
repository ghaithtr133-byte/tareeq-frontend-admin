import type { AxiosRequestConfig } from "axios";
import { z } from "zod";

import { apiClient } from "@/lib/api-client/client";
import { teachingLanguageCodeSchema, uuidSchema } from "@/lib/university-schemas";

const studyLanguageSchema = z.object({
  id: uuidSchema,
  code: teachingLanguageCodeSchema,
  nameAr: z.string(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

const responseSchema = z.object({
  success: z.literal(true),
  data: z.object({ items: z.array(studyLanguageSchema) }),
});

export type StudyLanguage = z.infer<typeof studyLanguageSchema>;

/** Admin catalog includes inactive values so historical program records remain legible. */
export const studyLanguageCatalogApi = {
  async list(config?: Pick<AxiosRequestConfig, "signal">): Promise<StudyLanguage[]> {
    const response = await apiClient.get("/admin/study-languages", config);
    return responseSchema.parse(response.data).data.items;
  },
};
