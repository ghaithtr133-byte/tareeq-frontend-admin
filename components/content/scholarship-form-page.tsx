"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import {
  getContentApi,
  type PublicationStatus,
  type Scholarship,
} from "@/lib/api-client/content";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { ContentImageCard } from "@/components/content/content-image-card";
import { ContentHardDeleteDialog } from "@/components/content/content-hard-delete-dialog";
import { DetailCollectionManager } from "@/components/content/detail-collection-manager";
import {
  ScholarshipOptionsModal,
  useScholarshipOptionCatalog,
  type ScholarshipOptionKind,
} from "@/components/content/scholarship-options-modal";
import { ErrorState, LoadingState } from "@/components/dashboard/states";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  InfoIcon,
  Settings2Icon,
  SpinnerIcon,
} from "@/components/ui/admin-icons";
import { useCreateContent, useUpdateContent } from "@/hook/mutations/use-content-mutations";
import { useContentDetail, useContentSelector } from "@/hook/queries/use-content-queries";
import { publicationStatusOptions } from "@/lib/content-config";
import {
  applyScholarshipSeoDefaults,
  initialContentValues,
  toContentPayload,
  validateContentValues,
  type ContentFormValues,
} from "@/lib/content-form";
import {
  SCHOLARSHIP_FIELD_FOCUS_ORDER,
  SCHOLARSHIP_SECTION_ANCHORS,
  buildScholarshipPatch,
  isScholarshipUniversityCompatible,
  resolveAutoScholarshipSlug,
  scholarshipOptionDisplayLabel,
} from "@/lib/scholarship-form-helpers";
import { StaleContentSessionError } from "@/lib/content-session";
import { useAdminAccess } from "@/providers/admin-access-provider";

const textInputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-base text-[var(--navy)] placeholder:text-[var(--muted)]/65 hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none";

const textareaBaseClass =
  "mt-1.5 w-full resize-y rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-base leading-7 text-[var(--navy)] placeholder:text-[var(--muted)]/65 hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none";

const selectClass =
  "min-h-11 w-full appearance-none rounded-xl border border-[var(--line)] bg-white py-2.5 pr-3.5 pl-10 text-base font-medium text-[var(--navy)] hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none";

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
        <h3 className="text-[18px] sm:text-[20px] font-bold text-[var(--navy)]">{title}</h3>
      </div>
      {description ? (
        <p className="mt-1 text-[14px] leading-6 text-[var(--muted)]">{description}</p>
      ) : null}
    </div>
  );
}

export function ScholarshipFormPage({ id }: { id?: string }) {
  const router = useRouter();
  const access = useAdminAccess();
  const getApi = useMemo(
    () => (access.mockEnabled ? null : getContentApi("universities")),
    [access.mockEnabled],
  );
  const isEditMode = Boolean(id);
  const detail = useContentDetail("scholarships", id);
  const create = useCreateContent("scholarships");
  const update = useUpdateContent("scholarships");

  const studyLevelCatalog = useScholarshipOptionCatalog("studyLevel");
  const fundingTypeCatalog = useScholarshipOptionCatalog("fundingType");
  const [optionsModalKind, setOptionsModalKind] = useState<ScholarshipOptionKind | null>(null);

  const form = useForm<ContentFormValues>({
    defaultValues: initialContentValues("scholarships"),
    shouldUnregister: false,
  });

  const { register, handleSubmit, reset, setError, setValue, getValues, clearErrors, formState } =
    form;

  const [submitError, setSubmitError] = useState<string>();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);

  // Lookup data remains server-paginated and is fetched only when each selector opens.
  const [selectedCountryMeta, setSelectedCountryMeta] = useState<{
    id: string;
    nameAr: string;
    slug?: string;
  }>();

  const [selectedUniMeta, setSelectedUniMeta] = useState<{
    id: string;
    nameAr: string;
    countryId?: string;
  }>();
  const [cascadeNotice, setCascadeNotice] = useState<string>();
  const [relationshipChecking, setRelationshipChecking] = useState(false);

  const submissionRef = useRef(false);
  const formId = `scholarship-form-${id ?? "new"}`;

  const watchedTitleAr = useWatch({ control: form.control, name: "titleAr" });
  const watchedTitleEn = useWatch({ control: form.control, name: "titleEn" });
  const watchedSlug = useWatch({ control: form.control, name: "slug" });
  const watchedCountryId = useWatch({ control: form.control, name: "countryId" });
  const watchedUniversityId = useWatch({ control: form.control, name: "universityId" });
  const watchedStudyLevel = useWatch({ control: form.control, name: "studyLevel" });
  const watchedFundingType = useWatch({ control: form.control, name: "fundingType" });
  const watchedDeadline = useWatch({ control: form.control, name: "verifiedDeadline" });
  const watchedAppStatus = useWatch({ control: form.control, name: "applicationStatus" });
  const watchedImageUrl = useWatch({ control: form.control, name: "imageUrl" });
  const watchedFeatured = useWatch({ control: form.control, name: "featured" });
  const watchedStatus = useWatch({ control: form.control, name: "status" });

  const scholarshipRecord = detail.data as Scholarship | undefined;
  const canHardDelete = Boolean(id && scholarshipRecord) && !access.mockEnabled && (access.user?.role === "ADMIN" || access.user?.role === "SUPER_ADMIN");
  const originallyPublished = isEditMode && scholarshipRecord?.status === "PUBLISHED";

  const selectedCountryId = typeof watchedCountryId === "string" ? watchedCountryId : "";
  const selectedUniversityId = typeof watchedUniversityId === "string" ? watchedUniversityId : "";

  const countriesQuery = useContentSelector("countries", "newest");

  const resolvedCountrySlug = useMemo(() => {
    if (!selectedCountryId) return undefined;
    if (selectedCountryMeta?.id === selectedCountryId && selectedCountryMeta.slug) {
      return selectedCountryMeta.slug;
    }
    if (scholarshipRecord?.country?.id === selectedCountryId) {
      return scholarshipRecord.country.slug;
    }
    const found = countriesQuery.items.find((c) => c.id === selectedCountryId);
    return found?.slug;
  }, [selectedCountryId, selectedCountryMeta, scholarshipRecord?.country, countriesQuery.items]);

  const universitySelectorParams = useMemo(
    () => (resolvedCountrySlug ? { country: resolvedCountrySlug } : {}),
    [resolvedCountrySlug],
  );
  const universitiesQuery = useContentSelector("universities", "name", {
    params: universitySelectorParams,
  });

  useEffect(() => {
    if (scholarshipRecord) {
      reset(initialContentValues("scholarships", scholarshipRecord));
    }
  }, [scholarshipRecord, reset]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (formState.isDirty) event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [formState.isDirty]);

  const countryOptions = useMemo(
    () =>
      countriesQuery.items.map((item) => ({
        value: item.id,
        label: item.nameAr,
        sublabel: item.nameEn ?? item.slug,
      })),
    [countriesQuery.items],
  );

  const selectedCountryLabel = !selectedCountryId
    ? undefined
    : selectedCountryMeta?.id === selectedCountryId
      ? selectedCountryMeta.nameAr
      : scholarshipRecord?.country?.id === selectedCountryId
        ? scholarshipRecord.country.nameAr
        : undefined;

  const universityOptions = useMemo(() => {
    const items = universitiesQuery.items;
    return items
      .filter((item) => !selectedCountryId || item.countryId === selectedCountryId)
      .map((item) => ({
        value: item.id,
        label: item.nameAr,
        sublabel: item.cityAr,
      }));
  }, [universitiesQuery.items, selectedCountryId]);

  const selectedUniversityLabel = !selectedUniversityId
    ? undefined
    : selectedUniMeta?.id === selectedUniversityId
      ? selectedUniMeta.nameAr
      : scholarshipRecord?.university?.id === selectedUniversityId
        ? scholarshipRecord.university.nameAr
        : undefined;

  const studyLevelSelectOptions = useMemo(() => {
    const current = typeof watchedStudyLevel === "string" ? watchedStudyLevel.trim() : "";
    const seen = new Set<string>();
    const list: { value: string; label: string }[] = [];
    if (current) {
      const display = scholarshipOptionDisplayLabel("studyLevel", current);
      if (!studyLevelCatalog.options.includes(current)) {
        seen.add(current);
        list.push({ value: current, label: display });
      }
    }
    for (const option of studyLevelCatalog.options) {
      if (!seen.has(option)) {
        seen.add(option);
        list.push({ value: option, label: scholarshipOptionDisplayLabel("studyLevel", option) });
      }
    }
    return list;
  }, [studyLevelCatalog.options, watchedStudyLevel]);

  const fundingTypeSelectOptions = useMemo(() => {
    const current = typeof watchedFundingType === "string" ? watchedFundingType.trim() : "";
    const seen = new Set<string>();
    const list: { value: string; label: string }[] = [];
    if (current) {
      const display = scholarshipOptionDisplayLabel("fundingType", current);
      if (!fundingTypeCatalog.options.includes(current)) {
        seen.add(current);
        list.push({ value: current, label: display });
      }
    }
    for (const option of fundingTypeCatalog.options) {
      if (!seen.has(option)) {
        seen.add(option);
        list.push({ value: option, label: scholarshipOptionDisplayLabel("fundingType", option) });
      }
    }
    return list;
  }, [fundingTypeCatalog.options, watchedFundingType]);

  const slugResolution = useMemo(
    () =>
      resolveAutoScholarshipSlug({
        titleAr: typeof watchedTitleAr === "string" ? watchedTitleAr : "",
        titleEn: typeof watchedTitleEn === "string" ? watchedTitleEn : "",
        currentSlug: typeof watchedSlug === "string" ? watchedSlug : "",
        slugManuallyEdited,
        isEditMode,
        isPublished: originallyPublished,
      }),
    [watchedTitleAr, watchedTitleEn, watchedSlug, slugManuallyEdited, isEditMode, originallyPublished],
  );

  const currentSlug = typeof watchedSlug === "string" ? watchedSlug.trim() : "";
  const currentTitleAr = typeof watchedTitleAr === "string" ? watchedTitleAr.trim() : "";
  const needsSlugFallback =
    !isEditMode &&
    currentTitleAr.length >= 2 &&
    !slugManuallyEdited &&
    slugResolution.source === "none" &&
    !currentSlug;

  function syncAutoFieldsOnTitleChange(
    nextTitleAr: string,
    nextTitleEn: string,
  ) {
    if (isEditMode) return;

    if (!slugManuallyEdited) {
      const next = resolveAutoScholarshipSlug({
        titleAr: nextTitleAr,
        titleEn: nextTitleEn,
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

  async function handleCountryChange(nextCountryId: string) {
    setCascadeNotice(undefined);
    setValue("countryId", nextCountryId, { shouldDirty: true, shouldValidate: true });
    clearErrors("countryId");
    universitiesQuery.setSearch("");

    const matchedCountry = countriesQuery.items.find((c) => c.id === nextCountryId);
    if (matchedCountry) {
      setSelectedCountryMeta({
        id: matchedCountry.id,
        nameAr: matchedCountry.nameAr,
        slug: matchedCountry.slug,
      });
    } else if (!nextCountryId) {
      setSelectedCountryMeta(undefined);
    }

    const currentUniId = String(getValues("universityId") ?? "").trim();
    if (!nextCountryId || !currentUniId) return;

    const knownInPage = universitiesQuery.items.find((u) => u.id === currentUniId);
    const knownCountryId =
      knownInPage?.countryId ??
      (selectedUniMeta?.id === currentUniId ? selectedUniMeta.countryId : undefined) ??
      (scholarshipRecord?.universityId === currentUniId
        ? scholarshipRecord.countryId ?? undefined
        : undefined);

    if (knownCountryId) {
      if (!isScholarshipUniversityCompatible(nextCountryId, knownCountryId)) {
        setValue("universityId", "", { shouldDirty: true });
        setSelectedUniMeta(undefined);
        clearErrors("universityId");
        setCascadeNotice("تم مسح اختيار الجامعة لعدم تبعيتها للدولة المختارة.");
      }
      return;
    }

    if (getApi) {
      setRelationshipChecking(true);
      try {
        const fetchedUni = await getApi.get(currentUniId);
        if (String(getValues("countryId") ?? "") !== nextCountryId) return;
        if (!isScholarshipUniversityCompatible(nextCountryId, fetchedUni.countryId)) {
          setValue("universityId", "", { shouldDirty: true });
          setSelectedUniMeta(undefined);
          clearErrors("universityId");
          setCascadeNotice("تم مسح اختيار الجامعة لعدم تبعيتها للدولة المختارة.");
        }
      } catch {
        setError("universityId", {
          message: "تعذّر التحقق من ارتباط الجامعة بالدولة. اختر الجامعة أو امسحها.",
        });
      } finally {
        setRelationshipChecking(false);
      }
    }
  }

  function focusFirstInvalid(errorMap: Record<string, string>) {
    const keys = Object.keys(errorMap);
    if (!keys.length) return;

    const firstKey =
      SCHOLARSHIP_FIELD_FOCUS_ORDER.find((field) => field in errorMap) ?? keys[0];

    const fallbackVisible = needsSlugFallback && firstKey === "slug";
    const targetId =
      fallbackVisible ? "scholarships-slug-fallback" : `scholarships-${firstKey}`;

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

    Object.assign(values, applyScholarshipSeoDefaults(values, scholarshipRecord));

    const validation = validateContentValues("scholarships", values);
    if (Object.keys(validation).length) {
      for (const [name, message] of Object.entries(validation)) {
        setError(name, { type: "validate", message });
      }
      focusFirstInvalid(validation);
      return;
    }

    const oldStatus = scholarshipRecord?.status;
    const newStatus = values.status;
    if (
      oldStatus !== newStatus &&
      (newStatus === "PUBLISHED" || newStatus === "ARCHIVED") &&
      !window.confirm("هل تريد تأكيد تغيير الحالة التحريرية للمنحة؟")
    ) {
      return;
    }

    if (submissionRef.current || create.isPending || update.isPending) return;
    submissionRef.current = true;
    try {
      const payload =
        id && scholarshipRecord
          ? buildScholarshipPatch(values, scholarshipRecord, {
              statusChanged: Boolean(formState.dirtyFields.status),
            })
          : toContentPayload("scholarships", values);
      if (id) await update.mutateAsync({ id, input: payload });
      else await create.mutateAsync(payload);
      router.replace("/admin/scholarships");
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
            : normalized.status === 409
              ? "المعرّف النصي مستخدم لمنحة أخرى؛ أدخل معرّفًا مختلفًا عند ظهور حقل الإدخال البديل."
              : normalized.kind === "network"
                ? "تعذّر الاتصال بالخادم. لم تُفقد بيانات النموذج."
                : "تعذّر حفظ بيانات المنحة. راجع الحقول المطلوبة ثم حاول مرة أخرى.",
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
  const isPending = create.isPending || update.isPending || relationshipChecking;
  const currentStatus = (typeof watchedStatus === "string"
    ? watchedStatus
    : "DRAFT") as PublicationStatus;
  const currentAppStatus = typeof watchedAppStatus === "string" ? watchedAppStatus : "OPEN";
  const effectiveDiffers =
    isEditMode &&
    scholarshipRecord?.effectiveApplicationStatus &&
    scholarshipRecord.effectiveApplicationStatus !== currentAppStatus;
  const titleArReg = register("titleAr");
  const descArReg = register("descriptionAr");
  const reqArReg = register("requirementsAr");

  return (
    <section className="mx-auto max-w-5xl space-y-5 pb-8">
      {/* Page Header */}
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[13px] font-semibold text-[var(--gold-dark)]">
              المنح الدراسية
            </span>
            {isEditMode && scholarshipRecord ? (
              <span className="inline-flex items-center rounded-md border border-[var(--line)] bg-[var(--surface-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--navy)]">
                الحالة: {statusLabelMap[scholarshipRecord.status]}
              </span>
            ) : null}
          </div>
          <h2 className="text-[26px] sm:text-[30px] font-bold leading-tight text-[var(--navy)]">
            {isEditMode
              ? `تعديل المنحة${scholarshipRecord?.titleAr ? `: ${scholarshipRecord.titleAr}` : ""}`
              : "إضافة منحة جديدة"}
          </h2>
          <p className="max-w-2xl text-[14px] sm:text-[15px] leading-6 text-[var(--muted)]">
            أدخل بيانات المنحة الأساسية، المستوى ونوع التمويل، شروط التقديم، وصورة العرض بشكل واضح
            ومنظم.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {isEditMode && id ? (
            <Link
              href={`/admin/faqs?scope=SCHOLARSHIP&parentId=${id}`}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--gold)]/55 bg-[var(--gold-soft)]/50 px-3.5 text-[14px] font-bold text-[var(--navy)] transition-colors hover:bg-[var(--gold-soft)] lg:hidden"
            >
              <HelpCircleIcon className="size-4 text-[var(--gold-dark)]" />
              <span>الأسئلة الشائعة</span>
            </Link>
          ) : null}

          <Link
            href="/admin/scholarships"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 text-[14px] font-bold text-[var(--navy)] transition-colors hover:border-[var(--line-strong)] hover:bg-slate-50"
          >
            <ChevronRightIcon className="size-4" />
            <span>العودة إلى المنح الدراسية</span>
          </Link>
        </div>
      </header>

      {/* Simplified 4-Group Desktop Section Jump Bar */}
      <nav
        aria-label="أقسام نموذج المنحة"
        className="hidden items-center gap-1 rounded-xl border border-[var(--line)] bg-white p-1.5 shadow-[var(--shadow-card)] lg:flex"
      >
        {SCHOLARSHIP_SECTION_ANCHORS.map((anchor, index) => (
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
        {isEditMode && id ? (
          <Link
            href={`/admin/faqs?scope=SCHOLARSHIP&parentId=${id}`}
            className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold-soft)]/50"
          >
            <HelpCircleIcon className="size-4" />
            <span>الأسئلة الشائعة للمنحة</span>
          </Link>
        ) : null}
      </nav>

      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          clearErrors();
          void handleSubmit(submit)(event);
        }}
        className="space-y-5"
      >
        {/* Group A (01): المعلومات الأساسية */}
        <section
          id="scholarship-group-basic"
          className="scroll-mt-24 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-6"
        >
          <SectionHeader
            step="01"
            title="المعلومات الأساسية"
            description="عنوان المنحة بالعربية والجهة المانحة من الدولة والجامعة."
          />

          <div className="space-y-4">
            <div>
              <label
                htmlFor="scholarships-titleAr"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                عنوان المنحة بالعربية <span className="text-red-700">*</span>
              </label>
              <input
                id="scholarships-titleAr"
                type="text"
                dir="rtl"
                maxLength={300}
                placeholder="مثال: منحة التميز لطلبة الهندسة في تركيا 2026"
                aria-invalid={Boolean(errors.titleAr?.message)}
                aria-describedby={errors.titleAr?.message ? "scholarships-titleAr-error" : undefined}
                className={textInputClass}
                {...titleArReg}
                onChange={(event) => {
                  titleArReg.onChange(event);
                  syncAutoFieldsOnTitleChange(event.target.value, String(getValues("titleEn") ?? ""));
                }}
              />
              {errors.titleAr?.message ? (
                <p
                  id="scholarships-titleAr-error"
                  role="alert"
                  className="mt-1.5 text-[13px] font-medium text-red-700"
                >
                  {errors.titleAr.message}
                </p>
              ) : null}

              {currentSlug ? (
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] px-3.5 py-2.5">
                  <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 text-[13px] text-[var(--muted)]">
                    <span className="shrink-0">رابط المنحة:</span>
                    <code
                      dir="ltr"
                      title={`/scholarships/${currentSlug}`}
                      className="block max-w-full overflow-x-auto whitespace-nowrap font-mono text-[13px] font-medium text-[var(--navy)]"
                    >
                      /scholarships/{currentSlug}
                    </code>
                  </div>
                </div>
              ) : null}

              {needsSlugFallback ? (
                <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/75 p-3.5">
                  <label
                    htmlFor="scholarships-slug-fallback"
                    className="block text-[14px] font-semibold text-[var(--navy)]"
                  >
                    معرّف الرابط الإنجليزي المختصر <span className="text-red-700">*</span>
                  </label>
                  <p className="mt-1 text-[13px] leading-6 text-[var(--muted)]">
                    أدخل معرّفًا مختصرًا بالأحرف الإنجليزية الصغيرة والشرطات ليُستخدم في رابط المنحة
                    (مثل{" "}
                    <code dir="ltr" className="font-mono text-[var(--navy)]">
                      turkey-engineering-grant
                    </code>
                    ):
                  </p>
                  <input
                    id="scholarships-slug-fallback"
                    type="text"
                    dir="ltr"
                    maxLength={120}
                    placeholder="turkey-engineering-grant"
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

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <SearchableSelect
                  id="scholarships-countryId"
                  size="comfortable"
                  label="الدولة (اختيارية)"
                  value={selectedCountryId}
                  selectedLabel={selectedCountryLabel}
                  options={countryOptions}
                  placeholder="اختر الدولة"
                  clearLabel="بلا دولة محددة"
                  searchPlaceholder="ابحث في جميع الدول..."
                  allowClear
                  searchValue={countriesQuery.search}
                  onSearchChange={countriesQuery.setSearch}
                  onOpenChange={countriesQuery.setOpen}
                  isLoading={countriesQuery.isFetching || countriesQuery.isSearchPending}
                  isError={countriesQuery.isError}
                  onRetry={() => void countriesQuery.refetch()}
                  hasMore={!countriesQuery.isSearchPending && Boolean(countriesQuery.hasNextPage)}
                  isLoadingMore={countriesQuery.isFetchingNextPage}
                  onLoadMore={() => void countriesQuery.fetchNextPage()}
                  endMessage="تم عرض جميع الدول المطابقة."
                  error={errors.countryId?.message}
                  onChange={(nextValue) => void handleCountryChange(nextValue)}
                />
                <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted)]">
                  اختيار الدولة يحصر قائمة الجامعات في جامعات تلك الدولة.
                </p>
              </div>

              <div>
                <SearchableSelect
                  id="scholarships-universityId"
                  size="comfortable"
                  label="الجامعة (اختيارية)"
                  value={selectedUniversityId}
                  selectedLabel={selectedUniversityLabel}
                  options={universityOptions}
                  placeholder={selectedCountryId ? "اختر جامعة من الدولة" : "اختر الجامعة (اختيارية)"}
                  clearLabel="بلا جامعة محددة"
                  searchPlaceholder="ابحث في جميع الجامعات..."
                  allowClear
                  searchValue={universitiesQuery.search}
                  onSearchChange={universitiesQuery.setSearch}
                  onOpenChange={universitiesQuery.setOpen}
                  isLoading={universitiesQuery.isFetching || universitiesQuery.isSearchPending || relationshipChecking}
                  isError={universitiesQuery.isError}
                  onRetry={() => void universitiesQuery.refetch()}
                  hasMore={!universitiesQuery.isSearchPending && Boolean(universitiesQuery.hasNextPage)}
                  isLoadingMore={universitiesQuery.isFetchingNextPage}
                  onLoadMore={() => void universitiesQuery.fetchNextPage()}
                  endMessage="تم عرض جميع الجامعات المطابقة."
                  error={errors.universityId?.message}
                  onChange={(nextValue) => {
                    setCascadeNotice(undefined);
                    setValue("universityId", nextValue, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    clearErrors("universityId");
                    const matchedUni = universitiesQuery.items.find(
                      (u) => u.id === nextValue,
                    );
                    if (matchedUni) {
                      setSelectedUniMeta({
                        id: matchedUni.id,
                        nameAr: matchedUni.nameAr,
                        countryId: matchedUni.countryId,
                      });
                    } else if (!nextValue) {
                      setSelectedUniMeta(undefined);
                    }
                  }}
                />
                {cascadeNotice ? (
                  <p role="status" className="mt-1.5 text-[13px] font-medium text-[var(--gold-dark)]">
                    {cascadeNotice}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted)]">
                    اتركها فارغة للمنح الحكومية أو العامة غير المخصصة لجامعة واحدة.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Group B (02): تفاصيل المنحة والتقديم */}
        <section
          id="scholarship-group-details"
          className="scroll-mt-24 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-6"
        >
          <SectionHeader
            step="02"
            title="تفاصيل المنحة والتقديم"
            description="المستوى الدراسي، نوع التمويل، حالة التقديم، الموعد النهائي، والمصدر الرسمي."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <SearchableSelect
                id="scholarships-studyLevel"
                size="comfortable"
                label="المستوى الدراسي"
                required
                value={typeof watchedStudyLevel === "string" ? watchedStudyLevel : ""}
                options={studyLevelSelectOptions}
                placeholder="اختر المستوى الدراسي"
                allowClear={false}
                error={errors.studyLevel?.message}
                labelAction={
                  <button
                    type="button"
                    onClick={() => setOptionsModalKind("studyLevel")}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[12px] sm:text-[13px] font-semibold text-[var(--navy)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/50 whitespace-nowrap"
                  >
                    <Settings2Icon className="size-3.5 text-[var(--gold-dark)]" />
                    <span>إدارة الخيارات</span>
                  </button>
                }
                onChange={(nextValue) => {
                  setValue("studyLevel", nextValue, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  clearErrors("studyLevel");
                }}
              />
            </div>

            <div>
              <SearchableSelect
                id="scholarships-fundingType"
                size="comfortable"
                label="نوع التمويل"
                required
                value={typeof watchedFundingType === "string" ? watchedFundingType : ""}
                options={fundingTypeSelectOptions}
                placeholder="اختر نوع التمويل"
                allowClear={false}
                error={errors.fundingType?.message}
                labelAction={
                  <button
                    type="button"
                    onClick={() => setOptionsModalKind("fundingType")}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)] px-2.5 py-1 text-[12px] sm:text-[13px] font-semibold text-[var(--navy)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/50 whitespace-nowrap"
                  >
                    <Settings2Icon className="size-3.5 text-[var(--gold-dark)]" />
                    <span>إدارة الخيارات</span>
                  </button>
                }
                onChange={(nextValue) => {
                  setValue("fundingType", nextValue, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  clearErrors("fundingType");
                }}
              />
            </div>

            <div>
              <label
                htmlFor="scholarships-applicationStatus"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                حالة التقديم
              </label>
              <div className="relative mt-1.5">
                <select
                  id="scholarships-applicationStatus"
                  value={currentAppStatus}
                  onChange={(event) =>
                    setValue("applicationStatus", event.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className={selectClass}
                >
                  <option value="OPEN">مفتوح</option>
                  <option value="CLOSED">مغلق</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              {effectiveDiffers ? (
                <p className="mt-1.5 text-[13px] font-medium text-[var(--gold-dark)]">
                  الحالة المعروضة فعليًا للزوار:{" "}
                  {scholarshipRecord?.effectiveApplicationStatus === "CLOSED"
                    ? "مغلق (انتهى الموعد النهائي)"
                    : "مفتوح"}
                </p>
              ) : (
                <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted)]">
                  تظهر للطلبة مع التنبيه التلقائي عند انتهاء الموعد النهائي.
                </p>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="scholarships-verifiedDeadline"
                  className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
                >
                  الموعد النهائي للتقديم
                </label>
                {typeof watchedDeadline === "string" && watchedDeadline.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setValue("verifiedDeadline", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      clearErrors("verifiedDeadline");
                    }}
                    className="text-[13px] font-semibold text-[var(--gold-dark)] hover:underline"
                  >
                    مسح الموعد
                  </button>
                ) : null}
              </div>
              <input
                id="scholarships-verifiedDeadline"
                type="datetime-local"
                step="any"
                dir="ltr"
                aria-invalid={Boolean(errors.verifiedDeadline?.message)}
                className={`${textInputClass} text-left`}
                {...register("verifiedDeadline")}
              />
              {errors.verifiedDeadline?.message ? (
                <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-700">
                  {errors.verifiedDeadline.message}
                </p>
              ) : (
                <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted)]">
                  اتركه فارغًا إذا كانت المنحة متاحة دون تاريخ إغلاق محدد.
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="scholarships-officialSourceUrl"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                المصدر الرسمي (اختياري)
              </label>
              <input
                id="scholarships-officialSourceUrl"
                type="url"
                dir="ltr"
                maxLength={2048}
                placeholder="https://example.edu/scholarships/engineering"
                aria-invalid={Boolean(errors.officialSourceUrl?.message)}
                className={`${textInputClass} text-left font-mono`}
                {...register("officialSourceUrl")}
              />
              {errors.officialSourceUrl?.message ? (
                <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-700">
                  {errors.officialSourceUrl.message}
                </p>
              ) : (
                <p className="mt-1.5 text-[14px] leading-6 text-[var(--muted)]">
                  رابط الصفحة الرسمية للجهة المانحة أو الجامعة للتحقق والمراجعة.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Group C (03): محتوى المنحة */}
        <section
          id="scholarship-group-content"
          className="scroll-mt-24 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-6"
        >
          <SectionHeader
            step="03"
            title="محتوى المنحة"
            description="النبذة التعريفية والمزايا الأساسية إلى جانب شروط القبول والتقديم بالعربية."
          />

          <div className="space-y-4">
            <div>
              <label
                htmlFor="scholarships-descriptionAr"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                نبذة عن المنحة <span className="text-red-700">*</span>
              </label>
              <textarea
                id="scholarships-descriptionAr"
                dir="rtl"
                rows={5}
                maxLength={20000}
                placeholder="اكتب نبذة واضحة عن المنحة، نطاق التغطية المالية، التخصصات المشمولة، وأبرز المزايا للطالب..."
                aria-invalid={Boolean(errors.descriptionAr?.message)}
                aria-describedby={
                  errors.descriptionAr?.message
                    ? "scholarships-descriptionAr-error"
                    : "scholarships-descriptionAr-hint"
                }
                className={textareaBaseClass}
                {...descArReg}
              />
              <p
                id="scholarships-descriptionAr-hint"
                className="mt-1.5 text-[14px] leading-6 text-[var(--muted)]"
              >
                يُعرض كنص واضح ومباشر في صفحة تفاصيل المنحة للطلبة.
              </p>
              {errors.descriptionAr?.message ? (
                <p
                  id="scholarships-descriptionAr-error"
                  role="alert"
                  className="mt-1 text-[13px] font-medium text-red-700"
                >
                  {errors.descriptionAr.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="scholarships-requirementsAr"
                className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
              >
                شروط التقديم <span className="text-red-700">*</span>
              </label>
              <textarea
                id="scholarships-requirementsAr"
                dir="rtl"
                rows={5}
                maxLength={20000}
                placeholder="اذكر المؤهل الدراسي المطلوب، المعدل أو الشروط العمرية، متطلبات اللغة، والوثائق الأساسية للتقديم..."
                aria-invalid={Boolean(errors.requirementsAr?.message)}
                aria-describedby={
                  errors.requirementsAr?.message
                    ? "scholarships-requirementsAr-error"
                    : "scholarships-requirementsAr-hint"
                }
                className={textareaBaseClass}
                {...reqArReg}
              />
              <p
                id="scholarships-requirementsAr-hint"
                className="mt-1.5 text-[14px] leading-6 text-[var(--muted)]"
              >
                أدخل المتطلبات والخطوات الأساسية بشكل مرتب يسهل على الطالب مراجعته.
              </p>
              {errors.requirementsAr?.message ? (
                <p
                  id="scholarships-requirementsAr-error"
                  role="alert"
                  className="mt-1 text-[13px] font-medium text-red-700"
                >
                  {errors.requirementsAr.message}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Group D & E (04 & 05): صورة المنحة + النشر والتمييز */}
        <section
          id="scholarship-group-media"
          className="scroll-mt-24 space-y-5 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-6"
        >
          <SectionHeader
            step="04"
            title="صورة المنحة والنشر"
            description="رفع صورة تعبيرية مناسبة للمنحة وتحديد حالة النشر والتمييز."
          />

          <ContentImageCard
            resource="scholarships"
            manualUrlAvailable={false}
            title="صورة المنحة التعريفية"
            description="تظهر في بطاقة المنحة وفي أعلى صفحة التفاصيل (نسبة أفقية واضحة)."
            urlFieldId="scholarships-imageUrl"
            altFieldId="scholarships-imageAltAr"
            urlValue={typeof watchedImageUrl === "string" ? watchedImageUrl : ""}
            urlError={errors.imageUrl?.message}
            altError={errors.imageAltAr?.message}
            altPlaceholder="مثال: طلبة هندسة في الحرم الجامعي"
            manualUrlPlaceholder="https://example.com/scholarship-cover.jpg"
            uploadSuccessMessage="تم رفع الصورة بنجاح. احفظ المنحة لتثبيت التغييرات."
            canClear={!isEditMode || !scholarshipRecord?.imageUrl}
            disabled={isPending}
            onUrlChange={(nextUrl) => {
              setValue("imageUrl", nextUrl, { shouldDirty: true, shouldValidate: true });
              clearErrors("imageUrl");
            }}
            urlInputProps={register("imageUrl")}
            altInputProps={register("imageAltAr")}
          />

          <div className="border-t border-[var(--line)] pt-5">
            <div className="mb-3.5">
              <h4 className="text-[17px] sm:text-[18px] font-bold text-[var(--navy)]">
                النشر والتمييز
              </h4>
              <p className="mt-0.5 text-[14px] leading-6 text-[var(--muted)]">
                حدّد جاهزية المنحة للنشر وإمكانية إبرازها في الصفحة الرئيسية.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:items-start">
              <div>
                <label
                  htmlFor="scholarships-status"
                  className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
                >
                  الحالة التحريرية
                </label>
                <div className="relative mt-1.5">
                  <select
                    id="scholarships-status"
                    value={currentStatus}
                    onChange={(event) =>
                      setValue("status", event.target.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    className={selectClass}
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
                  «مسودة» تحفظ داخليًا فقط، و«منشور» تعرض المنحة للزوار.
                </p>
              </div>

              <div className="md:pt-7">
                <SwitchToggle
                  id="scholarships-featured"
                  label="إظهار كمنحة مميزة"
                  description="تبرز هذه المنحة في الواجهة الرئيسية وقسم المنح الموصى بها."
                  checked={Boolean(watchedFeatured)}
                  showStarIcon
                  onChange={(checked) => setValue("featured", checked, { shouldDirty: true })}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Inline Non-Sticky Save Bar */}
        <section
          aria-label="حفظ بيانات المنحة"
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-6 text-[15px] font-bold text-white transition-colors hover:bg-[var(--navy-light)] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
              >
                {isPending ? <SpinnerIcon className="size-4 animate-spin" /> : null}
                <span>
                  {isPending ? "جارٍ الحفظ…" : isEditMode ? "حفظ التغييرات" : "إضافة المنحة"}
                </span>
              </button>

              <Link
                href="/admin/scholarships"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[var(--line)] bg-white px-5 text-[15px] font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 sm:w-auto"
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
        </section>
      </form>

      {canHardDelete && scholarshipRecord ? (
        <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><h3 className="text-base font-bold text-red-900">منطقة خطرة</h3><p className="mt-1 text-sm leading-6 text-red-800">احذف المنحة نهائياً بعد مراجعة آثار الخادم.</p></div>
            <button type="button" disabled={isPending} onClick={() => setHardDeleteOpen(true)} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-wait disabled:opacity-45">حذف المنحة نهائياً</button>
          </div>
        </section>
      ) : null}

      {/* Legacy Scholarship Detail Items kept collapsed on Edit so existing records remain accessible without cluttering normal authoring */}
      {id ? (
        <details className="rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3.5 transition-colors hover:bg-[var(--surface-subtle)]/70 sm:px-6 sm:py-4 [&::-webkit-details-marker]:hidden">
            <div className="flex min-w-0 items-start gap-2.5">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-[var(--gold-dark)]" />
              <div className="min-w-0">
                <span className="block text-[16px] font-bold text-[var(--navy)]">
                  تفاصيل إضافية مرتبطة (بيانات قديمة للمرجعية)
                </span>
                <span className="mt-0.5 block text-[13px] text-[var(--muted)]">
                  افتح هذا القسم فقط عند الحاجة لمراجعة بنود التفاصيل القديمة المسجلة سابقًا لهذه
                  المنحة.
                </span>
              </div>
            </div>
            <ChevronDownIcon className="size-5 shrink-0 text-[var(--muted)]" />
          </summary>
          <div className="border-t border-[var(--line)] p-4 sm:p-5">
            <DetailCollectionManager resource="scholarships" parentId={id} />
          </div>
        </details>
      ) : null}

      {/* TA-79 Options Management Dialog */}
      {optionsModalKind ? (
        <ScholarshipOptionsModal
          kind={optionsModalKind}
          open={Boolean(optionsModalKind)}
          onClose={() => setOptionsModalKind(null)}
          options={
            optionsModalKind === "studyLevel"
              ? studyLevelCatalog.options
              : fundingTypeCatalog.options
          }
          onUpdateOptions={
            optionsModalKind === "studyLevel"
              ? studyLevelCatalog.updateOptions
              : fundingTypeCatalog.updateOptions
          }
          onResetDefaults={
            optionsModalKind === "studyLevel"
              ? studyLevelCatalog.resetDefaults
              : fundingTypeCatalog.resetDefaults
          }
          currentValue={
            optionsModalKind === "studyLevel"
              ? typeof watchedStudyLevel === "string"
                ? watchedStudyLevel
                : undefined
              : typeof watchedFundingType === "string"
                ? watchedFundingType
                : undefined
          }
          onSelectValue={(val) => {
            setValue(optionsModalKind, val, { shouldDirty: true, shouldValidate: true });
            clearErrors(optionsModalKind);
          }}
        />
      ) : null}
      {hardDeleteOpen && scholarshipRecord ? <ContentHardDeleteDialog resource="scholarships" record={{ id: scholarshipRecord.id, nameAr: scholarshipRecord.titleAr }} onClose={() => setHardDeleteOpen(false)} onDeleted={() => { setHardDeleteOpen(false); router.replace("/admin/scholarships"); }} /> : null}
    </section>
  );
}

