import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { Article, ArticleRichTextBlock } from "@/lib/api-client/content";
import {
  articleBlocksToEditorDocument,
  articleBlocksToEditorHtml,
  articleEditorElementToBlocks,
  editorDocumentToArticleBlocks,
} from "@/lib/article-rich-text";
import { initialContentValues, toContentPatch, validateContentValues } from "@/lib/content-form";

const id = "00000000-0000-4000-8000-000000000001";

test("TA-57: existing supported article blocks round-trip through the unified editor model without data loss", () => {
  const blocks: ArticleRichTextBlock[] = [
    { type: "heading2", text: "ابدأ بخطة واضحة" },
    { type: "paragraph", text: "محتوى عربي مع English terms." },
    { type: "bulleted-list", text: "الاعتماد الأكاديمي" },
    { type: "bulleted-list", text: "تكلفة المعيشة" },
    { type: "numbered-list", text: "حدّد التخصص" },
    { type: "numbered-list", text: "قارن البرامج" },
    { type: "heading3", text: "ملاحظة مهمة" },
    { type: "quote", text: "اختر ما يناسب أهدافك." },
  ];
  const document = articleBlocksToEditorDocument(blocks);
  assert.deepEqual(editorDocumentToArticleBlocks(document), blocks);
  assert.match(articleBlocksToEditorHtml(blocks), /<ul><li>الاعتماد الأكاديمي<\/li><li>تكلفة المعيشة<\/li><\/ul>/);
  assert.match(articleBlocksToEditorHtml(blocks), /<ol><li>حدّد التخصص<\/li><li>قارن البرامج<\/li><\/ol>/);
});

test("TA-57: semantic editor elements serialize back to the documented flat blocks", () => {
  const element = (tagName: string, textContent: string, children: HTMLElement[] = []) => ({
    nodeType: 1,
    tagName,
    textContent,
    children,
  }) as unknown as HTMLElement;
  const root = element("DIV", "", [
    element("H2", "ابدأ بخطة واضحة"),
    element("P", "محتوى عربي مع English terms."),
    element("UL", "", [element("LI", "الاعتماد الأكاديمي"), element("LI", "تكلفة المعيشة")]),
    element("OL", "", [element("LI", "حدّد التخصص"), element("LI", "قارن البرامج")]),
    element("H3", "ملاحظة مهمة"),
    element("BLOCKQUOTE", "اختر ما يناسب أهدافك."),
  ]);

  assert.deepEqual(articleEditorElementToBlocks(root), [
    { type: "heading2", text: "ابدأ بخطة واضحة" },
    { type: "paragraph", text: "محتوى عربي مع English terms." },
    { type: "bulleted-list", text: "الاعتماد الأكاديمي" },
    { type: "bulleted-list", text: "تكلفة المعيشة" },
    { type: "numbered-list", text: "حدّد التخصص" },
    { type: "numbered-list", text: "قارن البرامج" },
    { type: "heading3", text: "ملاحظة مهمة" },
    { type: "quote", text: "اختر ما يناسب أهدافك." },
  ]);
});

test("TA-57: interior editor blank lines become valid text line breaks while edge artifacts are discarded", () => {
  const text = (value: string) => ({ nodeType: 3, nodeValue: value }) as unknown as Node;
  const element = (tagName: string, textContent: string, children: HTMLElement[] = [], childNodes: Node[] = [text(textContent)]) => ({
    nodeType: 1,
    tagName,
    textContent,
    children,
    childNodes,
  }) as unknown as HTMLElement;
  const blank = element("DIV", "", [], [element("BR", "")]);
  const root = element("DIV", "", [
    blank,
    element("DIV", "القسم الأول"),
    blank,
    element("DIV", "القسم الثاني"),
    blank,
  ]);

  const blocks = articleEditorElementToBlocks(root);
  assert.deepEqual(blocks, [
    { type: "paragraph", text: "القسم الأول\n\n" },
    { type: "paragraph", text: "القسم الثاني" },
  ]);
  assert.equal(articleBlocksToEditorHtml(blocks), "<p>القسم الأول<br><br></p><p>القسم الثاني</p>");
  const reopened = element("DIV", "", [
    element("P", "القسم الأول", [], [text("القسم الأول"), element("BR", ""), element("BR", "")]),
    element("P", "القسم الثاني"),
  ]);
  assert.deepEqual(articleEditorElementToBlocks(reopened), blocks);

  const values = initialContentValues("articles");
  assert.equal(validateContentValues("articles", { ...values, bodyAr: blocks }).bodyAr, undefined);
  assert.match(
    validateContentValues("articles", { ...values, bodyAr: [{ type: "paragraph", text: "" }] }).bodyAr ?? "",
    /الكتلة رقم 1/,
  );
});

test("TA-57: editor round-trip preserves article PATCH semantics and does not touch unrelated fields", () => {
  const record: Article = {
    id,
    slug: "article-guide",
    featured: false,
    publishedAt: null,
    seoTitleAr: "عنوان SEO",
    seoDescriptionAr: "وصف SEO",
    titleAr: "دليل المقال",
    titleEn: "Article guide",
    summaryAr: "ملخص المقال",
    summaryEn: "Stored English summary",
    bodyAr: [{ type: "paragraph", text: "نص محفوظ" }, { type: "quote", text: "اقتباس محفوظ" }],
    bodyEn: [{ type: "paragraph", text: "Stored English paragraph" }],
    coverImageUrl: null,
    coverImageAltAr: null,
    coverImageAltEn: null,
    countryId: null,
    universityId: null,
    scholarshipId: null,
    status: "PUBLISHED",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    scholarshipIds: [],
    relatedScholarships: [],
  };
  const values = initialContentValues("articles", record);
  const roundTripped = editorDocumentToArticleBlocks(articleBlocksToEditorDocument(record.bodyAr));
  assert.throws(
    () => toContentPatch("articles", { ...values, bodyAr: roundTripped }, record, { statusChanged: false }),
    /لا توجد تغييرات للحفظ/,
  );
  assert.deepEqual(
    toContentPatch("articles", { ...values, bodyAr: [...roundTripped, { type: "paragraph", text: "إضافة" }] }, record, { statusChanged: false }),
    { bodyAr: [...record.bodyAr, { type: "paragraph", text: "إضافة" }] },
  );
  const withIntentionalBlankLine = [
    { type: "paragraph" as const, text: "نص محفوظ\n\n" },
    { type: "quote" as const, text: "اقتباس محفوظ" },
  ];
  assert.deepEqual(
    toContentPatch("articles", { ...values, bodyAr: withIntentionalBlankLine }, record, { statusChanged: false }),
    { bodyAr: withIntentionalBlankLine },
  );
});

test("TA-57: the editor exposes only supported block commands and strips pasted markup to plain text", () => {
  const source = readFileSync("components/content/article-block-editor.tsx", "utf8");
  assert.match(source, /contentEditable/);
  assert.match(source, /clipboardData\.getData\("text\/plain"\)/);
  assert.match(source, /preventUnsupportedShortcuts/);
  assert.match(source, /insertUnorderedList/);
  assert.match(source, /insertOrderedList/);
  assert.match(source, /formatBlock/);
  assert.match(source, /action: "undo"/);
  assert.match(source, /document\.execCommand\(command/);
  assert.match(source, /aria-pressed/);
  assert.match(source, /activeActions/);
  assert.match(source, /flex max-w-full flex-wrap/);
  assert.match(source, /min-h-56 min-w-0 w-full max-w-full overflow-x-hidden/);
  assert.doesNotMatch(source, /execCommand\("(?:bold|italic|createLink|insertImage)"/i);
});
