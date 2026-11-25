"use client";

import { useState } from "react";
import { z } from "zod";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { useSiteSettingsQuery } from "@/hook/queries/use-site-settings-query";
import {
  canEditSiteSettings,
  useSiteSettingsMutation,
} from "@/hook/mutations/use-site-settings-mutation";
import {
  settingsChanges,
  settingsFields,
  settingsValues,
  type SettingsFieldName,
  type SiteSettings,
} from "@/lib/site-settings-schemas";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { ErrorState, LoadingState, UnauthorizedState } from "@/components/dashboard/states";
import { CalendarIcon, RotateCcwIcon, ShieldCheckIcon } from "@/components/ui/admin-icons";
import {
  buttonClass,
  inputClass,
  panelClass,
  primaryButtonClass,
} from "@/components/universities/controls";

const groupMeta = {
  identity: {
    title: "هوية الأكاديمية",
    description: "الاسم الرسمي للأكاديمية الظاهر في ترويسة الموقع وبيانات التعريف.",
  },
  contact: {
    title: "التواصل والعنوان",
    description: "بيانات التواصل الرسمية وعنوان المقر الرئيسي.",
  },
  social: {
    title: "روابط التواصل الاجتماعي",
    description: "روابط القنوات الرسمية المعتمدة للأكاديمية.",
  },
} as const;

function formatTimestamp(value: string | null) {
  if (!value) return "لم تُهيأ الإعدادات بعد";
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SettingsEditor({
  initial,
  canEdit,
}: {
  initial: SiteSettings;
  canEdit: boolean;
}) {
  const [baseline, setBaseline] = useState(initial);
  const [values, setValues] = useState(() => settingsValues(initial));
  const [cleared, setCleared] = useState<SettingsFieldName[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const mutation = useSiteSettingsMutation();

  const dirtyFields = settingsFields.filter(({ name }) =>
    cleared.includes(name) ? baseline[name] !== null : values[name] !== (baseline[name] ?? ""),
  );
  const dirty = dirtyFields.length > 0;

  if (!canEdit) {
    return (
      <section className={panelClass}>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-900">
          عرض فقط. تعديل إعدادات الموقع متاح لدور SUPER_ADMIN فقط (وتحكم الخادم هو المرجع الفعلي للصلاحيات).
        </p>
        <dl className="grid gap-4 sm:grid-cols-2">
          {settingsFields.map((field) => (
            <div key={field.name} className="min-w-0 space-y-1">
              <dt className="text-xs font-semibold text-[var(--muted)]">{field.label}</dt>
              <dd
                className="whitespace-pre-wrap break-words text-sm font-medium text-[var(--navy)]"
                dir={field.name.endsWith("Ar") ? "rtl" : "ltr"}
              >
                {initial[field.name] ?? "غير محدد"}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (mutation.isPending || !canEdit || !dirty) return;
        setErrors({});
        setMessage("");
        setIsSuccess(false);

        if (
          !cleared.includes("contactEmail") &&
          values.contactEmail &&
          !z.email().safeParse(values.contactEmail).success
        ) {
          setErrors({ contactEmail: "أدخل بريدًا إلكترونيًا صالحًا." });
          return;
        }

        try {
          const saved = await mutation.mutateAsync(settingsChanges(baseline, values, cleared));
          setBaseline(saved);
          setValues(settingsValues(saved));
          setCleared([]);
          setIsSuccess(true);
          setMessage("تم حفظ إعدادات الموقع بنجاح.");
        } catch (error) {
          if (error instanceof z.ZodError) {
            setErrors(
              Object.fromEntries(
                error.issues.map((issue) => [
                  String(issue.path[0] ?? "form"),
                  "تحقق من صيغة هذا الحقل وطوله. استخدم المسح الصريح لإرسال null.",
                ]),
              ),
            );
            setMessage("راجع الحقول المدخلة.");
          } else {
            setErrors(
              Object.fromEntries(
                Object.entries(getApiFieldErrors(error)).map(([key, messages]) => [
                  key,
                  messages[0],
                ]),
              ),
            );
            const normalized = normalizeApiError(error);
            if (normalized.kind !== "cancelled") {
              setMessage(
                normalized.status === 403
                  ? "رفض الخادم الحفظ: يلزم دور SUPER_ADMIN وأصل موثوق. لم تُفقد التعديلات."
                  : normalized.status === 401
                    ? "تعذّر حفظ الإعدادات بسبب انتهاء صلاحية الجلسة."
                    : "تعذّر حفظ الإعدادات. احتُفظ بالتعديلات دون إعادة الطلب تلقائيًا.",
              );
            }
          }
        }
      }}
    >
      {/* Policy & Sync Metadata Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-2.5 text-xs text-[var(--muted)]">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-[var(--gold-dark)]" />
          <p className="leading-relaxed">
            التعديل محصور بصلاحية <strong className="text-[var(--navy)]">SUPER_ADMIN</strong>.
            يُرسل الحفظ الحقول المعدّلة فقط؛ لحذف قيمة محفوظة أرسلها عبر خيار{" "}
            <strong className="text-[var(--navy)]">المسح الصريح (null)</strong>.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] tabular-nums">
          <CalendarIcon className="size-3.5" />
          <span>آخر تحديث: {formatTimestamp(baseline.updatedAt)}</span>
        </span>
      </div>

      {message ? (
        <p
          role={isSuccess ? "status" : "alert"}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
        </p>
      ) : null}

      {(Object.entries(groupMeta) as [keyof typeof groupMeta, (typeof groupMeta)[keyof typeof groupMeta]][]).map(
        ([group, meta]) => (
          <fieldset key={group} className={panelClass} disabled={mutation.isPending}>
            <div className="border-b border-[var(--line)] pb-3">
              <legend className="text-base font-bold text-[var(--navy)]">{meta.title}</legend>
              <p className="mt-0.5 text-xs text-[var(--muted)]">{meta.description}</p>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              {settingsFields
                .filter((field) => field.group === group)
                .map((field) => {
                  const error = errors[field.name];
                  const isLtr = !field.name.endsWith("Ar");
                  const isClearing = cleared.includes(field.name);
                  const currentValue = values[field.name];
                  const baselineValue = baseline[field.name] ?? "";
                  const isModified = isClearing
                    ? baseline[field.name] !== null
                    : currentValue !== baselineValue;

                  const common = {
                    id: `settings-${field.name}`,
                    "aria-invalid": Boolean(error),
                    "aria-describedby": error ? `settings-${field.name}-error` : undefined,
                    dir: (isLtr ? "ltr" : "rtl") as "rtl" | "ltr",
                    className: `${inputClass} ${isClearing ? "bg-slate-50 text-slate-400 line-through" : ""}`,
                    maxLength: field.max,
                    disabled: isClearing,
                    value: currentValue,
                    onChange: (
                      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
                    ) => {
                      setValues((old) => ({ ...old, [field.name]: event.target.value }));
                      setMessage("");
                      setIsSuccess(false);
                    },
                  };

                  return (
                    <div
                      key={field.name}
                      className={`min-w-0 space-y-2 rounded-xl border p-3.5 transition-colors ${
                        isClearing
                          ? "border-amber-200 bg-amber-50/40"
                          : isModified
                            ? "border-[var(--gold)]/60 bg-[var(--gold-soft)]/15"
                            : "border-[var(--line)] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={common.id}
                          className="text-xs font-semibold text-[var(--navy)]"
                        >
                          {field.label}
                        </label>
                        <div className="flex items-center gap-1.5">
                          {isClearing ? (
                            <span className="text-[11px] font-semibold text-amber-800">
                              سيُمسح صراحة (null)
                            </span>
                          ) : isModified ? (
                            <span className="text-[11px] font-semibold text-[var(--gold-dark)]">
                              معدّل
                            </span>
                          ) : null}
                          {isLtr ? (
                            <span className="font-mono text-[10px] text-[var(--muted)]">LTR</span>
                          ) : null}
                        </div>
                      </div>

                      {field.kind === "textarea" ? (
                        <textarea {...common} rows={3} />
                      ) : (
                        <input {...common} type={field.kind} />
                      )}

                      <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
                        <input
                          aria-label={`مسح ${field.label} صراحة`}
                          type="checkbox"
                          checked={isClearing}
                          onChange={(event) => {
                            setCleared((old) =>
                              event.target.checked
                                ? [...old, field.name]
                                : old.filter((name) => name !== field.name),
                            );
                            setMessage("");
                            setIsSuccess(false);
                          }}
                        />
                        <span>مسح الحقل صراحة (إرسال null)</span>
                      </label>

                      {error ? (
                        <p
                          role="alert"
                          id={`settings-${field.name}-error`}
                          className="text-xs font-medium text-red-700"
                        >
                          {error}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          </fieldset>
        ),
      )}

      {/* Save / Reset Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]">
        <p className="text-xs text-[var(--muted)] tabular-nums">
          {dirty ? (
            <>
              يوجد <strong className="text-[var(--navy)]">{dirtyFields.length}</strong> حقل معدّل
              بانتظار الحفظ
            </>
          ) : (
            "لا توجد تعديلات غير محفوظة"
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass}
            disabled={!dirty || mutation.isPending}
            onClick={() => {
              setValues(settingsValues(baseline));
              setCleared([]);
              setErrors({});
              setMessage("");
              setIsSuccess(false);
            }}
          >
            <RotateCcwIcon className="size-3.5" />
            <span>تراجع عن التعديلات</span>
          </button>

          <button
            type="submit"
            className={primaryButtonClass}
            disabled={!dirty || mutation.isPending}
          >
            {mutation.isPending ? "جارٍ حفظ الإعدادات…" : "حفظ الإعدادات"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function SiteSettingsPage() {
  const access = useAdminAccess();
  const query = useSiteSettingsQuery();

  if (access.mockEnabled) {
    return (
      <section className="space-y-4">
        <header>
          <p className="text-xs font-semibold text-[var(--gold-dark)]">إدارة النظام</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">إعدادات الموقع</h2>
        </header>
        <p className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-[var(--shadow-card)]">
          إعدادات الموقع غير متاحة في معاينة التطوير المحلية؛ لا تُرسل بيانات وهمية إلى الخادم.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs font-semibold text-[var(--gold-dark)]">
          إدارة النظام · SUPER_ADMIN
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">إعدادات الموقع</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          إدارة هوية الأكاديمية وبيانات التواصل الرسمية وروابط الشبكات الاجتماعية.
        </p>
      </header>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        normalizeApiError(query.error).status === 403 ? (
          <UnauthorizedState />
        ) : (
          <ErrorState
            action={
              <button className={primaryButtonClass} onClick={() => void query.refetch()}>
                إعادة المحاولة
              </button>
            }
          />
        )
      ) : (
        <SettingsEditor initial={query.data} canEdit={canEditSiteSettings(access.user?.role)} />
      )}
    </section>
  );
}
