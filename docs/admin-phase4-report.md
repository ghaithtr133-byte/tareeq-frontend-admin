# Phase 4 — Analytics, Admin Accounts and Audit Logs

Date: 2026-11-05. Repository: `ghaithtr133-byte/tareeq-frontend-admin`.

**READY_FOR_REVIEW for the implemented frontend. Overall acceptance is PARTIAL:** live Analytics summary returned500, and two journey-step enum fields require a corrected Backend schema. Production account mutations remain unauthorized and unverified.

Scope authority: the Project Owner's supplied Phase4 implementation request, subject to the existing working agreement. No separate Project Lead approval or production acceptance is asserted. Contracts came from the supplied `tareeq-academy-api.json`; no Backend/specification edits were made.

## A. Feature matrix

| Feature | Status | Delivered / boundary |
| --- | --- | --- |
| Analytics KPIs | DONE frontend; live data BLOCKED | Exact traffic totals, separate client-reported/server-verified conversions, raw Backend rates, period context, loading/error states. Intercepted tests pass; real summary request returned500 and rendered an error, not fixture numbers. |
| Analytics filters/charts | PARTIAL | UTC dates/inclusive366-day bound, day/week/month, topLimit, seven trend metrics, native SVG chart + accessible data table, top pages/sources/CTA/funnel breakdowns. Empty series stay empty. Journey GET/paging/core fields implemented; two disputed step attributes are opaque and not rendered. |
| Admin account list | DONE | `/admin/admins`; exact five safe account fields, page/limit, responsive cards. No unsupported search/filter/detail/create/invitation/delete/password controls. Live GET200 returned2 accounts. |
| Role changes | DONE frontend | ADMIN/SUPER_ADMIN only; one-field PATCH; explicit confirmation, unchanged/duplicate guards, failed-choice preservation, field feedback and409 handling. Current user's self-demotion is not offered. Mutations are locally intercepted only. |
| Active-status management | DONE frontend | Explicit activation/deactivation confirmation; authoritative response updates; no optimistic success;400/401/403/409 preservation; self-deactivation control disabled. Last-active-SUPER_ADMIN invariant remains Backend-owned, not inferred from a partial list. No live account change. |
| Audit Logs | DONE | `/admin/audit-log`; newest-first API paging, actor/action/resource/date filters, UTC dates, safe metadata disclosures, empty/error states, no edit/delete/export/debug controls. Live GET200 returned1 record with extra metadata redacted. |
| SUPER_ADMIN routing/access | DONE | Existing role-aware navigation enabled; page gate, hook/transport guards, per-user keys, pre/post-request session checks, restricted cache cleanup and late-response protection. ADMIN browser scenarios send no restricted requests; simulated role loss hides already-loaded data. No auth architecture replacement. |
| Development proxy | DONE | Exactly four new GET shapes and UUID account PATCH; trusted origin/cookies/CSRF/fixed upstream/production exclusion preserved. No public analytics-event POST or general user/admin proxy added. |

## B. API matrix

Upstream base: `https://api.tareeq-academy.com/api/v1`; existing browser base/proxy: `/__dev_api`. All five operations require **SUPER_ADMIN** and use existing Axios HttpOnly cookies with `withCredentials:true`.

| Operation | Request contract | Response contract | Implementation | Verification |
| --- | --- | --- | --- | --- |
| GET `/admin/analytics/summary` | from/to optional UTC YYYY-MM-DD, inclusive range≤366days; granularity day/week/month defaultday; topLimit1–25 default10 | AnalyticsSummaryResponse: range,totals,topPages,trafficSources,ctaEngagement,clientReportedConversions,serverVerifiedConversions,conversionRates,funnel,trends | `lib/api-client/phase4.ts`, `useAnalyticsSummary`, `components/phase4/analytics-page.tsx` | CONTRACT/MOCK PASS; **LIVE FAIL HTTP500**, error UI PASS |
| GET `/admin/analytics/journeys` | Same report query + page≥1 default1,limit1–20 default10; Backend latest-event ordering | AnalyticsJourneyResponse: range,items,pagination; each anonymous session has times/count/truncation/conversion flags/steps | `phase4Api.journeys`, `useAnalyticsJourneys`, lazy Journeys view | MOCK PASS/core mapping; **LIVE PASS200/core fields,2 sessions**; ctaId/engagementType formal validation excluded |
| GET `/admin/users` | page≥1 default1,limit1–50 default20; no documented search/filter/sort | ManagedAdminAccountListResponse, safe id/name/email/role/isActive + pagination | `phase4Api.accounts`, `useManagedAccounts`, `accounts-page.tsx` | CONTRACT/MOCK PASS; **LIVE PASS200,2 accounts** |
| PATCH `/admin/users/{id}` | UUID id; AdminAccountUpdateRequest: **exactly one** `{role:ADMIN\|SUPER_ADMIN}` OR `{isActive:boolean}`; no extra keys | ManagedAdminAccountResponse, same five safe fields | `phase4Api.updateAccount`, `useAccountMutation`, confirmed account form/buttons | CONTRACT/MOCK PASS; **NO LIVE MUTATION** |
| GET `/admin/audit-logs` | page≥1 default1,limit1–100 default20; optional actorId UUID; exact action3–100 matching `^[a-z][a-z0-9]*(?:[._][a-z0-9]+)+$`; documented resourceType; inclusive ISO date-time from/to | AdminAuditLogListResponse: id,actorAdminId,action,resourceType,resourceId,metadata,createdAt,actor{id,name},pagination | `phase4Api.audit`, `useAuditLogs`, `audit-page.tsx` | CONTRACT/MOCK PASS; **LIVE PASS200,1 record** |

Success envelope stays `{success:true,data:…}`; failures preserve HTTP status, original cause and documented `error.details.fields`. Common400/401/403, account404/409/415 and network/cancellation are not converted to empty collections. Backend409 can reject self-deactivation, self-demotion, removal of the last active SUPER_ADMIN, or a no-op. No unlisted error-code vocabulary or extra business constraint was invented.

### Analytics field coverage and units

- Totals: pageViews,visitors,sessions. Client-reported applications/inquiries/total are explicitly distinguished from server-verified applications/inquiries/total. No inferred revenue, content totals, engagement totals, conversion baselines or unique-user identities.
- Rates: clientReportedSessionRate,applicationSessionRate,inquirySessionRate and funnel rateFromPrevious. The approved example already returns6.47 for6.47%; formatting displays the returned decimal plus percent sign, **without multiplying/dividing by100**. Null is unavailable, not zero. Required fields with malformed/null/missing values reject the response rather than inventing a replacement.
- Trends: periodStart plus pageViews,visitors,sessions,ctaClicks,clientReportedConversions,serverVerifiedApplications,serverVerifiedInquiries. Chart geometry scales coordinates only; displayed values remain the exact Backend counts. UTC dates and Backend reporting range are used; no fabricated last-updated timestamp or comparative period. Zero series remain zero; empty series have no chart/fallback points.
- Breakdown rows: top-page path/counts; traffic source/nullable medium/campaign/counts; controlled CTA id/clicks/sessions; funnel step/sessions/nullable previous rate. Tables scroll inside their container on mobile. Chart data is also available in a keyboard-accessible disclosure table.
- Journeys fetch only after the user opens that tab. Anonymous session IDs are shortened in the UI; times,eventCount,truncated,clientReportedApplication/clientReportedInquiry, step type/path/nullable targetPath/occurredAt are supported. Paths are plain safe text, not executable links or query-string identity channels. Disputed ctaId/engagementType are not interpreted or shown.

### Accounts, metadata and cache safety

- Current identity/role comes only from the existing `/auth/me` session provider. Navigation, route boundary and hooks all require SUPER_ADMIN. API functions are separate from hooks under the established `hook/queries/` and `hook/mutations/` directories.
- Account responses are parsed to only id,name,email,role,isActive; password hashes, session data and arbitrary response extras are never rendered. No timestamp field was invented. Role and activation changes use separate actions, with native keyboard-accessible confirmation, pending disabled controls, and retry:false.
- Self-demotion/deactivation constraints are documented by Backend; self controls are restricted accordingly. Other-account requests remain subject to atomic Backend invariants. A page of20 is not evidence that the user is the last active SUPER_ADMIN. Failed saves retain the selected role and previous account state; a changed observed record requires reopening its editor. No record version/ETag contract was invented.
- Successful account updates use the returned safe record and invalidate only this actor's account lists and audit queries. No unrelated content, FAQ or Settings cache is broadly cleared. Query/mutation keys are user-specific under `admin/super-admin`; pre/post-request checks reject stale/errored/different-user sessions. Late completions cannot repopulate restricted cache after privilege loss. Logout still uses existing session cleanup.
- One small integration addition mounts `SuperAdminCacheGuard` in the existing protected shell, so restricted cache is removed on role loss even while an ordinary content page is visible. It only cancels/removes Phase4 queries/mutations. A403 revalidates the existing session, without inventing an auth endpoint or treating every permission error as logout.
- Audit metadata is **not an unrestricted JSON viewer**. The presentation allowlist accepts only recognized status/role enum values and boolean activation flags; unknown keys, nested objects, arbitrary arrays/free text, messages, tokens/passwords/cookies and personal values are not shown. Safe details expand in native disclosures. The original record is not rewritten; the view is a separate sanitized projection. There is no raw JSON fallback or `[object Object]` rendering.
- Supported AuditResourceType values: COUNTRY,UNIVERSITY,SCHOLARSHIP,SERVICE,ARTICLE,STUDENT_APPLICATION,GENERAL_INQUIRY,ADMIN_USER,SITE_SETTINGS,FAQ_ENTRY,UNIVERSITY_PROGRAM,ACADEMIC_MAJOR,CITY,UNIVERSITY_ADMISSION_REQUIREMENT,UNIVERSITY_GALLERY_IMAGE. No unsupported sort or event-detail API was added; Backend supplies deterministic newest-first ordering.

## C. Verification

| Check | Actual result |
| --- | --- |
| Final `npm run typecheck` | PASS, exit0 |
| Final `npm run lint` | PASS, exit0,0 errors; same pre-existing unused `action` warning in `components/dashboard/admin-dashboard.tsx:26`, left unchanged |
| `npm run test:phase4` | PASS,8/8 focused contract/unit tests |
| Targeted Playwright |7 distinct scenarios PASS; no remaining failures/blocked cases. Initial4/7 passed; three test-driver expectations were corrected (Arabic-locale digit variations and datetime fill representation); focused follow-up2/3 passed, then the single remaining empty-chart assertion was scoped to the chart rather than unrelated page imagery and passed. No full-suite rerun. |
| RTL/responsive | Actual Chromium DOM checks at350/768/1440 for Analytics charts/breakdowns, account cards/actions and Audit filters/metadata. No horizontal document overflow; html RTL. No broad screenshot/accessibility audit claimed. |
| Production build | PASS, one `NEXT_TEST_DIST_DIR=.next-phase4-build` / `ADMIN_DEV_MOCK_ACCESS=disabled` Webpack build; compile, TypeScript,14 static pages and traces completed |
| `git diff --check` | PASS, exit0; LF→CRLF notices are not whitespace defects |
| Production account PATCH | NOT EXECUTED / NOT AUTHORIZED. All role/activation tests were intercepted local responses. |

Focused unit tests cover all five URL/method/envelope mappings and credentials, date bounds/defaults/caps/unsupported filters, raw KPI/rate/zero/null/chart values, exact one-field PATCH and rejection before transport, safe metadata projection, role/session/cache isolation and late-completion rejection, status/cause/network/cancellation/no replay, and narrow proxy methods/trusted-origin/production exclusion.

Browser scenarios cover ADMIN direct-route/navigation/API denial; KPI/rate/chart/filter/empty-series behavior; lazy journey paging and opaque-field exclusion; account paging/self-protection/confirmation cancellation/role409 preservation/success; activation and deactivation with400/401/403 failures and pending duplicate prevention; Audit paging/actor/action/resource/time filters/redaction/empty state/no writes; and simulated SUPER_ADMIN loss with no subsequent restricted requests. Role changes and401 scenarios use synthetic intercepted responses, not real account/session mutations or repeated authentication acceptance suites.

### Live read-only evidence

The original shared localhost browser session was reused with mock access disabled and its existing SUPER_ADMIN role. No credentials, cookies, real account names/emails, actor identities or raw audit metadata were captured. Only sanitized counts/statuses/role enums and safe presentation indicators were read. Matching Next.js proxy logs confirm actual methods/query strings/statuses:

| Request relative to `/__dev_api` | Actual live result | Browser result |
| --- | --- | --- |
| GET `/admin/analytics/summary?granularity=day&topLimit=10` | **HTTP500** | Generic error/retry state; no fabricated KPIs or fallback chart. No manual retry. |
| GET `/admin/analytics/journeys?granularity=day&topLimit=10&page=1&limit=10` | **HTTP200**,2 sessions/page1 of1 | Core response validated,2 anonymous session cards, no summary-data substitution. Disputed fields remain excluded. |
| GET `/admin/users?page=1&limit=20` | **HTTP200**,2 records/page1 of1 | ADMIN and SUPER_ADMIN role indicators, safe account mapping and current-account protection notice. No action button was used. |
| GET `/admin/audit-logs?page=1&limit=20` | **HTTP200**,1 record/page1 of1 | One safe metadata disclosure with an extra-field redaction notice; no raw JSON/pre blocks. No values from the record were exported to this report. |

These are baseline live GET checks, not a full production filter/paging/RBAC matrix. Production ADMIN denial and account mutation safeguards are not promoted from intercepted tests to live PASS. Application lifecycle/Fast Refresh produced existing background session traffic; no login/logout/refresh test was initiated and no new credentials were requested. Prior phase GET matrices were not repeated.

## D. New Backend dependencies only

1. **Analytics summary HTTP500 — Backend owner.** The exact valid default GET above failed through the approved proxy while the other three Phase4 GETs returned200 in the same authorized session. No root-cause guess, Backend modification, artificial seed event or repeated retry was attempted. Backend must investigate and restore a200 contract-compliant summary before live KPI/breakdown/chart-data acceptance can resume. Frontend error handling is verified; live summary content is not.
2. **Journey-step nullable enum composition — Backend/API owner.** In AnalyticsJourneyResponse, `steps[].ctaId` and `steps[].engagementType` compose `allOf:[non-null enum $ref,{type:[string,null]}]`. The intersection still rejects null; PAGE_VIEW steps legitimately need absent CTA/engagement semantics. Those two fields are explicitly `unknown` in the local adapter, never rendered or fed into editable data, and excluded from formal validation claims. Core session/step fields remain implemented and tested. Publish an unambiguous nullable response definition before these attributes receive typed rendering/full-response acceptance. No supplied schema was edited or silently widened as contract evidence.

No previously tracked Phase2/3 dependency was reinvestigated or duplicated here. New production account mutation acceptance requires a separately approved non-production environment or explicit Owner authorization; this is a safety/acceptance boundary, not missing frontend functionality.

## E. Security, files and Git

No unauthorized ADMIN Phase4 requests occurred in intercepted browser tests. Existing Backend authorization remains authoritative. There are no bearer/localStorage tokens, new credentials, account creation/deletion, password-reset/revocation controls, public analytics ingestion, Backend/database edits or production mutations. Role/active changes are legitimate implemented UI functions for an approved deployment, but were never executed against real accounts during verification.

Created Phase4 files:

- `lib/api-client/phase4.ts`.
- `lib/phase4-schemas.ts`, `lib/phase4-presentation.ts`, `lib/privileged-access.ts`.
- `hook/queries/use-phase4-queries.ts`, `hook/mutations/use-account-mutation.ts`.
- `components/layout/super-admin-boundary.tsx`.
- `components/phase4/analytics-page.tsx`, `accounts-page.tsx`, `audit-page.tsx`, `query-state.tsx`.
- `app/admin/analytics/page.tsx`, `app/admin/admins/page.tsx`, `app/admin/audit-log/page.tsx`.
- `tests/admin-phase4.test.ts`, `tests/fixtures/phase4.ts`, `tests/phase4-e2e/phase4.spec.ts`, `playwright.phase4.config.ts`, this report.

Existing shared files extended: `lib/api-client/query-keys.ts`, `components/layout/admin-shell.tsx`, `components/layout/admin-protected-shell.tsx`, `lib/admin-dev-api-proxy.ts`, `package.json`, and the dependency register. Next.js generated isolated-output imports/includes in `next-env.d.ts` and `tsconfig.json` during verification. No removed files, dependency installations or upgrades.

Branch remained `main...origin/main`; the starting tree already contained tracked/untracked Phase2/3 work. That earlier work was preserved and must not be described as newly authored Phase4 changes merely because it appears in final Git status. No commit, push, pull, merge, rebase, reset, cleanup or deployment. Public Website and Backend repositories were untouched.

## F. Efficiency / handoff

Reused the existing Axios client, HttpOnly session provider, QueryClient, role navigation, shell, state cards, shared RTL controls/styles and error normalization. Charts are native SVG with data tables; no chart or other dependency was added.

Only focused Phase4 tests, minimal new live GETs, one final consolidated typecheck/lint, one isolated Webpack build and diff check were run. Phase1/2/3 suites, old auth regressions, old production matrices, old OpenAPI investigations and broad screenshots were intentionally not repeated. The initial SVG attribute typing issue was corrected to CSS direction before final verification. Test-driver-only expectation fixes received targeted reruns, not repeated old suites.

**Handoff:** review the functional frontend now; coordinate the two new Backend dependencies above. Do not declare full live Analytics or production account-mutation acceptance from the available evidence.
