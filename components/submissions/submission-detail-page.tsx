"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiFieldErrors } from "@/lib/api-client/error";
import {
  isSubmissionId,
  submissionStatuses,
  submissionStatusUpdateSchema,
  type Submission,
  type SubmissionResource,
  type SubmissionStatus,
} from "@/lib/api-client/submissions";
import { LoadingState } from "@/components/dashboard/states";
import { useSubmissionMutation } from "@/hook/mutations/use-submission-mutation";
import { useSubmissionDetail } from "@/hook/queries/use-submission-queries";
import { useContentDetail } from "@/hook/queries/use-content-queries";
import type { AdminContentResource, Country, Scholarship, University } from "@/lib/api-client/content";
import { studyLevelLabel } from "@/lib/content-labels";
import {
  applicationTypeLabels,
  normalizeInternationalPhone,
  submissionChanges,
  submissionLabels,
  submissionStatusLabels,
  whatsappUrl,
} from "@/lib/submissions";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MailIcon,
  PhoneIcon,
  TrashIcon,
} from "@/components/ui/admin-icons";
import {
  SubmissionError,
  SubmissionField,
  SubmissionStatusBadge,
  submissionButtonClass,
  submissionControlClass,
  submissionDate,
  submissionSecondaryButtonClass,
} from "./submission-ui";

function DetailItem({
  label,
  value,
  ltr = false,
  mono = false,
  icon,
}: {
  label: string;
  value: string | null;
  ltr?: boolean;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
        {icon}
        <span>{label}</span>
      </dt>
      <dd
        className={`min-w-0 whitespace-pre-wrap break-words text-sm font-medium text-[var(--navy)] [overflow-wrap:anywhere] ${
          mono ? "font-mono text-xs text-[var(--muted)]" : ""
        }`}
      >
        <bdi dir={ltr ? "ltr" : "auto"}>{value ?? "—"}</bdi>
      </dd>
    </div>
  );
}

function ApplicationRelation({
  label,
  resource,
  id,
}: {
  label: string;
  resource: Extract<AdminContentResource, "countries" | "universities" | "scholarships">;
  id: string | null;
}) {
  const relation = useContentDetail(resource, id ?? undefined);

  if (!id) return <DetailItem label={label} value={null} />;
  if (relation.isPending) {
    return (
      <div className="min-w-0 space-y-1" aria-busy="true" aria-label={`جارٍ تحميل ${label}`}>
        <dt className="text-xs font-semibold text-[var(--muted)]">{label}</dt>
        <dd className="h-4 w-28 animate-pulse rounded bg-slate-200/80" />
      </div>
    );
  }
  if (relation.isError || !relation.data) return <DetailItem label={label} value="غير متاح" />;

  const data = relation.data as Country | University | Scholarship;
  const value = "titleAr" in data ? data.titleAr : data.nameAr;
  return <DetailItem label={label} value={value} />;
}

function EmailDetail({ email, subject }: { email: string; subject?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-w-0 space-y-1">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
        <MailIcon className="size-3.5" />
        <span>البريد الإلكتروني</span>
      </dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-2">
        <a href={`mailto:${email}`} className="min-w-0 break-all text-sm font-medium text-[var(--navy)] underline-offset-2 hover:underline">
          <bdi dir="ltr">{email}</bdi>
        </a>
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`}
            className={submissionSecondaryButtonClass}
          >
            مراسلة بالبريد الإلكتروني
          </a>
          <button type="button" onClick={() => void copyEmail()} className={submissionSecondaryButtonClass}>
            {copied ? "تم النسخ" : "نسخ البريد"}
          </button>
        </div>
      </dd>
    </div>
  );
}

function PhoneDetail({ phone, enableContactActions = false }: { phone: string | null; enableContactActions?: boolean }) {
  const [copied, setCopied] = useState(false);
  const normalized = normalizeInternationalPhone(phone);
  const whatsapp = whatsappUrl(phone);

  async function copyPhone() {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!phone || !enableContactActions) {
    return <DetailItem label="رقم الهاتف" value={phone} ltr icon={<PhoneIcon className="size-3.5" />} />;
  }

  return (
    <div className="min-w-0 space-y-1">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
        <PhoneIcon className="size-3.5" />
        <span>رقم الهاتف</span>
      </dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-2">
        <bdi dir="ltr" className="break-all text-sm font-medium text-[var(--navy)]">{phone}</bdi>
        <div className="flex flex-wrap gap-2">
          {normalized ? (
            <a href={`tel:${normalized}`} className={submissionSecondaryButtonClass}>اتصال هاتفي</a>
          ) : null}
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className={submissionSecondaryButtonClass}
            >
              فتح واتساب
            </a>
          ) : null}
          <button type="button" onClick={() => void copyPhone()} className={submissionSecondaryButtonClass}>
            {copied ? "تم النسخ" : "نسخ الرقم"}
          </button>
        </div>
      </dd>
    </div>
  );
}

function WorkflowEditor({
  resource,
  record,
  onUnsavedChanges,
}: {
  resource: SubmissionResource;
  record: Submission;
  onUnsavedChanges: (value: boolean) => void;
}) {
  const mutation = useSubmissionMutation(resource, record.id);
  const [baseline, setBaseline] = useState(record);
  const [status, setStatus] = useState<SubmissionStatus>(record.status);
  const [note, setNote] = useState<string | null>(record.internalNote);
  const [validation, setValidation] = useState<string>();
  const [success, setSuccess] = useState(false);

  const input = submissionChanges(baseline, status, note);
  const hasChanges = Object.keys(input).length > 0;
  const fields = mutation.isError ? getApiFieldErrors(mutation.error) : {};
  const noteTooLong = note !== null && note.length > 5000;
  const pendingClear = note === null && baseline.internalNote !== null;

  useEffect(() => {
    onUnsavedChanges(hasChanges);
    return () => onUnsavedChanges(false);
  }, [hasChanges, onUnsavedChanges]);

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges]);

  function changed() {
    setSuccess(false);
    setValidation(undefined);
    mutation.reset();
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (mutation.isPending) return;
        setSuccess(false);
        const parsed = submissionStatusUpdateSchema.safeParse(input);
        if (!parsed.success) {
          setValidation(parsed.error.issues[0]?.message ?? "تحقق من البيانات.");
          return;
        }
        setValidation(undefined);
        try {
          const updated = await mutation.mutateAsync(parsed.data);
          setBaseline(updated);
          setStatus(updated.status);
          setNote(updated.internalNote);
          setSuccess(true);
        } catch {
          /* Preserve edits after an unsuccessful request. */
        }
      }}
      className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-20"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <h3 className="text-base font-bold text-[var(--navy)]">إدارة الحالة والملاحظة الداخلية</h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {resource === "inquiries"
              ? "ملاحظة خاصة بفريق الإدارة، ولا تظهر للمستفسر."
              : "الملاحظة الداخلية خاصة بفريق الإدارة فقط ولا تُرسل لصاحب الطلب."}
          </p>
        </div>
        <SubmissionStatusBadge status={baseline.status} />
      </div>

      <fieldset disabled={mutation.isPending} className="min-w-0 space-y-4">
        <SubmissionField label="حالة المعالجة">
          <div className="relative">
            <select
              className={`${submissionControlClass} appearance-none pl-9`}
              value={status}
              onChange={(event) => {
                changed();
                setStatus(event.target.value as SubmissionStatus);
              }}
              aria-invalid={Boolean(fields.status)}
              aria-describedby={fields.status ? "workflow-status-error" : undefined}
            >
              {submissionStatuses.map((value) => (
                <option key={value} value={value}>
                  {submissionStatusLabels[value]}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          </div>
        </SubmissionField>

        {fields.status ? (
          <p id="workflow-status-error" role="alert" className="text-xs font-medium text-red-700">
            تحقق من حالة المعالجة المختارة.
          </p>
        ) : null}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="workflow-internal-note" className="text-xs font-semibold text-[var(--navy)]">
              الملاحظة الداخلية
            </label>
            <span id="workflow-note-help" className="text-[11px] text-[var(--muted)] tabular-nums">
              {note?.length ?? 0} / 5000 حرف
            </span>
          </div>
          <textarea
            id="workflow-internal-note"
            className={`${submissionControlClass} min-h-36 whitespace-pre-wrap`}
            placeholder={
              note === null
                ? "تم اختيار المسح الصريح للملاحظة الداخلية عند الحفظ."
                : "أضف ملاحظة متابعة داخلية للفريق..."
            }
            value={note ?? ""}
            onChange={(event) => {
              changed();
              setNote(event.target.value);
            }}
            aria-invalid={noteTooLong || Boolean(fields.internalNote)}
            aria-describedby="workflow-note-help workflow-note-error"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                changed();
                setNote(null);
              }}
              className={submissionSecondaryButtonClass}
              disabled={note === null}
            >
              <TrashIcon className="size-3.5" />
              <span>{resource === "inquiries" ? "مسح الملاحظة" : "مسح الملاحظة (null)"}</span>
            </button>

            {pendingClear ? (
              <span className="text-[11px] font-medium text-amber-800">
                سيُرسل مسح صريح للملاحظة عند الحفظ
              </span>
            ) : null}
          </div>

          {noteTooLong || fields.internalNote ? (
            <p id="workflow-note-error" role="alert" className="text-xs font-medium text-red-700">
              {noteTooLong
                ? "الحد الأقصى للملاحظة 5000 حرف."
                : "لم يقبل الخادم الملاحظة الداخلية. تحقق من طولها ومحتواها."}
            </p>
          ) : null}
        </div>

        <div className="border-t border-[var(--line)] pt-3">
          <button
            className={`${submissionButtonClass} w-full`}
            disabled={mutation.isPending || noteTooLong || !hasChanges}
          >
            {mutation.isPending ? "جارٍ الحفظ…" : "حفظ التغييرات"}
          </button>
        </div>
      </fieldset>

      {validation ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {validation}
        </p>
      ) : null}
      {mutation.isError ? <SubmissionError error={mutation.error} /> : null}
      {success ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900"
        >
          تم حفظ التغييرات بنجاح.
        </p>
      ) : null}
    </form>
  );
}

export function SubmissionDetailPage({
  resource,
  id,
  returnSearchParams,
}: {
  resource: SubmissionResource;
  id: string;
  returnSearchParams?: string;
}) {
  const { mockEnabled } = useAdminAccess();
  const detail = useSubmissionDetail(resource, id);
  const record = detail.data;
  const validId = isSubmissionId(id);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const listHref = `/admin/${resource}${returnSearchParams ? `?${returnSearchParams}` : ""}`;

  function confirmLeave(event: React.MouseEvent<HTMLAnchorElement>) {
    if (hasUnsavedChanges && !window.confirm("لديك تغييرات غير محفوظة. هل تريد المغادرة؟")) {
      event.preventDefault();
    }
  }

  return (
    <section className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href={listHref}
            onClick={confirmLeave}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--navy)]"
          >
            <ChevronRightIcon className="size-3.5" />
            <span>العودة إلى {submissionLabels[resource]}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-[var(--navy)]">
              {resource === "applications" ? "تفاصيل طلب التقديم" : "تفاصيل الاستفسار"}
            </h2>
            {record ? <SubmissionStatusBadge status={record.status} /> : null}
          </div>
        </div>

        {validId ? (
          <span className="font-mono text-xs text-[var(--muted)] [overflow-wrap:anywhere]" dir="ltr">
            #{id}
          </span>
        ) : null}
      </div>

      {!validId ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-900"
        >
          معرّف السجل غير صالح.
        </div>
      ) : mockEnabled ? (
        <p className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-[var(--shadow-card)]">
          استخدم جلسة خادم حقيقية لعرض تفاصيل السجل وحفظ الملاحظات الداخلية.
        </p>
      ) : detail.isPending ? (
        <LoadingState />
      ) : detail.isError ? (
        <SubmissionError error={detail.error} retry={() => void detail.refetch()} />
      ) : record ? (
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(330px,1fr)] lg:items-start">
          {/* Primary Read-Only Details Column */}
          <div className="min-w-0 space-y-5">
            {/* Applicant / Sender Card */}
            <article className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-card)]">
              <header className="border-b border-[var(--line)] pb-3">
                <h3 className="text-base font-bold text-[var(--navy)]">
                  {resource === "applications" ? "بيانات المتقدم" : "بيانات المرسل"}
                </h3>
              </header>

              <dl className="grid min-w-0 gap-5 sm:grid-cols-2">
                <DetailItem label="الاسم الكامل" value={record.fullName} />
                <EmailDetail email={record.email} subject={"subject" in record ? record.subject : undefined} />
                <PhoneDetail phone={record.phone} enableContactActions={resource === "inquiries"} />
                <DetailItem
                  label="تاريخ الإرسال"
                  value={submissionDate(record.createdAt)}
                  icon={<CalendarIcon className="size-3.5" />}
                />
                <DetailItem
                  label="آخر تحديث"
                  value={submissionDate(record.updatedAt)}
                  icon={<CalendarIcon className="size-3.5" />}
                />
              </dl>
            </article>

            {/* Request Context & Message Card */}
            <article className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-card)]">
              <header className="border-b border-[var(--line)] pb-3">
                <h3 className="text-base font-bold text-[var(--navy)]">
                  {resource === "applications" ? "تفاصيل الطلب والرسالة" : "موضوع الاستفسار والرسالة"}
                </h3>
              </header>

              <dl className="grid min-w-0 gap-5 sm:grid-cols-2">
                {"applicationType" in record ? (
                  <>
                    <DetailItem
                      label="نوع الطلب"
                      value={applicationTypeLabels[record.applicationType]}
                    />
                    <DetailItem
                      label="المستوى الدراسي"
                      value={record.studyLevel ? studyLevelLabel(record.studyLevel) : null}
                    />
                    <DetailItem label="التخصص المقصود" value={record.intendedMajor} />
                    <ApplicationRelation label="الدولة" resource="countries" id={record.countryId} />
                    <ApplicationRelation label="الجامعة" resource="universities" id={record.universityId} />
                    <ApplicationRelation label="المنحة" resource="scholarships" id={record.scholarshipId} />
                  </>
                ) : (
                  <div className="min-w-0 sm:col-span-2">
                    <DetailItem label="الموضوع" value={record.subject} />
                  </div>
                )}

                <div className="min-w-0 border-t border-[var(--line)] pt-4 sm:col-span-2">
                  <dt className="text-xs font-semibold text-[var(--muted)]">نص الرسالة</dt>
                  <dd className="mt-2 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-4 text-sm leading-7 text-[var(--navy)] whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                    <bdi dir="auto">{record.message || "—"}</bdi>
                  </dd>
                </div>
              </dl>
            </article>
          </div>

          {/* Workflow Management Column */}
          <div className="min-w-0">
            <WorkflowEditor
              key={record.id}
              resource={resource}
              record={record}
              onUnsavedChanges={setHasUnsavedChanges}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
