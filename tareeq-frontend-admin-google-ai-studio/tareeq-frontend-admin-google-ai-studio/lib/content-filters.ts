import { z } from "zod";
import { programStudyLevels, teachingLanguages, slugSchema } from "@/lib/university-schemas";

export const scholarshipUniversityFilterNames = ["universitySearch", "universityCountry", "universityMajor", "universityStudyLevel", "universityLanguage", "universityCity", "universityType", "universityFeatured"] as const;
const schema = z.object({
  universitySearch: z.string().trim().min(1).max(200).optional(),
  universityCountry: slugSchema.optional(), universityMajor: slugSchema.optional(), universityCity: slugSchema.optional(),
  universityStudyLevel: z.enum(programStudyLevels).optional(), universityLanguage: z.enum(teachingLanguages).optional(),
  universityType: z.enum(["PUBLIC", "PRIVATE"]).optional(), universityFeatured: z.enum(["true", "false"]).optional(),
});
/** Parse each known URL value independently; never forward an invalid or invented filter. */
export function scholarshipUniversityFilters(params: Record<string, string | string[] | undefined>) {
  const fields: Record<string, string> = {};
  for (const key of scholarshipUniversityFilterNames) {
    const value = params[key]; if (typeof value !== "string" || !value.trim()) continue;
    const parsed = schema.shape[key].safeParse(value.trim()); if (parsed.success && parsed.data) fields[key] = parsed.data;
  }
  return schema.parse(fields);
}
