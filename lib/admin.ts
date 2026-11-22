import type { AdminRole, AuthenticatedUser } from "@/lib/api-client/auth";

export const adminRoles = ["ADMIN", "SUPER_ADMIN"] as const satisfies readonly AdminRole[];

export type { AdminRole, AuthenticatedUser };

export type AuthenticatedAdmin = AuthenticatedUser;

export type AdminNavigationId =
  | "change-password"
  | "dashboard"
  | "applications"
  | "inquiries"
  | "countries"
  | "universities"
  | "academic-majors"
  | "cities"
  | "scholarships"
  | "services"
  | "articles"
  | "about"
  | "faqs"
  | "analytics"
  | "audit-log"
  | "admins"
  | "settings";

export type AdminNavigationGroup = "overview" | "content" | "submissions" | "system";

export interface AdminNavigationItem {
  id: AdminNavigationId;
  label: string;
  href: string;
  group: AdminNavigationGroup;
  description: string;
  restrictedTo?: AdminRole;
}

export const adminNavigationGroupLabels: Record<AdminNavigationGroup, string> = {
  overview: "نظرة عامة",
  content: "إدارة المحتوى",
  submissions: "الطلبات والتواصل",
  system: "الإدارة والنظام",
};

const sharedNavigation: AdminNavigationItem[] = [
  {
    id: "dashboard",
    label: "لوحة التحكم",
    href: "/admin",
    group: "overview",
    description: "الواجهة الرئيسية والوصول السريع إلى أقسام المنصة.",
  },
  {
    id: "applications",
    label: "الطلبات",
    href: "/admin/applications",
    group: "submissions",
    description: "مراجعة طلبات التقديم الطلابية ومتابعة حالاتها.",
  },
  {
    id: "inquiries",
    label: "الاستفسارات",
    href: "/admin/inquiries",
    group: "submissions",
    description: "متابعة استفسارات الزوار والرد على الطلبات الواردة.",
  },
  {
    id: "countries",
    label: "الدول",
    href: "/admin/countries",
    group: "content",
    description: "إدارة الدول الدراسية والأدلة التعريفية الخاصة بها.",
  },
  {
    id: "universities",
    label: "الجامعات",
    href: "/admin/universities",
    group: "content",
    description: "إدارة الجامعات والبرامج وشروط القبول والمعارض.",
  },
  {
    id: "academic-majors",
    label: "التخصصات الأكاديمية",
    href: "/admin/academic-majors",
    group: "content",
    description: "تصنيف وتنظيم التخصصات الدراسية المعتمدة.",
  },
  {
    id: "cities",
    label: "المدن",
    href: "/admin/cities",
    group: "content",
    description: "إدارة المدن المرتبطة بالدول والجامعات.",
  },
  {
    id: "scholarships",
    label: "المنح الدراسية",
    href: "/admin/scholarships",
    group: "content",
    description: "إدارة المنح والمواعيد النهائية والمزايا التفصيلية.",
  },
  {
    id: "services",
    label: "الخدمات",
    href: "/admin/services",
    group: "content",
    description: "تنظيم الخدمات الطلابية والباقات الإرشادية.",
  },
  {
    id: "articles",
    label: "المقالات",
    href: "/admin/articles",
    group: "content",
    description: "تحرير المقالات التعليمية وربطها بالمنح ذات الصلة.",
  },
  {
    id: "faqs",
    label: "الأسئلة الشائعة",
    href: "/admin/faqs",
    group: "content",
    description: "إدارة الأسئلة المتكررة وترتيبها حسب القسم.",
  },
];

const superAdminNavigation: AdminNavigationItem[] = [
  {
    id: "about",
    label: "من نحن",
    href: "/admin/about",
    group: "system",
    description: "تحرير ونشر صفحة التعريف بأكاديمية طريق.",
    restrictedTo: "SUPER_ADMIN",
  },
  {
    id: "settings",
    label: "إعدادات الموقع",
    href: "/admin/settings",
    group: "system",
    description: "ضبط بيانات التواصل والهوية العامة للموقع.",
    restrictedTo: "SUPER_ADMIN",
  },
  {
    id: "analytics",
    label: "التحليلات",
    href: "/admin/analytics",
    group: "system",
    description: "مؤشرات الزيارات ومسارات التفاعل المجهولة.",
    restrictedTo: "SUPER_ADMIN",
  },
  {
    id: "audit-log",
    label: "سجل التدقيق",
    href: "/admin/audit-log",
    group: "system",
    description: "متابعة سجل العمليات والتعديلات الإدارية.",
    restrictedTo: "SUPER_ADMIN",
  },
  {
    id: "admins",
    label: "إدارة المشرفين",
    href: "/admin/admins",
    group: "system",
    description: "إدارة صلاحيات وحالات حسابات الإدارة.",
    restrictedTo: "SUPER_ADMIN",
  },
];

export function navigationForRole(role: AdminRole): readonly AdminNavigationItem[] {
  return role === "SUPER_ADMIN" ? [...sharedNavigation, ...superAdminNavigation] : sharedNavigation;
}

export function getRoleLabel(role: AdminRole): string {
  return role === "SUPER_ADMIN" ? "مدير النظام" : "مشرف";
}
