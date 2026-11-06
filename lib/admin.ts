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
  | "faqs"
  | "media"
  | "analytics"
  | "audit-log"
  | "admins"
  | "settings";

export interface AdminNavigationItem {
  id: AdminNavigationId;
  label: string;
  restrictedTo?: AdminRole;
}

const sharedNavigation: AdminNavigationItem[] = [
  { id: "dashboard", label: "لوحة التحكم" },
  { id: "applications", label: "الطلبات" },
  { id: "inquiries", label: "الاستفسارات" },
  { id: "countries", label: "الدول" },
  { id: "universities", label: "الجامعات" },
  { id: "academic-majors", label: "التخصصات الأكاديمية" },
  { id: "cities", label: "المدن" },
  { id: "scholarships", label: "المنح الدراسية" },
  { id: "services", label: "الخدمات" },
  { id: "articles", label: "المقالات" },
  { id: "faqs", label: "الأسئلة الشائعة" },
  { id: "settings", label: "إعدادات الموقع" },
  { id: "media", label: "الوسائط" },
];

const superAdminNavigation: AdminNavigationItem[] = [
  { id: "analytics", label: "التحليلات", restrictedTo: "SUPER_ADMIN" },
  { id: "audit-log", label: "سجل التدقيق", restrictedTo: "SUPER_ADMIN" },
  { id: "admins", label: "إدارة المشرفين", restrictedTo: "SUPER_ADMIN" },
];

export function navigationForRole(role: AdminRole): readonly AdminNavigationItem[] {
  return role === "SUPER_ADMIN" ? [...sharedNavigation, ...superAdminNavigation] : sharedNavigation;
}
