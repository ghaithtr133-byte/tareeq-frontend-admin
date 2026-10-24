"use client";

import { Controller, useFieldArray, type Control } from "react-hook-form";

import { articleBlockOptions } from "@/lib/content-config";
import type { ContentFormValues } from "@/lib/content-form";
import type { ArticleRichTextBlock } from "@/api/content";

type ArticleBlockEditorProps = {
  control: Control<ContentFormValues>;
  name: "bodyAr" | "bodyEn";
  label: string;
  required?: boolean;
  error?: string;
};

/** Editor deliberately serializes only the documented flat `{ type, text }` block format. */
export function ArticleBlockEditor({ control, name, label, required = false, error }: ArticleBlockEditorProps) {
  const typedControl = control as unknown as Control<{ bodyAr: ArticleRichTextBlock[]; bodyEn: ArticleRichTextBlock[] }>;
  const { fields, append, remove, swap } = useFieldArray({ control: typedControl, name });
  const direction = name === "bodyEn" ? "ltr" : "rtl";
  const textAlignment = direction === "ltr" ? "text-left" : "text-right";
  return (
    <fieldset className="rounded-xl border border-[var(--line)] bg-[var(--background)] p-4">
      <legend className="px-1 text-sm font-bold text-[var(--navy)]">{label}{required ? " *" : ""}</legend>
      <div className="mt-2 space-y-3">
        {fields.map((field, index) => <div key={field.id} className="rounded-lg border border-[var(--line)] bg-white p-3">
          <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <label className="grid gap-1 text-xs font-semibold text-[var(--navy)]">نوع الكتلة
              <Controller control={typedControl} name={`${name}.${index}.type` as never} render={({ field: input }) => <select {...input} value={input.value ?? "paragraph"} className="h-10 rounded-lg border border-[var(--line)] bg-white px-3 text-sm">
                {articleBlockOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[var(--navy)]">النص
              <Controller control={typedControl} name={`${name}.${index}.text` as never} render={({ field: input }) => <textarea {...input} dir={direction} value={input.value ?? ""} rows={3} className={`rounded-lg border border-[var(--line)] p-3 text-sm ${textAlignment}`} />} />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => index > 0 && swap(index, index - 1)} disabled={index === 0} className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-bold disabled:opacity-40">أعلى</button><button type="button" onClick={() => index < fields.length - 1 && swap(index, index + 1)} disabled={index === fields.length - 1} className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-bold disabled:opacity-40">أسفل</button><button type="button" onClick={() => remove(index)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700">حذف</button></div>
        </div>)}
      </div>
      <button type="button" onClick={() => append({ type: "paragraph", text: "" })} className="mt-3 rounded-lg border border-[var(--navy)] px-3 py-2 text-sm font-bold text-[var(--navy)]">إضافة كتلة</button>
      {error ? <p className="mt-2 text-sm text-red-700" role="alert">{error}</p> : null}
    </fieldset>
  );
}
