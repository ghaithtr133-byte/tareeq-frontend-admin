"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AcademicMajor } from "@/lib/api-client/university-management";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { useAcademicMajorDelete, useAcademicMajorUpdate, useDirectoryCreate } from "@/hook/mutations/use-university-management";
import { useDirectoryList, useInfiniteDirectoryList } from "@/hook/queries/use-university-management";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  academicMajorCreatePayload,
  academicMajorFormErrors,
  academicMajorPatchPayload,
  emptyAcademicMajorFormValues,
  findAcademicMajorDuplicates,
  type AcademicMajorFormValues,
} from "@/lib/academic-major-management";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { DebouncedSearchBar } from "@/components/ui/debounced-search-bar";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/ui/admin-icons";
import { buttonClass, inputClass, PageControls, panelClass, primaryButtonClass } from "./controls";

type Editor = { mode: "create" } | { mode: "edit"; major: AcademicMajor };
type FormErrors = Partial<Record<keyof AcademicMajorFormValues, string>>;

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return mobile;
}

export function AcademicMajorsManagementPage() {
  const access = useAdminAccess();
  const isMobile = useIsMobile();
  const [params, setParams] = useState({ page: 1, search: "" });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [values, setValues] = useState<AcademicMajorFormValues>(emptyAcademicMajorFormValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [majorToDelete, setMajorToDelete] = useState<AcademicMajor | null>(null);
  const nameArRef = useRef<HTMLInputElement>(null);
  const nameEnRef = useRef<HTMLInputElement>(null);
  const queryParams = { page: params.page, limit: 12, search: params.search.trim() || undefined };
  const list = useDirectoryList("academic-majors", queryParams);
  const mobileList = useInfiniteDirectoryList("academic-majors", { page: 1, limit: 5, search: queryParams.search }, isMobile);
  const create = useDirectoryCreate("academic-majors");
  const update = useAcademicMajorUpdate();
  const remove = useAcademicMajorDelete();
  const duplicateArabic = useDirectoryList("academic-majors", { page: 1, limit: 50, search: values.nameAr.trim() || undefined }, Boolean(editor && values.nameAr.trim()));
  const duplicateEnglish = useDirectoryList("academic-majors", { page: 1, limit: 50, search: values.nameEn.trim() || undefined }, Boolean(editor && values.nameEn.trim()));
  const mobileMajors = useMemo(() => {
    const unique = new Map<string, AcademicMajor>();
    for (const page of mobileList.data?.pages ?? []) for (const major of page.items) unique.set(major.id, major);
    return [...unique.values()];
  }, [mobileList.data?.pages]);
  const isSaving = create.isPending || update.isPending;
  const isDirty = editor
    ? editor.mode === "create"
      ? Object.values(values).some(Boolean)
      : values.nameAr !== editor.major.nameAr || values.nameEn !== editor.major.nameEn
    : false;

  function openCreate() {
    setEditor({ mode: "create" }); setValues(emptyAcademicMajorFormValues); setErrors({}); setSubmitError(""); setNotice("");
  }
  function openEdit(major: AcademicMajor) {
    setEditor({ mode: "edit", major }); setValues({ nameAr: major.nameAr, nameEn: major.nameEn }); setErrors({}); setSubmitError(""); setNotice("");
  }
  function finishClose() { setEditor(null); setConfirmClose(false); setErrors({}); setSubmitError(""); }
  function requestClose() { if (!isSaving) { if (isDirty) setConfirmClose(true); else finishClose(); } }
  function focusFirstError(nextErrors: FormErrors) {
    setErrors(nextErrors);
    requestAnimationFrame(() => { if (nextErrors.nameAr) nameArRef.current?.focus(); else if (nextErrors.nameEn) nameEnRef.current?.focus(); });
  }
  function conflictErrors(): FormErrors {
    if (editor?.mode !== "edit") return { nameAr: "هذا التخصص موجود مسبقاً.", nameEn: "هذا التخصص موجود مسبقاً." };
    const errors: FormErrors = {};
    if (values.nameAr.trim() !== editor.major.nameAr) errors.nameAr = "هذا التخصص موجود مسبقاً.";
    if (values.nameEn.trim() !== editor.major.nameEn) errors.nameEn = "هذا التخصص موجود مسبقاً.";
    return Object.keys(errors).length ? errors : { nameAr: "هذا التخصص موجود مسبقاً.", nameEn: "هذا التخصص موجود مسبقاً." };
  }
  function backendMessage(error: unknown, action: "save" | "delete") {
    const normalized = normalizeApiError(error);
    if (normalized.status === 409 && action === "delete") return "لا يمكن حذف هذا التخصص لأنه مرتبط ببرامج جامعية. لم تتغير البرامج المرتبطة.";
    if (normalized.status === 409) return "هذا التخصص موجود مسبقاً. بقيت بيانات النموذج كما هي.";
    if (normalized.status === 403) return "لا تملك صلاحية تنفيذ هذه العملية.";
    return action === "delete" ? "تعذّر حذف التخصص. لم تتغير القائمة." : "تعذّر الحفظ. بقيت بيانات النموذج كما هي.";
  }
  async function saveMajor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editor) return; setSubmitError("");
    const validation = academicMajorFormErrors(values);
    const localErrors: FormErrors = Object.fromEntries(Object.entries(validation).filter((entry): entry is [keyof AcademicMajorFormValues, string] => Boolean(entry[1])));
    if (Object.keys(localErrors).length) { focusFirstError(localErrors); return; }
    const candidates = new Map<string, AcademicMajor>();
    for (const major of [...(duplicateArabic.data?.items ?? []), ...(duplicateEnglish.data?.items ?? [])]) candidates.set(major.id, major);
    const duplicateErrors = findAcademicMajorDuplicates([...candidates.values()], values, editor.mode === "edit" ? editor.major.id : undefined);
    if (Object.keys(duplicateErrors).length) { focusFirstError(duplicateErrors); return; }
    try {
      if (editor.mode === "create") { await create.mutateAsync(academicMajorCreatePayload(values)); setNotice("تمت إضافة التخصص بنجاح."); }
      else { await update.mutateAsync({ id: editor.major.id, input: academicMajorPatchPayload(values, editor.major) }); setNotice("تم تحديث التخصص بنجاح."); }
      finishClose();
    } catch (error) {
      const apiErrors = Object.fromEntries(Object.entries(getApiFieldErrors(error)).flatMap(([field, messages]) => ["nameAr", "nameEn"].includes(field) && messages[0] ? [[field, messages[0]]] : [])) as FormErrors;
      if (Object.keys(apiErrors).length) focusFirstError(apiErrors);
      else if (normalizeApiError(error).status === 409) focusFirstError(conflictErrors());
      setSubmitError(backendMessage(error, "save"));
    }
  }
  async function confirmDelete() {
    if (!majorToDelete) return; setSubmitError("");
    try {
      await remove.mutateAsync(majorToDelete.id);
      if (list.data && list.data.items.length === 1 && params.page > 1) setParams((current) => ({ ...current, page: current.page - 1 }));
      setNotice("تم حذف التخصص بنجاح."); setMajorToDelete(null);
    } catch (error) { setSubmitError(backendMessage(error, "delete")); setMajorToDelete(null); }
  }
  const renderActions = (major: AcademicMajor) => <div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} onClick={() => openEdit(major)}><PencilIcon className="size-3.5" />تعديل</button><button type="button" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50" onClick={() => setMajorToDelete(major)}><TrashIcon className="size-3.5" />حذف</button></div>;

  return <section className="space-y-5" dir="rtl">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold text-[var(--gold-dark)]">الأدلة المرجعية</p><h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">التخصصات الأكاديمية</h2><p className="mt-1 text-sm text-[var(--muted)]">إدارة التخصصات المستخدمة في البرامج الجامعية</p></div><button type="button" className={primaryButtonClass} onClick={openCreate} disabled={access.mockEnabled} title={access.mockEnabled ? "الإضافة تتطلب جلسة خادم متصلة." : undefined}><PlusIcon className="size-4" />إضافة تخصص</button></header>
    {access.mockEnabled ? <div className={panelClass} role="status"><p className="font-semibold text-[var(--navy)]">إدارة التخصصات غير متاحة في المعاينة المحلية.</p><p className="text-sm text-[var(--muted)]">تتطلب الإضافة والتعديل والحذف جلسة ADMIN أو SUPER_ADMIN متصلة بالخادم؛ لا تُحاكي هذه الصفحة نجاح عمليات CRUD.</p></div> : <>
      <DebouncedSearchBar value={params.search} onDebouncedChange={(search) => setParams({ page: 1, search })} delayMs={1000} placeholder="ابحث عن تخصص..." ariaLabel="بحث في التخصصات" isFetching={list.isFetching || mobileList.isFetching} />
      {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</p> : null}
      {submitError && !editor && !majorToDelete ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{submitError}</p> : null}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] md:block">{list.isPending ? <LoadingState /> : list.isError ? <ErrorState action={<button className={primaryButtonClass} onClick={() => void list.refetch()}>إعادة المحاولة</button>} /> : (list.data?.items.length ?? 0) === 0 ? <EmptyState /> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-right text-sm"><thead className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]"><tr><th className="px-5 py-3.5 font-semibold">اسم التخصص بالعربية</th><th className="px-5 py-3.5 font-semibold">الاسم بالإنجليزية</th><th className="px-5 py-3.5 font-semibold">الإجراءات</th></tr></thead><tbody>{list.data?.items.map((major) => <tr key={major.id} className="border-b border-[var(--line)] last:border-0"><td className="px-5 py-4 font-semibold text-[var(--navy)]">{major.nameAr}</td><td dir="ltr" className="px-5 py-4 text-right text-[var(--muted)]">{major.nameEn}</td><td className="px-5 py-3">{renderActions(major)}</td></tr>)}</tbody></table></div>}</div>
      <div className="hidden md:block"><PageControls data={list.data} change={(page) => setParams((current) => ({ ...current, page }))} /></div>
      <div className="space-y-3 md:hidden">{mobileList.isPending ? <LoadingState /> : mobileList.isError ? <ErrorState action={<button className={primaryButtonClass} onClick={() => void mobileList.refetch()}>إعادة المحاولة</button>} /> : mobileMajors.length === 0 ? <EmptyState /> : mobileMajors.map((major) => <article key={major.id} className={panelClass}><div><h3 className="font-bold text-[var(--navy)]">{major.nameAr}</h3><p dir="ltr" className="mt-1 text-sm text-[var(--muted)]">{major.nameEn}</p></div>{renderActions(major)}</article>)}{mobileList.hasNextPage ? <button type="button" className={`${buttonClass} w-full`} disabled={mobileList.isFetchingNextPage} onClick={() => void mobileList.fetchNextPage()}>{mobileList.isFetchingNextPage ? "جارٍ تحميل المزيد…" : "تحميل المزيد"}</button> : null}</div>
    </>}
    {editor ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-5" role="presentation"><form noValidate onSubmit={saveMajor} role="dialog" aria-modal="true" aria-labelledby="major-form-title" className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"><div className="mb-5"><h3 id="major-form-title" className="text-lg font-bold text-[var(--navy)]">{editor.mode === "create" ? "إضافة تخصص" : "تعديل التخصص"}</h3><p className="mt-1 text-sm text-[var(--muted)]">{editor.mode === "create" ? "يُنشأ المعرّف النصي تلقائياً من الاسم الإنجليزي." : "يبقى المعرّف النصي والفئة التاريخية كما هما عند التعديل."}</p></div><fieldset disabled={isSaving} className="space-y-4"><label className="block text-sm font-semibold text-[var(--navy)]">اسم التخصص بالعربية *<input ref={nameArRef} value={values.nameAr} onChange={(event) => setValues((current) => ({ ...current, nameAr: event.target.value }))} aria-invalid={Boolean(errors.nameAr)} aria-describedby={errors.nameAr ? "major-name-ar-error" : undefined} maxLength={200} className={`${inputClass} mt-1.5 ${errors.nameAr ? "border-red-400" : ""}`} /></label>{errors.nameAr ? <p id="major-name-ar-error" role="alert" className="text-xs font-medium text-red-700">{errors.nameAr}</p> : null}<label className="block text-sm font-semibold text-[var(--navy)]">اسم التخصص بالإنجليزية *<input ref={nameEnRef} dir="ltr" value={values.nameEn} onChange={(event) => setValues((current) => ({ ...current, nameEn: event.target.value }))} aria-invalid={Boolean(errors.nameEn)} aria-describedby={errors.nameEn ? "major-name-en-error" : undefined} maxLength={200} className={`${inputClass} mt-1.5 ${errors.nameEn ? "border-red-400" : ""}`} /></label>{errors.nameEn ? <p id="major-name-en-error" role="alert" className="text-xs font-medium text-red-700">{errors.nameEn}</p> : null}</fieldset>{submitError ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800">{submitError}</p> : null}<div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4"><button type="submit" className={primaryButtonClass} disabled={isSaving}>{isSaving ? "جارٍ الحفظ…" : editor.mode === "create" ? "إضافة التخصص" : "حفظ التعديلات"}</button><button type="button" className={buttonClass} disabled={isSaving} onClick={requestClose}>إلغاء</button></div></form></div> : null}
    {confirmClose ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-5" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="discard-major-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h3 id="discard-major-title" className="font-bold text-[var(--navy)]">إلغاء التعديلات؟</h3><p className="mt-2 text-sm text-[var(--muted)]">سيتم فقدان القيم غير المحفوظة.</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white" onClick={finishClose}>تجاهل التعديلات</button><button type="button" className={buttonClass} onClick={() => setConfirmClose(false)}>متابعة التعديل</button></div></div></div> : null}
    {majorToDelete ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-5" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="delete-major-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h3 id="delete-major-title" className="font-bold text-[var(--navy)]">حذف التخصص؟</h3><p className="mt-2 text-sm text-[var(--muted)]">سيُحذف «{majorToDelete.nameAr}» نهائياً. لا تُحذف البرامج الجامعية المرتبطة، وقد يرفض الخادم الحذف لحمايتها.</p>{submitError ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{submitError}</p> : null}<div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={remove.isPending} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-45" onClick={() => void confirmDelete()}>{remove.isPending ? "جارٍ الحذف…" : "تأكيد الحذف"}</button><button type="button" className={buttonClass} disabled={remove.isPending} onClick={() => setMajorToDelete(null)}>إلغاء</button></div></div></div> : null}
  </section>;
}
