"use client";

import type { Article } from "@/lib/api-client/content";
import { ContentHardDeleteDialog } from "@/components/content/content-hard-delete-dialog";

/** Kept as the public TA-113 entry point while sharing the current policy dialog. */
export function ArticleHardDeleteDialog({
  article,
  onClose,
  onDeleted,
}: {
  article: Pick<Article, "id" | "titleAr">;
  onClose: () => void;
  onDeleted: () => void;
}) {
  return (
    <ContentHardDeleteDialog
      resource="articles"
      record={{ id: article.id, nameAr: article.titleAr }}
      onClose={onClose}
      onDeleted={onDeleted}
    />
  );
}
