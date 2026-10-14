export const adminRoles = ["ADMIN", "SUPER_ADMIN"] as const;

export type AdminRole = (typeof adminRoles)[number];

export interface AuthenticatedAdmin {
  id: string;
  name?: string;
  email?: string;
  role: AdminRole;
}

export type AdminNavigationId =
  | "dashboard"
  | "applications"
  | "inquiries"
  | "countries"
  | "universities"
  | "scholarships"
  | "services"
  | "articles"
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
  { id: "scholarships", label: "المنح الدراسية" },
  { id: "services", label: "الخدمات" },
  { id: "articles", label: "المقالات" },
  { id: "media", label: "الوسائط" },
];

const superAdminNavigation: AdminNavigationItem[] = [
  { id: "analytics", label: "التحليلات", restrictedTo: "SUPER_ADMIN" },
  { id: "audit-log", label: "سجل التدقيق", restrictedTo: "SUPER_ADMIN" },
  { id: "admins", label: "المشرفون", restrictedTo: "SUPER_ADMIN" },
  { id: "settings", label: "الإعدادات", restrictedTo: "SUPER_ADMIN" },
];

export function navigationForRole(role: AdminRole): readonly AdminNavigationItem[] {
  return role === "SUPER_ADMIN" ? [...sharedNavigation, ...superAdminNavigation] : sharedNavigation;
}
