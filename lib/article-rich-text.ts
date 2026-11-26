import type { ArticleBlockType, ArticleRichTextBlock } from "@/lib/api-client/content";

export type ArticleEditorDocumentNode =
  | { type: "paragraph" | "heading2" | "heading3" | "quote"; text: string }
  | { type: "bulleted-list" | "numbered-list"; items: string[] };

/** Groups adjacent list items for a continuous editor without changing their API order. */
export function articleBlocksToEditorDocument(blocks: readonly ArticleRichTextBlock[]): ArticleEditorDocumentNode[] {
  const document: ArticleEditorDocumentNode[] = [];
  for (const block of blocks) {
    if (block.type === "bulleted-list" || block.type === "numbered-list") {
      const previous = document.at(-1);
      if (previous && "items" in previous && previous.type === block.type) previous.items.push(block.text);
      else document.push({ type: block.type, items: [block.text] });
      continue;
    }
    document.push({ type: block.type, text: block.text });
  }
  return document;
}

/** Flattens the editor model back to the exact documented API block contract. */
export function editorDocumentToArticleBlocks(document: readonly ArticleEditorDocumentNode[]): ArticleRichTextBlock[] {
  const blocks: ArticleRichTextBlock[] = [];
  for (const node of document) {
    if ("items" in node) blocks.push(...node.items.map((text) => ({ type: node.type, text })));
    else blocks.push({ type: node.type, text: node.text });
  }
  return blocks;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\r?\n/g, "<br>");
}

/** Emits only semantic elements which can be read back into supported blocks. */
export function articleBlocksToEditorHtml(blocks: readonly ArticleRichTextBlock[]) {
  return articleBlocksToEditorDocument(blocks)
    .map((node) => {
      if ("items" in node && node.type === "bulleted-list") return `<ul>${node.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
      if ("items" in node && node.type === "numbered-list") return `<ol>${node.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`;
      if ("items" in node) return "";
      const tag = node.type === "heading2" ? "h2" : node.type === "heading3" ? "h3" : node.type === "quote" ? "blockquote" : "p";
      return `<${tag}>${escapeHtml(node.text)}</${tag}>`;
    })
    .join("");
}

function editorNodeText(node: Node): string {
  if (node.nodeType === 3) return node.nodeValue ?? "";
  const element = node as HTMLElement;
  if (!element.tagName) return "";
  if (element.tagName.toLowerCase() === "br") return "\n";
  const children = Array.from(element.childNodes ?? []);
  return children.length ? children.map(editorNodeText).join("") : element.textContent ?? "";
}

function textFromEditorElement(element: Element): string {
  return editorNodeText(element as Node).replace(/\u00a0/g, " ");
}

/**
 * Keeps a deliberate empty paragraph between content sections as line breaks
 * inside the preceding valid API block. Leading/trailing empty editor nodes
 * are browser artifacts and are deliberately ignored.
 */
function preserveInteriorBlankLines(blocks: ArticleRichTextBlock[]): ArticleRichTextBlock[] {
  const normalized: ArticleRichTextBlock[] = [];
  let pendingBlankParagraphs = 0;

  for (const block of blocks) {
    if (!block.text.trim()) {
      if (block.type === "paragraph") pendingBlankParagraphs += 1;
      continue;
    }
    if (pendingBlankParagraphs && normalized.length) {
      normalized[normalized.length - 1].text += "\n".repeat(pendingBlankParagraphs + 1);
    }
    pendingBlankParagraphs = 0;
    normalized.push(block);
  }

  return normalized;
}

export function articleEditorElementToBlocks(root: HTMLElement): ArticleRichTextBlock[] {
  const blocks: ArticleRichTextBlock[] = [];
  for (const child of Array.from(root.children)) {
    const tag = child.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      blocks.push(...Array.from(child.children)
        .filter((item) => item.tagName.toLowerCase() === "li")
        .map((item) => ({ type: tag === "ul" ? "bulleted-list" as const : "numbered-list" as const, text: textFromEditorElement(item) })));
      continue;
    }
    const type: ArticleBlockType = tag === "h2"
      ? "heading2"
      : tag === "h3"
        ? "heading3"
        : tag === "blockquote"
          ? "quote"
          : "paragraph";
    blocks.push({ type, text: textFromEditorElement(child) });
  }
  if (!blocks.length && root.textContent) blocks.push({ type: "paragraph", text: root.textContent.replace(/\u00a0/g, " ") });
  return preserveInteriorBlankLines(blocks);
}
