import type { Faq } from "@/lib/faq-schemas";
import type { SiteSettings } from "@/lib/site-settings-schemas";
export const faqId = "f0000000-0000-4000-8000-000000000001";
export const parentIds = { COUNTRY: "f0000000-0000-4000-8000-000000000101", UNIVERSITY: "f0000000-0000-4000-8000-000000000102", SERVICE: "f0000000-0000-4000-8000-000000000103", SCHOLARSHIP: "f0000000-0000-4000-8000-000000000104" } as const;
export const faqFixture: Faq = { id: faqId, scope: "GLOBAL", parentId: null, questionAr: "سؤال محلي للاختبار فقط؟", answerAr: "إجابة محلية معزولة لا تُرسل إلى الإنتاج.", questionEn: "Local question?", answerEn: "Isolated local answer.", status: "DRAFT", displayOrder: 0, publishedAt: null, createdAt: "2026-11-05T10:00:00Z", updatedAt: "2026-11-05T10:00:00Z" };
export const settingsFixture: SiteSettings = { academyNameAr: "أكاديمية اختبار محلية", academyNameEn: "Local academy", contactEmail: "local@example.invalid", contactPhone: "+962 700 000 000", addressAr: null, addressEn: null, facebookUrl: null, instagramUrl: "https://www.instagram.com/local", linkedinUrl: null, youtubeUrl: null, updatedAt: "2026-11-05T10:00:00Z" };
