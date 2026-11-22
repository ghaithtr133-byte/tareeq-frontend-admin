"use client";

import { useEffect, useState } from "react";
import { aboutChanges, aboutSections, aboutUpdateSchema, missingAboutPublicationFields, type AboutUsAdmin, type AboutUsUpdateRequest } from "@/lib/about-schemas";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { StaleContentSessionError } from "@/lib/content-session";
import { publicationStatusOptions } from "@/lib/content-config";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { useAboutMutation } from "@/hook/mutations/use-about-mutation";
import { useAboutQuery } from "@/hook/queries/use-about-query";
import { ErrorState, LoadingState, UnauthorizedState } from "@/components/dashboard/states";
import { StatusBadge } from "@/components/content/status-badge";
import { ImageUpload } from "@/components/media/image-upload";
import { buttonClass, inputClass, panelClass } from "@/components/universities/controls";

function errorMessage(error: unknown) {
  const { status, kind } = normalizeApiError(error);
  if (status === 401) return "تعذّر التحقق من الجلسة. أعد المحاولة بعد استعادتها.";
  if (status === 403) return "لم يُسمح بتنفيذ هذا الإجراء. تحقق من الصلاحيات.";
  if (status === 400) return "راجع الحقول المدخلة ثم أعد الحفظ.";
  if (status && status >= 500) return "تعذّر إتمام الطلب بسبب خطأ في الخادم.";
  if (kind === "network") return "تعذّر الاتصال بالخادم. تحقق من الشبكة.";
  return "تعذّر إتمام الطلب. أعد المحاولة.";
}

function AboutEditor({ baseline }: { baseline: AboutUsAdmin | null }) {
  const [edits, setEdits] = useState<AboutUsUpdateRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const mutation = useAboutMutation();
  const changes = aboutChanges(baseline, edits);
  const dirty = Object.keys(changes).some(field => baseline !== null || field !== "status" || changes.status !== "DRAFT");
  const status = edits.status ?? baseline?.status ?? "DRAFT";

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) { if (dirty || mutation.isPending) event.preventDefault(); }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, mutation.isPending]);

  function setField<K extends keyof AboutUsUpdateRequest>(field: K, value: AboutUsUpdateRequest[K]) {
    setEdits(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: "" }));
    setMessage(""); setSuccess(false);
  }

  function selectStatus(next: AboutUsAdmin["status"]) {
    setField("status", next);
    const missing = missingAboutPublicationFields(baseline, { ...changes, status: next });
    setErrors(Object.fromEntries(missing.map(field => [field, "هذا الحقل مطلوب للنشر."])));
  }

  const date = new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" });
  return <form className="min-w-0 space-y-5" noValidate onSubmit={async event => {
    event.preventDefault(); if (mutation.isPending || (baseline && !dirty)) return;
    setErrors({}); setMessage(""); setSuccess(false);
    const parsed = aboutUpdateSchema.safeParse(changes);
    const missing = missingAboutPublicationFields(baseline, changes);
    if (!parsed.success || missing.length) {
      setErrors({
        ...Object.fromEntries(parsed.success ? [] : parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])),
        ...Object.fromEntries(missing.map(field => [field, "هذا الحقل مطلوب للنشر."])),
      });
      setMessage(missing.length ? "أكمل حقول النشر العربية المطلوبة." : "راجع الحقول المشار إليها قبل الحفظ."); return;
    }
    if (changes.status && changes.status !== baseline?.status && changes.status !== "DRAFT" && !window.confirm("تأكيد تغيير حالة نشر صفحة من نحن؟")) return;
    try { await mutation.save(parsed.data); setEdits({}); setSuccess(true); }
    catch (error) {
      if (error instanceof StaleContentSessionError || normalizeApiError(error).kind === "cancelled") return;
      setErrors(Object.fromEntries(Object.entries(getApiFieldErrors(error)).map(([field, messages]) => [field, messages[0] ?? ""])));
      setMessage(`${errorMessage(error)} لم تُفقد التعديلات.`);
    }
  }}>
    {!baseline ? <p role="status" className="rounded-lg bg-[var(--gold-soft)] p-3 text-sm">لم يُنشأ محتوى «من نحن» بعد. احفظ مسودة للبدء.</p> : null}
    <section className={panelClass} aria-label="حالة النشر الحالية">
      <div className="flex flex-wrap items-center gap-3"><strong>الحالة المحفوظة</strong><StatusBadge status={baseline?.status ?? "DRAFT"} /></div>
      <p className="text-sm">تاريخ النشر: {baseline?.publishedAt ? <time dateTime={baseline.publishedAt}>{date.format(new Date(baseline.publishedAt))}</time> : "—"}</p>
      <p className="text-sm">آخر تحديث: {baseline ? <time dateTime={baseline.updatedAt}>{date.format(new Date(baseline.updatedAt))}</time> : "—"}</p>
    </section>
    {message ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{message}</p> : null}
    {success ? <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-900">تم حفظ محتوى «من نحن» بنجاح.</p> : null}
    {aboutSections.map(section => <fieldset key={section.title} className={panelClass} disabled={mutation.isPending}>
      <legend className="px-2 font-bold">{section.title}</legend>
      <div className="grid min-w-0 gap-4 md:grid-cols-2">{section.fields.map(([name, label, max, kind]) => {
        const edit = edits[name]; const value = edit === undefined ? baseline?.[name] : edit;
        const clearing = edit === null;
        const common = { id: `about-${name}`, className: inputClass, dir: name.endsWith("En") || kind === "url" ? "ltr" as const : "rtl" as const, maxLength: max, value: value ?? "", disabled: clearing, "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `about-${name}-error` : undefined, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(name, event.target.value) };
        return <div key={name} className="min-w-0 space-y-2">
          <label htmlFor={common.id} className="text-sm font-semibold">{label}</label>
          {kind === "textarea" ? <textarea {...common} rows={4} /> : <input {...common} type={kind === "url" ? "url" : "text"} />}
          <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" aria-label={`مسح ${label} صراحة`} checked={clearing} onChange={event => setField(name, event.target.checked ? null : undefined)} />مسح الحقل صراحة</label>
          {errors[name] ? <p id={`about-${name}-error`} role="alert" className="text-sm text-red-800">{errors[name]}</p> : null}
        </div>;
      })}</div>
      {"image" in section ? <ImageUpload resource="about" disabled={mutation.isPending} onUploaded={url => setField("introImageUrl", url)} /> : null}
    </fieldset>)}
    <fieldset className={panelClass} disabled={mutation.isPending}>
      <legend className="px-2 font-bold">النشر</legend>
      <label className="grid max-w-xs gap-2 text-sm font-semibold">الحالة التحريرية<select className={inputClass} value={status} aria-invalid={Boolean(errors.status)} aria-describedby={errors.status ? "about-status-error" : undefined} onChange={event => selectStatus(event.target.value as AboutUsAdmin["status"])}>{publicationStatusOptions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      {errors.status ? <p id="about-status-error" role="alert" className="text-sm text-red-800">{errors.status}</p> : null}
      <p className="text-sm">للنشر: أكمل العنوان والعنوان الفرعي ونص وعنوان المقدمة بالعربية. الترجمة اختيارية.</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={buttonClass} disabled={Boolean(baseline && !dirty) || mutation.isPending}>{mutation.isPending ? "جارٍ الحفظ…" : "حفظ المحتوى"}</button>
        <button type="button" className={buttonClass} disabled={!dirty} onClick={() => { setEdits({}); setErrors({}); setMessage(""); setSuccess(false); }}>إلغاء التعديلات</button>
      </div>
    </fieldset>
  </form>;
}

export function AboutPage() {
  const access = useAdminAccess(); const query = useAboutQuery();
  const retry = <button type="button" className={buttonClass} onClick={() => void query.refetch()}>إعادة المحاولة</button>;
  if (access.mockEnabled) return <p>تحرير «من نحن» يتطلب جلسة خادم. لا تُرسل بيانات المعاينة.</p>;
  if (query.isError && normalizeApiError(query.error).status === 403) return <UnauthorizedState />;
  if (query.data === undefined) return query.isError ? <ErrorState action={<div className="space-y-3"><p role="alert">{errorMessage(query.error)}</p>{retry}</div>} /> : <LoadingState />;
  return <section className="min-w-0 space-y-4">
    <h2 className="text-2xl font-bold text-[var(--navy)]">تحرير صفحة من نحن</h2>
    {query.isError ? <ErrorState action={<div className="space-y-3"><p role="alert">{errorMessage(query.error)}</p>{retry}</div>} /> : null}
    <AboutEditor key={access.user?.id} baseline={query.data} />
  </section>;
}
