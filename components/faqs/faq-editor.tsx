"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { useFaqMutation } from "@/hook/mutations/use-faq-mutation";
import { faqFormPayload, faqFormValues, type FaqFormValues } from "@/lib/faq-form";
import {
  faqGroupSchema,
  faqScopeLabels,
  selectableFaqScopes,
  type Faq,
  type FaqCreate,
  type FaqGroup,
} from "@/lib/faq-schemas";
import { publicationStatusOptions } from "@/lib/content-config";
import { ChevronDownIcon, CloseIcon } from "@/components/ui/admin-icons";
import {
  buttonClass,
  inputClass,
  panelClass,
  primaryButtonClass,
} from "@/components/universities/controls";
import { FaqParentSelector } from "./faq-parent-selector";

export function FaqEditor({
  group,
  parentLabel,
  record,
  close,
}: {
  group: FaqGroup;
  parentLabel?: string;
  record?: Faq;
  close: (savedGroup?: FaqGroup, savedParentLabel?: string) => void;
}) {
  const isEditing = Boolean(record);
  const [targetGroup, setTargetGroup] = useState<FaqGroup>(() =>
    faqGroupSchema.safeParse(group).success ? group : { scope: group.scope },
  );
  const [targetLabel, setTargetLabel] = useState<string | undefined>(parentLabel);

  const form = useForm<FaqFormValues>({
    defaultValues: faqFormValues(record),
    shouldUnregister: false,
  });
  const questionArValue = useWatch({ control: form.control, name: "questionAr" });
  const answerArValue = useWatch({ control: form.control, name: "answerAr" });
  const [message, setMessage] = useState("");
  const mutation = useFaqMutation(targetGroup);

  const targetValid = faqGroupSchema.safeParse(targetGroup).success;

  function requestClose() {
    if (form.formState.isDirty && !window.confirm("لديك تعديلات غير محفوظة. هل تريد إغلاق النموذج؟")) return;
    close();
  }

  const targetDisplay =
    targetGroup.scope === "GLOBAL"
      ? "عام / الصفحة الرئيسية"
      : targetLabel || (targetGroup.parentId ? "سجل مرتبط محدد" : "لم يُحدد سجل بعد");

  return (
    <form
      className={panelClass}
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        if (mutation.isPending) return;
        form.clearErrors();
        setMessage("");

        if (!faqGroupSchema.safeParse(targetGroup).success) {
          setMessage("اختر النطاق والسجل المرتبط المستهدف قبل حفظ السؤال.");
          return;
        }

        try {
          const payload = faqFormPayload(targetGroup, values, record);
          if (
            payload.status &&
            payload.status !== record?.status &&
            payload.status !== "DRAFT" &&
            !window.confirm("تأكيد تغيير الحالة التحريرية للسؤال؟")
          ) {
            return;
          }

          await mutation.mutateAsync(
            record ? { id: record.id, update: payload } : { create: payload as FaqCreate },
          );
          close(targetGroup, targetLabel);
        } catch (error) {
          if (error instanceof z.ZodError) {
            for (const issue of error.issues) {
              if (issue.path.length) {
                form.setError(issue.path[0] as keyof FaqFormValues, {
                  message: "تحقق من طول الحقل وقيمته المطلوبة.",
                });
              }
            }
            setMessage(
              "راجع الحقول؛ السؤال 2–500 حرف، والإجابة 2–10000 حرف. الحفظ يتطلب تغييرًا.",
            );
          } else {
            for (const [field, errors] of Object.entries(getApiFieldErrors(error))) {
              if (["questionAr", "answerAr", "questionEn", "answerEn", "status"].includes(field)) {
                form.setError(field as keyof FaqFormValues, { message: errors[0] });
              }
            }
            const normalized = normalizeApiError(error);
            if (normalized.kind !== "cancelled") {
              setMessage(
                normalized.status === 403
                  ? "لا تملك صلاحية حفظ السؤال."
                  : normalized.status === 409
                    ? "حدث تعارض. احتُفظ بتعديلاتك؛ راجع السجل قبل المحاولة."
                    : "تعذّر حفظ السؤال. لم تُفقد بيانات النموذج.",
              );
            }
          }
        }
      })}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <h3 className="text-base font-bold text-[var(--navy)]">
            {isEditing ? "تعديل السؤال الشائع" : "إضافة سؤال شائع جديد"}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {isEditing
              ? "يُحدّث هذا النموذج بيانات السؤال ضمن مجموعته الحالية."
              : "نموذج الإنشاء مستقل عن مرشحات القائمة؛ تأكد من اختيار النطاق المستهدف أدناه."}
          </p>
        </div>

        <button
          type="button"
          onClick={requestClose}
          disabled={mutation.isPending}
          aria-label="إغلاق النموذج"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:bg-slate-50 hover:text-[var(--navy)]"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      {/* Explicit Target Group Confirmation (separated cleanly from list filters) */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-[var(--navy)]">المجموعة المستهدفة للحفظ</span>
          <span className="text-xs font-medium text-[var(--navy)]">
            {faqScopeLabels[targetGroup.scope]}
            {targetGroup.scope !== "GLOBAL" ? ` · ${targetDisplay}` : ""}
          </span>
        </div>

        {!isEditing || record?.scope !== "SERVICE" ? (
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
              <span>نطاق السؤال المستهدف</span>
              <div className="relative">
                <select
                  aria-label="نطاق السؤال المستهدف"
                  disabled={mutation.isPending}
                  className={`${inputClass} appearance-none pl-9`}
                  value={targetGroup.scope}
                  onChange={(event) => {
                    const nextScope = event.target.value as FaqGroup["scope"];
                    setTargetGroup({ scope: nextScope });
                    setTargetLabel(undefined);
                    setMessage("");
                  }}
                >
                  {(targetGroup.scope === "SERVICE" ? [targetGroup.scope] : selectableFaqScopes).map((scope) => (
                    <option key={scope} value={scope}>
                      {faqScopeLabels[scope]}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
            </label>

            <FaqParentSelector
              key={`editor-${targetGroup.scope}`}
              scope={targetGroup.scope}
              label={`الجهة المرتبطة (${faqScopeLabels[targetGroup.scope]})`}
              value={targetGroup.parentId ?? ""}
              selectedLabel={targetLabel}
              disabled={mutation.isPending}
              onChange={(parentId, resolvedLabel) => {
                setTargetGroup((old) => ({
                  ...old,
                  parentId: parentId || undefined,
                }));
                setTargetLabel(resolvedLabel);
                setMessage("");
              }}
            />
          </div>
        ) : null}
      </div>

      {message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
        >
          {message}
        </p>
      ) : null}

      <fieldset disabled={mutation.isPending} className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="min-w-0 space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="faq-questionAr" className="text-xs font-semibold text-[var(--navy)]">
              السؤال بالعربية *
            </label>
            <span className="text-[11px] text-[var(--muted)] tabular-nums">
              {questionArValue?.length ?? 0} / 500
            </span>
          </div>
          <input
            id="faq-questionAr"
            dir="rtl"
            maxLength={500}
            aria-invalid={Boolean(form.formState.errors.questionAr)}
            className={inputClass}
            {...form.register("questionAr")}
          />
          {form.formState.errors.questionAr?.message ? (
            <p role="alert" className="text-xs font-medium text-red-700">
              {form.formState.errors.questionAr.message}
            </p>
          ) : null}
        </div>

        <div className="min-w-0 space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="faq-answerAr" className="text-xs font-semibold text-[var(--navy)]">
              الإجابة بالعربية *
            </label>
            <span className="text-[11px] text-[var(--muted)] tabular-nums">
              {answerArValue?.length ?? 0} / 10000
            </span>
          </div>
          <textarea
            id="faq-answerAr"
            dir="rtl"
            rows={5}
            maxLength={10000}
            aria-invalid={Boolean(form.formState.errors.answerAr)}
            className={inputClass}
            {...form.register("answerAr")}
          />
          {form.formState.errors.answerAr?.message ? (
            <p role="alert" className="text-xs font-medium text-red-700">
              {form.formState.errors.answerAr.message}
            </p>
          ) : null}
        </div>

        <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
          <span>الحالة التحريرية</span>
          <div className="relative">
            <select
              aria-label="الحالة التحريرية"
              className={`${inputClass} appearance-none pl-9`}
              {...form.register("status")}
            >
              {publicationStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          </div>
        </label>

        <details className="rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3.5 md:col-span-2">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">
              محتوى إنجليزي اختياري
            </summary>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {(
                [
                  { name: "questionEn", label: "السؤال بالإنجليزية", max: 500 },
                  { name: "answerEn", label: "الإجابة بالإنجليزية", max: 10000 },
                ] as const
              ).map((field) => {
                const error = form.formState.errors[field.name]?.message;
                return (
                  <div key={field.name} className="min-w-0 space-y-2">
                    <label
                      htmlFor={`faq-${field.name}`}
                      className="text-xs font-semibold text-[var(--navy)]"
                    >
                      {field.label}
                    </label>
                    {field.name === "answerEn" ? (
                      <textarea
                        id={`faq-${field.name}`}
                        dir="ltr"
                        rows={4}
                        maxLength={field.max}
                        className={inputClass}
                        {...form.register(field.name)}
                      />
                    ) : (
                      <input
                        id={`faq-${field.name}`}
                        dir="ltr"
                        maxLength={field.max}
                        className={inputClass}
                        {...form.register(field.name)}
                      />
                    )}
                    {error ? (
                      <p role="alert" className="text-xs text-red-700">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </details>
      </fieldset>

      <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
        <button
          type="submit"
          className={primaryButtonClass}
          disabled={mutation.isPending || !targetValid}
        >
          {mutation.isPending ? "جارٍ الحفظ…" : isEditing ? "حفظ التعديلات" : "إنشاء السؤال"}
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={mutation.isPending}
          onClick={requestClose}
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
