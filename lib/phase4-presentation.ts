import type { Trend } from "@/lib/phase4-schemas";
import { submissionStatuses } from "@/api/submissions";
import { publicationStates } from "@/lib/university-schemas";
import { managedRoles } from "@/lib/phase4-schemas";
export const trendLabels = { pageViews: "مشاهدات الصفحات", visitors: "الزوار", sessions: "الجلسات", ctaClicks: "نقرات الدعوة للإجراء", clientReportedConversions: "تحويلات مبلغ عنها من المتصفح", serverVerifiedApplications: "طلبات مؤكدة من الخادم", serverVerifiedInquiries: "استفسارات مؤكدة من الخادم" } as const;
export type TrendMetric = keyof typeof trendLabels;
export function formatCount(value: number | null | undefined) { return value == null ? "غير متاح" : new Intl.NumberFormat("ar", { maximumFractionDigits: 0 }).format(value); }
/** Approved example already sends 6.47 for a 6.47% rate. Never multiply Backend rates by100. */
export function formatRate(value: number | null | undefined) { return value == null ? "غير متاح" : `${new Intl.NumberFormat("ar", { maximumFractionDigits: 2 }).format(value)}٪`; }
export function utcDate(value: string, withTime = false) { return new Intl.DateTimeFormat("ar", { dateStyle: "medium", ...(withTime ? { timeStyle: "short" as const } : {}), timeZone: "UTC" }).format(new Date(value)); }
export function trendPoints(rows: Trend[], metric: TrendMetric) {
  const sorted = [...rows].sort((a, b) => Date.parse(a.periodStart) - Date.parse(b.periodStart)); const max = Math.max(0, ...sorted.map(row => row[metric]));
  return sorted.map((row, index) => ({ period: row.periodStart, value: row[metric], x: sorted.length === 1 ? 300 : 30 + index * 540 / (sorted.length - 1), y: max === 0 ? 150 : 150 - row[metric] * 120 / max }));
}
/** Do not turn anonymous paths into a conduit for query strings, identity or executable links. */
export function safeAnalyticsPath(value: string | null) { return value && /^\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/]*$/.test(value) && value.length <= 500 ? value : value === null ? "—" : "مسار محجوب لسلامة العرض"; }
const statusValues: ReadonlySet<string> = new Set([...publicationStates, ...submissionStatuses, ...managedRoles]);
/** Presentation allowlist, not a claim that these optional metadata keys form a Backend schema. */
export function safeAuditMetadata(metadata: Record<string, unknown>) {
  const rows: { label: string; value: string }[] = [];
  const enums: Record<string, string> = { fromStatus: "الحالة السابقة", toStatus: "الحالة الجديدة", fromRole: "الدور السابق", toRole: "الدور الجديد", role: "الدور" };
  const booleans: Record<string, string> = { fromIsActive: "التفعيل السابق", toIsActive: "التفعيل الجديد", isActive: "مفعّل" };
  for (const [key, label] of Object.entries(enums)) if (typeof metadata[key] === "string" && statusValues.has(metadata[key] as string)) rows.push({ label, value: metadata[key] as string });
  for (const [key, label] of Object.entries(booleans)) if (typeof metadata[key] === "boolean") rows.push({ label, value: metadata[key] ? "نعم" : "لا" });
  return { rows, hasHiddenFields: Object.keys(metadata).length > rows.length };
}
export function actionLabel(action: string) {
  if (action.endsWith(".status_changed")) return "تغيير الحالة";
  if (action.endsWith(".created")) return "إنشاء";
  if (action.endsWith(".updated")) return "تحديث";
  if (action.endsWith(".role_changed")) return "تغيير الدور";
  if (action.endsWith(".reordered")) return "إعادة ترتيب";
  return "إجراء إداري";
}
