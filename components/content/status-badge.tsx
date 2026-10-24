import type { PublicationStatus } from "@/api/content";

const labels: Record<PublicationStatus, string> = { DRAFT: "مسودة", PUBLISHED: "منشور", ARCHIVED: "مؤرشف" };
const colors: Record<PublicationStatus, string> = {
  DRAFT: "border-amber-200 bg-amber-50 text-amber-800",
  PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
};

export function StatusBadge({ status }: { status: PublicationStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${colors[status]}`}>{labels[status]}</span>;
}
