"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type {
  GalleryImage,
  ManagementListParams,
  SectionRecords,
  UniversityProgram,
  UniversitySection,
} from "@/lib/api-client/university-management";
import type { University } from "@/lib/api-client/content";
import { normalizeApiError } from "@/lib/api-client/error";
import { ContentFormPage } from "@/components/content/content-form-page";
import { StatusBadge } from "@/components/content/status-badge";
import { ErrorState, EmptyState, LoadingState } from "@/components/dashboard/states";
import { useContentDetail } from "@/hook/queries/use-content-queries";
import { useUniversitySection, useGalleryOrder } from "@/hook/queries/use-university-management";
import { useStudyLanguageCatalog } from "@/hook/queries/use-study-languages";
import { useGalleryAction } from "@/hook/mutations/use-university-management";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  admissionScopes,
  programStudyLevels,
  publicationStates,
  teachingLanguages,
} from "@/lib/university-schemas";
import {
  admissionScopeLabels,
  billingPeriodLabels,
  durationUnitLabels,
  programStudyLevelLabels,
  studyLevelLabel,
  teachingLanguageLabel,
  teachingLanguageLabels,
  universityTypeLabel,
} from "@/lib/content-labels";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  TrashIcon,
} from "@/components/ui/admin-icons";
import { buttonClass, inputClass, PageControls, panelClass, primaryButtonClass } from "./controls";
import { SectionEditor } from "./section-editor";

const labels: Record<UniversitySection | "overview", string> = {
  overview: "بيانات الجامعة",
  programs: "البرامج والرسوم",
  "admission-requirements": "متطلبات القبول",
  gallery: "معرض الصور",
};

const statusFilterLabels: Record<(typeof publicationStates)[number], string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

const selectClass = `${inputClass} appearance-none pr-3 pl-9`;

function formatIsoDate(value: string | null | undefined) {
  if (!value) return "—";
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value;
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(time));
}

function FeeValue({ fee }: { fee: NonNullable<UniversityProgram["tuition"]> }) {
  return (
    <>
      <bdi dir="ltr" className="font-bold text-[var(--navy)] tabular-nums">
        {fee.amount} {fee.currency}
      </bdi>{" "}
      <span aria-hidden="true">·</span> {billingPeriodLabels[fee.billingPeriod]}{" "}
      <span aria-hidden="true">·</span>{" "}
      <bdi dir="ltr" className="tabular-nums">
        {fee.academicYear}
      </bdi>
    </>
  );
}

function ProgramFees({ program }: { program: UniversityProgram }) {
  return (
    <section
      className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3.5 text-sm"
      aria-label="الرسوم الدراسية"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-[var(--navy)]">
        <span className="text-xs font-bold text-[var(--muted)]">الرسوم الحالية</span>
        <span className="text-sm">
          {program.tuition ? <FeeValue fee={program.tuition} /> : "غير متاحة"}
        </span>
      </div>
      {program.tuitionFees.length ? (
        <details className="border-t border-[var(--line)] pt-2">
          <summary className="min-h-8 cursor-pointer py-1 text-xs font-semibold text-[var(--navy)]">
            سجل الرسوم حسب السنة الأكاديمية ({program.tuitionFees.length})
          </summary>
          <ul className="mt-2 space-y-1.5 text-xs text-[var(--muted)]">
            {program.tuitionFees.map((fee, index) => (
              <li
                key={`${fee?.id ?? "unavailable"}-${index}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5"
              >
                {fee ? <FeeValue fee={fee} /> : "سجل رسوم غير متاح"}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="text-xs text-[var(--muted)]">لا يوجد سجل رسوم سابق.</p>
      )}
    </section>
  );
}

function GalleryPreview({ image }: { image: GalleryImage }) {
  const [failed, setFailed] = useState(false);
  let usable = false;
  try {
    usable = ["http:", "https:"].includes(new URL(image.imageUrl).protocol);
  } catch {
    // Unusable URL is a content state.
  }
  if (!usable || failed)
    return (
      <p
        role="status"
        className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-subtle)] p-4 text-center text-xs text-[var(--muted)]"
      >
        تعذّر عرض صورة المعرض. يمكنك مراجعة الرابط أو تعديل بيانات الصورة.
      </p>
    );
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-2">
      <img
        src={image.imageUrl}
        alt={image.altAr ?? "صورة الجامعة"}
        onError={() => setFailed(true)}
        className="mx-auto max-h-48 max-w-full rounded-lg object-contain"
      />
    </div>
  );
}

function OrderEditor({
  images,
  universityId,
  close,
}: {
  images: GalleryImage[];
  universityId: string;
  close: () => void;
}) {
  const [order, setOrder] = useState(images);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState("");
  const mutation = useGalleryAction(universityId);

  function move(index: number, delta: number) {
    setOrder((items) => {
      const next = [...items];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }

  return (
    <div className={panelClass}>
      <div>
        <h3 className="text-base font-bold text-[var(--navy)]">
          ترتيب جميع الصور غير المؤرشفة ({order.length})
        </h3>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          يشمل المسودات والمنشور. الترتيب مستقل عن مرشح القائمة.
        </p>
      </div>

      <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)]">
        {order.map((image, index) => (
          <div
            key={image.id}
            className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="text-xs font-bold text-[var(--gold-dark)] tabular-nums">
                {index + 1}.
              </span>
              <span className="min-w-0 flex-1 break-words text-sm font-medium text-[var(--navy)]">
                {image.altAr ?? "صورة بلا وصف"}
              </span>
              <StatusBadge status={image.status} />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={`رفع الصورة ${index + 1}`}
                className={buttonClass}
                disabled={stale || mutation.isPending || index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUpIcon className="size-3.5" />
                <span>أعلى</span>
              </button>
              <button
                type="button"
                aria-label={`خفض الصورة ${index + 1}`}
                className={buttonClass}
                disabled={stale || mutation.isPending || index === order.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDownIcon className="size-3.5" />
                <span>أسفل</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          className={primaryButtonClass}
          disabled={stale || mutation.isPending || !order.length}
          onClick={async () => {
            try {
              await mutation.mutateAsync({ orderedIds: order.map((image) => image.id) });
              close();
            } catch (failure) {
              if (normalizeApiError(failure).status === 409) {
                setStale(true);
                setError(
                  "تغيّرت مجموعة الصور على الخادم. لم يُعاد الطلب. أغلق الترتيب وأعد تحميله صراحة قبل الحفظ.",
                );
              } else {
                setError("تعذّر حفظ الترتيب. لم تُفقد القائمة المحلية.");
              }
            }
          }}
        >
          حفظ الترتيب
        </button>
        <button className={buttonClass} disabled={mutation.isPending} onClick={close}>
          إغلاق الترتيب
        </button>
      </div>
    </div>
  );
}

function GalleryOrder({
  universityId,
  close,
}: {
  universityId: string;
  close: () => void;
}) {
  const query = useGalleryOrder(universityId);
  return query.isPending || query.isFetching ? (
    <LoadingState />
  ) : query.isError ? (
    <div className={panelClass}>
      <p role="alert" className="text-sm text-red-700">
        {query.error instanceof Error && query.error.message.startsWith("عقد")
          ? query.error.message
          : "تعذّر تحميل المجموعة الكاملة. لا يمكن إرسال ترتيب جزئي."}
      </p>
      <div className="flex gap-2">
        <button className={primaryButtonClass} onClick={() => void query.refetch()}>
          إعادة تحميل المجموعة
        </button>
        <button className={buttonClass} onClick={close}>
          إلغاء الترتيب
        </button>
      </div>
    </div>
  ) : (
    <OrderEditor images={query.data} universityId={universityId} close={close} />
  );
}

function SectionPanel<K extends UniversitySection>({
  section,
  universityId,
}: {
  section: K;
  universityId: string;
}) {
  const [params, setParams] = useState<ManagementListParams>({ page: 1, limit: 12 });
  const [editor, setEditor] = useState<SectionRecords[K] | "new">();
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const list = useUniversitySection(section, universityId, params);
  const action = useGalleryAction(universityId);
  const studyLanguageCatalog = useStudyLanguageCatalog();
  const languageOptions = (
    studyLanguageCatalog.data?.map(({ code, nameAr }) => ({ code, nameAr })) ??
    teachingLanguages.map((code) => ({ code, nameAr: teachingLanguageLabels[code] }))
  );
  if (params.language && !languageOptions.some((option) => option.code === params.language)) {
    languageOptions.push({
      code: params.language,
      nameAr: teachingLanguageLabels[params.language] ?? params.language,
    });
  }
  const languageName = (code: string) =>
    studyLanguageCatalog.data?.find((language) => language.code === code)?.nameAr ??
    teachingLanguageLabel(code);

  const hasActiveFilters = Boolean(
    params.search ||
      params.faculty ||
      params.studyLevel ||
      params.language ||
      params.scope ||
      params.status,
  );

  const close = (saved = false) => {
    setEditor(undefined);
    setNotice(saved ? "تم حفظ السجل بنجاح." : "");
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--navy)]">{labels[section]}</h2>
          {list.data ? (
            <p className="mt-0.5 text-xs text-[var(--muted)] tabular-nums">
              إجمالي السجلات المطابقة: {list.data.pagination.total}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className={primaryButtonClass}
            disabled={Boolean(editor) || ordering}
            onClick={() => {
              setNotice("");
              setEditor("new");
            }}
          >
            <PlusIcon className="size-4" />
            <span>إضافة سجل</span>
          </button>
          {section === "gallery" ? (
            <button
              className={buttonClass}
              disabled={Boolean(editor) || ordering}
              onClick={() => setOrdering(true)}
            >
              ترتيب الصور
            </button>
          ) : null}
        </div>
      </div>

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-900"
        >
          {notice}
        </p>
      ) : null}

      {editor ? (
        <SectionEditor
          key={editor === "new" ? "new" : editor.id}
          section={section}
          universityId={universityId}
          record={editor === "new" ? undefined : editor}
          close={close}
        />
      ) : null}

      {ordering ? (
        <GalleryOrder universityId={universityId} close={() => setOrdering(false)} />
      ) : null}

      {/* Auto-apply filter bar */}
      <div className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontalIcon className="size-4 text-[var(--gold-dark)]" />
            <h3 className="text-sm font-bold text-[var(--navy)]">تصفية النتائج</h3>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => setParams({ page: 1, limit: params.limit ?? 12 })}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-2.5 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50"
            >
              <RotateCcwIcon className="size-3.5 text-[var(--muted)]" />
              <span>إعادة ضبط</span>
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {section === "programs" ? (
            <>
              <input
                aria-label="بحث البرامج"
                maxLength={200}
                className={inputClass}
                placeholder="بحث باسم البرنامج..."
                value={params.search ?? ""}
                onChange={(event) =>
                  setParams((old) => ({
                    ...old,
                    page: 1,
                    search: event.target.value || undefined,
                  }))
                }
              />
              <input
                aria-label="الكلية"
                maxLength={200}
                className={inputClass}
                placeholder="تصفية حسب الكلية..."
                value={params.faculty ?? ""}
                onChange={(event) =>
                  setParams((old) => ({
                    ...old,
                    page: 1,
                    faculty: event.target.value || undefined,
                  }))
                }
              />
              <div className="relative">
                <select
                  aria-label="تصفية المستوى"
                  className={selectClass}
                  value={params.studyLevel ?? ""}
                  onChange={(event) =>
                    setParams((old) => ({
                      ...old,
                      page: 1,
                      studyLevel: (event.target.value || undefined) as ManagementListParams["studyLevel"],
                    }))
                  }
                >
                  <option value="">كل المستويات</option>
                  {programStudyLevels.map((value) => (
                    <option key={value} value={value}>
                      {programStudyLevelLabels[value]}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>

              <div className="relative">
                <select
                  aria-label="تصفية اللغة"
                  className={selectClass}
                  value={params.language ?? ""}
                  onChange={(event) =>
                    setParams((old) => ({
                      ...old,
                      page: 1,
                      language: event.target.value || undefined,
                    }))
                  }
                >
                  <option value="">كل اللغات</option>
                  {languageOptions.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.nameAr}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
              </div>
            </>
          ) : section === "admission-requirements" ? (
            <div className="relative">
              <select
                aria-label="تصفية النطاق"
                className={selectClass}
                value={params.scope ?? ""}
                onChange={(event) =>
                  setParams((old) => ({
                    ...old,
                    page: 1,
                    scope: (event.target.value || undefined) as ManagementListParams["scope"],
                  }))
                }
              >
                <option value="">كل النطاقات</option>
                {admissionScopes.map((value) => (
                  <option key={value} value={value}>
                    {admissionScopeLabels[value]}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          ) : null}

          <div className="relative">
            <select
              aria-label="تصفية الحالة"
              className={selectClass}
              value={params.status ?? ""}
              onChange={(event) =>
                setParams((old) => ({
                  ...old,
                  page: 1,
                  status: (event.target.value || undefined) as ManagementListParams["status"],
                }))
              }
            >
              <option value="">كل الحالات</option>
              {publicationStates.map((value) => (
                <option key={value} value={value}>
                  {statusFilterLabels[value]}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
          </div>

          <div className="relative">
            <select
              aria-label="عدد السجلات"
              className={selectClass}
              value={params.limit ?? 12}
              onChange={(event) =>
                setParams((old) => ({
                  ...old,
                  page: 1,
                  limit: Number(event.target.value),
                }))
              }
            >
              {[12, 50, ...(section !== "programs" ? [100] : [])].map((value) => (
                <option key={value} value={value}>
                  {value} سجل
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
          </div>
        </div>
      </div>

      {list.isPending ? (
        <LoadingState />
      ) : list.isError ? (
        <ErrorState
          action={
            <button className={primaryButtonClass} onClick={() => void list.refetch()}>
              إعادة المحاولة
            </button>
          }
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={section === "gallery" ? "grid gap-4 sm:grid-cols-2" : "grid gap-3.5"}>
          {list.data.items.map((item) => (
            <article className={panelClass} key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="break-words text-base font-bold text-[var(--navy)]">
                    {"nameAr" in item
                      ? (item.nameAr ?? item.academicMajor.nameAr)
                      : "contentAr" in item
                        ? admissionScopeLabels[item.scope]
                        : (item.altAr ?? "صورة بلا وصف")}
                  </h3>
                  {"academicMajor" in item ? (
                    <p className="text-xs font-medium text-[var(--muted)]">
                      التخصص: {item.academicMajor.nameAr}
                      {item.facultyNameAr ? ` · الكلية: ${item.facultyNameAr}` : ""}
                    </p>
                  ) : null}
                </div>
                <StatusBadge status={item.status} />
              </div>

              {"imageUrl" in item ? (
                <>
                  <GalleryPreview key={item.imageUrl} image={item} />
                  <p className="text-xs text-[var(--muted)] tabular-nums">
                    ترتيب العرض الحالي: #{item.displayOrder}
                  </p>
                </>
              ) : null}

              {"scope" in item ? (
                <>
                  <p className="text-xs font-semibold text-[var(--gold-dark)]">
                    {item.program?.nameAr ??
                      (item.studyLevel
                        ? `المستوى: ${studyLevelLabel(item.studyLevel)}`
                        : "ينطبق على مستوى الجامعة")}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--navy)]">
                    {item.contentAr}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)] tabular-nums">
                    {item.verifiedAt ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon className="size-3.5" />
                        <span>التحقق: {formatIsoDate(item.verifiedAt)}</span>
                      </span>
                    ) : null}
                    {item.officialSourceUrl ? (
                      <a
                        href={item.officialSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[var(--navy)] hover:underline"
                      >
                        <ExternalLinkIcon className="size-3.5" />
                        <span>المصدر الرسمي</span>
                      </a>
                    ) : null}
                  </div>
                </>
              ) : null}

              {"languages" in item ? (
                <>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[var(--muted)] tabular-nums">
                    <span className="font-semibold text-[var(--navy)]">
                      {studyLevelLabel(item.studyLevel)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      اللغات: {item.languages.map((lang) => languageName(lang)).join("، ")}
                    </span>
                    {item.durationValue && item.durationUnit ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          المدة: {item.durationValue} {durationUnitLabels[item.durationUnit]}
                        </span>
                      </>
                    ) : null}
                    <span aria-hidden="true">·</span>
                    <span>التحقق: {formatIsoDate(item.verifiedAt)}</span>
                  </div>
                  <ProgramFees program={item} />
                </>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    className={buttonClass}
                    disabled={Boolean(editor) || ordering}
                    onClick={() => {
                      setNotice("");
                      setEditor(item);
                    }}
                  >
                    <PencilIcon className="size-3.5" />
                    <span>تعديل السجل</span>
                  </button>
                  {section === "gallery" ? (
                    <button
                      className={`${buttonClass} border-red-200 text-red-700 hover:bg-red-50`}
                      disabled={action.isPending || Boolean(editor) || ordering}
                      onClick={async () => {
                        if (
                          !window.confirm(
                            "فصل الصورة عن معرض الجامعة فقط؟ لن يُحذف ملف Cloudinary أو غلاف الجامعة.",
                          )
                        )
                          return;
                        try {
                          await action.mutateAsync({ detach: item.id });
                          setNotice("تم فصل الصورة عن المعرض.");
                        } catch {
                          setError("تعذّر فصل الصورة. لم تتغير القائمة.");
                        }
                      }}
                    >
                      <TrashIcon className="size-3.5" />
                      <span>فصل من المعرض</span>
                    </button>
                  ) : null}
                </div>
                {"officialSourceUrl" in item && item.officialSourceUrl && !("scope" in item) ? (
                  <a
                    href={item.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--navy)] hover:underline"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                    <span>المصدر الرسمي</span>
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <PageControls data={list.data} change={(page) => setParams((old) => ({ ...old, page }))} />
    </section>
  );
}

export function UniversityWorkspace({ id }: { id: string }) {
  const access = useAdminAccess();
  const detail = useContentDetail("universities", id);
  const university = detail.data as University | undefined;

  return (
    <div className="space-y-5">
      {university ? (
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold text-[var(--gold-dark)]">مساحة إدارة الجامعة</p>
            <h2 className="break-words text-xl font-bold text-[var(--navy)]">
              {university.nameAr}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted)]">
              {university.country?.nameAr ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{university.country.nameAr}</span>
                </>
              ) : null}
              {university.city?.nameAr || university.cityAr ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{university.city?.nameAr ?? university.cityAr}</span>
                </>
              ) : null}
              {university.universityType ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{universityTypeLabel(university.universityType)}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <StatusBadge status={university.status} />
            {university.officialWebsite ? (
              <a
                href={university.officialWebsite}
                target="_blank"
                rel="noreferrer"
                className={buttonClass}
              >
                <ExternalLinkIcon className="size-3.5" />
                <span>الموقع الرسمي</span>
              </a>
            ) : null}
          </div>
        </header>
      ) : null}

      {access.mockEnabled ? (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/75 px-4 py-3 text-xs text-amber-950">
          أقسام البرامج ومتطلبات القبول ومعرض الصور تتطلب جلسة خادم متصلة؛ يمكن تعديل بيانات
          الجامعة الأساسية في وضع المعاينة.
        </p>
      ) : null}

      <ContentFormPage resource="universities" id={id} />

      {!access.mockEnabled ? (
        <div className="space-y-8">
          <SectionPanel section="programs" universityId={id} />
          <SectionPanel section="admission-requirements" universityId={id} />
          <SectionPanel section="gallery" universityId={id} />
        </div>
      ) : null}
    </div>
  );
}
