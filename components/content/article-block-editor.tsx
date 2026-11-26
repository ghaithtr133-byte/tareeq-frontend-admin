"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, type Control } from "react-hook-form";

import type { ArticleRichTextBlock } from "@/lib/api-client/content";
import { articleBlocksToEditorHtml, articleEditorElementToBlocks } from "@/lib/article-rich-text";
import type { ContentFormValues } from "@/lib/content-form";
import {
  BulletedListIcon,
  Heading2Icon,
  Heading3Icon,
  NumberedListIcon,
  ParagraphIcon,
  QuoteIcon,
  RotateCcwIcon,
} from "@/components/ui/admin-icons";

type ArticleRichTextEditorProps = {
  control: Control<ContentFormValues>;
  name: "bodyAr" | "bodyEn";
  fieldId?: string;
  label: string;
  required?: boolean;
  error?: string;
};

type ToolbarAction = "paragraph" | "heading2" | "heading3" | "bulleted-list" | "numbered-list" | "quote" | "undo" | "redo";

const toolbarActions: Array<{ action: ToolbarAction; label: string; shortcut?: string; Icon: typeof ParagraphIcon }> = [
  { action: "paragraph", label: "فقرة", Icon: ParagraphIcon },
  { action: "heading2", label: "عنوان رئيسي", Icon: Heading2Icon },
  { action: "heading3", label: "عنوان فرعي", Icon: Heading3Icon },
  { action: "bulleted-list", label: "قائمة نقطية", Icon: BulletedListIcon },
  { action: "numbered-list", label: "قائمة مرقمة", Icon: NumberedListIcon },
  { action: "quote", label: "اقتباس", Icon: QuoteIcon },
  { action: "undo", label: "تراجع", shortcut: "Ctrl+Z", Icon: RotateCcwIcon },
  { action: "redo", label: "إعادة", shortcut: "Ctrl+Y", Icon: RotateCcwIcon },
];

function commandFor(action: ToolbarAction) {
  if (action === "paragraph") return ["formatBlock", "p"] as const;
  if (action === "heading2") return ["formatBlock", "h2"] as const;
  if (action === "heading3") return ["formatBlock", "h3"] as const;
  if (action === "quote") return ["formatBlock", "blockquote"] as const;
  if (action === "bulleted-list") return ["insertUnorderedList", null] as const;
  if (action === "numbered-list") return ["insertOrderedList", null] as const;
  return [action, null] as const;
}

type EditorSurfaceProps = Omit<ArticleRichTextEditorProps, "control"> & {
  value: ArticleRichTextBlock[];
  onChange: (blocks: ArticleRichTextBlock[]) => void;
  onBlur: () => void;
};

function ArticleRichTextSurface({
  value,
  onChange,
  onBlur,
  name,
  fieldId,
  label,
  required = false,
  error,
}: EditorSurfaceProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef("");
  const [activeActions, setActiveActions] = useState<ToolbarAction[]>(["paragraph"]);
  const direction = name === "bodyEn" ? "ltr" : "rtl";
  const signature = JSON.stringify(value);

  // Synchronize external form resets only, preserving caret and undo history while typing.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || signature === lastValueRef.current) return;
    editor.innerHTML = articleBlocksToEditorHtml(value);
    lastValueRef.current = signature;
  }, [signature, value]);

  function syncValue(next: ArticleRichTextBlock[]) {
    const nextSignature = JSON.stringify(next);
    if (nextSignature === lastValueRef.current) return;
    lastValueRef.current = nextSignature;
    onChange(next);
  }

  function updateToolbarState() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.anchorNode || !editor.contains(selection.anchorNode)) return;

    const active: ToolbarAction[] = [];
    const block = String(document.queryCommandValue("formatBlock"))
      .toLowerCase()
      .replace(/[<>]/g, "");
    active.push(block === "h2" ? "heading2" : block === "h3" ? "heading3" : block === "blockquote" ? "quote" : "paragraph");
    if (document.queryCommandState("insertUnorderedList")) active.push("bulleted-list");
    if (document.queryCommandState("insertOrderedList")) active.push("numbered-list");
    setActiveActions((current) =>
      current.length === active.length && current.every((action, index) => action === active[index])
        ? current
        : active,
    );
  }

  function emitValue() {
    const editor = editorRef.current;
    if (!editor) return;
    syncValue(articleEditorElementToBlocks(editor));
    updateToolbarState();
  }

  function runToolbarAction(action: ToolbarAction) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const [command, commandValue] = commandFor(action);
    document.execCommand(command, false, commandValue ?? undefined);
    window.requestAnimationFrame(() => {
      emitValue();
      updateToolbarState();
    });
  }

  function pasteAsPlainText(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
    window.requestAnimationFrame(emitValue);
  }

  function preventUnsupportedShortcuts(event: React.KeyboardEvent<HTMLDivElement>) {
    if ((event.ctrlKey || event.metaKey) && ["b", "i", "u"].includes(event.key.toLowerCase())) {
      event.preventDefault();
    }
  }

  function normalizeOnBlur() {
    const editor = editorRef.current;
    if (!editor) return;
    const next = articleEditorElementToBlocks(editor);
    editor.innerHTML = articleBlocksToEditorHtml(next);
    syncValue(next);
    updateToolbarState();
    onBlur();
  }

  return (
    <fieldset className="min-w-0 space-y-2.5 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] p-3 sm:space-y-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend className="text-sm font-bold text-[var(--navy)]">
          {label}
          {required ? <span className="text-red-700"> *</span> : null}
        </legend>
        <span className="text-xs text-[var(--muted)]">تنسيق آمن متوافق مع المقالات</span>
      </div>

      <div className="flex max-w-full flex-wrap gap-1 rounded-xl border border-[var(--line)] bg-white p-1.5 sm:gap-1.5 sm:p-2" role="toolbar" aria-label={`أدوات تحرير ${label}`}>
        {toolbarActions.map(({ action, label: actionLabel, shortcut, Icon }) => {
          const isFormattingAction = action !== "undo" && action !== "redo";
          const isActive = activeActions.includes(action);
          return (
          <button
            key={action}
            type="button"
            title={shortcut ? `${actionLabel} (${shortcut})` : actionLabel}
            aria-label={shortcut ? `${actionLabel} (${shortcut})` : actionLabel}
            aria-pressed={isFormattingAction ? isActive : undefined}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runToolbarAction(action)}
            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg border text-[var(--navy)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:size-9 ${isActive && isFormattingAction ? "border-[var(--gold)] bg-[var(--gold-soft)] text-[var(--navy)]" : "border-transparent hover:border-[var(--line)] hover:bg-slate-50"}`}
          >
            <Icon className={`size-[18px] ${action === "redo" ? "-scale-x-100" : ""}`} />
            <span className="sr-only">{actionLabel}</span>
          </button>
          );
        })}
      </div>

      <div
        ref={editorRef}
        id={fieldId}
        role="textbox"
        aria-multiline="true"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId ?? name}-error` : undefined}
        contentEditable
        suppressContentEditableWarning
        dir={direction}
        data-placeholder="اكتب محتوى المقال هنا…"
        onInput={emitValue}
        onKeyDown={preventUnsupportedShortcuts}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        onFocus={updateToolbarState}
        onPaste={pasteAsPlainText}
        onBlur={normalizeOnBlur}
        className={`article-rich-text-editor min-h-56 min-w-0 w-full max-w-full overflow-x-hidden rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-[15px] leading-7 text-[var(--navy)] outline-none transition-colors [overflow-wrap:anywhere] empty:before:pointer-events-none empty:before:text-[var(--muted)] empty:before:content-[attr(data-placeholder)] hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-soft)] sm:min-h-64 sm:p-4 sm:text-base sm:leading-8 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:leading-8 sm:[&_h2]:mt-6 sm:[&_h2]:text-xl sm:[&_h2]:leading-9 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-bold sm:[&_h3]:mt-5 sm:[&_h3]:text-lg [&_blockquote]:my-3 [&_blockquote]:border-[var(--gold)] [&_blockquote]:text-[var(--muted)] [&_li]:break-words [&_ol]:my-2.5 [&_ol]:list-inside [&_ol]:list-decimal [&_ul]:my-2.5 [&_ul]:list-inside [&_ul]:list-disc ${direction === "rtl" ? "text-right [&_blockquote]:border-r-4 [&_blockquote]:pr-3 sm:[&_blockquote]:pr-4" : "text-left [&_blockquote]:border-l-4 [&_blockquote]:pl-3 sm:[&_blockquote]:pl-4"}`}
      />

      <p className="text-xs leading-5 text-[var(--muted)] sm:text-[13px]">
        الصق النص بأمان؛ يُزال أي تنسيق غير مدعوم. استخدم Ctrl+Z للتراجع وCtrl+Y للإعادة.
      </p>
      {error ? <p id={`${fieldId ?? name}-error`} className="text-xs font-medium text-red-700" role="alert">{error}</p> : null}
    </fieldset>
  );
}

/**
 * A deliberately small, RTL-first rich-text surface. Browser editing commands
 * expose only the six documented block types and every edit is serialized back
 * to the flat API `{ type, text }` contract.
 */
export function ArticleRichTextEditor(props: ArticleRichTextEditorProps) {
  return (
    <Controller
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <ArticleRichTextSurface
          {...props}
          value={Array.isArray(field.value) ? field.value as ArticleRichTextBlock[] : []}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}
