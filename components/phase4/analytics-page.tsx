"use client";

import { useState } from "react";
import { useAnalyticsJourneys, useAnalyticsSummary } from "@/hook/queries/use-phase4-queries";
import { granularities, type AnalyticsParams } from "@/lib/phase4-schemas";
import {
  analyticsParamsFromDraft,
  analyticsPresetDraft,
  analyticsRangePresets,
  emptyAnalyticsFilterDraft,
  type AnalyticsFilterDraft,
} from "@/lib/analytics-filters";
import {
  formatCount,
  formatRate,
  safeAnalyticsPath,
  trendLabels,
  trendPoints,
  utcDate,
  type TrendMetric,
} from "@/lib/phase4-presentation";
import { ctaIdLabels, eventTypeLabels, granularityLabels } from "@/lib/content-labels";
import {
  CalendarIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
} from "@/components/ui/admin-icons";
import {
  buttonClass,
  inputClass,
  PageControls,
  panelClass,
  primaryButtonClass,
} from "@/components/universities/controls";
import { EmptyState, LoadingState } from "@/components/dashboard/states";
import { Phase4Error } from "./query-state";

function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent" | "subtle";
}) {
  const toneClass =
    tone === "accent"
      ? "border-[var(--gold)]/45 bg-[var(--gold-soft)]/25"
      : tone === "subtle"
        ? "border-[var(--line)] bg-[var(--surface-subtle)]"
        : "border-[var(--line)] bg-white";

  return (
    <div className={`min-w-0 rounded-xl border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-[var(--navy)] tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

function BreakdownTable({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <section className={panelClass}>
      <div className="border-b border-[var(--line)] pb-3">
        <h3 className="text-base font-bold text-[var(--navy)]">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-right text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs font-semibold text-[var(--muted)]">
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2.5">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-[var(--surface-subtle)]/70">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="max-w-xs whitespace-pre-wrap break-words px-3 py-2.5 text-[var(--navy)] tabular-nums"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-[var(--muted)]">لا توجد بيانات لهذه الفترة.</p>
      )}
    </section>
  );
}

function SummaryView({ params }: { params: AnalyticsParams }) {
  const query = useAnalyticsSummary(params);
  const [metric, setMetric] = useState<TrendMetric>("pageViews");

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <Phase4Error error={query.error} retry={query.refetch} />;
  if (!query.data) return <EmptyState />;

  const data = query.data;
  const points = trendPoints(data.trends, metric);
  const maxTrendValue = points.length ? Math.max(...points.map((point) => point.value)) : 0;
  const maxFunnelSessions = data.funnel.length
    ? Math.max(1, ...data.funnel.map((step) => step.sessions))
    : 1;

  return (
    <div className="space-y-5">
      {/* Range context strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1.5 tabular-nums" dir="ltr">
          <CalendarIcon className="size-3.5 shrink-0 text-[var(--gold-dark)]" />
          <span>
            {data.range.from} — {data.range.to} (UTC)
          </span>
        </span>
        <span>
          التجميع:{" "}
          <strong className="text-[var(--navy)]">
            {granularityLabels[data.range.granularity]}
          </strong>
        </span>
      </div>

      {/* Primary Traffic KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="مشاهدات الصفحات" value={formatCount(data.totals.pageViews)} />
        <KpiCard label="الزوار الفريدون" value={formatCount(data.totals.visitors)} />
        <KpiCard label="إجمالي الجلسات" value={formatCount(data.totals.sessions)} />
      </div>

      {/* Client-Reported vs Server-Verified Conversions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={panelClass}>
          <div className="border-b border-[var(--line)] pb-3">
            <h3 className="text-sm font-bold text-[var(--navy)]">
              تحويلات مُبلّغ عنها من المتصفح
            </h3>
            <p className="mt-0.5 text-xs text-amber-800">
              إشارات تتبع في المتصفح فقط — وليست إثبات إرسال مؤكد من الخادم.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard
              label="طلبات (متصفح)"
              value={formatCount(data.clientReportedConversions.applications)}
              tone="subtle"
            />
            <KpiCard
              label="استفسارات (متصفح)"
              value={formatCount(data.clientReportedConversions.inquiries)}
              tone="subtle"
            />
            <KpiCard
              label="الإجمالي"
              value={formatCount(data.clientReportedConversions.total)}
              tone="subtle"
            />
          </div>
        </section>

        <section className={panelClass}>
          <div className="border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="size-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-[var(--navy)]">إرسالات مؤكدة من الخادم</h3>
            </div>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              السجلات المحفوظة فعليًا في قاعدة البيانات للطلبات والاستفسارات.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard
              label="طلبات مؤكدة"
              value={formatCount(data.serverVerifiedConversions.applications)}
              tone="accent"
            />
            <KpiCard
              label="استفسارات مؤكدة"
              value={formatCount(data.serverVerifiedConversions.inquiries)}
              tone="accent"
            />
            <KpiCard
              label="الإجمالي المؤكد"
              value={formatCount(data.serverVerifiedConversions.total)}
              tone="accent"
            />
          </div>
        </section>
      </div>

      {/* Conversion Rates */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="معدل الجلسات بتحويل (متصفح)"
          value={formatRate(data.conversionRates.clientReportedSessionRate)}
        />
        <KpiCard
          label="معدل جلسات الطلبات"
          value={formatRate(data.conversionRates.applicationSessionRate)}
        />
        <KpiCard
          label="معدل جلسات الاستفسارات"
          value={formatRate(data.conversionRates.inquirySessionRate)}
        />
      </div>

      {/* Trend Chart */}
      <section className={panelClass}>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div>
            <h3 className="text-base font-bold text-[var(--navy)]">السلسلة الزمنية للفترة</h3>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              جميع التواريخ محسوبة بتوقيت UTC القياسي.
            </p>
          </div>

          <label className="grid w-full max-w-xs gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>مقياس الرسم</span>
            <div className="relative">
              <select
                aria-label="مقياس الرسم"
                className={`${inputClass} appearance-none pl-9`}
                value={metric}
                onChange={(event) => setMetric(event.target.value as TrendMetric)}
              >
                {Object.entries(trendLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </label>
        </div>

        {points.length ? (
          <div className="space-y-3">
            <svg
              role="img"
              aria-label={`اتجاه ${trendLabels[metric]}`}
              viewBox="0 0 600 180"
              className="w-full"
              style={{ direction: "ltr" }}
            >
              {[30, 70, 110, 150].map((y) => (
                <line
                  key={y}
                  x1="30"
                  x2="570"
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={y === 150 ? undefined : "4 4"}
                />
              ))}
              <line x1="30" y1="15" x2="30" y2="150" stroke="#cbd5e1" />
              <polyline
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                stroke="var(--navy)"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((point) => (
                <circle key={point.period} cx={point.x} cy={point.y} r="4.5" fill="var(--gold)">
                  <title>
                    {utcDate(point.period)}: {formatCount(point.value)}
                  </title>
                </circle>
              ))}
            </svg>

            <div className="flex flex-wrap justify-between gap-2 text-xs text-[var(--muted)] tabular-nums">
              <span>البداية: {utcDate(points[0].period)} UTC</span>
              <span>
                الحد الأعلى:{" "}
                <strong className="text-[var(--navy)]">{formatCount(maxTrendValue)}</strong>
              </span>
              <span>النهاية: {utcDate(points.at(-1)!.period)} UTC</span>
            </div>

            <details className="rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">
                عرض جدول بيانات السلسلة الزمنية ({points.length} فترة)
              </summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                      <th className="px-2.5 py-2">الفترة (UTC)</th>
                      <th className="px-2.5 py-2">{trendLabels[metric]}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {points.map((point) => (
                      <tr key={point.period}>
                        <td className="px-2.5 py-2 text-[var(--navy)] tabular-nums">
                          {utcDate(point.period)}
                        </td>
                        <td className="px-2.5 py-2 font-semibold text-[var(--navy)] tabular-nums">
                          {formatCount(point.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-[var(--muted)]">
            لا توجد سلسلة زمنية لهذه الفترة؛ لا تُنشأ بيانات بديلة.
          </p>
        )}
      </section>

      {/* Breakdown Grid */}
      <div className="grid gap-5 xl:grid-cols-2">
        <BreakdownTable
          title="أهم الصفحات"
          columns={["المسار", "المشاهدات", "الزوار"]}
          rows={data.topPages.map((row) => [
            <span key={row.path} dir="ltr" className="font-mono text-xs">
              {safeAnalyticsPath(row.path)}
            </span>,
            formatCount(row.pageViews),
            formatCount(row.visitors),
          ])}
        />

        <BreakdownTable
          title="مصادر الزيارات"
          columns={["المصدر", "الوسيط", "الحملة", "الجلسات", "المشاهدات"]}
          rows={data.trafficSources.map((row) => [
            row.source,
            row.medium ?? "غير محدد",
            row.campaign ?? "غير محدد",
            formatCount(row.sessions),
            formatCount(row.pageViews),
          ])}
        />

        <BreakdownTable
          title="التفاعل مع الدعوات للإجراء"
          columns={["الإجراء", "النقرات", "الجلسات"]}
          rows={data.ctaEngagement.map((row) => [
            ctaIdLabels[row.ctaId] ?? row.ctaId,
            formatCount(row.clicks),
            formatCount(row.sessions),
          ])}
        />

        <BreakdownTable
          title="مراحل مسار الأحداث"
          subtitle="تُعرض النسبة كما وردت من الخادم دون إعادة حساب."
          columns={["المرحلة", "الجلسات", "النسبة من السابقة"]}
          rows={data.funnel.map((row) => {
            const width = Math.max(4, Math.round((row.sessions / maxFunnelSessions) * 100));
            return [
              <div key={row.step} className="space-y-1">
                <span className="font-medium">{row.step}</span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--navy)]"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>,
              formatCount(row.sessions),
              formatRate(row.rateFromPrevious),
            ];
          })}
        />
      </div>
    </div>
  );
}

function JourneysView({ params }: { params: AnalyticsParams }) {
  const [page, setPage] = useState(1);
  const query = useAnalyticsJourneys({ ...params, page, limit: 10 });

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          تعرض هذه القائمة{" "}
          <strong className="text-[var(--navy)]">رحلات جلسات مجهولة</strong> وليست حسابات
          مستخدمين. تُعرض الدعوة للإجراء ونوع التفاعل فقط عند توفرها.
        </p>

        <p className="shrink-0 text-xs font-medium text-[var(--muted)]">10 رحلات في كل صفحة من الخادم</p>
      </div>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <Phase4Error error={query.error} retry={query.refetch} />
      ) : !query.data || !query.data.items.length ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted)] tabular-nums" dir="ltr">
            الفترة (UTC): {query.data.range.from} — {query.data.range.to}
          </p>

          {query.data.items.map((item) => (
            <article key={item.sessionId} className={panelClass}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--navy)]">
                    جلسة مجهولة{" "}
                    <span className="font-mono text-xs text-[var(--gold-dark)]" dir="ltr">
                      #{item.sessionId.slice(0, 8)}
                    </span>
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--muted)] tabular-nums">
                    {utcDate(item.startedAt, true)} — {utcDate(item.endedAt, true)} UTC ·{" "}
                    <strong className="text-[var(--navy)]">
                      {formatCount(item.eventCount)}
                    </strong>{" "}
                    حدث
                    {item.truncated ? " · الخطوات مقتطعة عند الحد الأقصى (100)" : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span
                    className={`rounded-md border px-2 py-0.5 ${
                      item.clientReportedApplication
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-slate-50 text-[var(--muted)]"
                    }`}
                  >
                    طلب (متصفح): {item.clientReportedApplication ? "نعم" : "لا"}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-0.5 ${
                      item.clientReportedInquiry
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-slate-50 text-[var(--muted)]"
                    }`}
                  >
                    استفسار (متصفح): {item.clientReportedInquiry ? "نعم" : "لا"}
                  </span>
                </div>
              </div>

              <details>
                <summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">
                  عرض التسلسل الزمني للخطوات ({item.steps.length})
                </summary>
                <ol className="mt-3 space-y-2 border-r-2 border-[var(--line)] pr-3">
                  {item.steps.map((step) => (
                    <li
                      key={step.eventId}
                      className="space-y-1 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-[var(--navy)]">
                          {eventTypeLabels[step.type] ?? step.type}
                        </span>
                        <span className="text-[11px] text-[var(--muted)] tabular-nums">
                          {utcDate(step.occurredAt, true)} UTC
                        </span>
                      </div>
                      <p className="break-all font-mono text-[11px] text-[var(--navy)]" dir="ltr">
                        {safeAnalyticsPath(step.path)}
                      </p>
                      {step.targetPath !== null ? (
                        <p className="break-all font-mono text-[11px] text-[var(--muted)]" dir="ltr">
                          → {safeAnalyticsPath(step.targetPath)}
                        </p>
                      ) : null}
                      {step.ctaId !== null ? (
                        <p className="text-[11px] text-[var(--muted)]">
                          الدعوة للإجراء:{" "}
                          <strong className="text-[var(--navy)]">
                            {ctaIdLabels[step.ctaId] ?? step.ctaId}
                          </strong>
                        </p>
                      ) : null}
                      {step.engagementType !== null ? (
                        <p className="text-[11px] text-[var(--muted)]">
                          نوع التفاعل: <bdi dir="ltr">{step.engagementType}</bdi>
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </details>
            </article>
          ))}
        </div>
      )}

      <PageControls data={query.data} change={setPage} />
    </section>
  );
}

export function AnalyticsPage() {
  const [params, setParams] = useState<AnalyticsParams>(() => analyticsParamsFromDraft(emptyAnalyticsFilterDraft()));
  const [draft, setDraft] = useState<AnalyticsFilterDraft>(emptyAnalyticsFilterDraft);
  const [tab, setTab] = useState<"summary" | "journeys">("summary");
  const [error, setError] = useState("");

  return (
    <section className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold text-[var(--gold-dark)]">
            التقارير والرصد · SUPER_ADMIN
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">التحليلات والإحصاءات</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            مؤشرات التصفح والتحويلات المؤكدة والرحلات المجهولة وفق توقيت UTC.
          </p>
        </div>

        <nav
          aria-label="تقارير التحليلات"
          className="inline-flex rounded-xl border border-[var(--line)] bg-white p-1 shadow-[var(--shadow-card)]"
        >
          <button
            type="button"
            aria-current={tab === "summary" ? "page" : undefined}
            onClick={() => setTab("summary")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === "summary"
                ? "bg-[var(--navy)] text-white"
                : "text-[var(--muted)] hover:text-[var(--navy)]"
            }`}
          >
            الملخص الإحصائي
          </button>
          <button
            type="button"
            aria-current={tab === "journeys" ? "page" : undefined}
            onClick={() => setTab("journeys")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === "journeys"
                ? "bg-[var(--navy)] text-white"
                : "text-[var(--muted)] hover:text-[var(--navy)]"
            }`}
          >
            الرحلات المجهولة
          </button>
        </nav>
      </header>

      {/* Filter Card */}
      <form
        className={`${panelClass} space-y-4`}
        onSubmit={(event) => {
          event.preventDefault();
          try {
            setParams(analyticsParamsFromDraft(draft));
            setError("");
          } catch {
            setError("تحقق من تواريخ UTC وترتيب الفترة؛ يجب ألا تتجاوز 366 يومًا.");
          }
        }}
      >
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-[var(--navy)]">الفترة الزمنية (UTC)</legend>
          <div className="flex flex-wrap gap-2">
            {analyticsRangePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={draft.preset === preset.id}
                onClick={() => setDraft((current) => ({ ...analyticsPresetDraft(preset.id), granularity: current.granularity }))}
                className={draft.preset === preset.id ? primaryButtonClass : buttonClass}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={draft.preset === "custom"}
              onClick={() => setDraft((current) => ({ ...current, preset: "custom" }))}
              className={draft.preset === "custom" ? primaryButtonClass : buttonClass}
            >
              نطاق مخصص
            </button>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>من (UTC)</span>
            <input
              aria-label="من (UTC)"
              type="date"
              value={draft.from}
              onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value, preset: "custom" }))}
              className={inputClass}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>إلى (UTC)</span>
            <input
              aria-label="إلى (UTC)"
              type="date"
              value={draft.to}
              onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value, preset: "custom" }))}
              className={inputClass}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>التجميع الزمني</span>
            <div className="relative">
              <select
                aria-label="التجميع"
                className={`${inputClass} appearance-none pl-9`}
                value={draft.granularity}
                onChange={(event) => setDraft((current) => ({ ...current, granularity: event.target.value as AnalyticsFilterDraft["granularity"] }))}
              >
                {granularities.map((value) => (
                  <option key={value} value={value}>
                    {granularityLabels[value]}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </label>

          <div className="flex items-end gap-2">
            <button type="submit" className={`${primaryButtonClass} flex-1`}>
              تطبيق الفترة
            </button>
            <button
              type="button"
              className={buttonClass}
              title="مسح المرشحات"
              aria-label="مسح المرشحات"
              onClick={() => {
                setDraft(emptyAnalyticsFilterDraft());
                setParams(analyticsParamsFromDraft(emptyAnalyticsFilterDraft()));
                setError("");
              }}
            >
              <RotateCcwIcon className="size-3.5" />
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800"
        >
          {error}
        </p>
      ) : null}

      {tab === "summary" ? (
        <SummaryView params={params} />
      ) : (
        <JourneysView key={JSON.stringify(params)} params={params} />
      )}
    </section>
  );
}
