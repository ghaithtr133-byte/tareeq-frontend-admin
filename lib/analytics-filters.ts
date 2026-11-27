import { analyticsParamsSchema, granularities, type AnalyticsParams } from "@/lib/phase4-schemas";

export const analyticsRangePresets = [
  { id: "last-7", label: "آخر 7 أيام", days: 7 },
  { id: "last-30", label: "آخر 30 يومًا", days: 30 },
  { id: "last-90", label: "آخر 90 يومًا", days: 90 },
] as const;

export type AnalyticsRangePreset = (typeof analyticsRangePresets)[number]["id"] | "custom" | null;
export type AnalyticsFilterDraft = {
  from: string;
  to: string;
  granularity: (typeof granularities)[number];
  preset: AnalyticsRangePreset;
};

export function emptyAnalyticsFilterDraft(): AnalyticsFilterDraft {
  return { from: "", to: "", granularity: "day", preset: null };
}

/** Mirrors the server-default range into an untouched form only; it never applies a request. */
export function draftWithResolvedAnalyticsRange(
  draft: AnalyticsFilterDraft,
  range: Pick<AnalyticsFilterDraft, "from" | "to" | "granularity">,
): AnalyticsFilterDraft {
  return draft.from || draft.to || draft.preset !== null
    ? draft
    : { from: range.from, to: range.to, granularity: range.granularity, preset: "custom" };
}

function utcDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Inclusive UTC range: "last 7 days" includes today and the prior six UTC days. */
export function analyticsPresetDraft(
  preset: Exclude<AnalyticsRangePreset, "custom" | null>,
  now = new Date(),
): AnalyticsFilterDraft {
  const selected = analyticsRangePresets.find((item) => item.id === preset);
  if (!selected) return emptyAnalyticsFilterDraft();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - selected.days + 1);
  return { from: utcDay(start), to: utcDay(end), granularity: "day", preset };
}

/** The documented API accepts a bounded `topLimit`; the Admin uses its safe default without exposing it as UI. */
export function analyticsParamsFromDraft(draft: AnalyticsFilterDraft): AnalyticsParams {
  return analyticsParamsSchema.parse({
    ...(draft.from ? { from: draft.from } : {}),
    ...(draft.to ? { to: draft.to } : {}),
    granularity: draft.granularity,
    topLimit: 10,
  });
}
