"use client";

import { Controller, useFieldArray, useWatch, type Control } from "react-hook-form";

import { articleBlockOptions } from "@/lib/content-config";
import type { ContentFormValues } from "@/lib/content-form";
import type { ArticleRichTextBlock } from "@/lib/api-client/content";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@/components/ui/admin-icons";

type ArticleBlockEditorProps = {
  control: Control<ContentFormValues>;
  name: "bodyAr" | "bodyEn";
  fieldId?: string;
  label: string;
  required?: boolean;
  error?: string;
};

/** Editor deliberately serializes only the documented flat `{ type, text }` block format. */
export function ArticleBlockEditor({
  control,
  name,
  fieldId,
  label,
  required = false,
  error,
}: ArticleBlockEditorProps) {
  const typedControl = control as unknown as Control<{
    bodyAr: ArticleRichTextBlock[];
    bodyEn: ArticleRichTextBlock[];
  }>;
  const { fields, append, remove, swap } = useFieldArray({ control: typedControl, name });
  const blocks = useWatch({ control: typedControl, name }) ?? [];
  const direction = name === "bodyEn" ? "ltr" : "rtl";
  const textAlignment = direction === "ltr" ? "text-left" : "text-right";

  return (
    <fieldset className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend className="text-sm font-bold text-[var(--navy)]">
          {label}
          {required ? <span className="text-red-700"> *</span> : null}
        </legend>
        <span className="text-xs text-[var(--muted)] tabular-nums">{fields.length} كتلة</span>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const blockType = blocks[index]?.type ?? "paragraph";
          const blockStyle =
            blockType === "heading2"
              ? "border-r-4 border-r-[var(--navy)] bg-slate-50"
              : blockType === "heading3"
                ? "border-r-4 border-r-[var(--gold)] bg-amber-50/30"
                : blockType === "quote"
                  ? "border-r-4 border-r-[var(--gold-dark)] bg-[var(--gold-soft)]/40"
                  : blockType === "bulleted-list" || blockType === "numbered-list"
                    ? "border-r-4 border-r-slate-400 bg-slate-50/70"
                    : "bg-white";
          return (
          <div
            key={field.id}
            className={`rounded-xl border border-[var(--line)] p-3.5 shadow-[var(--shadow-card)] ${blockStyle}`}
          >
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
              <span className="text-xs font-bold text-[var(--navy)] tabular-nums">
                الكتلة #{index + 1}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`تحريك الكتلة ${index + 1} للأعلى`}
                  onClick={() => index > 0 && swap(index, index - 1)}
                  disabled={index === 0}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-2.5 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50 disabled:opacity-40"
                >
                  <ArrowUpIcon className="size-3.5" />
                  <span>أعلى</span>
                </button>
                <button
                  type="button"
                  aria-label={`تحريك الكتلة ${index + 1} للأسفل`}
                  onClick={() => index < fields.length - 1 && swap(index, index + 1)}
                  disabled={index === fields.length - 1}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-2.5 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50 disabled:opacity-40"
                >
                  <ArrowDownIcon className="size-3.5" />
                  <span>أسفل</span>
                </button>
                <button
                  type="button"
                  aria-label={`حذف الكتلة ${index + 1}`}
                  onClick={() => remove(index)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="size-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <label className="grid content-start gap-1.5 text-xs font-semibold text-[var(--navy)]">
                <span>نوع الكتلة</span>
                <Controller
                  control={typedControl}
                  name={`${name}.${index}.type` as never}
                  render={({ field: input }) => (
                    <select
                      {...input}
                      value={input.value ?? "paragraph"}
                      className="h-10 rounded-lg border border-[var(--line)] bg-white px-3 text-sm font-normal text-[var(--navy)] focus:border-[var(--gold)] focus:outline-none"
                    >
                      {articleBlockOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-[var(--navy)]">
                <span>المحتوى النصي</span>
                <Controller
                  control={typedControl}
                  name={`${name}.${index}.text` as never}
                  render={({ field: input }) => (
                    <textarea
                      {...input}
                      id={index === 0 && fieldId ? fieldId : fieldId ? `${fieldId}-${index}` : undefined}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? `${fieldId ?? name}-error` : undefined}
                      dir={direction}
                      value={input.value ?? ""}
                      rows={3}
                      className={`w-full rounded-lg border border-[var(--line)] bg-white p-3 text-sm font-normal leading-6 text-[var(--navy)] focus:border-[var(--gold)] focus:outline-none ${textAlignment}`}
                    />
                  )}
                />
              </label>
            </div>
          </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => append({ type: "paragraph", text: "" })}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--navy)] bg-white px-4 text-xs font-bold text-[var(--navy)] transition-colors hover:bg-[var(--navy)] hover:text-white"
      >
        <PlusIcon className="size-4" />
        <span>إضافة كتلة جديدة</span>
      </button>

      {error ? (
        <p id={`${fieldId ?? name}-error`} className="text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
