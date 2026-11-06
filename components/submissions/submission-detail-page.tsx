"use client";

import Link from "next/link";
import { useState } from "react";
import { getApiFieldErrors } from "@/lib/api-client/error";
import { isSubmissionId, submissionStatuses, submissionStatusUpdateSchema, type Submission, type SubmissionResource, type SubmissionStatus } from "@/lib/api-client/submissions";
import { LoadingState } from "@/components/dashboard/states";
import { useSubmissionMutation } from "@/hook/mutations/use-submission-mutation";
import { useSubmissionDetail } from "@/hook/queries/use-submission-queries";
import { applicationTypeLabels, submissionChanges, submissionLabels, submissionStatusLabels } from "@/lib/submissions";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { SubmissionError, SubmissionField, SubmissionStatusBadge, submissionButtonClass, submissionControlClass, submissionDate } from "./submission-ui";

function DetailValue({ label, value, ltr = false }: { label: string; value: string | null; ltr?: boolean }) {
  return <div className="min-w-0"><dt className="text-sm font-semibold text-[var(--muted)]">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"><bdi dir={ltr ? "ltr" : "auto"}>{value ?? "—"}</bdi></dd></div>;
}
function WorkflowEditor({ resource, record }: { resource: SubmissionResource; record: Submission }) {
  const mutation = useSubmissionMutation(resource, record.id);
  const [baseline, setBaseline] = useState(record);
  const [status, setStatus] = useState<SubmissionStatus>(record.status);
  const [note, setNote] = useState<string | null>(record.internalNote);
  const [validation, setValidation] = useState<string>();
  const [success, setSuccess] = useState(false);
  const input = submissionChanges(baseline, status, note);
  const fields = mutation.isError ? getApiFieldErrors(mutation.error) : {};
  const noteTooLong = note !== null && note.length > 5000;
  function changed() { setSuccess(false); setValidation(undefined); mutation.reset(); }
  return <form onSubmit={async (event) => {
    event.preventDefault();
    if (mutation.isPending) return;
    setSuccess(false);
    const parsed = submissionStatusUpdateSchema.safeParse(input);
    if (!parsed.success) { setValidation(parsed.error.issues[0]?.message ?? "تحقق من البيانات."); return; }
    setValidation(undefined);
    try {
      const updated = await mutation.mutateAsync(parsed.data);
      setBaseline(updated); setStatus(updated.status); setNote(updated.internalNote); setSuccess(true);
    } catch { /* Preserve edits after an unsuccessful request. */ }
  }} className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-6">
    <h3 className="text-lg font-bold">إدارة الحالة والملاحظة الداخلية</h3>
    <p className="text-sm text-[var(--muted)]">الملاحظة خاصة بفريق الإدارة.</p>
    <fieldset disabled={mutation.isPending} className="min-w-0 space-y-4">
      <SubmissionField label="حالة المعالجة"><select className={submissionControlClass} value={status} onChange={(event) => { changed(); setStatus(event.target.value as SubmissionStatus); }} aria-invalid={Boolean(fields.status)} aria-describedby={fields.status ? "workflow-status-error" : undefined}>{submissionStatuses.map((value) => <option key={value} value={value}>{submissionStatusLabels[value]}</option>)}</select></SubmissionField>
      {fields.status ? <p id="workflow-status-error" role="alert" className="text-sm text-red-800">تحقق من حالة المعالجة المختارة.</p> : null}
      <SubmissionField label="الملاحظة الداخلية"><textarea className={`${submissionControlClass} min-h-40 whitespace-pre-wrap`} value={note ?? ""} onChange={(event) => { changed(); setNote(event.target.value); }} aria-invalid={noteTooLong || Boolean(fields.internalNote)} aria-describedby="workflow-note-help workflow-note-error" /></SubmissionField>
      <p id="workflow-note-help" className="text-xs text-[var(--muted)]">{note?.length ?? 0} / 5000 حرف</p>
      <button type="button" onClick={() => { changed(); setNote(null); }} className="min-h-11 rounded-lg border border-[var(--line)] px-3 text-sm" disabled={note === null}>مسح الملاحظة</button>
      <p id="workflow-note-error" role={noteTooLong || fields.internalNote ? "alert" : undefined} className="text-sm text-red-800">{noteTooLong ? "الحد الأقصى للملاحظة 5000 حرف." : fields.internalNote ? "لم يقبل الخادم الملاحظة الداخلية. تحقق من طولها ومحتواها." : null}</p>
      <button className={submissionButtonClass} disabled={mutation.isPending || noteTooLong || Object.keys(input).length === 0}>{mutation.isPending ? "جارٍ الحفظ" : "حفظ التغييرات"}</button>
    </fieldset>
    {validation ? <p role="alert" className="text-sm text-red-800">{validation}</p> : null}
    {mutation.isError ? <SubmissionError error={mutation.error} /> : null}
    {success ? <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-900">تم حفظ التغييرات بنجاح.</p> : null}
  </form>;
}
export function SubmissionDetailPage({ resource, id }: { resource: SubmissionResource; id: string }) {
  const { mockEnabled } = useAdminAccess();
  const detail = useSubmissionDetail(resource, id);
  const record = detail.data;
  return <section className="min-w-0 space-y-5">
    <Link href={`/admin/${resource}`} className="inline-flex min-h-11 items-center font-bold underline">العودة إلى {submissionLabels[resource]}</Link>
    <h2 className="text-2xl font-bold">{resource === "applications" ? "تفاصيل طلب التقديم" : "تفاصيل الاستفسار"}</h2>
    {!isSubmissionId(id) ? <p role="alert">معرّف السجل غير صالح.</p> : mockEnabled ? <p>استخدم جلسة حقيقية لعرض التفاصيل.</p> : detail.isPending ? <LoadingState /> : detail.isError ? <SubmissionError error={detail.error} retry={() => void detail.refetch()} /> : record ? <>
      <div className="space-y-5 rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-6"><SubmissionStatusBadge status={record.status} /><dl className="grid min-w-0 gap-5 sm:grid-cols-2">
        <DetailValue label="الاسم الكامل" value={record.fullName} /><DetailValue label="البريد الإلكتروني" value={record.email} ltr /><DetailValue label="الهاتف" value={record.phone} ltr />
        {"applicationType" in record ? <><DetailValue label="نوع الطلب" value={applicationTypeLabels[record.applicationType]} /><DetailValue label="معرّف الدولة" value={record.countryId} ltr /><DetailValue label="معرّف الجامعة" value={record.universityId} ltr /><DetailValue label="معرّف المنحة" value={record.scholarshipId} ltr /><DetailValue label="المستوى الدراسي" value={record.studyLevel} /><DetailValue label="التخصص المقصود" value={record.intendedMajor} /></> : <DetailValue label="الموضوع" value={record.subject} />}
        <div className="min-w-0 sm:col-span-2"><DetailValue label="الرسالة" value={record.message} /></div>
        <DetailValue label="تاريخ قبول الخصوصية" value={submissionDate(record.privacyAcceptedAt)} /><DetailValue label="تاريخ الإرسال" value={submissionDate(record.createdAt)} /><DetailValue label="آخر تحديث" value={submissionDate(record.updatedAt)} />
      </dl></div>
      <WorkflowEditor key={record.id} resource={resource} record={record} />
    </> : null}
  </section>;
}
