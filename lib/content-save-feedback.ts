import { getApiErrorMessage, normalizeApiError } from "@/lib/api-client/error";

/** Maps a nested validation path to the form control that can display it. */
export function contentErrorFieldName(field: string): string {
  return field.split(/[.[\]]/, 1)[0] || field;
}

function isArabic(value: string) {
  return /[\u0600-\u06ff]/.test(value);
}

/** Provides Arabic save feedback while preserving an Arabic message supplied by the documented API envelope. */
export function contentSaveErrorMessage(error: unknown, fieldErrors: Record<string, string[]>): string {
  if (error instanceof Error && error.message === "لا توجد تغييرات للحفظ.") return error.message;

  const normalized = normalizeApiError(error);
  if (normalized.kind === "network") return "تعذّر الاتصال بالخادم. لم تُفقد بيانات النموذج.";

  const apiMessage = getApiErrorMessage(error);
  if (apiMessage && isArabic(apiMessage)) return apiMessage;

  switch (normalized.status) {
    case 400:
      return Object.keys(fieldErrors).length
        ? "رفض الخادم بعض الحقول. راجع الرسائل الظاهرة أسفل الحقول ثم أعد الحفظ."
        : "رفض الخادم بيانات الحفظ. راجع المحتوى ثم حاول مرة أخرى.";
    case 401:
      return "انتهت الجلسة قبل الحفظ. سجّل الدخول مجددًا ثم أعد المحاولة.";
    case 403:
      return "رفض الخادم الحفظ لعدم وجود صلاحية أو لفشل التحقق الأمني.";
    case 404:
      return "لم يعد السجل موجودًا. حدّث الصفحة قبل إعادة الحفظ.";
    case 409:
      return "تعذّر الحفظ بسبب تعارض مع بيانات أحدث. حدّث الصفحة وراجع التغييرات.";
    case 415:
      return "رفض الخادم صيغة بيانات الحفظ. راجع الحقول ثم حاول مرة أخرى.";
    default:
      return "تعذّر حفظ التغييرات. لم تُفقد بيانات النموذج؛ حاول مرة أخرى.";
  }
}
