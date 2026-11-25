import { expect, test, type Page } from "@playwright/test";

const majorId = "00000000-0000-4000-8000-000000000004";
const dates = { createdAt: "2026-11-01T10:00:00Z", updatedAt: "2026-11-01T10:00:00Z" };
type Major = { id: string; slug: string; nameAr: string; nameEn: string; category: string | null; createdAt: string; updatedAt: string };
type State = { majors: Major[]; writes: Array<{ method: string; path: string; data: Record<string, unknown> }>; calls: string[]; conflict: boolean; deleteBlocked: boolean };

async function majorBackend(page: Page): Promise<State> {
  const state: State = {
    majors: Array.from({ length: 15 }, (_, index) => ({ id: index === 0 ? majorId : `00000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`, slug: index === 0 ? "computer-science" : `major-${index + 1}`, nameAr: index === 0 ? "علوم الحاسوب" : `تخصص ${index + 1}`, nameEn: index === 0 ? "Computer Science" : `Major ${index + 1}`, category: index === 0 ? "Engineering" : null, ...dates })),
    writes: [], calls: [], conflict: false, deleteBlocked: false,
  };
  await page.route("**/*", async (route) => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:3108" || !url.pathname.startsWith("/__dev_api")) return route.continue();
    const path = url.pathname.slice("/__dev_api".length); state.calls.push(`${request.method()} ${path}${url.search}`);
    const respond = (data: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    const ok = (data: unknown, status = 200) => respond({ success: true, data }, status);
    const failed = (status: number) => respond({ success: false, error: { code: status === 409 ? "DIRECTORY_SLUG_OR_PROGRAM_CONFLICT" : "VALIDATION_ERROR", message: "Request failed", details: {} } }, status);
    if (path === "/auth/me") return ok({ user: { id: majorId, name: "مشرف اختبار", email: "admin@example.invalid", role: "ADMIN" } });
    if (path === "/admin/academic-majors" && request.method() === "GET") {
      const search = (url.searchParams.get("search") ?? "").toLocaleLowerCase("ar"); const pageNumber = Number(url.searchParams.get("page") ?? 1); const limit = Number(url.searchParams.get("limit") ?? 12);
      const matches = state.majors.filter((major) => !search || major.nameAr.toLocaleLowerCase("ar").includes(search) || major.nameEn.toLocaleLowerCase("ar").includes(search));
      return ok({ items: matches.slice((pageNumber - 1) * limit, pageNumber * limit), pagination: { page: pageNumber, limit, total: matches.length, totalPages: Math.ceil(matches.length / limit) } });
    }
    if (path === "/admin/academic-majors" && request.method() === "POST") {
      const data = request.postDataJSON() as Record<string, unknown>; state.writes.push({ method: "POST", path, data }); if (state.conflict) return failed(409);
      const item = { id: `00000000-0000-4000-8000-${String(state.majors.length + 100).padStart(12, "0")}`, category: null, ...data, ...dates } as Major; state.majors.push(item); return ok(item, 201);
    }
    if (path.startsWith("/admin/academic-majors/") && request.method() === "PATCH") {
      const data = request.postDataJSON() as Record<string, unknown>; state.writes.push({ method: "PATCH", path, data }); if (state.conflict) return failed(409);
      const item = state.majors.find((major) => major.id === path.split("/").at(-1)); if (!item) return failed(400); Object.assign(item, data); return ok(item);
    }
    if (path.startsWith("/admin/academic-majors/") && request.method() === "DELETE") {
      state.writes.push({ method: "DELETE", path, data: {} }); if (state.deleteBlocked) return failed(409);
      const id = path.split("/").at(-1)!; state.majors = state.majors.filter((major) => major.id !== id); return ok({ id });
    }
    return route.abort();
  });
  return state;
}

test("Academic Majors CRUD derives slugs and preserves stored slug/category on PATCH", async ({ page }) => {
  const state = await majorBackend(page); await page.goto("/admin/academic-majors");
  await expect(page.getByRole("heading", { name: "التخصصات الأكاديمية", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "إضافة تخصص", exact: true }).click();
  await page.getByLabel("اسم التخصص بالعربية *", { exact: true }).fill("هندسة الحاسوب"); await page.getByLabel("اسم التخصص بالإنجليزية *", { exact: true }).fill("Computer Engineering");
  await page.getByRole("button", { name: "إضافة التخصص", exact: true }).click();
  await expect.poll(() => state.writes.at(-1)?.data).toEqual({ nameAr: "هندسة الحاسوب", nameEn: "Computer Engineering", slug: "computer-engineering" });
  await page.getByRole("row", { name: /علوم الحاسوب/ }).getByRole("button", { name: "تعديل", exact: true }).click();
  await page.getByLabel("اسم التخصص بالعربية *", { exact: true }).fill("علوم الحاسوب التطبيقية"); await page.getByRole("button", { name: "حفظ التعديلات", exact: true }).click();
  await expect.poll(() => state.writes.at(-1)).toMatchObject({ method: "PATCH", data: { nameAr: "علوم الحاسوب التطبيقية" } });
  expect(state.writes.at(-1)?.data).not.toHaveProperty("slug"); expect(state.writes.at(-1)?.data).not.toHaveProperty("category");

  await page.getByRole("button", { name: "إضافة تخصص", exact: true }).click(); await page.getByLabel("اسم التخصص بالعربية *", { exact: true }).fill("علوم الحاسوب التطبيقية"); await page.getByLabel("اسم التخصص بالإنجليزية *", { exact: true }).fill("Other Major");
  const beforeArabicDuplicate = state.writes.length; await page.getByRole("button", { name: "إضافة التخصص", exact: true }).click(); await expect(page.getByText("هذا التخصص موجود مسبقاً.").first()).toBeVisible(); expect(state.writes).toHaveLength(beforeArabicDuplicate);
  await page.getByLabel("اسم التخصص بالعربية *", { exact: true }).fill("اسم مختلف"); await page.getByLabel("اسم التخصص بالإنجليزية *", { exact: true }).fill("COMPUTER SCIENCE");
  await page.getByRole("button", { name: "إضافة التخصص", exact: true }).click(); await expect(page.getByText("هذا التخصص موجود مسبقاً.").first()).toBeVisible();
  await page.getByLabel("اسم التخصص بالعربية *", { exact: true }).fill("تخصص تعارض"); await page.getByLabel("اسم التخصص بالإنجليزية *", { exact: true }).fill("Conflict Major"); state.conflict = true;
  await page.getByRole("button", { name: "إضافة التخصص", exact: true }).click(); await expect(page.getByText(/هذا التخصص موجود مسبقاً/).last()).toBeVisible(); await expect(page.getByLabel("اسم التخصص بالعربية *", { exact: true })).toHaveValue("تخصص تعارض");
});

test("Academic Majors use real pagination, mobile batches, search, and protected deletion", async ({ page }) => {
  const state = await majorBackend(page); await page.goto("/admin/academic-majors");
  await page.getByRole("button", { name: "التالي", exact: true }).click(); await expect(page.getByText("تخصص 13", { exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "بحث في التخصصات", exact: true }).fill("تخصص 3");
  await expect.poll(() => state.calls.some((call) => new URLSearchParams(call.slice(call.indexOf("?") + 1)).get("search") === "تخصص 3")).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload(); await expect(page.getByText("تخصص 6", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "تحميل المزيد", exact: true }).click(); await expect(page.getByText("تخصص 6", { exact: true })).toBeVisible();
  state.deleteBlocked = true; await page.getByRole("button", { name: "حذف", exact: true }).first().click(); await page.getByRole("button", { name: "تأكيد الحذف", exact: true }).click(); await expect(page.getByText(/لا يمكن حذف هذا التخصص لأنه مرتبط ببرامج جامعية/)).toBeVisible();
  state.deleteBlocked = false; await page.getByRole("button", { name: "حذف", exact: true }).first().click(); await page.getByRole("button", { name: "تأكيد الحذف", exact: true }).click(); await expect.poll(() => state.writes.at(-1)?.method).toBe("DELETE");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
