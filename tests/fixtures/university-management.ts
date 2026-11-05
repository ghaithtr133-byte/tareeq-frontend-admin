import type { AdmissionRequirement, GalleryImage, UniversityProgram } from "@/api/university-management";
export const universityId = "00000000-0000-4000-8000-000000000001";
export const recordId = "00000000-0000-4000-8000-000000000002";
export const countryId = "00000000-0000-4000-8000-000000000003";
export const majorId = "00000000-0000-4000-8000-000000000004";
export const dates = { createdAt: "2026-11-01T10:00:00Z", updatedAt: "2026-11-01T10:00:00Z" };
export const major = { id: majorId, slug: "computer-science", nameAr: "علوم الحاسوب", nameEn: "Computer Science", category: null, ...dates };
export const city = { id: recordId, countryId, slug: "amman", nameAr: "عمّان", nameEn: "Amman", ...dates };
const base = { id: recordId, universityId, status: "DRAFT" as const, publishedAt: null, ...dates };
// tuition/studyLevel nulls are opaque fixtures only, not a claim that the contradictory allOf schemas validate them.
export const program: UniversityProgram = { ...base, nameAr: "برنامج تجريبي محلي", nameEn: null, facultyNameAr: null, facultyNameEn: null, durationValue: null, durationUnit: null, academicMajorId: majorId, academicMajor: major, studyLevel: "BACHELORS", languages: ["ENGLISH"], officialSourceUrl: "https://example.invalid/program", verifiedAt: dates.createdAt, tuition: null, tuitionFees: [] };
export const requirement: AdmissionRequirement = { ...base, scope: "UNIVERSITY", studyLevel: null, programId: null, contentAr: "متطلبات قبول محلية للاختبار فقط", contentEn: null, officialSourceUrl: null, verifiedAt: null, program: null };
export const image: GalleryImage = { ...base, imageUrl: "https://example.invalid/image.png", altAr: "صورة تجريبية", altEn: null, displayOrder: 0 };
export const university = { id: universityId, nameAr: "جامعة الاختبار المحلية", nameEn: null, slug: "local-university", officialName: "Local University", countryId, cityId: null, universityType: "PUBLIC", cityAr: "عمّان", cityEn: null, overviewAr: "وصف تجريبي", overviewEn: null, officialWebsite: null, imageUrl: null, imageAltAr: null, imageAltEn: null, seoTitleAr: null, seoDescriptionAr: null, featured: false, status: "DRAFT", publishedAt: null, ...dates };
