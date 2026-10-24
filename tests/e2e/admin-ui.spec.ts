import { expect, test, type Page } from "@playwright/test";

const resourceLabels = {
  countries: "الدول",
  universities: "الجامعات",
  scholarships: "المنح الدراسية",
  services: "الخدمات",
  articles: "المقالات",
} as const;

const createLabels = {
  countries: "إضافة الدولة",
  universities: "إضافة الجامعة",
  scholarships: "إضافة المنحة",
  services: "إضافة الخدمة",
  articles: "إنشاء المقال",
} as const;

type Resource = keyof typeof resourceLabels;

async function openMockTools(page: Page) {
  const tools = page.locator("summary").filter({ hasText: "أدوات المعاينة" });
  if (!(await tools.locator("xpath=parent::details").evaluate((element) => (element as HTMLDetailsElement).open))) await tools.click();
}

async function setMockScenario(page: Page, scenario: string) {
  await openMockTools(page);
  await page.getByLabel("سيناريو").selectOption(scenario);
}

function submitButton(page: Page) {
  return page.locator("form").getByRole("button", { name: /إضافة الدولة|إضافة الجامعة|إضافة المنحة|إضافة الخدمة|إنشاء المقال|حفظ التغييرات/ });
}

async function resetAndScale(page: Page) {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "مرحبًا بك في مساحة الإدارة" })).toBeVisible();
  await openMockTools(page);
  await page.getByRole("button", { name: "علاقات 60+" }).click();
}

async function setEditorialStatus(page: Page, resource: Resource, status: "PUBLISHED" | "DRAFT" | "ARCHIVED") {
  const select = page.locator(`#${resource}-status`);
  if (status !== "DRAFT") page.once("dialog", (dialog) => dialog.accept());
  await select.selectOption(status);
  await submitButton(page).click();
  await page.waitForTimeout(150);
  await expect(page).toHaveURL(new RegExp(`/admin/${resource}/[^/]+$`));
  await expect(select).toHaveValue(status);
}

async function fillRequired(page: Page, resource: Resource, suffix: string) {
  if (resource === "countries") {
    await page.locator("#countries-nameAr").fill(`دولة متصفح ${suffix}`);
    await page.locator("#countries-introductionAr").fill("مقدمة اختبارية للدولة.");
    await page.locator("#countries-detailsAr").fill("تفاصيل اختبارية للدولة.");
  }
  if (resource === "universities") {
    await page.locator("#universities-nameAr").fill(`جامعة متصفح ${suffix}`);
    await page.locator("#universities-officialName").fill(`Browser University ${suffix}`);
    await page.getByLabel("البحث في الدولة").fill("الأردن");
    await page.locator("#universities-countryId").selectOption({ label: "الأردن" });
    await page.locator("#universities-cityAr").fill("عمّان");
    await page.locator("#universities-overviewAr").fill("نبذة اختبارية للجامعة.");
  }
  if (resource === "scholarships") {
    await page.locator("#scholarships-titleAr").fill(`منحة متصفح ${suffix}`);
    await page.locator("#scholarships-studyLevel").fill("بكالوريوس");
    await page.locator("#scholarships-fundingType").fill("تمويل كامل");
    await page.locator("#scholarships-requirementsAr").fill("متطلبات اختبارية.");
    await page.locator("#scholarships-descriptionAr").fill("وصف اختباري للمنحة.");
  }
  if (resource === "services") {
    await page.locator("#services-titleAr").fill(`خدمة متصفح ${suffix}`);
    await page.locator("#services-summaryAr").fill("ملخص اختباري للخدمة.");
    await page.locator("#services-descriptionAr").fill("وصف اختباري للخدمة.");
  }
  if (resource === "articles") {
    await page.locator("#articles-titleAr").fill(`مقال متصفح ${suffix}`);
    await page.locator("#articles-summaryAr").fill("ملخص اختباري للمقال.");
    await page.locator("fieldset").filter({ hasText: "محتوى المقال بالعربية" }).locator("textarea").first().fill("فقرة اختبارية أولى.");
  }
  await page.locator(`#${resource}-slug`).fill(`browser-${resource}-${suffix}`);
}

async function exerciseArticleBlocks(page: Page) {
  const editor = page.locator("fieldset").filter({ hasText: "محتوى المقال بالعربية" });
  for (let index = 0; index < 6; index += 1) await editor.getByRole("button", { name: "إضافة كتلة" }).click();
  const types = ["paragraph", "heading2", "heading3", "bulleted-list", "numbered-list", "quote", "paragraph"];
  const selects = editor.locator("select");
  const textareas = editor.locator("textarea");
  for (let index = 0; index < types.length; index += 1) {
    await selects.nth(index).selectOption(types[index]);
    await textareas.nth(index).fill(`كتلة اختبار ${index + 1}`);
  }
  await page.waitForTimeout(100);
  await editor.getByRole("button", { name: "أسفل" }).nth(0).click();
  await page.waitForTimeout(100);
  await editor.getByRole("button", { name: "حذف" }).last().click();
  await page.waitForTimeout(100);
  await expect(editor.locator("select")).toHaveCount(6);
  await expect(editor.locator("textarea").nth(0)).toHaveValue("كتلة اختبار 2");
  for (let index = 0; index < 6; index += 1) await editor.locator("textarea").nth(index).fill(`كتلة محفوظة ${index + 1}`);
}

test.describe.configure({ mode: "serial" });

test("mock roles, protected navigation, logout, and responsive drawer are interactive", async ({ page }) => {
  await resetAndScale(page);
  await expect(page.getByText("مشرف التطوير")).toBeVisible();
  await expect(page.getByRole("link", { name: "الدول" })).toBeVisible();
  await expect(page.getByRole("button", { name: "التحليلات" })).toBeHidden();

  await page.getByRole("button", { name: "SUPER_ADMIN" }).click();
  await expect(page.getByText("مدير التطوير")).toBeVisible();
  await expect(page.getByRole("button", { name: "التحليلات" })).toBeVisible();
  await expect(page.getByRole("button", { name: "التحليلات" })).toBeDisabled();
  await page.getByRole("link", { name: "الدول" }).click();
  await expect(page).toHaveURL(/\/admin\/countries/);

  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByLabel("دخول التطوير التجريبي")).toBeVisible();
  await page.getByRole("button", { name: "الدخول كمشرف" }).click();
  await expect(page).toHaveURL(/\/admin/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "فتح قائمة التنقل" }).click();
  await expect(page.getByRole("dialog", { name: "قائمة التنقل" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "قائمة التنقل" })).toBeHidden();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBeTruthy();
});

for (const resource of Object.keys(resourceLabels) as Resource[]) {
  test(`${resource}: list, validation, create, edit, lifecycle, and pagination`, async ({ page }) => {
    const suffix = `${resource}-ui`;
    await resetAndScale(page);
    await page.getByRole("link", { name: resourceLabels[resource] }).click();
    await expect(page.getByRole("heading", { name: resourceLabels[resource], level: 2 })).toBeVisible();
    await expect(page.getByText("صفحة 1 من")).toBeVisible();
    const search = page.getByRole("textbox", { name: "بحث" });
    if (await search.count()) {
      await search.fill("لا توجد نتيجة مطابقة");
      await page.getByRole("button", { name: "تطبيق" }).click();
      await expect(page).toHaveURL(/search=/);
      await expect(page.getByRole("heading", { name: "لا توجد بيانات لعرضها" })).toBeVisible();
      await page.getByRole("link", { name: "إعادة ضبط" }).click();
      await expect(page).not.toHaveURL(/search=/);
    }
    await page.getByLabel("الحالة").selectOption("DRAFT");
    await page.getByRole("button", { name: "تطبيق" }).click();
    await expect(page).toHaveURL(/status=DRAFT/);
    await page.getByRole("link", { name: "إعادة ضبط" }).click();
    await expect(page).not.toHaveURL(/status=/);
    await page.getByLabel("الترتيب").selectOption({ index: 1 });
    await page.getByRole("button", { name: "تطبيق" }).click();
    await expect(page).toHaveURL(/sort=/);
    await page.getByRole("link", { name: "إعادة ضبط" }).click();
    await expect(page).not.toHaveURL(/sort=/);
    await page.getByRole("button", { name: "التالي" }).click();
    await expect(page.getByText("صفحة 2 من")).toBeVisible();
    await page.getByRole("link", { name: new RegExp(`إضافة`) }).click();
    await expect(submitButton(page)).toHaveAccessibleName(createLabels[resource]);
    await submitButton(page).click();
    await expect(page.getByText(resource === "articles" ? "أدخل نص الكتلة." : "هذا الحقل مطلوب.").first()).toBeVisible();

    await fillRequired(page, resource, suffix);
    if (resource === "articles") await exerciseArticleBlocks(page);
    await expect(submitButton(page)).toBeEnabled();
    await submitButton(page).click();
    await expect(page).toHaveURL(new RegExp(`/admin/${resource}/[^/]+$`));
    await expect(page.getByRole("heading", { name: /تعديل/, level: 2 })).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.locator(`#${resource}-slug`)).toHaveValue(`browser-${resource}-${suffix}`);

    const title = resource === "countries" || resource === "universities" ? `#${resource}-nameAr` : `#${resource}-titleAr`;
    await page.locator(title).fill(`${resource === "countries" ? "دولة" : resource === "universities" ? "جامعة" : resource === "scholarships" ? "منحة" : resource === "services" ? "خدمة" : "مقال"} مُحدّث ${suffix}`);
    await submitButton(page).click();
    await page.waitForTimeout(150);
    await expect(page.locator(title)).toHaveValue(/مُحدّث/);
    await setEditorialStatus(page, resource, "PUBLISHED");
    await setEditorialStatus(page, resource, "DRAFT");
    await setEditorialStatus(page, resource, "ARCHIVED");
    await page.getByRole("link", { name: "العودة إلى القائمة" }).click();
    await expect(page.locator("td span").filter({ hasText: "مؤرشف" }).first()).toBeVisible();
    if (resource === "articles") {
      await page.getByRole("link", { name: "تعديل" }).first().click();
      const editor = page.locator("fieldset").filter({ hasText: "محتوى المقال بالعربية" });
      await expect(editor.locator("select")).toHaveCount(6);
      await expect(editor.locator("textarea").nth(0)).toHaveValue("كتلة محفوظة 1");
    }
  });
}

test("relationship selectors search beyond page fifty, preserve selections, and show empty results", async ({ page }) => {
  await resetAndScale(page);
  await page.getByRole("link", { name: "المقالات" }).click();
  await page.getByRole("link", { name: "إضافة مقال" }).click();
  const countrySearch = page.getByLabel("البحث في الدولة المرتبطة");
  await countrySearch.fill("60");
  await expect(page.locator("#articles-countryId").getByRole("option", { name: "دولة اختبار العلاقات 60" })).toHaveCount(1);
  await page.locator("#articles-countryId").selectOption({ label: "دولة اختبار العلاقات 60" });
  const universitySearch = page.getByLabel("البحث في الجامعة المرتبطة");
  await universitySearch.fill("60");
  await expect(page.locator("#articles-universityId").getByRole("option", { name: "جامعة اختبار العلاقات 60" })).toHaveCount(1);
  await page.locator("#articles-universityId").selectOption({ label: "جامعة اختبار العلاقات 60" });
  await universitySearch.fill("لا يوجد هذا الخيار");
  await expect(page.locator("#articles-universityId")).toHaveValue(/20000000-0000-4000-8000-000000000060/);
  await page.locator("#articles-universityId").selectOption("");
  await expect(page.getByText("لا توجد نتائج مطابقة.")).toBeVisible();
  await universitySearch.fill("60");
  await page.locator("#articles-universityId").selectOption({ label: "جامعة اختبار العلاقات 60" });
  await fillRequired(page, "articles", "relationship-60");
  await submitButton(page).click();
  await expect(page.locator("#articles-countryId")).toHaveValue(/10000000-0000-4000-8000-000000000060/);
  await expect(page.locator("#articles-universityId")).toHaveValue(/20000000-0000-4000-8000-000000000060/);
});

test("approved UI refinements keep form actions, directions, previews, and mock tools usable", async ({ page }) => {
  await resetAndScale(page);
  await expect(page.getByRole("link", { name: "إضافة دولة" })).toHaveAttribute("href", "/admin/countries/new");
  await expect(page.locator("aside[aria-label='التنقل الإداري'] svg")).toHaveCount(9);

  await page.getByRole("link", { name: "إضافة دولة" }).click();
  await expect(page.locator("#countries-nameAr")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#countries-nameEn")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#countries-slug")).toHaveAttribute("dir", "ltr");
  await page.setViewportSize({ width: 390, height: 844 });
  const stickyActions = page.getByLabel("إجراءات النموذج");
  await expect(stickyActions.getByRole("button", { name: "إضافة الدولة" })).toBeVisible();
  await stickyActions.getByRole("button", { name: "إضافة الدولة" }).click();
  await expect(page.getByText("هذا الحقل مطلوب.").first()).toBeVisible();
  await expect(stickyActions.getByRole("link", { name: "إلغاء" })).toBeVisible();

  await page.goto("/admin/articles/new");
  await expect(page.locator("#articles-titleEn")).toHaveAttribute("dir", "ltr");
  const englishEditor = page.locator("fieldset").filter({ hasText: "محتوى المقال بالإنجليزية" });
  await englishEditor.getByRole("button", { name: "إضافة كتلة" }).click();
  await expect(englishEditor.locator("textarea").first()).toHaveAttribute("dir", "ltr");
  const coverUrl = page.locator("#articles-coverImageUrl");
  await page.route("https://valid.preview.test/**", (route) => route.fulfill({ contentType: "image/gif", body: Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64") }));
  await coverUrl.fill("https://valid.preview.test/image.gif");
  await expect(page.getByAltText("معاينة الصورة المدخلة")).toBeVisible();
  await coverUrl.fill("not-a-url");
  await expect(page.getByText("رابط الصورة غير صالح للمعاينة.")).toBeVisible();
  await page.route("https://unavailable.preview.test/**", (route) => route.abort());
  await coverUrl.fill("https://unavailable.preview.test/image.png");
  await expect(page.getByText("تعذّر تحميل معاينة الصورة.")).toBeVisible();
  await coverUrl.fill("");
  await expect(page.getByText("لم يُدخل رابط صورة بعد.")).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("button", { name: "SUPER_ADMIN" })).toBeHidden();
  await page.locator("summary").filter({ hasText: "أدوات المعاينة" }).click();
  await expect(page.getByRole("button", { name: "SUPER_ADMIN" })).toBeVisible();
  await page.getByRole("button", { name: "SUPER_ADMIN" }).click();
  await expect(page.getByText("مدير", { exact: true })).toBeVisible();
});

test("mock error scenarios show recoverable Arabic feedback", async ({ page }) => {
  await resetAndScale(page);
  await setMockScenario(page, "empty");
  await page.getByRole("link", { name: "الخدمات" }).click();
  await expect(page.getByRole("heading", { name: "لا توجد بيانات لعرضها" })).toBeVisible();

  await resetAndScale(page);
  await setMockScenario(page, "loading");
  await page.getByRole("link", { name: "الدول" }).click();
  await expect(page.getByRole("heading", { name: "جارٍ التحميل" })).toBeVisible();
  await expect(page.getByText("صفحة 1 من")).toBeVisible();

  await resetAndScale(page);
  await setMockScenario(page, "failure");
  await page.getByRole("link", { name: "الدول" }).click();
  await expect(page.getByRole("heading", { name: "تعذّر إتمام الطلب" })).toBeVisible();

  await resetAndScale(page);
  await setMockScenario(page, "network");
  await page.getByRole("link", { name: "الخدمات" }).click();
  await expect(page.getByRole("heading", { name: "تعذّر إتمام الطلب" })).toBeVisible();

  await resetAndScale(page);
  await page.getByRole("link", { name: "الدول" }).click();
  await page.getByRole("link", { name: "إضافة دولة" }).click();
  await fillRequired(page, "countries", "duplicate");
  await page.locator("#countries-slug").fill("jordan");
  await submitButton(page).click();
  await expect(page.getByText("هذا المعرّف النصي مستخدم بالفعل.")).toBeVisible();
  await expect(page.locator("#countries-nameAr")).toHaveValue(/دولة متصفح/);
  await setMockScenario(page, "validation");
  await submitButton(page).click();
  await expect(page.getByText("قيمة الاختبار غير صالحة.")).toBeVisible();
  await setMockScenario(page, "forbidden");
  await page.getByRole("link", { name: "العودة إلى القائمة" }).click();
  await expect(page.getByRole("heading", { name: "تعذّر إتمام الطلب" })).toBeVisible();
});

test("every content module renders the shared recoverable failure state", async ({ page }) => {
  for (const resource of Object.keys(resourceLabels) as Resource[]) {
    await resetAndScale(page);
    await setMockScenario(page, "failure");
    await page.getByRole("link", { name: resourceLabels[resource] }).click();
    await expect(page.getByRole("heading", { name: "تعذّر إتمام الطلب" })).toBeVisible();
  }
});

test("six-width RTL responsive matrix has no viewport overflow", async ({ page }) => {
  await resetAndScale(page);
  const matrix: { width: number; resource: Resource }[] = [
    { width: 350, resource: "countries" },
    { width: 390, resource: "universities" },
    { width: 768, resource: "scholarships" },
    { width: 1024, resource: "services" },
    { width: 1280, resource: "articles" },
    { width: 1440, resource: "countries" },
  ];
  for (const entry of matrix) {
    await page.setViewportSize({ width: entry.width, height: 900 });
    if (entry.width < 1024) await page.getByRole("button", { name: "فتح قائمة التنقل" }).click();
    await page.getByRole("link", { name: resourceLabels[entry.resource] }).click();
    await expect(page.getByRole("heading", { name: resourceLabels[entry.resource], level: 2 })).toBeVisible();
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBeTruthy();
  }
});
