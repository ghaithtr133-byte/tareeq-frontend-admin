export const COUNTRY_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u0640]/g;

function normalizeArabicLookupKey(input: string): string {
  return input
    .trim()
    .replace(ARABIC_DIACRITICS_REGEX, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ");
}

const RAW_ARABIC_COUNTRY_SLUGS: ReadonlyArray<readonly [aliases: readonly string[], slug: string]> = [
  [["مصر", "جمهوريه مصر العربيه"], "egypt"],
  [["تركيا", "الجمهوريه التركيه"], "turkey"],
  [["الاردن", "اردن", "المملكه الاردنيه الهاشميه"], "jordan"],
  [["السعوديه", "سعوديه", "المملكه العربيه السعوديه"], "saudi-arabia"],
  [["الامارات", "امارات", "الامارات العربيه المتحده"], "united-arab-emirates"],
  [["قطر", "دوله قطر"], "qatar"],
  [["الكويت", "كويت", "دوله الكويت"], "kuwait"],
  [["البحرين", "بحرين", "مملكه البحرين"], "bahrain"],
  [["عمان", "سلطنه عمان"], "oman"],
  [["المغرب", "مغرب", "المملكه المغربيه"], "morocco"],
  [["تونس", "الجمهوريه التونسيه"], "tunisia"],
  [["الجزائر", "جزائر"], "algeria"],
  [["لبنان", "الجمهوريه اللبنانيه"], "lebanon"],
  [["العراق", "عراق"], "iraq"],
  [["فلسطين"], "palestine"],
  [["سوريا", "سوريه"], "syria"],
  [["اليمن", "يمن"], "yemen"],
  [["السودان", "سودان"], "sudan"],
  [["ليبيا"], "libya"],
  [["موريتانيا"], "mauritania"],
  [["المانيا", "المانيا الاتحاديه"], "germany"],
  [["المملكه المتحده", "بريطانيا", "انجلترا"], "united-kingdom"],
  [["الولايات المتحده", "الولايات المتحده الامريكيه", "امريكا"], "united-states"],
  [["كندا"], "canada"],
  [["فرنسا"], "france"],
  [["ايطاليا"], "italy"],
  [["اسبانيا"], "spain"],
  [["ماليزيا"], "malaysia"],
  [["الصين", "صين"], "china"],
  [["اليابان", "يابان"], "japan"],
  [["كوريا الجنوبيه"], "south-korea"],
  [["استراليا"], "australia"],
  [["نيوزيلندا"], "new-zealand"],
  [["روسيا", "روسيا الاتحاديه"], "russia"],
  [["بولندا"], "poland"],
  [["المجر", "هنغاريا"], "hungary"],
  [["هولندا"], "netherlands"],
  [["بلجيكا"], "belgium"],
  [["النمسا"], "austria"],
  [["سويسرا"], "switzerland"],
  [["السويد"], "sweden"],
  [["النرويج"], "norway"],
  [["الدنمارك"], "denmark"],
  [["فنلندا"], "finland"],
  [["ايرلندا"], "ireland"],
  [["البرتغال"], "portugal"],
  [["اليونان"], "greece"],
  [["التشيك", "تشيكيا", "جمهوريه التشيك"], "czech-republic"],
  [["رومانيا"], "romania"],
  [["بلغاريا"], "bulgaria"],
  [["اوكرانيا"], "ukraine"],
  [["جورجيا"], "georgia"],
  [["اذربيجان"], "azerbaijan"],
  [["قبرص"], "cyprus"],
  [["قبرص الشماليه"], "northern-cyprus"],
  [["مالطا"], "malta"],
  [["سنغافوره"], "singapore"],
  [["اندونيسيا"], "indonesia"],
  [["الهند", "هند"], "india"],
  [["باكستان"], "pakistan"],
  [["تايلاند"], "thailand"],
  [["فيتنام"], "vietnam"],
  [["الفلبين"], "philippines"],
  [["سلوفاكيا"], "slovakia"],
  [["سلوفينيا"], "slovenia"],
  [["كرواتيا"], "croatia"],
  [["صربيا"], "serbia"],
  [["ليتوانيا"], "lithuania"],
  [["لاتفيا"], "latvia"],
  [["استونيا"], "estonia"],
  [["لوكسمبورغ"], "luxembourg"],
  [["البرازيل"], "brazil"],
  [["الارجنتين"], "argentina"],
  [["المكسيك"], "mexico"],
  [["جنوب افريقيا"], "south-africa"],
];

const ARABIC_COUNTRY_SLUG_MAP: ReadonlyMap<string, string> = new Map(
  RAW_ARABIC_COUNTRY_SLUGS.flatMap(([aliases, slug]) =>
    aliases.map((alias) => [normalizeArabicLookupKey(alias), slug] as const),
  ),
);

const ARABIC_PREFIXES = ["دوله ", "جمهوريه ", "الجمهوريه ", "مملكه ", "المملكه ", "سلطنه "];

export function normalizeEnglishToSlug(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Reject mixed/non-Latin inputs that would lose meaningful words when stripped.
  const asciiOnly = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ");
  if (!/[a-zA-Z0-9]/.test(asciiOnly)) return null;

  const candidate = asciiOnly
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (candidate.length < 2 || candidate.length > 120) return null;
  if (!COUNTRY_SLUG_REGEX.test(candidate)) return null;
  return candidate;
}

export function lookupArabicCountrySlug(nameAr?: string | null): string | null {
  if (!nameAr) return null;
  const normalized = normalizeArabicLookupKey(nameAr);
  if (!normalized) return null;

  const direct = ARABIC_COUNTRY_SLUG_MAP.get(normalized);
  if (direct) return direct;

  for (const prefix of ARABIC_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      const stripped = normalized.slice(prefix.length).trim();
      const match = ARABIC_COUNTRY_SLUG_MAP.get(stripped);
      if (match) return match;
    }
  }

  return null;
}

export type SlugResolutionSource = "locked" | "manual" | "nameEn" | "dictionary" | "none";

export interface ResolveCountrySlugParams {
  nameAr?: string | null;
  nameEn?: string | null;
  currentSlug?: string | null;
  slugManuallyEdited: boolean;
  isEditMode: boolean;
  isPublished: boolean;
}

export function resolveAutoCountrySlug({
  nameAr,
  nameEn,
  currentSlug,
  slugManuallyEdited,
  isEditMode,
  isPublished,
}: ResolveCountrySlugParams): { slug: string; source: SlugResolutionSource } {
  const safeCurrent = (currentSlug ?? "").trim();

  if (isEditMode || isPublished) {
    return { slug: safeCurrent, source: "locked" };
  }

  if (slugManuallyEdited) {
    return { slug: safeCurrent, source: "manual" };
  }

  const fromEnglish = normalizeEnglishToSlug(nameEn);
  if (fromEnglish) {
    return { slug: fromEnglish, source: "nameEn" };
  }

  const fromArabic = lookupArabicCountrySlug(nameAr);
  if (fromArabic) {
    return { slug: fromArabic, source: "dictionary" };
  }

  return { slug: "", source: "none" };
}

export function suggestCountrySeoTitle(nameAr?: string | null): string {
  const clean = (nameAr ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return "";
  const candidate = `الدراسة في ${clean}`;
  return candidate.length <= 120 ? candidate : candidate.slice(0, 120).trim();
}

export function suggestCountrySeoDescription(introductionAr?: string | null): string {
  const clean = (introductionAr ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return "";
  const maxLen = 280;
  if (clean.length <= maxLen) return clean;
  const slice = clean.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 120 ? slice.slice(0, lastSpace) : slice).trim();
}

export const COUNTRY_ADVANCED_FIELD_NAMES = new Set([
  "slug",
  "nameEn",
  "seoTitleAr",
  "seoDescriptionAr",
]);

/** Visual top-to-bottom field focus priority for Country validation failures. */
export const COUNTRY_FIELD_FOCUS_ORDER: readonly string[] = [
  "nameAr",
  "introductionAr",
  "detailsAr",
  "studyLanguageAr",
  "admissionSummaryAr",
  "applicationDatesSummaryAr",
  "tuitionSummaryAr",
  "imageUrl",
  "imageAltAr",
  "overviewImageUrl",
  "overviewImageAltAr",
  "status",
  "featured",
  "slug",
  "nameEn",
  "seoTitleAr",
  "seoDescriptionAr",
];

export interface CountrySectionAnchor {
  id: string;
  label: string;
}

export const COUNTRY_SECTION_ANCHORS: readonly CountrySectionAnchor[] = [
  { id: "country-group-basic", label: "المعلومات الأساسية" },
  { id: "country-group-content", label: "المحتوى والدليل" },
  { id: "country-group-media", label: "الصور والمعلومات" },
  { id: "country-group-publishing", label: "النشر والإعدادات" },
];

