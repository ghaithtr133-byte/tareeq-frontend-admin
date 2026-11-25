"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import {
  aboutChanges,
  aboutPublicationFields,
  aboutSections,
  aboutUpdateSchema,
  missingAboutPublicationFields,
  type AboutField,
  type AboutUsAdmin,
  type AboutUsUpdateRequest,
} from "@/lib/about-schemas";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { StaleContentSessionError } from "@/lib/content-session";
import { publicationStatusOptions } from "@/lib/content-config";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { useAboutMutation } from "@/hook/mutations/use-about-mutation";
import { useAboutQuery } from "@/hook/queries/use-about-query";
import { ErrorState, LoadingState, UnauthorizedState } from "@/components/dashboard/states";
import { StatusBadge } from "@/components/content/status-badge";
import { ImageUpload } from "@/components/media/image-upload";
import {
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  RotateCcwIcon,
} from "@/components/ui/admin-icons";
import {
  buttonClass,
  inputClass,
  panelClass,
  primaryButtonClass,
} from "@/components/universities/controls";

const publicationFieldLabels: Record<(typeof aboutPublicationFields)[number], string> = {
  heroTitleAr: "العنوان الافتتاحي بالعربية",
  heroSubtitleAr: "العنوان الفرعي بالعربية",
  introTitleAr: "عنوان المقدمة بالعربية",
  introBodyAr: "نص المقدمة بالعربية",
};

function errorMessage(error: unknown) {
  const { status, kind } = normalizeApiError(error);
  if (status === 401) return "تعذّر التحقق من الجلسة. أعد المحاولة بعد استعادتها.";
  if (status === 403) return "لم يُسمح بتنفيذ هذا الإجراء. يلزم دور SUPER_ADMIN.";
  if (status === 400) return "راجع الحقول المدخلة ثم أعد الحفظ.";
  if (status && status >= 500) return "تعذّر إتمام الطلب بسبب خطأ في الخادم.";
  if (kind === "network") return "تعذّر الاتصال بالخادم. تحقق من الشبكة.";
  return "تعذّر إتمام الطلب. أعد المحاولة.";
}

function isSafePreviewUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function AboutEditor({ baseline }: { baseline: AboutUsAdmin | null }) {
  const [edits, setEdits] = useState<AboutUsUpdateRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const mutation = useAboutMutation();

  const changes = aboutChanges(baseline, edits);
  const dirty = Object.keys(changes).some(
    (field) => baseline !== null || field !== "status" || changes.status !== "DRAFT",
  );
  const status = edits.status ?? baseline?.status ?? "DRAFT";

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (dirty || mutation.isPending) event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, mutation.isPending]);

  function setField<K extends keyof AboutUsUpdateRequest>(
    field: K,
    value: AboutUsUpdateRequest[K],
  ) {
    setEdits((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
    setMessage("");
    setSuccess(false);
  }

  function selectStatus(next: AboutUsAdmin["status"]) {
    setField("status", next);
    const missing = missingAboutPublicationFields(baseline, { ...changes, status: next });
    setErrors(Object.fromEntries(missing.map((field) => [field, "هذا الحقل مطلوب للنشر."])));
  }

  const date = new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" });
  const introImagePreview =
    edits.introImageUrl === undefined ? baseline?.introImageUrl : edits.introImageUrl;

  function renderField(fieldTuple: readonly [AboutField, string, number, ...string[]]) {
    const [name, label, max, kind] = fieldTuple;
    const edit = edits[name];
    const value = edit === undefined ? baseline?.[name] : edit;
    const clearing = edit === null;
    const isLtr = name.endsWith("En") || kind === "url";
    const hasError = Boolean(errors[name]);

    return (
      <div
        key={name}
        className={`min-w-0 space-y-2 rounded-xl border p-3.5 ${
          clearing
            ? "border-amber-200 bg-amber-50/40"
            : edit !== undefined
              ? "border-[var(--gold)]/60 bg-[var(--gold-soft)]/15"
              : "border-[var(--line)] bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={`about-${name}`} className="text-xs font-semibold text-[var(--navy)]">
            {label}
          </label>
          <div className="flex items-center gap-1.5">
            {clearing ? (
              <span className="text-[11px] font-semibold text-amber-800">
                سيُمسح صراحة (null)
              </span>
            ) : edit !== undefined ? (
              <span className="text-[11px] font-semibold text-[var(--gold-dark)]">معدّل</span>
            ) : null}
            {isLtr ? <span className="font-mono text-[10px] text-[var(--muted)]">LTR</span> : null}
          </div>
        </div>

        {kind === "textarea" ? (
          <textarea
            id={`about-${name}`}
            className={`${inputClass} ${clearing ? "bg-slate-50 text-slate-400 line-through" : ""}`}
            dir={isLtr ? "ltr" : "rtl"}
            maxLength={max}
            rows={4}
            value={value ?? ""}
            disabled={clearing}
            aria-invalid={hasError}
            aria-describedby={hasError ? `about-${name}-error` : undefined}
            onChange={(event) => setField(name, event.target.value)}
          />
        ) : (
          <input
            id={`about-${name}`}
            type={kind === "url" ? "url" : "text"}
            className={`${inputClass} ${clearing ? "bg-slate-50 text-slate-400 line-through" : ""}`}
            dir={isLtr ? "ltr" : "rtl"}
            maxLength={max}
            value={value ?? ""}
            disabled={clearing}
            aria-invalid={hasError}
            aria-describedby={hasError ? `about-${name}-error` : undefined}
            onChange={(event) => setField(name, event.target.value)}
          />
        )}

        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
          <input
            type="checkbox"
            aria-label={`مسح ${label} صراحة`}
            checked={clearing}
            onChange={(event) => setField(name, event.target.checked ? null : undefined)}
          />
          <span>مسح الحقل صراحة (إرسال null)</span>
        </label>

        {hasError ? (
          <p id={`about-${name}-error`} role="alert" className="text-xs font-medium text-red-700">
            {errors[name]}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="min-w-0 space-y-5"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (mutation.isPending || (baseline && !dirty)) return;
        setErrors({});
        setMessage("");
        setSuccess(false);

        const parsed = aboutUpdateSchema.safeParse(changes);
        const missing = missingAboutPublicationFields(baseline, changes);
        if (!parsed.success || missing.length) {
          setErrors({
            ...Object.fromEntries(
              parsed.success
                ? []
                : parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
            ),
            ...Object.fromEntries(missing.map((field) => [field, "هذا الحقل مطلوب للنشر."])),
          });
          setMessage(
            missing.length ? "أكمل حقول النشر العربية المطلوبة." : "راجع الحقول المشار إليها قبل الحفظ.",
          );
          return;
        }

        if (
          changes.status &&
          changes.status !== baseline?.status &&
          changes.status !== "DRAFT" &&
          !window.confirm("تأكيد تغيير حالة نشر صفحة من نحن؟")
        ) {
          return;
        }

        try {
          await mutation.save(parsed.data);
          setEdits({});
          setSuccess(true);
        } catch (error) {
          if (error instanceof StaleContentSessionError || normalizeApiError(error).kind === "cancelled") {
            return;
          }
          setErrors(
            Object.fromEntries(
              Object.entries(getApiFieldErrors(error)).map(([field, messages]) => [
                field,
                messages[0] ?? "",
              ]),
            ),
          );
          setMessage(`${errorMessage(error)} لم تُفقد التعديلات.`);
        }
      }}
    >
      {!baseline ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
        >
          لم يُنشأ محتوى «من نحن» بعد. احفظ مسودة للبدء.
        </p>
      ) : null}

      {/* Publication Status & Readiness Overview */}
      <section
        className="grid gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-card)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
        aria-label="حالة النشر الحالية"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-sm font-bold text-[var(--navy)]">حالة الصفحة المحفوظة</h3>
            <StatusBadge status={baseline?.status ?? "DRAFT"} />
          </div>

          <dl className="grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
            <div className="flex items-center gap-1.5 tabular-nums">
              <CalendarIcon className="size-3.5 shrink-0" />
              <span>
                تاريخ النشر:{" "}
                <strong className="text-[var(--navy)]">
                  {baseline?.publishedAt ? (
                    <time dateTime={baseline.publishedAt}>
                      {date.format(new Date(baseline.publishedAt))}
                    </time>
                  ) : (
                    "—"
                  )}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 tabular-nums">
              <CalendarIcon className="size-3.5 shrink-0" />
              <span>
                آخر تحديث:{" "}
                <strong className="text-[var(--navy)]">
                  {baseline ? (
                    <time dateTime={baseline.updatedAt}>
                      {date.format(new Date(baseline.updatedAt))}
                    </time>
                  ) : (
                    "—"
                  )}
                </strong>
              </span>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3.5">
          <p className="text-xs font-bold text-[var(--navy)]">جاهزية النشر (الحقول العربية المطلوبة)</p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {aboutPublicationFields.map((field) => {
              const current = changes[field] === undefined ? baseline?.[field] : changes[field];
              const complete = Boolean(current?.trim());
              return (
                <li key={field} className="flex items-center gap-1.5 text-xs">
                  <CheckCircleIcon
                    className={`size-3.5 shrink-0 ${
                      complete ? "text-emerald-600" : "text-slate-300"
                    }`}
                  />
                  <span className={complete ? "text-[var(--navy)]" : "text-[var(--muted)]"}>
                    {publicationFieldLabels[field]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800"
        >
          {message}
        </p>
      ) : null}

      {success ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-900"
        >
          تم حفظ محتوى «من نحن» بنجاح.
        </p>
      ) : null}

      {aboutSections.map((section) => {
        const primaryFields = section.fields.filter(([name]) => !name.endsWith("En"));
        const englishFields = section.fields.filter(([name]) => name.endsWith("En"));
        const hasStoredEnglish = englishFields.some(([name]) => Boolean(baseline?.[name]));
        const hasEnglishErrors = englishFields.some(([name]) => Boolean(errors[name]));

        return (
          <fieldset key={section.title} className={panelClass} disabled={mutation.isPending}>
            <div className="border-b border-[var(--line)] pb-3">
              <legend className="text-base font-bold text-[var(--navy)]">{section.title}</legend>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              {primaryFields.map((field) => renderField(field))}
            </div>

            {"image" in section ? (
              <div className="grid gap-4 border-t border-[var(--line)] pt-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <ImageUpload
                  resource="about"
                  disabled={mutation.isPending}
                  onUploaded={(url) => setField("introImageUrl", url)}
                />
                <div className="flex flex-col justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-2.5">
                  <p className="mb-2 text-xs font-semibold text-[var(--navy)]">معاينة صورة المقدمة</p>
                  {isSafePreviewUrl(introImagePreview) ? (
                    <img
                      src={introImagePreview}
                      alt={baseline?.introImageAltAr ?? "صورة المقدمة"}
                      className="h-28 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <p className="py-6 text-center text-xs text-[var(--muted)]">
                      لا توجد صورة محفوظة حاليًا
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {englishFields.length > 0 ? (
              <details
                open={hasEnglishErrors ? true : undefined}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3.5"
              >
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--navy)]">
                  <span>الترجمة الإنجليزية الاختيارية ({englishFields.length} حقول)</span>
                  {hasStoredEnglish ? (
                    <span className="text-[11px] font-medium text-[var(--gold-dark)]">
                      تحتوي على نصوص محفوظة
                    </span>
                  ) : null}
                </summary>
                <div className="mt-3 grid min-w-0 gap-4 md:grid-cols-2">
                  {englishFields.map((field) => renderField(field))}
                </div>
              </details>
            ) : null}
          </fieldset>
        );
      })}

      {/* Publication Controls Footer */}
      <fieldset className={panelClass} disabled={mutation.isPending}>
        <div className="border-b border-[var(--line)] pb-3">
          <legend className="text-base font-bold text-[var(--navy)]">إعدادات النشر والحفظ</legend>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <label className="grid w-full max-w-xs gap-1.5 text-xs font-semibold text-[var(--navy)]">
            <span>الحالة التحريرية</span>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pl-9`}
                value={status}
                aria-invalid={Boolean(errors.status)}
                aria-describedby={errors.status ? "about-status-error" : undefined}
                onChange={(event) => selectStatus(event.target.value as AboutUsAdmin["status"])}
              >
                {publicationStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              disabled={!dirty || mutation.isPending}
              onClick={() => {
                setEdits({});
                setErrors({});
                setMessage("");
                setSuccess(false);
              }}
            >
              <RotateCcwIcon className="size-3.5" />
              <span>تراجع عن التعديلات</span>
            </button>
            <button
              type="submit"
              className={primaryButtonClass}
              disabled={Boolean(baseline && !dirty) || mutation.isPending}
            >
              {mutation.isPending ? "جارٍ الحفظ…" : "حفظ المحتوى"}
            </button>
          </div>
        </div>

        {errors.status ? (
          <p id="about-status-error" role="alert" className="text-xs font-medium text-red-700">
            {errors.status}
          </p>
        ) : null}
      </fieldset>
    </form>
  );
}

export function AboutPage() {
  const access = useAdminAccess();
  const query = useAboutQuery();
  const retry = (
    <button type="button" className={primaryButtonClass} onClick={() => void query.refetch()}>
      إعادة المحاولة
    </button>
  );

  if (access.mockEnabled) {
    return (
      <section className="space-y-4">
        <header>
          <p className="text-xs font-semibold text-[var(--gold-dark)]">إدارة النظام</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">تحرير صفحة من نحن</h2>
        </header>
        <p className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-[var(--shadow-card)]">
          تحرير «من نحن» يتطلب جلسة خادم متصلة. لا تُرسل بيانات المعاينة.
        </p>
      </section>
    );
  }

  if (query.isError && normalizeApiError(query.error).status === 403) {
    return <UnauthorizedState />;
  }

  if (query.data === undefined) {
    return query.isError ? (
      <ErrorState
        action={
          <div className="space-y-3">
            <p role="alert" className="text-sm text-red-800">
              {errorMessage(query.error)}
            </p>
            {retry}
          </div>
        }
      />
    ) : (
      <LoadingState />
    );
  }

  return (
    <section className="min-w-0 space-y-5">
      <header>
        <p className="text-xs font-semibold text-[var(--gold-dark)]">
          إدارة النظام · SUPER_ADMIN
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">تحرير صفحة من نحن</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          تحديث محتوى الصفحة التعريفية وصورة المقدمة وإعدادات النشر الرسمية.
        </p>
      </header>

      {query.isError ? (
        <ErrorState
          action={
            <div className="space-y-3">
              <p role="alert" className="text-sm text-red-800">
                {errorMessage(query.error)}
              </p>
              {retry}
            </div>
          }
        />
      ) : null}

      <AboutEditor key={access.user?.id} baseline={query.data} />
    </section>
  );
}
