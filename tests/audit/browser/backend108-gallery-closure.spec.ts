import { expect, test, type Page } from "@playwright/test";
import { activeGalleryOrder, galleryRows } from "../../fixtures/gallery-closure";
import { countryId, dates, recordId, university, universityId } from "../../fixtures/university-management";

async function isolate(page: Page, active: number, archived: number, conflict = false) {
  const state = { rows: galleryRows(active, archived), pages: [] as number[], writes: [] as string[][], conflict };
  const gallery = `/admin/universities/${universityId}/gallery`;
  await page.route("**/*", async route => {
    const request = route.request(); const url = new URL(request.url());
    const prefix = url.origin === "https://api.tareeq-academy.com" ? "/api/v1" : "/__dev_api";
    if (!url.pathname.startsWith(prefix + "/")) return url.origin === "http://127.0.0.1:3111" ? route.continue() : route.abort();
    const path = url.pathname.slice(prefix.length); const method = request.method();
    const ok = (data: unknown) => route.fulfill({ json: { success: true, data } });
    if (method === "GET" && path === "/auth/me") return ok({ user: { id: recordId, name: "اختبار محلي", email: "local@example.invalid", role: "ADMIN" } });
    if (method === "PATCH" && path === `${gallery}/order`) {
      const ids: string[] = request.postDataJSON().orderedIds; state.writes.push(ids);
      if (state.conflict) return route.fulfill({ status: 409, json: { success: false, error: { code: "GALLERY_ORDER_SET_MISMATCH", message: "Synthetic stale set", details: {} } } });
      return ok({ items: ids.map((id, displayOrder) => ({ ...state.rows.find(row => row.id === id), displayOrder })) });
    }
    if (method !== "GET") return route.abort();
    if (path === `/admin/universities/${universityId}`) return ok(university);
    const status = url.searchParams.get("status");
    const rows = path === gallery ? state.rows.filter(row => !status || status === row.status) : path === "/admin/countries" ? [{ id: countryId, slug: "test-country", nameAr: "دولة اختبار", status: "DRAFT", ...dates }] : undefined;
    if (!rows) return route.abort();
    const limit = Number(url.searchParams.get("limit") ?? 12); const index = Number(url.searchParams.get("page") ?? 1);
    if (path === gallery && limit === 100) { expect(status).toBeNull(); state.pages.push(index); }
    return ok({ items: rows.slice((index - 1) * limit, index * limit), pagination: { page: index, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) } });
  });
  await page.goto(`/admin/universities/${universityId}`);
  await page.getByRole("button", { name: "معرض الصور", exact: true }).click();
  return state;
}
const openOrder = (page: Page) => page.getByRole("button", { name: "ترتيب الصور", exact: true }).click();
const save = (page: Page) => page.getByRole("button", { name: "حفظ الترتيب", exact: true });

test("Gallery 409 locks a complete 100-item set until explicit reload; filtered view is never the reorder set", async ({ page }) => {
  const state = await isolate(page, 100, 4, true);
  await page.getByLabel("تصفية الحالة", { exact: true }).selectOption("PUBLISHED");
  await page.getByRole("button", { name: "تطبيق المرشحات", exact: true }).click();
  await openOrder(page); await expect(page.getByRole("heading", { name: "ترتيب جميع الصور غير المؤرشفة (100)", exact: true })).toBeVisible();
  const expected = activeGalleryOrder(state.rows);
  await page.getByRole("button", { name: "خفض الصورة 1", exact: true }).click();
  [expected[0], expected[1]] = [expected[1], expected[0]];
  await save(page).click(); await expect(page.getByText(/تغيّرت مجموعة الصور على الخادم/)).toBeVisible();
  await expect(save(page)).toBeDisabled();
  await expect(page.getByRole("button", { name: "خفض الصورة 1", exact: true })).toBeDisabled();
  expect(state.pages).toEqual([1, 2]); expect(state.writes).toEqual([expected]);
  await page.getByRole("button", { name: "إغلاق الترتيب", exact: true }).click();
  state.rows = state.rows.map((row, index) => index === state.rows.length - 1 ? { ...row, id: "55000000-0000-4000-8000-000000000999" } : row);
  state.conflict = false;
  await openOrder(page); await expect(save(page)).toBeEnabled();
  await save(page).click(); await expect(save(page)).toHaveCount(0);
  expect(state.pages.slice(0, 4)).toEqual([1, 2, 1, 2]);
  expect(state.writes).toEqual([expected, activeGalleryOrder(state.rows)]);
});

test("Gallery 101 active loads all pages but shows the contract limit and never offers a partial save", async ({ page }) => {
  const state = await isolate(page, 101, 4);
  await openOrder(page);
  await expect(page.getByText(/100 صورة غير مؤرشفة فقط/)).toBeVisible();
  await expect(save(page)).toHaveCount(0);
  expect(state.pages).toEqual([1, 2]); expect(state.writes).toEqual([]);
});
