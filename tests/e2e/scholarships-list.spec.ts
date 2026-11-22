import { expect, test, type Page } from "@playwright/test";

async function openMockTools(page: Page) {
  const tools = page.locator("summary").filter({ hasText: "أدوات المعاينة" });
  const details = tools.locator("xpath=parent::details");
  if (!(await details.evaluate((element) => (element as HTMLDetailsElement).open))) {
    await tools.click();
  }
}

async function resetAndScale(page: Page) {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /^مرحبًا،/ })).toBeVisible();
  await openMockTools(page);
  await page.getByRole("button", { name: "علاقات 60+" }).click();
}

async function selectOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("listbox", { name: label }).getByRole("button", { name: option }).click();
}

test("Scholarships List applies redesigned filters, catalogs, states, and mobile layout", async ({ page }) => {
  await resetAndScale(page);
  await page.getByRole("link", { name: "المنح الدراسية", exact: true }).click();
  await expect(page.getByRole("heading", { name: "المنح الدراسية", level: 2 })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "ابحث عن منحة" });
  await search.fill("لا توجد نتيجة مطابقة");
  await search.press("Enter");
  await expect(page).toHaveURL(/search=/);
  await expect(page.getByRole("heading", { name: "لا توجد منح مطابقة" })).toBeVisible();
  await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();

  await page.getByRole("switch", { name: "عرض المميزة فقط" }).click();
  await expect(page).toHaveURL(/featured=true/);
  await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();

  await selectOption(page, "حالة التقديم", "التقديم مفتوح");
  await expect(page).toHaveURL(/applicationStatus=OPEN/);
  await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();

  await page.getByRole("button", { name: "فلاتر إضافية" }).click();
  await selectOption(page, "المستوى الدراسي", "بكالوريوس");
  await expect(page).toHaveURL(/studyLevel=/);
  await selectOption(page, "نوع التمويل", "تمويل كامل");
  await expect(page).toHaveURL(/fundingType=/);
  await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBeTruthy();

  await page.setViewportSize({ width: 1280, height: 900 });
  await resetAndScale(page);
  await openMockTools(page);
  await page.getByLabel("سيناريو").selectOption("loading");
  await page.getByRole("link", { name: "المنح الدراسية", exact: true }).click();
  await expect(page.getByLabel("جارٍ تحميل المنح الدراسية")).toBeVisible();

  await resetAndScale(page);
  await openMockTools(page);
  await page.getByLabel("سيناريو").selectOption("empty");
  await page.getByRole("link", { name: "المنح الدراسية", exact: true }).click();
  await expect(page.getByRole("heading", { name: "لا توجد منح دراسية مضافة بعد" })).toBeVisible();

  await resetAndScale(page);
  await openMockTools(page);
  await page.getByLabel("سيناريو").selectOption("failure");
  await page.getByRole("link", { name: "المنح الدراسية", exact: true }).click();
  await expect(page.getByRole("heading", { name: "تعذّر إتمام الطلب" })).toBeVisible();
});
