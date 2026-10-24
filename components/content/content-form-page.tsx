"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import type { AdminContentResource, ContentRecord } from "@/api/content";
import { getApiFieldErrors, normalizeApiError } from "@/api/error";
import { ArticleBlockEditor } from "@/components/content/article-block-editor";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { useCreateContent, useUpdateContent } from "@/hook/mutations/use-content-mutations";
import { useContentDetail, useContentSelectors } from "@/hook/queries/use-content-queries";
import { contentDefinitions, type ContentFieldDefinition } from "@/lib/content-config";
import { initialContentValues, toContentPayload, type ContentFormValues, validateContentValues } from "@/lib/content-form";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[var(--gold)]";
const createSubmitLabels: Record<AdminContentResource, string> = {
  countries: "إضافة الدولة",
  universities: "إضافة الجامعة",
  scholarships: "إضافة المنحة",
  services: "إضافة الخدمة",
  articles: "إنشاء المقال",
};

type RelationshipOption = { id: string; label: string; countryId?: string };

function fieldDirection(field: ContentFieldDefinition): "rtl" | "ltr" {
  if (field.kind === "url" || field.kind === "number" || field.kind === "datetime-local") return "ltr";
  if (field.name === "slug" || field.name.endsWith("En") || field.name === "officialName") return "ltr";
  return "rtl";
}

function RelationshipSelector({ id, field, options, currentValue, register, error }: {
  id: string;
  field: ContentFieldDefinition;
  options: RelationshipOption[];
  currentValue?: string;
  register: ReturnType<typeof useForm<ContentFormValues>>["register"];
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("ar");
  const current = options.find((option) => option.id === currentValue);
  const matches = options.filter((option) => !normalizedQuery || option.label.toLocaleLowerCase("ar").includes(normalizedQuery));
  const visible = current && !matches.some((option) => option.id === current.id) ? [current, ...matches] : matches;
  const common = { id, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined };

  return <div className="mt-1 space-y-2">
    <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={`البحث في ${field.label}`} placeholder={`ابحث في ${field.label}`} className={inputClass} />
    <select {...common} className={inputClass} {...register(field.name)}>
      <option value="">{field.nullable ? "بلا ارتباط" : "اختر عنصرًا"}</option>
      {visible.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select>
    {visible.length === 0 ? <p className="text-xs text-[var(--muted)]">لا توجد نتائج مطابقة.</p> : null}
  </div>;
}

function Field({ resource, field, register, error, countries, universities, scholarships, selectedCountryId, currentValue }: {
  resource: AdminContentResource;
  field: ContentFieldDefinition;
  register: ReturnType<typeof useForm<ContentFormValues>>["register"];
  error?: string;
  countries: { id: string; nameAr: string }[];
  universities: { id: string; nameAr: string; countryId: string }[];
  scholarships: { id: string; titleAr: string }[];
  selectedCountryId?: string;
  currentValue?: string;
}) {
  const id = `${resource}-${field.name}`;
  const direction = fieldDirection(field);
  const directionalClass = direction === "ltr" ? "text-left" : "text-right";
  const common = { id, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined };
  let control: React.ReactNode;
  if (field.kind === "checkbox") control = <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-[var(--navy)]"><input id={id} type="checkbox" className="size-5 accent-[var(--navy)]" {...register(field.name)} />{field.label}</label>;
  else if (field.kind === "textarea") control = <textarea {...common} dir={direction} rows={5} maxLength={field.maxLength} className={`${inputClass} ${directionalClass}`} {...register(field.name)} />;
  else if (field.kind === "select") control = <select {...common} className={inputClass} {...register(field.name)}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  else if (field.kind === "country" || field.kind === "university" || field.kind === "scholarship") {
    const options = field.kind === "country"
      ? countries.map((item) => ({ id: item.id, label: item.nameAr }))
      : field.kind === "university"
        ? universities.filter((item) => !selectedCountryId || item.countryId === selectedCountryId).map((item) => ({ id: item.id, label: item.nameAr }))
        : scholarships.map((item) => ({ id: item.id, label: item.titleAr }));
    control = <RelationshipSelector id={id} field={field} options={options} currentValue={currentValue} register={register} error={error} />;
  } else control = <input {...common} type={field.kind === "datetime-local" ? "datetime-local" : field.kind === "number" ? "number" : field.kind === "url" ? "url" : "text"} dir={direction} maxLength={field.maxLength} min={field.kind === "number" ? 0 : undefined} max={field.kind === "number" ? 1000000 : undefined} className={`${inputClass} ${directionalClass}`} {...register(field.name)} />;
  return <div className={field.kind === "checkbox" ? "rounded-lg border border-[var(--line)] px-4 py-3" : ""}>{field.kind === "checkbox" ? control : <><label htmlFor={id} className="text-sm font-semibold text-[var(--navy)]">{field.label}{field.required ? " *" : ""}</label>{control}</>}{field.hint ? <p className="mt-1 text-xs text-[var(--muted)]">{field.hint}</p> : null}{error ? <p id={`${id}-error`} className="mt-1 text-sm text-red-700" role="alert">{error}</p> : null}</div>;
}

function ImagePreview({ url }: { url?: string }) {
  const [state, setState] = useState<"empty" | "invalid" | "loading" | "loaded" | "unavailable">("empty");
  const validUrl = Boolean(url && /^https?:\/\//.test(url));

  useEffect(() => {
    setState(!url ? "empty" : validUrl ? "loading" : "invalid");
  }, [url, validUrl]);

  const detail = state === "empty"
    ? "لم يُدخل رابط صورة بعد."
    : state === "invalid"
      ? "رابط الصورة غير صالح للمعاينة. استخدم رابطًا يبدأ بـ http أو https."
      : "تعذّر تحميل معاينة الصورة. سيُحفظ الرابط المدخل دون تغيير.";

  return (
    <div className="rounded-xl border border-[var(--line)] p-3" aria-live="polite">
      <p className="mb-2 text-sm font-bold text-[var(--navy)]">معاينة الصورة</p>
      {validUrl && state !== "unavailable" ? <img src={url} alt="معاينة الصورة المدخلة" onLoad={() => setState("loaded")} onError={() => setState("unavailable")} className={`max-h-64 max-w-full rounded-lg object-contain ${state === "loading" ? "min-h-24 bg-slate-50" : ""}`} /> : null}
      {state !== "loaded" ? <p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--background)] px-3 py-4 text-sm leading-6 text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
}

export function ContentFormPage({ resource, id }: { resource: AdminContentResource; id?: string }) {
  const router = useRouter();
  const definition = contentDefinitions[resource];
  const detail = useContentDetail(resource, id);
  const relationships = useMemo(() => ({
    countries: definition.fields.some((field) => field.kind === "country"),
    universities: definition.fields.some((field) => field.kind === "university"),
    scholarships: definition.fields.some((field) => field.kind === "scholarship"),
  }), [definition.fields]);
  const selectors = useContentSelectors(relationships);
  const create = useCreateContent(resource);
  const update = useUpdateContent(resource);
  const [submitError, setSubmitError] = useState<string>();
  const form = useForm<ContentFormValues>({ defaultValues: initialContentValues(resource) });
  const { register, handleSubmit, reset, setError, formState } = form;
  const imageField = resource === "articles" ? "coverImageUrl" : "imageUrl";
  const hasImageField = definition.fields.some((field) => field.name === imageField);
  const watchedImage = useWatch({ control: form.control, name: imageField });
  const selectedCountryId = useWatch({ control: form.control, name: "countryId" });
  const selectedUniversityId = useWatch({ control: form.control, name: "universityId" });
  const selectedScholarshipId = useWatch({ control: form.control, name: "scholarshipId" });
  const relationshipValue = (value: unknown) => typeof value === "string" ? value : undefined;

  useEffect(() => {
    if (detail.data) {
      reset(initialContentValues(resource, detail.data as ContentRecord));
    }
  }, [detail.data, reset, resource]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) { if (formState.isDirty) event.preventDefault(); }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [formState.isDirty]);

  async function submit(values: ContentFormValues) {
    setSubmitError(undefined);
    const validation = validateContentValues(resource, values);
    if (Object.keys(validation).length) {
      for (const [name, message] of Object.entries(validation)) setError(name, { type: "validate", message });
      return;
    }
    const oldStatus = (detail.data as ContentRecord | undefined)?.status;
    const newStatus = values.status;
    if (oldStatus !== newStatus && (newStatus === "PUBLISHED" || newStatus === "ARCHIVED") && !window.confirm("هل تريد تأكيد تغيير الحالة التحريرية؟")) return;
    try {
      const payload = toContentPayload(resource, values);
      const result = id ? await update.mutateAsync({ id, input: payload }) : await create.mutateAsync(payload);
      router.replace(`/admin/${resource}/${result.id}`);
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error);
      for (const [name, messages] of Object.entries(fieldErrors)) setError(name, { type: "server", message: messages[0] });
      const normalized = normalizeApiError(error);
      if (normalized.kind !== "cancelled") setSubmitError(normalized.kind === "network" ? "تعذّر الاتصال بالخادم. لم تُفقد بيانات النموذج." : "تعذّر حفظ التغييرات. راجع الحقول ثم حاول مرة أخرى.");
    }
  }

  if (id && detail.isPending) return <LoadingState />;
  if (id && detail.isError) return <ErrorState action={<button type="button" onClick={() => void detail.refetch()} className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-bold text-white">إعادة المحاولة</button>} />;
  const preview = typeof watchedImage === "string" ? watchedImage.trim() : undefined;
  const errors = formState.errors as Record<string, { message?: string }>;
  const formId = `content-form-${resource}-${id ?? "new"}`;
  const isPending = create.isPending || update.isPending;
  const submitLabel = id ? "حفظ التغييرات" : createSubmitLabels[resource];

  return <section className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-[var(--gold)]">إدارة المحتوى</p><h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">{id ? `تعديل ${definition.singular}` : `إضافة ${definition.singular}`}</h2></div><Link href={`/admin/${resource}`} className="text-sm font-bold text-[var(--navy)] underline">العودة إلى القائمة</Link></div>
    <form id={formId} noValidate onSubmit={(event) => { form.clearErrors(); void handleSubmit(submit)(event); }} className="space-y-6 rounded-2xl border border-[var(--line)] bg-white p-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] shadow-sm sm:p-7">
      {submitError ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{submitError}</p> : null}
      <div className="grid gap-5 md:grid-cols-2">{definition.fields.map((field) => <Field key={field.name} resource={resource} field={field} register={register} error={errors[field.name]?.message} countries={selectors.countries.data?.items ?? []} universities={selectors.universities.data?.items ?? []} scholarships={selectors.scholarships.data?.items ?? []} selectedCountryId={relationshipValue(selectedCountryId)} currentValue={field.name === "countryId" ? relationshipValue(selectedCountryId) : field.name === "universityId" ? relationshipValue(selectedUniversityId) : field.name === "scholarshipId" ? relationshipValue(selectedScholarshipId) : undefined} />)}</div>
      {resource === "articles" ? <div className="space-y-4"><ArticleBlockEditor control={form.control} name="bodyAr" label="محتوى المقال بالعربية" required error={errors.bodyAr?.message} /><ArticleBlockEditor control={form.control} name="bodyEn" label="محتوى المقال بالإنجليزية" error={errors.bodyEn?.message} /></div> : null}
      {hasImageField ? <ImagePreview url={preview} /> : null}
      <div className="hidden flex-wrap gap-3 border-t border-[var(--line)] pt-5 sm:flex"><button type="submit" disabled={isPending} className="h-11 rounded-lg bg-[var(--navy)] px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{isPending ? "جارٍ الحفظ…" : submitLabel}</button><Link href={`/admin/${resource}`} className="inline-flex h-11 items-center rounded-lg border border-[var(--line)] px-5 text-sm font-bold text-[var(--navy)]">إلغاء</Link></div>
    </form>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,35,66,0.12)] backdrop-blur sm:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }} aria-label="إجراءات النموذج">
      <div className="mx-auto flex max-w-xl gap-3"><button type="submit" form={formId} disabled={isPending} className="h-11 min-w-0 flex-1 rounded-lg bg-[var(--navy)] px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{isPending ? "جارٍ الحفظ…" : submitLabel}</button><Link href={`/admin/${resource}`} className="inline-flex h-11 items-center rounded-lg border border-[var(--line)] px-4 text-sm font-bold text-[var(--navy)]">إلغاء</Link></div>
    </div>
  </section>;
}
