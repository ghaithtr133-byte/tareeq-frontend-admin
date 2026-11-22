"use client";

import { useState } from "react";
import { z } from "zod";
import type {
  SectionRecords,
  SectionInputs,
  UniversitySection,
} from "@/lib/api-client/university-management";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { useUniversitySave } from "@/hook/mutations/use-university-management";
import { useUniversitySection } from "@/hook/queries/use-university-management";
import { useStudyLanguageCatalog } from "@/hook/queries/use-study-languages";
import {
  admissionScopes,
  programStudyLevels,
  teachingLanguages,
} from "@/lib/university-schemas";
import {
  admissionScopeLabels,
  billingPeriodLabels,
  durationUnitLabels,
  programStudyLevelLabels,
  studyLevelLabel,
  teachingLanguageLabels,
} from "@/lib/content-labels";
import { sectionPayload, sectionValues } from "@/lib/university-form";
import { ImageUpload } from "@/components/media/image-upload";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { ChevronDownIcon } from "@/components/ui/admin-icons";
import {
  buttonClass,
  DirectorySelector,
  FormField,
  inputClass,
  panelClass,
  primaryButtonClass,
} from "./controls";

function ProgramSelector({
  universityId,
  value,
  selectedLabel,
  onChange,
}: {
  universityId: string;
  value: string;
  selectedLabel?: string;
  onChange: (value: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const list = useUniversitySection("programs", universityId, {
    page,
    limit: 50,
    search: search.trim() || undefined,
  });

  const options: SearchableSelectOption[] = (list.data?.items ?? []).map((item) => ({
    value: item.id,
    label: item.nameAr ?? item.academicMajor.nameAr,
    sublabel: `${studyLevelLabel(item.studyLevel)}${item.facultyNameAr ? ` · ${item.facultyNameAr}` : ""}`,
  }));

  if (value && !options.some((item) => item.value === value)) {
    options.unshift({
      value,
      label: selectedLabel ?? `${value} (مختار)`,
    });
  }

  const pagination = list.data?.pagination;

  return (
    <SearchableSelect
      label="البرنامج المستهدف"
      required
      value={value}
      onChange={onChange}
      options={options}
      placeholder="اختر البرنامج"
      clearLabel="إلغاء اختيار البرنامج"
      searchPlaceholder="ابحث باسم البرنامج..."
      searchValue={search}
      onSearchChange={(q) => {
        setSearch(q);
        setPage(1);
      }}
      isLoading={list.isFetching}
      isError={list.isError}
      onRetry={() => void list.refetch()}
      emptyMessage="لا توجد برامج مطابقة في هذه الجامعة."
      dropdownFooter={
        pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="tabular-nums">
              صفحة {pagination.page} من {pagination.totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-[var(--line)] bg-white px-2 py-0.5 font-medium text-[var(--navy)] disabled:opacity-40"
              >
                السابق
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-[var(--line)] bg-white px-2 py-0.5 font-medium text-[var(--navy)] disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </div>
        ) : null
      }
    />
  );
}

const statusOptionLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

const selectClass = `${inputClass} appearance-none pr-3 pl-9`;

export function SectionEditor<K extends UniversitySection>({
  section,
  universityId,
  record,
  close,
}: {
  section: K;
  universityId: string;
  record?: SectionRecords[K];
  close: (saved?: boolean) => void;
}) {
  const [values, setValues] = useState(() => sectionValues(section, record));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const save = useUniversitySave(section, universityId);
  const studyLanguageCatalog = useStudyLanguageCatalog();
  const set = (name: string, value: string) =>
    setValues((old) => ({ ...old, [name]: value }));
  const selectedLanguageCodes = values.languages.split(",").filter(Boolean);
  const languageOptions = (
    studyLanguageCatalog.data?.map(({ code, nameAr }) => ({ code, nameAr })) ??
    teachingLanguages.map((code) => ({ code, nameAr: teachingLanguageLabels[code] }))
  );
  for (const code of selectedLanguageCodes) {
    if (!languageOptions.some((option) => option.code === code)) {
      languageOptions.push({ code, nameAr: teachingLanguageLabels[code] ?? code });
    }
  }

  const field = (
    name: string,
    label: string,
    type = "text",
    maxLength?: number,
    colSpan?: string,
  ) => (
    <div key={name} className={colSpan}>
      <FormField label={label}>
        <label className="sr-only" htmlFor={`phase2-${name}`}>
          {label}
        </label>
        {type === "textarea" ? (
          <textarea
            id={`phase2-${name}`}
            aria-invalid={Boolean(errors[name])}
            rows={5}
            className={inputClass}
            maxLength={maxLength}
            value={values[name] ?? ""}
            onChange={(e) => set(name, e.target.value)}
          />
        ) : (
          <input
            id={`phase2-${name}`}
            aria-invalid={Boolean(errors[name])}
            dir={
              type === "url" ||
              type === "number" ||
              type === "datetime-local" ||
              ["academicYear", "currency", "amount"].includes(name)
                ? "ltr"
                : undefined
            }
            type={type}
            maxLength={maxLength}
            min={type === "number" ? 1 : undefined}
            max={type === "number" ? 240 : undefined}
            className={inputClass}
            value={values[name] ?? ""}
            onChange={(e) => set(name, e.target.value)}
          />
        )}
        {errors[name] ? (
          <p role="alert" className="text-xs font-medium text-red-700">
            {errors[name]}
          </p>
        ) : null}
      </FormField>
    </div>
  );

  const select = (
    name: string,
    label: string,
    options: readonly { value: string; label: string }[],
    blank = false,
  ) => (
    <FormField key={name} label={label}>
      <div className="relative">
        <select
          aria-label={label}
          className={selectClass}
          value={values[name] ?? ""}
          onChange={(e) => set(name, e.target.value)}
        >
          {blank ? <option value="">بلا اختيار</option> : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]" />
      </div>
      {errors[name] ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {errors[name]}
        </p>
      ) : null}
    </FormField>
  );

  const sectionHeading =
    section === "programs"
      ? record
        ? "تعديل البرنامج الأكاديمي والرسوم"
        : "إضافة برنامج أكاديمي جديد"
      : section === "admission-requirements"
        ? record
          ? "تعديل متطلب القبول"
          : "إضافة متطلب قبول جديد"
        : record
          ? "تعديل صورة المعرض"
          : "إضافة صورة إلى معرض الجامعة";

  return (
    <form
      className={panelClass}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setErrors({});
        setMessage("");
        try {
          const input = sectionPayload(section, values, record) as Partial<SectionInputs[K]>;
          if (
            (input.status === "PUBLISHED" || input.status === "ARCHIVED") &&
            input.status !== record?.status &&
            !window.confirm("تأكيد تغيير الحالة التحريرية؟")
          )
            return;
          await save.mutateAsync({ input, id: record?.id });
          close(true);
        } catch (error) {
          if (error instanceof z.ZodError) {
            setErrors(
              Object.fromEntries(
                error.issues.map((issue) => [
                  String(issue.path[0] ?? "form"),
                  `تحقق من هذا الحقل: ${issue.path.join(".") || "النموذج"}.`,
                ]),
              ),
            );
            setMessage("راجع الحقول المطلوبة وصيغ القيم.");
          } else {
            const fields = getApiFieldErrors(error);
            setErrors(
              Object.fromEntries(
                Object.entries(fields).map(([key, messages]) => [key, messages[0]]),
              ),
            );
            const normalized = normalizeApiError(error);
            if (normalized.kind !== "cancelled")
              setMessage(
                error instanceof Error && error.message.startsWith("النشر")
                  ? error.message
                  : normalized.status === 409
                    ? "تعارض مع سجل موجود. راجع القيم؛ لم تُفقد التعديلات."
                    : normalized.status === 403
                      ? "لا توجد صلاحية لتنفيذ الإجراء."
                      : "تعذّر الحفظ؛ بيانات النموذج محفوظة. راجع الحقول والاتصال.",
              );
          }
        }
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
        <h3 className="text-base font-bold text-[var(--navy)]">{sectionHeading}</h3>
        <button
          type="button"
          className={buttonClass}
          disabled={save.isPending}
          onClick={() => close()}
        >
          إغلاق المحرر
        </button>
      </div>

      {message ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          {message}
        </p>
      ) : null}

      <fieldset disabled={save.isPending} className="space-y-6">
        {section === "programs" ? (
          <>
            <div className="space-y-4">
              <div className="border-b border-[var(--line)] pb-2">
                <h4 className="text-sm font-bold text-[var(--navy)]">
                  البيانات الأكاديمية ولغات التدريس
                </h4>
                <p className="text-xs text-[var(--muted)]">
                  التخصص المرتبط والكلية والمستوى الدراسي والمدة المعتمدة.
                </p>
              </div>

              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <div className="min-w-0">
                  <DirectorySelector
                    kind="academic-majors"
                    value={values.academicMajorId ?? ""}
                    label="التخصص الأكاديمي *"
                    selectedLabel={
                      record && "academicMajor" in record ? record.academicMajor.nameAr : undefined
                    }
                    onChange={(value) => set("academicMajorId", value)}
                  />
                  {errors.academicMajorId ? (
                    <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                      {errors.academicMajorId}
                    </p>
                  ) : null}
                </div>

                {field("nameAr", "اسم البرنامج بالعربية *", "text", 300)}
                {field("facultyNameAr", "الكلية بالعربية", "text", 300)}
                {select(
                  "studyLevel",
                  "المستوى الدراسي *",
                  programStudyLevels.map((v) => ({ value: v, label: programStudyLevelLabels[v] })),
                )}
                {field("durationValue", "مدة الدراسة", "number")}
                {select(
                  "durationUnit",
                  "وحدة المدة",
                  (["MONTHS", "YEARS"] as const).map((v) => ({
                    value: v,
                    label: durationUnitLabels[v],
                  })),
                  true,
                )}

                <div className="md:col-span-2">
                  <FormField label="لغات الدراسة *">
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {languageOptions.map((language) => {
                        const code = language.code;
                        const checked = selectedLanguageCodes.includes(code);
                        return (
                          <label
                            key={code}
                            className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              checked
                                ? "border-[var(--navy)] bg-[var(--navy)]/5 text-[var(--navy)]"
                                : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--line-strong)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="size-4 accent-[var(--navy)]"
                              checked={checked}
                              onChange={(e) =>
                                set(
                                  "languages",
                                  (e.target.checked
                                    ? [...selectedLanguageCodes, code]
                                    : selectedLanguageCodes.filter((value) => value !== code)
                                  ).join(","),
                                )
                              }
                            />
                            <span>{language.nameAr}</span>
                          </label>
                        );
                      })}
                    </div>
                    {studyLanguageCatalog.isFetching ? (
                      <p className="mt-1.5 text-[11px] text-[var(--muted)]">جارٍ تحميل كتالوج لغات الدراسة…</p>
                    ) : studyLanguageCatalog.isError ? (
                      <p className="mt-1.5 text-[11px] text-red-700">تعذّر تحميل كتالوج اللغات؛ تظهر الخيارات المحفوظة فقط حتى إعادة المحاولة.</p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-[var(--muted)]">تأتي الخيارات وأسماؤها العربية من كتالوج لغات الدراسة المعتمد.</p>
                    )}
                    {errors.languages ? (
                      <p role="alert" className="text-xs font-medium text-red-700">
                        {errors.languages}
                      </p>
                    ) : null}
                  </FormField>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs font-bold text-[var(--navy)]">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--navy)]"
                    checked={values.includeTuition === "yes"}
                    onChange={(e) => set("includeTuition", e.target.checked ? "yes" : "")}
                  />
                  <span>إضافة / تحديث رسوم سنة أكاديمية محددة</span>
                </label>
                <span className="text-[11px] text-amber-900">
                  يحفظ رسوم سنة واحدة دون استبدال سجل السنوات الأخرى
                </span>
              </div>

              {values.includeTuition === "yes" ? (
                <div className="grid gap-4 border-t border-[var(--line)] pt-3 sm:grid-cols-2">
                  {field("amount", "المبلغ *", "text", 13)}
                  {field("currency", "رمز العملة (مثل USD) *", "text", 3)}
                  {select(
                    "billingPeriod",
                    "دورية الرسوم *",
                    (["YEAR", "SEMESTER", "FULL_PROGRAM"] as const).map((v) => ({
                      value: v,
                      label: billingPeriodLabels[v],
                    })),
                  )}
                  {field("academicYear", "السنة الأكاديمية (2026/2027) *", "text", 9)}
                  {errors.tuition ? (
                    <p role="alert" className="text-xs font-medium text-red-700 sm:col-span-2">
                      {errors.tuition}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {section === "admission-requirements" ? (
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {record ? (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--navy)] md:col-span-2">
                <span className="font-semibold">النطاق والهدف ثابتان: </span>
                <span>{"scope" in record ? admissionScopeLabels[record.scope] : ""}</span>
                <span aria-hidden="true"> · </span>
                <span>
                  {"studyLevel" in record && typeof record.studyLevel === "string"
                    ? studyLevelLabel(record.studyLevel)
                    : "program" in record && record.program?.nameAr
                      ? record.program.nameAr
                      : "programId" in record && record.programId
                        ? record.programId
                        : "على مستوى الجامعة"}
                </span>
              </div>
            ) : (
              <>
                {select(
                  "scope",
                  "نطاق المتطلبات *",
                  admissionScopes.map((v) => ({ value: v, label: admissionScopeLabels[v] })),
                )}
                {values.scope === "STUDY_LEVEL" ? (
                  select(
                    "studyLevel",
                    "المستوى المستهدف *",
                    programStudyLevels.map((v) => ({
                      value: v,
                      label: programStudyLevelLabels[v],
                    })),
                    true,
                  )
                ) : values.scope === "PROGRAM" ? (
                  <div className="min-w-0">
                    <ProgramSelector
                      universityId={universityId}
                      value={values.programId ?? ""}
                      onChange={(value) => set("programId", value)}
                    />
                    {errors.programId ? (
                      <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                        {errors.programId}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}

            {field("contentAr", "متطلبات القبول بالعربية *", "textarea", 20000, "md:col-span-2")}
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="border-b border-[var(--line)] pb-2">
            <h4 className="text-sm font-bold text-[var(--navy)]">
              {section === "gallery" ? "بيانات الصورة والحالة" : "التوثيق والحالة التحريرية"}
            </h4>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {section !== "gallery" ? (
              <>
                {field("officialSourceUrl", "رابط المصدر الرسمي *", "url", 2048)}
                {field("verifiedAt", "تاريخ التحقق *", "datetime-local")}
              </>
            ) : (
              <>
                {field("altAr", "النص البديل بالعربية", "text", 500)}
                <div className="md:col-span-2">
                  <ImageUpload
                    resource="universities"
                    label="رفع صورة للمعرض"
                    manualUrlAvailable={false}
                    onUploaded={(url) => set("imageUrl", url)}
                    disabled={save.isPending}
                  />
                </div>
              </>
            )}

            {select(
              "status",
              "الحالة التحريرية",
              (["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((v) => ({
                value: v,
                label: statusOptionLabels[v],
              })),
            )}
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
        <button type="submit" className={primaryButtonClass} disabled={save.isPending}>
          {save.isPending ? "جارٍ الحفظ…" : "حفظ السجل"}
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={save.isPending}
          onClick={() => close()}
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
