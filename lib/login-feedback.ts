import { normalizeApiError } from "@/lib/api-client/error";

function responseErrorCode(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null || !("error" in data)) return undefined;
  const code = (data as { error?: { code?: unknown } }).error?.code;
  return typeof code === "string" ? code : undefined;
}

/** Never expose Backend authentication details, account existence, or cookie state to the login screen. */
export function loginFailureMessage(error: unknown): string | undefined {
  const normalized = normalizeApiError(error);
  if (normalized.kind === "cancelled") return undefined;
  if (normalized.kind === "network") return "تعذّر الاتصال بالخادم. تحقق من الاتصال ثم حاول مرة أخرى.";
  if (normalized.status === 401) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (normalized.status === 403 && responseErrorCode(normalized.responseData) === "DEV_PROXY_UNTRUSTED_LOCAL_REQUEST") {
    return "تعذّر الاتصال بالخادم عبر إعداد التطوير المحلي. تحقق من عنوان التشغيل ثم حاول مرة أخرى.";
  }
  if (normalized.status === 403) return "هذا الحساب غير مخوّل للدخول إلى لوحة الإدارة. تواصل مع مدير النظام.";
  if (normalized.status === 502 || (normalized.status !== undefined && normalized.status >= 500)) return "الخادم غير متاح حاليًا. حاول مرة أخرى لاحقًا.";
  return "تعذّر تسجيل الدخول حاليًا. حاول مرة أخرى.";
}
