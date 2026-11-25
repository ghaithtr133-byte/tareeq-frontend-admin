"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { City } from "@/lib/api-client/university-management";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { useCityDelete, useCityUpdate, useDirectoryCreate } from "@/hook/mutations/use-university-management";
import { useDirectoryList, useInfiniteDirectoryList } from "@/hook/queries/use-university-management";
import { useContentSelectors } from "@/hook/queries/use-content-queries";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  cityCreatePayload,
  cityFormErrors,
  cityPatchPayload,
  emptyCityFormValues,
  findCityNameDuplicates,
  type CityFormValues,
} from "@/lib/city-management";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/states";
import { DebouncedSearchBar } from "@/components/ui/debounced-search-bar";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PencilIcon, PlusIcon, RotateCcwIcon, TrashIcon } from "@/components/ui/admin-icons";
import { buttonClass, inputClass, PageControls, panelClass, primaryButtonClass } from "./controls";

type Editor = { mode: "create" } | { mode: "edit"; city: City };
type FormErrors = Partial<Record<keyof CityFormValues, string>>;

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

function cityCountryLabel(city: City, countries: readonly { id: string; nameAr: string }[]) {
  return city.country?.nameAr ?? countries.find((country) => country.id === city.countryId)?.nameAr ?? "—";
}

export function CitiesManagementPage() {
  const access = useAdminAccess();
  const isMobile = useIsMobile();
  const [params, setParams] = useState({ page: 1, search: "", countryId: "" });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [values, setValues] = useState<CityFormValues>(emptyCityFormValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);
  const nameArRef = useRef<HTMLInputElement>(null);
  const nameEnRef = useRef<HTMLInputElement>(null);

  const countries = useContentSelectors({ countries: true });
  const countryItems = countries.countries.data?.items ?? [];
  const countryOptions = useMemo(
    () => countryItems.map((country) => ({ value: country.id, label: country.nameAr, sublabel: country.nameEn ?? country.slug })),
    [countryItems],
  );
  const queryParams = {
    page: params.page,
    limit: 12,
    search: params.search.trim() || undefined,
    countryId: params.countryId || undefined,
  };
  const list = useDirectoryList("cities", queryParams);
  const mobileList = useInfiniteDirectoryList(
    "cities",
    { ...queryParams, page: 1, limit: 5 },
    isMobile,
  );
  const create = useDirectoryCreate("cities");
  const update = useCityUpdate();
  const remove = useCityDelete();
  const selectedCountryId = values.countryId || undefined;
  const duplicateArabic = useDirectoryList(
    "cities",
    { page: 1, limit: 50, countryId: selectedCountryId, search: values.nameAr.trim() || undefined },
    Boolean(editor && selectedCountryId && values.nameAr.trim()),
  );
  const duplicateEnglish = useDirectoryList(
    "cities",
    { page: 1, limit: 50, countryId: selectedCountryId, search: values.nameEn.trim() || undefined },
    Boolean(editor && selectedCountryId && values.nameEn.trim()),
  );
  const mobileCities = useMemo(() => {
    const unique = new Map<string, City>();
    for (const page of mobileList.data?.pages ?? []) {
      for (const city of page.items) unique.set(city.id, city);
    }
    return [...unique.values()];
  }, [mobileList.data?.pages]);

  const isSaving = create.isPending || update.isPending;
  const isDirty = editor
    ? editor.mode === "create"
      ? Object.values(values).some(Boolean)
      : values.nameAr !== editor.city.nameAr || values.nameEn !== editor.city.nameEn || values.countryId !== editor.city.countryId
    : false;

  function openCreate() {
    setEditor({ mode: "create" });
    setValues(emptyCityFormValues);
    setErrors({});
    setSubmitError("");
    setNotice("");
  }

  function openEdit(city: City) {
    setEditor({ mode: "edit", city });
    setValues({ nameAr: city.nameAr, nameEn: city.nameEn, countryId: city.countryId });
    setErrors({});
    setSubmitError("");
    setNotice("");
  }

  function finishClose() {
    setEditor(null);
    setConfirmClose(false);
    setErrors({});
    setSubmitError("");
  }

  function requestClose() {
    if (isSaving) return;
    if (isDirty) setConfirmClose(true);
    else finishClose();
  }

  function focusFirstError(nextErrors: FormErrors) {
    setErrors(nextErrors);
    requestAnimationFrame(() => {
      if (nextErrors.nameAr) nameArRef.current?.focus();
      else if (nextErrors.nameEn) nameEnRef.current?.focus();
      else if (nextErrors.countryId) document.getElementById("city-country")?.focus();
    });
  }

  function conflictMessage(error: unknown, action: "save" | "delete") {
    const normalized = normalizeApiError(error);
    if (normalized.status === 409 && action === "delete") {
      return "لا يمكن حذف هذه المدينة لأنها مرتبطة بجامعة. لم تُحذف أي بيانات مرتبطة.";
    }
    if (normalized.status === 409) {
      return "تعذّر الحفظ بسبب تعارض في المدينة أو المعرّف النصي. بقيت بيانات النموذج كما هي؛ راجع الاسم والدولة.";
    }
    if (normalized.status === 403) return "لا تملك صلاحية تنفيذ هذه العملية.";
    return action === "delete" ? "تعذّر حذف المدينة. لم تتغير القائمة." : "تعذّر الحفظ. بقيت بيانات النموذج كما هي.";
  }

  async function saveCity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    setSubmitError("");
    const validation = cityFormErrors(values);
    const localErrors: FormErrors = Object.fromEntries(
      Object.entries(validation).filter((entry): entry is [keyof CityFormValues, string] => Boolean(entry[1])),
    );
    if (Object.keys(localErrors).length) {
      focusFirstError(localErrors);
      return;
    }

    const candidates = new Map<string, City>();
    for (const city of [...(duplicateArabic.data?.items ?? []), ...(duplicateEnglish.data?.items ?? [])]) candidates.set(city.id, city);
    const duplicateErrors = findCityNameDuplicates(
      [...candidates.values()],
      values,
      editor.mode === "edit" ? editor.city.id : undefined,
    );
    if (Object.keys(duplicateErrors).length) {
      focusFirstError(duplicateErrors);
      return;
    }

    try {
      if (editor.mode === "create") {
        await create.mutateAsync(cityCreatePayload(values));
        setNotice("تمت إضافة المدينة بنجاح.");
      } else {
        const payload = cityPatchPayload(values, editor.city);
        await update.mutateAsync({ id: editor.city.id, input: payload });
        setNotice("تم تحديث المدينة بنجاح.");
      }
      finishClose();
    } catch (error) {
      const apiErrors = Object.fromEntries(
        Object.entries(getApiFieldErrors(error)).flatMap(([field, messages]) =>
          ["nameAr", "nameEn", "countryId"].includes(field) && messages[0] ? [[field, messages[0]]] : [],
        ),
      ) as FormErrors;
      if (Object.keys(apiErrors).length) focusFirstError(apiErrors);
      setSubmitError(conflictMessage(error, "save"));
    }
  }

  async function confirmDelete() {
    if (!cityToDelete) return;
    setSubmitError("");
    try {
      await remove.mutateAsync(cityToDelete.id);
      if (list.data && list.data.items.length === 1 && params.page > 1) {
        setParams((current) => ({ ...current, page: current.page - 1 }));
      }
      setNotice("تم حذف المدينة بنجاح.");
      setCityToDelete(null);
    } catch (error) {
      setSubmitError(conflictMessage(error, "delete"));
      setCityToDelete(null);
    }
  }

  const hasFilters = Boolean(params.search || params.countryId);
  const renderActions = (city: City) => (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={buttonClass} onClick={() => openEdit(city)}>
        <PencilIcon className="size-3.5" />
        تعديل
      </button>
      <button
        type="button"
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
        onClick={() => setCityToDelete(city)}
      >
        <TrashIcon className="size-3.5" />
        حذف
      </button>
    </div>
  );

  return (
    <section className="space-y-5" dir="rtl">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold text-[var(--gold-dark)]">الأدلة المرجعية</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">المدن</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">إدارة المدن وربطها بالدول والجامعات</p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={openCreate} disabled={access.mockEnabled} title={access.mockEnabled ? "الإضافة تتطلب جلسة خادم متصلة." : undefined}>
          <PlusIcon className="size-4" />
          إضافة مدينة
        </button>
      </header>

      {access.mockEnabled ? (
        <div className={panelClass} role="status">
          <p className="font-semibold text-[var(--navy)]">إدارة المدن غير متاحة في المعاينة المحلية.</p>
          <p className="text-sm text-[var(--muted)]">تتطلب الإضافة والتعديل والحذف جلسة ADMIN أو SUPER_ADMIN متصلة بالخادم؛ لا تُحاكي هذه الصفحة نجاح عمليات CRUD.</p>
        </div>
      ) : (
        <>
          <DebouncedSearchBar value={params.search} onDebouncedChange={(search) => setParams((current) => ({ ...current, page: 1, search }))} delayMs={1000} placeholder="ابحث عن مدينة..." ariaLabel="بحث في المدن" isFetching={list.isFetching || mobileList.isFetching} />
          <div className={`${panelClass} grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end`}>
            <SearchableSelect label="الدولة" value={params.countryId} onChange={(countryId) => setParams((current) => ({ ...current, page: 1, countryId }))} options={countryOptions} placeholder="كل الدول" clearLabel="كل الدول" isLoading={countries.countries.isFetching} isError={countries.countries.isError} onRetry={() => void countries.countries.refetch()} />
            {hasFilters ? <button type="button" onClick={() => setParams({ page: 1, search: "", countryId: "" })} className={buttonClass}><RotateCcwIcon className="size-3.5" />إعادة ضبط</button> : null}
          </div>

          {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</p> : null}
          {submitError && !editor && !cityToDelete ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{submitError}</p> : null}

          <div className="hidden overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-card)] md:block">
            {list.isPending ? <LoadingState /> : list.isError ? <ErrorState action={<button className={primaryButtonClass} onClick={() => void list.refetch()}>إعادة المحاولة</button>} /> : (list.data?.items.length ?? 0) === 0 ? <EmptyState /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-right text-sm">
                  <thead className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-xs text-[var(--muted)]"><tr><th className="px-5 py-3.5 font-semibold">المدينة بالعربية</th><th className="px-5 py-3.5 font-semibold">الاسم بالإنجليزية</th><th className="px-5 py-3.5 font-semibold">الدولة</th><th className="px-5 py-3.5 font-semibold">الإجراءات</th></tr></thead>
                  <tbody>{list.data?.items.map((city) => <tr key={city.id} className="border-b border-[var(--line)] last:border-0"><td className="px-5 py-4 font-semibold text-[var(--navy)]">{city.nameAr}</td><td dir="ltr" className="px-5 py-4 text-right text-[var(--muted)]">{city.nameEn}</td><td className="px-5 py-4 text-[var(--navy)]">{cityCountryLabel(city, countryItems)}</td><td className="px-5 py-3">{renderActions(city)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
          <div className="hidden md:block"><PageControls data={list.data} change={(page) => setParams((current) => ({ ...current, page }))} /></div>

          <div className="space-y-3 md:hidden">
            {mobileList.isPending ? <LoadingState /> : mobileList.isError ? <ErrorState action={<button className={primaryButtonClass} onClick={() => void mobileList.refetch()}>إعادة المحاولة</button>} /> : mobileCities.length === 0 ? <EmptyState /> : mobileCities.map((city) => <article key={city.id} className={panelClass}><div><h3 className="font-bold text-[var(--navy)]">{city.nameAr}</h3><p dir="ltr" className="mt-1 text-sm text-[var(--muted)]">{city.nameEn}</p><p className="mt-2 text-xs font-medium text-[var(--navy)]">{cityCountryLabel(city, countryItems)}</p></div>{renderActions(city)}</article>)}
            {mobileList.hasNextPage ? <button type="button" className={`${buttonClass} w-full`} disabled={mobileList.isFetchingNextPage} onClick={() => void mobileList.fetchNextPage()}>{mobileList.isFetchingNextPage ? "جارٍ تحميل المزيد…" : "تحميل المزيد"}</button> : null}
          </div>
        </>
      )}

      {editor ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-5" role="presentation"><form noValidate onSubmit={saveCity} role="dialog" aria-modal="true" aria-labelledby="city-form-title" className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"><div className="mb-5"><h3 id="city-form-title" className="text-lg font-bold text-[var(--navy)]">{editor.mode === "create" ? "إضافة مدينة" : "تعديل المدينة"}</h3><p className="mt-1 text-sm text-[var(--muted)]">{editor.mode === "create" ? "يُنشأ المعرّف النصي تلقائياً من الاسم الإنجليزي." : "يبقى المعرّف النصي الحالي كما هو عند التعديل."}</p></div><fieldset disabled={isSaving} className="space-y-4"><label className="block text-sm font-semibold text-[var(--navy)]">اسم المدينة بالعربية *<input ref={nameArRef} value={values.nameAr} onChange={(event) => setValues((current) => ({ ...current, nameAr: event.target.value }))} aria-invalid={Boolean(errors.nameAr)} aria-describedby={errors.nameAr ? "city-name-ar-error" : undefined} maxLength={200} className={`${inputClass} mt-1.5 ${errors.nameAr ? "border-red-400" : ""}`} /></label>{errors.nameAr ? <p id="city-name-ar-error" role="alert" className="text-xs font-medium text-red-700">{errors.nameAr}</p> : null}<label className="block text-sm font-semibold text-[var(--navy)]">اسم المدينة بالإنجليزية *<input ref={nameEnRef} dir="ltr" value={values.nameEn} onChange={(event) => setValues((current) => ({ ...current, nameEn: event.target.value }))} aria-invalid={Boolean(errors.nameEn)} aria-describedby={errors.nameEn ? "city-name-en-error" : undefined} maxLength={200} className={`${inputClass} mt-1.5 ${errors.nameEn ? "border-red-400" : ""}`} /></label>{errors.nameEn ? <p id="city-name-en-error" role="alert" className="text-xs font-medium text-red-700">{errors.nameEn}</p> : null}<SearchableSelect id="city-country" label="الدولة" required value={values.countryId} onChange={(countryId) => setValues((current) => ({ ...current, countryId }))} options={countryOptions} placeholder="اختر الدولة" allowClear={false} error={errors.countryId} isLoading={countries.countries.isFetching} isError={countries.countries.isError} onRetry={() => void countries.countries.refetch()} /></fieldset>{submitError ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800">{submitError}</p> : null}<div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4"><button type="submit" className={primaryButtonClass} disabled={isSaving}>{isSaving ? "جارٍ الحفظ…" : editor.mode === "create" ? "إضافة المدينة" : "حفظ التعديلات"}</button><button type="button" className={buttonClass} disabled={isSaving} onClick={requestClose}>إلغاء</button></div></form></div> : null}

      {confirmClose ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-5" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="discard-city-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h3 id="discard-city-title" className="font-bold text-[var(--navy)]">إلغاء التعديلات؟</h3><p className="mt-2 text-sm text-[var(--muted)]">سيتم فقدان القيم غير المحفوظة.</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white" onClick={finishClose}>تجاهل التعديلات</button><button type="button" className={buttonClass} onClick={() => setConfirmClose(false)}>متابعة التعديل</button></div></div></div> : null}

      {cityToDelete ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-5" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="delete-city-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h3 id="delete-city-title" className="font-bold text-[var(--navy)]">حذف المدينة؟</h3><p className="mt-2 text-sm text-[var(--muted)]">سيُحذف «{cityToDelete.nameAr}» من «{cityCountryLabel(cityToDelete, countryItems)}» نهائياً. لا تُحذف الجامعات المرتبطة، وقد يرفض الخادم الحذف لحمايتها.</p>{submitError ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{submitError}</p> : null}<div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={remove.isPending} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-45" onClick={() => void confirmDelete()}>{remove.isPending ? "جارٍ الحذف…" : "تأكيد الحذف"}</button><button type="button" className={buttonClass} disabled={remove.isPending} onClick={() => setCityToDelete(null)}>إلغاء</button></div></div></div> : null}
    </section>
  );
}
