import { expect, test, type Page } from "@playwright/test";
import { applicationFixture, inquiryFixture } from "../fixtures/submissions";
import type { Submission, SubmissionResource } from "@/lib/api-client/submissions";

async function installContractBackend(page: Page, role: "ADMIN" | "SUPER_ADMIN" = "ADMIN") {
  const state = { signedIn: true, listError: 0, detailError: 0, patchError: 0, networkError: false, delay: 0, malformed: false, patches: [] as unknown[], calls: [] as string[] };
  const records: Record<SubmissionResource, Submission[]> = {
    applications: Array.from({ length: 25 }, (_, i) => ({ ...applicationFixture, id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, fullName: `${applicationFixture.fullName} ${i + 1}` })),
    inquiries: Array.from({ length: 25 }, (_, i) => ({ ...inquiryFixture, id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, fullName: `${inquiryFixture.fullName} ${i + 1}` })),
  };
  // Prevent every unhandled API request from reaching the production proxy.
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:3107") return route.abort();
    if (!url.pathname.startsWith("/__dev_api")) return route.continue();
    const path = url.pathname.slice("/__dev_api".length);
    state.calls.push(`${request.method()} ${path}`);
    const respond = (data: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    const error = (status: number) => respond({ success: false, error: { code: status === 400 ? "VALIDATION_ERROR" : "REQUEST_FAILED", message: "Request failed", details: status === 400 ? { fields: { internalNote: ["Invalid note"] } } : {} } }, status);
    if (path === "/auth/logout") { state.signedIn = false; return respond({ success: true, data: { message: "Logged out" } }); }
    if (path === "/auth/me" || path === "/auth/refresh") return state.signedIn ? respond({ success: true, data: { user: { id: "52d75347-64ad-47e5-bd3c-4ea10654ef22", name: "مشرف الاختبار", email: "admin@example.invalid", role } } }) : error(401);
    const [, admin, resourceName, id, action] = path.split("/");
    if (admin !== "admin" || (resourceName !== "applications" && resourceName !== "inquiries")) return route.abort();
    if (!state.signedIn) return error(401);
    const resource = resourceName as SubmissionResource;
    if (state.networkError) return route.abort("failed");
    if (state.delay) await new Promise((resolve) => setTimeout(resolve, state.delay));
    if (!id) {
      if (state.listError) return error(state.listError);
      let filtered = records[resource].filter((r) => !url.searchParams.get("status") || r.status === url.searchParams.get("status"));
      if (resource === "applications" && url.searchParams.get("applicationType")) filtered = filtered.filter((r) => "applicationType" in r && r.applicationType === url.searchParams.get("applicationType"));
      const limit = Number(url.searchParams.get("limit") ?? 12);
      const current = Number(url.searchParams.get("page") ?? 1);
      return respond({ success: true, data: state.malformed ? [] : { items: filtered.slice((current - 1) * limit, current * limit), pagination: { page: current, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) } } });
    }
    const record = records[resource].find((item) => item.id === id);
    if (state.detailError || !record) return error(state.detailError || 404);
    if (request.method() === "PATCH" && action === "status") {
      state.patches.push(request.postDataJSON());
      if (state.patchError) return error(state.patchError);
      Object.assign(record, request.postDataJSON(), { updatedAt: "2026-11-04T10:00:00Z" });
      return respond({ success: true, data: record });
    }
    if (request.method() !== "GET") return route.abort();
    return respond({ success: true, data: record });
  });
  return { state, records };
}

for (const role of ["ADMIN", "SUPER_ADMIN"] as const) {
  for (const resource of ["applications", "inquiries"] as const) {
    test(`${role} ${resource}: list, filters, pagination, detail, workflow, notes and failures`, async ({ page }) => {
      const { state } = await installContractBackend(page, role);
      await page.goto(`/admin/${resource}`);
      await expect(page.getByText("صفحة 1 من 3 · 25 سجل")).toBeVisible();
      await expect(page.getByRole("button", { name: "السابق", exact: true })).toBeDisabled();
      await page.getByRole("button", { name: "التالي", exact: true }).click();
      await expect(page.getByText("صفحة 2 من 3 · 25 سجل")).toBeVisible();
      await page.getByRole("combobox", { name: "الحالة", exact: true }).selectOption("NEW");
      if (resource === "applications") await page.getByRole("combobox", { name: "نوع الطلب", exact: true }).selectOption("SCHOLARSHIP_ASSISTANCE");
      await page.getByLabel("الترتيب").selectOption("updated");
      await page.getByRole("button", { name: "تطبيق", exact: true }).click();
      await expect(page).toHaveURL(/page=1/);
      await expect(page).toHaveURL(/sort=updated/);
      await expect(page.getByText("صفحة 1 من 3 · 25 سجل")).toBeVisible();
      await page.getByRole("link", { name: /عرض تفاصيل/ }).first().click();
      await expect(page.getByText("تاريخ قبول الخصوصية", { exact: true })).toBeVisible();
      await expect(page.getByText(resource === "applications" ? applicationFixture.message : inquiryFixture.message, { exact: true })).toBeVisible();
      const save = page.getByRole("button", { name: "حفظ التغييرات", exact: true });
      const note = page.getByRole("textbox", { name: "الملاحظة الداخلية", exact: true });
      await expect(save).toBeDisabled();
      await note.fill("x".repeat(5001));
      await expect(page.getByText("الحد الأقصى للملاحظة 5000 حرف.")).toBeVisible();
      await expect(save).toBeDisabled();
      expect(state.patches).toHaveLength(0);
      await note.fill("ملاحظة اختبار خاصة");
      await page.getByRole("combobox", { name: "حالة المعالجة", exact: true }).selectOption("IN_REVIEW");
      state.patchError = 400;
      await save.click();
      await expect(page.getByText("تحقق من الحقول المدخلة ثم أعد المحاولة.")).toBeVisible();
      await expect(note).toHaveValue("ملاحظة اختبار خاصة");
      await expect(note).toHaveAttribute("aria-invalid", "true");
      expect(state.patches).toHaveLength(1);
      state.patchError = 0;
      state.delay = 350;
      await save.click();
      await expect(page.getByRole("button", { name: "جارٍ الحفظ" })).toBeDisabled();
      await expect(page.getByText("تم حفظ التغييرات بنجاح.")).toBeVisible();
      state.delay = 0;
      await expect(page.getByRole("combobox", { name: "حالة المعالجة", exact: true })).toHaveValue("IN_REVIEW");
      expect(state.patches[1]).toEqual({ status: "IN_REVIEW", internalNote: "ملاحظة اختبار خاصة" });
      await page.getByRole("button", { name: "مسح الملاحظة" }).click();
      await save.click();
      await expect(save).toBeDisabled();
      expect(state.patches[2]).toEqual({ internalNote: null });
      await note.fill("a"); await note.fill("");
      await save.click();
      await expect(save).toBeDisabled();
      expect(state.patches[3]).toEqual({ internalNote: "" });
      await page.getByRole("link", { name: /العودة إلى/ }).click();
      await page.getByRole("combobox", { name: "الحالة", exact: true }).selectOption("IN_REVIEW");
      await page.getByRole("button", { name: "تطبيق", exact: true }).click();
      await expect(page.getByText("صفحة 1 من 1 · 1 سجل")).toBeVisible();
      await expect(page.getByRole("button", { name: "التالي", exact: true })).toBeDisabled();
    });
  }
  test(`${role}: logout removes private UI and protected history cannot restore it`, async ({ page }) => {
    const { state } = await installContractBackend(page, role);
    await page.goto("/admin/applications");
    await page.getByRole("link", { name: /عرض تفاصيل/ }).first().click();
    await expect(page.getByText(applicationFixture.message)).toBeVisible();
    await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByText(applicationFixture.message)).toHaveCount(0);
    expect(state.calls.filter((call) => call === "POST /auth/logout")).toHaveLength(1);
    expect(await page.evaluate(() => Object.keys(localStorage).length + Object.keys(sessionStorage).length)).toBe(0);
  });
}

test("responsive RTL list and details retain controls and long content at all six widths", async ({ page }, testInfo) => {
  const { records } = await installContractBackend(page);
  for (const resource of ["applications", "inquiries"] as const) {
    records[resource][0].fullName = "اسم طالب عربي طويل لاختبار وضوح العرض والمحاذاة في واجهة الإدارة";
    records[resource][0].message = "رسالة طويلة ".repeat(80);
    records[resource][0].internalNote = "ملاحظة داخلية طويلة ".repeat(50);
    for (const width of [350, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/admin/${resource}`);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.getByRole("link", { name: /عرض تفاصيل/ }).first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${resource}-list-${width}.png`), fullPage: true });
      await page.getByRole("link", { name: /عرض تفاصيل/ }).first().click();
      await expect(page.getByRole("textbox", { name: "الملاحظة الداخلية", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${resource}-detail-${width}.png`), fullPage: true });
    }
  }
});

test("empty, loading, forbidden, server, network, malformed and not-found states stay distinct", async ({ page }) => {
  const { state, records } = await installContractBackend(page);
  records.inquiries = [];
  await page.goto("/admin/inquiries");
  await expect(page.getByRole("heading", { name: "لا توجد بيانات لعرضها" })).toBeVisible();
  await expect(page.getByRole("button", { name: "التالي", exact: true })).toBeDisabled();
  state.delay = 1500;
  await page.goto("/admin/applications");
  await expect(page.getByRole("heading", { name: "جارٍ التحميل" })).toBeVisible();
  await expect(page.getByText("صفحة 1 من 3 · 25 سجل")).toBeVisible();
  state.delay = 0;
  for (const status of [403, 500]) {
    state.listError = status;
    await page.reload();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(status === 403 ? "لا تملك صلاحية" : "تعذّر إتمام الطلب");
    await expect(page.getByRole("heading", { name: "لا توجد بيانات لعرضها" })).toHaveCount(0);
  }
  state.listError = 0; state.networkError = true;
  await page.reload();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("تعذّر الاتصال بالخادم");
  state.networkError = false; state.malformed = true;
  await page.getByRole("button", { name: "إعادة المحاولة" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("تعذّر إتمام الطلب");
  state.malformed = false; state.detailError = 404;
  await page.goto("/admin/applications/00000000-0000-4000-8000-000000000001");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("لم يتم العثور على السجل");
  await expect(page.getByRole("textbox", { name: "الملاحظة الداخلية", exact: true })).toHaveCount(0);
});

test("an established session receiving 401 revalidates once and removes private content", async ({ page }) => {
  const { state } = await installContractBackend(page);
  await page.goto("/admin/applications");
  await expect(page.getByText("صفحة 1 من 3 · 25 سجل")).toBeVisible();
  state.signedIn = false;
  await page.getByRole("link", { name: /عرض تفاصيل/ }).first().click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByText(applicationFixture.message)).toHaveCount(0);
  expect(state.calls.filter((call) => call === "POST /auth/refresh")).toHaveLength(1);
});
