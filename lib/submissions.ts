import { normalizeApiError } from "@/api/error";
import { applicationTypes, submissionSorts, submissionStatuses, type ApplicationListParams, type Submission, type SubmissionResource, type SubmissionStatus, type SubmissionStatusUpdateRequest } from "@/api/submissions";

export const submissionLabels = { applications: "طلبات التقديم", inquiries: "الاستفسارات العامة" };
export const submissionStatusLabels: Record<SubmissionStatus, string> = { NEW: "جديد", IN_REVIEW: "قيد المراجعة", RESOLVED: "تمت المعالجة", CLOSED: "مغلق" };
export const applicationTypeLabels = { UNIVERSITY_ADMISSION: "قبول جامعي", SCHOLARSHIP_ASSISTANCE: "مساعدة في المنح" };
export type SubmissionSearchParams = Record<string, string | string[] | undefined>;

export function parseSubmissionFilters(resource: SubmissionResource, params: SubmissionSearchParams): ApplicationListParams {
  const positive = (value: unknown, fallback: number, maximum: number) => typeof value === "string" && Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= maximum ? Number(value) : fallback;
  const select = <T extends string>(value: unknown, values: readonly T[]): T | undefined => typeof value === "string" && values.includes(value as T) ? value as T : undefined;
  return {
    page: positive(params.page, 1, Number.MAX_SAFE_INTEGER),
    limit: positive(params.limit, 12, 50),
    sort: select(params.sort, submissionSorts) ?? "newest",
    status: select(params.status, submissionStatuses),
    ...(resource === "applications" ? { applicationType: select(params.applicationType, applicationTypes) } : {}),
  };
}

/** Empty string is valid; null is an explicit clear, and unchanged is omitted. */
export function submissionChanges(baseline: Pick<Submission, "status" | "internalNote">, status: SubmissionStatus, internalNote: string | null): SubmissionStatusUpdateRequest {
  return {
    ...(status !== baseline.status ? { status } : {}),
    ...(internalNote !== baseline.internalNote ? { internalNote } : {}),
  };
}

export function submissionErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  if (normalized.kind === "cancelled") return "تم إلغاء الطلب.";
  if (normalized.kind === "network") return "تعذّر الاتصال بالخادم. أعد المحاولة دون مغادرة الصفحة.";
  switch (normalized.status) {
    case 400: return "تحقق من الحقول المدخلة ثم أعد المحاولة.";
    case 401: return "انتهت الجلسة. جارٍ التحقق من تسجيل الدخول.";
    case 403: return "لا تملك صلاحية إتمام هذا الطلب أو لم يُقبل مصدر الطلب.";
    case 404: return "لم يتم العثور على السجل المطلوب.";
    case 415: return "تعذّر إرسال التحديث بصيغة JSON المطلوبة.";
    default: return "تعذّر إتمام الطلب. أعد المحاولة لاحقًا.";
  }
}
