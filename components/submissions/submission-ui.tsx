import type { ReactNode } from "react";
import type { SubmissionStatus } from "@/lib/api-client/submissions";
import { submissionErrorMessage, submissionStatusLabels } from "@/lib/submissions";

export const submissionControlClass =
  "min-h-10 w-full min-w-0 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--navy)] placeholder:text-[var(--muted)]/80 hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none";

export const submissionButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[var(--navy)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--navy-light)] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap";

export const submissionSecondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap";

const badgeStyles: Record<SubmissionStatus, string> = {
  NEW: "border-blue-200 bg-blue-50 text-blue-900",
  IN_REVIEW: "border-amber-200 bg-amber-50 text-amber-900",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${badgeStyles[status]}`}
    >
      {submissionStatusLabels[status]}
    </span>
  );
}

export function SubmissionError({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900"
    >
      <p className="font-medium">{submissionErrorMessage(error)}</p>
      {retry ? (
        <button type="button" onClick={retry} className={submissionButtonClass}>
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}

export function SubmissionField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-[var(--navy)]">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function submissionDate(value: string) {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
