import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { AxiosError } from "axios";

import {
  articleHardDeleteApi,
  getArticleHardDeleteConflict,
  type DeletionImpact,
} from "@/lib/api-client/content";
import { apiClient } from "@/lib/api-client/client";
import { queryKeys } from "@/lib/api-client/query-keys";
import { invalidateArticleAfterHardDelete } from "@/hook/mutations/use-article-hard-delete-mutation";
import { getAllowedDevApiEndpoint } from "@/lib/admin-dev-api-proxy";

const id = "00000000-0000-4000-8000-000000000001";
const impact: DeletionImpact = {
  target: { resource: "articles", id, slug: "article", status: "DRAFT" },
  outcome: "SAFE",
  items: [],
};

test("TA-113: article hard delete uses only the deployed DELETE and challenge-confirmation POST", async () => {
  const originalAdapter = apiClient.defaults.adapter;
  const calls: Array<{ method?: string; url?: string; data?: unknown; withCredentials?: boolean }> = [];
  apiClient.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, data: config.data, withCredentials: config.withCredentials });
    return { config, status: 200, statusText: "OK", headers: {}, data: { success: true, data: { id, impact } } };
  };
  try {
    await articleHardDeleteApi.request(id);
    await articleHardDeleteApi.confirm(id, id);
  } finally {
    apiClient.defaults.adapter = originalAdapter;
  }
  assert.deepEqual(calls.map(({ method, url }) => `${method} ${url}`), [
    `delete /admin/articles/${id}`,
    `post /admin/articles/${id}/hard-delete/confirm`,
  ]);
  assert.equal(calls[0]?.data, undefined);
  assert.deepEqual(JSON.parse(String(calls[1]?.data)), { challengeId: id });
  assert.ok(calls.every((call) => call.withCredentials));
});

test("TA-113: only documented 409 impact/challenge envelopes unlock the final confirmation", () => {
  const response = {
    status: 409,
    statusText: "Conflict",
    headers: {},
    config: { headers: {} } as never,
    data: {
      success: false,
      error: {
        code: "DELETE_REQUIRES_CONFIRMATION",
        message: "confirmation required",
        details: { impact: { ...impact, outcome: "REQUIRES_CONFIRMATION" }, confirmation: { challengeId: id, expiresAt: "2026-11-25T12:00:00.000Z" } },
      },
    },
  };
  const conflict = getArticleHardDeleteConflict(new AxiosError("Conflict", undefined, undefined, undefined, response));
  assert.deepEqual(conflict, {
    code: "DELETE_REQUIRES_CONFIRMATION",
    impact: { ...impact, outcome: "REQUIRES_CONFIRMATION" },
    confirmation: { challengeId: id, expiresAt: "2026-11-25T12:00:00.000Z" },
  });
  assert.equal(getArticleHardDeleteConflict(new Error("not a documented envelope")), undefined);
});

test("TA-113: a successful hard delete only clears its detail and article list caches", async () => {
  const removed: unknown[] = [];
  const invalidated: unknown[] = [];
  await invalidateArticleAfterHardDelete({
    removeQueries: (filters: { queryKey?: unknown }) => { removed.push(filters.queryKey); },
    invalidateQueries: async (filters: { queryKey?: unknown }) => { invalidated.push(filters.queryKey); },
  } as never, id);
  assert.deepEqual(removed, [queryKeys.admin.content.detail("articles", id)]);
  assert.deepEqual(invalidated, [queryKeys.admin.content.resourceLists("articles")]);
});

test("TA-113: development proxy exposes only the documented article delete workflow", () => {
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "articles", id]), {
    path: `/admin/articles/${id}`,
    methods: ["GET", "PATCH", "DELETE", "OPTIONS"],
  });
  assert.deepEqual(getAllowedDevApiEndpoint(["admin", "articles", id, "hard-delete", "confirm"]), {
    path: `/admin/articles/${id}/hard-delete/confirm`,
    methods: ["POST", "OPTIONS"],
  });
  assert.equal(getAllowedDevApiEndpoint(["admin", "articles", id, "hard-delete", "other"]), undefined);
});

test("TA-113: the shared dialog hides technical or ordinary relationship details while preserving meaningful warnings", () => {
  const dialog = readFileSync("components/content/article-hard-delete-dialog.tsx", "utf8");
  const list = readFileSync("components/content/articles-list-page.tsx", "utf8");
  const form = readFileSync("components/content/content-form-page.tsx", "utf8");
  assert.match(dialog, /حذف المقال نهائياً/);
  assert.match(dialog, /هذا الإجراء دائم ولا يمكن التراجع عنه/);
  assert.match(dialog, /requestInFlight\.current \|\| deletion\.isPending/);
  assert.match(dialog, /type="button"[\s\S]{0,900}إلغاء/);
  assert.match(dialog, /isInternalRetention/);
  assert.match(dialog, /item\.effect === "DELETE"/);
  assert.match(dialog, /يتطلب الحذف النهائي صلاحية المدير الأعلى \(SUPER_ADMIN\) وفق سياسة الخادم/);
  assert.doesNotMatch(dialog, /يتطلب الحذف تأكيدًا نهائيًا وفق آثار الخادم الحالية/);
  assert.doesNotMatch(dialog.slice(dialog.indexOf("<ul")), /relationshipPath/);
  assert.match(list, /ArticleHardDeleteDialog/);
  assert.match(form, /منطقة خطرة/);
  assert.doesNotMatch(dialog, /status:\s*["'](?:DRAFT|ARCHIVED)/);
});
