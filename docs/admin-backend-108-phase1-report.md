# Backend 108-operation integration — Phase 1: Existing Modules Contract Recovery

Date: 2026-11-07. Repository: `tareeq-frontend-admin`. **Phase 1: PARTIAL — local implementation and verification passed; authenticated production acceptance remains pending.** This is not a release verdict for the Dashboard.

**Current closure status: OPEN.** See §H for the final blocker matrix, new focused evidence, and manual acceptance checklist. Sections A–G preserve the earlier Phase 1 implementation record.

## A. Contract changes

The [published OpenAPI](https://api.tareeq-academy.com/openapi.json) returned HTTP 200 through a public GET. Its `paths` and `components.schemas` matched the supplied `tareeq-academy-api (2).json` exactly after JSON parsing. Both contain **108 operations**; the previous export contains **81**. Supplied SHA-256: `310a431d87d14a479b659149411d813775fa5ffdc60bc493e5002ddccaec9369`; published bytes SHA-256: `0724acb3dd1e262b300e7abffa0211b6ff838170702cb08659a5215a586741cf`. This verifies the published document, not migration execution or endpoint runtime behavior.

The comparison used the previous export and relevant sections of the full audit, remediation, Phase 2–4, and Vercel handoffs. For 58 existing Admin/auth and public Settings operations, the operation-level parameters, request bodies, response declarations, and security were unchanged after excluding prose/examples. The relevant changes are in referenced schemas and the new public Scholarship filter-options GET. No second 108-operation coverage inventory was produced.

Paths in the table are relative to `/api/v1`.

| Existing operation(s) | Contract evidence and decision |
| --- | --- |
| `GET/POST /admin/universities/{universityId}/programs`; `PATCH /admin/university-programs/{id}` | `UniversityProgramTuition` now directly allows object/null. Non-null records contain exact `amount` string, `currency`, `billingPeriod`, `academicYear`, `id`, `createdAt`, `updatedAt`. `AdminUniversityProgram` inherits the required `tuition` and `tuitionFees` fields from `PublicUniversityProgram`. History is a required array whose items reference the same nullable schema. The frontend retains its full order and content, uses the server-selected current value, and shows null as unavailable; it does not select a year, convert currency, or estimate. The public operation documents null when no verified schedule exists. One-year input remains unchanged and is never populated from or replaced by the history array. |
| `GET/POST /admin/universities`; `GET/PATCH /admin/universities/{id}` | `universityType` is directly `PUBLIC`/`PRIVATE`/null in response and create/PATCH. `cityId` was already nullable; country UUID and legacy city text remain separate. The edit option “غير محدد” emits null only on change; unrelated PATCH omits both IDs and type. The existing editor supports added `logoUrl`, `logoAltAr`, `logoAltEn`: request fields are optional **non-null** strings, although responses are nullable, so blank logo inputs do not invent null clearing. Main image/upload behavior unchanged. |
| `GET/POST /admin/universities/{universityId}/admission-requirements`; `PATCH /admin/university-admission-requirements/{id}` | Required response `studyLevel` is a documented enum or null. Create permits nullable `studyLevel` with default null. `UNIVERSITY`: null level and no program; `STUDY_LEVEL`: valid level and no program; `PROGRAM`: null level and selected University program UUID. Existing scoped program selector and publication prerequisite (HTTPS source, non-future verification) retained. PATCH still excludes `scope`, `studyLevel`, and `programId`; null clearing applies only to fields present in the update schema. |
| `GET/POST /admin/universities/{universityId}/gallery`; `PATCH/DELETE /admin/university-gallery/{id}`; `PATCH /admin/universities/{universityId}/gallery/order` | Methods, schemas, status filters, pagination, and attachment/edit/detach semantics remain compatible. Reorder still requires the complete non-archived set and caps `orderedIds` at 100; no partial reorder or asset deletion. Missing/unusable or failed image URLs now show an explicit fallback without hiding existing edit/detach controls. No production image was changed. |
| `GET /admin/scholarships`; Scholarship create/detail/PATCH | All eight University filters unchanged: `universitySearch`, `universityCountry`, `universityMajor`, `universityStudyLevel`, `universityLanguage`, `universityCity`, `universityType`, `universityFeatured`. Slugs, enums, boolean strings and same-published-program Backend matching retained. Legacy Scholarship filters remain distinct. `GET /scholarships/filter-options` is a **public PUBLISHED-only** catalog with `{value,labelAr,count}` and nullable labels. It cannot be an exhaustive Admin selector for drafts/archived or arbitrary documented text values; no new request or restrictive dropdown was added. No Tuition Range. Deadline timezone and Country/University relationship behavior retained. |
| `GET/POST /admin/articles`; `GET/PATCH /admin/articles/{id}` | `ArticleDetail`, `ArticleCreateRequest`, `ArticlePatchRequest`, flat blocks, ordered `scholarshipIds`/legacy compatibility and max 50 unchanged. AUD-01 implementation retained: omit untouched links; explicit replacement uses the complete ordered array, `[]` clears; selection independent of lookup page. Added Country-reference `countryCode` is additive, not a changed link identifier. |
| `GET/POST /admin/faqs`; `PATCH /admin/faqs/{id}`; `PATCH /admin/faqs/order` | All five scopes, parent UUID, optional nullable translations, field lengths, publication, full scoped reorder and paging unchanged. No new compatibility edit required. |
| Existing Countries, Services and Uploads | Country response and optional request additions are `countryCode`, `overviewImageUrl`, `overviewImageAltAr`, `studyLanguageAr`, `tuitionSummaryAr`, `admissionSummaryAr`, `applicationDatesSummaryAr`. Existing editor remains compatible; it does not overwrite these fields. Study-guide authoring is deferred. The additive `countryCode` can be represented on existing country references. Services unchanged. `MediaResource` adds `about` and `marketing` for later phases; existing upload types and transport were not broadened. |
| `GET /admin/analytics/summary`; `GET /admin/analytics/journeys` | Summary response and mapping unchanged; raw rate units, charts, pagination and error states preserved. Journey steps now require nullable `ctaId` and `engagementType` from the documented enum sets. Values are validated and shown only when non-null. Existing safe path rendering remains. |
| `GET /admin/audit-logs` | `AuditResourceType` adds `ABOUT_US`, `MARKETING_PAGE_IMAGE`, `STUDENT_JOURNEY_STEP`, `COUNTRY_STUDY_GUIDE_SECTION`, `SERVICE_DETAIL_ITEM`, `SCHOLARSHIP_DETAIL_ITEM`. Existing read-only list/filter recognizes them so a new event does not invalidate the entire page. No new editor, raw metadata, or access change. |

## B. Previous Backend dependencies

| Previous blocker | Contract recovery | Frontend / local evidence | Real response and remaining gap |
| --- | --- | --- | --- |
| Tuition response `allOf` conflict | Corrected | Typed parsing, exact current/history UI, failed-save retention | Authenticated response not tested in this turn. |
| University type nullable enum | Corrected | Explicit null clearing, logo fields, valid City retained on same Country; different Country clears City | Live PATCH not performed or authorized. |
| Admission study-level nullable enum | Corrected for responses/create | Typed response, scope-correct null, immutable targets in PATCH | Live scoped writes not performed or authorized. |
| Analytics Journey nullable enums | Corrected | Required nullable enum parsing and conditional display | Authenticated live journeys not tested in this turn. |
| Analytics Summary historical 500 | No relevant schema change | Synthetic 200/500 verifies mapping and error preservation | No authenticated SUPER_ADMIN session was available for this task; current live result is unknown, not a newly observed 500 or PASS. |
| Missing/broken Gallery asset | Not a schema fix | Local missing and failed-image states are explicit | Known earlier asset was not retested or modified. |
| Gallery reorder over 100 / Program publication requirements | Cap/full-set rule unchanged; no newly documented relaxation | Existing guard, exact methods, paged full-set handling retained | More than 100 non-archived associations still require Backend clarification. Real publication/write acceptance remains pending. |
| Minor Settings annotations | No scoped change | Existing behavior preserved | Clarification remains outside this phase. |

## C. Implementation files and effects

- `lib/university-schemas.ts`, `lib/api-client/university-management.ts`, `lib/university-form.ts`: typed fee and admission records, nullable scope-specific create mapping, existing partial writes retained.
- `components/universities/university-workspace.tsx`, `components/universities/section-editor.tsx`: exact fee display and history disclosure, remove outdated contract warning, broken Gallery image fallback.
- `lib/api-client/content.ts`, `lib/content-config.ts`, `components/content/content-form-page.tsx`: nullable University type, optional logo inputs and additive country code types; same-Country selection does not clear City.
- `lib/phase4-schemas.ts`, `components/phase4/analytics-page.tsx`: nullable Journey attributes and new audit resource enum values, no privacy/authorization changes.
- `tests/backend108-contract.test.ts`, `tests/audit/browser/backend108-phase1.spec.ts`: new focused tests. Existing affected expectations/fixtures updated in `tests/admin-university-management.test.ts`, `tests/admin-phase4.test.ts`, `tests/fixtures/university-management.ts`, and `tests/phase2-e2e/university-management.spec.ts`. Obsolete assertions that rejected documented null or expected a full-baseline PATCH were corrected, not skipped.

No root `api/` directory, new route, new Backend integration, or change to Axios credentials, session/refresh, CSRF, role boundaries, cache-isolation guards, environment files or Next.js config. `lib/api-client/` remains in place. Unfinished `design-handoff/` files were preserved untouched.

## D. Verification

Historical evidence reused only: 7/7 original audit contract, 9/9 original audit browser, 20/20 focused unit/hook, 16/16 focused browser, 9/9 targeted regressions. These are **not** today's counts.

| Newly executed check | Actual result |
| --- | --- |
| New focused contracts (`tests/backend108-contract.test.ts`) | **7/7 PASS**: fee response/write/failure; University null and unchanged-field PATCH; scope-specific Admission; Journey/audit enums; eight Scholarship parameters; Analytics 200/500. |
| Selected existing regressions | **8/8 PASS**: exact Phase 2 API methods/envelopes, one-year fee input, Admission targets/publication, Gallery ordering/pagination, Analytics mapping, Article omission/ordered update/clear/legacy/max50, deadline precision. Only named tests, not entire suites. |
| Chromium (`backend108-phase1.spec.ts`) | **4/4 PASS** in 7.2s, new local production build, all Backend traffic intercepted. Covers current/null/empty/multi-year fees, failed PATCH preserving input, City/type changes, Admission null create, missing and broken Gallery assets, nullable Journey display. One mobile-width overflow assertion; no screenshot sweep. |
| Consolidated TypeScript / focused ESLint | **PASS**. Typecheck scoped to isolated Admin source, excluding the unfinished separate design handoff. Focused lint had no output/errors. |
| Single isolated Webpack production build | **PASS**, `.next-backend108-phase1/.next`, direct approved API base and mock access disabled for the local build. Original build/config files unchanged. |
| `git diff --check` | **PASS**. |
| Live Backend | Public OpenAPI GET **200**; no authenticated production GETs or live write operations. No successful production Analytics Summary claim. |

No original full audit, full Phase 1–4 suites, authentication regression suite, or production-write checks were repeated. Synthetic fixtures only for all writes; no real credentials or private data logged. No commits, pulls, pushes, merges, resets, or deployment.

## E. Unresolved issues

- **Runtime acceptance:** verify Programs/tuition, nullable University/Admission values, Journeys, and one Analytics Summary GET when an authorized session is available. Do not retry a live 500 repeatedly. Production write tests remain separately unauthorized.
- **Backend/content:** earlier broken Gallery asset is a content issue; order beyond 100 needs a documented contract; live Analytics Summary recovery is unknown. No new frontend failure remains from the executed scoped checks.
- **Deferred/unsupported:** no fee-history deletion API, no Tuition Range, no new Marketing/About Us/Student Journey/Study Guide/Service Detail/Scholarship Detail editor; published-only facets are not Admin taxonomy.

## F. Dependencies for later phases

Use the new documented resource contracts and the existing role/proxy boundaries when those features are separately approved. New audit resource types can already appear in the read-only log, but this grants no ability to edit them. `about`/`marketing` media values and Country guide authoring were deliberately not enabled here. Keep production mutation authorization separate from local testing.

## G. Phase 1 verdict

**PARTIAL.** The identified contract recoveries are implemented and passed targeted local verification. Authenticated live behavior and the documented remaining Backend dependencies are not accepted. Phase 2 was not started.

## H. Final closure — 2026-11-07

**OPEN.** One public [OpenAPI GET](https://api.tareeq-academy.com/openapi.json) returned 200 and confirmed the scoped Summary/Gallery operations and schemas match the supplied export. This was document verification, not authenticated acceptance. No approved authenticated session was available to use for this closure; no live Summary request, retry, or production write was made.

| Item | Local Verification | Live Verification | Backend Dependency | Status |
| --- | --- | --- | --- | --- |
| Analytics Summary | Current contract and typed parser agree; new intercepted zero/empty period passed. Prior synthetic 200/500 evidence retained. | No fresh authenticated GET; previous 500 neither reproduced nor cleared. | Investigate Backend only if the single new check still fails at HTTP/schema layer. | `BLOCKED_BY_ACCESS` |
| Gallery reorder ≤100 | Complete 6- and 100-ID payloads preserve requested order; paged mixed statuses, duplicate/incomplete data, and stale 409 lock + explicit reload verified. | Production PATCH outside authorized scope (`NOT_APPLICABLE` here); no live success claimed. | None for the documented size range. | `PASS` — local scope only |
| Gallery reorder >100 | 101 active loaded across pages; existing limit message and no Save/PATCH verified. | No production mutation or production record-count claim. | Full active-set requirement conflicts with `maxItems: 100` if 101+ are reachable. Backend must document/enforce an active cap or support a complete atomic >100 request. | `BLOCKED_BY_BACKEND` |
| Remaining authenticated acceptance | Earlier contract/intercepted Phase 1 checks preserved, not rerun. | University detail, Program fees, Admission, Gallery read evidence and Analytics Journeys still pending for the updated release. | Read-only authorized session and representative existing data. Do not create records to fill a gap. | `BLOCKED_BY_ACCESS` |

### Gallery closure evidence

`loadGalleryOrder` requests all pages at `limit=100`, independently of the visible list's page/status filter. It checks the page/total, rejects incomplete or duplicate rows, removes `ARCHIVED`, then sorts by `displayOrder`. Reorder sends the exact full `orderedIds` sequence. A 409 locks movement/save and does not replay the PATCH; reopening explicitly loads the current set before another deliberate save. The existing loader and request validator both enforce the cap, so no frontend correction, truncation, batching, or new endpoint was needed. The cap is a documented limitation, not proof that any production University is oversized.

**New tests:** 6/6 focused unit/adapter checks (`tests/backend108-gallery-closure.test.ts`), 2/2 intercepted Chromium cases (`tests/audit/browser/backend108-gallery-closure.spec.ts`, 3.9s). Includes 6/100/101 active, mixed archived/active across pages, duplicate/incomplete data, server `GALLERY_ORDER_SET_MISMATCH`, explicit reload and exact reordered IDs, and a valid empty Summary period. Browser tests reused the prior `.next-backend108-phase1/.next` artifact after confirming its Gallery implementation source snapshot matched current source. No new app typecheck/lint/build or full suite was needed because application code was unchanged. No Git operations, deployment, or Phase 2 work was performed during this closure pass. Pre-existing work remains untouched.

### Manual authenticated acceptance — read-only

Use an **already authenticated, authorized** browser on the approved Admin origin. If no valid session is available, stop; do not script login or copy a cookie/token. Do not export a HAR or share headers, private response bodies, account identifiers, or sensitive screenshots. Check response details privately; report only status, UTC time, sanitized shape/counts and any allowlisted error code. Never submit editor, publication, upload or reorder actions.

**Summary — one request, no automatic retry.** In an existing `SUPER_ADMIN` tab at `https://admin.tareeq-academy.com`, open DevTools and run the following once. This uses the browser's existing cookie session without reading it and bypasses the app's automatic session recovery. Stop on 401/403/500 or a transport failure. The output contains no response body or private content.

```js
(async () => {
  const utc = new Date().toISOString();
  try {
    const response = await fetch("https://api.tareeq-academy.com/api/v1/admin/analytics/summary?granularity=day&topLimit=10", {
      method: "GET", credentials: "include", cache: "no-store", redirect: "error"
    });
    const body = await response.json().catch(() => null);
    const candidate = body?.error?.code;
    const code = typeof candidate === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(candidate) ? candidate : null;
    console.log({ utc, status: response.status, code });
  } catch { console.log({ utc, status: "transport failure" }); }
})();
```

Inspect that one response in Network (filter `analytics/summary`). Expect 200, `success:true`, `range` with UTC dates and `day`, nonnegative integer traffic counts, distinct client-reported/server-verified conversion objects, nonnegative rates in documented units, and arrays `trends`, `topPages`, `trafficSources`, `ctaEngagement`, `funnel` (empty arrays are legitimate). For populated arrays, check trend period/counters, attribution source/nullable medium and campaign, allowed CTA IDs/counts, funnel step/count/nullable rate. Check no student identity or private form fields. Do not retry a 500. Report sanitized HTTP status/code/time and pass/fail of the shape/privacy checks. UI reference: `/admin/analytics`, Summary tab; a separate UI fetch is not required to diagnose an HTTP 500.

Other checks can be done by inspecting the indicated GETs in the existing authorized Admin UI, or issuing only those GETs in the trusted tab using the same read-only approach. Do not navigate or trigger session recovery if the existing session is no longer valid. Paths below are relative to `/api/v1` on the approved Backend. Use an existing University UUID from the UI; do not include it in the handoff if it is unnecessary. For all 200s check `success:true`; distinguish an empty valid collection from access/error/malformed data.

| Role / Admin view | Exact GET | Expected evidence |
| --- | --- | --- |
| ADMIN or SUPER_ADMIN — `/admin/universities/{id}`, بيانات الجامعة | `/admin/universities/{id}` | 200. `universityType` PUBLIC/PRIVATE/null, `cityId` UUID/null with consistent relationship, logo URL/ALT nullable. Report shape/nullability only. |
| ADMIN or SUPER_ADMIN — same detail, البرامج والرسوم | `/admin/universities/{id}/programs?page=1&limit=12` | 200. `items` and `pagination`; `tuition` object/null, required `tuitionFees` array; exact decimal string, currency, billing period, academic year, ID/timestamps; order/number of entries matches display. Report whether real non-null, null, history and empty cases were available; do not invent records. |
| ADMIN or SUPER_ADMIN — same detail, متطلبات القبول | `/admin/universities/{id}/admission-requirements?page=1&limit=12` | 200. Collection and pagination; scope enum, nullable `studyLevel`/`programId`, appropriate target per scope. Report only observed scopes/nullability. |
| ADMIN or SUPER_ADMIN — same detail, معرض الصور | `/admin/universities/{id}/gallery?page=1&limit=100` (additional numbered pages only if counting full set) | 200. `items`/pagination, status, `displayOrder`, image URL metadata, archive excluded from the active count. Note inaccessible assets without attempting repair; no order PATCH. |
| SUPER_ADMIN — `/admin/analytics`, الرحلات المجهولة | `/admin/analytics/journeys?granularity=day&topLimit=10&page=1&limit=10` | 200. `range`, anonymous `items`, pagination; `steps[].ctaId` and `steps[].engagementType` exact enums/null and omitted visually when null. Report shape/count, not session IDs, paths or personal data. |

Record unavailable data or session as unverified, not PASS. Backend handoff and precise acceptance criteria: [Phase 1 Backend requests](admin-backend-108-phase1-backend-requests.md).

### Closure files

Updated this report. Added `docs/admin-backend-108-phase1-backend-requests.md`, `tests/backend108-gallery-closure.test.ts`, `tests/audit/browser/backend108-gallery-closure.spec.ts`, `tests/fixtures/gallery-closure.ts`. No application or configuration files were changed in this closure pass.
