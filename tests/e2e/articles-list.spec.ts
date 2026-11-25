import { expect, test, type Page } from "@playwright/test";

async function openMockTools(page: Page) {
  const tools = page.locator("summary").filter({ hasText: "أدوات المعاينة" });
  await tools.click();
}

async function loadArticleFixtures(page: Page) {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /^مرحبًا،/ })).toBeVisible();
  await openMockTools(page);
  await page.getByRole("button", { name: "علاقات 60+" }).click();
}

test("articles list applies documented filters and server pagination", async ({ page }) => {
  await loadArticleFixtures(page);
  await page.getByRole("link", { name: "المقالات", exact: true }).click();
  await expect(page.getByRole("heading", { name: "المقالات", level: 2 })).toBeVisible();
  await expect(page.getByPlaceholder("ابحث عن مقال...")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "صفحات المقالات" })).toBeVisible();

  await page.getByRole("searchbox", { name: "بحث في المقالات" }).fill("اختبار الترقيم 1");
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/search=/);
  await expect(page.getByRole("button", { name: "إعادة ضبط", exact: true })).toBeVisible();

  await page.getByRole("switch", { name: "عرض المميزة فقط" }).click();
  await expect(page).toHaveURL(/featured=true/);
  await page.getByRole("button", { name: "إعادة ضبط", exact: true }).click();
  await page.getByRole("button", { name: "فلاتر إضافية" }).click();
  await expect(page.getByRole("combobox", { name: "الدولة المرتبطة" })).toBeVisible();
  await expect(page.getByText(/لا يدعم عقد قائمة المقالات الحالي/)).toBeVisible();
  await page.getByRole("button", { name: "التالي" }).click();
  await expect(page).toHaveURL(/page=2/);
});

test("articles list loads mobile cards in server pages of five without duplicates", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadArticleFixtures(page);
  await page.getByRole("link", { name: "المقالات", exact: true }).click();
  const cards = page.getByRole("list", { name: "بطاقات المقالات" }).getByRole("listitem");
  await expect(cards).toHaveCount(5);

  await page.getByRole("button", { name: "تحميل المزيد" }).click();
  await expect(cards).toHaveCount(10);
  await page.getByRole("button", { name: "تحميل المزيد" }).click();
  await expect(cards).toHaveCount(15);
  await expect(cards.evaluateAll((elements) => new Set(elements.map((element) => element.textContent)).size === elements.length)).resolves.toBeTruthy();

  await page.getByRole("switch", { name: "عرض المميزة فقط" }).click();
  await expect(cards).toHaveCount(5);
  await page.getByRole("button", { name: "تحميل المزيد" }).click();
  await expect(cards).toHaveCount(8);
  await expect(page.getByText("تم عرض كل المقالات.")).toBeVisible();
});
