import assert from "node:assert/strict";
import test from "node:test";

import { createMockContentRepository } from "../api/mock-content-repository";
import { isAdminDevMockAccessEnabled } from "../lib/admin-dev-mock-gate";

test("mock access is enabled only by the explicit non-production server environment", () => {
  assert.equal(isAdminDevMockAccessEnabled({ NODE_ENV: "development", ADMIN_DEV_MOCK_ACCESS: "enabled" }), true);
  assert.equal(isAdminDevMockAccessEnabled({ NODE_ENV: "development" }), false);
  assert.equal(isAdminDevMockAccessEnabled({ NODE_ENV: "production", ADMIN_DEV_MOCK_ACCESS: "enabled" }), false);
});

test("mock repository creates, updates, publishes, and exposes the changed record", async () => {
  const repository = createMockContentRepository();
  const countries = repository.getApi("countries");
  const created = await countries.create({
    nameAr: "ماليزيا",
    nameEn: "Malaysia",
    introductionAr: "وجهة تجريبية.",
    detailsAr: "تفاصيل تجريبية.",
    slug: "malaysia",
    displayOrder: 3,
    status: "DRAFT",
  });
  assert.equal((await countries.list({ limit: 50 })).items.some((country) => country.id === created.id), true);

  const updated = await countries.update(created.id, { nameAr: "ماليزيا المحدّثة", status: "PUBLISHED" });
  assert.equal(updated.nameAr, "ماليزيا المحدّثة");
  assert.equal(updated.status, "PUBLISHED");
  assert.ok(updated.publishedAt);
});

test("mock repository provides representative records for every approved resource", async () => {
  const repository = createMockContentRepository();
  const countries = await repository.getApi("countries").list({ limit: 50 });
  const universities = await repository.getApi("universities").list({ limit: 50 });
  const scholarships = await repository.getApi("scholarships").list({ limit: 50 });
  const services = await repository.getApi("services").list({ limit: 50 });
  const articles = await repository.getApi("articles").list({ limit: 50 });
  assert.ok(countries.items.some((item) => item.status === "PUBLISHED") && countries.items.some((item) => item.status === "DRAFT"));
  assert.ok(universities.items.some((item) => item.countryId));
  assert.equal(scholarships.items[0]?.applicationStatus, "OPEN");
  assert.ok(services.items.some((item) => item.status === "ARCHIVED"));
  assert.ok(articles.items[0]?.bodyAr.length);
});

test("mock repository returns documented-style conflict and forbidden errors", async () => {
  const repository = createMockContentRepository();
  const countries = repository.getApi("countries");
  await assert.rejects(
    () => countries.create({ nameAr: "الأردن", introductionAr: "مقدمة", detailsAr: "تفاصيل", slug: "jordan" }),
    (error: unknown) => Boolean((error as { response?: { status?: number; data?: { error?: { details?: { fields?: Record<string, string[]> } } } } }).response?.status === 409
      && (error as { response?: { data?: { error?: { details?: { fields?: Record<string, string[]> } } } } }).response?.data?.error?.details?.fields?.slug),
  );
  repository.setScenario("forbidden");
  await assert.rejects(() => countries.list({ limit: 50 }), (error: unknown) => (error as { response?: { status?: number } }).response?.status === 403);
});
