import type { ArticleListParams, PublicationStatus } from "@/lib/api-client/content";
import type { ListSearchParams } from "@/lib/content-filters";

export const ARTICLES_DESKTOP_PAGE_LIMIT = 12;
export const ARTICLES_MOBILE_PAGE_LIMIT = 5;

export const ARTICLE_STATUS_FILTER_OPTIONS = [
  { value: "DRAFT", label: "مسودة" },
  { value: "PUBLISHED", label: "منشورة" },
  { value: "ARCHIVED", label: "مؤرشفة" },
] as const;

export const ARTICLE_STATUS_LABELS: Record<PublicationStatus, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشورة",
  ARCHIVED: "مؤرشفة",
};

function one(params: ListSearchParams, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

function page(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

/** Parse only the query parameters documented for GET /admin/articles. */
export function parseArticlesListFilters(params: ListSearchParams): ArticleListParams {
  const output: ArticleListParams = {
    page: page(one(params, "page")),
    limit: ARTICLES_DESKTOP_PAGE_LIMIT,
    sort: "newest",
  };

  for (const key of ["search", "country"] as const) {
    const value = one(params, key)?.trim();
    if (value) output[key] = value;
  }

  const status = one(params, "status");
  if (status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED") {
    output.status = status;
  }
  if (one(params, "featured") === "true") output.featured = "true";
  return output;
}

export function buildArticlesFilterUrlParams(
  current: ArticleListParams,
  patch: Partial<Record<keyof ArticleListParams, string | number | undefined>>,
  options: { resetPage?: boolean } = {},
): URLSearchParams {
  const merged: Record<string, string | number | undefined> = {
    ...current,
    ...patch,
    limit: undefined,
    sort: undefined,
  };
  if (options.resetPage ?? true) merged.page = 1;

  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined) continue;
    const text = String(value).trim();
    if (!text || (key === "featured" && text !== "true")) continue;
    next.set(key, text);
  }
  if (!next.has("page")) next.set("page", "1");
  return next;
}

export function hasActiveArticlesFilters(filters: ArticleListParams): boolean {
  return Boolean(
    filters.search?.trim() ||
      filters.country?.trim() ||
      filters.status ||
      filters.featured === "true",
  );
}

export function activeArticlesAdditionalFilters(filters: ArticleListParams): number {
  return filters.country?.trim() ? 1 : 0;
}

export function formatArticleDate(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(value));
}

export function formatArticlesPaginationSummary(pageNumber: number, limit: number, total: number) {
  const safeTotal = Math.max(0, Math.floor(total));
  if (!safeTotal) return "عرض 0 من أصل 0 مقال";
  const start = Math.min((Math.max(1, pageNumber) - 1) * Math.max(1, limit) + 1, safeTotal);
  const end = Math.min(Math.max(1, pageNumber) * Math.max(1, limit), safeTotal);
  return `عرض ${start}–${end} من أصل ${safeTotal} مقال`;
}
