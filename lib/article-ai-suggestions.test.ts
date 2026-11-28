import assert from "node:assert/strict";
import test from "node:test";

import { AxiosError } from "axios";

import {
  applyAcceptedContentSuggestion,
  applyAcceptedSeoSuggestion,
  articleAiGenerationAction,
  articleAiSuggestionError,
  parseArticleContentSuggestion,
  parseArticleSeoSuggestion,
} from "@/lib/article-ai-suggestions";
import { articleAiApi } from "@/lib/api-client/article-ai";
import { apiClient } from "@/lib/api-client/client";
import type { Article } from "@/lib/api-client/content";
import { articleBlocksToEditorDocument } from "@/lib/article-rich-text";
import { applyArticleSeoDefaults, initialContentValues, toContentPatch } from "@/lib/content-form";

const id = "00000000-0000-4000-8000-000000000001";
const contentSuggestion = {
  titleAr: "عنوان محسّن",
  summaryAr: "ملخص محسّن",
  bodyAr: [
    { type: "heading2" as const, text: "عنوان" },
    { type: "paragraph" as const, text: "محتوى محسّن" },
    { type: "bulleted-list" as const, text: "نقطة أولى" },
  ],
};
const seoSuggestion = { seoTitleAr: "عنوان SEO محسّن", seoDescriptionAr: "وصف SEO محسّن" };

const article: Article = {
  id,
  slug: "article-guide",
  featured: false,
  publishedAt: null,
  seoTitleAr: "العنوان القديم",
  seoDescriptionAr: "الملخص القديم",
  titleAr: "العنوان القديم",
  titleEn: null,
  summaryAr: "الملخص القديم",
  summaryEn: null,
  bodyAr: [{ type: "paragraph", text: "المحتوى القديم" }],
  bodyEn: null,
  coverImageUrl: null,
  coverImageAltAr: null,
  coverImageAltEn: null,
  countryId: null,
  universityId: null,
  scholarshipId: null,
  status: "DRAFT",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  scholarshipIds: [],
  relatedScholarships: [],
};

test("TA-109: both Gemini endpoints issue one credentialed bodyless POST and validate their envelopes", async () => {
  const previous = apiClient.defaults.adapter;
  const calls: Array<{ method?: string; url?: string; data: unknown; withCredentials?: boolean }> = [];
  apiClient.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, data: config.data, withCredentials: config.withCredentials });
    const data = config.url?.endsWith("content-suggestions")
      ? { success: true, data: contentSuggestion }
      : { success: true, data: seoSuggestion };
    return { config, status: 200, statusText: "OK", headers: {}, data };
  };
  try {
    assert.deepEqual(await articleAiApi.contentSuggestions(id), contentSuggestion);
    assert.deepEqual(await articleAiApi.seoSuggestions(id), seoSuggestion);
    assert.deepEqual(calls, [
      { method: "post", url: `/admin/articles/${id}/content-suggestions`, data: undefined, withCredentials: true },
      { method: "post", url: `/admin/articles/${id}/seo-suggestions`, data: undefined, withCredentials: true },
    ]);
  } finally {
    apiClient.defaults.adapter = previous;
  }
});

test("TA-109: malformed AI suggestions are rejected before they can reach article form state", () => {
  assert.throws(
    () => parseArticleContentSuggestion({ success: true, data: { ...contentSuggestion, bodyAr: [{ type: "html", text: "<script>" }] } }),
  );
  assert.throws(
    () => parseArticleSeoSuggestion({ success: true, data: { ...seoSuggestion, seoTitleAr: "" } }),
  );
  assert.throws(
    () => parseArticleContentSuggestion({ success: true, data: { ...contentSuggestion, titleAr: "ا".repeat(301) } }),
  );
});

test("TA-109: explicit acceptance is selective, preserves other form values, and synchronizes supported rich-text blocks", () => {
  const before = { ...initialContentValues("articles", article), countryId: "11111111-1111-4111-8111-111111111111" };
  const contentAccepted = applyAcceptedContentSuggestion(before, contentSuggestion, ["bodyAr"]);
  assert.equal(contentAccepted.titleAr, article.titleAr);
  assert.equal(contentAccepted.countryId, before.countryId);
  assert.deepEqual(contentAccepted.bodyAr, contentSuggestion.bodyAr);
  assert.deepEqual(articleBlocksToEditorDocument(contentAccepted.bodyAr as typeof contentSuggestion.bodyAr), [
    { type: "heading2", text: "عنوان" },
    { type: "paragraph", text: "محتوى محسّن" },
    { type: "bulleted-list", items: ["نقطة أولى"] },
  ]);
  assert.deepEqual(
    toContentPatch("articles", contentAccepted, article, { statusChanged: false }),
    { countryId: "11111111-1111-4111-8111-111111111111", bodyAr: contentSuggestion.bodyAr },
  );

  const seoAccepted = applyAcceptedSeoSuggestion(before, seoSuggestion, ["seoDescriptionAr"]);
  assert.equal(seoAccepted.seoTitleAr, article.seoTitleAr);
  assert.equal(seoAccepted.seoDescriptionAr, seoSuggestion.seoDescriptionAr);
});

test("TA-109: an accepted AI SEO value survives automatic SEO defaults and normal PATCH serialization", () => {
  const accepted = applyAcceptedSeoSuggestion(
    { ...initialContentValues("articles", article), titleAr: "عنوان يدوي جديد" },
    seoSuggestion,
    ["seoTitleAr", "seoDescriptionAr"],
  );
  const values = applyArticleSeoDefaults(accepted, article, {
    preserveExplicitSeo: new Set(["seoTitleAr", "seoDescriptionAr"]),
  });
  assert.deepEqual(toContentPatch("articles", values, article, { statusChanged: false }), {
    titleAr: "عنوان يدوي جديد",
    seoTitleAr: seoSuggestion.seoTitleAr,
    seoDescriptionAr: seoSuggestion.seoDescriptionAr,
  });
});

test("TA-109: unsaved forms require confirmation and duplicate generation remains unavailable", () => {
  assert.equal(articleAiGenerationAction(undefined, false, false), "unavailable");
  assert.equal(articleAiGenerationAction(id, true, false), "confirm-unsaved");
  assert.equal(articleAiGenerationAction(id, false, true), "unavailable");
  assert.equal(articleAiGenerationAction(id, false, false), "start");
});

test("TA-109: cancellation is silent and documented quota errors expose only documented timing metadata", () => {
  const cancelled = new AxiosError("cancelled", "ERR_CANCELED");
  assert.equal(articleAiSuggestionError(cancelled), undefined);

  const daily = new AxiosError("rate", undefined, undefined, undefined, {
    config: {} as never,
    status: 429,
    statusText: "Too Many Requests",
    headers: {},
    data: { success: false, error: { code: "GEMINI_DAILY_LIMIT_REACHED", message: "ignored", details: { remainingRequests: 0, resetAt: "2026-12-01T00:00:00.000Z" } } },
  });
  assert.deepEqual(articleAiSuggestionError(daily), {
    message: "تم الوصول إلى الحد اليومي لتحسين المحتوى بالذكاء الاصطناعي.",
    resetAt: "2026-12-01T00:00:00.000Z",
  });

  const provider = new AxiosError("rate", undefined, undefined, undefined, {
    config: {} as never,
    status: 429,
    statusText: "Too Many Requests",
    headers: {},
    data: { success: false, error: { code: "GEMINI_PROVIDER_QUOTA_EXCEEDED", message: "ignored", details: { retryAfterSeconds: 45 } } },
  });
  assert.deepEqual(articleAiSuggestionError(provider), {
    message: "تجاوز مزود الذكاء الاصطناعي حده المؤقت. حاول لاحقًا.",
    retryAfterSeconds: 45,
  });
});

test("TA-109: documented non-quota and transport failures remain actionable Arabic feedback", () => {
  const expected: Record<number, string> = {
    400: "لا يمكن إنشاء الاقتراحات من النسخة المحفوظة الحالية للمقال. راجع محتواه ثم حاول مرة أخرى.",
    401: "انتهت الجلسة. سجّل الدخول مجددًا ثم أعد المحاولة.",
    403: "لا تملك صلاحية استخدام تحسين المحتوى بالذكاء الاصطناعي.",
    404: "لم يُعثر على المقال المحفوظ المطلوب لتحسينه.",
    413: "حجم المحتوى المحفوظ يتجاوز الحد الآمن لخدمة التحسين.",
    502: "أعاد مزود الذكاء الاصطناعي اقتراحًا غير صالح؛ لم تُغيَّر أي حقول.",
    503: "خدمة تحسين المحتوى بالذكاء الاصطناعي غير متاحة حاليًا.",
    504: "انتهت مهلة خدمة تحسين المحتوى بالذكاء الاصطناعي. حاول لاحقًا.",
  };
  for (const [status, message] of Object.entries(expected)) {
    const error = new AxiosError("synthetic", undefined, undefined, undefined, {
      config: {} as never,
      status: Number(status),
      statusText: "Synthetic",
      headers: {},
      data: { success: false, error: { code: "SYNTHETIC", message: "ignored", details: {} } },
    });
    assert.equal(articleAiSuggestionError(error)?.message, message);
  }
  const network = new AxiosError("offline", undefined, {} as never, {} as never);
  assert.equal(articleAiSuggestionError(network)?.message, "تعذّر الاتصال بخدمة تحسين المحتوى بالذكاء الاصطناعي.");
});
