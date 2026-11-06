/** Centralized query-key factory. Extend only when an approved API resource exists. */
export const queryKeys = {
  session: ["session"] as const,
  admin: {
    root: ["admin"] as const,
    privileged: {
      root: ["admin", "super-admin"] as const,
      user: (id: string) => ["admin", "super-admin", id] as const,
      summary: (id: string, params: import("@/lib/phase4-schemas").AnalyticsParams) => ["admin", "super-admin", id, "summary", params] as const,
      journeys: (id: string, params: import("@/lib/phase4-schemas").JourneyParams) => ["admin", "super-admin", id, "journeys", params] as const,
      accounts: (id: string) => ["admin", "super-admin", id, "accounts"] as const,
      accountList: (id: string, params: import("@/lib/phase4-schemas").AccountParams) => ["admin", "super-admin", id, "accounts", params] as const,
      audit: (id: string) => ["admin", "super-admin", id, "audit"] as const,
      auditList: (id: string, params: import("@/lib/phase4-schemas").AuditParams) => ["admin", "super-admin", id, "audit", params] as const,
    },
    settings: ["admin", "site-settings"] as const,
    faqs: {
      group: (group: import("@/lib/faq-schemas").FaqGroup) => ["admin", "faqs", group.scope, group.parentId ?? null] as const,
      list: (params: import("@/lib/faq-schemas").FaqListParams) => ["admin", "faqs", params.scope, params.parentId ?? null, "list", params] as const,
    },
    directory: {
      root: (kind: import("@/lib/api-client/university-management").DirectoryKind) => ["admin", "directory", kind] as const,
      list: (kind: import("@/lib/api-client/university-management").DirectoryKind, params: import("@/lib/api-client/university-management").ManagementListParams) => ["admin", "directory", kind, params] as const,
    },
    university: {
      section: (id: string, section: import("@/lib/api-client/university-management").UniversitySection) => ["admin", "university", id, section] as const,
      list: (id: string, section: import("@/lib/api-client/university-management").UniversitySection, params: import("@/lib/api-client/university-management").ManagementListParams) => ["admin", "university", id, section, params] as const,
    },
    submissions: {
      root: ["admin", "submissions"] as const,
      lists: (resource: "applications" | "inquiries") => ["admin", "submissions", resource, "list"] as const,
      list: (resource: "applications" | "inquiries", params: import("@/lib/api-client/submissions").ApplicationListParams) => ["admin", "submissions", resource, "list", params] as const,
      detail: (resource: "applications" | "inquiries", id: string) => ["admin", "submissions", resource, "detail", id] as const,
    },
    content: {
      root: ["admin", "content"] as const,
      lists: () => ["admin", "content", "list"] as const,
      list: <TResource extends string, TParams>(resource: TResource, params: TParams) => ["admin", "content", "list", resource, params] as const,
      details: () => ["admin", "content", "detail"] as const,
      detail: <TResource extends string>(resource: TResource, id: string) => ["admin", "content", "detail", resource, id] as const,
      selectors: () => ["admin", "content", "selectors"] as const,
      selector: <TResource extends string>(resource: TResource) => ["admin", "content", "selectors", resource] as const,
    },
  },
} as const;
