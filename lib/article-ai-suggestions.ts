import { z } from "zod";

import type { ArticleRichTextBlock } from "@/lib/api-client/content";
import { normalizeApiError } from "@/lib/api-client/error";
import type { ContentFormValues } from "@/lib/content-form";

const articleBlockSchema = z
  .object({
    type: z.enum(["paragraph", "heading2", "heading3", "bulleted-list", "numbered-list", "quote"]),
    text: z.string().min(1).max(10_000),
  })
  .strict();

const contentSuggestionSchema = z.object({
  success: z.literal(true),
  data: z.object({
    titleAr: z.string().min(1).max(300),
    summaryAr: z.string().min(1).max(20_000),
    bodyAr: z.array(articleBlockSchema).min(1).max(500),
  }),
});

const seoSuggestionSchema = z.object({
  success: z.literal(true),
  data: z.object({
    seoTitleAr: z.string().min(1).max(120),
    seoDescriptionAr: z.string().min(1).max(320),
  }),
});

export type ArticleContentSuggestion = z.infer<typeof contentSuggestionSchema>["data"];
export type ArticleSeoSuggestion = z.infer<typeof seoSuggestionSchema>["data"];
export type ArticleContentSuggestionField = "titleAr" | "summaryAr" | "bodyAr";
export type ArticleSeoSuggestionField = "seoTitleAr" | "seoDescriptionAr";

export function articleAiGenerationAction(
  savedArticleId: string | undefined,
  hasUnsavedChanges: boolean,
  requestInFlight: boolean,
): "start" | "confirm-unsaved" | "unavailable" {
  if (!savedArticleId || requestInFlight) return "unavailable";
  return hasUnsavedChanges ? "confirm-unsaved" : "start";
}

export function parseArticleContentSuggestion(payload: unknown): ArticleContentSuggestion {
  return contentSuggestionSchema.parse(payload).data;
}

export function parseArticleSeoSuggestion(payload: unknown): ArticleSeoSuggestion {
  return seoSuggestionSchema.parse(payload).data;
}

/** Applies only an explicitly accepted field; persistence remains the form's normal PATCH workflow. */
export function applyAcceptedContentSuggestion(
  values: ContentFormValues,
  suggestion: ArticleContentSuggestion,
  fields: readonly ArticleContentSuggestionField[],
): ContentFormValues {
  const next = { ...values };
  for (const field of fields) {
    if (field === "bodyAr") next.bodyAr = suggestion.bodyAr.map((block): ArticleRichTextBlock => ({ ...block }));
    else next[field] = suggestion[field];
  }
  return next;
}

/** AI SEO values are explicit editor choices and therefore replace only their accepted fields. */
export function applyAcceptedSeoSuggestion(
  values: ContentFormValues,
  suggestion: ArticleSeoSuggestion,
  fields: readonly ArticleSeoSuggestionField[],
): ContentFormValues {
  const next = { ...values };
  for (const field of fields) next[field] = suggestion[field];
  return next;
}

type SuggestionErrorDetails = { resetAt?: unknown; retryAfterSeconds?: unknown };

export type ArticleAiSuggestionError = {
  message: string;
  resetAt?: string;
  retryAfterSeconds?: number;
};

function documentedError(error: unknown): { code?: string; details?: SuggestionErrorDetails } {
  const data = normalizeApiError(error).responseData;
  if (typeof data !== "object" || data === null || !("error" in data)) return {};
  const candidate = (data as { error?: unknown }).error;
  if (typeof candidate !== "object" || candidate === null) return {};
  const record = candidate as { code?: unknown; details?: unknown };
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    details: typeof record.details === "object" && record.details !== null ? record.details as SuggestionErrorDetails : undefined,
  };
}

/** Maps only documented Gemini-operation failures to Arabic, without leaking provider diagnostics. */
export function articleAiSuggestionError(error: unknown): ArticleAiSuggestionError | undefined {
  const normalized = normalizeApiError(error);
  if (normalized.kind === "cancelled") return undefined;

  const { code, details } = documentedError(error);
  if (code === "GEMINI_DAILY_LIMIT_REACHED") {
    return {
      message: "تم الوصول إلى الحد اليومي لتحسين المحتوى بالذكاء الاصطناعي.",
      resetAt: typeof details?.resetAt === "string" ? details.resetAt : undefined,
    };
  }
  if (code === "GEMINI_PROVIDER_QUOTA_EXCEEDED") {
    return {
      message: "تجاوز مزود الذكاء الاصطناعي حده المؤقت. حاول لاحقًا.",
      retryAfterSeconds:
        typeof details?.retryAfterSeconds === "number" && Number.isFinite(details.retryAfterSeconds) && details.retryAfterSeconds >= 0
          ? details.retryAfterSeconds
          : undefined,
    };
  }

  const messages: Record<number, string> = {
    400: "لا يمكن إنشاء الاقتراحات من النسخة المحفوظة الحالية للمقال. راجع محتواه ثم حاول مرة أخرى.",
    401: "انتهت الجلسة. سجّل الدخول مجددًا ثم أعد المحاولة.",
    403: "لا تملك صلاحية استخدام تحسين المحتوى بالذكاء الاصطناعي.",
    404: "لم يُعثر على المقال المحفوظ المطلوب لتحسينه.",
    413: "حجم المحتوى المحفوظ يتجاوز الحد الآمن لخدمة التحسين.",
    429: "تم تجاوز حد طلبات تحسين المحتوى. حاول لاحقًا.",
    502: "أعاد مزود الذكاء الاصطناعي اقتراحًا غير صالح؛ لم تُغيَّر أي حقول.",
    503: "خدمة تحسين المحتوى بالذكاء الاصطناعي غير متاحة حاليًا.",
    504: "انتهت مهلة خدمة تحسين المحتوى بالذكاء الاصطناعي. حاول لاحقًا.",
  };
  return { message: normalized.status ? (messages[normalized.status] ?? "تعذّر إنشاء اقتراحات الذكاء الاصطناعي. حاول لاحقًا.") : "تعذّر الاتصال بخدمة تحسين المحتوى بالذكاء الاصطناعي." };
}
