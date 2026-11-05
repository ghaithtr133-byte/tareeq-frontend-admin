import { z } from "zod";
import { getApiFieldErrors, normalizeApiError, type ApiErrorKind } from "@/api/error";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "أدخل كلمة المرور الحالية.").max(128, "الحد الأقصى 128 حرفًا."),
  newPassword: z.string().min(12, "استخدم 12 حرفًا على الأقل.").max(128, "الحد الأقصى 128 حرفًا.").regex(/[a-z]/, "أضف حرفًا صغيرًا.").regex(/[A-Z]/, "أضف حرفًا كبيرًا.").regex(/[0-9]/, "أضف رقمًا."),
}).strict();
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
/** Deliberately no Axios config/cause/request body: errors retained in Query state must be secret-free. */
export class ChangePasswordError extends Error {
  constructor(public readonly kind: ApiErrorKind, public readonly status?: number, public readonly fields: string[] = []) { super("تعذّر تغيير كلمة المرور."); }
}
export function safePasswordError(error: unknown): ChangePasswordError {
  if (error instanceof ChangePasswordError) return error;
  const normalized = normalizeApiError(error);
  return new ChangePasswordError(normalized.kind, normalized.status, Object.keys(getApiFieldErrors(error)).filter(name => ["currentPassword", "newPassword"].includes(name)));
}
