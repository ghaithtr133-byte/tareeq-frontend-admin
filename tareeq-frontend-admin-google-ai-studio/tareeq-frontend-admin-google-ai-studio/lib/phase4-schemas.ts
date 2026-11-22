import { z } from "zod";
import { isoDateSchema, uuidSchema } from "@/lib/university-schemas";

export const managedRoles = ["ADMIN", "SUPER_ADMIN"] as const;
export const granularities = ["day", "week", "month"] as const;
export const eventTypes = ["PAGE_VIEW", "CTA_CLICK", "ENGAGEMENT", "APPLICATION_SUBMITTED", "INQUIRY_SUBMITTED"] as const;
export const ctaIds = ["APPLY_NOW", "REQUEST_CONSULTATION", "CONTACT_US", "VIEW_UNIVERSITY", "VIEW_SCHOLARSHIP", "VIEW_SERVICE"] as const;
export const engagementTypes = ["SCROLL_50", "SCROLL_90", "ACTIVE_30_SECONDS", "ACTIVE_60_SECONDS"] as const;
export const auditResourceTypes = ["COUNTRY", "UNIVERSITY", "SCHOLARSHIP", "SERVICE", "ARTICLE", "STUDENT_APPLICATION", "GENERAL_INQUIRY", "ADMIN_USER", "SITE_SETTINGS", "FAQ_ENTRY", "UNIVERSITY_PROGRAM", "ACADEMIC_MAJOR", "CITY", "UNIVERSITY_ADMISSION_REQUIREMENT", "UNIVERSITY_GALLERY_IMAGE", "ABOUT_US", "MARKETING_PAGE_IMAGE", "STUDENT_JOURNEY_STEP", "COUNTRY_STUDY_GUIDE_SECTION", "SERVICE_DETAIL_ITEM", "SCHOLARSHIP_DETAIL_ITEM"] as const;
const count = z.number().int().nonnegative(); const rate = z.number().nonnegative();
const date = z.iso.date();
const analyticsFields = { from: date.optional(), to: date.optional(), granularity: z.enum(granularities).default("day"), topLimit: z.number().int().min(1).max(25).default(10) };
function validateAnalyticsRange(value: { from?: string; to?: string }, context: z.RefinementCtx) { if (value.from && value.to) { const days = (Date.parse(value.to) - Date.parse(value.from)) / 86_400_000 + 1; if (days < 1 || days > 366) context.addIssue({ code: "custom", path: ["to"], message: "الفترة شاملة، مرتبة، ولا تتجاوز 366 يومًا." }); } }
export const analyticsParamsSchema = z.object(analyticsFields).strict().superRefine(validateAnalyticsRange);
export const journeyParamsSchema = z.object({ ...analyticsFields, page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(20).default(10) }).strict().superRefine(validateAnalyticsRange);
export const accountParamsSchema = z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(50).default(20) }).strict();
export const auditParamsSchema = z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(20), actorId: uuidSchema.optional(), action: z.string().min(3).max(100).regex(/^[a-z][a-z0-9]*(?:[._][a-z0-9]+)+$/).optional(), resourceType: z.enum(auditResourceTypes).optional(), from: isoDateSchema.optional(), to: isoDateSchema.optional() }).strict().superRefine((value, context) => { if (value.from && value.to && Date.parse(value.from) > Date.parse(value.to)) context.addIssue({ code: "custom", path: ["to"], message: "نهاية الفترة تسبق بدايتها." }); });
export type AnalyticsParams = z.input<typeof analyticsParamsSchema>;
export type JourneyParams = z.input<typeof journeyParamsSchema>;
export type AccountParams = z.input<typeof accountParamsSchema>;
export type AuditParams = z.input<typeof auditParamsSchema>;
export const accountSchema = z.object({ id: uuidSchema, name: z.string(), email: z.email(), role: z.enum(managedRoles), isActive: z.boolean() });
export type ManagedAccount = z.infer<typeof accountSchema>;
export const accountUpdateSchema = z.union([z.object({ role: z.enum(managedRoles) }).strict(), z.object({ isActive: z.boolean() }).strict()]);
export type AccountUpdate = z.infer<typeof accountUpdateSchema>;
export const paginationSchema = z.object({ page: z.number().int(), limit: z.number().int(), total: z.number().int(), totalPages: z.number().int() });
const range = z.object({ from: date, to: date, granularity: z.enum(granularities) });
const conversions = z.object({ applications: count, inquiries: count, total: count });
export const trendSchema = z.object({ periodStart: isoDateSchema, pageViews: count, visitors: count, sessions: count, ctaClicks: count, clientReportedConversions: count, serverVerifiedApplications: count, serverVerifiedInquiries: count });
export const analyticsSummarySchema = z.object({ range, totals: z.object({ pageViews: count, visitors: count, sessions: count }), topPages: z.array(z.object({ path: z.string(), pageViews: count, visitors: count })), trafficSources: z.array(z.object({ source: z.string(), medium: z.string().nullable(), campaign: z.string().nullable(), sessions: count, pageViews: count })), ctaEngagement: z.array(z.object({ ctaId: z.enum(ctaIds), clicks: count, sessions: count })), clientReportedConversions: conversions, serverVerifiedConversions: conversions, conversionRates: z.object({ clientReportedSessionRate: rate, applicationSessionRate: rate, inquirySessionRate: rate }), funnel: z.array(z.object({ step: z.string(), sessions: count, rateFromPrevious: rate.nullable() })), trends: z.array(trendSchema) });
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
export type Trend = z.infer<typeof trendSchema>;
export const journeySchema = z.object({ range, items: z.array(z.object({ sessionId: uuidSchema, startedAt: isoDateSchema, endedAt: isoDateSchema, eventCount: count, truncated: z.boolean(), clientReportedApplication: z.boolean(), clientReportedInquiry: z.boolean(), steps: z.array(z.object({ eventId: uuidSchema, type: z.enum(eventTypes), path: z.string(), targetPath: z.string().nullable(), occurredAt: isoDateSchema,
  ctaId: z.enum(ctaIds).nullable(), engagementType: z.enum(engagementTypes).nullable(),
})) })), pagination: paginationSchema });
export const auditSchema = z.object({ id: uuidSchema, actorAdminId: uuidSchema, action: z.string(), resourceType: z.enum(auditResourceTypes), resourceId: uuidSchema, metadata: z.record(z.string(), z.unknown()), createdAt: isoDateSchema, actor: z.object({ id: uuidSchema, name: z.string() }) });
export type AuditLog = z.infer<typeof auditSchema>;
