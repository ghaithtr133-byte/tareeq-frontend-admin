import { expect, test, type Page } from "@playwright/test";

const countryId = "00000000-0000-4000-8000-000000000003";
const turkeyId = "00000000-0000-4000-8000-000000000004";
const dates = { createdAt: "2026-11-01T10:00:00Z", updatedAt: "2026-11-01T10:00:00Z" };

type State = {
  cities: Array<{ id: string; countryId: string; slug: string; nameAr: string; nameEn: string; createdAt: string; updatedAt: string }>;
  writes: Array<{ method: string; path: string; data: Record<string, unknown> }>;
  calls: string[];
  conflict: boolean;
  deleteBlocked: boolean;
  listError: boolean;
};

async function citiesBackend(page: Page): Promise<State> {
  const state: State = {
    cities: Array.from({ length: 15 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
      countryId: index === 14 ? turkeyId : countryId,
      slug: index === 0 ? "amman" : `city-${index + 1}`,
      nameAr: index === 0 ? "عمّان" : `مدينة ${index + 1}`,
      nameEn: index === 0 ? "Amman" : `City ${index + 1}`,
      ...dates,
    })),
    writes: [], calls: [], conflict: false, deleteBlocked: false, listError: false,
  };
  const countries = [
    { id: countryId, slug: "jordan", nameAr: "الأردن", nameEn: "Jordan", status: "PUBLISHED", ...dates },
    { id: turkeyId, slug: "turkey", nameAr: "تركيا", nameEn: "Turkey", status: "PUBLISHED", ...dates },
  ];
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:3108" || !url.pathname.startsWith("/__dev_api")) return route.continue();
    const path = url.pathname.slice("/__dev_api".length);
    state.calls.push(`${request.method()} ${path}${url.search}`);
    const respond = (data: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    const ok = (data: unknown, status = 200) => respond({ success: true, data }, status);
    const failed = (status: number, fields: Record<string, string[]> = {}) => respond({ success: false, error: { code: status === 409 ? "DIRECTORY_SLUG_OR_PROGRAM_CONFLICT" : "VALIDATION_ERROR", message: "Request failed", details: { fields } } }, status);
    if (path === "/auth/me") return ok({ user: { id: countryId, name: "مشرف اختبار", email: "admin@example.invalid", role: "ADMIN" } });
    if (path === "/admin/countries") return ok({ items: countries, pagination: { page: 1, limit: 50, total: countries.length, totalPages: 1 } });
    if (path === "/admin/cities" && request.method() === "GET") {
      if (state.listError) return failed(400);
      const search = (url.searchParams.get("search") ?? "").toLocaleLowerCase("ar");
      const selectedCountry = url.searchParams.get("countryId");
      const matches = state.cities.filter((city) => (!selectedCountry || city.countryId === selectedCountry) && (!search || city.nameAr.toLocaleLowerCase("ar").includes(search) || city.nameEn.toLocaleLowerCase("ar").includes(search)));
      const page = Number(url.searchParams.get("page") ?? 1);
      const limit = Number(url.searchParams.get("limit") ?? 12);
      return ok({ items: matches.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: matches.length, totalPages: Math.ceil(matches.length / limit) } });
    }
    if (path === "/admin/cities" && request.method() === "POST") {
      const data = request.postDataJSON() as Record<string, unknown>;
      state.writes.push({ method: "POST", path, data });
      if (state.conflict) return failed(409);
      const row = { id: `00000000-0000-4000-8000-${String(state.cities.length + 100).padStart(12, "0")}`, ...data, ...dates } as State["cities"][number];
      state.cities.push(row);
      return ok(row, 201);
    }
    if (path.startsWith("/admin/cities/") && request.method() === "PATCH") {
      const data = request.postDataJSON() as Record<string, unknown>;
      state.writes.push({ method: "PATCH", path, data });
      if (state.conflict) return failed(409);
      const city = state.cities.find((item) => item.id === path.split("/").at(-1));
      if (!city) return failed(400);
      Object.assign(city, data);
      return ok(city);
    }
    if (path.startsWith("/admin/cities/") && request.method() === "DELETE") {
      state.writes.push({ method: "DELETE", path, data: {} });
      if (state.deleteBlocked) return failed(409);
      const id = path.split("/").at(-1)!;
      state.cities = state.cities.filter((city) => city.id !== id);
      return ok({ id });
    }
    return route.abort();
  });
  return state;
}

async function chooseCountry(page: Page, name: string) {
  const dialog = page.getByRole("dialog").last();
  const scope = await dialog.count() ? dialog : page;
  await scope.getByRole("combobox", { name: "الدولة", exact: true }).click();
  await scope.getByRole("listbox", { name: "الدولة", exact: true }).getByRole("button", { name, exact: true }).click();
}

test("Cities CRUD keeps slugs stable and handles duplicate, conflict, and relationship protection", async ({ page }) => {
  const state = await citiesBackend(page);
  await page.goto("/admin/cities");
  await expect(page.getByRole("heading", { name: "المدن", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "إضافة مدينة", exact: true }).click();
  await page.getByLabel("اسم المدينة بالعربية *", { exact: true }).fill("مدينة محلية");
  await page.getByLabel("اسم المدينة بالإنجليزية *", { exact: true }).fill("Local City");
  await chooseCountry(page, "الأردن");
  await page.getByRole("button", { name: "إضافة المدينة", exact: true }).click();
  await expect.poll(() => state.writes.at(-1)?.data).toEqual({ countryId, nameAr: "مدينة محلية", nameEn: "Local City", slug: "local-city" });

  await page.getByRole("row", { name: /عمّان/ }).getByRole("button", { name: "تعديل", exact: true }).click();
  await page.getByLabel("اسم المدينة بالعربية *", { exact: true }).fill("عمّان الجديدة");
  await page.getByRole("button", { name: "حفظ التعديلات", exact: true }).click();
  await expect.poll(() => state.writes.at(-1)).toMatchObject({ method: "PATCH", data: { nameAr: "عمّان الجديدة" } });
  expect(state.writes.at(-1)?.data).not.toHaveProperty("slug");

  await page.getByRole("button", { name: "إضافة مدينة", exact: true }).click();
  await page.getByLabel("اسم المدينة بالعربية *", { exact: true }).fill("عمّان الجديدة");
  await page.getByLabel("اسم المدينة بالإنجليزية *", { exact: true }).fill("Amman");
  await chooseCountry(page, "الأردن");
  const writesBeforeDuplicate = state.writes.length;
  await page.getByRole("button", { name: "إضافة المدينة", exact: true }).click();
  await expect(page.getByText("هذه المدينة موجودة مسبقاً في الدولة المحددة.").first()).toBeVisible();
  expect(state.writes).toHaveLength(writesBeforeDuplicate);

  await page.getByLabel("اسم المدينة بالعربية *", { exact: true }).fill("عمّان تركيا");
  await chooseCountry(page, "تركيا");
  await page.getByRole("button", { name: "إضافة المدينة", exact: true }).click();
  await expect.poll(() => state.writes.at(-1)?.data.countryId).toBe(turkeyId);

  await page.getByRole("button", { name: "إضافة مدينة", exact: true }).click();
  await page.getByLabel("اسم المدينة بالعربية *", { exact: true }).fill("مدينة تعارض");
  await page.getByLabel("اسم المدينة بالإنجليزية *", { exact: true }).fill("Conflict City");
  await chooseCountry(page, "الأردن");
  state.conflict = true;
  await page.getByRole("button", { name: "إضافة المدينة", exact: true }).click();
  await expect(page.getByText(/تعذّر الحفظ بسبب تعارض/)).toBeVisible();
  await expect(page.getByLabel("اسم المدينة بالعربية *", { exact: true })).toHaveValue("مدينة تعارض");
  state.conflict = false;
  await page.getByRole("button", { name: "إلغاء", exact: true }).click();
  await page.getByRole("button", { name: "تجاهل التعديلات", exact: true }).click();

  state.deleteBlocked = true;
  await page.getByRole("row", { name: /مدينة 2/ }).getByRole("button", { name: "حذف", exact: true }).click();
  await page.getByRole("button", { name: "تأكيد الحذف", exact: true }).click();
  await expect(page.getByText(/لا يمكن حذف هذه المدينة لأنها مرتبطة بجامعة/)).toBeVisible();
  state.deleteBlocked = false;
  await page.getByRole("row", { name: /مدينة 2/ }).getByRole("button", { name: "حذف", exact: true }).click();
  await page.getByRole("button", { name: "تأكيد الحذف", exact: true }).click();
  await expect.poll(() => state.writes.at(-1)?.method).toBe("DELETE");
});

test("Cities use server search, immediate country filtering, paginated desktop and five-item mobile loading", async ({ page }) => {
  const state = await citiesBackend(page);
  await page.goto("/admin/cities");
  const search = page.getByRole("searchbox", { name: "بحث في المدن", exact: true });
  await search.fill("مدينة 3");
  await expect.poll(() => state.calls.some((call) => {
    const query = call.slice(call.indexOf("?") + 1);
    return new URLSearchParams(query).get("search") === "مدينة 3";
  })).toBeTruthy();
  await page.getByRole("combobox", { name: "الدولة", exact: true }).click();
  await page.getByRole("listbox", { name: "الدولة", exact: true }).getByRole("button", { name: "تركيا", exact: true }).click();
  await expect.poll(() => state.calls.some((call) => call.includes(`countryId=${countryId}`) || call.includes(`countryId=${turkeyId}`))).toBeTruthy();
  await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
  await expect(page.getByText("صفحة").first()).toBeVisible();
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await expect(page.getByText("مدينة 13", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByText("مدينة 6", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "تحميل المزيد", exact: true }).click();
  await expect(page.getByText("مدينة 6", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "تحميل المزيد", exact: true }).click();
  await expect(page.locator("article").filter({ hasText: "مدينة 6" })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
