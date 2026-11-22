import { z } from "zod";
import type {
  AdminContentResource,
  ContentTypeMap,
  PublicationStatus,
  ScholarshipApplicationStatus,
} from "@/lib/api-client/content";
import { contentDefinitions } from "@/lib/content-config";
import { programStudyLevels, teachingLanguageCodeSchema, slugSchema } from "@/lib/university-schemas";

export type ListSearchParams = Record<string, string | string[] | undefined>;

export const scholarshipUniversityFilterNames = [
  "universitySearch",
  "universityCountry",
  "universityMajor",
  "universityStudyLevel",
  "universityLanguage",
  "universityCity",
  "universityType",
  "universityFeatured",
] as const;

const schema = z.object({
  universitySearch: z.string().trim().min(1).max(200).optional(),
  universityCountry: slugSchema.optional(),
  universityMajor: slugSchema.optional(),
  universityCity: slugSchema.optional(),
  universityStudyLevel: z.enum(programStudyLevels).optional(),
  universityLanguage: teachingLanguageCodeSchema.optional(),
  universityType: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  universityFeatured: z.enum(["true"]).optional(),
});

/** Parse each known URL value independently; featured-only treats anything other than "true" as unset. */
export function scholarshipUniversityFilters(params: ListSearchParams) {
  const fields: Record<string, string> = {};
  for (const key of scholarshipUniversityFilterNames) {
    const value = params[key];
    if (typeof value !== "string" || !value.trim()) continue;
    const parsed = schema.shape[key].safeParse(value.trim());
    if (parsed.success && parsed.data) fields[key] = parsed.data;
  }
  return schema.parse(fields);
}

function one(params: ListSearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function positive(value: string | undefined, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : fallback;
}

function allowed<T extends string>(value: string | undefined, options: readonly T[]): T | undefined {
  return value && options.includes(value as T) ? (value as T) : undefined;
}

export function parseContentListFilters<K extends AdminContentResource>(
  resource: K,
  params: ListSearchParams,
): ContentTypeMap[K]["params"] {
  const definition = contentDefinitions[resource];
  const output: Record<string, string | number | undefined> = {
    page: positive(one(params, "page"), 1, Number.MAX_SAFE_INTEGER),
    limit: positive(one(params, "limit"), 12, 50),
  };

  const strings = [
    "search",
    "country",
    "university",
    "studyLevel",
    "fundingType",
    "major",
    "city",
  ] as const;

  for (const key of strings) {
    if (definition.filters.includes(key) && one(params, key)?.trim()) {
      output[key] = one(params, key)!.trim();
    }
  }

  if (resource === "universities") {
    output.studyLevel = allowed(one(params, "studyLevel"), programStudyLevels);
    const language = teachingLanguageCodeSchema.safeParse(one(params, "language"));
    output.language = language.success ? language.data : undefined;
    output.universityType = allowed(one(params, "universityType"), ["PUBLIC", "PRIVATE"]);
  }

  if (resource === "scholarships") {
    Object.assign(output, scholarshipUniversityFilters(params));
  }

  // Featured-only switch contract: OFF = omit `featured` completely; ON = `featured=true`.
  if (definition.filters.includes("featured") && one(params, "featured") === "true") {
    output.featured = "true";
  }

  if (definition.filters.includes("status")) {
    output.status = allowed(one(params, "status"), [
      "DRAFT",
      "PUBLISHED",
      "ARCHIVED",
    ] satisfies PublicationStatus[]);
  }

  if (definition.filters.includes("applicationStatus")) {
    output.applicationStatus = allowed(one(params, "applicationStatus"), [
      "OPEN",
      "CLOSED",
    ] satisfies ScholarshipApplicationStatus[]);
  }

  if (definition.filters.includes("sort")) {
    const requestedSort = allowed(
      one(params, "sort"),
      definition.sorts.map((sort) => sort.value),
    );
    // Default newest-first for main lists; manual sorting is omitted from main content UI.
    output.sort = requestedSort ?? "newest";
  }

  return Object.fromEntries(
    Object.entries(output).filter(([, value]) => value !== undefined),
  ) as ContentTypeMap[K]["params"];
}

export function buildContentFilterUrlParams(
  current: Record<string, string | number | undefined>,
  patch: Record<string, string | number | undefined>,
  options: { resetPage?: boolean } = { resetPage: true },
): URLSearchParams {
  const merged: Record<string, string | number | undefined> = { ...current, ...patch };
  if (options.resetPage !== false) {
    merged.page = 1;
  }
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined) continue;
    const text = String(value).trim();
    if (!text) continue;
    if ((key === "featured" || key === "universityFeatured") && text !== "true") continue;
    next.set(key, text);
  }
  if (!next.has("page")) next.set("page", "1");
  return next;
}

export function countActiveContentFilters(
  resource: AdminContentResource,
  filters: Record<string, string | number | undefined>,
): { primary: number; secondary: number; total: number } {
  const ignored = new Set(["page", "limit", "sort"]);
  const secondaryKeys = new Set<string>(
    resource === "scholarships"
      ? scholarshipUniversityFilterNames
      : resource === "universities"
        ? ["studyLevel", "language", "universityType"]
        : [],
  );

  let primary = 0;
  let secondary = 0;
  for (const [key, value] of Object.entries(filters)) {
    if (ignored.has(key)) continue;
    if (value === undefined || String(value).trim() === "") continue;
    if (secondaryKeys.has(key)) secondary += 1;
    else primary += 1;
  }
  return { primary, secondary, total: primary + secondary };
}
