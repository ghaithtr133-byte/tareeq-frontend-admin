import type {
  PublicationStatus,
  ScholarshipApplicationStatus,
  ScholarshipListParams,
} from "@/lib/api-client/content";
import type { ListSearchParams } from "@/lib/content-filters";

export const SCHOLARSHIPS_PAGE_LIMIT = 12;

export const SCHOLARSHIP_STATUS_FILTER_OPTIONS = [
  { value: "DRAFT", label: "مسودة" },
  { value: "PUBLISHED", label: "منشورة" },
  { value: "ARCHIVED", label: "مؤرشفة" },
] as const;

export const SCHOLARSHIP_APPLICATION_STATUS_FILTER_OPTIONS = [
  { value: "OPEN", label: "التقديم مفتوح" },
  { value: "CLOSED", label: "التقديم مغلق" },
] as const;

export const SCHOLARSHIP_SORT_OPTIONS = [
  { value: "newest", label: "الأحدث إضافةً" },
  { value: "deadline", label: "الأقرب لانتهاء التقديم" },
] as const;

export const SCHOLARSHIP_PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشورة",
  ARCHIVED: "مؤرشفة",
};

export const SCHOLARSHIP_APPLICATION_STATUS_LABELS: Record<
  ScholarshipApplicationStatus,
  string
> = {
  OPEN: "التقديم مفتوح",
  CLOSED: "التقديم مغلق",
};

export function scholarshipPublicationStatusLabel(status: PublicationStatus): string {
  return SCHOLARSHIP_PUBLICATION_STATUS_LABELS[status];
}

export function scholarshipApplicationStatusLabel(
  status: ScholarshipApplicationStatus,
): string {
  return SCHOLARSHIP_APPLICATION_STATUS_LABELS[status];
}

function singleParam(params: ListSearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

function allowedValue<T extends string>(
  value: string | undefined,
  options: readonly T[],
): T | undefined {
  const trimmed = value?.trim();
  return trimmed && options.includes(trimmed as T) ? (trimmed as T) : undefined;
}

/**
 * Parses URL search parameters for the redesigned Scholarships List.
 * Fixed page size limit=12, removes legacy university-program filters from UI state,
 * and ensures featured=true is only sent when explicitly enabled.
 */
export function parseScholarshipsListFilters(
  params: ListSearchParams,
): ScholarshipListParams {
  const output: ScholarshipListParams = {
    page: positiveInt(singleParam(params, "page"), 1),
    limit: SCHOLARSHIPS_PAGE_LIMIT,
    sort:
      allowedValue(singleParam(params, "sort"), ["newest", "deadline"] as const) ??
      "newest",
  };

  const stringKeys = [
    "search",
    "country",
    "university",
    "studyLevel",
    "fundingType",
  ] as const;

  for (const key of stringKeys) {
    const trimmed = singleParam(params, key)?.trim();
    if (trimmed) {
      output[key] = trimmed;
    }
  }

  const status = allowedValue(singleParam(params, "status"), [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
  ] as const);
  if (status) output.status = status;

  const applicationStatus = allowedValue(singleParam(params, "applicationStatus"), [
    "OPEN",
    "CLOSED",
  ] as const);
  if (applicationStatus) output.applicationStatus = applicationStatus;

  if (singleParam(params, "featured")?.trim() === "true") {
    output.featured = "true";
  }

  return output;
}

export function buildScholarshipsFilterUrlParams(
  current: ScholarshipListParams,
  patch: Partial<Record<keyof ScholarshipListParams, string | number | undefined>>,
  options: { resetPage?: boolean } = { resetPage: true },
): URLSearchParams {
  const merged: Record<string, string | number | undefined> = {
    ...current,
    ...patch,
    limit: undefined,
  };

  if (options.resetPage !== false) {
    merged.page = 1;
  }

  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined) continue;
    const text = String(value).trim();
    if (!text) continue;
    if (key === "featured" && text !== "true") continue;
    if (key === "sort" && text === "newest") continue;
    next.set(key, text);
  }
  if (!next.has("page")) {
    next.set("page", "1");
  }
  return next;
}

export function countActiveScholarshipsSecondaryFilters(
  filters: ScholarshipListParams,
): number {
  let count = 0;
  if (filters.university?.trim()) count += 1;
  if (filters.studyLevel?.trim()) count += 1;
  if (filters.fundingType?.trim()) count += 1;
  return count;
}

export function hasActiveScholarshipsFilters(
  filters: ScholarshipListParams,
): boolean {
  return Boolean(
    filters.search?.trim() ||
      filters.country?.trim() ||
      filters.status ||
      filters.applicationStatus ||
      filters.featured === "true" ||
      filters.sort === "deadline" ||
      countActiveScholarshipsSecondaryFilters(filters) > 0,
  );
}

export interface ScholarshipDeadlineDisplay {
  label: string;
  isSpecified: boolean;
  isExpired: boolean;
}

export function formatScholarshipDeadline(
  verifiedDeadline: string | null | undefined,
  nowMs: number = Date.now(),
): ScholarshipDeadlineDisplay {
  if (!verifiedDeadline) {
    return { label: "غير محدد", isSpecified: false, isExpired: false };
  }
  const timestamp = Date.parse(verifiedDeadline);
  if (!Number.isFinite(timestamp)) {
    return { label: "غير محدد", isSpecified: false, isExpired: false };
  }

  return {
    label: new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(
      new Date(timestamp),
    ),
    isSpecified: true,
    isExpired: timestamp < nowMs,
  };
}

export function formatScholarshipUpdatedAt(
  updatedAt: string | null | undefined,
): string {
  if (!updatedAt || !Number.isFinite(Date.parse(updatedAt))) return "—";
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(
    new Date(updatedAt),
  );
}

export interface ScholarshipsPaginationSummary {
  start: number;
  end: number;
  total: number;
  rangeText: string;
  label: string;
}

export function formatScholarshipsPaginationSummary(
  page: number,
  limit: number,
  total: number,
): ScholarshipsPaginationSummary {
  const safeTotal = Math.max(0, Math.floor(total));
  if (safeTotal === 0) {
    return {
      start: 0,
      end: 0,
      total: 0,
      rangeText: "0",
      label: "عرض 0 من أصل 0 منحة",
    };
  }

  const safeLimit = Math.max(1, Math.floor(limit));
  const safePage = Math.max(1, Math.floor(page));
  const start = Math.min((safePage - 1) * safeLimit + 1, safeTotal);
  const end = Math.min(safePage * safeLimit, safeTotal);
  const rangeText = `${start}–${end}`;

  return {
    start,
    end,
    total: safeTotal,
    rangeText,
    label: `عرض ${rangeText} من أصل ${safeTotal} منحة`,
  };
}

