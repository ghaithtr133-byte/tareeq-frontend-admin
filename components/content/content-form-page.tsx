"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import type {
  AdminContentResource,
  Article,
  ArticleRichTextBlock,
  ContentRecord,
  HardDeletableContentResource,
  University,
} from "@/lib/api-client/content";
import {
  applyAcceptedContentSuggestion,
  applyAcceptedSeoSuggestion,
  articleAiGenerationAction,
  articleAiSuggestionError,
  type ArticleContentSuggestion,
  type ArticleContentSuggestionField,
  type ArticleSeoSuggestion,
  type ArticleSeoSuggestionField,
} from "@/lib/article-ai-suggestions";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import {
  ArticleContentSuggestionPreview,
  ArticleSeoSuggestionPreview,
} from "@/components/content/article-ai-suggestions";
import { ContentHardDeleteDialog } from "@/components/content/content-hard-delete-dialog";
import { ArticleScholarships } from "@/components/content/article-scholarships";
import { DetailCollectionManager } from "@/components/content/detail-collection-manager";
import {
  ScholarshipOptionsModal,
  useScholarshipOptionCatalog,
  type ScholarshipOptionKind,
} from "@/components/content/scholarship-options-modal";
import { DirectorySelector } from "@/components/universities/controls";
import { ImageUpload } from "@/components/media/image-upload";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ImageIcon,
  Settings2Icon,
  SpinnerIcon,
} from "@/components/ui/admin-icons";
import { useCreateContent, useUpdateContent } from "@/hook/mutations/use-content-mutations";
import { useArticleContentSuggestions, useArticleSeoSuggestions } from "@/hook/mutations/use-article-ai-suggestions";
import { useContentDetail, useContentSelector } from "@/hook/queries/use-content-queries";
import { contentDefinitions, type ContentFieldDefinition } from "@/lib/content-config";
import {
  applyArticleSeoDefaults,
  applyUniversitySeoDefaults,
  initialContentValues,
  toContentPatch,
  toContentPayload,
  type ContentFormValues,
  validateContentValues,
} from "@/lib/content-form";
import { StaleContentSessionError } from "@/lib/content-session";
import { contentErrorFieldName, contentSaveErrorMessage } from "@/lib/content-save-feedback";
import { useAdminAccess } from "@/providers/admin-access-provider";

const inputClass =
  "mt-1.5 min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--navy)] placeholder:text-[var(--muted)]/75 hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none";

function SaveErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
      {message}
    </p>
  );
}

/** Loaded only for Article forms because it relies on browser editing APIs. */
const ArticleRichTextEditor = dynamic(
  () => import("@/components/content/article-block-editor").then((module) => module.ArticleRichTextEditor),
  {
    ssr: false,
    loading: () => <div className="min-h-64 animate-pulse rounded-xl border border-[var(--line)] bg-slate-100" aria-label="جارٍ تحميل محرر المقال" />,
  },
);

const createSubmitLabels: Record<AdminContentResource, string> = {
  countries: "إضافة الدولة",
  universities: "إضافة الجامعة",
  scholarships: "إضافة المنحة",
  services: "إضافة الخدمة",
  articles: "إنشاء المقال",
};

type ArticleContentSuggestionState = {
  articleId: string;
  original: Pick<ArticleContentSuggestion, "titleAr" | "summaryAr" | "bodyAr">;
  suggestion: ArticleContentSuggestion;
  decisions: Partial<Record<ArticleContentSuggestionField, "accepted" | "rejected">>;
};

type ArticleSeoSuggestionState = {
  articleId: string;
  original: Pick<ArticleSeoSuggestion, "seoTitleAr" | "seoDescriptionAr">;
  suggestion: ArticleSeoSuggestion;
  decisions: Partial<Record<ArticleSeoSuggestionField, "accepted" | "rejected">>;
};

type ArticleAiKind = "content" | "seo";

function isArticleRichTextBlocks(value: ContentFormValues["bodyAr"]): value is ArticleRichTextBlock[] {
  return Array.isArray(value) && value.every((block) =>
    typeof block === "object" &&
    block !== null &&
    "type" in block &&
    "text" in block,
  );
}

function articleContentSuggestionSnapshot(values: ContentFormValues): ArticleContentSuggestionState["original"] {
  return {
    titleAr: String(values.titleAr ?? ""),
    summaryAr: String(values.summaryAr ?? ""),
    bodyAr: isArticleRichTextBlocks(values.bodyAr) ? values.bodyAr.map((block) => ({ ...block })) : [],
  };
}

function articleSeoSuggestionSnapshot(values: ContentFormValues): ArticleSeoSuggestionState["original"] {
  return {
    seoTitleAr: String(values.seoTitleAr ?? ""),
    seoDescriptionAr: String(values.seoDescriptionAr ?? ""),
  };
}

function articleAiErrorDetail(error: ReturnType<typeof articleAiSuggestionError>) {
  if (!error) return null;
  if (error.resetAt) return `يتجدد الحد في ${error.resetAt}.`;
  if (error.retryAfterSeconds !== undefined) return `يمكن إعادة المحاولة بعد ${error.retryAfterSeconds} ثانية.`;
  return null;
}

type FormSectionGroup = {
  id: string;
  title: string;
  description?: string;
  fieldNames: string[];
  mediaBlocks?: ("primary" | "country-overview" | "university-logo")[];
  extraSlot?: "article-scholarships" | "article-body" | "article-ai";
};

const RESOURCE_SECTIONS: Record<AdminContentResource, FormSectionGroup[]> = {
  countries: [
    {
      id: "identity",
      title: "البيانات الأساسية والهوية",
      description: "الاسم العربي والإنجليزي والمعرّف النصي لصفحة الدولة.",
      fieldNames: ["nameAr", "nameEn", "slug"],
    },
    {
      id: "content",
      title: "المحتوى التعريفي",
      description: "المقدمة والتفاصيل العامة المعروضة في صفحة الوجهة الدراسية.",
      fieldNames: ["introductionAr", "detailsAr"],
    },
    {
      id: "study-summary",
      title: "ملخص دليل الدراسة",
      description: "ملخصات سريعة للغة الدراسة والرسوم والقبول والمواعيد.",
      fieldNames: [
        "studyLanguageAr",
        "tuitionSummaryAr",
        "admissionSummaryAr",
        "applicationDatesSummaryAr",
      ],
    },
    {
      id: "media",
      title: "الصور والوسائط",
      description: "الصورة الرئيسية أو العلم وصورة النظرة العامة مع النص البديل.",
      fieldNames: ["imageUrl", "imageAltAr", "overviewImageUrl", "overviewImageAltAr"],
      mediaBlocks: ["primary", "country-overview"],
    },
    {
      id: "publishing",
      title: "النشر",
      fieldNames: ["status", "featured"],
    },
  ],
  universities: [
    {
      id: "identity",
      title: "المعلومات الأساسية",
      description: "الاسم الرسمي ونوع الجامعة وموقعها الجغرافي.",
      fieldNames: ["nameAr", "officialName", "universityType", "countryId", "cityId", "cityAr"],
    },
    {
      id: "overview",
      title: "نظرة عامة عن الجامعة",
      description: "المحتوى التعريفي والموقع الرسمي المعتمد.",
      fieldNames: ["summaryAr", "overviewAr", "officialWebsite"],
    },
    {
      id: "media",
      title: "الشعار وصورة الغلاف",
      description: "رفع ومعاينة شعار الجامعة وصورة الحرم الجامعي.",
      fieldNames: ["logoUrl", "logoAltAr", "imageUrl", "imageAltAr"],
      mediaBlocks: ["university-logo", "primary"],
    },
    {
      id: "publishing",
      title: "حالة النشر",
      fieldNames: ["status", "featured"],
    },
  ],
  scholarships: [
    {
      id: "identity",
      title: "العنوان والتعريف",
      fieldNames: ["titleAr", "titleEn", "slug"],
    },
    {
      id: "academic",
      title: "الدولة والجامعة والتصنيف الأكاديمي",
      description: "تحديد الجهة المانحة والمستوى الدراسي ونوع التمويل.",
      fieldNames: ["countryId", "universityId", "studyLevel", "fundingType"],
    },
    {
      id: "application",
      title: "حالة التقديم والمواعيد",
      fieldNames: ["applicationStatus", "verifiedDeadline", "officialSourceUrl"],
    },
    {
      id: "details",
      title: "الوصف والمتطلبات",
      fieldNames: ["descriptionAr", "requirementsAr"],
    },
    {
      id: "media",
      title: "الصورة التعريفية",
      fieldNames: ["imageUrl", "imageAltAr"],
      mediaBlocks: ["primary"],
    },
    {
      id: "publishing",
      title: "النشر",
      fieldNames: ["status", "featured"],
    },
  ],
  services: [
    {
      id: "identity",
      title: "البيانات الأساسية للخدمة",
      fieldNames: ["titleAr", "titleEn", "slug"],
    },
    {
      id: "content",
      title: "الملخص والوصف التفصيلي",
      fieldNames: ["summaryAr", "descriptionAr"],
    },
    {
      id: "media",
      title: "الصورة التعريفية",
      fieldNames: ["imageUrl", "imageAltAr"],
      mediaBlocks: ["primary"],
    },
    {
      id: "publishing",
      title: "النشر وتحسين محركات البحث (SEO)",
      fieldNames: ["status", "featured", "seoTitleAr", "seoDescriptionAr"],
    },
  ],
  articles: [
    {
      id: "identity",
      title: "المعلومات الأساسية",
      fieldNames: ["titleAr", "summaryAr"],
    },
    {
      id: "body",
      title: "محتوى المقال",
      fieldNames: [],
      extraSlot: "article-body",
    },
    {
      id: "ai-optimization",
      title: "تحسين المقال بالذكاء الاصطناعي",
      description: "تُنشأ الاقتراحات من آخر نسخة محفوظة فقط، ولا تُحفظ أي قيمة قبل اعتمادها ثم حفظ التغييرات.",
      fieldNames: [],
      extraSlot: "article-ai",
    },
    {
      id: "media",
      title: "صورة المقال",
      fieldNames: ["coverImageUrl", "coverImageAltAr"],
      mediaBlocks: ["primary"],
    },
    {
      id: "relationships",
      title: "المحتوى المرتبط",
      description: "المنح المختارة يدويًا لها الأولوية، وتُستخدم دولة المقال لاقتراح المنح تلقائيًا.",
      fieldNames: ["countryId"],
      extraSlot: "article-scholarships",
    },
    {
      id: "publishing",
      title: "حالة النشر",
      fieldNames: ["status", "featured"],
    },
  ],
};

function fieldDirection(field: ContentFieldDefinition): "rtl" | "ltr" {
  if (field.kind === "url" || field.kind === "number" || field.kind === "datetime-local")
    return "ltr";
  if (field.name === "slug" || field.name.endsWith("En") || field.name === "officialName")
    return "ltr";
  return "rtl";
}

function isFullWidthField(field: ContentFieldDefinition): boolean {
  return (
    field.kind === "textarea" ||
    field.kind === "checkbox" ||
    field.name === "officialSourceUrl" ||
    field.name === "officialWebsite"
  );
}

function universitySlugFallback(officialName: unknown): string {
  return String(officialName ?? "")
    .toLocaleLowerCase("en")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function articleSlugFallback(titleEn: unknown, titleAr: unknown): string {
  const normalize = (value: string) =>
    value
      .toLocaleLowerCase("en")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);
  const latinTitle = normalize(String(titleEn ?? ""));
  if (latinTitle.length >= 2) return latinTitle;

  const arabicToLatin: Record<string, string> = {
    ا: "a", أ: "a", إ: "i", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh",
    د: "d", ذ: "dh", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z",
    ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w",
    ي: "y", ى: "a", ة: "h", ء: "", ئ: "y", ؤ: "w", "ً": "", "ٌ": "", "ٍ": "", "َ": "", "ُ": "", "ِ": "", "ّ": "", "ْ": "",
  };
  const transliterated = Array.from(String(titleAr ?? ""))
    .map((character) => arabicToLatin[character] ?? character)
    .join("");
  return normalize(transliterated);
}

function ImagePreview({ url, title = "معاينة الصورة" }: { url?: string; title?: string }) {
  const validUrl = Boolean(url && /^https?:\/\//.test(url));
  const [state, setState] = useState<
    "empty" | "invalid" | "loading" | "loaded" | "unavailable"
  >(!url ? "empty" : validUrl ? "loading" : "invalid");

  const detail =
    state === "empty"
      ? "لم يُدخل رابط صورة بعد."
      : state === "invalid"
        ? "رابط الصورة غير صالح للمعاينة. استخدم رابطًا يبدأ بـ http أو https."
        : "تعذّر تحميل معاينة الصورة. سيُحفظ الرابط المدخل دون تغيير.";

  return (
    <div
      className="rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3.5"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[var(--navy)]">
        <ImageIcon className="size-4 text-[var(--gold-dark)]" />
        <span>{title}</span>
      </div>
      {validUrl && state !== "unavailable" ? (
        <img
          src={url}
          alt={title}
          onLoad={() => setState("loaded")}
          onError={() => setState("unavailable")}
          className={`max-h-56 max-w-full rounded-lg border border-[var(--line)] bg-white object-contain ${
            state === "loading" ? "min-h-24" : ""
          }`}
        />
      ) : null}
      {state !== "loaded" ? (
        <p className="rounded-lg border border-dashed border-[var(--line)] bg-white px-3 py-4 text-xs leading-5 text-[var(--muted)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export function ContentFormPage({
  resource,
  id,
}: {
  resource: AdminContentResource;
  id?: string;
}) {
  const router = useRouter();
  const access = useAdminAccess();
  const definition = contentDefinitions[resource];
  const detail = useContentDetail(resource, id);

  const relationships = useMemo(
    () => ({
      countries: definition.fields.some((field) => field.kind === "country"),
      universities: resource !== "articles" && definition.fields.some((field) => field.kind === "university"),
      scholarships: definition.fields.some((field) => field.kind === "scholarship"),
    }),
    [definition.fields, resource],
  );

  const countrySelector = useContentSelector("countries", "manual", {
    available: relationships.countries,
  });
  const universitySelector = useContentSelector("universities", "name", {
    available: relationships.universities,
  });
  const create = useCreateContent(resource);
  const update = useUpdateContent(resource);
  const contentSuggestions = useArticleContentSuggestions();
  const seoSuggestions = useArticleSeoSuggestions();

  const studyLevelCatalog = useScholarshipOptionCatalog("studyLevel");
  const fundingTypeCatalog = useScholarshipOptionCatalog("fundingType");
  const [optionsModalKind, setOptionsModalKind] = useState<ScholarshipOptionKind | null>(
    null,
  );
  const [manualArticleSlug, setManualArticleSlug] = useState(false);
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);

  const [submitError, setSubmitError] = useState<string>();
  const [relationshipChecks, setRelationshipChecks] = useState(0);
  const [contentSuggestion, setContentSuggestion] = useState<ArticleContentSuggestionState>();
  const [seoSuggestion, setSeoSuggestion] = useState<ArticleSeoSuggestionState>();
  const [articleAiError, setArticleAiError] = useState<{ articleId: string; error: ReturnType<typeof articleAiSuggestionError> }>();
  const [generationWarning, setGenerationWarning] = useState<{ articleId: string; kind: ArticleAiKind }>();
  const [acceptedAiSeo, setAcceptedAiSeo] = useState<{ articleId: string; fields: Set<ArticleSeoSuggestionField> }>();
  const [articleAiBusy, setArticleAiBusy] = useState<{ articleId: string; active: boolean }>();
  const submissionRef = useRef(false);
  const articleAiRequestRef = useRef<ArticleAiKind | undefined>(undefined);
  const articleAiAbortRef = useRef<AbortController | undefined>(undefined);
  const currentContentSuggestion = contentSuggestion?.articleId === id ? contentSuggestion : undefined;
  const currentSeoSuggestion = seoSuggestion?.articleId === id ? seoSuggestion : undefined;
  const currentArticleAiError = articleAiError && articleAiError.articleId === id ? articleAiError.error : undefined;
  const currentGenerationWarning = generationWarning?.articleId === id ? generationWarning : undefined;
  const acceptedAiSeoFields = acceptedAiSeo && acceptedAiSeo.articleId === id ? acceptedAiSeo.fields : undefined;
  const currentArticleAiBusy = Boolean(articleAiBusy && articleAiBusy.articleId === id && articleAiBusy.active);

  const form = useForm<ContentFormValues>({
    defaultValues: initialContentValues(resource),
    shouldUnregister: false,
  });

  const { register, handleSubmit, reset, setError, setValue, clearErrors, formState } = form;
  const imageField = resource === "articles" ? "coverImageUrl" : "imageUrl";

  const watchedImage = useWatch({ control: form.control, name: imageField });
  const watchedOverviewImage = useWatch({
    control: form.control,
    name: "overviewImageUrl",
  });
  const watchedLogoImage = useWatch({ control: form.control, name: "logoUrl" });
  const watchedFeatured = useWatch({ control: form.control, name: "featured" });
  const watchedStudyLevel = useWatch({ control: form.control, name: "studyLevel" });
  const watchedFundingType = useWatch({ control: form.control, name: "fundingType" });
  const selectedCountryId = useWatch({ control: form.control, name: "countryId" });
  const selectedCityId = useWatch({ control: form.control, name: "cityId" });
  const selectedUniversityId = useWatch({ control: form.control, name: "universityId" });
  const selectedScholarshipIds = useWatch({
    control: form.control,
    name: "scholarshipIds",
  });

  const relationshipValue = (value: unknown) =>
    typeof value === "string" ? value : undefined;

  useEffect(() => () => {
    articleAiAbortRef.current?.abort();
    articleAiAbortRef.current = undefined;
    articleAiRequestRef.current = undefined;
  }, [id, resource]);

  async function generateArticleSuggestion(kind: ArticleAiKind) {
    if (resource !== "articles" || !id || articleAiRequestRef.current) return;
    const controller = new AbortController();
    articleAiRequestRef.current = kind;
    articleAiAbortRef.current = controller;
    setArticleAiBusy({ articleId: id, active: true });
    setArticleAiError(undefined);
    setGenerationWarning(undefined);
    const originalValues = form.getValues();
    try {
      if (kind === "content") {
        const suggestion = await contentSuggestions.generate(id, controller.signal);
        if (!controller.signal.aborted) {
          setContentSuggestion({
            articleId: id,
            original: articleContentSuggestionSnapshot(originalValues),
            suggestion,
            decisions: {},
          });
        }
      } else {
        const suggestion = await seoSuggestions.generate(id, controller.signal);
        if (!controller.signal.aborted) {
          setSeoSuggestion({
            articleId: id,
            original: articleSeoSuggestionSnapshot(originalValues),
            suggestion,
            decisions: {},
          });
        }
      }
    } catch (error) {
      if (!controller.signal.aborted && !(error instanceof StaleContentSessionError)) {
        setArticleAiError({ articleId: id, error: articleAiSuggestionError(error) });
      }
    } finally {
      if (articleAiAbortRef.current === controller) articleAiAbortRef.current = undefined;
      if (articleAiRequestRef.current === kind) articleAiRequestRef.current = undefined;
      setArticleAiBusy({ articleId: id, active: false });
    }
  }

  function requestArticleSuggestion(kind: ArticleAiKind) {
    const action = articleAiGenerationAction(id, formState.isDirty, currentArticleAiBusy || Boolean(articleAiRequestRef.current));
    if (resource !== "articles" || !id || action === "unavailable") return;
    if (action === "confirm-unsaved") {
      setGenerationWarning({ articleId: id, kind });
      return;
    }
    void generateArticleSuggestion(kind);
  }

  function acceptContentSuggestion(fields: readonly ArticleContentSuggestionField[]) {
    if (!contentSuggestion) return;
    const next = applyAcceptedContentSuggestion(form.getValues(), contentSuggestion.suggestion, fields);
    for (const field of fields) {
      setValue(field, next[field], { shouldDirty: true, shouldValidate: true });
      clearErrors(field);
    }
    setContentSuggestion((current) => current ? {
      ...current,
      decisions: { ...current.decisions, ...Object.fromEntries(fields.map((field) => [field, "accepted" as const])) },
    } : current);
  }

  function rejectContentSuggestion(field: ArticleContentSuggestionField) {
    setContentSuggestion((current) => current ? {
      ...current,
      decisions: { ...current.decisions, [field]: "rejected" },
    } : current);
  }

  function acceptSeoSuggestion(fields: readonly ArticleSeoSuggestionField[]) {
    if (!seoSuggestion || !id) return;
    const next = applyAcceptedSeoSuggestion(form.getValues(), seoSuggestion.suggestion, fields);
    for (const field of fields) setValue(field, next[field], { shouldDirty: true, shouldValidate: true });
    setAcceptedAiSeo((current) => {
      const currentFields = current && current.articleId === id ? current.fields : [];
      return { articleId: id, fields: new Set([...currentFields, ...fields]) };
    });
    setSeoSuggestion((current) => current ? {
      ...current,
      decisions: { ...current.decisions, ...Object.fromEntries(fields.map((field) => [field, "accepted" as const])) },
    } : current);
  }

  function rejectSeoSuggestion(field: ArticleSeoSuggestionField) {
    setSeoSuggestion((current) => current ? {
      ...current,
      decisions: { ...current.decisions, [field]: "rejected" },
    } : current);
  }

  async function countryChanged(countryId: string) {
    if (resource === "universities") {
      if (countryId !== selectedCountryId) {
        setValue("cityId", "", { shouldDirty: true });
      }
      return;
    }
    if (resource !== "scholarships" || !countryId) return;
    const universityId = relationshipValue(form.getValues("universityId"));
    if (!universityId) return;
    setRelationshipChecks((count) => count + 1);
    try {
      const result =
        universitySelector.isError || !universitySelector.data
          ? await universitySelector.refetch()
          : universitySelector;
      if (
        form.getValues("countryId") !== countryId ||
        form.getValues("universityId") !== universityId
      )
        return;
      if (result.isError || !result.data) {
        setError("universityId", {
          message:
            "تعذّر التحقق من ارتباط الجامعة. أعد تحميل الخيارات أو اختر بلا ارتباط.",
        });
        return;
      }
      const university = result.data.pages
        .flatMap((page) => page.items)
        .find((item) => item.id === universityId);
      if (!university || university.countryId !== countryId) {
        setValue("universityId", "", { shouldDirty: true });
      }
    } finally {
      setRelationshipChecks((count) => count - 1);
    }
  }

  useEffect(() => {
    if (detail.data) {
      reset(initialContentValues(resource, detail.data as ContentRecord));
    }
  }, [detail.data, reset, resource]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (formState.isDirty) event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [formState.isDirty]);

  async function submit(values: ContentFormValues) {
    setSubmitError(undefined);
    if (!id && resource === "universities" && !String(values.slug ?? "").trim()) {
      const generated = universitySlugFallback(values.officialName);
      if (generated.length >= 2) {
        values.slug = generated;
        setValue("slug", generated, { shouldDirty: true });
      }
    }
    if (!id && resource === "articles" && !String(values.slug ?? "").trim()) {
      const generated = articleSlugFallback(values.titleEn, values.titleAr);
      if (generated.length >= 2) {
        values.slug = generated;
        setValue("slug", generated, { shouldDirty: true });
      } else {
        setManualArticleSlug(true);
        setError("slug", {
          type: "validate",
          message: "تعذّر إنشاء معرّف نصي تلقائيًا؛ أدخله يدويًا.",
        });
        window.requestAnimationFrame(() => {
          document.getElementById("articles-slug")?.focus();
        });
        return;
      }
    }
    if (resource === "universities") {
      Object.assign(
        values,
        applyUniversitySeoDefaults(values, detail.data as University | undefined),
      );
    }
    if (resource === "articles") {
      Object.assign(values, applyArticleSeoDefaults(values, detail.data as Article | undefined, {
        preserveExplicitSeo: acceptedAiSeoFields,
      }));
    }
    const validation = validateContentValues(resource, values);
    if (Object.keys(validation).length) {
      for (const [name, message] of Object.entries(validation)) {
        setError(name, { type: "validate", message });
      }
      const firstField = Object.keys(validation)[0];
      window.requestAnimationFrame(() => {
        const field = document.getElementById(`${resource}-${firstField}`);
        field?.scrollIntoView({ block: "center", behavior: "smooth" });
        field?.focus();
      });
      return;
    }
    const baseline = detail.data
      ? initialContentValues(resource, detail.data as ContentRecord)
      : undefined;
    const relationshipsChanged =
      !baseline ||
      values.countryId !== baseline.countryId ||
      values.universityId !== baseline.universityId;
    if (
      resource === "scholarships" &&
      relationshipsChanged &&
      values.countryId &&
      values.universityId
    ) {
      const university = universitySelector.items.find(
        (item) => item.id === values.universityId,
      );
      if (
        relationshipChecks ||
        universitySelector.isError ||
        !university ||
        university.countryId !== values.countryId
      ) {
        setError("universityId", {
          message: "تحقق من جامعة تابعة للدولة المختارة؛ لم تُرسل العلاقات غير المتوافقة.",
        });
        return;
      }
    }
    const oldStatus = (detail.data as ContentRecord | undefined)?.status;
    const newStatus = values.status;
    if (
      oldStatus !== newStatus &&
      (newStatus === "PUBLISHED" || newStatus === "ARCHIVED") &&
      !window.confirm("هل تريد تأكيد تغيير الحالة التحريرية؟")
    ) {
      return;
    }
    if (submissionRef.current || create.isPending || update.isPending) return;
    submissionRef.current = true;
    try {
      const payload =
        id && detail.data
          ? toContentPatch(resource, values, detail.data as ContentRecord, {
              statusChanged: Boolean(formState.dirtyFields.status),
            })
          : toContentPayload(resource, values);
      if (id) await update.mutateAsync({ id, input: payload });
      else await create.mutateAsync(payload);
      router.replace(`/admin/${resource}`);
    } catch (error) {
      if (error instanceof StaleContentSessionError) return;
      const fieldErrors = getApiFieldErrors(error);
      const displayFieldErrors: Record<string, string[]> = {};
      for (const [name, messages] of Object.entries(fieldErrors)) {
        const field = contentErrorFieldName(name);
        if (!displayFieldErrors[field]) displayFieldErrors[field] = messages;
        setError(field, { type: "server", message: messages[0] });
      }
      const normalized = normalizeApiError(error);
      if (normalized.kind !== "cancelled") {
        setSubmitError(contentSaveErrorMessage(error, displayFieldErrors));
        const firstField = Object.keys(displayFieldErrors)[0];
        window.requestAnimationFrame(() => {
          const field = firstField
            ? document.getElementById(`${resource}-${firstField}`)
            : undefined;
          field?.scrollIntoView({ block: "center", behavior: "smooth" });
          field?.focus();
        });
      }
    } finally {
      submissionRef.current = false;
    }
  }

  const fieldMap = useMemo(
    () => new Map(definition.fields.map((field) => [field.name, field])),
    [definition.fields],
  );

  const countrySelectOptions = useMemo(
    () =>
      countrySelector.items.map((item) => ({
        value: item.id,
        label: item.nameAr,
        sublabel: item.nameEn ?? item.slug,
      })),
    [countrySelector.items],
  );

  const universitySelectOptions = useMemo(() => {
    const cid = relationshipValue(selectedCountryId);
    return universitySelector.items
      .filter((item) => !cid || item.countryId === cid)
      .map((item) => ({
        value: item.id,
        label: item.nameAr,
        sublabel: item.cityAr,
      }));
  }, [universitySelector.items, selectedCountryId]);

  const studyLevelSelectOptions = useMemo(() => {
    const current = typeof watchedStudyLevel === "string" ? watchedStudyLevel.trim() : "";
    const merged = [...studyLevelCatalog.options];
    if (current && !merged.includes(current)) merged.unshift(current);
    return merged.map((item) => ({ value: item, label: item }));
  }, [studyLevelCatalog.options, watchedStudyLevel]);

  const fundingTypeSelectOptions = useMemo(() => {
    const current = typeof watchedFundingType === "string" ? watchedFundingType.trim() : "";
    const merged = [...fundingTypeCatalog.options];
    if (current && !merged.includes(current)) merged.unshift(current);
    return merged.map((item) => ({ value: item, label: item }));
  }, [fundingTypeCatalog.options, watchedFundingType]);

  if (id && detail.isPending) return <LoadingState />;
  if (id && detail.isError)
    return (
      <ErrorState
        action={
          <button
            type="button"
            onClick={() => void detail.refetch()}
            className="rounded-xl bg-[var(--navy)] px-4 py-2 text-sm font-bold text-white"
          >
            إعادة المحاولة
          </button>
        }
      />
    );

  const preview = typeof watchedImage === "string" ? watchedImage.trim() : undefined;
  const overviewPreview =
    typeof watchedOverviewImage === "string" ? watchedOverviewImage.trim() : undefined;
  const logoPreview =
    typeof watchedLogoImage === "string" ? watchedLogoImage.trim() : undefined;

  const errors = formState.errors as Record<string, { message?: string }>;
  const formId = `content-form-${resource}-${id ?? "new"}`;
  const isPending = create.isPending || update.isPending || relationshipChecks > 0;
  const submitLabel = id ? "حفظ التغييرات" : createSubmitLabels[resource];
  const universityCityLabel =
    resource === "universities" ? (detail.data as University | undefined)?.city?.nameAr : undefined;
  const hardDeleteResource = (["articles", "universities"] as const).includes(resource as "articles" | "universities")
    ? resource as HardDeletableContentResource
    : undefined;
  const hardDeleteName = resource === "articles"
    ? (detail.data as Article | undefined)?.titleAr
    : resource === "universities"
      ? (detail.data as University | undefined)?.nameAr
      : undefined;
  const canHardDelete =
    Boolean(hardDeleteResource) &&
    Boolean(id && detail.data) &&
    !access.mockEnabled &&
    (access.user?.role === "ADMIN" || access.user?.role === "SUPER_ADMIN");

  function renderField(fieldName: string) {
    const field = fieldMap.get(fieldName);
    if (!field || field.uiHidden || field.kind === "scholarships") return null;
    if (
      (resource === "universities" && (field.name === "logoUrl" || field.name === "imageUrl")) ||
      (resource === "articles" && field.name === "coverImageUrl")
    ) {
      return null;
    }

    const fieldId = `${resource}-${field.name}`;
    const error = errors[field.name]?.message;
    const direction = fieldDirection(field);
    const directionalClass = direction === "ltr" ? "text-left" : "text-right";
    const spanClass = isFullWidthField(field) ? "md:col-span-2" : "";

    if (field.kind === "city") {
      return (
        <div key={field.name} className={spanClass}>
          <DirectorySelector
            key={relationshipValue(selectedCountryId) ?? "no-country"}
            kind="cities"
            label={field.label}
            countryId={relationshipValue(selectedCountryId)}
            value={relationshipValue(selectedCityId) ?? ""}
            selectedLabel={universityCityLabel}
            onChange={(value) => {
              setValue("cityId", value, { shouldDirty: true, shouldValidate: true });
              clearErrors("cityId");
            }}
          />
          {field.hint ? (
            <p className="mt-1 text-xs text-[var(--muted)]">{field.hint}</p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-1 text-xs font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      );
    }

    if (field.kind === "checkbox") {
      return (
        <div key={field.name} className={spanClass}>
          <SwitchToggle
            id={fieldId}
            label={field.label}
            description="تفعيل هذا الخيار يبرز المحتوى في الواجهة العامة وقوائم المميزة."
            checked={Boolean(watchedFeatured)}
            showStarIcon
            onChange={(checked) => setValue(field.name, checked, { shouldDirty: true })}
          />
        </div>
      );
    }

    if (resource === "scholarships" && (field.name === "studyLevel" || field.name === "fundingType")) {
      const kind: ScholarshipOptionKind =
        field.name === "studyLevel" ? "studyLevel" : "fundingType";
      const currentVal =
        kind === "studyLevel"
          ? relationshipValue(watchedStudyLevel) ?? ""
          : relationshipValue(watchedFundingType) ?? "";
      const opts =
        kind === "studyLevel" ? studyLevelSelectOptions : fundingTypeSelectOptions;

      return (
        <div key={field.name} className="space-y-1.5">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <SearchableSelect
                id={fieldId}
                label={field.label}
                required={field.required}
                value={currentVal}
                options={opts}
                placeholder={`اختر ${field.label}`}
                allowClear={!field.required}
                error={error}
                onChange={(nextValue) => {
                  setValue(field.name, nextValue, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  clearErrors(field.name);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setOptionsModalKind(kind)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--navy)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/50 whitespace-nowrap"
            >
              <Settings2Icon className="size-3.5 text-[var(--gold-dark)]" />
              <span>إدارة الخيارات</span>
            </button>
          </div>
        </div>
      );
    }

    if (field.kind === "country" || field.kind === "university") {
      const isCountry = field.kind === "country";
      const val = isCountry
        ? relationshipValue(selectedCountryId) ?? ""
        : relationshipValue(selectedUniversityId) ?? "";
      const lookup = isCountry ? countrySelector : universitySelector;
      const selectedLabel = isCountry
        ? (detail.data as { country?: { nameAr?: string } } | undefined)?.country?.nameAr
        : (detail.data as { university?: { nameAr?: string } } | undefined)?.university?.nameAr;

      return (
        <div key={field.name} className={spanClass}>
          <SearchableSelect
            id={fieldId}
            label={field.label}
            required={field.required}
            value={val}
            options={isCountry ? countrySelectOptions : universitySelectOptions}
            selectedLabel={selectedLabel}
            placeholder={field.nullable ? "بلا ارتباط" : "اختر عنصرًا"}
            clearLabel={field.nullable ? "بلا ارتباط" : "إزالة الاختيار"}
            allowClear={Boolean(field.nullable)}
            isLoading={lookup.isFetching || lookup.isSearchPending}
            isError={lookup.isError}
            onRetry={() => void lookup.refetch()}
            searchPlaceholder={isCountry ? "ابحث في جميع الدول..." : "ابحث في جميع الجامعات..."}
            searchValue={lookup.search}
            onSearchChange={lookup.setSearch}
            onOpenChange={lookup.setOpen}
            hasMore={!lookup.isSearchPending && Boolean(lookup.hasNextPage)}
            isLoadingMore={lookup.isFetchingNextPage}
            onLoadMore={() => void lookup.fetchNextPage()}
            endMessage={isCountry ? "تم عرض جميع الدول المطابقة." : "تم عرض جميع الجامعات المطابقة."}
            error={error}
            onChange={(nextValue) => {
              setValue(field.name, nextValue, {
                shouldDirty: true,
                shouldValidate: true,
              });
              clearErrors(field.name);
              if (isCountry) void countryChanged(nextValue);
            }}
          />
          {field.hint ? (
            <p className="mt-1 text-xs text-[var(--muted)]">{field.hint}</p>
          ) : null}
        </div>
      );
    }

    const common = {
      id: fieldId,
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `${fieldId}-error` : undefined,
    };

    return (
      <div key={field.name} className={spanClass}>
        <label htmlFor={fieldId} className="block text-xs font-semibold text-[var(--navy)]">
          {field.label}
          {field.required ? <span className="text-red-700"> *</span> : null}
        </label>

        {field.kind === "textarea" ? (
          <textarea
            {...common}
            dir={direction}
            rows={5}
            maxLength={field.maxLength}
            className={`${inputClass} leading-6 ${directionalClass}`}
            {...register(field.name)}
          />
        ) : field.kind === "select" ? (
          <div className="relative mt-1.5">
            <select
              {...common}
              className="min-h-10 w-full appearance-none rounded-lg border border-[var(--line)] bg-white py-2 pr-3 pl-9 text-sm text-[var(--navy)] hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
              {...register(field.name)}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
          </div>
        ) : (
          <input
            {...common}
            type={
              field.kind === "datetime-local"
                ? "datetime-local"
                : field.kind === "number"
                  ? "number"
                  : field.kind === "url"
                    ? "url"
                    : "text"
            }
            step={field.kind === "datetime-local" ? "any" : undefined}
            dir={direction}
            maxLength={field.maxLength}
            min={field.kind === "number" ? 0 : undefined}
            max={field.kind === "number" ? 1000000 : undefined}
            className={`${inputClass} ${directionalClass}`}
            {...register(field.name)}
          />
        )}

        {field.hint ? (
          <p className="mt-1 text-xs text-[var(--muted)]">{field.hint}</p>
        ) : null}
        {error ? (
          <p id={`${fieldId}-error`} className="mt-1 text-xs font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold text-[var(--gold-dark)]">
            {definition.label}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">
            {id ? `تعديل ${definition.singular}` : `إضافة ${definition.singular} جديدة`}
          </h2>
        </div>

        <Link
          href={`/admin/${resource}`}
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-xl border border-[var(--line)] bg-white px-4 text-xs font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 sm:self-auto"
        >
          <ChevronRightIcon className="size-4" />
          <span>العودة إلى القائمة</span>
        </Link>
      </header>

      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          clearErrors();
          void handleSubmit(submit)(event);
        }}
        className="space-y-8 rounded-2xl border border-[var(--line)] bg-white p-5 pb-[calc(6rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-card)] sm:p-7"
      >
        {RESOURCE_SECTIONS[resource].map((section) => (
          <section key={section.id} className="space-y-4">
            <div className="border-b border-[var(--line)] pb-2.5">
              <h3 className="text-base font-bold text-[var(--navy)]">{section.title}</h3>
              {section.description ? (
                <p className="mt-0.5 text-xs text-[var(--muted)]">{section.description}</p>
              ) : null}
            </div>

            {(() => {
              const fieldNames =
                resource === "articles" && section.id === "identity" && manualArticleSlug
                  ? [...section.fieldNames, "slug"]
                  : section.fieldNames;
              return fieldNames.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {fieldNames.map((name) => renderField(name))}
              </div>
              ) : null;
            })()}

            {section.extraSlot === "article-scholarships" ? (
              <ArticleScholarships
                value={
                  Array.isArray(selectedScholarshipIds)
                    ? (selectedScholarshipIds as string[])
                    : []
                }
                selected={(detail.data as Article | undefined)?.relatedScholarships}
                onChange={(ids) =>
                  setValue("scholarshipIds", ids, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={isPending}
                error={errors.scholarshipIds?.message}
              />
            ) : null}

            {section.extraSlot === "article-body" ? (
              <div className="space-y-4">
                <ArticleRichTextEditor
                  control={form.control}
                  name="bodyAr"
                  fieldId="articles-bodyAr"
                  label="محتوى المقال بالعربية"
                  required
                  error={errors.bodyAr?.message}
                />
                {/* <ArticleRichTextEditor
                  control={form.control}
                  name="bodyEn"
                  fieldId="articles-bodyEn"
                  label="محتوى المقال بالإنجليزية"
                  error={errors.bodyEn?.message}
                /> */}
              </div>
            ) : null}

            {section.extraSlot === "article-ai" ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    يستخدم التحسين آخر نسخة محفوظة من المقال فقط. احفظ التعديلات الحالية أولًا إذا أردت تضمينها في الاقتراح.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!id || currentArticleAiBusy || contentSuggestions.isPending || seoSuggestions.isPending}
                      onClick={() => requestArticleSuggestion("content")}
                      className="min-h-10 rounded-xl bg-[var(--navy)] px-4 text-xs font-bold text-white transition-colors hover:bg-[var(--navy-light)] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {contentSuggestions.isPending ? "جارٍ تحسين المحتوى…" : "تحسين المحتوى بالذكاء الاصطناعي"}
                    </button>
                    <button
                      type="button"
                      disabled={!id || currentArticleAiBusy || contentSuggestions.isPending || seoSuggestions.isPending}
                      onClick={() => requestArticleSuggestion("seo")}
                      className="min-h-10 rounded-xl border border-[var(--navy)] bg-white px-4 text-xs font-bold text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {seoSuggestions.isPending ? "جارٍ تحسين SEO…" : "تحسين SEO بالذكاء الاصطناعي"}
                    </button>
                  </div>
                </div>

                {!id ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                    احفظ المقال أولًا قبل طلب اقتراحات الذكاء الاصطناعي.
                  </p>
                ) : null}

                {currentGenerationWarning ? (
                  <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                    <p className="font-bold">لديك تعديلات غير محفوظة.</p>
                    <p className="mt-1 leading-6">سيعتمد الاقتراح على آخر نسخة محفوظة ولن يستبدل أي حقل قبل اعتمادك الصريح.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => void generateArticleSuggestion(currentGenerationWarning.kind)} className="min-h-9 rounded-lg bg-amber-800 px-3 text-xs font-bold text-white hover:bg-amber-900">
                        متابعة التوليد من النسخة المحفوظة
                      </button>
                      <button type="button" onClick={() => setGenerationWarning(undefined)} className="min-h-9 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100">
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : null}

                {currentArticleAiError ? (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                    <p className="font-semibold">{currentArticleAiError.message}</p>
                    {articleAiErrorDetail(currentArticleAiError) ? <p className="mt-1 text-xs">{articleAiErrorDetail(currentArticleAiError)}</p> : null}
                  </div>
                ) : null}

                {currentContentSuggestion ? (
                  <ArticleContentSuggestionPreview
                    original={currentContentSuggestion.original}
                    suggestion={currentContentSuggestion.suggestion}
                    decisions={currentContentSuggestion.decisions}
                    onAccept={(field) => acceptContentSuggestion([field])}
                    onReject={rejectContentSuggestion}
                    onAcceptAll={() => acceptContentSuggestion((["titleAr", "summaryAr", "bodyAr"] as const).filter((field) => !currentContentSuggestion.decisions[field]))}
                  />
                ) : null}

                {currentSeoSuggestion ? (
                  <ArticleSeoSuggestionPreview
                    original={currentSeoSuggestion.original}
                    suggestion={currentSeoSuggestion.suggestion}
                    decisions={currentSeoSuggestion.decisions}
                    onAccept={(field) => acceptSeoSuggestion([field])}
                    onReject={rejectSeoSuggestion}
                    onAcceptAll={() => acceptSeoSuggestion((["seoTitleAr", "seoDescriptionAr"] as const).filter((field) => !currentSeoSuggestion.decisions[field]))}
                  />
                ) : null}
              </div>
            ) : null}

            {section.mediaBlocks?.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {section.mediaBlocks.includes("university-logo") ? (
                  <div className="space-y-3">
                    <ImagePreview key={`logo-${logoPreview ?? ""}`} url={logoPreview} title="معاينة شعار الجامعة" />
                    <ImageUpload
                      resource="universities"
                      label="رفع شعار الجامعة"
                      manualUrlAvailable={false}
                      disabled={isPending}
                      onUploaded={(url) =>
                        setValue("logoUrl", url, { shouldDirty: true })
                      }
                    />
                  </div>
                ) : null}

                {section.mediaBlocks.includes("primary") ? (
                  <div className="space-y-3">
                    <ImagePreview
                      key={preview ?? ""}
                      url={preview}
                      title={
                        resource === "countries"
                          ? "معاينة العلم / الصورة الرئيسية"
                          : resource === "universities"
                            ? "معاينة صورة الغلاف"
                            : resource === "articles"
                              ? "معاينة صورة الغلاف"
                              : "معاينة الصورة"
                      }
                    />
                    <ImageUpload
                      resource={resource}
                      label={
                        resource === "countries"
                          ? "رفع صورة الدولة / العلم"
                          : resource === "universities"
                            ? "رفع صورة غلاف الجامعة"
                            : resource === "articles"
                              ? "رفع صورة المقال"
                            : "رفع صورة جديدة"
                      }
                      manualUrlAvailable={resource !== "universities" && resource !== "articles"}
                      disabled={isPending}
                      onUploaded={(url) =>
                        setValue(imageField, url, { shouldDirty: true })
                      }
                    />
                  </div>
                ) : null}

                {section.mediaBlocks.includes("country-overview") ? (
                  <div className="space-y-3">
                    <ImagePreview
                      key={`overview-${overviewPreview ?? ""}`}
                      url={overviewPreview}
                      title="معاينة صورة النظرة العامة"
                    />
                    <ImageUpload
                      resource="countries"
                      label="رفع صورة النظرة العامة"
                      disabled={isPending}
                      onUploaded={(url) =>
                        setValue("overviewImageUrl", url, { shouldDirty: true })
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ))}

        {/* Desktop Actions */}
        <div className="hidden border-t border-[var(--line)] pt-5 sm:block">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--navy-light)] disabled:cursor-wait disabled:opacity-60"
            >
              {isPending ? <SpinnerIcon className="size-4 animate-spin" /> : null}
              <span>{isPending ? "جارٍ الحفظ…" : submitLabel}</span>
            </button>

            <Link
              href={`/admin/${resource}`}
              className="inline-flex h-11 items-center rounded-xl border border-[var(--line)] px-5 text-sm font-semibold text-[var(--navy)] hover:bg-slate-50"
            >
              إلغاء
            </Link>
          </div>
          <div className="mt-3 max-w-xl"><SaveErrorMessage message={submitError} /></div>
        </div>
      </form>

      {canHardDelete ? (
        <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-red-900">منطقة خطرة</h3>
              <p className="mt-1 text-sm leading-6 text-red-800">
                الحذف نهائي ولا يمكن التراجع عنه. قد يطلب الخادم تأكيدًا إضافيًا لحماية البيانات المرتبطة.
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setHardDeleteOpen(true)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-wait disabled:opacity-45"
            >
              حذف نهائي
            </button>
          </div>
        </section>
      ) : null}

      {/* Preserved Detail Collection Manager on Edit */}
      {id &&
      (resource === "countries" ||
        resource === "services" ||
        resource === "scholarships") ? (
        <DetailCollectionManager resource={resource} parentId={id} />
      ) : null}

      {/* Mobile Sticky Action Bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 px-4 py-2.5 shadow-[0_-8px_24px_rgba(15,35,66,0.1)] backdrop-blur sm:hidden"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
        aria-label="إجراءات النموذج"
      >
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <button
            type="submit"
            form={formId}
            disabled={isPending}
            className="h-10 min-w-0 flex-1 rounded-xl bg-[var(--navy)] px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
          >
            {isPending ? "جارٍ الحفظ…" : submitLabel}
          </button>
          <Link
            href={`/admin/${resource}`}
            className="inline-flex h-10 items-center rounded-xl border border-[var(--line)] px-3 text-xs font-semibold text-[var(--navy)]"
          >
            إلغاء
          </Link>
        </div>
        <div className="mx-auto mt-2 max-w-xl"><SaveErrorMessage message={submitError} /></div>
      </div>

      {/* Dynamic Options Modal for Scholarships */}
      {optionsModalKind ? (
        <ScholarshipOptionsModal
          kind={optionsModalKind}
          open={Boolean(optionsModalKind)}
          onClose={() => setOptionsModalKind(null)}
          options={
            optionsModalKind === "studyLevel"
              ? studyLevelCatalog.options
              : fundingTypeCatalog.options
          }
          onUpdateOptions={
            optionsModalKind === "studyLevel"
              ? studyLevelCatalog.updateOptions
              : fundingTypeCatalog.updateOptions
          }
          onResetDefaults={
            optionsModalKind === "studyLevel"
              ? studyLevelCatalog.resetDefaults
              : fundingTypeCatalog.resetDefaults
          }
          currentValue={
            optionsModalKind === "studyLevel"
              ? relationshipValue(watchedStudyLevel)
              : relationshipValue(watchedFundingType)
          }
          onSelectValue={(val) =>
            setValue(optionsModalKind, val, { shouldDirty: true, shouldValidate: true })
          }
        />
      ) : null}

      {hardDeleteOpen && hardDeleteResource && id && hardDeleteName ? (
        <ContentHardDeleteDialog
          resource={hardDeleteResource}
          record={{ id, nameAr: hardDeleteName }}
          onClose={() => setHardDeleteOpen(false)}
          onDeleted={() => {
            setHardDeleteOpen(false);
            router.replace(`/admin/${resource}`);
          }}
        />
      ) : null}
    </section>
  );
}
