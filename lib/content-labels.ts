import type {
  AdmissionScope,
  BillingPeriod,
  DurationUnit,
  ProgramStudyLevel,
  TeachingLanguage,
  UniversityType,
} from "@/lib/university-schemas-types";
import type {
  auditResourceTypes,
  ctaIds,
  eventTypes,
  granularities,
  managedRoles,
} from "@/lib/phase4-schemas";

export const programStudyLevelLabels: Record<ProgramStudyLevel, string> = {
  FOUNDATION: "سنة تحضيرية",
  DIPLOMA: "دبلوم",
  BACHELORS: "بكالوريوس",
  MASTERS: "ماجستير",
  PHD: "دكتوراه",
};

export const teachingLanguageLabels: Record<string, string> = {
  ARABIC: "العربية",
  ENGLISH: "الإنجليزية",
  FRENCH: "الفرنسية",
  GERMAN: "الألمانية",
  TURKISH: "التركية",
  ROMANIAN: "الرومانية",
  RUSSIAN: "الروسية",
  SPANISH: "الإسبانية",
  ITALIAN: "الإيطالية",
};

export const universityTypeLabels: Record<UniversityType, string> = {
  PUBLIC: "حكومية",
  PRIVATE: "خاصة",
};

export const admissionScopeLabels: Record<AdmissionScope, string> = {
  UNIVERSITY: "على مستوى الجامعة",
  STUDY_LEVEL: "حسب المستوى الدراسي",
  PROGRAM: "لبرنامج محدد",
};

export const billingPeriodLabels: Record<BillingPeriod, string> = {
  YEAR: "سنويًا",
  SEMESTER: "لكل فصل دراسي",
  FULL_PROGRAM: "لكامل البرنامج",
};

export const durationUnitLabels: Record<DurationUnit, string> = {
  MONTHS: "أشهر",
  YEARS: "سنوات",
};

export const defaultScholarshipStudyLevels: readonly string[] = [
  "بكالوريوس",
  "ماجستير",
  "دكتوراه",
  "دبلوم",
  "سنة تحضيرية",
  "زمالة بحثية",
  "جميع المستويات",
];

export const defaultScholarshipFundingTypes: readonly string[] = [
  "تمويل كامل",
  "تمويل جزئي",
  "إعفاء من الرسوم الدراسية",
  "منحة شهرية",
  "تمويل بحثي",
];

export function studyLevelLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return (programStudyLevelLabels as Record<string, string>)[value] ?? value;
}

export function teachingLanguageLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return (teachingLanguageLabels as Record<string, string>)[value] ?? value;
}

export function universityTypeLabel(value: string | null | undefined): string {
  if (!value) return "غير محدد";
  return (universityTypeLabels as Record<string, string>)[value] ?? value;
}

export const granularityLabels: Record<(typeof granularities)[number], string> = {
  day: "يومي",
  week: "أسبوعي",
  month: "شهري",
};

export const managedRoleLabels: Record<(typeof managedRoles)[number], string> = {
  ADMIN: "مشرف (ADMIN)",
  SUPER_ADMIN: "مشرف عام (SUPER_ADMIN)",
};

export const auditResourceTypeLabels: Record<(typeof auditResourceTypes)[number], string> = {
  COUNTRY: "دولة",
  UNIVERSITY: "جامعة",
  SCHOLARSHIP: "منحة دراسية",
  SERVICE: "خدمة",
  ARTICLE: "مقال",
  STUDENT_APPLICATION: "طلب تقديم",
  GENERAL_INQUIRY: "استفسار عام",
  ADMIN_USER: "حساب مشرف",
  SITE_SETTINGS: "إعدادات الموقع",
  FAQ_ENTRY: "سؤال شائع",
  UNIVERSITY_PROGRAM: "برنامج جامعي",
  ACADEMIC_MAJOR: "تخصص أكاديمي",
  CITY: "مدينة",
  UNIVERSITY_ADMISSION_REQUIREMENT: "متطلب قبول جامعي",
  UNIVERSITY_GALLERY_IMAGE: "صورة معرض جامعة",
  ABOUT_US: "صفحة من نحن",
  MARKETING_PAGE_IMAGE: "صورة صفحة تسويقية",
  STUDENT_JOURNEY_STEP: "خطوة رحلة الطالب",
  COUNTRY_STUDY_GUIDE_SECTION: "قسم دليل الدراسة",
  SERVICE_DETAIL_ITEM: "عنصر تفاصيل خدمة",
  SCHOLARSHIP_DETAIL_ITEM: "عنصر تفاصيل منحة",
};

export function auditResourceLabel(value: string): string {
  return (auditResourceTypeLabels as Record<string, string>)[value] ?? value;
}

export function auditActionLabel(action: string): string {
  if (action.endsWith(".status_changed")) return "تغيير الحالة";
  if (action.endsWith(".created")) return "إنشاء سجل";
  if (action.endsWith(".updated")) return "تحديث بيانات";
  if (action.endsWith(".role_changed")) return "تغيير الدور الإداري";
  if (action.endsWith(".reordered")) return "إعادة ترتيب";
  if (action.endsWith(".activated")) return "تفعيل حساب";
  if (action.endsWith(".deactivated")) return "إلغاء تفعيل حساب";
  if (action.endsWith(".deleted")) return "حذف سجل";
  if (action.endsWith(".login")) return "تسجيل دخول";
  return "إجراء إداري";
}

export const eventTypeLabels: Record<(typeof eventTypes)[number], string> = {
  PAGE_VIEW: "مشاهدة صفحة",
  CTA_CLICK: "نقرة دعوة للإجراء",
  ENGAGEMENT: "تفاعل داخل الصفحة",
  APPLICATION_SUBMITTED: "إرسال طلب (متصفح)",
  INQUIRY_SUBMITTED: "إرسال استفسار (متصفح)",
};

export const ctaIdLabels: Record<(typeof ctaIds)[number], string> = {
  APPLY_NOW: "قدّم الآن",
  REQUEST_CONSULTATION: "اطلب استشارة",
  CONTACT_US: "تواصل معنا",
  VIEW_UNIVERSITY: "عرض جامعة",
  VIEW_SCHOLARSHIP: "عرض منحة",
  VIEW_SERVICE: "عرض خدمة",
};

