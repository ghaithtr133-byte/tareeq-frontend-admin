import type { Scholarship, ScholarshipInput } from "@/lib/api-client/content";
import { COUNTRY_SLUG_REGEX, normalizeEnglishToSlug } from "@/lib/country-form-helpers";
import { programStudyLevelLabels } from "@/lib/content-labels";
import { toContentPatch, type ContentFormValues } from "@/lib/content-form";

export const SCHOLARSHIP_SLUG_REGEX = COUNTRY_SLUG_REGEX;

const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u0640]/g;

const ARABIC_TRANSLITERATION_MAP: Readonly<Record<string, string>> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "a",
  ٱ: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  ة: "a",
  و: "w",
  ؤ: "w",
  ي: "y",
  ى: "a",
  ئ: "y",
  ء: "",
  پ: "p",
  چ: "ch",
  ژ: "zh",
  ڤ: "v",
  گ: "g",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

/**
 * Deterministic Arabic-to-Latin transliteration for scholarship URL slugs.
 * Preserves ASCII letters/digits, transliterates Arabic words cleanly, and caps length at a word boundary.
 * Returns null when the input cannot yield a reliable >= 2 character Latin slug.
 */
export function transliterateArabicToSlug(input?: string | null): string | null {
  if (!input) return null;
  const cleaned = input
    .trim()
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS_REGEX, "")
    .replace(/&/g, " and ");
  if (!cleaned) return null;

  let buffer = "";
  for (const ch of cleaned) {
    if (ch in ARABIC_TRANSLITERATION_MAP) {
      buffer += ARABIC_TRANSLITERATION_MAP[ch];
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      buffer += ch.toLowerCase();
    } else {
      buffer += "-";
    }
  }

  let slug = buffer
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > 80) {
    const truncated = slug.slice(0, 80);
    const lastDash = truncated.lastIndexOf("-");
    slug = (lastDash > 24 ? truncated.slice(0, lastDash) : truncated).replace(/-+$/g, "");
  }

  if (slug.length < 2 || slug.length > 120) return null;
  if (!SCHOLARSHIP_SLUG_REGEX.test(slug)) return null;
  return slug;
}

export type ScholarshipSlugSource = "locked" | "manual" | "titleEn" | "transliteration" | "none";

export interface ResolveScholarshipSlugParams {
  titleAr?: string | null;
  titleEn?: string | null;
  currentSlug?: string | null;
  slugManuallyEdited: boolean;
  isEditMode: boolean;
  isPublished: boolean;
}

export function resolveAutoScholarshipSlug({
  titleAr,
  titleEn,
  currentSlug,
  slugManuallyEdited,
  isEditMode,
  isPublished,
}: ResolveScholarshipSlugParams): { slug: string; source: ScholarshipSlugSource } {
  const safeCurrent = (currentSlug ?? "").trim();

  // Existing or published scholarships never auto-regenerate Slug when title changes.
  if (isEditMode || isPublished) {
    return { slug: safeCurrent, source: "locked" };
  }

  if (slugManuallyEdited) {
    return { slug: safeCurrent, source: "manual" };
  }

  const fromEnglish = normalizeEnglishToSlug(titleEn);
  if (fromEnglish) {
    return { slug: fromEnglish, source: "titleEn" };
  }

  const fromArabic = transliterateArabicToSlug(titleAr);
  if (fromArabic) {
    return { slug: fromArabic, source: "transliteration" };
  }

  return { slug: "", source: "none" };
}

export function suggestScholarshipSeoTitle(
  titleAr?: string | null,
  countryNameAr?: string | null,
): string {
  const cleanTitle = (titleAr ?? "").trim().replace(/\s+/g, " ");
  if (!cleanTitle) return "";
  const cleanCountry = (countryNameAr ?? "").trim().replace(/\s+/g, " ");
  if (cleanCountry && !cleanTitle.includes(cleanCountry)) {
    const withCountry = `${cleanTitle} - ${cleanCountry}`;
    if (withCountry.length <= 120) return withCountry;
  }
  return cleanTitle.length <= 120 ? cleanTitle : cleanTitle.slice(0, 120).trim();
}

export function suggestScholarshipSeoDescription(
  descriptionAr?: string | null,
  requirementsAr?: string | null,
): string {
  const source = (descriptionAr ?? "").trim() || (requirementsAr ?? "").trim();
  const clean = source.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const maxLen = 280;
  if (clean.length <= maxLen) return clean;
  const slice = clean.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 120 ? slice.slice(0, lastSpace) : slice).trim();
}

const KNOWN_FUNDING_CODE_LABELS: Readonly<Record<string, string>> = {
  FULL: "تمويل كامل",
  FULL_FUNDING: "تمويل كامل",
  FULLY_FUNDED: "تمويل كامل",
  PARTIAL: "تمويل جزئي",
  PARTIAL_FUNDING: "تمويل جزئي",
  PARTIALLY_FUNDED: "تمويل جزئي",
  TUITION_WAIVER: "إعفاء من الرسوم الدراسية",
  MONTHLY_STIPEND: "منحة شهرية",
  RESEARCH_GRANT: "تمويل بحثي",
};

const KNOWN_STUDY_LEVEL_CODE_LABELS: Readonly<Record<string, string>> = {
  ...programStudyLevelLabels,
  FELLOWSHIP: "زمالة بحثية",
  ALL_LEVELS: "جميع المستويات",
  ALL: "جميع المستويات",
};

export function scholarshipOptionDisplayLabel(
  kind: "studyLevel" | "fundingType",
  rawValue: string | null | undefined,
): string {
  if (!rawValue) return "";
  const trimmed = rawValue.trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if (kind === "studyLevel") {
    return KNOWN_STUDY_LEVEL_CODE_LABELS[upper] ?? trimmed;
  }
  return KNOWN_FUNDING_CODE_LABELS[upper] ?? trimmed;
}

export function isScholarshipUniversityCompatible(
  countryId: string | undefined | null,
  universityCountryId: string | undefined | null,
): boolean {
  if (!countryId || !universityCountryId) return true;
  return countryId === universityCountryId;
}

export function buildScholarshipPatch(
  values: ContentFormValues,
  baseline: Scholarship,
  options?: { statusChanged?: boolean },
): ScholarshipInput {
  const safeValues: ContentFormValues =
    baseline.status === "PUBLISHED"
      ? { ...values, slug: baseline.slug }
      : values;

  const patch = toContentPatch("scholarships", safeValues, baseline, options);
  if (baseline.status === "PUBLISHED" && "slug" in patch) {
    delete patch.slug;
  }
  if (!Object.keys(patch).length) {
    throw new Error("لا توجد تغييرات للحفظ.");
  }
  return patch;
}

export const SCHOLARSHIP_ADVANCED_FIELD_NAMES = new Set([
  "slug",
  "titleEn",
  "seoTitleAr",
  "seoDescriptionAr",
]);

/** Visual top-to-bottom field focus priority for Scholarship validation failures. */
export const SCHOLARSHIP_FIELD_FOCUS_ORDER: readonly string[] = [
  "titleAr",
  "countryId",
  "universityId",
  "studyLevel",
  "fundingType",
  "verifiedDeadline",
  "applicationStatus",
  "officialSourceUrl",
  "descriptionAr",
  "requirementsAr",
  "imageUrl",
  "imageAltAr",
  "status",
  "featured",
  "slug",
  "titleEn",
  "seoTitleAr",
  "seoDescriptionAr",
];

export interface ScholarshipSectionAnchor {
  id: string;
  label: string;
}

/** At most 4 high-level group jump links for comfortable normal scrolling. */
export const SCHOLARSHIP_SECTION_ANCHORS: readonly ScholarshipSectionAnchor[] = [
  { id: "scholarship-group-basic", label: "المعلومات الأساسية" },
  { id: "scholarship-group-details", label: "تفاصيل المنحة" },
  { id: "scholarship-group-content", label: "محتوى المنحة" },
  { id: "scholarship-group-media", label: "الصورة والنشر" },
];

