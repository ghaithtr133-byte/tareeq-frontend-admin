import type { ReactNode } from "react";
import type { SubmissionStatus } from "@/api/submissions";
import { submissionErrorMessage, submissionStatusLabels } from "@/lib/submissions";

export const submissionControlClass = "min-h-11 w-full min-w-0 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm";
export const submissionButtonClass = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50";

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const colors = { NEW: "bg-blue-50 text-blue-900", IN_REVIEW: "bg-amber-50 text-amber-900", RESOLVED: "bg-green-50 text-green-900", CLOSED: "bg-slate-100 text-slate-800" };
  return <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold ${colors[status]}`}>{submissionStatusLabels[status]}</span>;
}
export function SubmissionError({ error, retry }: { error: unknown; retry?: () => void }) {
  return <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><p>{submissionErrorMessage(error)}</p>{retry ? <button type="button" onClick={retry} className={submissionButtonClass}>إعادة المحاولة</button> : null}</div>;
}
export function SubmissionField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid min-w-0 gap-2 text-sm font-semibold text-[var(--navy)]"><span>{label}</span>{children}</label>;
}
export function submissionDate(value: string) {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
