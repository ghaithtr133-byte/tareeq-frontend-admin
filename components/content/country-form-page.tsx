"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import type { Country, PublicationStatus } from "@/lib/api-client/content";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { CountryImageCard } from "@/components/content/country-image-card";
import { DetailCollectionManager } from "@/components/content/detail-collection-manager";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InfoIcon,
  SpinnerIcon,
} from "@/components/ui/admin-icons";
import { useCreateContent, useUpdateContent } from "@/hook/mutations/use-content-mutations";
import { useContentDetail } from "@/hook/queries/use-content-queries";
import { publicationStatusOptions } from "@/lib/content-config";
import {
  applyCountrySeoDefaults,
  initialContentValues,
  toContentPatch,
  toContentPayload,
  validateContentValues,
  type ContentFormValues,
} from "@/lib/content-form";
import { COUNTRY_FIELD_FOCUS_ORDER, COUNTRY_SECTION_ANCHORS, resolveAutoCountrySlug } from "@/lib/country-form-helpers";
import { StaleContentSessionError } from "@/lib/content-session";

const textInputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-base text-[var(--navy)] placeholder:text-[var(--muted)]/65 hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none";

const textareaBaseClass =
  "mt-1.5 w-full resize-y rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-base leading-7 text-[var(--navy)] placeholder:text-[var(--muted)]/65 hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none";

const statusLabelMap: Record<PublicationStatus, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشورة",
  ARCHIVED: "مؤرشفة",
};

function SectionHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-[var(--line)] pb-3">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-6 min-w-7 items-center justify-center rounded-md bg-[var(--gold-soft)] px-1.5 font-mono text-xs font-semibold text-[var(--gold-dark)] tabular-nums">
          {step}
        </span>
        <h3 className="text-[18px] sm:text-[19px] font-bold text-[var(--navy)]">{title}</h3>
      </div>
      {description ? (
        <p className="mt-1 text-[14px] leading-6 text-[var(--muted)]">{description}</p>
      ) : null}
    </div>
  );
}

export function CountryFormPage({ id }: { id?: string }) {
  const router = useRouter();
  const isEditMode = Boolean(id);
  const detail = useContentDetail("countries", id);
  const create = useCreateContent("countries");
  const update = useUpdateContent("countries");

  const form = useForm<ContentFormValues>({
    defaultValues: initialContentValues("countries"),
    shouldUnregister: false,
  });

  const { register, handleSubmit, reset, setError, setValue, getValues, clearErrors, formState } =
    form;

  const [submitError, setSubmitError] = useState<string>();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [overviewImageUploading, setOverviewImageUploading] = useState(false);

  const submissionRef = useRef(false);
  const mainImageUploadRef = useRef(false);
  const overviewImageUploadRef = useRef(false);
  const formId = `country-form-${id ?? "new"}`;

  const watchedNameAr = useWatch({ control: form.control, name: "nameAr" });
  const watchedNameEn = useWatch({ control: form.control, name: "nameEn" });
  const watchedSlug = useWatch({ control: form.control, name: "slug" });
  const watchedImageUrl = useWatch({ control: form.control, name: "imageUrl" });
  const watchedOverviewUrl = useWatch({ control: form.control, name: "overviewImageUrl" });
  const watchedFeatured = useWatch({ control: form.control, name: "featured" });
  const watchedStatus = useWatch({ control: form.control, name: "status" });

  const countryRecord = detail.data as Country | undefined;
  const originallyPublished = isEditMode && countryRecord?.status === "PUBLISHED";

  useEffect(() => {
    if (countryRecord) {
      reset(initialContentValues("countries", countryRecord));
    }
  }, [countryRecord, reset]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (formState.isDirty) event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [formState.isDirty]);

  const slugResolution = useMemo(
    () =>
      resolveAutoCountrySlug({
        nameAr: typeof watchedNameAr === "string" ? watchedNameAr : "",
        nameEn: typeof watchedNameEn === "string" ? watchedNameEn : "",
        currentSlug: typeof watchedSlug === "string" ? watchedSlug : "",
        slugManuallyEdited,
        isEditMode,
        isPublished: originallyPublished,
      }),
    [watchedNameAr, watchedNameEn, watchedSlug, slugManuallyEdited, isEditMode, originallyPublished],
  );

  const currentSlug = typeof watchedSlug === "string" ? watchedSlug.trim() : "";
  const currentNameAr = typeof watchedNameAr === "string" ? watchedNameAr.trim() : "";
  const needsSlugFallback =
    !isEditMode &&
    currentNameAr.length >= 2 &&
    !slugManuallyEdited &&
    slugResolution.source === "none" &&
    !currentSlug;

  function syncAutoFieldsOnNameChange(nextNameAr: string, nextNameEn: string) {
    if (isEditMode) return;

    if (!slugManuallyEdited) {
      const next = resolveAutoCountrySlug({
        nameAr: nextNameAr,
        nameEn: nextNameEn,
        currentSlug: String(getValues("slug") ?? ""),
        slugManuallyEdited: false,
        isEditMode: false,
        isPublished: false,
      });
      if (next.slug !== String(getValues("slug") ?? "")) {
        setValue("slug", next.slug, {
          shouldDirty: Boolean(next.slug),
          shouldValidate: Boolean(formState.errors.slug),
        });
        if (next.slug) clearErrors("slug");
      }
    }

  }

  function focusFirstInvalid(errorMap: Record<string, string>) {
    const keys = Object.keys(errorMap);
    if (!keys.length) return;

    const firstKey =
      COUNTRY_FIELD_FOCUS_ORDER.find((field) => field in errorMap) ?? keys[0];

    const fallbackVisible = needsSlugFallback && firstKey === "slug";
    const targetId =
      fallbackVisible ? "countries-slug-fallback" : `countries-${firstKey}`;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.focus({ preventScroll: true });
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
  }

  async function submit(values: ContentFormValues) {
    setSubmitError(undefined);
    if (mainImageUploadRef.current || overviewImageUploadRef.current) {
      setSubmitError("انتظر اكتمال رفع الصورة قبل الحفظ. لم تُرسل أي تغييرات بعد.");
      return;
    }
    Object.assign(values, applyCountrySeoDefaults(values, countryRecord));
    const validation = validateContentValues("countries", values);
    if (Object.keys(validation).length) {
      for (const [name, message] of Object.entries(validation)) {
        setError(name, { type: "validate", message });
      }
      focusFirstInvalid(validation);
      return;
    }

    const oldStatus = countryRecord?.status;
    const newStatus = values.status;
    if (
      oldStatus !== newStatus &&
      (newStatus === "PUBLISHED" || newStatus === "ARCHIVED") &&
      !window.confirm("هل تريد تأكيد تغيير الحالة التحريرية؟")
    ) {
      return;
    }

    if (submissionRef.current || create.isPending || update.isPending) return;
    submissionRef.current = true;
    try {
      const payload =
        id && countryRecord
          ? toContentPatch("countries", values, countryRecord, {
              statusChanged: Boolean(formState.dirtyFields.status),
            })
          : toContentPayload("countries", values);
      if (id) await update.mutateAsync({ id, input: payload });
      else await create.mutateAsync(payload);
      router.replace("/admin/countries");
    } catch (error) {
      if (error instanceof StaleContentSessionError) return;
      const fieldErrors = getApiFieldErrors(error);
      const flatFieldErrors: Record<string, string> = {};
      for (const [name, messages] of Object.entries(fieldErrors)) {
        const msg = messages[0] ?? "قيمة غير صالحة.";
        flatFieldErrors[name] = msg;
        setError(name, { type: "server", message: msg });
      }
      const normalized = normalizeApiError(error);
      if (normalized.kind !== "cancelled") {
        setSubmitError(
          error instanceof Error && error.message === "لا توجد تغييرات للحفظ."
            ? error.message
            : normalized.kind === "network"
              ? "تعذّر الاتصال بالخادم. لم تُفقد بيانات النموذج."
              : "تعذّر حفظ بيانات الدولة. راجع الحقول المطلوبة ثم حاول مرة أخرى.",
        );
        if (Object.keys(flatFieldErrors).length) {
          focusFirstInvalid(flatFieldErrors);
        }
      }
    } finally {
      submissionRef.current = false;
    }
  }

  if (id && detail.isPending) return <LoadingState />;
  if (id && detail.isError) {
    return (
      <ErrorState
        action={
          <button
            type="button"
            onClick={() => void detail.refetch()}
            className="rounded-xl bg-[var(--navy)] px-4 py-2 text-[15px] font-bold text-white"
          >
            إعادة المحاولة
          </button>
        }
      />
    );
  }

  const errors = formState.errors as Record<string, { message?: string }>;
  const isImageUploadPending = mainImageUploading || overviewImageUploading;
  const isPending = create.isPending || update.isPending || isImageUploadPending;
  const currentStatus = (typeof watchedStatus === "string"
    ? watchedStatus
    : "DRAFT") as PublicationStatus;
  const nameArReg = register("nameAr");
  const introArReg = register("introductionAr");

  return (
    <section className="mx-auto max-w-5xl space-y-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pb-6">
      {/* Page Header */}
      <header className="flex flex-col justify-between gap-3.5 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[13px] font-semibold text-[var(--gold-dark)]">إدارة الدول</span>
            {isEditMode && countryRecord ? (
              <span className="inline-flex items-center rounded-md border border-[var(--line)] bg-[var(--surface-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--navy)]">
                الحالة: {statusLabelMap[countryRecord.status]}
              </span>
            ) : null}
          </div>
          <h2 className="text-[24px] sm:text-[28px] font-bold leading-tight text-[var(--navy)]">
            {isEditMode
              ? `تعديل الدولة${countryRecord?.nameAr ? `: ${countryRecord.nameAr}` : ""}`
              : "إضافة دولة جديدة"}
          </h2>
          <p className="max-w-2xl text-[14px] sm:text-[15px] leading-6 text-[var(--muted)]">
            أضف بيانات الوجهة الدراسية وملخصات القبول والتكاليف والصور بخطوات مركّزة وواضحة.
          </p>
        </div>

        <Link
          href="/admin/countries"
          className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-xl border border-[var(--line)] bg-white px-3.5 text-[14px] font-bold text-[var(--navy)] transition-colors hover:border-[var(--line-strong)] hover:bg-slate-50 sm:self-auto"
        >
          <ChevronRightIcon className="size-4" />
          <span>العودة إلى الدول</span>
        </Link>
      </header>

      {/* Simplified 4-Group Desktop Section Jump Bar */}
      <nav
        aria-label="أقسام نموذج الدولة"
        className="hidden items-center gap-1 rounded-xl border border-[var(--line)] bg-white p-1.5 shadow-[var(--shadow-card)] lg:flex"
      >
        {COUNTRY_SECTION_ANCHORS.map((anchor, index) => (
          <a
            key={anchor.id}
            href={`#${anchor.id}`}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[14px] font-semibold text-[var(--navy)]/80 transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--navy)]"
          >
            <span className="font-mono text-xs font-semibold text-[var(--gold-dark)] tabular-nums">
              0{index + 1}
            </span>
            <span>{anchor.label}</span>
          </a>
        ))}
        {isEditMode ? (
          <a
            href="#content-details"
            className="mr-auto inline-flex items-center rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold-soft)]/50"
          >
            دليل الدراسة ↓
          </a>
        ) : null}
      </nav>

      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          clearErrors();
          void handleSubmit(submit)(event);
        }}
        className="space-y-4"
      >
        {/* Group 01: المعلومات الأساسية */}
        <section
          id="country-group-basic"
          className="scroll-mt-24 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-5"
        >
          <SectionHeader
            step="01"
            title="المعلومات الأساسية"
            description="اسم الدولة والمقدمة المختصرة والنظرة العامة التي تظهر للطلبة في صفحة الوجهة."
          />

          <div className="space-y-4">
            <div>
              <label
                htmlFor="countries-nameAr"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                اسم الدولة بالعربية <span className="text-red-700">*</span>
              </label>
              <input
                id="countries-nameAr"
                type="text"
                dir="rtl"
                maxLength={200}
                placeholder="مثال: تركيا، ألمانيا، ماليزيا، الأردن"
                aria-invalid={Boolean(errors.nameAr?.message)}
                aria-describedby={errors.nameAr?.message ? "countries-nameAr-error" : undefined}
                className={textInputClass}
                {...nameArReg}
                onChange={(event) => {
                  nameArReg.onChange(event);
                  syncAutoFieldsOnNameChange(
                    event.target.value,
                    String(getValues("nameEn") ?? ""),
                  );
                }}
              />
              {errors.nameAr?.message ? (
                <p
                  id="countries-nameAr-error"
                  role="alert"
                  className="mt-1.5 text-[13px] font-medium text-red-700"
                >
                  {errors.nameAr.message}
                </p>
              ) : null}

              {currentSlug ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] px-3.5 py-2">
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--muted)]">
                    <span>رابط الصفحة:</span>
                    <code dir="ltr" className="font-mono text-[13px] font-medium text-[var(--navy)]">
                      /countries/{currentSlug}
                    </code>
                  </div>
                </div>
              ) : null}

              {needsSlugFallback ? (
                <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/75 p-3.5">
                  <label
                    htmlFor="countries-slug-fallback"
                    className="block text-[14px] font-semibold text-[var(--navy)]"
                  >
                    معرّف الرابط الإنجليزي المختصر <span className="text-red-700">*</span>
                  </label>
                  <p className="mt-1 text-[13px] leading-6 text-[var(--muted)]">
                    لم نتمكن من استنتاج رابط صفحة إنجليزي تلقائيًا لهذا الاسم. أدخل اسمًا مختصرًا بالأحرف الإنجليزية الصغيرة (مثل{" "}
                    <code dir="ltr" className="font-mono text-[var(--navy)]">
                      kazakhstan
                    </code>
                    ):
                  </p>
                  <input
                    id="countries-slug-fallback"
                    type="text"
                    dir="ltr"
                    maxLength={120}
                    placeholder="kazakhstan"
                    value={typeof watchedSlug === "string" ? watchedSlug : ""}
                    onChange={(event) => {
                      setSlugManuallyEdited(true);
                      setValue("slug", event.target.value.toLowerCase(), {
                        shouldDirty: true,
                        shouldValidate: Boolean(errors.slug?.message),
                      });
                      clearErrors("slug");
                    }}
                    aria-invalid={Boolean(errors.slug?.message)}
                    className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-left font-mono text-base text-[var(--navy)] focus:border-[var(--gold)] focus:outline-none"
                  />
                  {errors.slug?.message ? (
                    <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-700">
                      {errors.slug.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="countries-introductionAr"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                وصف قصير تحت اسم الدولة <span className="text-red-700">*</span>
              </label>
              <textarea
                id="countries-introductionAr"
                dir="rtl"
                rows={2}
                maxLength={20000}
                placeholder="مثال: وجهة دراسية رائدة تجمع بين الجامعات المعترف بها وتكاليف المعيشة المناسبة."
                aria-invalid={Boolean(errors.introductionAr?.message)}
                aria-describedby={
                  errors.introductionAr?.message
                    ? "countries-introductionAr-error"
                    : "countries-introductionAr-hint"
                }
                className={textareaBaseClass}
                {...introArReg}
              />
              <p
                id="countries-introductionAr-hint"
                className="mt-1 text-[14px] leading-6 text-[var(--muted)]"
              >
                يظهر أسفل اسم الدولة مباشرة وفي بطاقة الوجهات.
              </p>
              {errors.introductionAr?.message ? (
                <p
                  id="countries-introductionAr-error"
                  role="alert"
                  className="mt-1 text-[13px] font-medium text-red-700"
                >
                  {errors.introductionAr.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="countries-detailsAr"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                نظرة عامة عن الدولة <span className="text-red-700">*</span>
              </label>
              <textarea
                id="countries-detailsAr"
                dir="rtl"
                rows={4}
                maxLength={20000}
                placeholder="اشرح بإيجاز بيئة التعليم العالي في الدولة، أبرز المدن الجامعية، ومستوى الاعتراف الأكاديمي بالشهادات..."
                aria-invalid={Boolean(errors.detailsAr?.message)}
                aria-describedby={
                  errors.detailsAr?.message ? "countries-detailsAr-error" : "countries-detailsAr-hint"
                }
                className={textareaBaseClass}
                {...register("detailsAr")}
              />
              <p id="countries-detailsAr-hint" className="mt-1 text-[14px] leading-6 text-[var(--muted)]">
                النص التعريفي الرئيسي لبيئة التعليم الجامعي في الدولة على الموقع العام.
              </p>
              {errors.detailsAr?.message ? (
                <p
                  id="countries-detailsAr-error"
                  role="alert"
                  className="mt-1 text-[13px] font-medium text-red-700"
                >
                  {errors.detailsAr.message}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Group 02: المحتوى والدليل */}
        <section
          id="country-group-content"
          className="scroll-mt-24 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-5"
        >
          <SectionHeader
            step="02"
            title="المحتوى والدليل"
            description="ملخصات لغة التدريس والقبول ومواعيد التقديم وتكاليف الدراسة والمعيشة."
          />

          <div className="space-y-4">
            <div>
              <label
                htmlFor="countries-studyLanguageAr"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                لغة الدراسة والمعلومات الأساسية للطلاب
              </label>
              <textarea
                id="countries-studyLanguageAr"
                dir="rtl"
                rows={2}
                maxLength={20000}
                placeholder="مثال: الدراسة بالإنجليزية واللغة المحلية مع توفر سنة تحضيرية للغة."
                aria-invalid={Boolean(errors.studyLanguageAr?.message)}
                className={textareaBaseClass}
                {...register("studyLanguageAr")}
              />
              {errors.studyLanguageAr?.message ? (
                <p role="alert" className="mt-1 text-[13px] font-medium text-red-700">
                  {errors.studyLanguageAr.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="countries-admissionSummaryAr"
                  className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
                >
                  ملخص شروط القبول والوثائق
                </label>
                <textarea
                  id="countries-admissionSummaryAr"
                  dir="rtl"
                  rows={3}
                  maxLength={20000}
                  placeholder="مثال: شهادة الثانوية العامة أو البكالوريوس مترجمة ومصدقة، كشف الدرجات، صورة جواز السفر، وشهادة اللغة إن وجدت."
                  aria-invalid={Boolean(errors.admissionSummaryAr?.message)}
                  className={textareaBaseClass}
                  {...register("admissionSummaryAr")}
                />
                {errors.admissionSummaryAr?.message ? (
                  <p role="alert" className="mt-1 text-[13px] font-medium text-red-700">
                    {errors.admissionSummaryAr.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="countries-applicationDatesSummaryAr"
                  className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
                >
                  مواعيد التقديم المتاحة
                </label>
                <textarea
                  id="countries-applicationDatesSummaryAr"
                  dir="rtl"
                  rows={3}
                  maxLength={20000}
                  placeholder="مثال: يفتح باب التقديم للفصل الدراسي الأول من مارس حتى أغسطس، وللفصل الثاني من أكتوبر حتى يناير."
                  aria-invalid={Boolean(errors.applicationDatesSummaryAr?.message)}
                  className={textareaBaseClass}
                  {...register("applicationDatesSummaryAr")}
                />
                {errors.applicationDatesSummaryAr?.message ? (
                  <p role="alert" className="mt-1 text-[13px] font-medium text-red-700">
                    {errors.applicationDatesSummaryAr.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label
                htmlFor="countries-tuitionSummaryAr"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                ملخص الرسوم الدراسية وتكاليف المعيشة
              </label>
              <textarea
                id="countries-tuitionSummaryAr"
                dir="rtl"
                rows={2}
                maxLength={20000}
                placeholder="مثال: الرسوم السنوية 600–2,500 دولار والمعيشة الشهرية نحو 400–650 دولارًا."
                aria-invalid={Boolean(errors.tuitionSummaryAr?.message)}
                className={textareaBaseClass}
                {...register("tuitionSummaryAr")}
              />
              {errors.tuitionSummaryAr?.message ? (
                <p role="alert" className="mt-1 text-[13px] font-medium text-red-700">
                  {errors.tuitionSummaryAr.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-[var(--gold-dark)]" />
                <p className="text-[14px] leading-6 text-[var(--navy)]">
                  <span className="font-semibold">نظام الدراسة والتخصصات: </span>
                  <span className="text-[var(--muted)]">
                    {isEditMode
                      ? "تُدار عناصر الدليل ومزاياه كبنود مرتبة في قسم «دليل الدراسة» أسفل الصفحة."
                      : "يمكنك إضافة خطوات ومزايا دليل الدراسة بعد حفظ الدولة ثم فتحها من القائمة."}
                  </span>
                </p>
              </div>
              {isEditMode ? (
                <a
                  href="#content-details"
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[var(--navy)] bg-white px-3 text-[13px] font-bold text-[var(--navy)] transition-colors hover:bg-slate-50 whitespace-nowrap"
                >
                  إدارة دليل الدراسة ↓
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {/* Group 03: الصور والمعلومات */}
        <section
          id="country-group-media"
          className="scroll-mt-24 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-5"
        >
          <SectionHeader
            step="03"
            title="الصور والمعلومات"
            description="صورة الغلاف وصورة النظرة العامة مع النص البديل المناسب بالعربية."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <CountryImageCard
              manualUrlAvailable={false}
              title="صورة غلاف الدولة"
              description="الصورة الرئيسية لبطاقة الدولة وأعلى صفحة الوجهة (نسبة أفقية واضحة)."
              urlFieldId="countries-imageUrl"
              altFieldId="countries-imageAltAr"
              urlValue={typeof watchedImageUrl === "string" ? watchedImageUrl : ""}
              urlError={errors.imageUrl?.message}
              altError={errors.imageAltAr?.message}
              altPlaceholder="مثال: الحرم الجامعي في إسطنبول"
              canClear={!isEditMode || !countryRecord?.imageUrl}
              disabled={isPending}
              onUploadPendingChange={(pending) => {
                mainImageUploadRef.current = pending;
                setMainImageUploading(pending);
              }}
              onUrlChange={(nextUrl) => {
                setValue("imageUrl", nextUrl, { shouldDirty: true, shouldValidate: true });
                clearErrors("imageUrl");
              }}
              urlInputProps={register("imageUrl")}
              altInputProps={register("imageAltAr")}
            />

            <CountryImageCard
              manualUrlAvailable={false}
              title="صورة النظرة العامة"
              description="صورة اختيارية تُعرض بجانب قسم النظرة العامة داخل صفحة الدولة."
              urlFieldId="countries-overviewImageUrl"
              altFieldId="countries-overviewImageAltAr"
              urlValue={typeof watchedOverviewUrl === "string" ? watchedOverviewUrl : ""}
              urlError={errors.overviewImageUrl?.message}
              altError={errors.overviewImageAltAr?.message}
              altPlaceholder="مثال: مكتبة جامعية حديثة للطلبة الدوليين"
              canClear
              disabled={isPending}
              onUploadPendingChange={(pending) => {
                overviewImageUploadRef.current = pending;
                setOverviewImageUploading(pending);
              }}
              onUrlChange={(nextUrl) => {
                setValue("overviewImageUrl", nextUrl, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                clearErrors("overviewImageUrl");
              }}
              urlInputProps={register("overviewImageUrl")}
              altInputProps={register("overviewImageAltAr")}
            />
          </div>
        </section>

        {/* Group 04: النشر والإعدادات */}
        <section
          id="country-group-publishing"
          className="scroll-mt-24 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-5"
        >
          <SectionHeader
            step="04"
            title="النشر والإعدادات"
            description="التحكم في حالة النشر والتمييز على الموقع العام."
          />

          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            <div>
              <label
                htmlFor="countries-status"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                الحالة التحريرية
              </label>
              <div className="relative mt-1.5">
                <select
                  id="countries-status"
                  value={currentStatus}
                  onChange={(event) =>
                    setValue("status", event.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="min-h-11 w-full appearance-none rounded-xl border border-[var(--line)] bg-white py-2.5 pr-3.5 pl-10 text-base font-medium text-[var(--navy)] hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
                >
                  {publicationStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted)]">
                «مسودة» تحفظ داخليًا فقط، و«منشور» تظهر الوجهة للزوار.
              </p>
            </div>

            <div className="md:pt-7">
              <SwitchToggle
                id="countries-featured"
                label="إظهار كدولة مميزة"
                description="تبرز هذه الدولة في الصفحة الرئيسية وقائمة الوجهات المقترحة."
                checked={Boolean(watchedFeatured)}
                showStarIcon
                onChange={(checked) =>
                  setValue("featured", checked, { shouldDirty: true })
                }
              />
            </div>
          </div>
        </section>

        {/* Save Actions (with General API Error placed clearly nearby) */}
        <section
          aria-label="حفظ بيانات الدولة"
          className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-5"
        >
          {submitError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-medium text-red-900"
            >
              <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-red-700" />
              <span>{submitError}</span>
            </div>
          ) : null}

          <div className="hidden flex-wrap items-center justify-between gap-3 sm:flex">
            <div className="flex flex-wrap items-center gap-3">
              <>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--navy)] px-6 text-[15px] font-bold text-white transition-colors hover:bg-[var(--navy-light)] disabled:cursor-wait disabled:opacity-60"
                  >
                    {isPending ? <SpinnerIcon className="size-4 animate-spin" /> : null}
                    <span>{isPending ? "جارٍ الحفظ…" : isEditMode ? "حفظ التغييرات" : "إضافة الدولة"}</span>
                  </button>
              </>

              <Link
                href="/admin/countries"
                className="inline-flex h-12 items-center rounded-xl border border-[var(--line)] bg-white px-5 text-[15px] font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50"
              >
                إلغاء
              </Link>
            </div>

            {formState.isDirty ? (
              <span className="text-[13px] font-medium text-[var(--gold-dark)]">
                توجد تعديلات غير محفوظة
              </span>
            ) : null}
          </div>

          <p className="text-[13px] text-[var(--muted)] sm:hidden">
            استخدم شريط الحفظ أسفل الشاشة لحفظ بيانات الدولة أو المتابعة إلى دليل الدراسة.
          </p>
        </section>
      </form>

      {/* Edit Mode: Study Guide Detail Collection Manager */}
      {id ? <DetailCollectionManager resource="countries" parentId={id} /> : null}

      {/* Mobile Sticky Action Bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 px-3.5 py-2.5 shadow-[0_-8px_24px_rgba(15,35,66,0.1)] backdrop-blur sm:hidden"
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
        aria-label="إجراءات نموذج الدولة"
      >
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <>
              <button
                type="submit"
                form={formId}
                disabled={isPending}
                className="h-11 min-w-0 flex-1 rounded-xl bg-[var(--navy)] px-3 text-[14px] font-bold text-white disabled:cursor-wait disabled:opacity-60"
              >
                {isPending ? "جارٍ الحفظ…" : isEditMode ? "حفظ التغييرات" : "إضافة الدولة"}
              </button>
          </>
          <Link
            href="/admin/countries"
            className="inline-flex h-11 shrink-0 items-center rounded-xl border border-[var(--line)] bg-white px-3 text-[14px] font-semibold text-[var(--navy)]"
          >
            إلغاء
          </Link>
        </div>
      </div>
    </section>
  );
}

