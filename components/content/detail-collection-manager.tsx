"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { getApiFieldErrors, normalizeApiError } from "@/lib/api-client/error";
import {
  detailCreatePayload,
  detailPatchPayload,
  detailSectionFor,
  detailSectionsFor,
  detailValues,
  type DetailFormValues,
  type DetailItem,
  type DetailKind,
  type DetailResource,
  type DetailSection,
} from "@/lib/content-detail-schemas";
import { StaleContentSessionError } from "@/lib/content-session";
import { useContentDetailMutation } from "@/hook/mutations/use-content-detail-mutations";
import { useContentDetailItems } from "@/hook/queries/use-content-detail-queries";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/ui/admin-icons";

const inputClass =
  "min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--navy)] focus:border-[var(--gold)] focus:outline-none";
const buttonClass =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45";

const fieldDefinitions = {
  titleAr: ["العنوان بالعربية *", "text", 300],
  descriptionAr: ["الوصف بالعربية", "textarea", 20_000],
  bodyAr: ["النص بالعربية", "textarea", 20_000],
  category: ["تصنيف داخلي", "text", 80],
  amount: ["المبلغ", "text", 32],
  currency: ["العملة (ISO)", "text", 3],
  coveragePeriod: ["فترة التغطية", "text", 120],
  officialSourceUrl: ["المصدر الرسمي", "url", 2048],
  verifiedAt: ["تاريخ التحقق", "datetime-local", 32],
} as const;
type DetailField = keyof typeof fieldDefinitions;
const coreFields: readonly DetailField[] = ["titleAr", "descriptionAr", "bodyAr"];
const metadataFields: readonly DetailField[] = ["category", "officialSourceUrl", "verifiedAt"];
const financialFields: readonly DetailField[] = ["amount", "currency", "coveragePeriod"];

function localDate(value?: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
function editableValue(values: DetailFormValues, name: DetailField) {
  const value = values[name];
  return name === "verifiedAt" ? localDate(value) : (value ?? "");
}
function messageFor(error: unknown) {
  const normalized = normalizeApiError(error);
  if (normalized.status === 403) return "لا توجد صلاحية لتنفيذ هذا الإجراء.";
  if (normalized.status === 409)
    return "تغيّرت القائمة على الخادم. أعد التحميل قبل إعادة المحاولة.";
  if (normalized.status === 500)
    return "تعذّر تنفيذ الطلب بسبب خطأ في الخادم. لا تُعامل هذه الحالة كقائمة فارغة.";
  if (normalized.kind === "network")
    return "تعذّر الاتصال بالخادم؛ لم تُفقد بيانات النموذج.";
  return "تعذّر حفظ التغييرات. راجع الحقول ثم أعد المحاولة.";
}
function hasValue(item: DetailItem | undefined, field: DetailField) {
  return item?.[field] !== undefined && item?.[field] !== null;
}
function contextualFinancial(resource: DetailResource, kind: DetailKind) {
  return resource === "scholarships" && kind === "BENEFIT";
}

function DetailFieldInput({
  name,
  values,
  set,
  error,
  record,
}: {
  name: DetailField;
  values: DetailFormValues;
  set: (name: DetailField, value: string | null) => void;
  error?: string;
  record?: DetailItem;
}) {
  const [label, type, max] = fieldDefinitions[name];
  const isArea = type === "textarea";
  return (
    <div className={isArea ? "md:col-span-2" : ""}>
      <label htmlFor={`detail-${name}`} className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
        <span>{label}</span>
        {isArea ? (
          <textarea
            id={`detail-${name}`}
            rows={4}
            maxLength={max}
            className={inputClass}
            value={editableValue(values, name)}
            onChange={(event) => set(name, event.target.value)}
            aria-invalid={Boolean(error)}
          />
        ) : (
          <input
            id={`detail-${name}`}
            type={type}
            maxLength={max}
            dir={
              type === "url" ||
              type === "datetime-local" ||
              name === "amount" ||
              name === "currency"
                ? "ltr"
                : "rtl"
            }
            className={inputClass}
            value={editableValue(values, name)}
            onChange={(event) => set(name, event.target.value)}
            aria-invalid={Boolean(error)}
          />
        )}
      </label>
      {record && name !== "titleAr" ? (
        <label className="mt-1.5 flex min-h-8 items-center gap-2 text-xs text-[var(--muted)]">
          <input
            type="checkbox"
            checked={values[name] === null}
            onChange={(event) => set(name, event.target.checked ? null : "")}
            className="size-4 accent-[var(--navy)]"
          />
          <span>مسح الحقل صراحة</span>
        </label>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DetailForm({
  resource,
  parentId,
  section,
  record,
  close,
}: {
  resource: DetailResource;
  parentId: string;
  section: DetailSection;
  record?: DetailItem;
  close: () => void;
}) {
  const [values, setValues] = useState(() => detailValues(record, section.kind));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const mutation = useContentDetailMutation(resource, parentId);
  const financial = contextualFinancial(resource, section.kind);
  const retainedMetadata = metadataFields.some((field) => hasValue(record, field));
  const retainedFinancial = financialFields.some((field) => hasValue(record, field));

  function set(name: DetailField, value: string | null) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
    setMessage("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setMessage("");
    try {
      const action = record
        ? {
            type: "update" as const,
            kind: section.kind,
            id: record.id,
            input: detailPatchPayload(values, record),
          }
        : {
            type: "create" as const,
            kind: section.kind,
            input: detailCreatePayload(values),
          };
      await mutation.mutateAsync(action);
      close();
    } catch (error) {
      if (error instanceof StaleContentSessionError || normalizeApiError(error).kind === "cancelled")
        return;
      if (error instanceof z.ZodError)
        setErrors(
          Object.fromEntries(
            error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]),
          ),
        );
      else
        setErrors(
          Object.fromEntries(
            Object.entries(getApiFieldErrors(error)).map(([name, messages]) => [
              name,
              messages[0] ?? "",
            ]),
          ),
        );
      setMessage(messageFor(error));
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-4"
    >
      <div>
        <h3 className="text-sm font-bold text-[var(--navy)]">
          {record ? `تعديل: ${section.label}` : `إضافة إلى: ${section.label}`}
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)]">{section.description}</p>
      </div>
      {message ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          {message}
        </p>
      ) : null}
      <fieldset disabled={mutation.isPending} className="grid gap-4 md:grid-cols-2">
        {coreFields.map((name) => (
          <DetailFieldInput
            key={name}
            name={name}
            values={values}
            set={set}
            error={errors[name]}
            record={record}
          />
        ))}
        {financial ? (
          <>
            <div className="md:col-span-2">
              <p className="text-xs font-bold text-[var(--navy)]">
                بيانات التغطية المالية (اختيارية)
              </p>
            </div>
            {financialFields.map((name) => (
              <DetailFieldInput
                key={name}
                name={name}
                values={values}
                set={set}
                error={errors[name]}
                record={record}
              />
            ))}
          </>
        ) : null}
      </fieldset>
      <details
        open={retainedMetadata || retainedFinancial}
        className="rounded-xl border border-[var(--line)] bg-white p-3.5"
      >
        <summary className="min-h-8 cursor-pointer text-xs font-bold text-[var(--navy)]">
          بيانات التوثيق والحقول الإضافية
        </summary>
        <p className="mt-1.5 text-xs text-[var(--muted)]">
          اختيارية. لا تُفسَّر كعناوين أو أقسام في الموقع العام.
        </p>
        <fieldset disabled={mutation.isPending} className="mt-3 grid gap-4 md:grid-cols-2">
          {metadataFields.map((name) => (
            <DetailFieldInput
              key={name}
              name={name}
              values={values}
              set={set}
              error={errors[name]}
              record={record}
            />
          ))}
          {!financial && retainedFinancial ? (
            <>
              <div className="md:col-span-2">
                <p className="text-xs font-bold text-[var(--navy)]">قيم مالية محفوظة</p>
              </div>
              {financialFields.map((name) => (
                <DetailFieldInput
                  key={name}
                  name={name}
                  values={values}
                  set={set}
                  error={errors[name]}
                  record={record}
                />
              ))}
            </>
          ) : null}
        </fieldset>
      </details>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex h-10 items-center rounded-lg bg-[var(--navy)] px-4 text-xs font-bold text-white hover:bg-[var(--navy-light)] disabled:opacity-50"
        >
          {mutation.isPending ? "جارٍ الحفظ…" : "حفظ العنصر"}
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={mutation.isPending}
          onClick={close}
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

const managerTitle: Record<DetailResource, string> = {
  countries: "دليل الدراسة",
  scholarships: "تفاصيل المنحة",
  services: "تفاصيل الخدمة",
};
const managerNotice: Record<DetailResource, string> = {
  countries:
    "ملخصات لغة الدراسة والرسوم والقبول ومواعيد التقديم حقول مستقلة في نموذج الدولة أعلاه. لا يوجد ربط موثق حاليًا بين عناصر الدليل وعناوين أكورديون الموقع العام.",
  scholarships:
    "هذه الأقسام تستخدم الأنواع الإدارية الموثقة. لم يُثبت العقد أن عناصرها تُغذي تلقائيًا مصفوفات تفاصيل المنحة في الموقع العام.",
  services:
    "خطوات ومزايا الموقع العام الحالي تأتي من محتوى تجريبي ثابت؛ لا يوجد ربط موثق حاليًا بهذه العناصر الإدارية.",
};

export function DetailCollectionManager({
  resource,
  parentId,
}: {
  resource: DetailResource;
  parentId: string;
}) {
  const sections = detailSectionsFor(resource);
  const [kind, setKind] = useState<DetailKind>(sections[0].kind);
  const [editing, setEditing] = useState<DetailItem>();
  const [adding, setAdding] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const access = useAdminAccess();
  const list = useContentDetailItems(resource, parentId, kind);
  const mutation = useContentDetailMutation(resource, parentId);
  const items = list.data ?? [];
  const section = detailSectionFor(resource, kind) ?? sections[0];
  const orderTooLarge = items.length > 500;

  if (access.mockEnabled)
    return (
      <section
        id="content-details"
        className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]"
      >
        إدارة العناصر التفصيلية ({managerTitle[resource]}) تتطلب جلسة خادم متصلة؛ لا تُرسل بيانات المعاينة المحلية.
      </section>
    );

  async function remove(item: DetailItem) {
    if (!window.confirm(`حذف «${item.titleAr}» نهائيًا؟`)) return;
    setActionMessage("");
    try {
      await mutation.mutateAsync({ type: "remove", kind, id: item.id });
    } catch (error) {
      if (normalizeApiError(error).kind !== "cancelled") setActionMessage(messageFor(error));
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setActionMessage("");
    try {
      await mutation.mutateAsync({
        type: "reorder",
        kind,
        orderedIds: next.map((item) => item.id),
      });
    } catch (error) {
      if (normalizeApiError(error).kind !== "cancelled") setActionMessage(messageFor(error));
    }
  }

  return (
    <section
      id="content-details"
      className="scroll-mt-6 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6"
      aria-label={managerTitle[resource]}
    >
      <div className="space-y-2 border-b border-[var(--line)] pb-4">
        <p className="text-xs font-semibold text-[var(--gold-dark)]">محتوى تفصيلي مرتبط</p>
        <h2 className="text-xl font-bold text-[var(--navy)]">{managerTitle[resource]}</h2>
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs leading-5 text-amber-950">
          {managerNotice[resource]}
        </p>
      </div>

      <nav
        className="flex flex-wrap gap-2"
        aria-label={`أقسام ${managerTitle[resource]}`}
      >
        {sections.map((item) => (
          <button
            key={item.kind}
            type="button"
            className={`inline-flex h-10 items-center rounded-lg border px-4 text-xs font-bold transition-colors whitespace-nowrap ${
              kind === item.kind
                ? "border-[var(--navy)] bg-[var(--navy)] text-white"
                : "border-[var(--line)] bg-white text-[var(--navy)] hover:bg-slate-50"
            }`}
            aria-current={kind === item.kind ? "page" : undefined}
            onClick={() => {
              setKind(item.kind);
              setEditing(undefined);
              setAdding(false);
              setActionMessage("");
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div>
        <h3 className="text-sm font-bold text-[var(--navy)]">{section.label}</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {section.description} · الترتيب يرسل المجموعة الكاملة لهذا القسم فقط (بحد أقصى 500 عنصر).
        </p>
      </div>

      {actionMessage ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {actionMessage}
        </p>
      ) : null}

      {orderTooLarge ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          تحتوي هذه المجموعة على أكثر من 500 عنصر؛ لا يمكن إرسال ترتيب غير صالح للخادم.
        </p>
      ) : null}

      {list.isPending ? (
        <p role="status" className="text-sm text-[var(--muted)]">
          جارٍ تحميل العناصر…
        </p>
      ) : null}

      {list.isError ? (
        <p role="alert" className="text-xs text-red-700">
          تعذّر تحميل عناصر «{section.label}».{" "}
          <button type="button" className="font-semibold underline" onClick={() => void list.refetch()}>
            إعادة المحاولة
          </button>
        </p>
      ) : null}

      {!list.isPending && !list.isError && !items.length ? (
        <p className="rounded-xl bg-[var(--surface-subtle)] p-4 text-xs text-[var(--muted)]">
          لا توجد عناصر في قسم «{section.label}» بعد.
        </p>
      ) : null}

      <div className="space-y-2">
        {items.map((item, index) => (
          <article
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white p-3.5"
          >
            <div className="min-w-0">
              <strong className="block break-words text-sm text-[var(--navy)]">
                <span className="ml-2 text-xs font-bold text-[var(--gold-dark)] tabular-nums">
                  {index + 1}.
                </span>
                {item.titleAr}
              </strong>
              {item.category ? (
                <span className="text-xs text-[var(--muted)]">{item.category}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className={buttonClass}
                disabled={mutation.isPending || orderTooLarge || index === 0}
                onClick={() => void move(index, -1)}
              >
                <ArrowUpIcon className="size-3.5" />
                <span>أعلى</span>
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={mutation.isPending || orderTooLarge || index === items.length - 1}
                onClick={() => void move(index, 1)}
              >
                <ArrowDownIcon className="size-3.5" />
                <span>أسفل</span>
              </button>
              <button
                type="button"
                className={buttonClass}
                disabled={mutation.isPending}
                onClick={() => {
                  setEditing(item);
                  setAdding(false);
                }}
              >
                <PencilIcon className="size-3.5" />
                <span>تعديل</span>
              </button>
              <button
                type="button"
                className={`${buttonClass} border-red-200 text-red-700 hover:bg-red-50`}
                disabled={mutation.isPending}
                onClick={() => void remove(item)}
              >
                <TrashIcon className="size-3.5" />
                <span>حذف</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {adding ? (
        <DetailForm
          resource={resource}
          parentId={parentId}
          section={section}
          close={() => setAdding(false)}
        />
      ) : null}

      {editing ? (
        <DetailForm
          resource={resource}
          parentId={parentId}
          section={section}
          record={editing}
          close={() => setEditing(undefined)}
        />
      ) : null}

      {!adding && !editing ? (
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[var(--navy)] px-4 text-xs font-bold text-white transition-colors hover:bg-[var(--navy-light)]"
          onClick={() => setAdding(true)}
        >
          <PlusIcon className="size-4" />
          <span>إضافة إلى «{section.label}»</span>
        </button>
      ) : null}

      <div className="border-t border-[var(--line)] pt-4">
        <Link
          href={`/admin/${resource}`}
          className="inline-flex h-10 items-center rounded-lg border border-[var(--line)] px-4 text-xs font-bold text-[var(--navy)] hover:bg-slate-50"
        >
          إنهاء والعودة إلى القائمة
        </Link>
      </div>
    </section>
  );
}
