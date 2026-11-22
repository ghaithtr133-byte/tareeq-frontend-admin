"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import type { AdminContentResource, Article, ContentRecord } from "@/lib/api-client/content";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { ArticleBlockEditor } from "@/components/content/article-block-editor";
import { ArticleScholarships } from "@/components/content/article-scholarships";
import { DetailCollectionManager } from "@/components/content/detail-collection-manager";
import { DirectorySelector } from "@/components/universities/controls";
import { ImageUpload } from "@/components/media/image-upload";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { useCreateContent, useUpdateContent } from "@/hook/mutations/use-content-mutations";
import { useContentDetail, useContentSelectors } from "@/hook/queries/use-content-queries";
import { contentDefinitions, type ContentFieldDefinition } from "@/lib/content-config";
import { initialContentValues, parentSaveDestination, supportsContentDetails, toContentPatch, toContentPayload, type ContentFormValues, type ParentCreateIntent, validateContentValues } from "@/lib/content-form";
import { StaleContentSessionError } from "@/lib/content-session";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-900 focus:border-[var(--gold)]";
const createSubmitLabels: Record<AdminContentResource, string> = {
  countries: "إضافة الدولة",
  universities: "إضافة الجامعة",
  scholarships: "إضافة المنحة",
  services: "إضافة الخدمة",
  articles: "إنشاء المقال",
};

type RelationshipOption = { id: string; label: string; countryId?: string };
type LookupState = { isFetching: boolean; isError: boolean; refetch: () => Promise<unknown> };

function fieldDirection(field: ContentFieldDefinition): "rtl" | "ltr" {
  if (field.kind === "url" || field.kind === "number" || field.kind === "datetime-local") return "ltr";
  if (field.name === "slug" || field.name.endsWith("En") || field.name === "officialName") return "ltr";
  return "rtl";
}

function RelationshipSelector({ id, field, options, currentValue, register, error, lookup }: {
  id: string;
  field: ContentFieldDefinition;
  options: RelationshipOption[];
  currentValue?: string;
  register: ReturnType<typeof useForm<ContentFormValues>>["register"];
  error?: string;
  lookup?: LookupState;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("ar");
  const current = options.find((option) => option.id === currentValue) ?? (currentValue ? { id: currentValue, label: `${currentValue} (مختار)` } : undefined);
  const matches = options.filter((option) => !normalizedQuery || option.label.toLocaleLowerCase("ar").includes(normalizedQuery));
  const visible = current && !matches.some((option) => option.id === current.id) ? [current, ...matches] : matches;
  const common = { id, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined };

  return <div className="mt-1 space-y-2">
    <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={`البحث في ${field.label}`} placeholder={`ابحث في ${field.label}`} className={inputClass} />
    <select {...common} className={inputClass} {...register(field.name)} value={currentValue ?? ""}>
      <option value="">{field.nullable ? "بلا ارتباط" : "اختر عنصرًا"}</option>
      {visible.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select>
    {lookup?.isFetching ? <p role="status" className="text-sm">جارٍ تحميل الخيارات…</p> : lookup?.isError ? <p role="alert" className="text-sm text-red-700">تعذّر تحميل خيارات {field.label}. <button type="button" className="underline" onClick={() => void lookup.refetch()}>إعادة تحميل خيارات {field.label}</button></p> : visible.length === 0 ? <p className="text-xs text-[var(--muted)]">لا توجد نتائج مطابقة.</p> : null}
  </div>;
}

function Field({ resource, field, register, error, countries, universities, scholarships, selectedCountryId, currentValue, onCityChange, lookup }: {
  resource: AdminContentResource;
  field: ContentFieldDefinition;
  register: ReturnType<typeof useForm<ContentFormValues>>["register"];
  error?: string;
  countries: { id: string; nameAr: string }[];
  universities: { id: string; nameAr: string; countryId: string }[];
  scholarships: { id: string; titleAr: string }[];
  selectedCountryId?: string;
  currentValue?: string;
  onCityChange: (value: string) => void;
  lookup?: LookupState;
}) {
  const id = `${resource}-${field.name}`;
  const direction = fieldDirection(field);
  const directionalClass = direction === "ltr" ? "text-left" : "text-right";
  const common = { id, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined };
  let control: React.ReactNode;
  if (field.kind === "city") return <div><p className="text-sm font-semibold">{field.label}</p><DirectorySelector key={selectedCountryId} kind="cities" label={field.label} countryId={selectedCountryId} value={currentValue ?? ""} onChange={onCityChange} />{field.hint ? <p className="text-xs">{field.hint}</p> : null}{error ? <p role="alert">{error}</p> : null}</div>;
  if (field.kind === "checkbox") control = <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-[var(--navy)]"><input id={id} type="checkbox" className="size-5 accent-[var(--navy)]" {...register(field.name)} />{field.label}</label>;
  else if (field.kind === "textarea") control = <textarea {...common} dir={direction} rows={5} maxLength={field.maxLength} className={`${inputClass} ${directionalClass}`} {...register(field.name)} />;
  else if (field.kind === "select") control = <select {...common} className={inputClass} {...register(field.name)}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  else if (field.kind === "country" || field.kind === "university" || field.kind === "scholarship") {
    const options = field.kind === "country"
      ? countries.map((item) => ({ id: item.id, label: item.nameAr }))
      : field.kind === "university"
        ? universities.filter((item) => !selectedCountryId || item.countryId === selectedCountryId).map((item) => ({ id: item.id, label: item.nameAr }))
        : scholarships.map((item) => ({ id: item.id, label: item.titleAr }));
    control = <RelationshipSelector id={id} field={field} options={options} currentValue={currentValue} register={register} error={error} lookup={lookup} />;
  } else control = <input {...common} type={field.kind === "datetime-local" ? "datetime-local" : field.kind === "number" ? "number" : field.kind === "url" ? "url" : "text"} step={field.kind === "datetime-local" ? "any" : undefined} dir={direction} maxLength={field.maxLength} min={field.kind === "number" ? 0 : undefined} max={field.kind === "number" ? 1000000 : undefined} className={`${inputClass} ${directionalClass}`} {...register(field.name)} />;
  return <div className={field.kind === "checkbox" ? "rounded-lg border border-[var(--line)] px-4 py-3" : ""}>{field.kind === "checkbox" ? control : <><label htmlFor={id} className="text-sm font-semibold text-[var(--navy)]">{field.label}{field.required ? " *" : ""}</label>{control}</>}{field.hint ? <p className="mt-1 text-xs text-[var(--muted)]">{field.hint}</p> : null}{error ? <p id={`${id}-error`} className="mt-1 text-sm text-red-700" role="alert">{error}</p> : null}</div>;
}

function ImagePreview({ url }: { url?: string }) {
  const validUrl = Boolean(url && /^https?:\/\//.test(url));
  const [state, setState] = useState<"empty" | "invalid" | "loading" | "loaded" | "unavailable">(
    !url ? "empty" : validUrl ? "loading" : "invalid",
  );

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
  const [relationshipChecks, setRelationshipChecks] = useState(0);
  const createIntent = useRef<ParentCreateIntent>("finish");
  const form = useForm<ContentFormValues>({ defaultValues: initialContentValues(resource) });
  const { register, handleSubmit, reset, setError, formState } = form;
  const imageField = resource === "articles" ? "coverImageUrl" : "imageUrl";
  const hasImageField = definition.fields.some((field) => field.name === imageField);
  const watchedImage = useWatch({ control: form.control, name: imageField });
  const watchedOverviewImage = useWatch({ control: form.control, name: "overviewImageUrl" });
  const selectedCountryId = useWatch({ control: form.control, name: "countryId" });
  const selectedCityId = useWatch({ control: form.control, name: "cityId" });
  const selectedUniversityId = useWatch({ control: form.control, name: "universityId" });
  const selectedScholarshipId = useWatch({ control: form.control, name: "scholarshipId" });
  const selectedScholarshipIds = useWatch({ control: form.control, name: "scholarshipIds" });
  const relationshipValue = (value: unknown) => typeof value === "string" ? value : undefined;

  async function countryChanged(countryId: string) {
    if (resource === "universities") {
      if (countryId !== selectedCountryId) form.setValue("cityId", "", { shouldDirty: true });
      return;
    }
    if (!["articles", "scholarships"].includes(resource) || !countryId) return;
    const universityId = relationshipValue(form.getValues("universityId")); if (!universityId) return;
    setRelationshipChecks(count => count + 1);
    try {
      const result = selectors.universities.isError || !selectors.universities.data ? await selectors.universities.refetch() : selectors.universities;
      if (form.getValues("countryId") !== countryId || form.getValues("universityId") !== universityId) return;
      if (result.isError || !result.data) { setError("universityId", { message: "تعذّر التحقق من ارتباط الجامعة. أعد تحميل الخيارات أو اختر بلا ارتباط." }); return; }
      const university = result.data.items.find(item => item.id === universityId);
      if (!university || university.countryId !== countryId) form.setValue("universityId", "", { shouldDirty: true });
    } finally { setRelationshipChecks(count => count - 1); }
  }

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
    const baseline = detail.data ? initialContentValues(resource, detail.data as ContentRecord) : undefined;
    const relationshipsChanged = !baseline || values.countryId !== baseline.countryId || values.universityId !== baseline.universityId;
    if (["articles", "scholarships"].includes(resource) && relationshipsChanged && values.countryId && values.universityId) {
      const university = selectors.universities.data?.items.find(item => item.id === values.universityId);
      if (relationshipChecks || selectors.universities.isError || !university || university.countryId !== values.countryId) { setError("universityId", { message: "تحقق من جامعة تابعة للدولة المختارة؛ لم تُرسل العلاقات غير المتوافقة." }); return; }
    }
    const oldStatus = (detail.data as ContentRecord | undefined)?.status;
    const newStatus = values.status;
    if (oldStatus !== newStatus && (newStatus === "PUBLISHED" || newStatus === "ARCHIVED") && !window.confirm("هل تريد تأكيد تغيير الحالة التحريرية؟")) return;
    try {
      const payload = id && detail.data ? toContentPatch(resource, values, detail.data as ContentRecord) : toContentPayload(resource, values);
      const result = id ? await update.mutateAsync({ id, input: payload }) : await create.mutateAsync(payload);
      router.replace(parentSaveDestination(resource, result.id, createIntent.current, Boolean(id)));
    } catch (error) {
      if (error instanceof StaleContentSessionError) return;
      const fieldErrors = getApiFieldErrors(error);
      for (const [name, messages] of Object.entries(fieldErrors)) setError(name, { type: "server", message: messages[0] });
      const normalized = normalizeApiError(error);
      if (normalized.kind !== "cancelled") setSubmitError(error instanceof Error && error.message === "لا توجد تغييرات للحفظ." ? error.message : normalized.kind === "network" ? "تعذّر الاتصال بالخادم. لم تُفقد بيانات النموذج." : "تعذّر حفظ التغييرات. راجع الحقول ثم حاول مرة أخرى.");
    }
  }

  if (id && detail.isPending) return <LoadingState />;
  if (id && detail.isError) return <ErrorState action={<button type="button" onClick={() => void detail.refetch()} className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-bold text-white">إعادة المحاولة</button>} />;
  const preview = typeof watchedImage === "string" ? watchedImage.trim() : undefined;
  const errors = formState.errors as Record<string, { message?: string }>;
  const formId = `content-form-${resource}-${id ?? "new"}`;
  const isPending = create.isPending || update.isPending || relationshipChecks > 0;
  const submitLabel = id ? "حفظ التغييرات" : createSubmitLabels[resource];
  const canContinueToDetails = !id && supportsContentDetails(resource);

  return <section className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-[var(--gold)]">إدارة المحتوى</p><h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">{id ? `تعديل ${definition.singular}` : `إضافة ${definition.singular}`}</h2></div><Link href={`/admin/${resource}`} className="text-sm font-bold text-[var(--navy)] underline">العودة إلى القائمة</Link></div>
    <form id={formId} noValidate onSubmit={(event) => { form.clearErrors(); void handleSubmit(submit)(event); }} className="space-y-6 rounded-2xl border border-[var(--line)] bg-white p-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] shadow-sm sm:p-7">
      {submitError ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{submitError}</p> : null}
      <div className="grid gap-5 md:grid-cols-2">{definition.fields.filter(field => field.kind !== "scholarships").map((field) => <Field key={field.name} resource={resource} field={field} register={field.name === "countryId" ? ((name, options) => register(name, { ...options, onChange: event => countryChanged(event.target.value) })) : register} error={errors[field.name]?.message} countries={selectors.countries.data?.items ?? []} universities={selectors.universities.data?.items ?? []} scholarships={selectors.scholarships.data?.items ?? []} lookup={field.kind === "country" ? selectors.countries : field.kind === "university" ? selectors.universities : field.kind === "scholarship" ? selectors.scholarships : undefined} selectedCountryId={relationshipValue(selectedCountryId)} onCityChange={value => form.setValue("cityId", value, { shouldDirty: true })} currentValue={field.name === "cityId" ? relationshipValue(selectedCityId) : field.name === "countryId" ? relationshipValue(selectedCountryId) : field.name === "universityId" ? relationshipValue(selectedUniversityId) : field.name === "scholarshipId" ? relationshipValue(selectedScholarshipId) : undefined} />)}</div>
      {resource === "articles" ? <ArticleScholarships value={Array.isArray(selectedScholarshipIds) ? selectedScholarshipIds as string[] : []} selected={(detail.data as Article | undefined)?.relatedScholarships} onChange={ids => form.setValue("scholarshipIds", ids, { shouldDirty: true })} disabled={isPending} error={errors.scholarshipIds?.message} /> : null}
      {resource === "articles" ? <div className="space-y-4"><ArticleBlockEditor control={form.control} name="bodyAr" label="محتوى المقال بالعربية" required error={errors.bodyAr?.message} /><ArticleBlockEditor control={form.control} name="bodyEn" label="محتوى المقال بالإنجليزية" error={errors.bodyEn?.message} /></div> : null}
      {hasImageField ? <ImagePreview key={preview ?? ""} url={preview} /> : null}
      {hasImageField ? <ImageUpload resource={resource} disabled={isPending} onUploaded={url => form.setValue(imageField, url, { shouldDirty: true })} /> : null}
      {resource === "countries" ? <div className="space-y-3"><h3 className="text-base font-bold text-[var(--navy)]">صورة النظرة العامة</h3><ImagePreview key={`overview-${typeof watchedOverviewImage === "string" ? watchedOverviewImage : ""}`} url={typeof watchedOverviewImage === "string" ? watchedOverviewImage.trim() : undefined} /><ImageUpload resource="countries" disabled={isPending} onUploaded={url => form.setValue("overviewImageUrl", url, { shouldDirty: true })} /></div> : null}
      <div className="hidden flex-wrap gap-3 border-t border-[var(--line)] pt-5 sm:flex">{canContinueToDetails ? <><button type="submit" disabled={isPending} onClick={() => { createIntent.current = "finish"; }} className="h-11 rounded-lg bg-[var(--navy)] px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{isPending ? "جارٍ الحفظ…" : "حفظ وإنهاء"}</button><button type="submit" disabled={isPending} onClick={() => { createIntent.current = "details"; }} className="h-11 rounded-lg border border-[var(--navy)] px-5 text-sm font-bold text-[var(--navy)] disabled:cursor-wait disabled:opacity-60">حفظ ومتابعة العناصر التفصيلية</button></> : <button type="submit" disabled={isPending} onClick={() => { createIntent.current = "finish"; }} className="h-11 rounded-lg bg-[var(--navy)] px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{isPending ? "جارٍ الحفظ…" : submitLabel}</button>}<Link href={`/admin/${resource}`} className="inline-flex h-11 items-center rounded-lg border border-[var(--line)] px-5 text-sm font-bold text-[var(--navy)]">إلغاء</Link></div>
    </form>
    {id && (resource === "countries" || resource === "services" || resource === "scholarships") ? <DetailCollectionManager resource={resource} parentId={id} /> : null}
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,35,66,0.12)] backdrop-blur sm:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }} aria-label="إجراءات النموذج">
      <div className="mx-auto flex max-w-xl flex-wrap gap-3">{canContinueToDetails ? <><button type="submit" form={formId} disabled={isPending} onClick={() => { createIntent.current = "finish"; }} className="h-11 min-w-0 flex-1 rounded-lg bg-[var(--navy)] px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{isPending ? "جارٍ الحفظ…" : "حفظ وإنهاء"}</button><button type="submit" form={formId} disabled={isPending} onClick={() => { createIntent.current = "details"; }} className="min-h-11 rounded-lg border border-[var(--navy)] px-4 text-sm font-bold text-[var(--navy)] disabled:cursor-wait disabled:opacity-60">متابعة التفاصيل</button></> : <button type="submit" form={formId} disabled={isPending} onClick={() => { createIntent.current = "finish"; }} className="h-11 min-w-0 flex-1 rounded-lg bg-[var(--navy)] px-4 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{isPending ? "جارٍ الحفظ…" : submitLabel}</button>}<Link href={`/admin/${resource}`} className="inline-flex h-11 items-center rounded-lg border border-[var(--line)] px-4 text-sm font-bold text-[var(--navy)]">إلغاء</Link></div>
    </div>
  </section>;
}
