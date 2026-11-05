"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getApiFieldErrors, normalizeApiError } from "@/api/error";
import { useFaqMutation } from "@/hook/mutations/use-faq-mutation";
import { faqFormPayload, faqFormValues, type FaqFormValues } from "@/lib/faq-form";
import { faqScopeLabels, type Faq, type FaqCreate, type FaqGroup } from "@/lib/faq-schemas";
import { publicationStatusOptions } from "@/lib/content-config";
import { buttonClass, inputClass, panelClass } from "@/components/universities/controls";
export function FaqEditor({ group, record, close }: { group: FaqGroup; record?: Faq; close: (saved?: boolean) => void }) {
  const form = useForm<FaqFormValues>({ defaultValues: faqFormValues(record) }); const [cleared, setCleared] = useState<("questionEn" | "answerEn")[]>([]); const [message, setMessage] = useState(""); const mutation = useFaqMutation(group);
  return <form className={panelClass} noValidate onSubmit={form.handleSubmit(async values => {
    if (mutation.isPending) return;
    form.clearErrors(); setMessage("");
    try {
      const payload = faqFormPayload(group, values, record, cleared);
      if (payload.status && payload.status !== record?.status && payload.status !== "DRAFT" && !window.confirm("تأكيد تغيير الحالة التحريرية للسؤال؟")) return;
      await mutation.mutateAsync(record ? { id: record.id, update: payload } : { create: payload as FaqCreate }); close(true);
    } catch (error) {
      if (error instanceof z.ZodError) { for (const issue of error.issues) if (issue.path.length) form.setError(issue.path[0] as keyof FaqFormValues, { message: "تحقق من طول الحقل وقيمته المطلوبة." }); setMessage("راجع الحقول؛ السؤال 2–500 حرف، والإجابة 2–10000 حرف. الحفظ يتطلب تغييرًا."); }
      else { for (const [field, errors] of Object.entries(getApiFieldErrors(error))) if (["questionAr", "answerAr", "questionEn", "answerEn", "status"].includes(field)) form.setError(field as keyof FaqFormValues, { message: errors[0] }); const normalized = normalizeApiError(error); if (normalized.kind !== "cancelled") setMessage(normalized.status === 403 ? "لا تملك صلاحية حفظ السؤال." : normalized.status === 409 ? "حدث تعارض. احتُفظ بتعديلاتك؛ راجع السجل قبل المحاولة." : "تعذّر حفظ السؤال. لم تُفقد بيانات النموذج."); }
    }
  })}>
    <h3 className="text-lg font-bold">{record ? "تعديل السؤال" : "إضافة سؤال"}</h3><p className="break-words text-sm">النطاق والارتباط ثابتان بعد الإنشاء: {faqScopeLabels[group.scope]}{group.parentId ? ` · ${group.parentId}` : ""}</p>{message ? <p role="alert" className="text-sm text-red-700">{message}</p> : null}
    <fieldset disabled={mutation.isPending} className="grid min-w-0 gap-4 md:grid-cols-2">{([{ name: "questionAr", label: "السؤال بالعربية *", max: 500 }, { name: "answerAr", label: "الإجابة بالعربية *", max: 10000 }, { name: "questionEn", label: "السؤال بالإنجليزية (اختياري)", max: 500 }, { name: "answerEn", label: "الإجابة بالإنجليزية (اختياري)", max: 10000 }] as const).map(field => {
      const nullable = field.name === "questionEn" || field.name === "answerEn"; const isCleared = nullable && cleared.includes(field.name as "questionEn" | "answerEn"); const error = form.formState.errors[field.name]?.message;
      return <div key={field.name} className="min-w-0 space-y-2"><label htmlFor={`faq-${field.name}`} className="text-sm font-semibold">{field.label}</label>{field.name.startsWith("answer") ? <textarea id={`faq-${field.name}`} dir={field.name.endsWith("En") ? "ltr" : "rtl"} rows={5} maxLength={field.max} disabled={isCleared} aria-invalid={Boolean(error)} aria-describedby={error ? `faq-${field.name}-error` : undefined} className={inputClass} {...form.register(field.name)} /> : <input id={`faq-${field.name}`} dir={field.name.endsWith("En") ? "ltr" : "rtl"} maxLength={field.max} disabled={isCleared} aria-invalid={Boolean(error)} aria-describedby={error ? `faq-${field.name}-error` : undefined} className={inputClass} {...form.register(field.name)} />}{nullable ? <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(isCleared)} onChange={event => { const name = field.name as "questionEn" | "answerEn"; setCleared(old => event.target.checked ? [...old, name] : old.filter(key => key !== name)); }} />مسح {field.name === "questionEn" ? "السؤال الإنجليزي" : "الإجابة الإنجليزية"} صراحة (null)</label> : null}{error ? <p role="alert" id={`faq-${field.name}-error`} className="text-sm text-red-700">{error}</p> : null}</div>;
    })}<label className="grid gap-1 text-sm font-semibold">الحالة التحريرية<select aria-label="الحالة التحريرية" className={inputClass} {...form.register("status")}>{publicationStatusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></fieldset>
    <div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={mutation.isPending}>{mutation.isPending ? "جارٍ الحفظ…" : "حفظ السؤال"}</button><button type="button" className={buttonClass} disabled={mutation.isPending} onClick={() => close()}>إلغاء</button></div>
  </form>;
}
