"use client";
import { useState } from "react";
import { z } from "zod";
import { getApiFieldErrors, normalizeApiError } from "@/api/error";
import { useSiteSettingsQuery } from "@/hook/queries/use-site-settings-query";
import { canEditSiteSettings, useSiteSettingsMutation } from "@/hook/mutations/use-site-settings-mutation";
import { settingsChanges, settingsFields, settingsValues, type SettingsFieldName, type SiteSettings } from "@/lib/site-settings-schemas";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { ErrorState, LoadingState, UnauthorizedState } from "@/components/dashboard/states";
import { buttonClass, inputClass, panelClass } from "@/components/universities/controls";
const groupLabels = { identity: "هوية الأكاديمية", contact: "التواصل والعنوان", social: "روابط التواصل الاجتماعي" };
function SettingsEditor({ initial, canEdit }: { initial: SiteSettings; canEdit: boolean }) {
  const [baseline, setBaseline] = useState(initial); const [values, setValues] = useState(() => settingsValues(initial)); const [cleared, setCleared] = useState<SettingsFieldName[]>([]); const [errors, setErrors] = useState<Record<string, string>>({}); const [message, setMessage] = useState(""); const mutation = useSiteSettingsMutation();
  const dirty = settingsFields.some(({ name }) => cleared.includes(name) ? baseline[name] !== null : values[name] !== (baseline[name] ?? ""));
  if (!canEdit) return <section className={panelClass}><p className="text-sm">عرض فقط. تعديل إعدادات الموقع متاح لدور SUPER_ADMIN فقط.</p><dl className="grid gap-4 sm:grid-cols-2">{settingsFields.map(field => <div key={field.name} className="min-w-0"><dt className="text-sm font-semibold">{field.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm" dir={field.name.endsWith("Ar") ? "rtl" : "ltr"}>{initial[field.name] ?? "غير محدد"}</dd></div>)}</dl></section>;
  return <form className="space-y-5" noValidate onSubmit={async event => {
    event.preventDefault(); if (mutation.isPending || !canEdit || !dirty) return; setErrors({}); setMessage("");
    if (!cleared.includes("contactEmail") && values.contactEmail && !z.email().safeParse(values.contactEmail).success) { setErrors({ contactEmail: "أدخل بريدًا إلكترونيًا صالحًا." }); return; }
    try { const saved = await mutation.mutateAsync(settingsChanges(baseline, values, cleared)); setBaseline(saved); setValues(settingsValues(saved)); setCleared([]); setMessage("تم حفظ إعدادات الموقع بنجاح."); }
    catch (error) { if (error instanceof z.ZodError) { setErrors(Object.fromEntries(error.issues.map(issue => [String(issue.path[0] ?? "form"), "تحقق من صيغة هذا الحقل وطوله. استخدم المسح الصريح لإرسال null."]))); setMessage("راجع الحقول المدخلة."); } else { setErrors(Object.fromEntries(Object.entries(getApiFieldErrors(error)).map(([key, messages]) => [key, messages[0]]))); const normalized = normalizeApiError(error); if (normalized.kind !== "cancelled") setMessage(normalized.status === 403 ? "رفض الخادم الحفظ: يلزم دور SUPER_ADMIN وأصل موثوق. لم تُفقد التعديلات." : normalized.status === 401 ? "تعذّر حفظ الإعدادات بسبب انتهاء صلاحية الجلسة." : "تعذّر حفظ الإعدادات. احتُفظ بالتعديلات دون إعادة الطلب تلقائيًا."); } }
  }}><p className="rounded-lg bg-[var(--gold-soft)] p-3 text-sm">التعديل متاح لـ SUPER_ADMIN فقط. الحفظ يرسل الحقول المتغيرة فقط؛ المسح الصريح يرسل null. حذف النص لا يعني المسح تلقائيًا.</p>
    {message ? <p role="status" className="text-sm">{message}</p> : null}
    {Object.entries(groupLabels).map(([group, label]) => <fieldset key={group} className={panelClass} disabled={mutation.isPending}><legend className="px-2 font-bold">{label}</legend><div className="grid min-w-0 gap-4 md:grid-cols-2">{settingsFields.filter(field => field.group === group).map(field => {
      const error = errors[field.name]; const direction = field.name.endsWith("Ar") ? "rtl" : "ltr";
      const common = { id: `settings-${field.name}`, "aria-invalid": Boolean(error), "aria-describedby": error ? `settings-${field.name}-error` : undefined, dir: direction as "rtl" | "ltr", className: inputClass, maxLength: field.max, disabled: cleared.includes(field.name), value: values[field.name], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setValues(old => ({ ...old, [field.name]: event.target.value })); setMessage(""); } };
      return <div key={field.name} className="min-w-0 space-y-2"><label htmlFor={common.id} className="text-sm font-semibold">{field.label}</label>{field.kind === "textarea" ? <textarea {...common} rows={3} /> : <input {...common} type={field.kind} />}<label className="flex min-h-11 items-center gap-2 text-sm"><input aria-label={`مسح ${field.label} صراحة`} type="checkbox" checked={cleared.includes(field.name)} onChange={event => { setCleared(old => event.target.checked ? [...old, field.name] : old.filter(name => name !== field.name)); setMessage(""); }} />مسح الحقل صراحة (null)</label>{error ? <p role="alert" id={`settings-${field.name}-error`} className="text-sm text-red-700">{error}</p> : null}</div>;
    })}</div></fieldset>)}<div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={!dirty || mutation.isPending}>{mutation.isPending ? "جارٍ حفظ الإعدادات…" : "حفظ الإعدادات"}</button><button type="button" className={buttonClass} disabled={!dirty || mutation.isPending} onClick={() => { setValues(settingsValues(baseline)); setCleared([]); setErrors({}); setMessage(""); }}>إلغاء التعديلات</button></div><p className="text-xs">آخر تحديث: {baseline.updatedAt ?? "لم تُهيأ الإعدادات بعد"}</p>
  </form>;
}
export function SiteSettingsPage() {
  const access = useAdminAccess(); const query = useSiteSettingsQuery();
  if (access.mockEnabled) return <p>إعدادات الموقع غير متاحة في معاينة التطوير؛ لا تُرسل بيانات وهمية إلى Backend.</p>;
  return <section className="space-y-5"><h2 className="text-2xl font-bold">إعدادات الموقع</h2>{query.isPending ? <LoadingState /> : query.isError ? normalizeApiError(query.error).status === 403 ? <UnauthorizedState /> : <ErrorState action={<button className={buttonClass} onClick={() => void query.refetch()}>إعادة المحاولة</button>} /> : <SettingsEditor initial={query.data} canEdit={canEditSiteSettings(access.user?.role)} />}</section>;
}
