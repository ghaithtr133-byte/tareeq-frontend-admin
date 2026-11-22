# Tareeq Academy Admin — Design Audit Inventory

**Purpose:** a UI/UX inventory for preparing Google AI Studio prompts. This is an inspection document, not a redesign brief and not an authorization to alter contracts.

## Scope and source of truth

- The inventory covers the Admin routes implemented in `app/` as of this workspace state.
- **Implemented** below means there is a route and component/API consumer in this repository. **Planned in Linear** is intentionally not inferred: no Linear ticket data, IDs, or synchronized roadmap is present in the source tree. A missing UI is therefore *not* evidence of a planned Linear feature.
- Google AI Studio may propose layout, hierarchy, responsive behavior, accessibility presentation, and visual-system improvements. It must not invent product operations, API fields, permissions, or routes.
- Session cookies, backend validation, query keys, API clients, request shapes, and role boundaries remain implementation-owned.

## Global UI foundation

| Area | Responsible files | Preserve | UI/UX opportunities | Google AI Studio boundary |
| --- | --- | --- | --- | --- |
| Root shell and direction | `app/layout.tsx`, `app/globals.css`, `providers/query-provider.tsx`, `providers/admin-access-provider.tsx` | Arabic `dir="rtl"`, React Query state, HttpOnly-cookie session model, loading/error states | Consolidate visual tokens, hierarchy, spacing, contrast, responsive rhythm | Do not alter providers, cookies, API base URL, cache/session behavior, or localization direction |
| Protected Admin shell | `components/layout/admin-protected-shell.tsx`, `components/layout/admin-shell.tsx`, `components/layout/super-admin-boundary.tsx`, `lib/admin.ts` | Role-aware navigation, logout, mobile drawer, active state, SUPER_ADMIN gates | Sidebar information architecture, mobile navigation, user menu clarity, keyboard/focus affordances | Do not expose gated links/actions or change role checks/navigation IDs |
| Shared content controls | `components/content/*`, `components/media/image-upload.tsx`, `components/universities/controls.tsx`, `components/dashboard/states.tsx` | Form validation, explicit null clearing, image-upload flow, pagination, empty/loading/error states | Field grouping, form scanning, action hierarchy, table/card responsiveness, validation readability | Do not change field names, required/null semantics, upload resource names, save destinations, or API payloads |

## Entry, account, and home

### `/` — redirect

- **Type:** routing-only. `app/page.tsx` redirects to `/admin/login`.
- **Data/API:** none.
- **Preserve:** the redirect target.
- **UI/UX:** no page design needed.
- **Backend/new dependency:** none. **Implemented**, not a Linear-planned feature.

### `/admin/login` — Login

- **Files:** `app/admin/login/page.tsx`, `app/admin/login/login-form.tsx`, `components/ui/password-input.tsx`.
- **Type:** authentication form.
- **Data/API/hooks:** `AdminAccessProvider`; `/auth/login` then authoritative `/auth/me` through `lib/api-client/auth.ts` and `hook/mutations/use-login-mutation.ts`.
- **Preserve:** email/password validation, safe generic error messages, pending state, no browser token storage, redirect to `/admin` only after session handling; development mock choice remains development-only.
- **UI/UX opportunities:** clarify trust/help copy, improve form density and error visibility, preserve strong desktop/mobile hierarchy.
- **Do not change:** authentication flow, cookie model, endpoint paths, response/error semantics, or mock gate.
- **Backend/new dependency:** existing authentication contract; no new API should be assumed. **Implemented.**

### `/admin` — Dashboard

- **Files:** `app/admin/page.tsx`, `components/dashboard/admin-dashboard.tsx`, `components/layout/admin-protected-shell.tsx`.
- **Type:** protected dashboard / navigation hub.
- **Data/API/hooks:** current authenticated user from `AdminAccessProvider`; role-gated quick actions, not a dashboard metrics API.
- **Preserve:** ADMIN/SUPER_ADMIN visibility rule, navigation destinations, protected shell and logout behavior.
- **UI/UX opportunities:** emphasize primary workflows, improve at-a-glance prioritization and small-screen action layout.
- **Do not change:** role logic or turn static navigation into invented analytics.
- **Backend/new dependency:** session only. **Implemented.**

### `/admin/change-password` — Current-account security

- **Files:** `app/admin/change-password/page.tsx`, `components/account/change-password-form.tsx`, `lib/change-password.ts`.
- **Type:** edit form.
- **Data/API/hooks:** `useChangePasswordMutation`; `POST /auth/change-password`.
- **Preserve:** current/new password validation, protected error handling, logout/session cleanup and redirect after success; no password persistence or echoing.
- **UI/UX opportunities:** security guidance, confirmation hierarchy, accessible error treatment.
- **Do not change:** password rules, one-request behavior, cleanup logic, or endpoint.
- **Backend/new dependency:** existing auth contract. **Implemented.**

**Profile clarification:** there is no standalone `/admin/profile` route in the current product. Current-user identity and logout are part of `AdminShell`; password management is the route above. Do not create or imply a profile feature without a Linear-approved scope and backend contract.

## Reusable content routes

The following are real route instances of the generic route files `app/admin/[resource]/page.tsx`, `app/admin/[resource]/new/page.tsx`, and `app/admin/[resource]/[id]/page.tsx`. Shared rendering lives in `components/content/content-list-page.tsx` and `components/content/content-form-page.tsx`; configuration and field definitions live in `lib/content-config.ts`, `lib/content-form.ts`, and `lib/content-filters.ts`.

| Routes | Type | Core files | Data/API/hooks | Preserve operations | UI/UX opportunities | Must not change / backend dependency |
| --- | --- | --- | --- | --- | --- | --- |
| `/admin/countries` | List | `ContentListPage` | `useContentList("countries")`; `contentApi.countries` | filters, pagination, status display, create/edit links | dense-filter hierarchy, table/mobile treatment, empty/loading/error states | Preserve URL/filter names and status values. Existing content API. |
| `/admin/countries/new` | Create | `ContentFormPage` | `useCreateContent`; image upload | required fields, image and overview-image uploads, explicit save intent | grouped media fields, action prominence, helper text | Do not alter image resource/payload or validation. Existing API. |
| `/admin/countries/[id]` | Edit + related details | `ContentFormPage`, `DetailCollectionManager` | `useContentDetail`, `useUpdateContent`, content-detail hooks | changed-only PATCH, status confirmation, related details after parent exists | long-form sections and save feedback | Do not alter patch omission/null semantics or relationship operations. Existing API. |
| `/admin/universities` | List | `ContentListPage` | `useContentList("universities")` | documented filters (country, major, city, level, language, type, featured/status), pagination, edit/create | filter disclosure and result scanability | Keep documented query names/enums. Existing API. |
| `/admin/universities/new` | Create | `ContentFormPage` | selectors + `useCreateContent` | country/city compatibility, nullable `universityType`, logo/image data | progressive field grouping and relationship selection clarity | Do not change `null` clear behavior or selector validation. Existing API. |
| `/admin/universities/[id]` | Details workspace + edit | `UniversityWorkspace`, `ContentFormPage`, `section-editor.tsx` | content hooks; university-management hooks | university base edit plus programs/fees, admission requirements, gallery, full gallery reorder | workspace tabs/sections, detailed data density, gallery action clarity | Preserve all child endpoints, ordered gallery constraints, tuition history, admission scope rules. Backend Phase 2 contract is required. |
| `/admin/scholarships` | List | `ContentListPage` | `useContentList("scholarships")` | base and associated-university filters, pagination, status | advanced-filter organization and responsive result cards | Do not invent additional filters or mutate documented query meanings. Existing API. |
| `/admin/scholarships/new` | Create | `ContentFormPage` | selectors + `useCreateContent` | relationship checks, deadline precision, save-to-details intent | deadline/relationship form clarity | Preserve UTC/null/validation semantics. Existing API. |
| `/admin/scholarships/[id]` | Edit + related details | `ContentFormPage`, `DetailCollectionManager` | content and detail hooks | changed-only PATCH, image and detail collection management | progressive disclosure, save/error feedback | Preserve no-op PATCH guard and documented relationship semantics. Existing API. |
| `/admin/services` | List | `ContentListPage` | `useContentList("services")` | filters, pagination, status and navigation | scanability and filters | Do not change resource path or status lifecycle. Existing API. |
| `/admin/services/new` | Create | `ContentFormPage` | `useCreateContent`, image upload | validation, upload then explicit record save | media/action grouping | Preserve upload resource and create payload. Existing API. |
| `/admin/services/[id]` | Edit + related details | `ContentFormPage`, `DetailCollectionManager` | content/detail mutations | changed-only PATCH and child-detail management | long-form hierarchy | Preserve slug and payload semantics. Existing API. |
| `/admin/articles` | List | `ContentListPage` | `useContentList("articles")` | filters, pagination, status | editorial status readability and row actions | Do not change article filters/status values. Existing API. |
| `/admin/articles/new` | Create | `ContentFormPage`, `ArticleBlockEditor`, `ArticleScholarships` | create hook, selectors, image upload | Arabic/English block editor, ordered scholarship selection, max-50 guard | editor hierarchy, association discoverability, autosave-like visual feedback only (not behavior) | Do not flatten blocks or replace ordered association semantics. Existing API. |
| `/admin/articles/[id]` | Edit | same as article create | detail/update hooks | preserve untouched links, explicit ordered replacement/clear, publication confirmation | editorial workspace/readability | Do not alter flat block format, `scholarshipIds`, or changed-only PATCH. Existing API. |

## Directories, FAQs, submissions, and site administration

### `/admin/academic-majors` and `/admin/cities` — Directories

- **Files/type:** `components/universities/directory-page.tsx`; list and inline create/edit collection experience.
- **Data/API/hooks:** `useDirectoryList`, `useDirectoryCreate`; `directoryApi` in `lib/api-client/university-management.ts`.
- **Preserve:** UUID/slug/name validation; city-to-country relationship; pagination and confirmed responses.
- **UI/UX opportunities:** compact management toolbar, inline-editor differentiation, relationship context, empty/error state.
- **Do not change:** directory kinds, payloads, endpoint paths, or country ownership rules.
- **Backend/new dependency:** existing university-management contract. **Implemented.**

### `/admin/faqs` — FAQs

- **Files/type:** `components/faqs/faq-page.tsx`, `faq-editor.tsx`, `faq-order.tsx`, `faq-parent-selector.tsx`; grouped list/create/edit/reorder.
- **Data/API/hooks:** `useFaqList`, `useFaqOrder`, `useFaqParents`, `useFaqMutation`; `faqApi`.
- **Preserve:** scope and parent UUID, optional translations, archived exclusion, full ordered group, status lifecycle.
- **UI/UX opportunities:** clearer scope selector, parent context, reorder affordance, bilingual field grouping.
- **Do not change:** group/reorder contract, immutable parent scope, ordering payload, or enums.
- **Backend/new dependency:** existing FAQ contract. **Implemented.**

### `/admin/applications` and `/admin/applications/[id]` — Student applications

- **Files/type:** `components/submissions/submission-list-page.tsx`, `submission-detail-page.tsx`, `submission-ui.tsx`; filtered list and details/status workflow.
- **Data/API/hooks:** `useSubmissionList`, `useSubmissionDetail`, `useSubmissionMutation`; `submissionApi`.
- **Preserve:** approved filters/pagination, source details, documented status update, confirmation/error behavior.
- **UI/UX opportunities:** queue priority, filter clarity, detail timeline/readability, action-state visibility.
- **Do not change:** status enum, endpoint shape, query parameter serialization, or submitted-record data semantics.
- **Backend/new dependency:** submissions endpoints are active contract dependencies. **Implemented; do not infer additional workflow states.**

### `/admin/inquiries` and `/admin/inquiries/[id]` — General inquiries

- **Files/type/data:** same submission components/hooks/API with `resource="inquiries"`.
- **Preserve:** inquiry-specific filters, list/detail records, documented status update and pagination.
- **UI/UX opportunities:** distinguish inquiry context from applications while preserving the shared interaction model.
- **Do not change:** shared API model, resource path, status contract, or role/session behavior.
- **Backend/new dependency:** submissions endpoints are active contract dependencies. **Implemented.**

### `/admin/about` — About page

- **Files/type:** `components/about/about-page.tsx`; singleton content edit/publish form.
- **Data/API/hooks:** `useAboutQuery`, `useAboutMutation`; `aboutApi` (`GET/PATCH /admin/about`).
- **Preserve:** Arabic publication validation, fixed Hero/timestamp fields, introduction image upload, draft/published/archive behavior, retry/error states.
- **UI/UX opportunities:** editorial sections, publication state prominence, preview/media placement.
- **Do not change:** singleton payload, protected fields, publication prerequisites, or image behavior.
- **Backend/new dependency:** existing Phase 2 About contract. **Implemented.**

### `/admin/settings` — Site settings

- **Files/type:** `components/settings/site-settings-page.tsx`; configuration edit form.
- **Data/API/hooks:** `useSiteSettingsQuery`, `useSiteSettingsMutation`; public GET and SUPER_ADMIN PATCH through `siteSettingsApi`.
- **Preserve:** changed-fields-only patch, explicit `null` clearing, role-based edit state, validation/error mapping.
- **UI/UX opportunities:** grouping, destructive-clear explanation, read-only versus editable clarity.
- **Do not change:** public-read/privileged-write distinction, ten-field schema, payload omission/null rules.
- **Backend/new dependency:** existing Phase 3 settings contract. **Implemented.**

## SUPER_ADMIN-only Phase 4 routes

### `/admin/admins` — Admin accounts

- **Files/type:** `components/phase4/accounts-page.tsx`; paginated management list with inline role/activation edit.
- **Data/API/hooks:** `useManagedAccounts`, `useAccountMutation`; `phase4Api.accounts/updateAccount`.
- **Preserve:** SUPER_ADMIN route boundary, self-protection, Backend protection for final active SUPER_ADMIN, one-field mutation shape, no create/delete/search/detail route.
- **UI/UX opportunities:** account-card scanability, action confirmation, privilege-risk communication, pagination toolbar.
- **Do not change:** role guards, role enum, active-state mutation, or invent account lifecycle features.
- **Backend/new dependency:** required Phase 4 account endpoints (`/admin/users`). **Implemented.**

### `/admin/analytics` — Analytics and anonymous journeys

- **Files/type:** `components/phase4/analytics-page.tsx`, `phase4-presentation.ts`; analytics dashboard with lazy journeys list.
- **Data/API/hooks:** `useAnalyticsSummary`, `useAnalyticsJourneys`; `phase4Api.summary/journeys`.
- **Preserve:** SUPER_ADMIN boundary, exact date/filter limits, raw rates/counts, chart values, lazy journey request, nullable CTA/engagement display, pagination.
- **UI/UX opportunities:** KPI hierarchy, chart labels/legends, filters, data-empty/error education, journey detail density.
- **Do not change:** calculations, aggregation/filter request semantics, raw metric meaning, anonymous-data privacy boundaries, or add user-account attribution.
- **Backend/new dependency:** required Phase 4 analytics endpoints. **Implemented.**

### `/admin/audit-log` — Audit logs

- **Files/type:** `components/phase4/audit-page.tsx`; filterable paginated audit-feed details.
- **Data/API/hooks:** `useAuditLogs`; `phase4Api.audit`; `safeAuditMetadata` presentation allowlist.
- **Preserve:** SUPER_ADMIN boundary, filters, UTC conversion behavior, pagination, metadata allowlist and suppression of unsafe fields.
- **UI/UX opportunities:** filter clarity, action chronology, metadata legibility, privacy cues, responsive record layout.
- **Do not change:** audit-record schema, metadata safety filter, identifiers, action validation, or create/edit/delete audit-log operations.
- **Backend/new dependency:** required Phase 4 audit endpoint. **Implemented.**

## What is actually implemented vs. Linear planning

| Classification | Evidence / guidance |
| --- | --- |
| Implemented now | Every route listed above has an `app/` entry and a component/API consumer. Analytics and Audit Logs are real routes, not disabled placeholders. |
| Not an implemented standalone feature | A profile route, media-library route, account creation/deletion, account search, arbitrary analytics metrics, and audit-log mutation. Do not add them because a design suggests them. |
| Linear-planned | No authoritative Linear data is available in this repository. Do not label any of the missing features as “planned” in Google AI Studio prompts; obtain approved Linear scope first. |

## Prompt guardrails for Google AI Studio

1. Redesign visual structure only: retain each route, route parameter, role boundary, form field, API-hook dependency, payload shape, and operation listed above.
2. Keep Arabic RTL as the primary layout direction and keep responsive/mobile navigation and sticky form actions accessible.
3. Preserve all loading, empty, forbidden, validation, conflict, network-error, confirmation, and pending states; redesign their presentation rather than removing them.
4. Treat `lib/api-client/`, `hook/`, `providers/`, `app/%5F_dev_api/`, schemas, and authorization/session code as read-only functional infrastructure unless a separately approved engineering task says otherwise.
5. Do not use real credentials, production records, access tokens, `.env` files, backend exports, or test/audit artifacts in a design prompt.
