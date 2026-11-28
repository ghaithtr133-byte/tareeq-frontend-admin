"use client";

import { articleBlocksToEditorDocument } from "@/lib/article-rich-text";
import type {
  ArticleContentSuggestion,
  ArticleContentSuggestionField,
  ArticleSeoSuggestion,
  ArticleSeoSuggestionField,
} from "@/lib/article-ai-suggestions";
import type { ArticleRichTextBlock } from "@/lib/api-client/content";

type Decision = "accepted" | "rejected" | undefined;

function ArticleBlocksPreview({ blocks }: { blocks: readonly ArticleRichTextBlock[] }) {
  const document = articleBlocksToEditorDocument(blocks);
  return (
    <div dir="rtl" className="article-rich-text-preview space-y-2 text-sm leading-7 text-[var(--navy)] [&_blockquote]:border-r-4 [&_blockquote]:border-[var(--gold)] [&_blockquote]:pr-3 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-bold [&_ol]:list-inside [&_ol]:list-decimal [&_ul]:list-inside [&_ul]:list-disc">
      {document.map((node, index) => {
        const key = `${node.type}-${index}`;
        if ("items" in node) {
          return node.type === "bulleted-list" ? (
            <ul key={key}>{node.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`} className="whitespace-pre-wrap">{item}</li>)}</ul>
          ) : (
            <ol key={key}>{node.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`} className="whitespace-pre-wrap">{item}</li>)}</ol>
          );
        }
        if (node.type === "heading2") return <h2 key={key} className="whitespace-pre-wrap">{node.text}</h2>;
        if (node.type === "heading3") return <h3 key={key} className="whitespace-pre-wrap">{node.text}</h3>;
        if (node.type === "quote") return <blockquote key={key} className="whitespace-pre-wrap text-[var(--muted)]">{node.text}</blockquote>;
        return <p key={key} className="whitespace-pre-wrap">{node.text}</p>;
      })}
    </div>
  );
}

function PreviewPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--line)] bg-white p-3 sm:p-4">
      <p className="mb-2 text-xs font-bold text-[var(--muted)]">{label}</p>
      {children}
    </div>
  );
}

function FieldActions({
  decision,
  onAccept,
  onReject,
}: {
  decision: Decision;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (decision === "accepted") return <p className="text-xs font-bold text-emerald-700">تم اعتماد الاقتراح في النموذج.</p>;
  if (decision === "rejected") return <p className="text-xs font-bold text-[var(--muted)]">تم تجاهل هذا الاقتراح.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onAccept} className="min-h-9 rounded-lg bg-[var(--navy)] px-3 text-xs font-bold text-white hover:bg-[var(--navy-light)]">
        اعتماد هذا الاقتراح
      </button>
      <button type="button" onClick={onReject} className="min-h-9 rounded-lg border border-[var(--line)] px-3 text-xs font-semibold text-[var(--navy)] hover:bg-slate-50">
        تجاهل
      </button>
    </div>
  );
}

export function ArticleContentSuggestionPreview({
  original,
  suggestion,
  decisions,
  onAccept,
  onReject,
  onAcceptAll,
}: {
  original: Pick<ArticleContentSuggestion, "titleAr" | "summaryAr" | "bodyAr">;
  suggestion: ArticleContentSuggestion;
  decisions: Partial<Record<ArticleContentSuggestionField, Decision>>;
  onAccept: (field: ArticleContentSuggestionField) => void;
  onReject: (field: ArticleContentSuggestionField) => void;
  onAcceptAll: () => void;
}) {
  const pending = (["titleAr", "summaryAr", "bodyAr"] as const).filter((field) => !decisions[field]);
  const fields: Array<{ field: ArticleContentSuggestionField; label: string; original: React.ReactNode; suggested: React.ReactNode }> = [
    { field: "titleAr", label: "العنوان العربي", original: <p className="whitespace-pre-wrap">{original.titleAr}</p>, suggested: <p className="whitespace-pre-wrap">{suggestion.titleAr}</p> },
    { field: "summaryAr", label: "الملخص العربي", original: <p className="whitespace-pre-wrap">{original.summaryAr}</p>, suggested: <p className="whitespace-pre-wrap">{suggestion.summaryAr}</p> },
    { field: "bodyAr", label: "محتوى المقال", original: <ArticleBlocksPreview blocks={original.bodyAr} />, suggested: <ArticleBlocksPreview blocks={suggestion.bodyAr} /> },
  ];
  return (
    <section aria-live="polite" className="space-y-4 rounded-2xl border border-[var(--gold)]/50 bg-[var(--gold-soft)]/35 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-bold text-[var(--navy)]">معاينة تحسين المحتوى</h4>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">لن تُحفظ هذه الاقتراحات إلا بعد اعتمادها ثم الضغط على «حفظ التغييرات».</p>
        </div>
        {pending.length ? <button type="button" onClick={onAcceptAll} className="min-h-10 rounded-xl bg-[var(--navy)] px-4 text-xs font-bold text-white hover:bg-[var(--navy-light)]">اعتماد جميع الاقتراحات</button> : null}
      </div>
      {fields.map(({ field, label, original: originalValue, suggested }) => (
        <div key={field} className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3 sm:p-4">
          <h5 className="text-sm font-bold text-[var(--navy)]">{label}</h5>
          <div className="grid gap-3 lg:grid-cols-2">
            <PreviewPanel label="القيمة الحالية عند إنشاء الاقتراح">{originalValue}</PreviewPanel>
            <PreviewPanel label="الاقتراح">{suggested}</PreviewPanel>
          </div>
          <FieldActions decision={decisions[field]} onAccept={() => onAccept(field)} onReject={() => onReject(field)} />
        </div>
      ))}
    </section>
  );
}

export function ArticleSeoSuggestionPreview({
  original,
  suggestion,
  decisions,
  onAccept,
  onReject,
  onAcceptAll,
}: {
  original: Pick<ArticleSeoSuggestion, "seoTitleAr" | "seoDescriptionAr">;
  suggestion: ArticleSeoSuggestion;
  decisions: Partial<Record<ArticleSeoSuggestionField, Decision>>;
  onAccept: (field: ArticleSeoSuggestionField) => void;
  onReject: (field: ArticleSeoSuggestionField) => void;
  onAcceptAll: () => void;
}) {
  const pending = (["seoTitleAr", "seoDescriptionAr"] as const).filter((field) => !decisions[field]);
  const fields: Array<{ field: ArticleSeoSuggestionField; label: string; original: string; suggested: string }> = [
    { field: "seoTitleAr", label: "عنوان SEO العربي", original: original.seoTitleAr, suggested: suggestion.seoTitleAr },
    { field: "seoDescriptionAr", label: "وصف SEO العربي", original: original.seoDescriptionAr, suggested: suggestion.seoDescriptionAr },
  ];
  return (
    <section aria-live="polite" className="space-y-4 rounded-2xl border border-[var(--gold)]/50 bg-[var(--gold-soft)]/35 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-bold text-[var(--navy)]">معاينة تحسين SEO</h4>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">قيم SEO المقترحة لا تغيّر العنوان أو الملخص ولا تُحفظ تلقائيًا.</p>
        </div>
        {pending.length ? <button type="button" onClick={onAcceptAll} className="min-h-10 rounded-xl bg-[var(--navy)] px-4 text-xs font-bold text-white hover:bg-[var(--navy-light)]">اعتماد جميع الاقتراحات</button> : null}
      </div>
      {fields.map((field) => (
        <div key={field.field} className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3 sm:p-4">
          <h5 className="text-sm font-bold text-[var(--navy)]">{field.label}</h5>
          <div className="grid gap-3 lg:grid-cols-2">
            <PreviewPanel label="القيمة الحالية عند إنشاء الاقتراح"><p className="whitespace-pre-wrap text-sm leading-6 text-[var(--navy)]">{field.original || "—"}</p></PreviewPanel>
            <PreviewPanel label="الاقتراح"><p className="whitespace-pre-wrap text-sm leading-6 text-[var(--navy)]">{field.suggested}</p></PreviewPanel>
          </div>
          <FieldActions decision={decisions[field.field]} onAccept={() => onAccept(field.field)} onReject={() => onReject(field.field)} />
        </div>
      ))}
    </section>
  );
}
