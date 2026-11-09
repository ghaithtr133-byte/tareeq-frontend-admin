import { expect, test, type Page } from "@playwright/test";
import { city, countryId, dates, image, major, majorId, program, recordId, requirement, university, universityId } from "../../fixtures/university-management";
import { journeyFixture, summaryFixture } from "../../fixtures/phase4";

const origin = "http://127.0.0.1:3111";
const current = { id: recordId, amount: "1200.50", currency: "USD", billingPeriod: "YEAR", academicYear: "2026/2027", ...dates };
const other = { ...current, id: majorId, amount: "1450.00", currency: "EUR", billingPeriod: "SEMESTER", academicYear: "2027/2028" };
const programs = [{ ...program, tuition: current, tuitionFees: [other, current] }, { ...program, id: majorId, nameAr: "برنامج بلا رسوم موثقة" }];

async function isolate(page: Page) {
  const writes: { path: string; method: string; body: Record<string, unknown> }[] = [];
  let row = { ...university, cityId: recordId, universityType: "PUBLIC" as string | null };
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    const prefix = url.origin === "https://api.tareeq-academy.com" ? "/api/v1" : "/__dev_api";
    if (!url.pathname.startsWith(prefix)) return url.origin === origin ? route.continue() : route.abort();
    const path = url.pathname.slice(prefix.length); const method = request.method();
    const reply = (data: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    const ok = (data: unknown) => reply({ success: true, data });
    if (method === "GET" && path === "/auth/me") return ok({ user: { id: recordId, name: "مشرف محلي", email: "fixture@example.invalid", role: "SUPER_ADMIN" } });
    if (method !== "GET") {
      if (!["PATCH", "POST"].includes(method)) return route.abort();
      const body = request.postDataJSON(); writes.push({ path, method, body });
      if (method === "PATCH" && path === `/admin/university-programs/${recordId}`) return reply({ success: false, error: { code: "CONFLICT", message: "Synthetic conflict", details: {} } }, 409);
      if (method === "PATCH" && path === `/admin/universities/${universityId}`) { row = { ...row, ...body }; return ok(row); }
      if (method === "POST" && path === `/admin/universities/${universityId}/admission-requirements`) return ok({ ...requirement, ...body });
      return route.abort();
    }
    if (path === `/admin/universities/${universityId}`) return ok(row);
    if (path === "/admin/analytics/summary") return ok(summaryFixture);
    if (path === "/admin/analytics/journeys") {
      const item = journeyFixture.items[0]; const step = item.steps[0];
      return ok({ ...journeyFixture, items: [{ ...item, steps: [...item.steps, { ...step, eventId: majorId, type: "CTA_CLICK", ctaId: "VIEW_SCHOLARSHIP" }, { ...step, eventId: recordId, type: "ENGAGEMENT", engagementType: "SCROLL_90" }] }] });
    }
    const country = { id: countryId, slug: "local-country", nameAr: "دولة اختبار", status: "DRAFT", ...dates };
    const rows = path.endsWith("/programs") ? programs : path.endsWith("/admission-requirements") ? [requirement] : path.endsWith("/gallery") ? [image, { ...image, id: majorId, imageUrl: "", altAr: "رابط غير متاح" }] : path.endsWith("/academic-majors") ? [major] : path.endsWith("/cities") ? (url.searchParams.get("countryId") === majorId ? [] : [city]) : path === "/admin/countries" ? [country, { ...country, id: majorId, slug: "other-country", nameAr: "دولة اختبار أخرى" }] : undefined;
    if (!rows) return route.abort();
    return ok({ items: rows, pagination: { page: 1, limit: Number(url.searchParams.get("limit") ?? 12), total: rows.length, totalPages: 1 } });
  });
  return writes;
}

async function universityTab(page: Page, tab: string) {
  await page.goto(`/admin/universities/${universityId}`);
  await page.getByRole("button", { name: tab, exact: true }).click();
}

test("108 program fees show exact current, multiple years, null/empty, and retain failed edit", async ({ page }) => {
  const writes = await isolate(page); await universityTab(page, "البرامج والرسوم");
  const fees = page.getByRole("region", { name: "الرسوم الدراسية" });
  await expect(fees.first()).toContainText("1200.50 USD");
  await expect(fees.first()).toContainText("2026/2027");
  await fees.first().getByText("سجل الرسوم حسب السنة الأكاديمية (2)", { exact: true }).click();
  await expect(fees.first().getByRole("listitem").first()).toContainText("1450.00 EUR");
  await expect(fees.first().getByRole("listitem").first()).toContainText("2027/2028");
  await expect(fees.last()).toContainText("غير متاحة"); await expect(fees.last()).toContainText("لا يوجد سجل رسوم");
  await page.getByRole("button", { name: "تعديل السجل", exact: true }).first().click();
  await page.getByLabel("إضافة / تحديث رسوم سنة أكاديمية محددة").check();
  await page.getByLabel("المبلغ *", { exact: true }).fill("1800.50");
  await page.getByLabel("السنة الأكاديمية (2026/2027) *", { exact: true }).fill("2027/2028");
  await page.getByRole("button", { name: "حفظ السجل", exact: true }).click();
  await expect(page.getByText(/تعارض مع سجل موجود/)).toBeVisible();
  await expect(page.getByLabel("المبلغ *", { exact: true })).toHaveValue("1800.50");
  expect(writes).toEqual([{ method: "PATCH", path: `/admin/university-programs/${recordId}`, body: { tuition: { amount: "1800.50", currency: "USD", billingPeriod: "YEAR", academicYear: "2027/2028" } } }]);
  await expect(fees.first()).toContainText("1200.50 USD");
  await page.setViewportSize({ width: 390, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("108 university null-clear preserves the valid city when the same country is selected", async ({ page }) => {
  const writes = await isolate(page); await page.goto(`/admin/universities/${universityId}`);
  const cityInput = page.getByRole("combobox", { name: "المدينة المرتبطة", exact: true });
  await expect(cityInput).toHaveValue(recordId);
  await page.locator("#universities-countryId").selectOption(countryId);
  await expect(cityInput).toHaveValue(recordId);
  await page.locator("#universities-universityType").selectOption("");
  await page.locator("form button[type=submit]").click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].body).toEqual({ universityType: null });
  await expect(cityInput).toHaveValue(recordId);
  const save = page.locator("form button[type=submit]"); await expect(save).toBeEnabled();
  await page.locator("#universities-countryId").selectOption(majorId);
  await expect(cityInput).toHaveValue("");
  await save.click(); await expect.poll(() => writes.length).toBe(2);
  expect(writes[1].body).toEqual({ countryId: majorId, cityId: null });
});

test("108 admission create sends null level and gallery keeps actions available on missing or broken images", async ({ page }) => {
  const writes = await isolate(page); await universityTab(page, "متطلبات القبول");
  await page.getByRole("button", { name: "إضافة سجل", exact: true }).click();
  await page.getByLabel("متطلبات القبول بالعربية *", { exact: true }).fill("متطلبات محلية جديدة");
  await page.getByRole("button", { name: "حفظ السجل", exact: true }).click();
  await expect(page.getByText("تم حفظ السجل بنجاح.", { exact: true })).toBeVisible();
  expect(writes[0].body).toMatchObject({ scope: "UNIVERSITY", studyLevel: null });
  expect(writes[0].body).not.toHaveProperty("programId");
  await page.getByRole("button", { name: "معرض الصور", exact: true }).click();
  await expect(page.getByText(/تعذّر عرض صورة المعرض/)).toHaveCount(2);
  await expect(page.getByRole("button", { name: "فصل من المعرض", exact: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "ترتيب الصور", exact: true })).toBeEnabled();
  expect(writes).toHaveLength(1);
});

test("108 anonymous journey shows documented non-null attributes and omits null labels", async ({ page }) => {
  const writes = await isolate(page); await page.goto("/admin/analytics");
  await page.getByRole("button", { name: "الرحلات المجهولة", exact: true }).click();
  await page.getByText("عرض الخطوات المسموح بها", { exact: true }).click();
  await expect(page.getByText("VIEW_SCHOLARSHIP", { exact: true })).toBeVisible();
  await expect(page.getByText("SCROLL_90", { exact: true })).toBeVisible();
  await expect(page.getByText(/الدعوة للإجراء:/)).toHaveCount(1);
  await expect(page.getByText(/نوع التفاعل:/)).toHaveCount(1);
  expect(writes).toHaveLength(0);
});
