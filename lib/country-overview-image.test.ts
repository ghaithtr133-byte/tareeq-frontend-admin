import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError } from "axios";

import { contentApi, type Country } from "@/lib/api-client/content";
import { apiClient } from "@/lib/api-client/client";
import { initialContentValues, toContentPatch } from "@/lib/content-form";
import { uploadImage } from "@/lib/api-client/images";

const countryId = "00000000-0000-4000-8000-000000000001";
const uploadedOverviewUrl = "https://example.invalid/uploads/country-overview-new.png";

function country(): Country {
  return {
    id: countryId,
    slug: "jordan",
    featured: true,
    publishedAt: "2026-01-01T00:00:00.000Z",
    seoTitleAr: "الدراسة في الأردن",
    seoDescriptionAr: "وصف محفوظ",
    nameAr: "الأردن",
    nameEn: "Jordan",
    introductionAr: "مقدمة",
    introductionEn: "Introduction",
    detailsAr: "تفاصيل",
    detailsEn: "Details",
    imageUrl: "https://example.invalid/country-main.png",
    imageAltAr: "الصورة الرئيسية",
    imageAltEn: "Main image",
    overviewImageUrl: "https://example.invalid/country-overview-old.png",
    overviewImageAltAr: "صورة نظرة عامة قديمة",
    displayOrder: 1,
    status: "PUBLISHED",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function pngFile(name = "overview.png") {
  return new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], name, {
    type: "image/png",
  });
}

test("TA-111: first successful Country Overview upload persists only overviewImageUrl and Admin GET returns it", async () => {
  const originalAdapter = apiClient.defaults.adapter;
  let stored = country();
  const calls: Array<{ method?: string; url?: string; data?: unknown }> = [];
  apiClient.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, data: config.data });
    if (config.url === "/admin/uploads/images") {
      assert.equal(config.method, "post");
      assert.equal(config.withCredentials, true);
      assert.ok(config.data instanceof FormData);
      assert.equal(config.data.get("resource"), "countries");
      return {
        config,
        headers: {},
        status: 200,
        statusText: "OK",
        data: {
          success: true,
          data: { assetId: "asset", publicId: "countries/overview", secureUrl: uploadedOverviewUrl, format: "png", bytes: 12, width: 1, height: 1 },
        },
      };
    }
    if (config.url === `/admin/countries/${countryId}` && config.method === "patch") {
      assert.deepEqual(JSON.parse(String(config.data)), { overviewImageUrl: uploadedOverviewUrl });
      stored = { ...stored, overviewImageUrl: uploadedOverviewUrl, updatedAt: "2026-01-02T00:00:00.000Z" };
      return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data: stored } };
    }
    if (config.url === `/admin/countries/${countryId}` && config.method === "get") {
      return { config, headers: {}, status: 200, statusText: "OK", data: { success: true, data: stored } };
    }
    throw new Error(`Unexpected request: ${config.method} ${config.url}`);
  };

  try {
    const uploaded = await uploadImage("countries", pngFile());
    const before = country();
    const patch = toContentPatch(
      "countries",
      { ...initialContentValues("countries", before), overviewImageUrl: uploaded.secureUrl },
      before,
      { statusChanged: false },
    );
    assert.deepEqual(patch, { overviewImageUrl: uploadedOverviewUrl });

    await contentApi.countries.update(countryId, patch);
    const refreshed = await contentApi.countries.get(countryId);
    assert.equal(refreshed.overviewImageUrl, uploadedOverviewUrl);
    assert.equal(refreshed.imageUrl, before.imageUrl);
    assert.equal(refreshed.status, "PUBLISHED");
    assert.equal(refreshed.publishedAt, before.publishedAt);
    assert.deepEqual(calls.map((call) => `${call.method} ${call.url}`), [
      "post /admin/uploads/images",
      `patch /admin/countries/${countryId}`,
      `get /admin/countries/${countryId}`,
    ]);
  } finally {
    apiClient.defaults.adapter = originalAdapter;
  }
});

test("TA-111: failed Overview upload retains the stored image and sends no Country PATCH", async () => {
  const originalAdapter = apiClient.defaults.adapter;
  const before = country();
  const values = initialContentValues("countries", before);
  let calls = 0;
  const failure = new AxiosError("Upload unavailable", "ERR_NETWORK", undefined, {});
  apiClient.defaults.adapter = async () => {
    calls += 1;
    throw failure;
  };

  try {
    await assert.rejects(uploadImage("countries", pngFile("retry.png")), (error) => error === failure);
    assert.equal(values.overviewImageUrl, before.overviewImageUrl);
    assert.throws(
      () => toContentPatch("countries", values, before, { statusChanged: false }),
      /لا توجد تغييرات للحفظ/,
    );
    assert.equal(calls, 1);
  } finally {
    apiClient.defaults.adapter = originalAdapter;
  }
});
