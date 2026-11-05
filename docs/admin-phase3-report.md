# Phase 3 — FAQs and Site Settings handoff

Date: 2026-11-05. Target: `tareeq-frontend-admin`. Status: **READY_FOR_REVIEW — frontend implementation complete; production mutation acceptance remains unauthorized and unverified.**

Authority: the Project Owner's supplied Phase 3 implementation request and the existing repository working agreement. This report does not claim a separate Project Lead approval or final production acceptance. Contracts were extracted from the supplied `tareeq-academy-api.json`; the specification was not modified.

## A. Implementation matrix

| Capability | Status | Implementation / evidence |
| --- | --- | --- |
| FAQ list | DONE | `/admin/faqs` page, server page/limit/status filters within one scope/parent, Arabic/English text, publication badges, display order, loading/empty/403/error/retry states. Live GLOBAL baseline GET returned200 and7 records. |
| FAQ create/edit | DONE | Required Arabic fields; optional nullable translations; exact limits; Zod + React Hook Form; field-level400 feedback; failed-save preservation; partial PATCH; explicit null clearing; duplicate-submit guard; confirmation for publication/archive. Mutations verified only with intercepted responses. |
| Scoped FAQs | DONE | GLOBAL, COUNTRY, UNIVERSITY, SERVICE, SCHOLARSHIP only. Parent selection uses the corresponding existing content API/query, server pagination and supported parent search. Changing scope clears parent. Group controls lock while editing/ordering; target is immutable in PATCH. |
| FAQ publication/order | DONE | DRAFT/PUBLISHED/ARCHIVED; archive replaces unsupported deletion. Separate reorder reads **all** pages without status filtering, validates group/parent membership and completeness, excludes archived entries, and submits every active ID. Accessible up/down controls;409 preserves local order, locks resubmission and requires explicit close/reload. No mutation retries or artificial order cap. |
| Site Settings GET | DONE | Actual documented **public** `GET /site-settings`, not invented `GET /admin/site-settings`. Both roles may read. Strict response mapping for ten nullable fields + updatedAt; uninitialized/null settings supported. Live200 initialized the ten-field UI without a mapping error. |
| SUPER_ADMIN Settings PATCH | DONE | Only ten allowlisted fields; partial updates omit untouched fields and updatedAt. Explicit clear sends null; blank string is not silently converted. Success resets the baseline from the returned record and invalidates only settings.400/401/403 failures preserve edits and never show success. Mutation evidence is mocked only. |
| Role-based controls | DONE | Existing `/auth/me`-derived role and protected shell reused unchanged. Settings appears in shared navigation because GET is public. ADMIN sees a read-only view with no editor/save inputs; SUPER_ADMIN gets editing controls. Mutation hook independently rejects non-SUPER_ADMIN; Backend authorization remains authoritative. |
| Development proxy | DONE | Exact FAQ collection/PATCH/order, public settings GET and protected settings PATCH allowlists. No FAQ DELETE/detail GET or admin settings GET. Fixed upstream, production exclusion, cookie/CSRF/trusted-origin rules unchanged for protected requests. Public settings forwards only Accept, never Admin Cookie/Authorization/CSRF headers. |

## B. API matrix

All upstream paths below are relative to `https://api.tareeq-academy.com/api/v1`; development uses the existing `/__dev_api` prefix. Protected calls use the existing Axios client with `withCredentials:true` and HttpOnly sessions. Settings public GET overrides `withCredentials:false`; the local proxy additionally strips credentials because same-origin XHR can still send cookies to localhost.

| Method / endpoint | Role | Exact request | Response data inside `{success:true,data:…}` | Implementation / verification |
| --- | --- | --- | --- | --- |
| GET `/admin/faqs` | ADMIN / SUPER_ADMIN | Required scope; optional parentId UUID/null; page≥1 default1; limit1–100 default50; optional publication status | AdminFaqListResponse: items of AdminFaqEntry + pagination page/limit/total/totalPages | DONE; contract/browser mocked; **LIVE PASS baseline GLOBAL page1/limit50,200,7 records** |
| POST `/admin/faqs` | ADMIN / SUPER_ADMIN | FaqCreateRequest: scope, questionAr, answerAr required; parentId, questionEn, answerEn, status optional | AdminFaqResponse,201 | DONE; contract/intercepted-browser PASS; no production POST |
| PATCH `/admin/faqs/{id}` | ADMIN / SUPER_ADMIN | UUID id; FaqUpdateRequest allows only questionAr, answerAr, questionEn, answerEn, status | AdminFaqResponse,200 | DONE; partial update/null/archive tests PASS; no production PATCH |
| PATCH `/admin/faqs/order` | ADMIN / SUPER_ADMIN | FaqReorderRequest: scope and nonempty orderedIds UUID array; optional parentId; full non-archived set for one group | FaqOrderResponse `{items:AdminFaqEntry[]}`,200 | DONE; complete-set/group/409/browser recovery PASS; no production order write |
| GET `/site-settings` | Public; protected Admin UI allows both roles to view | No parameters/body; no upstream Admin credentials | SiteSettingsResponse,200 | DONE; mocked mapping/ADMIN read-only tests; **LIVE PASS GET200 and ten-field initialization** |
| PATCH `/admin/site-settings` | SUPER_ADMIN only | SiteSettingsUpdateRequest, partial allowlisted nullable fields, nonempty update | SiteSettingsResponse,200 | DONE; mocked SUPER_ADMIN save/ADMIN denial/400/401/403/null preservation PASS; no production PATCH |

### Exact field and behavior coverage

- **FAQ scopes:** GLOBAL accepts absent/null parent only; other scopes require the selected resource UUID. No arbitrary UUID text entry. COUNTRY→countries, UNIVERSITY→universities, SERVICE→services, SCHOLARSHIP→scholarships. Parent options are paginated; a selection outside the current page remains available. Services have no documented text search, so none is sent. Scoped FAQ response rows are rejected if they belong to another scope/parent.
- **FAQ fields:** questionAr2–500 and answerAr2–10000 required. Optional questionEn/answerEn are nullable with the same respective limits. Blank optional translations on create are omitted; an existing translation cannot be silently cleared to null by erasing text. Explicit clear controls emit null. Unchanged edit fields are omitted, empty patches rejected. Scope, parentId, displayOrder and timestamps never enter update payloads. New entries append according to Backend behavior; there is no undocumented displayOrder input, FAQ GET-by-ID, DELETE, or standalone publication endpoint.
- **FAQ response:** id, scope, parentId, bilingual question/answer, status, displayOrder, nullable publishedAt, createdAt, updatedAt. Dates, UUIDs and publication enums are validated. Public-answer bodies are neither copied into logs nor audit metadata by this frontend.
- **FAQ order:** all pages at limit100 are read without status filtering. Pagination totals, expected page, duplicate IDs and scope/parent identity are checked before exposing a complete active set. Order is displayOrder then id. No maxItems exists in FaqReorderRequest, so the Gallery's unrelated100-item write cap is not reused. Atomic stale-set rejection remains Backend-owned; a409 is not retried or silently replaced by a new order.
- **Settings fields:** academyNameAr/academyNameEn1–200; contactEmail≤254; contactPhone7–25 and `^\+?[0-9][0-9 ()-]{5,23}[0-9]$`; addressAr/addressEn1–1000; facebookUrl/instagramUrl/linkedinUrl/youtubeUrl URI≤2048. All ten accept explicit null; updatedAt is response-only. No arbitrary keys, environment variables, secrets, credentials, logos or upload fields are exposed.
- **Settings semantics:** only changed values are sent. An explicit clear produces null; deleting input text remains a string rather than becoming null. All-null responses are supported. Already-null clear and unchanged forms produce no update. Nonempty email input is format-checked; the exact PATCH schema itself only specifies string/max254 for contactEmail, whereas the response specifies email format. Tests preserve that distinction, including the PATCH schema's empty-string case.
- **Errors:** standard `{success:false,error:{code,message,details}}`, with field feedback only from `error.details.fields`. FAQ400/401/403, update404, JSON415 and order409 (`FAQ_ORDER_SET_MISMATCH`) are preserved; settings400/401/403/415 remain distinguishable. Cancellation keeps its original cause; failed writes have retry:false and are never replayed. A public GET failure is not treated as proof that the Admin session expired. Protected401 uses the unchanged session recovery reporting path.
- **Caching:** centralized typed keys distinguish FAQ scope/parent/list/order and settings. Successful FAQ actions invalidate only that group; settings updates invalidate only settings. Focused tests confirm unrelated FAQ groups and Phase1 query keys are untouched. No late mutation response is inserted into private query caches.

## C. Verification results

| Check | Actual result |
| --- | --- |
| Final `npm run typecheck` | PASS, exit0 |
| Final `npm run lint` | PASS, exit0, zero errors; one pre-existing unused `action` warning in `components/dashboard/admin-dashboard.tsx:26`, left unchanged |
| `npm run test:phase3` | PASS,9/9 focused unit/contract tests |
| `npm run test:phase3:ui` |7 distinct scenarios PASS after targeted corrections; no remaining failures/blocked scenarios. Initial run4 passed/3 label-lookup failures; explicit select labels corrected; only those3 rerun,3/3 passed. |
| Responsive / RTL | Actual Chromium DOM overflow checks at350/768/1440 for FAQ create/editor and both read-only/editable settings views; no horizontal document overflow, html dir=rtl. Native labels/buttons/disabled controls used; no full accessibility audit claimed. |
| Isolated Webpack production build | PASS, one `NEXT_TEST_DIST_DIR=.next-phase3-build` / `ADMIN_DEV_MOCK_ACCESS=disabled` `npm run build`; compile, TypeScript,11 static pages and traces completed successfully |
| `git diff --check` | PASS, exit0; only Git LF→CRLF notices, no whitespace defects |
| Real production FAQ GET | PASS baseline only: browser UI + matching proxy log, `GET /__dev_api/admin/faqs?scope=GLOBAL&page=1&limit=50`200;7 rows, page1/1, no mapping-error UI, existing SUPER_ADMIN session |
| Real production Settings GET | PASS: matching proxy log `GET /__dev_api/site-settings`200; all ten editor fields initialized blank, untouched Save disabled, no mapping-error UI. Actual contact values were not captured. Blank DOM values are not asserted to prove every response property was null. |
| Real production mutations | NOT EXECUTED / NOT AUTHORIZED; every write test used intercepted local responses |

The live checks reused the original shared browser/session and did not request credentials or perform authentication tests. Existing application lifecycle/Fast Refresh emitted background session traffic; that is not new login/refresh/logout acceptance. No save, clear, FAQ create/update/order/publication/archive or upload action was performed against production. Live tests did not survey scoped parents, FAQ filters/paging beyond the baseline, or actual ADMIN settings behavior; those retain isolated contract/browser evidence only.

### Focused test coverage

Unit/contract tests cover six methods/URLs/envelopes, public-vs-protected credential configuration, all five scope combinations and required UUIDs, unsupported parameters/immutable fields, bilingual min/max/null/omission semantics, complete ordering beyond100 fetched records with stale/cross-parent rejection, ten-field settings mapping/all-null initialization/partial clears, errors/status/cause/cancellation/no replay, narrow proxy gates/trusted origin/production exclusion/public credential stripping, and targeted cache invalidation.

Browser scenarios cover FAQ paging/status/empty/403; create validation and failed400 preservation/partial translation clear/archive; all four resource parent selectors and scoped creates using ADMIN; complete order independent of a visible filter with stale409 recovery; ADMIN settings read-only and public GET403 handling; SUPER_ADMIN partial save/explicit null/400/403 preservation; and all-null settings input validation/401 without false success. API and external-origin requests are intercepted or blocked before the production proxy; fixture identities are synthetic and have no passwords.

## D. Backend dependencies / unsupported behavior

**No new blocking Backend contract inconsistency was found for Phase3.** Existing earlier-phase dependencies are unchanged and not duplicated or investigated here.

Non-blocking clarification: the settings400 example mentions an HTTPS Facebook-specific rule, but the request schema models social fields only as URI/max2048, without a platform-host allowlist. The frontend validates the documented URI constraints and displays Backend field errors; it does not invent accepted Facebook/Instagram/LinkedIn/YouTube host variants. Similarly, contactEmail's request and response format annotations differ as noted above. Backend may clarify these constraints in a future contract update; no schema was rewritten.

FAQ scope/parent ownership and all SUPER_ADMIN write authorization remain enforced by Backend; client guards are additional UX/safety, not substitute authorization. No unsupported FAQ deletion, scope reassignment, arbitrary settings editing, or Admin settings GET was introduced. Future real mutation acceptance requires separately approved non-production data/environment or explicit Owner authorization. Baseline live GET passes do not imply production write acceptance.

## E. Files / Git status

Phase3 files created:

- `api/faqs.ts`, `api/site-settings.ts`.
- `lib/faq-schemas.ts`, `lib/faq-form.ts`, `lib/site-settings-schemas.ts`.
- `hook/queries/use-faq-queries.ts`, `hook/queries/use-site-settings-query.ts`.
- `hook/mutations/use-faq-mutation.ts`, `hook/mutations/use-site-settings-mutation.ts`.
- `components/faqs/faq-page.tsx`, `faq-editor.tsx`, `faq-parent-selector.tsx`, `faq-order.tsx`.
- `components/settings/site-settings-page.tsx`.
- `app/admin/faqs/page.tsx`, `app/admin/settings/page.tsx`.
- `tests/admin-site-management.test.ts`, `tests/fixtures/site-management.ts`, `tests/phase3-e2e/site-management.spec.ts`, `playwright.phase3.config.ts`, this report.

Shared files extended without discarding their existing local Phase2 changes: `api/query-keys.ts`, `lib/admin.ts`, `components/layout/admin-shell.tsx`, `lib/admin-dev-api-proxy.ts`, `app/%5F_dev_api/[...path]/route.ts`, `package.json`, and the integration dependency register. Next.js generated isolated-output imports/includes in `next-env.d.ts`/`tsconfig.json` during verification. No removed files, dependency upgrades or installations.

Starting and final branch: `main...origin/main`, with dirty tracked/untracked Phase2 work already present before Phase3. The entire final Git status therefore includes earlier work and must not be represented as newly authored Phase3 changes. Existing Applications/Inquiries, University/Programs/Gallery/upload implementations and their evidence were preserved. No commit, push, pull, merge, rebase, reset, deployment, Backend/database operation, production mutation or Public Website edit occurred.

## F. Efficiency

Reused existing Axios/session provider, QueryClient, protected shell/navigation, state components, status badges, RTL design tokens, content resource functions, paginated selectors, validation conventions and approved proxy boundary. No new testing framework or application library.

Intentionally did not repeat Phase1 tests, Phase2 tests/live matrices/dependency investigations, authentication login/logout/refresh suites, full Playwright suites, previous OpenAPI investigations or broad screenshots. Only new Phase3 unit/browser scenarios were run; three failed selectors received a targeted rerun. One final consolidated typecheck/lint and one isolated Webpack build. Two new live baseline GET checks only; no live write verification.
