import { expect, test, type Page } from "@playwright/test";

const resourceLabels = {
  countries: "الدول",
  universities: "الجامعات",
  scholarships: "المنح الدراسية",
  services: "الخدمات",
  articles: "المقالات",
} as const;

const createSubmitLabels = {
  countries: "حفظ وإنهاء",
  universities: "إضافة الجامعة",
  scholarships: "حفظ وإنهاء",
  services: "حفظ وإنهاء",
  articles: "إنشاء المقال",
} as const;

type Resource = keyof typeof resourceLabels;
const publicationLabels = { PUBLISHED: "منشور", DRAFT: "مسودة", ARCHIVED: "مؤرشف" } as const;

async function openMockTools(page: Page) {
  const tools = page.locator("summary").filter({ hasText: "أدوات المعاينة" });
  if (!(await tools.locator("xpath=parent::details").evaluate((element) => (element as HTMLDetailsElement).open))) await tools.click();
}

async function setMockScenario(page: Page, scenario: string) {
  await openMockTools(page);
  await page.getByLabel("سيناريو").selectOption(scenario);
}

function submitButton(page: Page) {
  return page.locator("form").getByRole("button", { name: /حفظ وإنهاء|إضافة الجامعة|إنشاء المقال|حفظ التغييرات/ });
}

async function selectSearchableOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("listbox", { name: label }).getByRole("button", { name: option }).click();
}

async function resetAndScale(page: Page) {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /^مرحبًا،/ })).toBeVisible();
  await openMockTools(page);
  await page.getByRole("button", { name: "علاقات 60+" }).click();
}

async function openCreatedEditor(page: Page, resource: Resource, title: string) {
  await page.getByRole("row", { name: new RegExp(title) }).getByRole("link", { name: "تعديل" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/${resource}/[^/]+$`));
}

async function setEditorialStatus(page: Page, resource: Resource, title: string, status: keyof typeof publicationLabels) {
  const select = page.locator(`#${resource}-status`);
  if (status !== "DRAFT") page.once("dialog", (dialog) => dialog.accept());
  await select.selectOption(status);
  await submitButton(page).evaluate((button) => (button as HTMLButtonElement).click());
  await expect(page).toHaveURL(new RegExp(`/admin/${resource}$`));
  await expect(page.getByRole("row", { name: new RegExp(title) })).toContainText(publicationLabels[status]);
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
    await selectSearchableOption(page, "الدولة", "الأردن");
    await page.locator("#universities-cityAr").fill("عمّان");
    await page.locator("#universities-summaryAr").fill("وصف مختصر اختباري للجامعة.");
    await page.locator("#universities-overviewAr").fill("نبذة اختبارية للجامعة.");
  }
  if (resource === "scholarships") {
    await page.locator("#scholarships-titleAr").fill(`منحة متصفح ${suffix}`);
    await selectSearchableOption(page, "المستوى الدراسي", "بكالوريوس");
    await selectSearchableOption(page, "نوع التمويل", "تمويل كامل");
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
  const slug = `browser-${resource}-${suffix}`;
  if (resource === "countries" || resource === "scholarships") {
    const fallbackSlug = page.locator(`#${resource}-slug-fallback`);
    if (await fallbackSlug.count()) {
      await fallbackSlug.fill(slug);
    } else {
      const advancedId = resource === "scholarships" ? "scholarship-sec-advanced" : "country-sec-advanced";
      await page.locator(`#${advancedId} summary`).click();
      await page.locator(`#${resource}-slug`).fill(slug);
    }
  } else if (resource !== "universities" && resource !== "articles") {
    await page.locator(`#${resource}-slug`).fill(slug);
  }
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
  await expect(page.getByRole("heading", { name: "مرحبًا، مشرف التطوير" })).toBeVisible();
  await expect(page.getByRole("link", { name: "الدول", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "التحليلات" })).toBeHidden();

  await page.getByRole("button", { name: "SUPER_ADMIN" }).click();
  await expect(page.getByRole("heading", { name: "مرحبًا، مدير التطوير" })).toBeVisible();
  await expect(page.getByRole("link", { name: "التحليلات", exact: true })).toHaveAttribute("href", "/admin/analytics");
  await expect(page.getByRole("link", { name: "سجل التدقيق", exact: true })).toHaveAttribute("href", "/admin/audit-log");
  await page.getByRole("link", { name: "الدول", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/countries/);

  await page.getByRole("button", { name: "قائمة الحساب: مدير التطوير" }).click();
  await page.getByRole("menuitem", { name: "تسجيل الخروج" }).click();
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

test("ADMIN and SUPER_ADMIN can close and reopen the profile dialog with button, Escape, and restored focus", async ({ page }) => {
  await resetAndScale(page);

  for (const role of [
    { control: "ADMIN", account: "قائمة الحساب: مشرف التطوير" },
    { control: "SUPER_ADMIN", account: "قائمة الحساب: مدير التطوير" },
  ]) {
    await openMockTools(page);
    await page.getByRole("button", { name: role.control, exact: true }).click();

    const account = page.getByRole("button", { name: role.account, exact: true });
    await account.click();
    await page.getByRole("menuitem", { name: "إعدادات الملف الشخصي", exact: true }).click();
    const profile = page.getByRole("dialog", { name: "إعدادات الملف الشخصي", exact: true });
    await expect(profile).toBeVisible();
    await profile.getByRole("button", { name: "إغلاق", exact: true }).click();
    await expect(profile).toBeHidden();
    await expect(account).toBeFocused();

    await account.click();
    await page.getByRole("menuitem", { name: "إعدادات الملف الشخصي", exact: true }).click();
    await expect(profile).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(profile).toBeHidden();
    await expect(account).toBeFocused();
  }
});

test("submission-management mock preview stays isolated and responsive", async ({ page }) => {
  await resetAndScale(page);
  const entries = [
    { label: "الطلبات", heading: "طلبات التقديم", width: 350 },
    { label: "الاستفسارات", heading: "الاستفسارات العامة", width: 390 },
    { label: "الطلبات", heading: "طلبات التقديم", width: 768 },
    { label: "الاستفسارات", heading: "الاستفسارات العامة", width: 1024 },
    { label: "الطلبات", heading: "طلبات التقديم", width: 1280 },
    { label: "الاستفسارات", heading: "الاستفسارات العامة", width: 1440 },
  ];

  for (const entry of entries) {
    await page.setViewportSize({ width: entry.width, height: 900 });
    if (entry.width < 1024) await page.getByRole("button", { name: "فتح قائمة التنقل" }).click();
    await page.getByRole("link", { name: entry.label, exact: true }).click();
    await expect(page.getByRole("heading", { name: entry.heading, level: 2 })).toBeVisible();
    await expect(page.getByText(/لا يتم الاتصال بالخادم في وضع المعاينة/)).toBeVisible();
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBeTruthy();
  }
});

for (const resource of Object.keys(resourceLabels) as Resource[]) {
  test(`${resource}: list, validation, create, edit, lifecycle, and pagination`, async ({ page }) => {
    const suffix = `${resource}-ui`;
    await resetAndScale(page);
    await page.getByRole("link", { name: resourceLabels[resource], exact: true }).click();
    await expect(page.getByRole("heading", { name: resourceLabels[resource], level: 2 })).toBeVisible();
    if (resource === "countries") {
      await expect(page.getByRole("navigation", { name: "صفحات الدول" })).toBeVisible();
      const search = page.getByRole("searchbox", { name: "ابحث عن دولة" });
      await search.fill("لا توجد نتيجة مطابقة");
      await search.press("Enter");
      await expect(page).toHaveURL(/search=/);
      await expect(page.getByRole("heading", { name: "لا توجد دول مطابقة" })).toBeVisible();
      await page.getByRole("button", { name: "إعادة ضبط الفلاتر" }).click();
      await expect(page).not.toHaveURL(/search=/);

      await page.getByLabel("حالة النشر").selectOption("DRAFT");
      await expect(page).toHaveURL(/status=DRAFT/);
      await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
      await expect(page).not.toHaveURL(/status=/);
      await page.getByRole("button", { name: "التالي" }).click();
      await expect(page).toHaveURL(/page=2/);
    } else if (resource === "scholarships") {
      await expect(page.getByRole("navigation", { name: "صفحات المنح الدراسية" })).toBeVisible();
      const search = page.getByRole("searchbox", { name: "ابحث عن منحة" });
      await search.fill("لا توجد نتيجة مطابقة");
      await search.press("Enter");
      await expect(page).toHaveURL(/search=/);
      await expect(page.getByRole("heading", { name: "لا توجد منح مطابقة" })).toBeVisible();
      await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
      await expect(page).not.toHaveURL(/search=/);

      await selectSearchableOption(page, "حالة النشر", "مسودة");
      await expect(page).toHaveURL(/status=DRAFT/);
      await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
      await expect(page).not.toHaveURL(/status=/);

      await selectSearchableOption(page, "ترتيب حسب", "الأقرب لانتهاء التقديم");
      await expect(page).toHaveURL(/sort=deadline/);
      await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
      await expect(page).not.toHaveURL(/sort=/);
      await page.getByRole("button", { name: "التالي" }).click();
      await expect(page).toHaveURL(/page=2/);
    } else if (resource === "universities") {
      await expect(page.getByRole("navigation", { name: "صفحات الجامعات" })).toBeVisible();
      const search = page.getByRole("searchbox", { name: "ابحث عن جامعة" });
      await search.fill("لا توجد نتيجة مطابقة");
      await page.waitForTimeout(1100);
      await expect(page).toHaveURL(/search=/);
      await expect(page.getByRole("heading", { name: "لا توجد جامعات مطابقة" })).toBeVisible();
      await page.getByRole("button", { name: "إعادة ضبط الفلاتر" }).click();
      await expect(page).not.toHaveURL(/search=/);

      await selectSearchableOption(page, "حالة النشر", "مسودة");
      await expect(page).toHaveURL(/status=DRAFT/);
      await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
      await selectSearchableOption(page, "ترتيب حسب", "الاسم أبجدياً");
      await expect(page).toHaveURL(/sort=name/);
      await page.getByRole("button", { name: "فلاتر إضافية" }).click();
      await expect(page.getByRole("combobox", { name: "نوع الجامعة" })).toBeVisible();
      await expect(page.getByRole("combobox", { name: "المدينة" })).toBeVisible();
      await expect(page.getByRole("combobox", { name: "التخصص" })).toBeVisible();
      await page.getByRole("button", { name: "التالي" }).click();
      await expect(page).toHaveURL(/page=2/);
    } else if (resource === "articles") {
      await expect(page.getByRole("navigation", { name: "صفحات المقالات" })).toBeVisible();
      const search = page.getByRole("searchbox", { name: "بحث في المقالات" });
      await search.fill("لا توجد نتيجة مطابقة");
      await search.press("Enter");
      await expect(page).toHaveURL(/search=/);
      await expect(page.getByRole("heading", { name: "لا توجد مقالات مطابقة" })).toBeVisible();
      await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
      await expect(page).not.toHaveURL(/search=/);

      await selectSearchableOption(page, "حالة النشر", "مسودة");
      await expect(page).toHaveURL(/status=DRAFT/);
      await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
      await page.getByRole("button", { name: "فلاتر إضافية" }).click();
      await expect(page.getByRole("combobox", { name: "الدولة المرتبطة" })).toBeVisible();
      await page.getByRole("button", { name: "التالي" }).click();
      await expect(page.getByText("صفحة 2 من")).toBeVisible();
    } else {
      await expect(page.getByText("صفحة 1 من")).toBeVisible();
      if (resource !== "services") {
        const search = page.getByRole("searchbox", { name: `بحث في ${resourceLabels[resource]}` });
      await search.fill("لا توجد نتيجة مطابقة");
        await search.press("Enter");
      await expect(page).toHaveURL(/search=/);
      await expect(page.getByRole("heading", { name: "لا توجد بيانات لعرضها" })).toBeVisible();
        await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
      await expect(page).not.toHaveURL(/search=/);
      }

      if (resource !== "services") {
        await selectSearchableOption(page, "الحالة التحريرية", "مسودة");
        await expect(page).toHaveURL(/status=DRAFT/);
        await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
        await expect(page).not.toHaveURL(/status=/);
      }
      await page.getByRole("button", { name: "التالي" }).click();
      await expect(page.getByText("صفحة 2 من")).toBeVisible();
    }
    await page.getByRole("link", { name: new RegExp(`إضافة`) }).click();
    await expect(submitButton(page)).toHaveAccessibleName(createSubmitLabels[resource]);
    await submitButton(page).click();
    await expect(page.getByText(resource === "articles" ? "تحقق من محتوى الكتلة رقم 1." : "هذا الحقل مطلوب.").first()).toBeVisible();

    await fillRequired(page, resource, suffix);
    if (resource === "articles") await exerciseArticleBlocks(page);
    await expect(submitButton(page)).toBeEnabled();
    await submitButton(page).click();
    await expect(page).toHaveURL(new RegExp(`/admin/${resource}$`));
    const createdTitle = `${resource === "countries" ? "دولة" : resource === "universities" ? "جامعة" : resource === "scholarships" ? "منحة" : resource === "services" ? "خدمة" : "مقال"} متصفح ${suffix}`;
    await openCreatedEditor(page, resource, createdTitle);
    await expect(page.getByRole("heading", { name: /تعديل/, level: 2 })).toBeVisible();
    await page.waitForTimeout(500);
    if (resource !== "universities" && resource !== "articles") {
      await expect(page.locator(`#${resource}-slug`)).toHaveValue(`browser-${resource}-${suffix}`);
    } else if (resource === "articles") {
      await expect(page.locator("#articles-slug")).toHaveCount(0);
    } else {
      await expect(page.locator("#universities-summaryAr")).toHaveValue("وصف مختصر اختباري للجامعة.");
    }

    const title = resource === "countries" || resource === "universities" ? `#${resource}-nameAr` : `#${resource}-titleAr`;
    const updatedTitle = `${resource === "countries" ? "دولة" : resource === "universities" ? "جامعة" : resource === "scholarships" ? "منحة" : resource === "services" ? "خدمة" : "مقال"} مُحدّث ${suffix}`;
    await page.locator(title).fill(updatedTitle);
    await submitButton(page).evaluate((button) => (button as HTMLButtonElement).click());
    await expect(page).toHaveURL(new RegExp(`/admin/${resource}$`));
    await openCreatedEditor(page, resource, updatedTitle);
    await expect(page.locator(title)).toHaveValue(/مُحدّث/);
    await setEditorialStatus(page, resource, updatedTitle, "PUBLISHED");
    await openCreatedEditor(page, resource, updatedTitle);
    await setEditorialStatus(page, resource, updatedTitle, "DRAFT");
    await openCreatedEditor(page, resource, updatedTitle);
    await setEditorialStatus(page, resource, updatedTitle, "ARCHIVED");
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
  await page.getByRole("link", { name: "المقالات", exact: true }).click();
  await page.getByRole("link", { name: "إضافة مقال" }).click();
  await page.getByRole("combobox", { name: "الدولة المرتبطة" }).click();
  const countrySearch = page.getByRole("searchbox", { name: "بحث داخل الدولة المرتبطة" });
  await countrySearch.fill("60");
  await page
    .getByRole("listbox", { name: "الدولة المرتبطة" })
    .getByRole("button", { name: "دولة اختبار العلاقات 60" })
    .click();
  await page.getByRole("combobox", { name: "الجامعة المرتبطة" }).click();
  const universitySearch = page.getByRole("searchbox", { name: "بحث داخل الجامعة المرتبطة" });
  await universitySearch.fill("60");
  await page
    .getByRole("listbox", { name: "الجامعة المرتبطة" })
    .getByRole("button", { name: "جامعة اختبار العلاقات 60" })
    .click();
  await page.getByRole("combobox", { name: "الجامعة المرتبطة" }).click();
  await universitySearch.fill("لا يوجد هذا الخيار");
  await expect(page.getByRole("combobox", { name: "الجامعة المرتبطة" })).toHaveText("جامعة اختبار العلاقات 60");
  await page.getByRole("button", { name: "مسح اختيار الجامعة المرتبطة" }).click();
  await page.getByRole("combobox", { name: "الجامعة المرتبطة" }).click();
  await universitySearch.fill("لا يوجد هذا الخيار");
  await expect(page.getByText("لا توجد خيارات مطابقة.")).toBeVisible();
  await universitySearch.fill("60");
  await page
    .getByRole("listbox", { name: "الجامعة المرتبطة" })
    .getByRole("button", { name: "جامعة اختبار العلاقات 60" })
    .click();
  await fillRequired(page, "articles", "relationship-60");
  await submitButton(page).click();
  await expect(page.getByRole("combobox", { name: "الدولة المرتبطة" })).toHaveText("دولة اختبار العلاقات 60");
  await expect(page.getByRole("combobox", { name: "الجامعة المرتبطة" })).toHaveText("جامعة اختبار العلاقات 60");
});

test("approved UI refinements keep form actions, directions, previews, and mock tools usable", async ({ page }) => {
  await resetAndScale(page);
  await expect(page.getByRole("link", { name: "إضافة دولة" })).toHaveAttribute("href", "/admin/countries/new");
  await expect(page.locator("aside[aria-label='التنقل الإداري'] svg").first()).toBeVisible();

  await page.getByRole("link", { name: "إضافة دولة" }).click();
  await expect(page.locator("#countries-nameAr")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#countries-nameEn")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#countries-slug")).toHaveAttribute("dir", "ltr");
  await page.setViewportSize({ width: 390, height: 844 });
  const stickyActions = page.getByLabel("إجراءات نموذج الدولة");
  await expect(stickyActions.getByRole("button", { name: "حفظ وإنهاء" })).toBeVisible();
  await stickyActions.getByRole("button", { name: "حفظ وإنهاء" }).click();
  await expect(page.getByText("هذا الحقل مطلوب.").first()).toBeVisible();
  await expect(stickyActions.getByRole("link", { name: "إلغاء" })).toBeVisible();

  await page.goto("/admin/articles/new");
  await expect(page.getByRole("heading", { name: "المعلومات الأساسية" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "محتوى المقال" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "صورة المقال" })).toBeVisible();
  await expect(page.locator("#articles-titleEn")).toHaveCount(0);
  await expect(page.locator("#articles-coverImageUrl")).toHaveCount(0);
  await expect(page.getByLabel("رفع صورة المقال")).toBeDisabled();
  await expect(page.getByText("الرفع معطّل في وضع معاينة التطوير المحلية.")).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("button", { name: "SUPER_ADMIN" })).toBeHidden();
  await page.locator("summary").filter({ hasText: "أدوات المعاينة" }).click();
  await expect(page.getByRole("button", { name: "SUPER_ADMIN" })).toBeVisible();
  await page.getByRole("button", { name: "SUPER_ADMIN" }).click();
  await expect(page.getByRole("link", { name: /إدارة المشرفين/ })).toBeVisible();
});

test("mock error scenarios show recoverable Arabic feedback", async ({ page }) => {
  await resetAndScale(page);
  await setMockScenario(page, "empty");
  await page.getByRole("link", { name: "الخدمات", exact: true }).click();
  await expect(page.getByRole("heading", { name: "لا توجد بيانات لعرضها" })).toBeVisible();

  await resetAndScale(page);
  await setMockScenario(page, "loading");
  await page.getByRole("link", { name: "الدول", exact: true }).click();
  await expect(page.getByLabel("جارٍ تحميل الدول")).toBeVisible();

  await resetAndScale(page);
  await setMockScenario(page, "failure");
  await page.getByRole("link", { name: "الدول", exact: true }).click();
  await expect(page.getByRole("heading", { name: "تعذّر إتمام الطلب" })).toBeVisible();

  await resetAndScale(page);
  await setMockScenario(page, "network");
  await page.getByRole("link", { name: "الخدمات", exact: true }).click();
  await expect(page.getByRole("heading", { name: "تعذّر إتمام الطلب" })).toBeVisible();

  await resetAndScale(page);
  await page.getByRole("link", { name: "الدول", exact: true }).click();
  await page.getByRole("link", { name: "إضافة دولة" }).click();
  await fillRequired(page, "countries", "duplicate");
  await page.locator("#country-sec-advanced summary").click();
  await page.locator("#countries-slug").fill("jordan");
  await submitButton(page).click();
  await expect(page.getByText("هذا المعرّف النصي مستخدم بالفعل.")).toBeVisible();
  await expect(page.locator("#countries-nameAr")).toHaveValue(/دولة متصفح/);
  await setMockScenario(page, "validation");
  await submitButton(page).click();
  await expect(page.getByText("قيمة الاختبار غير صالحة.")).toBeVisible();
  await setMockScenario(page, "forbidden");
  await page.getByRole("link", { name: "العودة إلى الدول" }).click();
  await expect(page.getByRole("heading", { name: "تعذّر إتمام الطلب" })).toBeVisible();
});

test("every content module renders the shared recoverable failure state", async ({ page }) => {
  for (const resource of Object.keys(resourceLabels) as Resource[]) {
    await resetAndScale(page);
    await setMockScenario(page, "failure");
    await page.getByRole("link", { name: resourceLabels[resource], exact: true }).click();
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
    await page.getByRole("link", { name: resourceLabels[entry.resource], exact: true }).click();
    await expect(page.getByRole("heading", { name: resourceLabels[entry.resource], level: 2 })).toBeVisible();
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBeTruthy();
  }
});
