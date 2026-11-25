import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  analyticsParamsFromDraft,
  analyticsPresetDraft,
  emptyAnalyticsFilterDraft,
} from "@/lib/analytics-filters";

test("Analytics presets use inclusive UTC calendar ranges", () => {
  const now = new Date("2026-11-25T22:30:00.000Z");
  assert.deepEqual(analyticsPresetDraft("last-7", now), {
    from: "2026-11-19",
    to: "2026-11-25",
    granularity: "day",
    preset: "last-7",
  });
  assert.deepEqual(analyticsPresetDraft("last-30", now).from, "2026-10-27");
  assert.deepEqual(analyticsPresetDraft("last-90", now).from, "2026-08-28");
});

test("Analytics filters keep the documented top limit internal and reject invalid custom ranges", () => {
  assert.deepEqual(analyticsParamsFromDraft({
    from: "2026-11-01",
    to: "2026-11-25",
    granularity: "week",
    preset: "custom",
  }), { from: "2026-11-01", to: "2026-11-25", granularity: "week", topLimit: 10 });
  assert.deepEqual(analyticsParamsFromDraft(emptyAnalyticsFilterDraft()), { granularity: "day", topLimit: 10 });
  assert.throws(() => analyticsParamsFromDraft({ from: "2026-11-25", to: "2026-11-01", granularity: "day", preset: "custom" }));
});

test("Analytics UI keeps journeys lazy, server-paginated, and hides the technical topLimit control", () => {
  const source = readFileSync(join(process.cwd(), "components/phase4/analytics-page.tsx"), "utf8");
  assert.doesNotMatch(source, /name="topLimit"|حد المقارنات/);
  assert.match(source, /useAnalyticsJourneys\(\{ \.\.\.params, page, limit: 10 \}\)/);
  assert.match(source, /tab === "summary" \? \(\s*<SummaryView/);
  assert.match(source, /JourneysView key=\{JSON\.stringify\(params\)\}/);
});
