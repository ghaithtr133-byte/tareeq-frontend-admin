# Applications & Inquiries Phase 1 implementation report

Date: 2026-11-04 (Asia/Amman). Target: ADMIN. Repository: `tareeq-frontend-admin`.

## Result

Frontend implementation and isolated API/browser verification: **PASS**. Live Applications/Inquiries list/detail GET acceptance through the approved local proxy: **PASS for ADMIN and SUPER_ADMIN**. Production content mutation verification: **NOT PERFORMED / NOT AUTHORIZED**. See the live continuation below for the exact evidence and scope.

The authoritative source is the user-supplied `C:/Users/CMerna/Downloads/tareeq-academy-api.json`, SHA-256 `ED9261CB9E3E3DF085E9BE2C4642FA555F22FDCB6DC1A1BAEF697FBCCD5656C2`. It resolves the earlier missing Task #5 contract. The live evidence below verifies the four GET operations and sampled documented query behavior against the deployed Backend; it does not verify production content mutations.

## Implementation and API coverage

| Operation (base `/api/v1`) | API mapping | Frontend consumer | Verification |
| --- | --- | --- | --- |
| GET `/admin/applications` | `submissionApi.list("applications", params)` | `useSubmissionList`, applications list | CONTRACT / AUTOMATED / LIVE PASS for both roles |
| GET `/admin/applications/{id}` | `submissionApi.get("applications", id)` | `useSubmissionDetail`, application detail | CONTRACT / AUTOMATED / LIVE PASS for both roles |
| PATCH `/admin/applications/{id}/status` | `submissionApi.update("applications", id, input)` | `useSubmissionMutation`, workflow editor | CONTRACT / MOCKED BROWSER PASS; production NOT PERFORMED |
| GET `/admin/inquiries` | `submissionApi.list("inquiries", params)` | `useSubmissionList`, inquiries list | CONTRACT / AUTOMATED / LIVE PASS for both roles |
| GET `/admin/inquiries/{id}` | `submissionApi.get("inquiries", id)` | `useSubmissionDetail`, inquiry detail | CONTRACT / AUTOMATED / LIVE PASS for both roles |
| PATCH `/admin/inquiries/{id}/status` | `submissionApi.update("inquiries", id, input)` | `useSubmissionMutation`, workflow editor | CONTRACT / MOCKED BROWSER PASS; production NOT PERFORMED |

Both lists send only page (default 1), limit (default 12, range 1–50), optional workflow status, and sort (`newest`, `oldest`, `updated`). Applications also supports `applicationType` (`UNIVERSITY_ADMISSION`, `SCHOLARSHIP_ASSISTANCE`). Changing filters resets page to 1; pagination respects server metadata and handles empty/out-of-range pages with boundary controls. Unsupported query parameters are excluded.

The models validate success envelopes, pagination, canonical UUIDs, all required nullable fields, and timestamps. Detail views show complete messages, contact information, consent/created/updated dates, and application references as UUIDs without fabricated entity labels. Arabic RTL lists use desktop tables and mobile cards. Empty, pending, forbidden, not-found, validation, server/network, and malformed-response states are handled without logging payloads.

Workflow editing supports all four documented statuses. `status` and `internalNote` are optional partial fields. Unchanged values are omitted; `""` remains an empty note; the explicit clear action sends `null`. Empty patches and notes exceeding 5000 characters are blocked. Pending updates disable the controls; failures retain edits and expose Arabic field feedback; success updates/refetches detail and invalidates only the affected resource's lists. Mutations have no automatic retry.

Query keys are centralized under `queryKeys.admin.submissions`, split by resource, list parameters, and UUID detail. API functions remain separate from hooks under `hook/queries/` and `hook/mutations/`.

The shared Axios client retains `withCredentials: true`; the approved `/__dev_api` path allowlist is reused. Authentication endpoints, cookie policies, refresh protocol, and Backend security configuration are unchanged. Development mock access displays a data-free preview and sends no submission requests. All synthetic records reside under `tests/` and are absent from normal runtime imports.

## Verified defect correction

The new browser tests reproduced an existing session cleanup loop: clearing the session query during confirmed logout or terminal 401 handling repeatedly restarted `/auth/me` and refresh requests. The correction removes private queries/mutations while retaining the terminal session result; successful logout replaces cached identity with a signed-out value. The provider suppresses cached identity on session errors. Both roles now pass logout/back-navigation checks, and established-session 401 recovery performs one refresh before redirecting. A late submission mutation cannot restore private data after logout.

## Verification

| Check | Result / evidence |
| --- | --- |
| Typecheck | PASS (final recheck recorded in handoff) |
| ESLint | PASS, zero errors; one pre-existing unused `action` warning in `components/dashboard/admin-dashboard.tsx:26` |
| `npm run test` | PASS — 19/19, including existing proxy/content regressions and 7 submission/session tests |
| `npm run test:submissions:ui -- --max-failures=1` | PASS — 9/9, 56.7 seconds; real frontend providers/Axios/hooks with all API requests intercepted |
| `npm run test:ui -- --output=test-results/admin-regression` | PASS — 12/12, 1.8 minutes; existing mock dashboard/content/relationship/responsive regressions |
| Webpack production build | PASS — `NEXT_TEST_DIST_DIR=.next-phase1-build npm run build` (PowerShell environment assignment); all routes generated |
| `git diff --check` | PASS (final check recorded in handoff) |
| Actual local browser interaction | PASS with synthetic contract responses; no real cookie/session or Backend RBAC claim |
| Live authenticated GETs, both roles | PASS — completed in the live continuation below, with actual Backend responses |
| Production PATCH / student-data changes | NOT PERFORMED |

The isolated new suite runs on port 3107 with its own `.next-submissions-e2e` directory and development mock access disabled. Every API request is intercepted and other remote requests are aborted. Initial sandbox execution produced an unresponsive local listener; the same suite ran successfully outside the sandbox. Only the verified processes started by the stalled test run were stopped. Existing port 3106/test configuration and production Webpack configuration were preserved.

The first default-output build compiled and typechecked but failed with Windows `EPERM` while creating `.next/server/app/_not-found.segments/_not-found`. The successful verification used the existing `NEXT_TEST_DIST_DIR` configuration to isolate output in `.next-phase1-build`, outside the sandbox. No existing build directory was deleted and the production build script remains `next build --webpack`. Normal `next typegen` restores the generated editor references to the default `.next` directory after verification.

Browser coverage includes each module for each role; filters/pagination; nullable detail fields; no-op/5001-character validation; partial PATCH; failed-save preservation; success and note-clear payloads; logout/private-data cleanup; malformed, loading, empty, forbidden, server/network and not-found states; established-session 401 recovery. These checks use response fixtures, not real production records.

The responsive browser matrix captured 24 screenshots: both module lists and details at 350, 390, 768, 1024, 1280 and 1440 pixels. Controls and viewport bounds were asserted; the mobile applications screenshots were visually inspected. Evidence directory:

`C:/Users/CMerna/Desktop/tareeq-frontend-admin/test-results/submissions-responsive-RTL-46b2a-g-content-at-all-six-widths/`

Files follow `{applications|inquiries}-{list|detail}-{width}.png`, for example `applications-detail-390.png`. These screenshots contain synthetic test records only. No broader formal accessibility certification is claimed; browser checks exercise accessible control names, labels, disabled states, RTL and responsive bounds, and existing global keyboard-focus styling is reused.

## Files and existing work

Existing uncommitted work at task start was preserved: navigation entries in `components/layout/admin-shell.tsx`, Task #5 proxy allowlisting in `lib/admin-dev-api-proxy.ts`, proxy tests, `playwright.config.ts` port 3106 changes, generated TypeScript includes, and the two pending route/component scaffolds. The existing UI regression test and integration register were extended to match the completed modules.

Created or completed in this phase:

- `lib/api-client/submissions.ts`, `lib/api-client/query-keys.ts` — schema-derived models and resource functions; typed query keys.
- `app/admin/applications/page.tsx`, `app/admin/inquiries/page.tsx` — replace pending lists.
- `app/admin/applications/[id]/page.tsx`, `app/admin/inquiries/[id]/page.tsx` — protected UUID details.
- `components/submissions/submission-list-page.tsx`, `submission-detail-page.tsx`, `submission-ui.tsx` — shared responsive list/detail/workflow UI. The previous untracked `submission-contract-pending.tsx` scaffold was removed.
- `hook/queries/use-submission-queries.ts`, `hook/mutations/use-submission-mutation.ts` — isolated queries/mutation and targeted invalidation.
- `lib/submissions.ts` — filters, patch diff and Arabic labels/errors.
- `lib/admin-session-cache.ts`, `components/layout/admin-protected-shell.tsx`, `hook/queries/use-session-query.ts`, `hook/mutations/use-logout-mutation.ts`, `providers/admin-access-provider.tsx` — verified session cleanup correction.
- `tests/admin-submissions.test.ts`, `tests/fixtures/submissions.ts`, `tests/submissions-e2e/submissions.spec.ts`, `playwright.submissions.config.ts`, `package.json` — unit/contract/browser verification and commands.
- `tests/e2e/admin-ui.spec.ts` — adapt prior pending-contract assertion to isolated mock preview.
- `README.md`, `docs/admin-pending-integrations.md`, this report — usage, dependencies and handoff evidence.
- `tsconfig.json` — Next-generated includes for the isolated test/build directories. Transient `next-env.d.ts` references are restored to the default directory with `next typegen`.

Reused components/services: `AdminProtectedShell`, `AdminShell`, `AdminAccessProvider`, `QueryProvider`, cookie Axios client, development reverse proxy, loading/empty states, design tokens/focus styling, role navigation, and existing development controls.

No commits, pushes, pulls, merges, resets, deployments, Backend changes or production data modifications were performed.

## Remaining acceptance conditions

The schema inconsistency is limited to examples: some submission validation examples reference the public `privacyAccepted` field, and an inquiry 404 example uses an application error code/message. The implementation follows the authoritative schemas and HTTP statuses rather than those example fields/codes. No missing contract blocks frontend implementation.

The live continuation below completes list/detail GET acceptance through separate manually authenticated ADMIN and SUPER_ADMIN sessions, including actual response parsing, filters and pagination with existing records. There is no remaining record/session blocker for this GET scope. Verification of the deployed Admin website's environment is separate from this local-proxy acceptance. Production PATCH remains prohibited without separate owner authorization; prior mutation evidence is isolated/mock-based only.

Dependency ownership and historical context remain in [admin-pending-integrations.md](admin-pending-integrations.md); no new dependency register or external task was created.

## Live Backend acceptance continuation — 2026-11-04

This section supersedes the earlier missing-session status only where new evidence is explicitly recorded. Testing uses the actual Admin development application at `http://localhost:3001`, with `ADMIN_DEV_MOCK_ACCESS=disabled`, `NEXT_PUBLIC_API_BASE_URL=/__dev_api`, `ADMIN_DEV_PROXY_LOCAL_ORIGIN=http://localhost:3001`, and an isolated `.next-live-acceptance-3001` directory. The unchanged approved proxy forwards to the fixed production Backend `https://api.tareeq-academy.com/api/v1`. The public-site server occupying port 3000 was left untouched. Runtime environment values were supplied to the process; no environment file was edited.

The owner manually signed in in the exact shared browser tab used for subsequent checks. No credentials/cookie values were read or copied. The owner explicitly authorized POST only to `/auth/login`, `/auth/refresh`, and `/auth/logout`; content POST/PATCH/DELETE remain prohibited. No content mutation control was used.

| Real Backend operation | ADMIN | SUPER_ADMIN |
| --- | --- | --- |
| GET `/admin/applications` | PASS — HTTP 200, four existing records | PASS — HTTP 200, four existing records |
| GET `/admin/applications/{id}` | PASS — HTTP 200, existing list-derived UUID | PASS — HTTP 200, existing list-derived UUID |
| GET `/admin/inquiries` | PASS — HTTP 200, four existing records | PASS — HTTP 200, four existing records |
| GET `/admin/inquiries/{id}` | PASS — HTTP 200, existing list-derived UUID | PASS — HTTP 200, existing list-derived UUID |

Evidence combines actual UI navigation, read-only inspection of JSON rendered by direct browser GETs in the same authenticated cookie jar, and the local proxy's returned HTTP statuses. No request/response fixture interception is installed. Only aggregate counts, schema/type/order booleans, static UI states, and HTTP status/path templates were emitted by diagnostics. Student values, raw identifiers, messages, emails, private notes, cookie values and credentials are omitted from this report and diagnostic output. No screenshots were captured during live testing.

ADMIN checks completed:

- `/auth/login` HTTP 200, followed by authoritative `/auth/me` HTTP 200 and ADMIN role rendering. Full reload restored the authenticated application detail without another manual login. No mock controls are present.
- Actual list and detail responses have the documented success envelopes. Required response fields, nullable relationships/contact/note fields, valid UUIDs and timestamp types were checked without retaining field values. Actual application details rendered 13 fields and nullable placeholders; inquiry details rendered eight fields and a nullable placeholder. Note/status controls were present and untouched; no-op Save was disabled.
- `limit=1` produced four pages; first/second/last-page navigation and disabled boundary controls were verified. Both modules accepted `newest`, `oldest`, and `updated`; oldest/newest returned the same sample in reverse order. Real JSON `updatedAt` values were checked for descending order without printing timestamps. Status filters and both application-type choices were exercised; a documented filter combination returned an honest empty state, and populated filtered responses matched the requested status/type.
- A read-only invalid-limit request returned HTTP 400 and the standard `VALIDATION_ERROR` envelope with a `limit` field error. A read-only missing-inquiry GET returned HTTP 404; the Arabic missing-record message appeared and no note editor was rendered. The real loading state was observed during reload. These are real responses, distinct from prior mocked network/403/5xx tests.
- One bounded Inquiry GET took 10.6 seconds and exceeded the browser tool's navigation wait. It subsequently completed HTTP 200, and its real JSON response was inspected successfully. No request replay or frontend change was made for that observation.

ADMIN session acceptance is now LIVE PASS. After the documented 15-minute access lifetime elapsed naturally, a direct browser `/auth/me` GET returned HTTP 401 / `AUTHENTICATION_REQUIRED`. Returning to the application produced the real sequence `/auth/me` 401 → exactly one `/auth/refresh` 200 → `/auth/me` 200 → Inquiries list 200. The ADMIN role and list were restored. No cookie was edited or extracted to cause this condition.

The real logout POST returned HTTP 200 and the UI returned to Login. A subsequent full navigation to protected Applications produced a completed `/auth/me` 401 and one refresh 401, then redirected back to Login with no private editor, detail actions or role displayed. The session cleanup loop did not recur. Next's development request logger can also print a short-lived 200 entry for a request aborted by React Strict Mode; this is not treated as a completed successful Backend authentication response.

SUPER_ADMIN continuation completed in the same shared browser after the owner's manual sign-in:

- Live role rendering confirmed SUPER_ADMIN; development mock controls were absent. All four GET operations returned HTTP 200 through the real proxy. Each sampled detail was opened using an actual list record. Application details rendered 13 fields, inquiry details eight; nullable placeholders and unchanged/disabled Save controls were present. No workflow control was edited or submitted.
- Both real collections contained four records at the time checked. `limit=1` and next-page navigation showed page 1 then page 2 of four for both modules. Existing ADMIN first/last-boundary evidence was retained rather than repeated.
- Both modules' oldest-first ordering reversed their newest-first four-record sample. Application status/type filtering and Inquiry status filtering with `updated` sorting returned populated one-record results. Direct browser inspection of the corresponding real JSON envelopes confirmed required fields, nullable types, pagination metadata and that every returned record matched the requested filters. No personal field values were printed or saved.
- The owner's final steering explicitly limited remaining work to GET integration and retained the previously established authentication/session regression results for both roles. No further expiry waits, refresh/logout regression tests, builds, screenshots or automated suites were repeated. The existing SUPER_ADMIN session was left intact on the Inquiries UI.

**Final acceptance recommendation: READY FOR PROJECT LEAD ACCEPTANCE — Phase 1 read-only GET integration through the approved local proxy.** No remaining session/record blocker affects the four GET endpoints for either role. Positive ADMIN/SUPER_ADMIN access was verified; no claim is made about untested non-admin denial policies or the deployed Admin website's environment configuration. Production PATCH remains unverified and unauthorized, while status/note mutations retain the prior isolated test evidence. The single 10.6-second Backend latency observation above is a performance follow-up, not an unresolved mapping or authorization failure.

The earlier 19 unit/contract, nine isolated browser, and 12 mock UI regression passes remain fixture-based evidence. The entire automated suite was not rerun for this read-only acceptance continuation. Application implementation and production build configuration are unchanged; development startup regenerated only its usual Next.js type references/includes.
