import { expect, test, type Page } from "@playwright/test";
import { countryId, dates, recordId, university, universityId } from "../../fixtures/university-management";

export const otherCountryId = "77777777-7777-4777-8777-777777777777";
export const secondScholarshipId = "88888888-8888-4888-8888-888888888888";
const common = { id: recordId, slug: "local-record", featured: false, status: "DRAFT", publishedAt: null, seoTitleAr: null, seoDescriptionAr: null, ...dates };
const countries = [countryId, otherCountryId].map((id, i) => ({ ...common, id, slug: `country-${i}`, nameAr: `دولة محلية ${i}`, nameEn: null, introductionAr: "مقدمة", introductionEn: null, detailsAr: "تفاصيل", detailsEn: null, imageUrl: null, imageAltAr: null, imageAltEn: null, displayOrder: i }));
const scholarship = { ...common, titleAr: "منحة محلية", titleEn: null, countryId, universityId, studyLevel: "MASTERS", fundingType: "FULL", requirementsAr: "متطلبات", requirementsEn: null, descriptionAr: "وصف", descriptionEn: null, imageUrl: null, imageAltAr: null, imageAltEn: null, verifiedDeadline: "2026-11-20T12:34:56.000Z", officialSourceUrl: null, applicationStatus: "OPEN", effectiveApplicationStatus: "OPEN", country: null, university: null };
const article = { ...common, titleAr: "مقال محلي", titleEn: null, summaryAr: "ملخص", summaryEn: null, bodyAr: [{ type: "paragraph", text: "محتوى محلي" }], bodyEn: null, coverImageUrl: null, coverImageAltAr: null, coverImageAltEn: null, countryId: null, universityId: null, scholarshipId: recordId, scholarshipIds: [recordId, secondScholarshipId], relatedScholarships: [], country: null, university: null, scholarship: null };
const service = { ...common, titleAr: "خدمة محلية", titleEn: null, summaryAr: "ملخص", summaryEn: null, descriptionAr: "وصف", descriptionEn: null, imageUrl: null, imageAltAr: null, imageAltEn: null, displayOrder: 0 };

export async function isolate(page: Page, role: "ADMIN" | "SUPER_ADMIN" = "ADMIN") {
  const state = { selectorError: false, selectorNetwork: false, selectorEmpty: false, offPage: false, maxLinks: false, passwordStatus: 200, passwordDelay: 0, sessionEnded: false, patchError: 0, patchGate: undefined as Promise<void> | undefined, writes: [] as { path: string; body: Record<string, unknown> }[], uploads: [] as string[], calls: [] as string[] };
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const req = route.request(); const url = new URL(req.url());
    const prefix = url.origin === "https://api.tareeq-academy.com" ? "/api/v1" : "/__dev_api";
    if (!url.pathname.startsWith(prefix)) return url.origin === "http://127.0.0.1:3111" ? route.continue() : route.abort();
    const path = url.pathname.slice(prefix.length); state.calls.push(`${req.method()} ${path}${url.search}`);
    const reply = (data: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    const ok = (data: unknown) => reply({ success: true, data });
    const err = (status: number) => reply({ success: false, error: { code: status === 400 ? "VALIDATION_ERROR" : "FORBIDDEN", message: "Audit fixture failure", details: status === 400 ? { fields: { summaryAr: ["تحقق من الملخص"] } } : {} } }, status);
    if (path === "/auth/me" && req.method() === "GET") return state.sessionEnded ? err(401) : ok({ user: { id: "99999999-9999-4999-8999-999999999999", role, name: "جلسة تدقيق محلية", email: "audit@example.invalid" } });
    if (path === "/auth/change-password" && req.method() === "POST") {
      state.writes.push({ path, body: req.postDataJSON() });
      if (state.passwordDelay) await new Promise(resolve => setTimeout(resolve, state.passwordDelay));
      if (state.passwordStatus !== 200) return err(state.passwordStatus);
      state.sessionEnded = true; return ok({});
    }
    if (path === "/auth/logout" && req.method() === "POST") { state.sessionEnded = true; return ok({}); }
    if (path === "/admin/uploads/images" && req.method() === "POST") { state.uploads.push(req.postData() ?? ""); return ok({ assetId: "audit-local", publicId: "audit/local", secureUrl: "https://example.invalid/audit.png", format: "png", bytes: 12, width: 1, height: 1 }); }
    if (req.method() === "PATCH") { const body = req.postDataJSON(); state.writes.push({ path, body }); await state.patchGate; if (state.patchError) return err(state.patchError); return ok({ ...(path.includes("articles") ? article : path.includes("scholarships") ? scholarship : path.includes("services") ? service : countries[0]), ...body }); }
    if (req.method() !== "GET") return route.abort();
    const resource = path.split("/")[2]; let rows = resource === "countries" ? countries : resource === "universities" ? [university, { ...university, id: secondScholarshipId, countryId: otherCountryId, nameAr: "جامعة ثانية" }] : resource === "scholarships" ? [scholarship, { ...scholarship, id: secondScholarshipId, titleAr: "منحة ثانية" }] : resource === "articles" ? [article] : resource === "services" ? [service] : [];
    if (path.split("/").length > 3) return ok(state.maxLinks && resource === "articles" ? { ...article, scholarshipIds: Array.from({ length: 50 }, (_, i) => `20000000-0000-4000-8000-${String(i).padStart(12, "0")}`) } : rows.find(row => row.id === path.split("/")[3]) ?? rows[0]);
    if (state.selectorError && resource === "countries") return err(403);
    if (state.selectorNetwork && resource === "countries") return route.abort("failed");
    if (state.selectorEmpty && resource === "countries") rows = [];
    if (state.offPage && resource === "scholarships") rows = Array.from({ length: 51 }, (_, i) => ({ ...scholarship, id: i === 50 ? secondScholarshipId : `10000000-0000-4000-8000-${String(i).padStart(12, "0")}`, titleAr: `منحة ${i}` }));
    const current = Number(url.searchParams.get("page") ?? 1); const limit = Number(url.searchParams.get("limit") ?? 12);
    return ok({ items: rows.slice((current - 1) * limit, current * limit), pagination: { page: current, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) } });
  });
  return { state, errors };
}
const save = (page: Page) => page.locator('form button[type="submit"]').click();

test("AUD-01 Article unrelated edit must not collapse multiple scholarship links", async ({ page }) => {
  const { state } = await isolate(page, "SUPER_ADMIN"); await page.goto(`/admin/articles/${recordId}`);
  await expect(page.getByLabel("الملخص بالعربية", { exact: false })).toHaveValue("ملخص");
  await page.getByLabel("الملخص بالعربية", { exact: false }).fill("تغيير الملخص فقط"); await save(page);
  await expect.poll(() => state.writes.length).toBe(1);
  const body = state.writes[0].body;
  expect(!("scholarshipId" in body) || JSON.stringify(body.scholarshipIds) === JSON.stringify(article.scholarshipIds)).toBeTruthy();
});

test("AUD-02 Unchanged scholarship deadline must retain its exact UTC instant", async ({ page }) => {
  const { state } = await isolate(page); await page.goto(`/admin/scholarships/${recordId}`);
  await expect(page.getByLabel("العنوان بالعربية", { exact: false })).toHaveValue(scholarship.titleAr);
  await expect(page.locator("#scholarships-verifiedDeadline")).toHaveValue(/2026-11-20T15:34:56/);
  await page.getByLabel("العنوان بالعربية", { exact: false }).fill("عنوان معدل فقط"); await save(page);
  await expect.poll(() => state.writes.length).toBe(1);
  // Changed-field PATCH must omit the untouched deadline; pure round-trip is tested separately.
  expect(state.writes[0].body).not.toHaveProperty("verifiedDeadline");
});

test("AUD-06 Country change must clear a now-incompatible University UUID", async ({ page }) => {
  const { state } = await isolate(page); await page.goto(`/admin/scholarships/${recordId}`);
  await expect(page.locator("#scholarships-universityId")).toHaveValue(universityId);
  await page.locator("#scholarships-countryId").selectOption(otherCountryId); await save(page);
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].body.countryId).toBe(otherCountryId);
  expect(state.writes[0].body.universityId).toBeNull();
});

test("AUD-07 Failed original relationship lookup must expose an error and retry", async ({ page }) => {
  const { state } = await isolate(page); state.selectorError = true; await page.goto(`/admin/articles/${recordId}`);
  await expect(page.getByLabel("العنوان بالعربية", { exact: false })).toHaveValue(article.titleAr);
  await expect.poll(() => state.calls.filter(call => call.startsWith("GET /admin/countries")).length).toBe(1);
  await expect(page.locator('main [role="alert"]')).not.toHaveCount(0);
  state.selectorError = false;
  await page.getByRole("button", { name: /^إعادة تحميل خيارات/ }).click();
  await expect(page.locator("#articles-countryId option")).toHaveCount(3);
  expect(state.calls.filter(call => call.startsWith("GET /admin/countries")).length).toBe(2);
});

test("AUD-08 Mobile modal navigation must retain keyboard focus", async ({ page }) => {
  await isolate(page, "SUPER_ADMIN"); await page.setViewportSize({ width: 390, height: 640 }); await page.goto("/admin");
  await page.getByRole("button", { name: "فتح قائمة التنقل", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "قائمة التنقل", exact: true }); await expect(dialog).toBeVisible();
  // Reverse-tab from the initially focused close button must stay in the modal.
  await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBeTruthy();
});

test("New role/nav cross-module links and tablet/mobile RTL structure remain usable", async ({ page }) => {
  const { state, errors } = await isolate(page, "SUPER_ADMIN"); await page.goto("/admin");
  await expect(page.getByRole("link", { name: "إضافة دولة", exact: true })).toHaveAttribute("href", "/admin/countries/new");
  await page.getByRole("link", { name: "كتابة مقال", exact: true }).click();
  await expect(page.getByRole("heading", { name: "إضافة مقال", exact: true, level: 2 })).toBeVisible();
  for (const width of [350, 768, 1440]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy(); }
  expect(await page.locator("html").getAttribute("dir")).toBe("rtl"); expect(errors).toEqual([]); expect(state.writes).toHaveLength(0);
});

test("Original Service editor real-Axios 400 retains edits and does not show success", async ({ page }) => {
  const { state, errors } = await isolate(page); await page.goto(`/admin/services/${recordId}`);
  await page.getByLabel("الملخص بالعربية", { exact: false }).fill("تحرير غير محفوظ"); state.patchError = 400; await save(page);
  await expect(page.getByText("تحقق من الملخص", { exact: true })).toBeVisible();
  await expect(page.getByLabel("الملخص بالعربية", { exact: false })).toHaveValue("تحرير غير محفوظ"); expect(state.writes).toHaveLength(1); expect(errors).toEqual([]);
});

test("Production runtime excludes development proxy and mock controls", async ({ page, request }) => {
  const { state } = await isolate(page); await page.goto("/admin");
  await expect(page.getByText("أدوات التطوير", { exact: false })).toHaveCount(0);
  // Direct request to the locally served production build; it must stop before upstream.
  const response = await request.get("/__dev_api/health"); expect(response.status()).toBe(404);
  expect(state.writes).toHaveLength(0);
});

test("Shared uploader maps resource and secureUrl across all five original editors", async ({ page }) => {
  const { state } = await isolate(page);
  for (const resource of ["countries", "universities", "scholarships", "services", "articles"]) {
    const id = resource === "countries" ? countryId : resource === "universities" ? universityId : recordId;
    await page.goto(`/admin/${resource}/${id}`);
    const title = page.locator(`#${resource}-${["countries", "universities"].includes(resource) ? "nameAr" : "titleAr"}`);
    await expect(title).not.toHaveValue(""); const original = await title.inputValue();
    await page.getByLabel("ملف الصورة", { exact: true }).setInputFiles({ name: "audit.png", mimeType: "image/png", buffer: Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]) });
    await page.getByRole("button", { name: "رفع الصورة", exact: true }).click();
    await expect(page.locator(`#${resource}-${resource === "articles" ? "coverImageUrl" : "imageUrl"}`)).toHaveValue("https://example.invalid/audit.png");
    expect(state.uploads.at(-1)).toContain(`\r\n${resource}\r\n`); await expect(title).toHaveValue(original);
  }
  expect(state.uploads).toHaveLength(5); expect(state.writes).toHaveLength(0);
});

test("Remediation Article off-page links, ordering, failure retention, removal/addition and explicit clear", async ({ page }) => {
  const { state, errors } = await isolate(page); state.offPage = true;
  await page.goto(`/admin/articles/${recordId}`);
  const picker = page.locator("fieldset").filter({ has: page.getByText("المنح المرتبطة بالترتيب", { exact: false }) });
  await expect(picker.locator("ol li")).toHaveCount(2);
  await expect(picker.locator("ol")).toContainText(secondScholarshipId);
  await picker.getByRole("button", { name: "التالي", exact: true }).click();
  await expect(picker.getByText("صفحة 2 من 2 · 51 سجل", { exact: true })).toBeVisible();
  await expect(picker.locator("ol li")).toHaveCount(2);
  await picker.getByRole("button", { name: "السابق", exact: true }).click();
  await expect(picker.getByText("صفحة 1 من 2 · 51 سجل", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "رفع المنحة 2", exact: true }).click();
  state.patchError = 400; await save(page);
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].body.scholarshipIds).toEqual([secondScholarshipId, recordId]);
  await expect(picker.locator("ol li").first()).toContainText(secondScholarshipId);
  await page.getByRole("button", { name: "إزالة المنحة 2", exact: true }).click();
  const candidate = "10000000-0000-4000-8000-000000000000";
  await page.getByLabel("اختيار منحة للربط", { exact: true }).selectOption(candidate);
  await page.getByRole("button", { name: "إضافة المنحة للارتباط", exact: true }).click();
  await expect(picker.locator("ol li")).toHaveCount(2);
  await expect(page.getByLabel("اختيار منحة للربط", { exact: true }).locator(`option[value="${candidate}"]`)).toHaveCount(0);
  await save(page); expect(state.writes.at(-1)?.body.scholarshipIds).toEqual([secondScholarshipId, candidate]);
  page.once("dialog", dialog => dialog.accept()); await page.getByRole("button", { name: "مسح ارتباطات المنح", exact: true }).click();
  await save(page); expect(state.writes.at(-1)?.body.scholarshipIds).toEqual([]);
  expect(errors).toEqual([]);
});

for (const resource of ["articles", "scholarships"]) test(`Remediation ${resource} valid University survives unrelated edits, incompatible choice clears and new University saves`, async ({ page }) => {
  const { state } = await isolate(page); await page.goto(`/admin/${resource}/${recordId}`);
  const country = page.locator(`#${resource}-countryId`); const uni = page.locator(`#${resource}-universityId`);
  await country.selectOption(countryId); await uni.selectOption(universityId);
  await country.selectOption(countryId); await expect(uni).toHaveValue(universityId);
  await page.getByLabel("العنوان بالعربية", { exact: false }).fill("عنوان لا يغير العلاقة");
  await expect(uni).toHaveValue(universityId);
  await country.selectOption(otherCountryId); await expect(uni).toHaveValue("");
  await uni.selectOption(secondScholarshipId); await save(page);
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].body.universityId).toBe(secondScholarshipId);
  expect(state.writes[0].body.countryId).toBe(otherCountryId);
});

test("Remediation all eight advanced filters serialize together and reset pagination without changing existing filters", async ({ page }) => {
  const { state, errors } = await isolate(page); await page.goto("/admin/scholarships?page=2&limit=12&studyLevel=MASTERS&featured=false");
  await page.getByText("مرشحات الجامعة المرتبطة المتقدمة", { exact: true }).click();
  const values = { universitySearch: "جامعة محلية", universityCountry: "country-0", universityMajor: "computer-science", universityStudyLevel: "BACHELORS", universityLanguage: "ENGLISH", universityCity: "city-aa", universityType: "PUBLIC", universityFeatured: "true" };
  for (const [name, value] of Object.entries(values)) { const control = page.locator(`[name="${name}"]`); if (await control.evaluate(el => el.tagName) === "SELECT") await control.selectOption(value); else await control.fill(value); }
  await page.getByRole("button", { name: "تطبيق", exact: true }).click();
  await expect.poll(() => state.calls.filter(call => call.includes("universitySearch=")).length).toBeGreaterThan(0);
  const params = new URL(page.url()).searchParams;
  for (const [name,value] of Object.entries(values)) expect(params.get(name)).toBe(value);
  expect(params.get("page")).toBe("1"); expect(params.get("studyLevel")).toBe("MASTERS"); expect(params.get("featured")).toBe("false");
  const request = state.calls.filter(call => call.includes("universitySearch=")).at(-1)!;
  for (const [name,value] of Object.entries(values)) expect(new URL(request.slice(4), "http://local.invalid").searchParams.get(name)).toBe(value);
  await page.getByRole("link", { name: "إعادة ضبط", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/scholarships$/); expect(errors).toEqual([]);
});

test("Remediation relationship network failure preserves selection, explicit retry recovers, successful empty is distinct", async ({ page }) => {
  const { state } = await isolate(page); state.selectorNetwork = true;
  await page.goto(`/admin/scholarships/${recordId}`);
  await expect(page.locator("#scholarships-countryId")).toHaveValue(countryId);
  await expect(page.getByRole("button", { name: /^إعادة تحميل خيارات/ })).toBeVisible();
  expect(state.calls.filter(call => call.startsWith("GET /admin/countries")).length).toBe(1);
  state.selectorNetwork = false; state.selectorEmpty = true;
  await page.getByRole("button", { name: /^إعادة تحميل خيارات/ }).click();
  await expect(page.getByRole("button", { name: /^إعادة تحميل خيارات/ })).toHaveCount(0);
  await expect(page.locator("#scholarships-countryId")).toHaveValue(countryId);
  expect(state.calls.filter(call => call.startsWith("GET /admin/countries")).length).toBe(2);
});

test("Remediation mobile modal tab/escape/focus/scroll/navigation and desktop sidebar", async ({ page }) => {
  await isolate(page, "SUPER_ADMIN"); await page.setViewportSize({ width: 390, height: 640 }); await page.goto("/admin");
  const opener = page.getByRole("button", { name: "فتح قائمة التنقل", exact: true }); await opener.click();
  const dialog = page.getByRole("dialog", { name: "قائمة التنقل", exact: true });
  for (let i = 0; i < 30; i++) { await page.keyboard.press(i < 15 ? "Tab" : "Shift+Tab"); expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBeTruthy(); }
  expect(await dialog.locator("aside").evaluate(el => el.scrollHeight > el.clientHeight)).toBeTruthy();
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
  await opener.click(); await dialog.getByRole("link", { name: "الدول", exact: true }).click(); await expect(dialog).toHaveCount(0); await expect(page).toHaveURL(/\/admin\/countries$/);
  await page.setViewportSize({ width: 1440, height: 900 }); await expect(page.getByRole("complementary", { name: "التنقل الإداري" }).first()).toBeVisible();
});

for (const role of ["ADMIN", "SUPER_ADMIN"] as const) test(`Remediation password ${role} validation, pending single POST and terminal cleanup without refresh`, async ({ page }) => {
  const { state, errors } = await isolate(page, role); state.passwordDelay = 300;
  await page.goto("/admin/change-password");
  await page.getByRole("button", { name: "حفظ كلمة المرور الجديدة", exact: true }).click();
  await expect(page.getByText("أدخل كلمة المرور الحالية.", { exact: true })).toBeVisible(); expect(state.writes).toHaveLength(0);
  await page.getByLabel("كلمة المرور الحالية", { exact: true }).fill("LocalOldPassword1");
  await page.getByLabel("كلمة المرور الجديدة", { exact: true }).fill("LocalNewPassword2");
  await page.getByRole("button", { name: "حفظ كلمة المرور الجديدة", exact: true }).click();
  await expect(page.getByRole("button", { name: "جارٍ تغيير كلمة المرور…", exact: true })).toBeDisabled();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(state.writes).toEqual([{ path: "/auth/change-password", body: { currentPassword: "LocalOldPassword1", newPassword: "LocalNewPassword2" } }]);
  expect(state.calls.some(call => call.includes("/auth/refresh"))).toBe(false); expect(errors).toEqual([]);
});

for (const status of [400, 401, 403]) test(`Remediation password ${status} retains edits and never retries or refreshes`, async ({ page }) => {
  const { state } = await isolate(page); state.passwordStatus = status; await page.goto("/admin/change-password");
  await page.getByLabel("كلمة المرور الحالية", { exact: true }).fill("LocalOldPassword1"); await page.getByLabel("كلمة المرور الجديدة", { exact: true }).fill("LocalNewPassword2");
  await page.getByRole("button", { name: "حفظ كلمة المرور الجديدة", exact: true }).click();
  await expect(page.locator('form [role="alert"]').first()).toBeVisible(); await expect(page).toHaveURL(/\/admin\/change-password$/);
  await expect(page.getByLabel("كلمة المرور الجديدة", { exact: true })).toHaveValue("LocalNewPassword2"); expect(state.writes).toHaveLength(1); expect(state.calls.some(call => call.includes("/auth/refresh"))).toBe(false);
});

test("Remediation Article maximum fifty disables addition without discarding off-page selections", async ({ page }) => {
  const { state } = await isolate(page); state.maxLinks = true; await page.goto(`/admin/articles/${recordId}`);
  await expect(page.locator("fieldset ol li")).toHaveCount(50);
  await page.getByLabel("اختيار منحة للربط", { exact: true }).selectOption(recordId);
  await expect(page.getByRole("button", { name: "إضافة المنحة للارتباط", exact: true })).toBeDisabled();
  expect(state.writes).toHaveLength(0);
});

test("Remediation pending core save resolved after cleanup cannot redirect or show stale success", async ({ page }) => {
  const { state, errors } = await isolate(page); let release!: () => void;
  state.patchGate = new Promise(resolve => { release = resolve; });
  await page.goto(`/admin/services/${recordId}`); await page.getByLabel("الملخص بالعربية", { exact: false }).fill("معلق محلي"); await save(page);
  await expect.poll(() => state.writes.length).toBe(1);
  await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click(); await expect(page).toHaveURL(/\/admin\/login$/);
  release(); await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/admin\/login$/); expect(state.writes).toHaveLength(1); expect(errors).toEqual([]);
});

test("Remediation failed deadline change retains local precision and explicit nullable clear", async ({ page }) => {
  const { state } = await isolate(page); state.patchError = 400; await page.goto(`/admin/scholarships/${recordId}`);
  const deadline = page.locator("#scholarships-verifiedDeadline");
  await deadline.fill("2026-12-01T15:30:45.123"); await save(page);
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].body.verifiedDeadline).toBe("2026-12-01T12:30:45.123Z");
  await expect(deadline).toHaveValue("2026-12-01T15:30:45.123");
  await deadline.fill(""); await save(page);
  await expect.poll(() => state.writes.length).toBe(2); expect(state.writes[1].body.verifiedDeadline).toBeNull();
});

test("Remediation slug feedback create/edit and no-op PATCH prevents transport", async ({ page }) => {
  const { state } = await isolate(page); await page.goto(`/admin/services/${recordId}`);
  await expect(page.locator("#services-titleAr")).toHaveValue(service.titleAr); await save(page);
  await expect(page.getByText("لا توجد تغييرات للحفظ.", { exact: true })).toBeVisible(); expect(state.writes).toHaveLength(0);
  await page.locator("#services-slug").fill("x"); await save(page);
  await expect(page.locator("#services-slug-error")).toBeVisible(); expect(state.writes).toHaveLength(0);
  await page.goto("/admin/services/new"); await page.locator("#services-slug").fill("x"); await save(page);
  await expect(page.locator("#services-slug-error")).toBeVisible(); expect(state.writes).toHaveLength(0);
});

test("Remediation forbidden lookup keeps selected UUIDs and allows unrelated safe PATCH", async ({ page }) => {
  const { state } = await isolate(page); state.selectorError = true; await page.goto(`/admin/scholarships/${recordId}`);
  await expect(page.locator("#scholarships-countryId")).toHaveValue(countryId);
  await expect(page.locator("#scholarships-universityId")).toHaveValue(universityId);
  await expect(page.getByRole("button", { name: /^إعادة تحميل خيارات/ })).toBeVisible();
  await page.locator("#scholarships-titleAr").fill("تعديل مستقل عن الخيارات"); await save(page);
  await expect.poll(() => state.writes.length).toBe(1);
  expect(state.writes[0].body).toEqual({ titleAr: "تعديل مستقل عن الخيارات" });
});
