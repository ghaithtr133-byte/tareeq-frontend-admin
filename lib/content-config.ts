import type { AdminContentResource, ArticleBlockType, ContentRecord, PublicationStatus } from "@/api/content";

export type FormFieldKind = "text" | "textarea" | "url" | "number" | "checkbox" | "select" | "datetime-local" | "country" | "university" | "scholarship";

export interface ContentFieldDefinition {
  name: string;
  label: string;
  kind: FormFieldKind;
  required?: boolean;
  maxLength?: number;
  nullable?: boolean;
  options?: readonly { value: string; label: string }[];
  hint?: string;
}

export interface ResourceDefinition {
  label: string;
  singular: string;
  titleField: "nameAr" | "titleAr";
  fields: readonly ContentFieldDefinition[];
  filters: readonly ("search" | "country" | "university" | "studyLevel" | "fundingType" | "applicationStatus" | "featured" | "status" | "sort")[];
  sorts: readonly { value: string; label: string }[];
}

export const publicationStatusOptions = [
  { value: "DRAFT", label: "مسودة" },
  { value: "PUBLISHED", label: "منشور" },
  { value: "ARCHIVED", label: "مؤرشف" },
] as const satisfies readonly { value: PublicationStatus; label: string }[];

export const articleBlockOptions = [
  { value: "paragraph", label: "فقرة" },
  { value: "heading2", label: "عنوان رئيسي" },
  { value: "heading3", label: "عنوان فرعي" },
  { value: "bulleted-list", label: "قائمة نقطية" },
  { value: "numbered-list", label: "قائمة مرقمة" },
  { value: "quote", label: "اقتباس" },
] as const satisfies readonly { value: ArticleBlockType; label: string }[];

const sharedFields = [
  { name: "slug", label: "المعرّف النصي (Slug)", kind: "text", required: true, maxLength: 120, hint: "أحرف إنجليزية صغيرة وأرقام وشرطات فقط." },
  { name: "featured", label: "محتوى مميز", kind: "checkbox" },
  { name: "status", label: "الحالة التحريرية", kind: "select", options: publicationStatusOptions },
  { name: "seoTitleAr", label: "عنوان SEO بالعربية", kind: "text", maxLength: 120 },
  { name: "seoDescriptionAr", label: "وصف SEO بالعربية", kind: "textarea", maxLength: 320 },
] as const satisfies readonly ContentFieldDefinition[];

const imageFields = [
  { name: "imageUrl", label: "رابط الصورة", kind: "url", maxLength: 2048 },
  { name: "imageAltAr", label: "النص البديل للصورة بالعربية", kind: "text", maxLength: 300 },
  { name: "imageAltEn", label: "النص البديل للصورة بالإنجليزية", kind: "text", maxLength: 300 },
] as const satisfies readonly ContentFieldDefinition[];

export const contentDefinitions: Record<AdminContentResource, ResourceDefinition> = {
  countries: {
    label: "الدول", singular: "دولة", titleField: "nameAr", filters: ["search", "featured", "status", "sort"],
    sorts: [{ value: "manual", label: "الترتيب اليدوي" }, { value: "newest", label: "الأحدث" }],
    fields: [
      { name: "nameAr", label: "اسم الدولة بالعربية", kind: "text", required: true, maxLength: 200 },
      { name: "nameEn", label: "اسم الدولة بالإنجليزية", kind: "text", maxLength: 200 },
      { name: "introductionAr", label: "المقدمة بالعربية", kind: "textarea", required: true, maxLength: 20000 },
      { name: "introductionEn", label: "المقدمة بالإنجليزية", kind: "textarea", maxLength: 20000 },
      { name: "detailsAr", label: "التفاصيل بالعربية", kind: "textarea", required: true, maxLength: 20000 },
      { name: "detailsEn", label: "التفاصيل بالإنجليزية", kind: "textarea", maxLength: 20000 },
      ...imageFields,
      { name: "displayOrder", label: "ترتيب العرض", kind: "number", maxLength: 7 },
      ...sharedFields,
    ],
  },
  universities: {
    label: "الجامعات", singular: "جامعة", titleField: "nameAr", filters: ["search", "country", "featured", "status", "sort"],
    sorts: [{ value: "newest", label: "الأحدث" }, { value: "name", label: "الاسم العربي" }],
    fields: [
      { name: "nameAr", label: "اسم الجامعة بالعربية", kind: "text", required: true, maxLength: 200 },
      { name: "nameEn", label: "اسم الجامعة بالإنجليزية", kind: "text", maxLength: 200 },
      { name: "officialName", label: "الاسم الرسمي", kind: "text", required: true, maxLength: 300 },
      { name: "countryId", label: "الدولة", kind: "country", required: true },
      { name: "cityAr", label: "المدينة بالعربية", kind: "text", required: true, maxLength: 200 },
      { name: "cityEn", label: "المدينة بالإنجليزية", kind: "text", maxLength: 200 },
      { name: "overviewAr", label: "نبذة بالعربية", kind: "textarea", required: true, maxLength: 20000 },
      { name: "overviewEn", label: "نبذة بالإنجليزية", kind: "textarea", maxLength: 20000 },
      { name: "officialWebsite", label: "الموقع الرسمي", kind: "url", maxLength: 2048 },
      ...imageFields, ...sharedFields,
    ],
  },
  scholarships: {
    label: "المنح الدراسية", singular: "منحة", titleField: "titleAr", filters: ["search", "country", "university", "studyLevel", "fundingType", "applicationStatus", "featured", "status", "sort"],
    sorts: [{ value: "newest", label: "الأحدث" }, { value: "deadline", label: "أقرب موعد" }],
    fields: [
      { name: "titleAr", label: "العنوان بالعربية", kind: "text", required: true, maxLength: 300 },
      { name: "titleEn", label: "العنوان بالإنجليزية", kind: "text", maxLength: 300 },
      { name: "countryId", label: "الدولة", kind: "country", nullable: true },
      { name: "universityId", label: "الجامعة", kind: "university", nullable: true },
      { name: "studyLevel", label: "المستوى الدراسي", kind: "text", required: true, maxLength: 120 },
      { name: "fundingType", label: "نوع التمويل", kind: "text", required: true, maxLength: 120 },
      { name: "requirementsAr", label: "المتطلبات بالعربية", kind: "textarea", required: true, maxLength: 20000 },
      { name: "requirementsEn", label: "المتطلبات بالإنجليزية", kind: "textarea", maxLength: 20000 },
      { name: "descriptionAr", label: "الوصف بالعربية", kind: "textarea", required: true, maxLength: 20000 },
      { name: "descriptionEn", label: "الوصف بالإنجليزية", kind: "textarea", maxLength: 20000 },
      { name: "verifiedDeadline", label: "الموعد النهائي الموثق", kind: "datetime-local", nullable: true },
      { name: "officialSourceUrl", label: "المصدر الرسمي", kind: "url", maxLength: 2048, nullable: true },
      { name: "applicationStatus", label: "حالة التقديم المخزنة", kind: "select", options: [{ value: "OPEN", label: "مفتوح" }, { value: "CLOSED", label: "مغلق" }] },
      ...sharedFields,
    ],
  },
  services: {
    label: "الخدمات", singular: "خدمة", titleField: "titleAr", filters: ["featured", "status", "sort"],
    sorts: [{ value: "manual", label: "الترتيب اليدوي" }, { value: "newest", label: "الأحدث" }],
    fields: [
      { name: "titleAr", label: "العنوان بالعربية", kind: "text", required: true, maxLength: 300 },
      { name: "titleEn", label: "العنوان بالإنجليزية", kind: "text", maxLength: 300 },
      { name: "summaryAr", label: "الملخص بالعربية", kind: "textarea", required: true, maxLength: 20000 },
      { name: "summaryEn", label: "الملخص بالإنجليزية", kind: "textarea", maxLength: 20000 },
      { name: "descriptionAr", label: "الوصف بالعربية", kind: "textarea", required: true, maxLength: 20000 },
      { name: "descriptionEn", label: "الوصف بالإنجليزية", kind: "textarea", maxLength: 20000 },
      ...imageFields,
      { name: "displayOrder", label: "ترتيب العرض", kind: "number", maxLength: 7 },
      ...sharedFields,
    ],
  },
  articles: {
    label: "المقالات", singular: "مقال", titleField: "titleAr", filters: ["search", "country", "featured", "status", "sort"],
    sorts: [{ value: "newest", label: "الأحدث" }],
    fields: [
      { name: "titleAr", label: "العنوان بالعربية", kind: "text", required: true, maxLength: 300 },
      { name: "titleEn", label: "العنوان بالإنجليزية", kind: "text", maxLength: 300 },
      { name: "summaryAr", label: "الملخص بالعربية", kind: "textarea", required: true, maxLength: 20000 },
      { name: "summaryEn", label: "الملخص بالإنجليزية", kind: "textarea", maxLength: 20000 },
      { name: "coverImageUrl", label: "رابط صورة الغلاف", kind: "url", maxLength: 2048 },
      { name: "coverImageAltAr", label: "النص البديل للغلاف بالعربية", kind: "text", maxLength: 300 },
      { name: "coverImageAltEn", label: "النص البديل للغلاف بالإنجليزية", kind: "text", maxLength: 300 },
      { name: "countryId", label: "الدولة المرتبطة", kind: "country", nullable: true },
      { name: "universityId", label: "الجامعة المرتبطة", kind: "university", nullable: true },
      { name: "scholarshipId", label: "المنحة المرتبطة", kind: "scholarship", nullable: true },
      ...sharedFields,
    ],
  },
};

export function isContentResource(value: string): value is AdminContentResource {
  return value in contentDefinitions;
}

export function contentTitle(resource: AdminContentResource, record: ContentRecord): string {
  const field = contentDefinitions[resource].titleField;
  return (record as unknown as Record<string, string>)[field];
}
