"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import type {
  DirectoryInputs,
  DirectoryKind,
} from "@/lib/api-client/university-management";
import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import { useDirectoryList } from "@/hook/queries/use-university-management";
import { useDirectoryCreate } from "@/hook/mutations/use-university-management";
import { useContentSelectors } from "@/hook/queries/use-content-queries";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { cityInputSchema, majorInputSchema } from "@/lib/university-schemas";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/dashboard/states";
import { DebouncedSearchBar } from "@/components/ui/debounced-search-bar";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PlusIcon, RotateCcwIcon } from "@/components/ui/admin-icons";
import {
  buttonClass,
  inputClass,
  PageControls,
  panelClass,
  primaryButtonClass,
} from "./controls";

export function DirectoryPage<K extends DirectoryKind>({ kind }: { kind: K }) {
  const [params, setParams] = useState({
    page: 1,
    limit: 12,
    search: "",
    countryId: "",
  });
  const [adding, setAdding] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const access = useAdminAccess();
  const countries = useContentSelectors({ countries: kind === "cities" });

  const list = useDirectoryList(kind, {
    ...params,
    search: params.search.trim() || undefined,
    countryId: params.countryId || undefined,
  });

  const create = useDirectoryCreate(kind);
  const title = kind === "cities" ? "المدن" : "التخصصات الأكاديمية";

  const countryOptions = useMemo(
    () =>
      (countries.countries.data?.items ?? []).map((item) => ({
        value: item.id,
        label: item.nameAr,
        sublabel: item.nameEn ?? item.slug,
      })),
    [countries.countries.data?.items],
  );

  if (access.mockEnabled) {
    return (
      <section className="space-y-4">
        <header>
          <p className="text-xs font-semibold text-[var(--gold-dark)]">الأدلة المرجعية</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">{title}</h2>
        </header>
        <p className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)] shadow-[var(--shadow-card)]">
          كتالوج {title} يتطلب جلسة خادم متصلة؛ لا تُرسل بيانات المعاينة المحلية إلى الخادم.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold text-[var(--gold-dark)]">الأدلة المرجعية</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--navy)]">{title}</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            يدعم الكتالوج الاستعراض والإضافة لربط الجامعات والتخصصات والمدن.
          </p>
        </div>

        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => {
            setAdding(true);
            setMessage("");
          }}
        >
          <PlusIcon className="size-4" />
          <span>{kind === "cities" ? "إضافة مدينة" : "إضافة تخصص"}</span>
        </button>
      </header>

      {/* Independent Debounced Search Bar */}
      <DebouncedSearchBar
        value={params.search}
        onDebouncedChange={(search) =>
          setParams((old) => ({ ...old, page: 1, search }))
        }
        delayMs={1000}
        placeholder={kind === "cities" ? "ابحث باسم المدينة..." : "ابحث باسم التخصص..."}
        ariaLabel={`بحث ${title}`}
        isFetching={list.isFetching}
      />

      {/* Auto-apply Filters */}
      <div className={`${panelClass} grid gap-3 sm:grid-cols-2 lg:grid-cols-3`}>
        {kind === "cities" ? (
          <SearchableSelect
            label="الدولة"
            value={params.countryId}
            onChange={(countryId) =>
              setParams((old) => ({ ...old, page: 1, countryId }))
            }
            options={countryOptions}
            placeholder="كل الدول"
            clearLabel="كل الدول"
            isLoading={countries.countries.isFetching}
            isError={countries.countries.isError}
            onRetry={() => void countries.countries.refetch()}
          />
        ) : null}

        <div className="min-w-0">
          <label
            htmlFor={`limit-${kind}`}
            className="mb-1.5 block text-xs font-semibold text-[var(--navy)]"
          >
            عدد النتائج
          </label>
          <select
            id={`limit-${kind}`}
            aria-label="عدد السجلات"
            value={params.limit}
            onChange={(event) =>
              setParams((old) => ({
                ...old,
                page: 1,
                limit: Number(event.target.value),
              }))
            }
            className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--navy)] tabular-nums"
          >
            {[12, 24, 50].map((value) => (
              <option key={value} value={value}>
                {value} سجل
              </option>
            ))}
          </select>
        </div>

        {(params.search || params.countryId) ? (
          <div className="flex items-end">
            <button
              type="button"
              onClick={() =>
                setParams({ page: 1, limit: 12, search: "", countryId: "" })
              }
              className={buttonClass}
            >
              <RotateCcwIcon className="size-3.5 text-[var(--muted)]" />
              <span>إعادة ضبط</span>
            </button>
          </div>
        ) : null}
      </div>

      {adding ? (
        <form
          className={panelClass}
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();
            setErrors({});
            setMessage("");
            try {
              const input = (
                kind === "cities" ? cityInputSchema : majorInputSchema
              ).parse({
                ...values,
                ...(kind === "academic-majors"
                  ? { category: values.category?.trim() || null }
                  : {}),
              }) as DirectoryInputs[K];
              await create.mutateAsync(input);
              setAdding(false);
              setValues({});
              setMessage("تمت إضافة السجل بنجاح.");
            } catch (error) {
              if (error instanceof z.ZodError) {
                setErrors(
                  Object.fromEntries(
                    error.issues.map((issue) => [
                      String(issue.path[0]),
                      "تحقق من القيمة المطلوبة وصيغتها.",
                    ]),
                  ),
                );
              } else {
                setErrors(
                  Object.fromEntries(
                    Object.entries(getApiFieldErrors(error)).map(([key, messages]) => [
                      key,
                      messages[0],
                    ]),
                  ),
                );
                setMessage(
                  normalizeApiError(error).status === 409
                    ? "المعرّف النصي مستخدم بالفعل. لم تُفقد البيانات."
                    : "تعذّر الحفظ. راجع القيم والاتصال.",
                );
              }
            }
          }}
        >
          <h3 className="text-base font-bold text-[var(--navy)]">
            {kind === "cities" ? "إضافة مدينة جديدة" : "إضافة تخصص أكاديمي جديد"}
          </h3>

          <fieldset
            disabled={create.isPending}
            className="grid min-w-0 gap-4 sm:grid-cols-2"
          >
            {[
              "nameAr",
              "nameEn",
              "slug",
              ...(kind === "academic-majors" ? ["category"] : []),
            ].map((name) => (
              <label key={name} className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
                <span>
                  {
                    (
                      {
                        nameAr: "الاسم بالعربية *",
                        nameEn: "الاسم بالإنجليزية *",
                        slug: "المعرّف النصي (Slug) *",
                        category: "التصنيف (اختياري)",
                      } as Record<string, string>
                    )[name]
                  }
                </span>
                <input
                  aria-label={name}
                  dir={name === "nameAr" || name === "category" ? "rtl" : "ltr"}
                  className={inputClass}
                  maxLength={name === "slug" || name === "category" ? 120 : 200}
                  value={values[name] ?? ""}
                  onChange={(event) =>
                    setValues((old) => ({ ...old, [name]: event.target.value }))
                  }
                />
                {errors[name] ? (
                  <span role="alert" className="text-xs font-medium text-red-700">
                    {errors[name]}
                  </span>
                ) : null}
              </label>
            ))}

            {kind === "cities" ? (
              <div>
                <SearchableSelect
                  label="الدولة"
                  required
                  value={values.countryId ?? ""}
                  onChange={(countryId) =>
                    setValues((old) => ({ ...old, countryId }))
                  }
                  options={countryOptions}
                  placeholder="اختر الدولة"
                  allowClear={false}
                  error={errors.countryId}
                />
              </div>
            ) : null}
          </fieldset>

          <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
            <button type="submit" className={primaryButtonClass} disabled={create.isPending}>
              {create.isPending ? "جارٍ الحفظ…" : "حفظ السجل"}
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={create.isPending}
              onClick={() => setAdding(false)}
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : null}

      {message ? (
        <p
          role="status"
          className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--navy)] shadow-[var(--shadow-card)]"
        >
          {message}
        </p>
      ) : null}

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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.items.map((item) => (
            <article key={item.id} className={panelClass}>
              <h3 className="break-words text-base font-bold text-[var(--navy)]">
                {item.nameAr}
              </h3>
              <p dir="ltr" className="break-words text-xs text-[var(--muted)]">
                {item.nameEn} · {item.slug}
              </p>
              {"category" in item ? (
                <p className="text-xs font-medium text-[var(--navy)]">
                  التصنيف: {item.category ?? "دون تصنيف"}
                </p>
              ) : "countryId" in item ? (
                <p className="text-xs font-medium text-[var(--navy)]">
                  الدولة:{" "}
                  {item.country?.nameAr ??
                    countries.countries.data?.items.find(
                      (country) => country.id === item.countryId,
                    )?.nameAr ??
                    "—"}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <PageControls
        data={list.data}
        change={(page) => setParams((old) => ({ ...old, page }))}
      />
    </section>
  );
}
