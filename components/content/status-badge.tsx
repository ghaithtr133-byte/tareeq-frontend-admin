import type { PublicationStatus } from "@/lib/api-client/content";
import { CheckIcon } from "@/components/ui/admin-icons";

const labels: Record<PublicationStatus, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

const styles: Record<PublicationStatus, string> = {
  DRAFT: "border-amber-200/90 bg-amber-50/90 text-amber-900",
  PUBLISHED: "border-emerald-200/90 bg-emerald-50/90 text-emerald-900",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
};

export function StatusBadge({ status }: { status: PublicationStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${styles[status]}`}
    >
      {status === "PUBLISHED" ? <CheckIcon className="size-3.5 text-emerald-700" /> : null}
      <span>{labels[status]}</span>
    </span>
  );
}
