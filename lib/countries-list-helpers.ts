import type { PublicationStatus } from "@/lib/api-client/content";

export const COUNTRY_STATUS_FILTER_OPTIONS = [
  { value: "", label: "جميع الحالات" },
  { value: "DRAFT", label: "مسودة" },
  { value: "PUBLISHED", label: "منشورة" },
  { value: "ARCHIVED", label: "مؤرشفة" },
] as const;

export const COUNTRY_STATUS_LABELS: Record<PublicationStatus, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشورة",
  ARCHIVED: "مؤرشفة",
};

export const COUNTRY_PAGE_LIMIT_OPTIONS = [12, 24, 50] as const;

export function countryPublicationStatusLabel(status: PublicationStatus): string {
  return COUNTRY_STATUS_LABELS[status];
}

export function formatCountryAddedDate(createdAt: string | null | undefined): string {
  if (!createdAt || !Number.isFinite(Date.parse(createdAt))) return "—";
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(createdAt));
}

export interface CountriesPaginationSummary {
  start: number;
  end: number;
  total: number;
  rangeText: string;
  label: string;
}

export function formatCountriesPaginationSummary(
  page: number,
  limit: number,
  total: number,
): CountriesPaginationSummary {
  const safeTotal = Math.max(0, Math.floor(total));
  if (safeTotal === 0) {
    return {
      start: 0,
      end: 0,
      total: 0,
      rangeText: "0",
      label: "عرض 0 من أصل 0 دولة",
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
    label: `عرض ${rangeText} من أصل ${safeTotal} دولة`,
  };
}

export function countryFlagFromCode(countryCode?: string | null): string | null {
  if (!countryCode) return null;
  const trimmed = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(trimmed)) return null;
  return String.fromCodePoint(
    127397 + trimmed.charCodeAt(0),
    127397 + trimmed.charCodeAt(1),
  );
}

export function isSafeCountryThumbnailUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

export function countryInitialGlyph(nameAr?: string | null): string {
  const trimmed = (nameAr ?? "").trim();
  return trimmed ? Array.from(trimmed)[0] ?? "د" : "د";
}

export function hasActiveCountriesFilters(filters: {
  search?: string;
  status?: PublicationStatus;
  featured?: "true" | "false";
}): boolean {
  return Boolean(
    (filters.search && filters.search.trim().length > 0) ||
      filters.status ||
      filters.featured === "true",
  );
}

