import { expect, test, type Page } from "@playwright/test";
import type { AboutUsAdmin } from "../../../lib/about-schemas";
import { aboutDate, aboutFixture } from "../../fixtures/about";

const origin = "http://127.0.0.1:3111";
const localImage = "https://example.invalid/intro.png";
const publishedAt = "2026-11-06T10:00:00Z";

async function isolate(page: Page, role: "ADMIN" | "SUPER_ADMIN", initial: AboutUsAdmin | null) {
  const state = { row: initial, getError: 0, patchError: false, writes: [] as Record<string, unknown>[], uploads: [] as string[], methods: [] as string[] };
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    const prefix = url.origin === "https://api.tareeq-academy.com" ? "/api/v1" : "/__dev_api";
    if (!url.pathname.startsWith(prefix + "/")) return url.origin === origin ? route.continue() : route.abort();
    const path = url.pathname.slice(prefix.length); const method = request.method();
    const ok = (data: unknown) => route.fulfill({ json: { success: true, data } });
    const fail = (status: number, code: string, fields = {}) => route.fulfill({ status, json: { success: false, error: { code, message: "Synthetic error", details: { fields } } } });
    if (method === "GET" && path === "/auth/me") return ok({ user: { id: aboutFixture.id, name: "مشرف محلي", email: "fixture@example.invalid", role } });
    if (method === "POST" && path === "/admin/uploads/images") {
      state.uploads.push(request.postData() ?? "");
      return ok({ assetId: "local", publicId: "local/intro", secureUrl: localImage, format: "png", bytes: 12, width: 1, height: 1 });
    }
    if (path !== "/admin/about") return route.abort();
    state.methods.push(method);
    if (method === "GET") {
      if (state.getError === -1) return route.abort("failed");
      if (state.getError) return fail(state.getError, "OTHER_FAILURE");
      return state.row ? ok(state.row) : fail(404, "CONTENT_NOT_FOUND");
    }
    if (method !== "PATCH") return route.abort();
    const body = request.postDataJSON(); state.writes.push(body);
    if (state.patchError) return fail(400, "VALIDATION_ERROR", { missionTitleAr: ["رسالة اختبار من الخادم"] });
    const baseline = state.row ?? { ...aboutFixture, heroImageUrl: null, heroImageAltAr: null, heroImageAltEn: null, missionTitleEn: null };
    state.row = { ...baseline, ...body, updatedAt: publishedAt, publishedAt: baseline.publishedAt ?? (body.status === "PUBLISHED" ? publishedAt : null) };
    return ok(state.row);
  });
  return state;
}
const save = (page: Page) => page.getByRole("button", { name: "حفظ المحتوى", exact: true });
const status = (page: Page) => page.getByRole("combobox", { name: "الحالة التحريرية", exact: true });
const success = (page: Page) => page.getByText("تم حفظ محتوى «من نحن» بنجاح.", { exact: true });

test("About ADMIN creates a draft by PATCH, hydrates it, then clears and uploads only the introduction image", async ({ page }) => {
  const state = await isolate(page, "ADMIN", null); await page.goto("/admin");
  await page.getByRole("link", { name: "من نحن", exact: true }).click();
  await expect(page.getByText(/لم يُنشأ محتوى/)).toBeVisible();
  await expect(page.locator("#about-introTitleAr")).toHaveValue("");
  const introBodyAr = "سطر عربي أول\n\nسطر عربي ثانٍ";
  await page.locator("#about-introTitleAr").fill("مقدمة محلية");
  await page.locator("#about-introBodyAr").fill(introBodyAr);
  await save(page).click(); await expect(success(page)).toBeVisible();
  expect(state.writes[0]).toEqual({ introTitleAr: "مقدمة محلية", introBodyAr, status: "DRAFT" });
  await expect(page.getByText(/لم يُنشأ محتوى/)).toHaveCount(0);
  await expect(page.locator("#about-introBodyAr")).toHaveValue(introBodyAr);
  await expect(page.getByRole("region", { name: "حالة النشر الحالية" }).locator(`time[datetime="${publishedAt}"]`)).toHaveCount(1);
  await expect(save(page)).toBeDisabled();
  await page.getByLabel("ملف الصورة", { exact: true }).setInputFiles({ name: "local.png", mimeType: "image/png", buffer: Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]) });
  await page.getByRole("button", { name: "رفع الصورة", exact: true }).click();
  await expect(page.locator("#about-introImageUrl")).toHaveValue(localImage);
  expect(state.uploads[0]).toContain("\r\nabout\r\n"); expect(state.writes).toHaveLength(1);
  await page.getByLabel("مسح عنوان المقدمة بالعربية صراحة", { exact: true }).check();
  await save(page).click(); await expect(success(page)).toBeVisible();
  expect(state.writes[1]).toEqual({ introTitleAr: null, introImageUrl: localImage });
  expect(state.row?.introBodyAr).toBe(introBodyAr);
  expect(state.methods.every(method => method === "GET" || method === "PATCH")).toBe(true);
  await page.setViewportSize({ width: 390, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("About SUPER_ADMIN validates merged Arabic publication, preserves fixed Hero and first timestamp on archive", async ({ page }) => {
  const state = await isolate(page, "SUPER_ADMIN", { ...aboutFixture, heroTitleAr: "عنوان محفوظ", heroSubtitleAr: "عنوان فرعي محفوظ", introTitleAr: "مقدمة محفوظة" });
  await page.goto("/admin/about");
  await expect(page.getByRole("link", { name: "من نحن", exact: true })).toBeVisible();
  await expect(page.locator('[id^="about-heroImage"]')).toHaveCount(0);
  await status(page).selectOption("PUBLISHED");
  await save(page).click(); await expect(page.getByText("أكمل حقول النشر العربية المطلوبة.")).toBeVisible(); expect(state.writes).toHaveLength(0);
  await page.locator("#about-introBodyAr").fill("نص للنشر\nسطر ثانٍ");
  page.once("dialog", dialog => dialog.accept()); await save(page).click(); await expect(success(page)).toBeVisible();
  expect(state.writes[0]).toEqual({ introBodyAr: "نص للنشر\nسطر ثانٍ", status: "PUBLISHED" });
  expect(state.row?.heroImageUrl).toBe(aboutFixture.heroImageUrl);
  expect(state.row?.heroImageAltAr).toBe(aboutFixture.heroImageAltAr);
  expect(state.row?.heroImageAltEn).toBe(aboutFixture.heroImageAltEn);
  expect(state.row?.missionTitleEn).toBe(aboutFixture.missionTitleEn);
  await status(page).selectOption("ARCHIVED");
  page.once("dialog", dialog => dialog.accept()); await save(page).click(); await expect(success(page)).toBeVisible();
  expect(state.writes[1]).toEqual({ status: "ARCHIVED" }); expect(state.row?.publishedAt).toBe(publishedAt);
  await expect(page.getByRole("region", { name: "حالة النشر الحالية" })).toContainText("مؤرشف");
});

test("About rejects unrelated 404, 401, 403, 500 and network as empty states, with explicit retry", async ({ page }) => {
  const state = await isolate(page, "ADMIN", { ...aboutFixture, updatedAt: aboutDate });
  for (const [code, message] of [[404, "تعذّر إتمام الطلب. أعد المحاولة."], [401, /تعذّر التحقق من الجلسة/], [403, "لا تملك صلاحية الوصول"], [500, /خطأ في الخادم/], [-1, /تعذّر الاتصال بالخادم/]] as const) {
    state.getError = code;
    await page.goto("/admin/about"); await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(page.locator("#about-introBodyAr")).toHaveCount(0);
  }
  state.getError = 0;
  await page.getByRole("button", { name: "إعادة المحاولة", exact: true }).click();
  await expect(page.locator("#about-introBodyAr")).toBeVisible();
  expect(state.writes).toHaveLength(0);
});

test("About failed PATCH shows server field feedback, preserves input and is never automatically replayed", async ({ page }) => {
  const state = await isolate(page, "ADMIN", aboutFixture); state.patchError = true; await page.goto("/admin/about");
  const field = page.locator("#about-missionTitleAr"); await field.fill("تعديل غير محفوظ");
  await save(page).click(); await expect(page.getByText("رسالة اختبار من الخادم", { exact: true })).toBeVisible();
  await expect(field).toHaveValue("تعديل غير محفوظ"); expect(state.writes).toHaveLength(1);
  state.patchError = false; await save(page).click(); await expect(success(page)).toBeVisible();
  expect(state.writes).toEqual([{ missionTitleAr: "تعديل غير محفوظ" }, { missionTitleAr: "تعديل غير محفوظ" }]);
});
