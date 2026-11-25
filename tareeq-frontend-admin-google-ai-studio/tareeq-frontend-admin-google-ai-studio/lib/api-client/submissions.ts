import type { AxiosRequestConfig } from "axios";
import { z } from "zod";

import { apiClient } from "@/lib/api-client/client";

/** Derived from the supplied tareeq-academy-api.json Task #5 schemas. */
export const submissionStatuses = ["NEW", "IN_REVIEW", "RESOLVED", "CLOSED"] as const;
export const applicationTypes = ["UNIVERSITY_ADMISSION", "SCHOLARSHIP_ASSISTANCE"] as const;
export const submissionSorts = ["newest", "oldest", "updated"] as const;
export type SubmissionResource = "applications" | "inquiries";
export type SubmissionStatus = typeof submissionStatuses[number];
export type StudentApplicationType = typeof applicationTypes[number];
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const timestamp = z.iso.datetime({ offset: true });
const commonFields = {
  id: uuid,
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  message: z.string(),
  status: z.enum(submissionStatuses),
  internalNote: z.string().nullable(),
  privacyAcceptedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
};
export const studentApplicationSchema = z.object({
  ...commonFields,
  applicationType: z.enum(applicationTypes),
  scholarshipId: uuid.nullable(),
  countryId: uuid.nullable(),
  universityId: uuid.nullable(),
  studyLevel: z.string().nullable(),
  intendedMajor: z.string().nullable(),
});
export const generalInquirySchema = z.object({ ...commonFields, subject: z.string() });
export type StudentApplication = z.infer<typeof studentApplicationSchema>;
export type GeneralInquiry = z.infer<typeof generalInquirySchema>;
export type Submission = StudentApplication | GeneralInquiry;
export type SubmissionMap = { applications: StudentApplication; inquiries: GeneralInquiry };

const baseParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(12),
  status: z.enum(submissionStatuses).optional(),
  sort: z.enum(submissionSorts).default("newest"),
});
export interface InquiryListParams {
  page?: number;
  limit?: number;
  status?: SubmissionStatus;
  sort?: typeof submissionSorts[number];
}
export interface ApplicationListParams extends InquiryListParams { applicationType?: StudentApplicationType }
export type SubmissionParamsMap = { applications: ApplicationListParams; inquiries: InquiryListParams };
export const submissionStatusUpdateSchema = z.object({
  status: z.enum(submissionStatuses).optional(),
  internalNote: z.string().max(5000, "الحد الأقصى للملاحظة 5000 حرف.").nullable().optional(),
}).strict().refine((input) => input.status !== undefined || input.internalNote !== undefined, "اختر تغييرًا قبل الحفظ.");
export type SubmissionStatusUpdateRequest = z.infer<typeof submissionStatusUpdateSchema>;
const paginationSchema = z.object({ page: z.number().int(), limit: z.number().int(), total: z.number().int(), totalPages: z.number().int() });
export type SubmissionList<T> = { items: T[]; pagination: z.infer<typeof paginationSchema> };

/** Explicit allowlist: never forwards unsupported search/filter parameters. */
export function serializeSubmissionParams<K extends SubmissionResource>(resource: K, params: SubmissionParamsMap[K]) {
  const base = baseParamsSchema.parse(params);
  if (resource === "applications") {
    const applicationType = z.enum(applicationTypes).optional().parse((params as ApplicationListParams).applicationType);
    return { ...base, ...(applicationType ? { applicationType } : {}) };
  }
  return base;
}

export const submissionApi = {
  async list<K extends SubmissionResource>(resource: K, params: SubmissionParamsMap[K], config?: Pick<AxiosRequestConfig, "signal">): Promise<SubmissionList<SubmissionMap[K]>> {
    const response = await apiClient.get(`/admin/${resource}`, { ...config, params: serializeSubmissionParams(resource, params) });
    const recordSchema = resource === "applications" ? studentApplicationSchema : generalInquirySchema;
    const result = z.object({ success: z.literal(true), data: z.object({ items: z.array(recordSchema), pagination: paginationSchema }) }).parse(response.data);
    return result.data as SubmissionList<SubmissionMap[K]>;
  },
  async get<K extends SubmissionResource>(resource: K, id: string, config?: Pick<AxiosRequestConfig, "signal">): Promise<SubmissionMap[K]> {
    uuid.parse(id);
    const response = await apiClient.get(`/admin/${resource}/${id}`, config);
    return parseRecord(resource, response.data);
  },
  async update<K extends SubmissionResource>(resource: K, id: string, input: SubmissionStatusUpdateRequest): Promise<SubmissionMap[K]> {
    uuid.parse(id);
    const payload = submissionStatusUpdateSchema.parse(input);
    const response = await apiClient.patch(`/admin/${resource}/${id}/status`, payload, { headers: { "Content-Type": "application/json" } });
    return parseRecord(resource, response.data);
  },
};

function parseRecord<K extends SubmissionResource>(resource: K, value: unknown): SubmissionMap[K] {
  const schema = resource === "applications" ? studentApplicationSchema : generalInquirySchema;
  return z.object({ success: z.literal(true), data: schema }).parse(value).data as SubmissionMap[K];
}

export function isSubmissionId(id: string): boolean { return uuid.safeParse(id).success; }
