import type { GeneralInquiry, StudentApplication } from "@/lib/api-client/submissions";

/** Synthetic records derived from Task #5 OpenAPI response examples; tests only. */
export const applicationFixture: StudentApplication = {
  id: "b2b21ee5-f955-46ca-972f-6b6b81aa4a3d",
  applicationType: "SCHOLARSHIP_ASSISTANCE",
  scholarshipId: "9f414dec-fcbc-49dd-994f-086d2ef40e1f",
  countryId: "9879d0a4-9b7e-48d1-850a-da51be9de671",
  universityId: "88008b68-b698-4725-93e9-801537e7797c",
  studyLevel: "MASTERS",
  intendedMajor: "Computer Science",
  fullName: "أحمد محمد",
  email: "student@example.invalid",
  phone: "+963 900 000 000",
  message: "أرغب بالحصول على المساعدة في خطوات التقديم والمتطلبات المطلوبة.",
  status: "NEW",
  internalNote: null,
  privacyAcceptedAt: "2026-10-25T10:00:00Z",
  createdAt: "2026-10-25T10:00:00Z",
  updatedAt: "2026-10-25T10:00:00Z",
};
export const inquiryFixture: GeneralInquiry = {
  id: applicationFixture.id,
  fullName: applicationFixture.fullName,
  email: applicationFixture.email,
  phone: null,
  subject: "استفسار عن خدمات القبول الجامعي",
  message: "أرغب بمعرفة تفاصيل الخدمات المتاحة للطلاب الدوليين.",
  status: "NEW",
  internalNote: null,
  privacyAcceptedAt: applicationFixture.privacyAcceptedAt,
  createdAt: applicationFixture.createdAt,
  updatedAt: applicationFixture.updatedAt,
};
