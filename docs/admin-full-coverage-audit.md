# Full Admin Dashboard coverage and release audit

Date: 2026-11-05. Repository: `C:/Users/CMerna/Desktop/tareeq-frontend-admin`. Audit-only: no application implementation, Backend or deployment changes.

## Authorized remediation continuation — 2026-11-05

The sections below remain the **historical pre-remediation audit**, including original failures and missing capabilities; they have not been erased or relabeled. The later approved implementation is recorded in [admin-audit-remediation-report.md](admin-audit-remediation-report.md), with exact files, payload changes, tests and release dependencies.

- AUD-01–AUD-09: locally fixed. Ordered Article links and changed-only PATCH; timezone/precision-safe deadlines; dependent University clearing; Change Password; eight University filters; slug validation; explicit selector error/retry with selected-value preservation; native modal focus containment; documented safe audit statuses.
- SEC-10: the previously suspected core late-save cache race was first reproduced by a deterministic actual-hook gated-response test, then fixed with actor/session-query/generation completion guards for create/update. Late logout failures, account switch, same-account new session and normal save tested. No server cancellation guarantee claimed.
- Historical contract1 PASS/6 FAIL → **7/7 PASS**. Historical browser4 PASS/5 FAIL → **9/9 PASS**. Added **20/20 focused unit/hook tests** and **16/16 focused browser scenarios**. Combined final isolated-production Chromium run: **25 PASS,0 FAIL,0 SKIPPED/BLOCKED**. Targeted original regressions: **9/9 PASS**.
- Typecheck PASS; lint PASS with one pre-existing unused-variable warning; one isolated Webpack production build PASS; `git diff --check` PASS. Build uses the direct approved production API URL and mocks disabled; browser chunk confirmed. Production runtime dev-proxy probe404 and mock controls absent. This is a local artifact, not Vercel configuration/deployment evidence.
- No production mutations, real password changes, Backend changes, credential logging or deployment. All write tests intercepted. Existing Phase1–4 changes and original evidence preserved.
- Two browser assertions reconciled explicitly with the authorized remediation: untouched deadline omitted (original pure exact round-trip retained), and failed lookup exactly one initial attempt plus explicit retry rather than waiting for3 automatic attempts. No scenario deleted/skipped/expected-failed; see detailed rationale in the remediation report.
- Final frontend remediation **READY FOR REVIEW**; consolidated release **NOT READY**, pending the unchanged Backend issues in section6, safe authorized live-write acceptance and actual production deployment/authentication verification. Green remediation tests do not close those dependencies.

## Executive verdict — NOT READY

The Dashboard has substantial implemented, locally verified functionality across the foundation and Phases 1–4. It is **not safe to approve a consolidated release yet**. New isolated tests reproduce loss of Article scholarship associations during an unrelated edit and a shifted scholarship deadline during an unrelated save. These are frontend defects, independent of known Backend blockers.

The audit inventories **81 operations / 64 paths / 112 named schemas** from the entire supplied specification. **58 operations are Dashboard-relevant:** 46 shared ADMIN/SUPER_ADMIN content/submission operations, six SUPER_ADMIN operations, five Admin authentication operations, and one public Settings GET. The remaining 22 are Public Website-only and one is operational health. There is no separate third role or hidden internal endpoint inferred.

There are **nine confirmed findings AUD-01 through AUD-09**. One additional static cache-race risk and deployment acceptance conditions are explicitly distinguished from reproduced defects. No finding was fixed: implementation requires separate approval.

New verification: **7 unit/contract audit checks: 1 PASS, 6 FAIL**; **9 distinct Chromium audit scenarios: 4 PASS, 5 FAIL**, after correcting one test-only ambiguous heading locator. The failures deliberately remain ordinary red acceptance assertions, not skipped/expected-failure tests. Two defects overlap between unit and browser evidence; test failures must not be counted as separate defects.

New live verification: eight core list/detail operations for **SUPER_ADMIN** returned **HTTP200**, real envelopes/nullable fields and UI initialization passed; real page2 and four sampled filter combinations passed. No production content/account mutation or upload was made. Existing Phase1–4 evidence is reused with the limitations below.

## 1. Evidence inventory and applicability

The starting tree was dirty and was reviewed with `git status --short --branch`, tracked diff/stat, source inspection and the available phase reports. Previous reports are evidence, not completeness certificates. New findings below supersede earlier broad “complete” statements only for the identified workflows.

| Evidence | Last recorded result / type | Current applicability and changes considered | Not claimed |
| --- | --- | --- | --- |
| `docs/admin-submissions-phase1-report.md` | 19 combined unit/contract passes; 9 intercepted browser passes; 12 original mock UI passes; live four submission GETs for both roles, four records/collection | Submission/session implementation is still present; Phase4 added a restricted-cache guard to the shared shell, not a submission rewrite. Its behavior is corroborated by current code and Phase4 role-loss checks. Reused, not rerun. | No production workflow PATCH persistence |
| Original content verification / `tests/admin-live-contract.test.ts`, `tests/e2e/admin-ui.spec.ts`, dependency register | Four content transport/mapping tests, four proxy tests, five-resource mock CRUD/lifecycle, Article six flat block types, selectors beyond50, six viewport widths | Phase2 extended content fields/filters/uploads; Phase4 modified shared shell/nav. New focused audit checks target missed association/date/selector interactions and cross-editor uploads rather than repeating five unchanged CRUD scripts. | Original in-memory tests did not exercise current multi-scholarship contract or non-UTC unchanged deadlines |
| `docs/admin-phase2-report.md` | 10 Phase2 unit + four reused proxy tests; 9 distinct intercepted browser scenarios; subsequent seven-group live SUPER_ADMIN GET continuation | Current API/schema/form/hooks retain the documented implementation and quarantined fields. Use the later successful live continuation, not its earlier missing-session block. | Tuition response/history, null enum formal validation, positive combined published-program match, larger Admission/Gallery collections, live writes/uploads |
| `docs/admin-phase3-report.md` | 9 unit, 7 distinct intercepted browser scenarios; live GLOBAL FAQs200/7 and public Settings200 | Current scope/parent schemas, partial/null mapping, group invalidation and read-only ADMIN Settings match the report. Reused unchanged. | Full live scoped FAQ filters/order writes or production Settings PATCH |
| `docs/admin-phase4-report.md` | 8 unit, 7 distinct intercepted browser scenarios; live Journeys200/2, Accounts200/2, Audit200/1; Summary500 | Current guarded per-user privileged queries/mutations, routes and metadata projection inspected. AUD-09 catches a submission enum omitted by the prior metadata sample. | Live account PATCH, full production RBAC matrix, full Journey field validation or working live Summary |
| Phase4 final technical checks | Typecheck PASS; whole-repo ESLint PASS/one existing unused `action` warning; isolated Webpack build PASS,14 static pages; diff check PASS | Reused application build ID `baNppflRm8ve0jSnCXlVa`. No application file in api/app/components/hook/lib/providers had a modification time newer than BUILD_ID before audit execution; no application source was edited in this audit. This is corroboration, not a cryptographic reconstruction of old runs. | That test artifact is NOT a validated production deployment artifact; its browser base is /__dev_api |
| Current audit | New checks listed in §4; complete operation/schema extraction in appendices | New TypeScript audit files enter the project include set, so one current typecheck was justified; only audit files received new lint verification. | No repeated production build, old full suite, screenshot sweep or authentication cycle |

The unique prior unit files currently contain 46 tests (4 mock + 4 proxy + 4 content + 7 submissions + 10 Phase2 + 9 Phase3 + 8 Phase4). This is a source inventory and reuse of recorded passes, **not a fresh 46/46 run**. Do not sum Phase2’s14 and Phase1’s19 as disjoint suites.

There is no independently preserved before/after hash manifest from each historical phase. Consequently, historical test results are explicitly labeled reused; their coverage does not prove every current field or role permutation. Current source/API/hook/component inspection and targeted new tests resolve specific gaps rather than treating reports as proof.

## 2. Complete module functional matrix

DONE means implemented with the cited local evidence; it never means production writes are accepted. PARTIAL identifies exact frontend or Backend exclusions. No unsupported delete, detail, sort or search workflow is treated as required.

| Module | List/detail | Create/edit | Filters/sort/pagination | Status/publication/relationships | Overall |
| --- | --- | --- | --- | --- | --- |
| Overview | Welcome, five working quick-action links; no fabricated statistics | N/A | Shared nav; SUPER_ADMIN additions | /auth/me identity; no undocumented overview metrics API | DONE, except shared modal focus AUD-08 |
| Countries | List + UUID editor DONE; new live SUPER_ADMIN200,6 records | PARTIAL: all documented fields wired; slug min2 missing AUD-03; PATCH sends whole serialized baseline rather than changed fields | search/featured/status/manual-newest/page/limit implemented; new page2 and DRAFT live | displayOrder/SEO/image/featured/status; Arabic required/English optional; publication confirms | PARTIAL |
| Universities | Existing list/detail + new city/type mapping; prior live total10 | PARTIAL: non-null type/city/country mappings, source/media/SEO; null type clearing Backend-blocked; same whole-baseline core PATCH behavior | all documented University filters, slugs vs UUIDs, newest/name paging; prior live both nonempty and empty advanced results | Country→City clears normalized city; country UUID + legacy city text remain separate; nested sections reuse same University | PARTIAL (known schema limitation) |
| Scholarships | List/detail mapped; new live200,8 records | PARTIAL: AUD-02 unchanged deadline shift; AUD-06 stale University after Country change; AUD-03 slug | Existing search/country/university/studyLevel/fundingType/applicationStatus/featured/status/newest-deadline/page/limit; eight associated-University filters MISSING AUD-04 | Stored vs effective application status separate from editorial status; new published+CLOSED live result4; null references/source/deadline supported | PARTIAL |
| Services | List/detail DONE; new live200,6 records including drafts | PARTIAL slug boundary; new real-Axios intercepted400 preservation PASS; all description/media/order/SEO fields wired | No search contract; featured/status/manual-newest/page/limit; DRAFT live5 | publication/archive via PATCH, image upload mapping | PARTIAL |
| Articles | List/body blocks mapped; new live200,6; detail adds the documented link arrays | PARTIAL: legacy single scholarship only; ordered scholarshipIds/relatedScholarships not modeled/displayed, can overwrite links AUD-01; slug AUD-03 | search/country/featured/status/newest/page/limit; live ARCHIVED1 | Six flat block types, bilingual/null body, order/remove/add, image/SEO; ordered multi-Scholarship editing MISSING | PARTIAL — release blocker |
| Applications | List/detail, contact/message/consent/note/nullable references | No create API; status/internalNote partial PATCH incl empty string vs explicit null, max5000, failed-save preservation | status/type/newest-oldest-updated/page/limit; no search API | Four workflow states; cache update guards; both roles live four records | DONE frontend/read-only acceptance; live PATCH unverified |
| Inquiries | Same shared infrastructure, inquiry-specific subject/detail | Same status/note workflow; no Admin create | status/newest-oldest-updated/page/limit | Both roles live four records; sensitive values not copied into this report | DONE frontend/read-only acceptance; live PATCH unverified |
| Programs | University-scoped list; edit initialized from list record, no detail GET contract | Create/changed-field PATCH, Major/language/duration/source/date/year-only tuition input | search/level/language/faculty/status/page/limit | Major UUID; paired duration; archive; non-tuition live total2 drafts | PARTIAL — tuition display/history Backend-blocked |
| Academic Majors | Bilingual catalog list, prior live3 | Create only; no edit/delete endpoint | search/page/limit; selected record retained beyond current page | Major UUID is independent of Program name; categories/null mapped | DONE frontend; live create unverified |
| Cities | Bilingual list/country reference, prior live4 | Create only; no edit/delete | countryId UUID/search/page/limit | Country-dependent paginated selector; nullable current City | DONE frontend; live create unverified |
| Admission Requirements | Scoped list/non-tuition metadata, live1 | Scope/target immutable in edit, create per scope, changed-field PATCH | scope/status/page/limit | UNIVERSITY/STUDY_LEVEL/PROGRAM; same-University Program target; HTTPS/nonfuture source before publish; nullable enum blocked | PARTIAL |
| Gallery | Association list/status/order metadata; live1 | Attach/edit; association-only confirmed detach; explicit upload→attach | status/page/limit; full non-archived set loaded for ordering;409 lock/reload | Correct separate cover/asset semantics; existing image URL broken; >100 order Backend clarification | PARTIAL acceptance; CRUD frontend locally tested |
| Media | Shared uploader, no documented media-library GET/DELETE | Explicit multipart upload, preview/progress, signature/MIME/byte guards, recovery | N/A | New intercepted upload resource/secureUrl mapping PASS in all five original editors, no automatic content save | DONE frontend; live upload unverified |
| FAQs | All five scopes, immutable correct resource parent, list bilingual/status/order/date data | create/changed-field PATCH/archive with confirmations, field400 recovery | scope/parent/status/page/limit; scoped parent search only where supported | Complete-group non-archived reorder locally tested; live GLOBAL7 and sampled UNIVERSITY2; Country/Service/Scholarship sampled parents empty, see §11 | DONE frontend; sampled scoped GETs now live; empty-parent record checks and all writes remain unverified |
| Settings | Public GET, eleven response fields/ten editable fields, uninitialized/null supported | ADMIN no editor; SUPER_ADMIN allowlisted changed-only PATCH, explicit null clearing, failure preservation | No query parameters | Public request strips credentials upstream; Backend owns social/email minor clarification | DONE frontend; live PATCH unverified |
| Analytics | Correct raw KPI units and separate client/server conversions; chart + table/breakdowns | Read-only | UTC inclusive≤366 days/day-week-month/topLimit; Journey page/limit | Summary live500; Journey core live2; nullable ctaId/engagementType quarantined | BLOCKED live Summary / PARTIAL Journey fields |
| Admin Accounts | Five safe fields/page/limit, live2 | Confirmed one-field role OR active PATCH; own demote/deactivate unavailable; pending/no-op/stale guards | No search/create/detail/delete contract | Last active SUPER_ADMIN and session revocation remain Backend-owned; isolated409/400/401/403 tested | DONE frontend; production mutation acceptance unverified |
| Audit Logs | Read-only list/actor/resource/time/action + redacted metadata, live1 | No writes/detail/export contract | actorId/action/resourceType/inclusive time/page/limit, Backend newest-first | No raw JSON/free-text/secrets; AUD-09 hides legitimate RESOLVED status metadata | PARTIAL |
| Change password | Documented additional Admin capability, not in previous phase scope | No resource function/hook/form; proxy allowlist alone is not implementation | N/A | Current password + strong new password; Backend clears sessions; no write attempted | MISSING; needs Lead decision, no new feature implemented |

## 3. Role/access matrix

| Capability | ADMIN | SUPER_ADMIN | Evidence / boundary |
| --- | --- | --- | --- |
| Protected shared routes and five content editors | Permitted; original mock CRUD and new Service failure/uploader checks | Permitted; new actual list/detail and existing Phase2 University GETs | Same shared shell/components; not a new live mutation test for either role |
| Applications/Inquiries list/detail | Prior LIVE PASS four GETs | Prior LIVE PASS four GETs | Reused Phase1; workflow writes intercepted for both roles, no student records changed |
| Catalogs/Programs/Admission/Gallery/media | Allowed by contract; Phase2 shared local workflows | Allowed; prior live seven-group Phase2 GETs; SUPER catalog fixture create evidence | Not every write was replayed under both roles; shared implementation/contract inference is labeled, not real RBAC evidence |
| FAQs | Local ADMIN scoped create/parent tests | Live GLOBAL and sampled University read/filter/page2; other three sampled parents empty | Prior tests reused; §11 adds scoped GET evidence only, no live order or scope rewrite |
| Settings | Read-only, no save/editor; direct mutation hook independently rejects | Editor/partial/null saves available | Phase3 intercepted tests; public GET live; Backend permission enforcement not freshly attacked |
| Analytics/Accounts/Audit direct routes | Denied before restricted child/hook requests; nav absent | Enabled with pre/post authoritative session checks | Phase4 intercepted direct-route/API denial and role-loss tests reused; live positive SUPER GET baseline reused |
| Private cache cleanup | Previous terminal-session behavior reused | Per-user privileged namespace + role-loss guard, late account responses guarded | No repeat auth cycles; core-content late-save race still needs dedicated acceptance (see §7) |
| Password change | MISSING UI/API | MISSING UI/API | Contract applies to both roles; not an invented SUPER-only endpoint |

Navigation visibility is not asserted to be Backend authorization. Authority stays with /auth/me and actual Backend responses. Current live core checks used only SUPER_ADMIN. **New live ADMIN core-content GET acceptance is NOT VERIFIED**; do not relabel the original mock ADMIN work or SUPER responses as live ADMIN RBAC proof. No other role is defined in the supplied AdminRole enum.

## 4. Newly executed verification

### Unit/contract checks

Command: `$env:TZ='Asia/Amman'; node node_modules/tsx/dist/cli.mjs --test tests/audit/contract-gaps.test.ts`.

Final: **7 checks,1 PASS,6 FAIL**, exit1. Initial six-check run had1 PASS/5 FAIL; the second run added AUD-09 and replaced a noisy source assertion with a boolean. No old suite was rerun. Failures are intentional ordinary acceptance assertions of expected safe behavior, with actual defects left untouched.

| Check | Result | Concrete evidence |
| --- | --- | --- |
| Article unrelated edit preserves ordered links | FAIL AUD-01 | Payload contains legacy scholarshipId but no scholarshipIds, replacing a two-link association under documented semantics |
| Deadline round trip in Asia/Amman | FAIL AUD-02 | 2026-11-20T12:34:56.000Z becomes 2026-11-20T09:34:00.000Z |
| All original editors enforce slug min2 | FAIL AUD-03 | Country validation accepts x; same generic path in Scholarship/Service/Article; University has a separate min2 check |
| Associated-University Scholarship filters | FAIL AUD-04 | Exact eight documented names absent from config/type/parser |
| Current-password API consumer | FAIL AUD-05 | Path exists in OpenAPI/proxy allowlist; absent from lib/api-client/auth.ts and app consumers |
| RESOLVED metadata projection | FAIL AUD-09 | safeAuditMetadata({toStatus:RESOLVED}).rows returns[] |
| Flat block/null mapping and separate Scholarship statuses | PASS | Existing valid flat bodyAr/null bodyEn/null relationships preserved |

### Chromium scenarios — actual frontend, intercepted Backend

Command: `node node_modules/@playwright/test/cli.js test --config=tests/audit/playwright.config.ts`. Targeted reruns used `--grep 'New role/nav'` and `--grep 'Shared uploader'`.

**9 distinct scenarios:4 PASS,5 FAIL,0 BLOCKED.** Initial8:2 PASS/6 FAIL; one failure was a test locator matching both h1 and h2. It was scoped to h2 and passed alone. Then one new cross-editor uploader scenario passed alone. Five genuine failures remain. No application source correction was made.

| Scenario | Role | Final result |
| --- | --- | --- |
| Article unrelated edit/link preservation | SUPER_ADMIN fixture | FAIL AUD-01 |
| Unchanged Scholarship deadline UTC instant | ADMIN fixture | FAIL AUD-02 |
| Country change / University relationship clearing | ADMIN fixture | FAIL AUD-06; new Country UUID + old University UUID sent |
| Original relationship GET403 feedback/retry | ADMIN fixture | FAIL AUD-07; three bounded query attempts, no alert/retry UI |
| Mobile modal keyboard containment at390×640 | SUPER_ADMIN fixture | FAIL AUD-08; two Shift+Tab presses leave dialog |
| Overview→Article quick link / RTL at350,768,1440 | SUPER_ADMIN fixture | PASS after test-only heading correction, no unhandled pageerror |
| Original Service400 field feedback/preservation | ADMIN fixture | PASS, one intercepted PATCH, edited summary retained |
| Production runtime proxy404 / mock exclusion | ADMIN fixture | PASS; local production-build /__dev_api/health returns404, no upstream forwarding |
| Shared uploader in Country/University/Scholarship/Service/Article editors | ADMIN fixture | PASS; five multipart resource values, secureUrl in correct image/cover field, titles preserved, zero content saves |

All API/external-origin traffic for these tests is intercepted or aborted before the local proxy. Synthetic identities use example.invalid; no real credentials/cookie jars are loaded. The five test uploads are fixture responses, **not production Cloudinary uploads**. Screenshots/traces/service workers are disabled. Synthetic error-context text in the ignored output directory is not production data; targeted runs may replace their own output. The reproducible tests and observed results above are the retained audit evidence, not a claim that all intermediate error artifacts still exist.

The existing Phase4 production build was served on127.0.0.1:3111 without rebuilding it. Initial sandbox execution could not access local sockets. An elevated retry initially found the audit-owned listener still present; that audit run was closed, then the elevated browser run started successfully. No unrelated process was terminated or port reassigned. Playwright stopped only its own production-build server. The pre-existing live proxy server onlocalhost:3001 was retained.

### New live read-only evidence — SUPER_ADMIN

The shared browser tab/cookie context was reused, with the existing development-only proxy and mock access disabled. An initial direct Countries GET returned401/AUTHENTICATION_REQUIRED. The Owner permitted opening Login in that exact tab. The app's existing session recovery ran automatically and returned the Dashboard; a read-only /auth/me then returned200 and SUPER_ADMIN. **No credentials were entered/read and no authentication regression suite was performed.** Matching existing Next.js proxy logs confirmed statuses below. Cumulative logs include background auth/refresh traffic from app lifecycle/other existing pages; this is not a zero-POST-log claim or a new auth acceptance result.

| Live GET (base /api/v1 through /__dev_api) | HTTP / real records | Newly verified UI/response behavior |
| --- | --- | --- |
| /admin/countries?page=1&limit=1 | 200; total6/6pages | Success/items/pagination;20 record keys; optional English/media nulls |
| /admin/countries/{list-derived UUID} | 200 | Same response structure; loaded name/editor/upload controls; no save |
| /admin/scholarships?page=1&limit=1 | 200; total8/8pages | Stored/effective/application/editorial fields remain separate |
| /admin/scholarships/{list-derived UUID} | 200 | Nullable Country/University/image references; initialized editor, no save |
| /admin/services?page=1&limit=1 | 200; total6/6pages | Existing DRAFT visible to authorized Admin |
| /admin/services/{list-derived UUID} | 200 | Optional English/media/SEO/publication nulls; initialized form |
| /admin/articles?page=1&limit=1 | 200; total6/6pages | Archived item visible in unfiltered Admin list |
| /admin/articles/{list-derived UUID} | 200 | Flat bodyAr blocks; nullable bodyEn; actual response includes scholarshipIds/relatedScholarships; sampled record had one link, so live multi-link edit acceptance was neither possible nor authorized |

All four UI lists were then observed atpage2/limit1 with matching counts (6,8,6,6), edit links, and no generic error state; detail editors initialized and retained RTL. Initial immediate DOM reads preceded hydration and were inconclusive; only subsequent locator-waited observations count as PASS. Corresponding proxy requests returned200. URL/page2 evidence is actual list data, not fixture pagination.

| Live UI filter sample, page1/limit1 | HTTP | Result |
| --- | --- | --- |
| Countries status=DRAFT | 200 | total3, DRAFT badge |
| Services status=DRAFT&sort=manual | 200 | total5, DRAFT badge; no claim that one row proves global ordering stability |
| Scholarships status=PUBLISHED&applicationStatus=CLOSED&sort=deadline | 200 | total4, published badge and CLOSED application visible; CLOSED is not unpublished |
| Articles status=ARCHIVED | 200 | total1, archived badge |

No actual image upload, content save, publication/archive, detach/order, settings/account action was used. No student values, credentials, cookie values, real account identity details or record bodies were copied into this report. The live tab was left on the read-only archived Articles list for handoff. No new screenshots.

Previously accepted University seven-group GETs, submissions for both roles, FAQ/Settings baseline and Phase4 baseline were **not deliberately repeated**. A few selector/background GETs naturally occurred while real editors initialized; they are incidental, not a re-executed phase suite. Current live read-only checks do not prove all filters, all records, production-scale selector performance or production persistence.

## 5. Confirmed frontend findings / missing capability register

| ID / priority | Exact location | Reproduction and expected behavior | Actual / evidence | Targeted proposed correction (NOT applied) |
| --- | --- | --- | --- | --- |
| AUD-01 CRITICAL | lib/api-client/content.ts Article/ArticleInput; lib/content-config.ts articles; lib/content-form.ts initialContentValues/toContentPayload; components/content/content-form-page.tsx submit | Load detail with scholarshipIds=[A,B], change only summary, Save; preserve association set | Unit + real frontend intercepted browser FAIL. Legacy scholarshipId=A is always serialized; documented legacy-only PATCH replaces links with[A]. Arrays are not modeled/UI-editable. Sampled live detail has arrays, but no real write was tested. | Model ArticleDetail and ordered≤50 unique UUID links; leave associations omitted when untouched; explicit ordered replacement/clear; cover reopen/order/conflicts. SMALL adapter fix + MEDIUM ordered-selector UI, separate approval |
| AUD-02 HIGH | lib/content-form.ts:37 toDateTimeLocal and :86 toContentPayload | In Asia/Amman load deadline12:34:56Z, edit title only, Save; preserve exact timestamp | Unit + browser FAIL; request09:34:00Z. UTC display slice interpreted as local; seconds discarded. | Use existing local-date helper for display and changed-field PATCH; omit untouched deadline to preserve original precision. SMALL |
| AUD-06 HIGH | components/content/content-form-page.tsx Field relationship filter and Country onChange | Existing CountryA/UniversityA; select CountryB then Save; no hidden incompatible University | Browser FAIL: CountryB plus unchanged UniversityA UUID. Visible options filter it out but RHF retains previous value. Article uses same path (source-inferred, not separately reproduced). Backend may reject; no invalid live record was created. | Reset/revalidate dependent universityId when Country changes, preserving selections only when valid. SMALL |
| AUD-05 HIGH missing documented capability | lib/api-client/auth.ts, app/admin routes, hooks; contrast lib/admin-dev-api-proxy.ts AUTH_METHODS | Look for documented POST/auth/change-password UI/API; approved account security workflow should exist or be explicitly deferred | Contract/source FAIL; proxy allowlist only. No attempt to change a real password. This capability was not explicitly delivered in Phases1–4. | Lead explicitly scope/approve implementation or record a release deferral with approved security workflow; do not add it silently in an audit. MEDIUM |
| AUD-07 MEDIUM | components/content/content-form-page.tsx selectors.data??[]; content-list-page.tsx filter selectors; use-content-queries.ts | Country relationship request403/network failure; show honest error/retry, not silent empty options | Browser FAIL with403: three GET attempts then no alert; empty-looking options. New Phase2/FAQ selectors do have error UI; issue is original shared controls. | Expose loading/error/retry per selector and preserve current selected option; avoid interpreting error as empty. SMALL |
| AUD-08 MEDIUM | components/layout/admin-shell.tsx drawerOpen/effect/dialog | Open mobile menu390×640, Shift+Tab twice; modal must retain keyboard focus | Browser FAIL: focus leaves aria-modal dialog; background remains focusable. Prior Escape/open/close tests did not check containment. | Focus trap/inert background and focus restoration; check short-height scroll reachability separately. SMALL/MEDIUM |
| AUD-04 MEDIUM coverage gap | lib/api-client/content.ts ScholarshipListParams; lib/content-config.ts scholarships.filters; components/content/content-list-page.tsx parseFilters | Use universitySearch/universityCountry/universityMajor/universityStudyLevel/universityLanguage/universityCity/universityType/universityFeatured | Contract/source FAIL; all eight dropped by type/config/parser. Backend supports them; no fallback endpoint needed. Existing simpler filters work. | Lead prioritize essential Admin filter use cases; implement typed serialization/state if approved. Not every parameter needs a separate control and this alone is not a critical release blocker. MEDIUM |
| AUD-03 MEDIUM validation | lib/content-form.ts slugSchema + validateContentValues | Enter single-character slug x in Country/Scholarship/Service/Article; min2 should be checked before save | New Country unit assertion fails; shared source lacks min2 for the other three. University has a special check. Backend still validates and field errors are supported; not a security bypass. | Shared min2/max120 schema for every original editor. SMALL |
| AUD-09 MEDIUM | lib/phase4-presentation.ts statusValues/safeAuditMetadata | Render safe metadata{toStatus:RESOLVED}; documented status should be shown | Unit FAIL: rows[]; RESOLVED omitted, undocumented CONTACTED admitted. No raw JSON leak; legitimate audit detail is hidden. | Reuse documented publication/submission/role enums, keeping safe key/type allowlist. SMALL |

LOW documentation/configuration observations: README still says Settings is SUPER_ADMIN-only, while the current valid implementation gives ADMIN public read-only access. The dependency register retains historical session/proxy blockers alongside later accepted evidence; those older rows must not override dated continuations. A later documentation-only reconciliation is recommended; this audit did not rewrite it.

Core PATCH serializes the whole nonblank form baseline rather than a changed-field diff, so successful serialization is not “partial edits fully verified.” The contract permits those fields, but this design increases stale-overwrite risk and causes AUD-01/AUD-02. Optional non-null strings erased to blank are omitted: the API does not generally offer null clearing for those core fields. Do not invent null support as a fix.

## 6. Backend dependencies retained, not reinvestigated

| Owner | Existing dependency | Exact acceptance condition |
| --- | --- | --- |
| Backend/API owner | UniversityProgramTuition contradictory allOf/additionalProperties; current/history display quarantined | Publish a satisfiable response model with explicit current-null/history semantics |
| Backend/API owner | University universityType / Admission studyLevel nullable enum intersections | Correct nullability composition before null-clear/full field acceptance |
| Backend/content owner | Existing Gallery URL resolves to no image | Replace/fix that existing asset through separately approved content workflow |
| Backend/Architecture | Gallery reorder demands full active set but caps IDs at100 | Clarify valid ordering for Universities above100 non-archived associations |
| Backend | Program publication prerequisites not fully specified | Document rules and provide authorized acceptance environment; no invented prerequisites |
| Backend | Analytics Summary HTTP500 | Restore valid200; no repeat retry performed here |
| Backend/API owner | Journey ctaId/engagementType nullable enum composition | Correct schemas before typed display/full-response validation |
| Backend/API owner | Minor Settings social/email annotation differences | Clarify HTTPS/platform/email rules; current implementation uses documented schema plus Backend field feedback |
| Owner/Backend | Record-dependent live cases | Existing matching published Program, more Admission scopes/Gallery images for positive/multipage checks; do not manufacture production records |
| Project Owner | Real write acceptance | Separately authorize a non-production test environment or exact controlled mutation scope; no current production writes are authorized |

See the existing `docs/admin-pending-integrations.md` and later phase-report continuations for provenance. These are not newly discovered frontend defects, nor excuses to discard working unaffected modules.

## 7. Security and production readiness

- **PASS static + reused tests:** Axios browser withCredentials:true; server-only client isolated, credentials not implicitly forwarded; no localStorage/sessionStorage/bearer architecture; no source token/cookie logging; query/mutation hooks in approved directories; narrow stable QueryProvider inside Server root layout.
- **PASS local boundaries:** fixed production upstream; canonical UUID/path/method allowlist; Gallery is the only documented content DELETE (association detach), not resource deletion; trusted local Host/Origin/Referer on writes; upload body cap; no arbitrary forwarding/redirects. The proxy uses server fetch as approved infrastructure, not a competing browser transport.
- **PASS public integration:** public Settings GET sets withCredentials:false; proxy forwards only Accept upstream. No Public Website-only submission/event endpoint is consumed by Admin; unrelated public reads are NOT missing Admin features.
- **PASS privileged local evidence:** /auth/me role source, page/hook gates, actor-specific Phase4 keys, pre/post-await guard, cache removal on role loss; no unauthorized restricted API calls in reused ADMIN test. Backend remains authoritative; client-only page gate is not server RBAC.
- **Security risk needing targeted acceptance, NOT a proven cross-user exposure:** original `useUpdateContent.onSuccess` directly setQueryData without checking the current session/actor; `clearPrivateAdminCache` clears cache but does not cancel an in-flight mutation. Phase1/4 have explicit completion guards. A pending core save crossing logout/account switch could reinsert private cache data; this interleaving was not exercised here and must not be claimed PASS from submission tests. Obtain approval for a focused correction/isolated race test before closing this risk.
- **PASS production exclusion:** new actual local production-runtime GET /__dev_api/health returned404, and mock controls absent. Fixtures are used only by explicit development mode/tests, never automatically after API failure.
- **BLOCKED deployment evidence:** .env.example and README are instructions, not Vercel configuration. Browser Axios uses the environment base directly; it does not append or normalize /api/v1. Owner must set `NEXT_PUBLIC_API_BASE_URL=https://api.tareeq-academy.com/api/v1` at build time, exactly once; `API_BASE_URL` remains server-only. No env file values/secrets were read or changed in this audit.
- **Important artifact finding:** the existing Phase4 test-build browser chunk explicitly contains `baseURL:"/__dev_api"`. It is suitable for isolated interception, not deployment. In production that proxy returns404. A runtime env change alone cannot be treated as rebuilding browser code. Owner must build/deploy with the direct production base and verify emitted requests to the intended domain.
- **BLOCKED deployed acceptance:** no current Vercel settings/release artifact or production-domain authenticated Chrome E2E was inspected. Local-proxy cookies do not establish deployed CORS/CSRF/host-only cookie acceptance. Historical HTTPS reachability is not current production login proof. Do not reuse localhost acceptance as production-domain acceptance.
- **Delivery risk:** Phase2–4 routes/API/components/tests are still largely untracked; Owner's eventual synchronization must include them. No source cleanup/staging/commit was performed. Generated .next output, test-results, env.local and tsbuildinfo are ignored; only .env.example is tracked among env files. Existing tracked audit-artifacts are historical, not new screenshots.

## 8. Responsive/RTL and accessibility

Reuse: original six-width350/390/768/1024/1280/1440 list/form checks; Phase1 list/detail matrix; Phase2/3/4 focused350/768/1440 checks. This is DOM overflow/accessibility-name evidence, not a complete WCAG/contrast certification or every long-text layout permutation.

New actual Chromium checks: Article new form/overview link path at350/768/1440, no document overflow, html dir=rtl; Service error field associations and retained edits; uploader controls across all five editors. Shared mobile modal focus FAIL at390×640 is AUD-08. Visible global focus outlines exist in CSS; keyboard containment must still be fixed. Short-height trailing-menu reachability, formal contrast and every screen-reader interaction remain unverified, not assumed PASS. No redesign/screenshot sweep performed.

## 9. Technical checks, efficiency and next acceptance gate

| Check | Result |
| --- | --- |
| Current Typecheck | PASS; `tsc --noEmit --incremental false`, justified because new audit TypeScript files are included by project config |
| Current audit-file ESLint | PASS after correcting a test-utility-only unused-expression warning; no application edit |
| Whole-repo ESLint | Reused Phase4 PASS with one pre-existing unused action warning; no broad rerun |
| Webpack build | Reused Phase4 PASS and served successfully for new Chromium cases; no rebuild needed for audit-only application state |
| Inventory | PASS:81 operations,58 relevant; SHA matches all phase reports |
| Audit unit assertions | FAIL overall:1 passed,6 failed; red defects retained |
| Audit browser scenarios | FAIL overall:4 distinct passed,5 failed; exact history in§4 |
| New live GETs | PASS SUPER_ADMIN core list/detail/page2/filter samples; no write persistence claim |
| Existing live/mutation evidence | Reused and bounded per§1/3/6; all production writes remain unverified |
| Diff whitespace | PASS; normal Git LF→CRLF notices are not whitespace defects |

To move from NOT READY: approve and fix AUD-01/AUD-02/AUD-06 first, decide the password/filter capability deferrals, resolve the remaining confirmed UX/validation findings or explicitly accept them, validate the late-save cache race, obtain documented Backend blocker dispositions, build the intended production artifact, complete real production-domain read-only role/session acceptance and separately authorize write acceptance. Passing builds do not waive those conditions.

Intentionally not repeated: accepted auth/login/logout/refresh suites; Phase1 GET matrix; Phase2 seven-group matrix; Phase3 baseline; Phase4 Summary failure; previous full unit/mock suites; screenshot matrices; production builds. Only missing core live evidence and targeted new cases were executed. No dependencies installed.

## 10. Files and Git

Added in this audit only:

- `docs/admin-full-coverage-audit.md` — this report, complete81-operation classification,58-operation coverage matrix and exact schema/parameter/error appendices.
- `tests/audit/contract-gaps.test.ts` — focused ordinary red acceptance assertions.
- `tests/audit/browser/coverage.spec.ts` — focused isolated browser verification.
- `tests/audit/playwright.config.ts` — existing build, isolated3111, no screenshots/traces, intercepted APIs.
- `tests/audit/openapi-inventory.mjs` — read-only reproducible inventory, prints Markdown, no network/writes.

Ignored `test-results/full-coverage-audit/` may contain current synthetic test output. No new production screenshots, credentials, cookies or student data artifacts. No application source, existing phase report, pending register, env file, build configuration or Backend specification was edited. All pre-existing tracked/untracked work was preserved. No commit/push/pull/merge/rebase/reset/deployment or production mutation.

The current Git snapshot is below. The branch remains `main...origin/main`; the16 tracked modified paths and existing untracked Phase2–4 files predate this audit and are not claimed as newly authored work.

```text
## main...origin/main
 M lib/api-client/content.ts
 M lib/api-client/query-keys.ts
 M app/%5F_dev_api/[...path]/route.ts
 M app/admin/[resource]/[id]/page.tsx
 M components/content/content-form-page.tsx
 M components/content/content-list-page.tsx
 M components/layout/admin-protected-shell.tsx
 M components/layout/admin-shell.tsx
 M docs/admin-pending-integrations.md
 M lib/admin-dev-api-proxy.ts
 M lib/admin.ts
 M lib/content-config.ts
 M lib/content-form.ts
 M next-env.d.ts
 M package.json
 M tsconfig.json
?? lib/api-client/faqs.ts
?? lib/api-client/images.ts
?? lib/api-client/phase4.ts
?? lib/api-client/site-settings.ts
?? lib/api-client/university-management.ts
?? app/admin/academic-majors/
?? app/admin/admins/
?? app/admin/analytics/
?? app/admin/audit-log/
?? app/admin/cities/
?? app/admin/faqs/
?? app/admin/settings/
?? components/faqs/
?? components/layout/super-admin-boundary.tsx
?? components/media/
?? components/phase4/
?? components/settings/
?? components/universities/
?? docs/admin-full-coverage-audit.md
?? docs/admin-phase2-report.md
?? docs/admin-phase3-report.md
?? docs/admin-phase4-report.md
?? hook/mutations/use-account-mutation.ts
?? hook/mutations/use-faq-mutation.ts
?? hook/mutations/use-image-upload.ts
?? hook/mutations/use-site-settings-mutation.ts
?? hook/mutations/use-university-management.ts
?? hook/queries/use-faq-queries.ts
?? hook/queries/use-phase4-queries.ts
?? hook/queries/use-site-settings-query.ts
?? hook/queries/use-university-management.ts
?? lib/faq-form.ts
?? lib/faq-schemas.ts
?? lib/phase4-presentation.ts
?? lib/phase4-schemas.ts
?? lib/privileged-access.ts
?? lib/site-settings-schemas.ts
?? lib/university-form.ts
?? lib/university-schemas.ts
?? playwright.phase2.config.ts
?? playwright.phase3.config.ts
?? playwright.phase4.config.ts
?? tests/admin-phase4.test.ts
?? tests/admin-site-management.test.ts
?? tests/admin-university-management.test.ts
?? tests/audit/
?? tests/fixtures/phase4.ts
?? tests/fixtures/site-management.ts
?? tests/fixtures/university-management.ts
?? tests/phase2-e2e/
?? tests/phase3-e2e/
?? tests/phase4-e2e/
```

### Additional evidence boundaries

The core `lib/api-client/content.ts` resource factory unwraps typed Axios envelopes without runtime response-schema parsing. Its ordinary success mappings were verified, but full malformed-response recovery for every original content module is not established by the Phase1 submission schemas. Treat that hardening edge case as IMPLEMENTED BUT UNVERIFIED, not a blanket response-validation PASS. Likewise, all five editors expose documented PATCH transport, but only the newer section/submission/FAQ/Settings editors implement field-diff PATCH payloads; original content sends its full serialized baseline. These qualifications apply to the per-operation matrix below.

The current audit did not read ignored local environment values, capture browser cookie values, perform a full console dump, or preserve real record bodies. Live findings contain only aggregate counts, field names, nullable-field names, publication enums and boolean mapping indicators. Existing request logs include UUID paths for ordinary content; these identifiers are not student submissions and are omitted from the report.

---

## 11. Focused remaining live GET continuation — 2026-11-05

Owner instruction: reuse the existing SUPER_ADMIN session and finish only outstanding read-only GET cases. No previously passed automated suite, authentication suite, build, screenshot sweep, known Summary500 request or Phase1/Phase2 GET matrix was repeated.

### Session and evidence provenance

The same shared browser/tab and existing localhost:3001 development proxy were retained. Its first queued batch of five outstanding FAQ requests returned actual HTTP401/AUTHENTICATION_REQUIRED, even though an older authenticated UI remained visible. Requests stopped after that batch; these responses are session-blocked evidence, **not broken FAQ endpoint evidence**. Navigating to the approved Login route invoked the app's existing automatic session recovery and returned a loaded Dashboard with SUPER_ADMIN navigation. No credential entry, cookie inspection, logout, manually initiated refresh or auth regression test occurred. The newly requested Country FAQ GET then returned200, and the remaining scoped checks proceeded. The cumulative server log naturally includes app-managed authentication traffic; this continuation does not claim that all background requests were GET.

All new API evidence below is actual Backend JSON rendered in that authenticated browser, corroborated by matching Next.js proxy method/query/status logs. No fixtures, HTTP interception or mock mode was used. Only aggregate counts, field-type/group/filter booleans, nullable-translation flags and publication enums were emitted. Parent/account/actor/session UUIDs, real identities, FAQ content and raw metadata are not reproduced here. No cookies or credentials were extracted. Existing list-derived parent identifiers were reused rather than repeating accepted content list tests.

### New GET matrix

Paths are relative to /api/v1 upstream, or /__dev_api locally. Every successful request below returned **HTTP200**.

| Outstanding check | Result | Actual request / counts | Response and UI evidence / boundary |
| --- | --- | --- | --- |
| COUNTRY scoped FAQs | PASS empty GET; record mapping BLOCKED | GET /admin/faqs?scope=COUNTRY&parentId=<existing Country UUID>&page=1&limit=1; total0,totalPages0 | Honest success/items:[]/pagination. Same parent selected in real FAQ UI atlimit50: normal empty state. No row exists to validate bilingual/status/order mapping; empty-array every() results are not counted as field validation PASS. |
| UNIVERSITY scoped FAQs | PASS | GET /admin/faqs?scope=UNIVERSITY&parentId=<existing University UUID>&page=1&limit=1; total2,totalPages2,one DRAFT item | Parent/scope identity matches; Arabic strings, nullable English strings, publication enum and integer displayOrder validated. Actual UI selection loads two cards/two DRAFT badges, RTL, no generic error. |
| UNIVERSITY FAQ status filter + page2 | PASS | Same parent, page=2&limit=1&status=DRAFT; total2,totalPages2,one item,displayOrder1 | Returned row matches parent/scope/DRAFT; questionEn and answerEn are null. API page2 is live; UI minimum page size12 cannot show multiple pages with two records. UI status=PUBLISHED atlimit50 returns200 and a truthful empty state. This sample does not prove every possible status transition or global ordering stability. |
| SERVICE scoped FAQs | PASS empty GET; record mapping BLOCKED | GET /admin/faqs?scope=SERVICE&parentId=<existing Service UUID>&page=1&limit=1; total0,totalPages0 | Collection/envelope/pagination succeed; no records for sampled parent, so record fields/order/filter positives cannot be accepted. No other parents were surveyed or created. |
| SCHOLARSHIP scoped FAQs | PASS empty GET; record mapping BLOCKED | GET /admin/faqs?scope=SCHOLARSHIP&parentId=<existing Scholarship UUID>&page=1&limit=1; total0,totalPages0 | Same empty-success boundary; no row-specific mapping acceptance. |
| GLOBAL FAQ page2 | PASS | GET /admin/faqs?scope=GLOBAL&page=2&limit=1; total7,totalPages7,one DRAFT item | Returned scopeGLOBAL,parentIdnull; Arabic/nullable-English fields and integer order types valid. Previously accepted default GLOBAL baseline was not retested deliberately; its GET occurs incidentally when opening the FAQ page. |
| Admin account API pagination | PASS | GET /admin/users?page=2&limit=1; total2,totalPages2,one item | Exact safe response keys id/name/email/role/isActive, correct primitive/role types, no extra keys. Identities were not printed. UI offers20/50, so live UI next-page behavior is BLOCKED by only two accounts; existing mocked pagination evidence remains separate. |
| Anonymous Journey API pagination | PASS unaffected fields | GET /admin/analytics/journeys?granularity=day&topLimit=10&page=2&limit=1; total2,totalPages2,one session | Core session/event count/truncation and step eventId/type/path/nullable targetPath/occurredAt structures validated. ctaId/engagementType deliberately not interpreted; known nullable-enum blocker unchanged. UI page2 at offered page sizes requires more sessions; this is not UI multi-page acceptance. No Summary request was made. |
| Audit exact action/resource/date filters | PASS | GET /admin/audit-logs?resourceType=SCHOLARSHIP&action=content.scholarship.created&from=2026-11-04T00:00:00.000Z&to=2026-11-04T23:59:59.999Z&page=1&limit=1; total1 | Returned record matches action/resource and inclusive time bounds; safe actor/resource ID/string fields and metadata object structure validated without printing values. One record does not establish newest-first stability or multi-page behavior. |
| Audit actor filter | PASS | GET /admin/audit-logs?actorId=<response-derived actor UUID>&resourceType=SCHOLARSHIP&action=content.scholarship.created&page=1&limit=1; total1 | Returned actorAdminId and nested actor.id match requested actor. Actual Audit UI controls submit the same actor/action/resource filters atpage1/limit20, HTTP200,one card/one safe metadata disclosure,no raw pre/JSON block,no alert. No metadata values were dumped and no account action was used. |

The FAQ and Audit page initially needed additional hydration time after navigation. Initial locator deadline failures were inspected; the expected controls were then present and the targeted UI interactions completed. These were automation-readiness observations, not evidence of failed Backend mapping. No blind repeated page navigation or source fix was made.

Available shared-tab browser error buffer returned **0 captured error entries** (limit30). This is not a timestamp-isolated guarantee for all network requests or the entire application. No broad console dump or screenshot was taken.

### Remaining boundaries and verdict

- No further unblocked **selected SUPER_ADMIN GET** case from this continuation is pending. Country/Service/Scholarship FAQ row-dependent acceptance is BLOCKED for the sampled empty parents; other parents were not exhaustively surveyed.
- FAQ/Accounts/Journeys UI multi-page acceptance remains record-count limited at their offered page sizes; direct Backend page2 evidence must not be relabeled UI next-button evidence. Audit has only one matching record, so meaningful multi-record sorting/paging remains BLOCKED by data availability.
- Existing Phase2 tuition/nullable enums/Gallery asset and ordering limits, positive published-program filter prerequisites, Analytics Summary500 and Journey enum dependencies remain unchanged and were not reinvestigated.
- New ADMIN core live GET acceptance still requires a separate authorized ADMIN session if requested; this SUPER_ADMIN continuation is not ADMIN RBAC evidence. Previously accepted Phase1 results for both roles are retained.
- All production POST/PATCH/PUT/DELETE content/account writes, uploads, publication/archive, order/detach and Settings changes remain unauthorized/unverified. No mutation control was invoked.
- **Release verdict remains NOT READY.** The nine confirmed audit findings and the additional cache/deployment acceptance risks are not fixed by these GET passes. Original red unit/browser assertion counts remain unchanged; no automated tests were rerun.

Only this existing report was edited during this continuation. Application source/configuration, earlier reports, tests, ignored environment files and existing dirty tracked/untracked work were preserved. Git remains main...origin/main with the same16 pre-existing tracked modified paths and previously recorded untracked files. No server restart, dependency install, commit/push/pull/merge/reset or deployment. The same shared tab was retained on the filtered read-only Audit Logs view for handoff.

## Appendix A — complete authoritative operation inventory

Source SHA-256: `ed9261cb9e3e3df085e9be2c4642fa555f22fdcb6dc1a1baef697fbccd5656c2`. 81 operations, 64 paths, 112 named schemas. No undocumented internal/outbox endpoint inferred.

| # | Operation (relative to /api/v1) | Classification |
| --- | --- | --- |
| 1 | GET `/health` | Internal/operational; no Dashboard consumer |
| 2 | POST `/auth/login` | Admin-only authentication (both roles) |
| 3 | POST `/auth/refresh` | Admin-only authentication (both roles) |
| 4 | POST `/auth/logout` | Admin-only authentication (both roles) |
| 5 | GET `/auth/me` | Admin-only authentication (both roles) |
| 6 | POST `/auth/change-password` | Admin-only authentication (both roles) |
| 7 | POST `/analytics/events` | Public Website-only; NOT APPLICABLE |
| 8 | GET `/admin/analytics/summary` | SUPER_ADMIN-only |
| 9 | GET `/admin/analytics/journeys` | SUPER_ADMIN-only |
| 10 | GET `/faqs` | Public Website-only; NOT APPLICABLE |
| 11 | GET `/countries/{slug}/faqs` | Public Website-only; NOT APPLICABLE |
| 12 | GET `/universities/{slug}/faqs` | Public Website-only; NOT APPLICABLE |
| 13 | GET `/services/{slug}/faqs` | Public Website-only; NOT APPLICABLE |
| 14 | GET `/scholarships/{slug}/faqs` | Public Website-only; NOT APPLICABLE |
| 15 | GET `/admin/faqs` | Shared ADMIN/SUPER_ADMIN |
| 16 | POST `/admin/faqs` | Shared ADMIN/SUPER_ADMIN |
| 17 | PATCH `/admin/faqs/{id}` | Shared ADMIN/SUPER_ADMIN |
| 18 | PATCH `/admin/faqs/order` | Shared ADMIN/SUPER_ADMIN |
| 19 | GET `/universities/filter-options` | Public Website-only; NOT APPLICABLE |
| 20 | GET `/universities/{slug}/programs` | Public Website-only; NOT APPLICABLE |
| 21 | GET `/admin/universities/{universityId}/programs` | Shared ADMIN/SUPER_ADMIN |
| 22 | POST `/admin/universities/{universityId}/programs` | Shared ADMIN/SUPER_ADMIN |
| 23 | PATCH `/admin/university-programs/{id}` | Shared ADMIN/SUPER_ADMIN |
| 24 | GET `/admin/academic-majors` | Shared ADMIN/SUPER_ADMIN |
| 25 | POST `/admin/academic-majors` | Shared ADMIN/SUPER_ADMIN |
| 26 | GET `/admin/cities` | Shared ADMIN/SUPER_ADMIN |
| 27 | POST `/admin/cities` | Shared ADMIN/SUPER_ADMIN |
| 28 | GET `/universities/{slug}/admission-requirements` | Public Website-only; NOT APPLICABLE |
| 29 | GET `/universities/{slug}/gallery` | Public Website-only; NOT APPLICABLE |
| 30 | GET `/admin/universities/{universityId}/admission-requirements` | Shared ADMIN/SUPER_ADMIN |
| 31 | POST `/admin/universities/{universityId}/admission-requirements` | Shared ADMIN/SUPER_ADMIN |
| 32 | PATCH `/admin/university-admission-requirements/{id}` | Shared ADMIN/SUPER_ADMIN |
| 33 | GET `/admin/universities/{universityId}/gallery` | Shared ADMIN/SUPER_ADMIN |
| 34 | POST `/admin/universities/{universityId}/gallery` | Shared ADMIN/SUPER_ADMIN |
| 35 | PATCH `/admin/university-gallery/{id}` | Shared ADMIN/SUPER_ADMIN |
| 36 | DELETE `/admin/university-gallery/{id}` | Shared ADMIN/SUPER_ADMIN |
| 37 | PATCH `/admin/universities/{universityId}/gallery/order` | Shared ADMIN/SUPER_ADMIN |
| 38 | GET `/admin/users` | SUPER_ADMIN-only |
| 39 | PATCH `/admin/users/{id}` | SUPER_ADMIN-only |
| 40 | GET `/admin/audit-logs` | SUPER_ADMIN-only |
| 41 | POST `/admin/uploads/images` | Shared ADMIN/SUPER_ADMIN |
| 42 | GET `/site-settings` | Public consumed by Admin |
| 43 | PATCH `/admin/site-settings` | SUPER_ADMIN-only |
| 44 | POST `/applications` | Public Website-only; NOT APPLICABLE |
| 45 | POST `/inquiries` | Public Website-only; NOT APPLICABLE |
| 46 | GET `/admin/applications` | Shared ADMIN/SUPER_ADMIN |
| 47 | GET `/admin/applications/{id}` | Shared ADMIN/SUPER_ADMIN |
| 48 | PATCH `/admin/applications/{id}/status` | Shared ADMIN/SUPER_ADMIN |
| 49 | GET `/admin/inquiries` | Shared ADMIN/SUPER_ADMIN |
| 50 | GET `/admin/inquiries/{id}` | Shared ADMIN/SUPER_ADMIN |
| 51 | PATCH `/admin/inquiries/{id}/status` | Shared ADMIN/SUPER_ADMIN |
| 52 | GET `/countries` | Public Website-only; NOT APPLICABLE |
| 53 | GET `/countries/{slug}` | Public Website-only; NOT APPLICABLE |
| 54 | GET `/admin/countries` | Shared ADMIN/SUPER_ADMIN |
| 55 | POST `/admin/countries` | Shared ADMIN/SUPER_ADMIN |
| 56 | GET `/admin/countries/{id}` | Shared ADMIN/SUPER_ADMIN |
| 57 | PATCH `/admin/countries/{id}` | Shared ADMIN/SUPER_ADMIN |
| 58 | GET `/universities` | Public Website-only; NOT APPLICABLE |
| 59 | GET `/universities/{slug}` | Public Website-only; NOT APPLICABLE |
| 60 | GET `/admin/universities` | Shared ADMIN/SUPER_ADMIN |
| 61 | POST `/admin/universities` | Shared ADMIN/SUPER_ADMIN |
| 62 | GET `/admin/universities/{id}` | Shared ADMIN/SUPER_ADMIN |
| 63 | PATCH `/admin/universities/{id}` | Shared ADMIN/SUPER_ADMIN |
| 64 | GET `/scholarships` | Public Website-only; NOT APPLICABLE |
| 65 | GET `/scholarships/{slug}` | Public Website-only; NOT APPLICABLE |
| 66 | GET `/admin/scholarships` | Shared ADMIN/SUPER_ADMIN |
| 67 | POST `/admin/scholarships` | Shared ADMIN/SUPER_ADMIN |
| 68 | GET `/admin/scholarships/{id}` | Shared ADMIN/SUPER_ADMIN |
| 69 | PATCH `/admin/scholarships/{id}` | Shared ADMIN/SUPER_ADMIN |
| 70 | GET `/services` | Public Website-only; NOT APPLICABLE |
| 71 | GET `/services/{slug}` | Public Website-only; NOT APPLICABLE |
| 72 | GET `/admin/services` | Shared ADMIN/SUPER_ADMIN |
| 73 | POST `/admin/services` | Shared ADMIN/SUPER_ADMIN |
| 74 | GET `/admin/services/{id}` | Shared ADMIN/SUPER_ADMIN |
| 75 | PATCH `/admin/services/{id}` | Shared ADMIN/SUPER_ADMIN |
| 76 | GET `/articles` | Public Website-only; NOT APPLICABLE |
| 77 | GET `/articles/{slug}` | Public Website-only; NOT APPLICABLE |
| 78 | GET `/admin/articles` | Shared ADMIN/SUPER_ADMIN |
| 79 | POST `/admin/articles` | Shared ADMIN/SUPER_ADMIN |
| 80 | GET `/admin/articles/{id}` | Shared ADMIN/SUPER_ADMIN |
| 81 | PATCH `/admin/articles/{id}` | Shared ADMIN/SUPER_ADMIN |

## Appendix B — every Dashboard-relevant operation

Evidence aliases: C=original content/mock + four content transport tests; P1=Phase1; P2=Phase2; P3=Phase3; P4=Phase4; A=accepted authentication evidence. See main report for exact test/live boundaries and superseding audit FAILs. FULLY IMPLEMENTED describes the implemented contract surface with local evidence, NOT production persistence. Every production write remains unverified. Named request/response schemas and all property constraints follow in Appendix C; no schema reference is a blanket field-level PASS.

| Module | Method/path | Role | API → hooks → UI | Parameters covered / omitted | Request fields | Response fields handled / caveat | Status | Evidence | Missing/blocked |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | POST `/auth/login` | ADMIN / SUPER_ADMIN | lib/api-client/auth.ts → session/login/logout hooks → protected shell/Login | —; cookies per OpenAPI; no JS tokens | LoginRequest: email, password | AuthUserResponse: user | FULLY IMPLEMENTED | A; audit findings supersede | No additional field gap identified; coverage is sampled, not exhaustive live acceptance |
| Auth | POST `/auth/refresh` | ADMIN / SUPER_ADMIN | lib/api-client/auth.ts → session/login/logout hooks → protected shell/Login | —; cookies per OpenAPI; no JS tokens | inline: — | AuthUserResponse: user | FULLY IMPLEMENTED | A; audit findings supersede | No additional field gap identified; coverage is sampled, not exhaustive live acceptance |
| Auth | POST `/auth/logout` | ADMIN / SUPER_ADMIN | lib/api-client/auth.ts → session/login/logout hooks → protected shell/Login | —; cookies per OpenAPI; no JS tokens | inline: — | EmptySuccessResponse: — | FULLY IMPLEMENTED | A; audit findings supersede | No additional field gap identified; coverage is sampled, not exhaustive live acceptance |
| Auth | GET `/auth/me` | ADMIN / SUPER_ADMIN | lib/api-client/auth.ts → session/login/logout hooks → protected shell/Login | —; cookies per OpenAPI; no JS tokens | inline: — | AuthUserResponse: user | FULLY IMPLEMENTED | A; audit findings supersede | No additional field gap identified; coverage is sampled, not exhaustive live acceptance |
| Auth | POST `/auth/change-password` | ADMIN / SUPER_ADMIN | No frontend consumer | —; cookies per OpenAPI; no JS tokens | ChangePasswordRequest: currentPassword, newPassword | EmptySuccessResponse: — | MISSING | new contract/source FAIL; audit findings supersede | AUD-05: allowlisted by proxy only; no API/hook/form |
| Analytics | GET `/admin/analytics/summary` | SUPER_ADMIN | lib/api-client/phase4.ts → use-phase4-queries → /admin/analytics | query:from, query:to, query:granularity, query:topLimit | inline: — | AnalyticsSummaryResponse: range, totals, topPages, trafficSources, ctaEngagement, clientReportedConversions, serverVerifiedConversions, conversionRates, funnel, trends | BACKEND BLOCKED | P4; audit findings supersede | Existing live HTTP500; frontend mocked PASS |
| Analytics | GET `/admin/analytics/journeys` | SUPER_ADMIN | lib/api-client/phase4.ts → use-phase4-queries → /admin/analytics | query:from, query:to, query:granularity, query:topLimit, query:page, query:limit | inline: — | AnalyticsJourneyResponse: sessionId, startedAt, endedAt, eventCount, truncated, clientReportedApplication, clientReportedInquiry, steps; pagination page/limit/total/totalPages | PARTIALLY IMPLEMENTED | P4; audit findings supersede | ctaId/engagementType schema blocked; not rendered |
| FAQs | GET `/admin/faqs` | ADMIN / SUPER_ADMIN | lib/api-client/faqs.ts → faq hooks → /admin/faqs | query:scope*, query:parentId, query:page, query:limit, query:status | inline: — | AdminFaqListResponse: id, scope, questionAr, answerAr, questionEn, answerEn, displayOrder, publishedAt, parentId, status, createdAt, updatedAt; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | P3 + live continuation §11; audit findings supersede | GLOBAL/University field and API page2 live PASS; three sampled scoped parents empty; record-dependent checks BLOCKED; no live writes |
| FAQs | POST `/admin/faqs` | ADMIN / SUPER_ADMIN | lib/api-client/faqs.ts → faq hooks → /admin/faqs | — | FaqCreateRequest: scope, parentId, questionAr, answerAr, questionEn, answerEn, status | AdminFaqResponse: id, scope, questionAr, answerAr, questionEn, answerEn, displayOrder, publishedAt, parentId, status, createdAt, updatedAt | FULLY IMPLEMENTED | P3; audit findings supersede | Live baseline GLOBAL only; scoped/order writes mocked |
| FAQs | PATCH `/admin/faqs/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/faqs.ts → faq hooks → /admin/faqs | path:id* | FaqUpdateRequest: questionAr, answerAr, questionEn, answerEn, status | AdminFaqResponse: id, scope, questionAr, answerAr, questionEn, answerEn, displayOrder, publishedAt, parentId, status, createdAt, updatedAt | FULLY IMPLEMENTED | P3; audit findings supersede | Live baseline GLOBAL only; scoped/order writes mocked |
| FAQs | PATCH `/admin/faqs/order` | ADMIN / SUPER_ADMIN | lib/api-client/faqs.ts → faq hooks → /admin/faqs | — | FaqReorderRequest: scope, parentId, orderedIds | FaqOrderResponse: id, scope, questionAr, answerAr, questionEn, answerEn, displayOrder, publishedAt, parentId, status, createdAt, updatedAt; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | P3; audit findings supersede | Live baseline GLOBAL only; scoped/order writes mocked |
| University sections | GET `/admin/universities/{universityId}/programs` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:universityId*, query:page, query:limit, query:search, query:studyLevel, query:language, query:faculty, query:status | inline: — | AdminUniversityProgramListResponse: id, nameAr, nameEn, facultyNameAr, facultyNameEn, durationValue, durationUnit, academicMajor, studyLevel, languages, officialSourceUrl, verifiedAt, publishedAt, tuition, tuitionFees, universityId, academicMajorId, status, createdAt, updatedAt; pagination page/limit/total/totalPages; tuition/tuitionFees opaque | PARTIALLY IMPLEMENTED | P2; audit findings supersede | Tuition response/history BACKEND BLOCKED; input supports one-year upsert |
| University sections | POST `/admin/universities/{universityId}/programs` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:universityId* | UniversityProgramCreateRequest: academicMajorId, nameAr, nameEn, facultyNameAr, facultyNameEn, durationValue, durationUnit, studyLevel, languages, status, officialSourceUrl, verifiedAt, tuition | AdminUniversityProgramResponse: id, nameAr, nameEn, facultyNameAr, facultyNameEn, durationValue, durationUnit, academicMajor, studyLevel, languages, officialSourceUrl, verifiedAt, publishedAt, tuition, tuitionFees, universityId, academicMajorId, status, createdAt, updatedAt; tuition/tuitionFees opaque | PARTIALLY IMPLEMENTED | P2; audit findings supersede | Tuition response/history BACKEND BLOCKED; input supports one-year upsert |
| University sections | PATCH `/admin/university-programs/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:id* | UniversityProgramUpdateRequest: academicMajorId, nameAr, nameEn, facultyNameAr, facultyNameEn, durationValue, durationUnit, studyLevel, languages, status, officialSourceUrl, verifiedAt, tuition | AdminUniversityProgramResponse: id, nameAr, nameEn, facultyNameAr, facultyNameEn, durationValue, durationUnit, academicMajor, studyLevel, languages, officialSourceUrl, verifiedAt, publishedAt, tuition, tuitionFees, universityId, academicMajorId, status, createdAt, updatedAt; tuition/tuitionFees opaque | PARTIALLY IMPLEMENTED | P2; audit findings supersede | Tuition response/history BACKEND BLOCKED; input supports one-year upsert |
| Catalogs | GET `/admin/academic-majors` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → directory hooks → /admin/academic-majors or /admin/cities | query:page, query:limit, query:search | inline: — | AcademicMajorListResponse: id, slug, nameAr, nameEn, category, createdAt, updatedAt; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | P2; audit findings supersede | Create mocked only; no edit/delete API |
| Catalogs | POST `/admin/academic-majors` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → directory hooks → /admin/academic-majors or /admin/cities | — | AcademicMajorCreateRequest: slug, nameAr, nameEn, category | AcademicMajorResponse: id, slug, nameAr, nameEn, category, createdAt, updatedAt | FULLY IMPLEMENTED | P2; audit findings supersede | Create mocked only; no edit/delete API |
| Catalogs | GET `/admin/cities` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → directory hooks → /admin/academic-majors or /admin/cities | query:page, query:limit, query:search, query:countryId | inline: — | CityListResponse: id, countryId, slug, nameAr, nameEn, createdAt, updatedAt, country; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | P2; audit findings supersede | Create mocked only; no edit/delete API |
| Catalogs | POST `/admin/cities` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → directory hooks → /admin/academic-majors or /admin/cities | — | CityCreateRequest: countryId, slug, nameAr, nameEn | CityResponse: id, countryId, slug, nameAr, nameEn, createdAt, updatedAt, country | FULLY IMPLEMENTED | P2; audit findings supersede | Create mocked only; no edit/delete API |
| University sections | GET `/admin/universities/{universityId}/admission-requirements` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:universityId*, query:page, query:limit, query:status, query:scope | inline: — | AdminUniversityAdmissionRequirementListResponse: id, scope, studyLevel, programId, contentAr, contentEn, officialSourceUrl, verifiedAt, publishedAt, program, universityId, status, createdAt, updatedAt; pagination page/limit/total/totalPages | PARTIALLY IMPLEMENTED | P2; audit findings supersede | Nullable studyLevel schema BACKEND BLOCKED |
| University sections | POST `/admin/universities/{universityId}/admission-requirements` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:universityId* | UniversityAdmissionRequirementCreateRequest: scope, studyLevel, programId, contentAr, contentEn, status, officialSourceUrl, verifiedAt | AdminUniversityAdmissionRequirementResponse: id, scope, studyLevel, programId, contentAr, contentEn, officialSourceUrl, verifiedAt, publishedAt, program, universityId, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | P2; audit findings supersede | Nullable studyLevel schema BACKEND BLOCKED |
| University sections | PATCH `/admin/university-admission-requirements/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:id* | UniversityAdmissionRequirementUpdateRequest: contentAr, contentEn, status, officialSourceUrl, verifiedAt | AdminUniversityAdmissionRequirementResponse: id, scope, studyLevel, programId, contentAr, contentEn, officialSourceUrl, verifiedAt, publishedAt, program, universityId, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | P2; audit findings supersede | Nullable studyLevel schema BACKEND BLOCKED |
| University sections | GET `/admin/universities/{universityId}/gallery` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:universityId*, query:page, query:limit, query:status | inline: — | AdminUniversityGalleryListResponse: id, imageUrl, altAr, altEn, displayOrder, publishedAt, universityId, status, createdAt, updatedAt; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | P2; audit findings supersede | Existing invalid Gallery asset; >100 full-order limitation; writes mocked only |
| University sections | POST `/admin/universities/{universityId}/gallery` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:universityId* | UniversityGalleryImageCreateRequest: imageUrl, altAr, altEn, status | AdminUniversityGalleryResponse: id, imageUrl, altAr, altEn, displayOrder, publishedAt, universityId, status, createdAt, updatedAt | FULLY IMPLEMENTED | P2; audit findings supersede | Existing invalid Gallery asset; >100 full-order limitation; writes mocked only |
| University sections | PATCH `/admin/university-gallery/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:id* | UniversityGalleryImageUpdateRequest: imageUrl, altAr, altEn, status | AdminUniversityGalleryResponse: id, imageUrl, altAr, altEn, displayOrder, publishedAt, universityId, status, createdAt, updatedAt | FULLY IMPLEMENTED | P2; audit findings supersede | Existing invalid Gallery asset; >100 full-order limitation; writes mocked only |
| University sections | DELETE `/admin/university-gallery/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:id* | inline: — | AdminUniversityGalleryDetachResponse: id | FULLY IMPLEMENTED | P2; audit findings supersede | Existing invalid Gallery asset; >100 full-order limitation; writes mocked only |
| University sections | PATCH `/admin/universities/{universityId}/gallery/order` | ADMIN / SUPER_ADMIN | lib/api-client/university-management.ts → university-management hooks → UniversityWorkspace/SectionEditor | path:universityId* | UniversityGalleryReorderRequest: orderedIds | AdminUniversityGalleryReorderResponse: id, imageUrl, altAr, altEn, displayOrder, publishedAt, universityId, status, createdAt, updatedAt; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | P2; audit findings supersede | Existing invalid Gallery asset; >100 full-order limitation; writes mocked only |
| Accounts | GET `/admin/users` | SUPER_ADMIN | lib/api-client/phase4.ts → phase4/account hooks → /admin/admins | query:page, query:limit | inline: — | ManagedAdminAccountListResponse: id, name, email, role, isActive; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | P4; audit findings supersede | PATCH only isolated/intercepted; no production account change |
| Accounts | PATCH `/admin/users/{id}` | SUPER_ADMIN | lib/api-client/phase4.ts → phase4/account hooks → /admin/admins | path:id* | AdminAccountUpdateRequest: isActive, role | ManagedAdminAccountResponse: id, name, email, role, isActive | FULLY IMPLEMENTED | P4; audit findings supersede | PATCH only isolated/intercepted; no production account change |
| Audit | GET `/admin/audit-logs` | SUPER_ADMIN | lib/api-client/phase4.ts → useAuditLogs → /admin/audit-log | query:page, query:limit, query:actorId, query:action, query:resourceType, query:from, query:to | inline: — | AdminAuditLogListResponse: id, actorAdminId, action, resourceType, resourceId, metadata, createdAt, actor; pagination page/limit/total/totalPages | PARTIALLY IMPLEMENTED | P4; audit findings supersede | AUD-09: safe metadata incorrectly omits RESOLVED |
| Media | POST `/admin/uploads/images` | ADMIN / SUPER_ADMIN | lib/api-client/images.ts → use-image-upload → ImageUpload in all five editors + Gallery | — | ImageUploadRequest: resource, file | ImageUploadResponse: assetId, publicId, secureUrl, format, bytes, width, height | FULLY IMPLEMENTED | P2; audit findings supersede | No live upload acceptance; no standalone media library contract |
| Settings | GET `/site-settings` | Public GET; both roles view | lib/api-client/site-settings.ts → site-settings hooks → /admin/settings | — | inline: — | SiteSettingsResponse: academyNameAr, academyNameEn, contactEmail, contactPhone, addressAr, addressEn, facebookUrl, instagramUrl, linkedinUrl, youtubeUrl, updatedAt | FULLY IMPLEMENTED | P3; audit findings supersede | Minor documented contract clarifications; no live PATCH acceptance |
| Settings | PATCH `/admin/site-settings` | SUPER_ADMIN | lib/api-client/site-settings.ts → site-settings hooks → /admin/settings | — | SiteSettingsUpdateRequest: academyNameAr, academyNameEn, contactEmail, contactPhone, addressAr, addressEn, facebookUrl, instagramUrl, linkedinUrl, youtubeUrl | SiteSettingsResponse: academyNameAr, academyNameEn, contactEmail, contactPhone, addressAr, addressEn, facebookUrl, instagramUrl, linkedinUrl, youtubeUrl, updatedAt | FULLY IMPLEMENTED | P3; audit findings supersede | Minor documented contract clarifications; no live PATCH acceptance |
| Submissions | GET `/admin/applications` | ADMIN / SUPER_ADMIN | lib/api-client/submissions.ts → submission hooks → /admin/applications or /admin/inquiries | query:page, query:limit, query:status, query:sort, query:applicationType | inline: — | StudentApplicationListResponse: id, applicationType, scholarshipId, countryId, universityId, studyLevel, intendedMajor, fullName, email, phone, message, status, internalNote, privacyAcceptedAt, createdAt, updatedAt; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | P1; audit findings supersede | No search contract; status/note writes mocked only |
| Submissions | GET `/admin/applications/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/submissions.ts → submission hooks → /admin/applications or /admin/inquiries | path:id* | inline: — | StudentApplicationResponse: id, applicationType, scholarshipId, countryId, universityId, studyLevel, intendedMajor, fullName, email, phone, message, status, internalNote, privacyAcceptedAt, createdAt, updatedAt | FULLY IMPLEMENTED | P1; audit findings supersede | No search contract; status/note writes mocked only |
| Submissions | PATCH `/admin/applications/{id}/status` | ADMIN / SUPER_ADMIN | lib/api-client/submissions.ts → submission hooks → /admin/applications or /admin/inquiries | path:id* | SubmissionStatusUpdateRequest: status, internalNote | StudentApplicationResponse: id, applicationType, scholarshipId, countryId, universityId, studyLevel, intendedMajor, fullName, email, phone, message, status, internalNote, privacyAcceptedAt, createdAt, updatedAt | FULLY IMPLEMENTED | P1; audit findings supersede | No search contract; status/note writes mocked only |
| Submissions | GET `/admin/inquiries` | ADMIN / SUPER_ADMIN | lib/api-client/submissions.ts → submission hooks → /admin/applications or /admin/inquiries | query:page, query:limit, query:status, query:sort | inline: — | GeneralInquiryListResponse: id, fullName, email, phone, subject, message, status, internalNote, privacyAcceptedAt, createdAt, updatedAt; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | P1; audit findings supersede | No search contract; status/note writes mocked only |
| Submissions | GET `/admin/inquiries/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/submissions.ts → submission hooks → /admin/applications or /admin/inquiries | path:id* | inline: — | GeneralInquiryResponse: id, fullName, email, phone, subject, message, status, internalNote, privacyAcceptedAt, createdAt, updatedAt | FULLY IMPLEMENTED | P1; audit findings supersede | No search contract; status/note writes mocked only |
| Submissions | PATCH `/admin/inquiries/{id}/status` | ADMIN / SUPER_ADMIN | lib/api-client/submissions.ts → submission hooks → /admin/applications or /admin/inquiries | path:id* | SubmissionStatusUpdateRequest: status, internalNote | GeneralInquiryResponse: id, fullName, email, phone, subject, message, status, internalNote, privacyAcceptedAt, createdAt, updatedAt | FULLY IMPLEMENTED | P1; audit findings supersede | No search contract; status/note writes mocked only |
| countries | GET `/admin/countries` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/countries (list/new/UUID editor) | query:page, query:limit, query:search, query:featured, query:sort, query:status | inline: — | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, nameAr, nameEn, introductionAr, introductionEn, detailsAr, detailsEn, imageUrl, imageAltAr, imageAltEn, displayOrder, status, createdAt, updatedAt; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | C; audit findings supersede | Original mock evidence; new SUPER_ADMIN baseline GET/UI evidence |
| countries | POST `/admin/countries` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/countries (list/new/UUID editor) | — | CountryCreateRequest: nameAr, nameEn, introductionAr, introductionEn, detailsAr, detailsEn, imageUrl, imageAltAr, imageAltEn, displayOrder, slug, featured, status, seoTitleAr, seoDescriptionAr | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, nameAr, nameEn, introductionAr, introductionEn, detailsAr, detailsEn, imageUrl, imageAltAr, imageAltEn, displayOrder, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | C; audit findings supersede | AUD-03 slug min2 not enforced; full baseline PATCH |
| countries | GET `/admin/countries/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/countries (list/new/UUID editor) | path:id* | inline: — | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, nameAr, nameEn, introductionAr, introductionEn, detailsAr, detailsEn, imageUrl, imageAltAr, imageAltEn, displayOrder, status, createdAt, updatedAt | FULLY IMPLEMENTED | C; audit findings supersede | Original mock evidence; new SUPER_ADMIN baseline GET/UI evidence |
| countries | PATCH `/admin/countries/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/countries (list/new/UUID editor) | path:id* | CountryPatchRequest: nameAr, nameEn, introductionAr, introductionEn, detailsAr, detailsEn, imageUrl, imageAltAr, imageAltEn, displayOrder, slug, featured, status, seoTitleAr, seoDescriptionAr | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, nameAr, nameEn, introductionAr, introductionEn, detailsAr, detailsEn, imageUrl, imageAltAr, imageAltEn, displayOrder, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | C; audit findings supersede | AUD-03 slug min2 not enforced; full baseline PATCH |
| universities | GET `/admin/universities` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/universities (list/new/UUID editor) | query:page, query:limit, query:search, query:country, query:major, query:studyLevel, query:language, query:city, query:universityType, query:featured, query:sort, query:status | inline: — | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, nameAr, nameEn, officialName, countryId, cityId, universityType, cityAr, cityEn, overviewAr, overviewEn, officialWebsite, imageUrl, imageAltAr, imageAltEn, country, city, status, createdAt, updatedAt; pagination page/limit/total/totalPages | PARTIALLY IMPLEMENTED | C; audit findings supersede | Nullable type clearing BACKEND BLOCKED; full PATCH baseline, not changed-fields diff |
| universities | POST `/admin/universities` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/universities (list/new/UUID editor) | — | UniversityCreateRequest: nameAr, nameEn, officialName, countryId, cityId, universityType, cityAr, cityEn, overviewAr, overviewEn, officialWebsite, imageUrl, imageAltAr, imageAltEn, slug, featured, status, seoTitleAr, seoDescriptionAr | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, nameAr, nameEn, officialName, countryId, cityId, universityType, cityAr, cityEn, overviewAr, overviewEn, officialWebsite, imageUrl, imageAltAr, imageAltEn, country, city, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | C; audit findings supersede | Nullable type clearing BACKEND BLOCKED; full PATCH baseline, not changed-fields diff |
| universities | GET `/admin/universities/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/universities (list/new/UUID editor) | path:id* | inline: — | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, nameAr, nameEn, officialName, countryId, cityId, universityType, cityAr, cityEn, overviewAr, overviewEn, officialWebsite, imageUrl, imageAltAr, imageAltEn, country, city, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | C; audit findings supersede | Nullable type clearing BACKEND BLOCKED; full PATCH baseline, not changed-fields diff |
| universities | PATCH `/admin/universities/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/universities (list/new/UUID editor) | path:id* | UniversityPatchRequest: nameAr, nameEn, officialName, countryId, cityId, universityType, cityAr, cityEn, overviewAr, overviewEn, officialWebsite, imageUrl, imageAltAr, imageAltEn, slug, featured, status, seoTitleAr, seoDescriptionAr | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, nameAr, nameEn, officialName, countryId, cityId, universityType, cityAr, cityEn, overviewAr, overviewEn, officialWebsite, imageUrl, imageAltAr, imageAltEn, country, city, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | C; audit findings supersede | Nullable type clearing BACKEND BLOCKED; full PATCH baseline, not changed-fields diff |
| scholarships | GET `/admin/scholarships` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/scholarships (list/new/UUID editor) | query:page, query:limit, query:search, query:country, query:university, query:studyLevel, query:fundingType, query:applicationStatus, query:featured, query:universitySearch, query:universityCountry, query:universityMajor, query:universityStudyLevel, query:universityLanguage, query:universityCity, query:universityType, query:universityFeatured, query:sort, query:status; OMITTED: universitySearch,universityCountry,universityMajor,universityStudyLevel,universityLanguage,universityCity,universityType,universityFeatured | inline: — | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, countryId, universityId, studyLevel, fundingType, requirementsAr, requirementsEn, descriptionAr, descriptionEn, verifiedDeadline, imageUrl, imageAltAr, imageAltEn, officialSourceUrl, applicationStatus, effectiveApplicationStatus, country, university, status, createdAt, updatedAt; pagination page/limit/total/totalPages | PARTIALLY IMPLEMENTED | C; audit findings supersede | AUD-04: eight university* filters missing |
| scholarships | POST `/admin/scholarships` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/scholarships (list/new/UUID editor) | — | ScholarshipCreateRequest: titleAr, titleEn, countryId, universityId, studyLevel, fundingType, requirementsAr, requirementsEn, descriptionAr, descriptionEn, imageUrl, imageAltAr, imageAltEn, verifiedDeadline, officialSourceUrl, applicationStatus, slug, featured, status, seoTitleAr, seoDescriptionAr | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, countryId, universityId, studyLevel, fundingType, requirementsAr, requirementsEn, descriptionAr, descriptionEn, verifiedDeadline, imageUrl, imageAltAr, imageAltEn, officialSourceUrl, applicationStatus, effectiveApplicationStatus, country, university, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | C; audit findings supersede | AUD-02 deadline; AUD-06 stale University; AUD-03 slug; full baseline PATCH |
| scholarships | GET `/admin/scholarships/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/scholarships (list/new/UUID editor) | path:id* | inline: — | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, countryId, universityId, studyLevel, fundingType, requirementsAr, requirementsEn, descriptionAr, descriptionEn, verifiedDeadline, imageUrl, imageAltAr, imageAltEn, officialSourceUrl, applicationStatus, effectiveApplicationStatus, country, university, status, createdAt, updatedAt | FULLY IMPLEMENTED | C; audit findings supersede | Core fields mapped; current detail mapping newly live checked |
| scholarships | PATCH `/admin/scholarships/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/scholarships (list/new/UUID editor) | path:id* | ScholarshipPatchRequest: titleAr, titleEn, countryId, universityId, studyLevel, fundingType, requirementsAr, requirementsEn, descriptionAr, descriptionEn, imageUrl, imageAltAr, imageAltEn, verifiedDeadline, officialSourceUrl, applicationStatus, slug, featured, status, seoTitleAr, seoDescriptionAr | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, countryId, universityId, studyLevel, fundingType, requirementsAr, requirementsEn, descriptionAr, descriptionEn, verifiedDeadline, imageUrl, imageAltAr, imageAltEn, officialSourceUrl, applicationStatus, effectiveApplicationStatus, country, university, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | C; audit findings supersede | AUD-02 deadline; AUD-06 stale University; AUD-03 slug; full baseline PATCH |
| services | GET `/admin/services` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/services (list/new/UUID editor) | query:page, query:limit, query:featured, query:sort, query:status | inline: — | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, summaryAr, summaryEn, descriptionAr, descriptionEn, imageUrl, imageAltAr, imageAltEn, displayOrder, status, createdAt, updatedAt; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | C; audit findings supersede | Original mock evidence; new SUPER_ADMIN baseline GET/UI evidence |
| services | POST `/admin/services` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/services (list/new/UUID editor) | — | ServiceCreateRequest: titleAr, titleEn, summaryAr, summaryEn, descriptionAr, descriptionEn, imageUrl, imageAltAr, imageAltEn, displayOrder, slug, featured, status, seoTitleAr, seoDescriptionAr | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, summaryAr, summaryEn, descriptionAr, descriptionEn, imageUrl, imageAltAr, imageAltEn, displayOrder, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | C; audit findings supersede | AUD-03 slug min2 not enforced; full baseline PATCH |
| services | GET `/admin/services/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/services (list/new/UUID editor) | path:id* | inline: — | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, summaryAr, summaryEn, descriptionAr, descriptionEn, imageUrl, imageAltAr, imageAltEn, displayOrder, status, createdAt, updatedAt | FULLY IMPLEMENTED | C; audit findings supersede | Original mock evidence; new SUPER_ADMIN baseline GET/UI evidence |
| services | PATCH `/admin/services/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/services (list/new/UUID editor) | path:id* | ServicePatchRequest: titleAr, titleEn, summaryAr, summaryEn, descriptionAr, descriptionEn, imageUrl, imageAltAr, imageAltEn, displayOrder, slug, featured, status, seoTitleAr, seoDescriptionAr | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, summaryAr, summaryEn, descriptionAr, descriptionEn, imageUrl, imageAltAr, imageAltEn, displayOrder, status, createdAt, updatedAt | PARTIALLY IMPLEMENTED | C; audit findings supersede | AUD-03 slug min2 not enforced; full baseline PATCH |
| articles | GET `/admin/articles` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/articles (list/new/UUID editor) | query:page, query:limit, query:search, query:country, query:featured, query:sort, query:status | inline: — | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, summaryAr, summaryEn, bodyAr, bodyEn, coverImageUrl, coverImageAltAr, coverImageAltEn, countryId, universityId, scholarshipId, country, university, scholarship, status, createdAt, updatedAt; pagination page/limit/total/totalPages | FULLY IMPLEMENTED | C; audit findings supersede | AUD-01: ordered scholarshipIds/relatedScholarships absent from adapter/UI; AUD-03 slug |
| articles | POST `/admin/articles` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/articles (list/new/UUID editor) | — | ArticleCreateRequest: titleAr, titleEn, summaryAr, summaryEn, bodyAr, bodyEn, coverImageUrl, coverImageAltAr, coverImageAltEn, countryId, universityId, scholarshipId, scholarshipIds, slug, featured, status, seoTitleAr, seoDescriptionAr (scholarshipIds MISSING; legacy field only) | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, summaryAr, summaryEn, bodyAr, bodyEn, coverImageUrl, coverImageAltAr, coverImageAltEn, countryId, universityId, scholarshipId, country, university, scholarship, status, createdAt, updatedAt, scholarshipIds, relatedScholarships | PARTIALLY IMPLEMENTED | C; audit findings supersede | AUD-01: ordered scholarshipIds/relatedScholarships absent from adapter/UI; AUD-03 slug |
| articles | GET `/admin/articles/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/articles (list/new/UUID editor) | path:id* | inline: — | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, summaryAr, summaryEn, bodyAr, bodyEn, coverImageUrl, coverImageAltAr, coverImageAltEn, countryId, universityId, scholarshipId, country, university, scholarship, status, createdAt, updatedAt, scholarshipIds, relatedScholarships; scholarshipIds/relatedScholarships NOT modeled/displayed | PARTIALLY IMPLEMENTED | C; audit findings supersede | AUD-01: ordered scholarshipIds/relatedScholarships absent from adapter/UI; AUD-03 slug |
| articles | PATCH `/admin/articles/{id}` | ADMIN / SUPER_ADMIN | lib/api-client/content.ts → content hooks → /admin/articles (list/new/UUID editor) | path:id* | ArticlePatchRequest: titleAr, titleEn, summaryAr, summaryEn, bodyAr, bodyEn, coverImageUrl, coverImageAltAr, coverImageAltEn, countryId, universityId, scholarshipId, scholarshipIds, slug, featured, status, seoTitleAr, seoDescriptionAr (scholarshipIds MISSING; legacy field only) | inline: id, slug, featured, publishedAt, seoTitleAr, seoDescriptionAr, titleAr, titleEn, summaryAr, summaryEn, bodyAr, bodyEn, coverImageUrl, coverImageAltAr, coverImageAltEn, countryId, universityId, scholarshipId, country, university, scholarship, status, createdAt, updatedAt, scholarshipIds, relatedScholarships; scholarshipIds/relatedScholarships NOT modeled/displayed | PARTIALLY IMPLEMENTED | C; audit findings supersede | AUD-01: ordered scholarshipIds/relatedScholarships absent from adapter/UI; AUD-03 slug |

## Appendix C — exact contract constraints and response structure

This mechanically extracted appendix preserves required/optional/nullable fields, enums, formats, defaults, min/max/patterns, additionalProperties, composition, operation security, business descriptions and documented error statuses. It omits examples to avoid implying example data is required. Inheritance is explicit through $ref/allOf; contradictory definitions remain unchanged. Implementation exceptions are enumerated above and in the defect register; fields not displayed may legitimately be response-only IDs/timestamps, never editable payload fields.


### POST /auth/login

Validates an active administrator and sets host-only HttpOnly access and refresh cookies. Authentication credentials are never returned in JSON.

Security: `[]`. Errors/statuses: 200: Authentication succeeded.; 400: The request is invalid.; 401: Authentication failed or is required.; 403: The request is forbidden due to permissions or origin validation.; 415: The request body is not application/json..


Request application/json: `{"$ref":"#/components/schemas/LoginRequest"}`

Success response: `{"$ref":"#/components/schemas/AuthUserResponse"}`


### POST /auth/refresh

Consumes the current rotating refresh cookie, issues replacement access and refresh cookies, and returns the active administrator. Reused, expired, revoked, or inactive-account sessions are rejected.

Security: `[{"refreshCookie":[]}]`. Errors/statuses: 200: The refresh credential was rotated.; 401: Authentication failed or is required.; 403: The request is forbidden due to permissions or origin validation..

Success response: `{"$ref":"#/components/schemas/AuthUserResponse"}`


### POST /auth/logout

Revokes the supplied refresh session when present and clears both authentication cookies. The endpoint remains safe when no refresh cookie is present.

Security: `[{},{"refreshCookie":[]}]`. Errors/statuses: 200: Authentication cookies were cleared.; 403: The request is forbidden due to permissions or origin validation..

Success response: `{"$ref":"#/components/schemas/EmptySuccessResponse"}`


### GET /auth/me

Returns the administrator represented by a valid access cookie. The access JWT has a 15-minute lifetime.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Current administrator profile.; 401: Authentication failed or is required..

Success response: `{"$ref":"#/components/schemas/AuthUserResponse"}`


### POST /auth/change-password

Validates the current password, updates it, revokes refresh sessions, clears authentication cookies, and requires a new login.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Password changed, sessions revoked, and cookies cleared.; 400: The request is invalid.; 401: Authentication failed or is required.; 403: The request is forbidden due to permissions or origin validation.; 415: The request body is not application/json..


Request application/json: `{"$ref":"#/components/schemas/ChangePasswordRequest"}`

Success response: `{"$ref":"#/components/schemas/EmptySuccessResponse"}`


### GET /admin/analytics/summary

SUPER_ADMIN only. Returns bounded UTC traffic totals, top pages, acquisition attribution, CTA engagement, client-reported conversions, separately labeled server-verified submission totals, a simple event-stage funnel, and daily, weekly, or monthly trends. Date ranges are inclusive and limited to 366 days.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Anonymous aggregate analytics.; 400: The event or report query is invalid.; 401: Authentication is required.; 403: The public origin is not allowed or SUPER_ADMIN permission is required..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.from | no | `{"type":"string","format":"date","description":"UTC calendar date in YYYY-MM-DD format. The range is inclusive."}` |
| query.to | no | `{"type":"string","format":"date","description":"UTC calendar date in YYYY-MM-DD format. The range is inclusive."}` |
| query.granularity | no | `{"type":"string","enum":["day","week","month"],"default":"day"}` |
| query.topLimit | no | `{"type":"integer","minimum":1,"maximum":25,"default":10}` |
Success response: `{"$ref":"#/components/schemas/AnalyticsSummaryResponse"}`


### GET /admin/analytics/journeys

SUPER_ADMIN only. Returns paginated anonymous sessions ordered by latest event, with at most 100 allowlisted steps per session. No IP address, identity, form value, message, unrestricted metadata, or visitor fingerprint is returned.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Paginated anonymous journeys.; 400: The event or report query is invalid.; 401: Authentication is required.; 403: The public origin is not allowed or SUPER_ADMIN permission is required..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.from | no | `{"type":"string","format":"date","description":"UTC calendar date in YYYY-MM-DD format. The range is inclusive."}` |
| query.to | no | `{"type":"string","format":"date","description":"UTC calendar date in YYYY-MM-DD format. The range is inclusive."}` |
| query.granularity | no | `{"type":"string","enum":["day","week","month"],"default":"day"}` |
| query.topLimit | no | `{"type":"integer","minimum":1,"maximum":25,"default":10}` |
| query.page | no | `{"type":"integer","minimum":1,"default":1}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":20,"default":10}` |
Success response: `{"$ref":"#/components/schemas/AnalyticsJourneyResponse"}`


### GET /admin/faqs

ADMIN or SUPER_ADMIN only. GLOBAL requires no parentId; every resource scope requires its current content UUID. Includes drafts, published, and archived entries through bounded pagination.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Scoped administrative FAQ collection.; 400: FAQ validation or parent relationship error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and a trusted origin are required..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.scope | yes | `{"$ref":"#/components/schemas/FaqScope"}` |
| query.parentId | no | `{"type":["string","null"],"format":"uuid","default":null}` |
| query.page | no | `{"type":"integer","minimum":1,"default":1}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":100,"default":50}` |
| query.status | no | `{"$ref":"#/components/schemas/PublicationStatus"}` |
Success response: `{"$ref":"#/components/schemas/AdminFaqListResponse"}`


### POST /admin/faqs

ADMIN or SUPER_ADMIN only. The supplied parent UUID is validated against scope; GLOBAL accepts no parent. New entries append to the parent order. Full FAQ answers are never copied into audit metadata.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: FAQ created.; 400: FAQ validation or parent relationship error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and a trusted origin are required.; 415: The request body is not JSON..


Request application/json: `{"$ref":"#/components/schemas/FaqCreateRequest"}`

Success response: `{"$ref":"#/components/schemas/AdminFaqResponse"}`


### PATCH /admin/faqs/{id}

ADMIN or SUPER_ADMIN only. Scope and parent are immutable. Set status=ARCHIVED instead of deleting; archived entries never appear publicly.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: FAQ updated.; 400: FAQ validation or parent relationship error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and a trusted origin are required.; 404: FAQ or public parent resource not found.; 415: The request body is not JSON..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid"}` |

Request application/json: `{"$ref":"#/components/schemas/FaqUpdateRequest"}`

Success response: `{"$ref":"#/components/schemas/AdminFaqResponse"}`


### PATCH /admin/faqs/order

ADMIN or SUPER_ADMIN only. Submit every non-archived FAQ ID for exactly one scope/parent in desired order. Duplicate, missing, stale, or cross-parent IDs are rejected atomically.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Reordered non-archived FAQs.; 400: FAQ validation or parent relationship error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and a trusted origin are required.; 409: The submitted order is stale or contains another parent’s FAQs.; 415: The request body is not JSON..


Request application/json: `{"$ref":"#/components/schemas/FaqReorderRequest"}`

Success response: `{"$ref":"#/components/schemas/FaqOrderResponse"}`


### GET /admin/universities/{universityId}/programs

ADMIN or SUPER_ADMIN only. Lists draft, published, and archived programs for exactly one University with search, study-level, language, faculty, and status filters.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative program list.; 400: Validation, relationship, or publication prerequisite error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and trusted origin are required..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.universityId | yes | `{"type":"string","format":"uuid"}` |
| query.page | no | `{"type":"integer","minimum":1,"default":1}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":12}` |
| query.search | no | `{"type":"string","minLength":1,"maxLength":200}` |
| query.studyLevel | no | `{"$ref":"#/components/schemas/ProgramStudyLevel"}` |
| query.language | no | `{"$ref":"#/components/schemas/TeachingLanguage"}` |
| query.faculty | no | `{"type":"string","minLength":1,"maxLength":200}` |
| query.status | no | `{"$ref":"#/components/schemas/PublicationStatus"}` |
Success response: `{"$ref":"#/components/schemas/AdminUniversityProgramListResponse"}`


### POST /admin/universities/{universityId}/programs

ADMIN or SUPER_ADMIN only. Creates a localized program distinct from its major taxonomy, with optional faculty, paired duration value/unit, and an optional academic-year tuition schedule. Tuition is never inferred.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: Program created.; 400: Validation, relationship, or publication prerequisite error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and trusted origin are required.; 409: The slug or normalized program already exists.; 415: Content-Type must be JSON..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.universityId | yes | `{"type":"string","format":"uuid"}` |

Request application/json: `{"$ref":"#/components/schemas/UniversityProgramCreateRequest"}`

Success response: `{"$ref":"#/components/schemas/AdminUniversityProgramResponse"}`


### PATCH /admin/university-programs/{id}

ADMIN or SUPER_ADMIN only. Updates verified program data and teaching languages atomically. Supplying tuition upserts only that academic year and preserves older schedules. Set status=ARCHIVED instead of deleting.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Program updated.; 400: Validation, relationship, or publication prerequisite error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and trusted origin are required.; 404: University or program not found.; 409: The slug or normalized program already exists.; 415: Content-Type must be JSON..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid"}` |

Request application/json: `{"$ref":"#/components/schemas/UniversityProgramUpdateRequest"}`

Success response: `{"$ref":"#/components/schemas/AdminUniversityProgramResponse"}`


### GET /admin/academic-majors

ADMIN or SUPER_ADMIN only. Bounded lookup for program data entry.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Academic majors.; 400: Validation, relationship, or publication prerequisite error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and trusted origin are required..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":12}` |
| query.search | no | `{"type":"string","minLength":1,"maxLength":200}` |
Success response: `{"$ref":"#/components/schemas/AcademicMajorListResponse"}`


### POST /admin/academic-majors

ADMIN or SUPER_ADMIN only. Creates a stable bilingual major lookup without assigning it to any University.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: Major created.; 400: Validation, relationship, or publication prerequisite error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and trusted origin are required.; 409: The slug or normalized program already exists.; 415: Content-Type must be JSON..


Request application/json: `{"$ref":"#/components/schemas/AcademicMajorCreateRequest"}`

Success response: `{"$ref":"#/components/schemas/AcademicMajorResponse"}`


### GET /admin/cities

ADMIN or SUPER_ADMIN only. Bounded city lookup with optional Country UUID filtering.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Cities.; 400: Validation, relationship, or publication prerequisite error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and trusted origin are required..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":12}` |
| query.search | no | `{"type":"string","minLength":1,"maxLength":200}` |
| query.countryId | no | `{"type":"string","format":"uuid"}` |
Success response: `{"$ref":"#/components/schemas/CityListResponse"}`


### POST /admin/cities

ADMIN or SUPER_ADMIN only. Creates a stable bilingual city under an existing Country; it does not alter existing Universities.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: City created.; 400: Validation, relationship, or publication prerequisite error.; 401: Authentication is required.; 403: ADMIN or SUPER_ADMIN permission and trusted origin are required.; 409: The slug or normalized program already exists.; 415: Content-Type must be JSON..


Request application/json: `{"$ref":"#/components/schemas/CityCreateRequest"}`

Success response: `{"$ref":"#/components/schemas/CityResponse"}`


### GET /admin/universities/{universityId}/admission-requirements

ADMIN or SUPER_ADMIN only. Lists one University’s draft, published, and archived scoped requirements with bounded pagination and optional scope/status filters.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative admission requirements.; 400: Validation or relationship error.; 401: Authentication required.; 403: Trusted ADMIN or SUPER_ADMIN required.; 404: University or detail entry not found..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.universityId | yes | `{"type":"string","format":"uuid"}` |
| query.page | no | `{"type":"integer","minimum":1,"default":1}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":100,"default":50}` |
| query.status | no | `{"$ref":"#/components/schemas/PublicationStatus"}` |
| query.scope | no | `{"$ref":"#/components/schemas/AdmissionRequirementScope"}` |
Success response: `{"$ref":"#/components/schemas/AdminUniversityAdmissionRequirementListResponse"}`


### POST /admin/universities/{universityId}/admission-requirements

ADMIN or SUPER_ADMIN only. Scope is explicit and immutable. UNIVERSITY has no target, STUDY_LEVEL targets one controlled level, and PROGRAM targets a program belonging to this University. Publication requires an HTTPS official source and non-future verification time.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: Admission requirement created.; 400: Validation or relationship error.; 401: Authentication required.; 403: Trusted ADMIN or SUPER_ADMIN required.; 404: University or detail entry not found.; 415: JSON Content-Type required..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.universityId | yes | `{"type":"string","format":"uuid"}` |

Request application/json: `{"$ref":"#/components/schemas/UniversityAdmissionRequirementCreateRequest"}`

Success response: `{"$ref":"#/components/schemas/AdminUniversityAdmissionRequirementResponse"}`


### PATCH /admin/university-admission-requirements/{id}

ADMIN or SUPER_ADMIN only. Updates content and publication/source metadata. Scope and target are immutable; archive instead of deleting.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Admission requirement updated.; 400: Validation or relationship error.; 401: Authentication required.; 403: Trusted ADMIN or SUPER_ADMIN required.; 404: University or detail entry not found.; 415: JSON Content-Type required..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid"}` |

Request application/json: `{"$ref":"#/components/schemas/UniversityAdmissionRequirementUpdateRequest"}`

Success response: `{"$ref":"#/components/schemas/AdminUniversityAdmissionRequirementResponse"}`


### GET /admin/universities/{universityId}/gallery

ADMIN or SUPER_ADMIN only. Lists one University’s gallery associations, including draft and archived entries, with deterministic ordering and bounded pagination.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative gallery.; 400: Validation or relationship error.; 401: Authentication required.; 403: Trusted ADMIN or SUPER_ADMIN required.; 404: University or detail entry not found..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.universityId | yes | `{"type":"string","format":"uuid"}` |
| query.page | no | `{"type":"integer","minimum":1,"default":1}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":100,"default":50}` |
| query.status | no | `{"$ref":"#/components/schemas/PublicationStatus"}` |
Success response: `{"$ref":"#/components/schemas/AdminUniversityGalleryListResponse"}`


### POST /admin/universities/{universityId}/gallery

ADMIN or SUPER_ADMIN only. First upload through /admin/uploads/images with resource=universities, then submit its secureUrl here. This operation creates only the University association and never deletes a Cloudinary asset.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: Gallery image attached.; 400: Validation or relationship error.; 401: Authentication required.; 403: Trusted ADMIN or SUPER_ADMIN required.; 404: University or detail entry not found.; 415: JSON Content-Type required..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.universityId | yes | `{"type":"string","format":"uuid"}` |

Request application/json: `{"$ref":"#/components/schemas/UniversityGalleryImageCreateRequest"}`

Success response: `{"$ref":"#/components/schemas/AdminUniversityGalleryResponse"}`


### PATCH /admin/university-gallery/{id}

ADMIN or SUPER_ADMIN only. Updates the secure URL, localized alternative text, or publication state without touching the Cloudinary asset.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Gallery image updated.; 400: Validation or relationship error.; 401: Authentication required.; 403: Trusted ADMIN or SUPER_ADMIN required.; 404: University or detail entry not found.; 415: JSON Content-Type required..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid"}` |

Request application/json: `{"$ref":"#/components/schemas/UniversityGalleryImageUpdateRequest"}`

Success response: `{"$ref":"#/components/schemas/AdminUniversityGalleryResponse"}`


### DELETE /admin/university-gallery/{id}

ADMIN or SUPER_ADMIN only. Removes only the database association. The Cloudinary asset and University cover image are never deleted.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Gallery association detached.; 401: Authentication required.; 403: Trusted ADMIN or SUPER_ADMIN required.; 404: University or detail entry not found..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid"}` |
Success response: `{"$ref":"#/components/schemas/AdminUniversityGalleryDetachResponse"}`


### PATCH /admin/universities/{universityId}/gallery/order

ADMIN or SUPER_ADMIN only. Submit every non-archived image association for exactly one University in the desired order.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Gallery reordered.; 400: Validation or relationship error.; 401: Authentication required.; 403: Trusted ADMIN or SUPER_ADMIN required.; 404: University or detail entry not found.; 409: Reorder set is stale or incomplete.; 415: JSON Content-Type required..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.universityId | yes | `{"type":"string","format":"uuid"}` |

Request application/json: `{"$ref":"#/components/schemas/UniversityGalleryReorderRequest"}`

Success response: `{"$ref":"#/components/schemas/AdminUniversityGalleryReorderResponse"}`


### GET /admin/users

SUPER_ADMIN only. Returns paginated administrator identity, role, and activation state without password hashes, credentials, or session data.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Paginated safe administrator accounts.; 400: The pagination, target identifier, or update body is invalid.; 401: Authentication is required.; 403: SUPER_ADMIN permission and a trusted Admin origin are required..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1,"description":"One-based page number."}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":20,"description":"Items per page. Maximum 50."}` |
Success response: `{"$ref":"#/components/schemas/ManagedAdminAccountListResponse"}`


### PATCH /admin/users/{id}

SUPER_ADMIN only. Accepts exactly one change: `role` or `isActive`. Self-deactivation, self-demotion, and removal of the last active SUPER_ADMIN are rejected atomically. Deactivation revokes refresh sessions and existing access cookies become unusable on their next authenticated request.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Updated safe administrator account.; 400: The pagination, target identifier, or update body is invalid.; 401: Authentication is required.; 403: SUPER_ADMIN permission and a trusted Admin origin are required.; 404: The target administrator does not exist.; 409: The requested change violates administrator safety invariants or changes nothing.; 415: The request body is not JSON..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Target administrator UUID."}` |

Request application/json: `{"$ref":"#/components/schemas/AdminAccountUpdateRequest"}`

Success response: `{"$ref":"#/components/schemas/ManagedAdminAccountResponse"}`


### GET /admin/audit-logs

SUPER_ADMIN only. Returns append-only records of successful administrative mutations with deterministic newest-first sorting and optional actor, action, resource-type, and inclusive date-range filters.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Paginated administrator audit events.; 400: The pagination or filter input is invalid.; 401: Authentication is required.; 403: SUPER_ADMIN permission and a trusted Admin origin are required..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1,"description":"One-based page number."}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":100,"default":20,"description":"Items per page. Maximum 100."}` |
| query.actorId | no | `{"type":"string","format":"uuid","description":"Filter by the acting administrator UUID."}` |
| query.action | no | `{"type":"string","minLength":3,"maxLength":100,"pattern":"^[a-z][a-z0-9]*(?:[._][a-z0-9]+)+$","description":"Filter by an exact structured action identifier."}` |
| query.resourceType | no | `{"allOf":[{"$ref":"#/components/schemas/AuditResourceType"},{"description":"Filter by audited resource type."}]}` |
| query.from | no | `{"type":"string","format":"date-time","description":"Inclusive lower bound for event creation time."}` |
| query.to | no | `{"type":"string","format":"date-time","description":"Inclusive upper bound for event creation time."}` |
Success response: `{"$ref":"#/components/schemas/AdminAuditLogListResponse"}`


### POST /admin/uploads/images

ADMIN or SUPER_ADMIN only. Accepts one verified JPEG, PNG, or WebP image up to 4000000 bytes for a Country, University, Scholarship, Service, or Article. The complete multipart body is limited to 4100000 bytes for Vercel Functions compatibility. Returns the Cloudinary secure URL and stable identifiers; use `secureUrl` in the existing content image field. This endpoint does not create, update, replace, or delete a content record.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: Image uploaded to Cloudinary.; 400: The multipart fields or image contents are invalid.; 401: Authentication is required.; 403: The browser origin is not trusted or the administrator lacks permission.; 413: The image or multipart request is too large.; 415: The request is not multipart form data or the image format is unsupported.; 502: Cloudinary rejected or could not complete the upload.; 503: Cloudinary is not configured for this Backend environment..


Request multipart/form-data: `{"$ref":"#/components/schemas/ImageUploadRequest"}`

Success response: `{"$ref":"#/components/schemas/ImageUploadResponse"}`


### GET /site-settings

Public organizational display and contact settings. Before the singleton is initialized, every allowlisted field and `updatedAt` safely returns null.

Security: `[]`. Errors/statuses: 200: Public site settings..

Success response: `{"$ref":"#/components/schemas/SiteSettingsResponse"}`


### PATCH /admin/site-settings

SUPER_ADMIN only. Updates only explicitly allowlisted public organization, contact, address, and supported social-link fields. Null clears a field. Environment variables, credentials, and arbitrary keys are never accepted.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Updated public site settings.; 400: A settings field is invalid or the update is empty.; 401: Authentication is required.; 403: SUPER_ADMIN permission and a trusted Admin origin are required.; 415: The request body is not JSON..


Request application/json: `{"$ref":"#/components/schemas/SiteSettingsUpdateRequest"}`

Success response: `{"$ref":"#/components/schemas/SiteSettingsResponse"}`


### GET /admin/applications

ADMIN or SUPER_ADMIN only. Supports status and application-type filters, safe sorting, and pagination.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Paginated student applications.; 400: Validation or related-record error.; 401: Authentication is required.; 403: The browser origin is not allowed or the administrator lacks permission..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1,"description":"One-based page number."}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":12,"description":"Items per page. Maximum 50."}` |
| query.status | no | `{"allOf":[{"$ref":"#/components/schemas/SubmissionStatus"},{"description":"Filter by workflow status."}]}` |
| query.sort | no | `{"type":"string","enum":["newest","oldest","updated"],"default":"newest","description":"Safe sort allowlist. Defaults to newest first."}` |
| query.applicationType | no | `{"allOf":[{"$ref":"#/components/schemas/StudentApplicationType"},{"description":"Filter by application type."}]}` |
Success response: `{"$ref":"#/components/schemas/StudentApplicationListResponse"}`


### GET /admin/applications/{id}

ADMIN or SUPER_ADMIN only. Returns contact data, consent timestamp, workflow status, and private internal note.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Student application detail.; 400: Validation or related-record error.; 401: Authentication is required.; 403: The browser origin is not allowed or the administrator lacks permission.; 404: The requested submission was not found..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Submission UUID."}` |
Success response: `{"$ref":"#/components/schemas/StudentApplicationResponse"}`


### PATCH /admin/applications/{id}/status

ADMIN or SUPER_ADMIN only. Updates the workflow status and/or private internal note.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Updated student application.; 400: Validation or related-record error.; 401: Authentication is required.; 403: The browser origin is not allowed or the administrator lacks permission.; 404: The requested submission was not found.; 415: The request body is not JSON..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Submission UUID."}` |

Request application/json: `{"$ref":"#/components/schemas/SubmissionStatusUpdateRequest"}`

Success response: `{"$ref":"#/components/schemas/StudentApplicationResponse"}`


### GET /admin/inquiries

ADMIN or SUPER_ADMIN only. Supports workflow-status filtering, safe sorting, and pagination.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Paginated general inquiries.; 400: Validation or related-record error.; 401: Authentication is required.; 403: The browser origin is not allowed or the administrator lacks permission..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1,"description":"One-based page number."}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":12,"description":"Items per page. Maximum 50."}` |
| query.status | no | `{"allOf":[{"$ref":"#/components/schemas/SubmissionStatus"},{"description":"Filter by workflow status."}]}` |
| query.sort | no | `{"type":"string","enum":["newest","oldest","updated"],"default":"newest","description":"Safe sort allowlist. Defaults to newest first."}` |
Success response: `{"$ref":"#/components/schemas/GeneralInquiryListResponse"}`


### GET /admin/inquiries/{id}

ADMIN or SUPER_ADMIN only. Returns contact data, consent timestamp, workflow status, and private internal note.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: General inquiry detail.; 400: Validation or related-record error.; 401: Authentication is required.; 403: The browser origin is not allowed or the administrator lacks permission.; 404: The requested submission was not found..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Submission UUID."}` |
Success response: `{"$ref":"#/components/schemas/GeneralInquiryResponse"}`


### PATCH /admin/inquiries/{id}/status

ADMIN or SUPER_ADMIN only. Updates the workflow status and/or private internal note.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Updated general inquiry.; 400: Validation or related-record error.; 401: Authentication is required.; 403: The browser origin is not allowed or the administrator lacks permission.; 404: The requested submission was not found.; 415: The request body is not JSON..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Submission UUID."}` |

Request application/json: `{"$ref":"#/components/schemas/SubmissionStatusUpdateRequest"}`

Success response: `{"$ref":"#/components/schemas/GeneralInquiryResponse"}`


### GET /admin/countries

ADMIN or SUPER_ADMIN only. Includes draft, published, and archived records and supports publication-status filtering.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative countries collection.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1,"description":"One-based page number."}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":12,"description":"Items per page. The maximum is 50."}` |
| query.search | no | `{"type":"string","minLength":1,"maxLength":200,"description":"Case-insensitive text search."}` |
| query.featured | no | `{"type":"string","enum":["true","false"],"description":"Filter by featured state."}` |
| query.sort | no | `{"type":"string","enum":["manual","newest"],"default":"manual","description":"Sort by display order or newest creation time."}` |
| query.status | no | `{"allOf":[{"$ref":"#/components/schemas/PublicationStatus"},{"description":"Editorial publication status."}]}` |
Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/Country"}},"pagination":{"$ref":"#/components/schemas/Pagination"}},"required":["items","pagination"]}},"required":["success","data"]}`


### POST /admin/countries

ADMIN or SUPER_ADMIN only. New records default to DRAFT unless a valid PUBLISHED state is explicitly requested.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: country created.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 409: The slug conflicts with an existing record or a published slug is immutable.; 415: The request body is not application/json..


Request application/json: `{"$ref":"#/components/schemas/CountryCreateRequest"}`

Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/Country"}},"required":["success","data"]}`


### GET /admin/countries/{id}

ADMIN or SUPER_ADMIN only. Uses the UUID identifier and includes editable publication fields.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative country.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 404: The content record was not found or is not publicly available..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Administrative content UUID."}` |
Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/Country"}},"required":["success","data"]}`


### PATCH /admin/countries/{id}

ADMIN or SUPER_ADMIN only. Supports publication transitions; the first publication timestamp and any previously published slug are preserved.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: country updated.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 404: The content record was not found or is not publicly available.; 409: The slug conflicts with an existing record or a published slug is immutable.; 415: The request body is not application/json..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Administrative content UUID."}` |

Request application/json: `{"$ref":"#/components/schemas/CountryPatchRequest"}`

Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/Country"}},"required":["success","data"]}`


### GET /admin/universities

ADMIN or SUPER_ADMIN only. Includes draft, published, and archived records and supports publication-status filtering.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative universities collection.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1,"description":"One-based page number."}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":12,"description":"Items per page. The maximum is 50."}` |
| query.search | no | `{"type":"string","minLength":1,"maxLength":200,"description":"Case-insensitive text search."}` |
| query.country | no | `{"type":"string","minLength":2,"maxLength":120,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$","description":"Related Country slug."}` |
| query.major | no | `{"type":"string","minLength":2,"maxLength":120,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$","description":"Academic Major slug. Combined P1 filters must match one published program."}` |
| query.studyLevel | no | `{"type":"string","enum":["FOUNDATION","DIPLOMA","BACHELORS","MASTERS","PHD"]}` |
| query.language | no | `{"type":"string","enum":["ARABIC","ENGLISH","FRENCH","GERMAN","TURKISH","ROMANIAN","RUSSIAN","SPANISH","ITALIAN"]}` |
| query.city | no | `{"type":"string","minLength":2,"maxLength":120,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$","description":"Normalized City slug."}` |
| query.universityType | no | `{"$ref":"#/components/schemas/UniversityType"}` |
| query.featured | no | `{"type":"string","enum":["true","false"],"description":"Filter by featured state."}` |
| query.sort | no | `{"type":"string","enum":["newest","name"],"default":"newest","description":"Sort newest first or by Arabic name."}` |
| query.status | no | `{"allOf":[{"$ref":"#/components/schemas/PublicationStatus"},{"description":"Editorial publication status."}]}` |
Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/University"}},"pagination":{"$ref":"#/components/schemas/Pagination"}},"required":["items","pagination"]}},"required":["success","data"]}`


### POST /admin/universities

ADMIN or SUPER_ADMIN only. New records default to DRAFT unless a valid PUBLISHED state is explicitly requested.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: university created.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 409: The slug conflicts with an existing record or a published slug is immutable.; 415: The request body is not application/json..


Request application/json: `{"$ref":"#/components/schemas/UniversityCreateRequest"}`

Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/University"}},"required":["success","data"]}`


### GET /admin/universities/{id}

ADMIN or SUPER_ADMIN only. Uses the UUID identifier and includes editable publication fields.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative university.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 404: The content record was not found or is not publicly available..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Administrative content UUID."}` |
Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/University"}},"required":["success","data"]}`


### PATCH /admin/universities/{id}

ADMIN or SUPER_ADMIN only. Supports publication transitions; the first publication timestamp and any previously published slug are preserved.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: university updated.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 404: The content record was not found or is not publicly available.; 409: The slug conflicts with an existing record or a published slug is immutable.; 415: The request body is not application/json..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Administrative content UUID."}` |

Request application/json: `{"$ref":"#/components/schemas/UniversityPatchRequest"}`

Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/University"}},"required":["success","data"]}`


### GET /admin/scholarships

ADMIN or SUPER_ADMIN only. Includes draft, published, and archived records and supports publication-status filtering.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative scholarships collection.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1,"description":"One-based page number."}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":12,"description":"Items per page. The maximum is 50."}` |
| query.search | no | `{"type":"string","minLength":1,"maxLength":200,"description":"Case-insensitive text search."}` |
| query.country | no | `{"type":"string","minLength":2,"maxLength":120,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$","description":"Related Country slug."}` |
| query.university | no | `{"type":"string","minLength":2,"maxLength":120,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$","description":"Exact related University slug. This legacy filter keeps its existing meaning."}` |
| query.studyLevel | no | `{"type":"string","minLength":1,"maxLength":120,"description":"Scholarship study-level field; this is distinct from universityStudyLevel."}` |
| query.fundingType | no | `{"type":"string","minLength":1,"maxLength":120}` |
| query.applicationStatus | no | `{"allOf":[{"$ref":"#/components/schemas/ScholarshipApplicationStatus"},{"description":"Effective OPEN/CLOSED state; passed verified deadlines count as CLOSED."}]}` |
| query.featured | no | `{"type":"string","enum":["true","false"],"description":"Filter by featured state."}` |
| query.universitySearch | no | `{"type":"string","minLength":1,"maxLength":200,"description":"Match the associated published University by Arabic/English name, official name, or Arabic city name."}` |
| query.universityCountry | no | `{"type":"string","minLength":2,"maxLength":120,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$","description":"Country slug of the associated published University; distinct from the Scholarship country filter."}` |
| query.universityMajor | no | `{"type":"string","minLength":2,"maxLength":120,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$","description":"Academic Major slug on the same published University Program used by the other university program filters."}` |
| query.universityStudyLevel | no | `{"type":"string","enum":["FOUNDATION","DIPLOMA","BACHELORS","MASTERS","PHD"],"description":"Controlled study level on the same published University Program; distinct from the Scholarship studyLevel field."}` |
| query.universityLanguage | no | `{"type":"string","enum":["ARABIC","ENGLISH","FRENCH","GERMAN","TURKISH","ROMANIAN","RUSSIAN","SPANISH","ITALIAN"],"description":"Teaching language on the same published University Program."}` |
| query.universityCity | no | `{"type":"string","minLength":2,"maxLength":120,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$","description":"Normalized City slug of the associated published University."}` |
| query.universityType | no | `{"allOf":[{"$ref":"#/components/schemas/UniversityType"},{"description":"Type of the associated published University."}]}` |
| query.universityFeatured | no | `{"type":"string","enum":["true","false"],"description":"Filter by the associated published University featured state."}` |
| query.sort | no | `{"type":"string","enum":["newest","deadline"],"default":"newest","description":"Sort newest first or by earliest non-null deadline."}` |
| query.status | no | `{"allOf":[{"$ref":"#/components/schemas/PublicationStatus"},{"description":"Editorial publication status."}]}` |
Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/Scholarship"}},"pagination":{"$ref":"#/components/schemas/Pagination"}},"required":["items","pagination"]}},"required":["success","data"]}`


### POST /admin/scholarships

ADMIN or SUPER_ADMIN only. New records default to DRAFT unless a valid PUBLISHED state is explicitly requested.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: scholarship created.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 409: The slug conflicts with an existing record or a published slug is immutable.; 415: The request body is not application/json..


Request application/json: `{"$ref":"#/components/schemas/ScholarshipCreateRequest"}`

Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/Scholarship"}},"required":["success","data"]}`


### GET /admin/scholarships/{id}

ADMIN or SUPER_ADMIN only. Uses the UUID identifier and includes editable publication fields.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative scholarship.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 404: The content record was not found or is not publicly available..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Administrative content UUID."}` |
Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/Scholarship"}},"required":["success","data"]}`


### PATCH /admin/scholarships/{id}

ADMIN or SUPER_ADMIN only. Supports publication transitions; the first publication timestamp and any previously published slug are preserved.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: scholarship updated.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 404: The content record was not found or is not publicly available.; 409: The slug conflicts with an existing record or a published slug is immutable.; 415: The request body is not application/json..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Administrative content UUID."}` |

Request application/json: `{"$ref":"#/components/schemas/ScholarshipPatchRequest"}`

Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/Scholarship"}},"required":["success","data"]}`


### GET /admin/services

ADMIN or SUPER_ADMIN only. Includes draft, published, and archived records and supports publication-status filtering.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative services collection.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1,"description":"One-based page number."}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":12,"description":"Items per page. The maximum is 50."}` |
| query.featured | no | `{"type":"string","enum":["true","false"],"description":"Filter by featured state."}` |
| query.sort | no | `{"type":"string","enum":["manual","newest"],"default":"manual","description":"Sort by display order or newest creation time."}` |
| query.status | no | `{"allOf":[{"$ref":"#/components/schemas/PublicationStatus"},{"description":"Editorial publication status."}]}` |
Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/Service"}},"pagination":{"$ref":"#/components/schemas/Pagination"}},"required":["items","pagination"]}},"required":["success","data"]}`


### POST /admin/services

ADMIN or SUPER_ADMIN only. New records default to DRAFT unless a valid PUBLISHED state is explicitly requested.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: service created.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 409: The slug conflicts with an existing record or a published slug is immutable.; 415: The request body is not application/json..


Request application/json: `{"$ref":"#/components/schemas/ServiceCreateRequest"}`

Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/Service"}},"required":["success","data"]}`


### GET /admin/services/{id}

ADMIN or SUPER_ADMIN only. Uses the UUID identifier and includes editable publication fields.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative service.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 404: The content record was not found or is not publicly available..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Administrative content UUID."}` |
Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/Service"}},"required":["success","data"]}`


### PATCH /admin/services/{id}

ADMIN or SUPER_ADMIN only. Supports publication transitions; the first publication timestamp and any previously published slug are preserved.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: service updated.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 404: The content record was not found or is not publicly available.; 409: The slug conflicts with an existing record or a published slug is immutable.; 415: The request body is not application/json..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Administrative content UUID."}` |

Request application/json: `{"$ref":"#/components/schemas/ServicePatchRequest"}`

Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/Service"}},"required":["success","data"]}`


### GET /admin/articles

ADMIN or SUPER_ADMIN only. Includes draft, published, and archived records and supports publication-status filtering.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative articles collection.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted..

| Parameter | Required | Schema |
| --- | --- | --- |
| query.page | no | `{"type":"integer","minimum":1,"default":1,"description":"One-based page number."}` |
| query.limit | no | `{"type":"integer","minimum":1,"maximum":50,"default":12,"description":"Items per page. The maximum is 50."}` |
| query.search | no | `{"type":"string","minLength":1,"maxLength":200,"description":"Case-insensitive text search."}` |
| query.country | no | `{"type":"string","minLength":2,"maxLength":120,"pattern":"^[a-z0-9]+(?:-[a-z0-9]+)*$","description":"Related Country slug."}` |
| query.featured | no | `{"type":"string","enum":["true","false"],"description":"Filter by featured state."}` |
| query.sort | no | `{"type":"string","enum":["newest"],"default":"newest","description":"Sort newest first."}` |
| query.status | no | `{"allOf":[{"$ref":"#/components/schemas/PublicationStatus"},{"description":"Editorial publication status."}]}` |
Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/Article"}},"pagination":{"$ref":"#/components/schemas/Pagination"}},"required":["items","pagination"]}},"required":["success","data"]}`


### POST /admin/articles

ADMIN or SUPER_ADMIN only. New Articles accept an ordered, duplicate-free scholarshipIds array. If both fields are supplied, legacy scholarshipId must equal the first array item. New records default to DRAFT.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 201: article created.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 409: The slug conflicts with an existing record or a published slug is immutable.; 415: The request body is not application/json..


Request application/json: `{"$ref":"#/components/schemas/ArticleCreateRequest"}`

Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/ArticleDetail"}},"required":["success","data"]}`


### GET /admin/articles/{id}

ADMIN or SUPER_ADMIN only. Uses the UUID identifier and includes editable publication fields plus the ordered scholarshipIds association set. Legacy scholarshipId mirrors the first selected ID.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: Administrative article.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 404: The content record was not found or is not publicly available..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Administrative content UUID."}` |
Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/ArticleDetail"}},"required":["success","data"]}`


### PATCH /admin/articles/{id}

ADMIN or SUPER_ADMIN only. Omitted scholarship association fields preserve links; scholarshipIds replaces them in order, [] clears them, and legacy scholarshipId alone maps to zero or one link. Supports publication transitions while preserving first publication time and published slugs.

Security: `[{"accessCookie":[]}]`. Errors/statuses: 200: article updated.; 400: Validation, publication prerequisite, or relationship error.; 401: Authentication is required.; 403: The administrator lacks permission or the request origin is not trusted.; 404: The content record was not found or is not publicly available.; 409: The slug conflicts with an existing record or a published slug is immutable.; 415: The request body is not application/json..

| Parameter | Required | Schema |
| --- | --- | --- |
| path.id | yes | `{"type":"string","format":"uuid","description":"Administrative content UUID."}` |

Request application/json: `{"$ref":"#/components/schemas/ArticlePatchRequest"}`

Success response: `{"type":"object","properties":{"success":{"type":"boolean","enum":[true]},"data":{"$ref":"#/components/schemas/ArticleDetail"}},"required":["success","data"]}`


### Referenced named schemas (unaltered except omitted examples)


<details><summary>AcademicMajor</summary>

```json
{
  "allOf": [
    {
      "$ref": "#/components/schemas/AcademicMajorSummary"
    },
    {
      "type": "object",
      "properties": {
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": [
        "createdAt",
        "updatedAt"
      ]
    }
  ]
}
```

</details>


<details><summary>AcademicMajorCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "nameAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "nameEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "category": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 120,
      "default": null
    }
  },
  "required": [
    "slug",
    "nameAr",
    "nameEn"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>AcademicMajorListResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/AcademicMajor"
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AcademicMajorResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "$ref": "#/components/schemas/AcademicMajor"
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AcademicMajorSummary</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string"
    },
    "nameAr": {
      "type": "string"
    },
    "nameEn": {
      "type": "string"
    },
    "category": {
      "type": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "id",
    "slug",
    "nameAr",
    "nameEn",
    "category"
  ]
}
```

</details>


<details><summary>AdminAccountUpdateRequest</summary>

```json
{
  "anyOf": [
    {
      "type": "object",
      "properties": {
        "isActive": {
          "type": "boolean"
        }
      },
      "required": [
        "isActive"
      ],
      "additionalProperties": false
    },
    {
      "type": "object",
      "properties": {
        "role": {
          "$ref": "#/components/schemas/ManagedAdminRole"
        }
      },
      "required": [
        "role"
      ],
      "additionalProperties": false
    }
  ]
}
```

</details>


<details><summary>AdminAuditLog</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "actorAdminId": {
      "type": "string",
      "format": "uuid"
    },
    "action": {
      "type": "string"
    },
    "resourceType": {
      "$ref": "#/components/schemas/AuditResourceType"
    },
    "resourceId": {
      "type": "string",
      "format": "uuid"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": {}
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "actor": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name"
      ]
    }
  },
  "required": [
    "id",
    "actorAdminId",
    "action",
    "resourceType",
    "resourceId",
    "metadata",
    "createdAt",
    "actor"
  ]
}
```

</details>


<details><summary>AdminAuditLogListResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/AdminAuditLog"
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminFaqEntry</summary>

```json
{
  "allOf": [
    {
      "$ref": "#/components/schemas/PublicFaqEntry"
    },
    {
      "type": "object",
      "properties": {
        "parentId": {
          "type": [
            "string",
            "null"
          ],
          "format": "uuid"
        },
        "status": {
          "$ref": "#/components/schemas/PublicationStatus"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": [
        "parentId",
        "status",
        "createdAt",
        "updatedAt"
      ]
    }
  ]
}
```

</details>


<details><summary>AdminFaqListResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/AdminFaqEntry"
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminFaqResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "$ref": "#/components/schemas/AdminFaqEntry"
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminRole</summary>

```json
{
  "type": "string",
  "enum": [
    "ADMIN",
    "SUPER_ADMIN"
  ]
}
```

</details>


<details><summary>AdminUniversityAdmissionRequirementListResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid"
              },
              "scope": {
                "$ref": "#/components/schemas/AdmissionRequirementScope"
              },
              "studyLevel": {
                "allOf": [
                  {
                    "$ref": "#/components/schemas/ProgramStudyLevel"
                  },
                  {
                    "type": [
                      "string",
                      "null"
                    ]
                  }
                ]
              },
              "programId": {
                "type": [
                  "string",
                  "null"
                ],
                "format": "uuid"
              },
              "contentAr": {
                "type": "string"
              },
              "contentEn": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "officialSourceUrl": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "verifiedAt": {
                "type": [
                  "string",
                  "null"
                ],
                "format": "date-time"
              },
              "publishedAt": {
                "type": [
                  "string",
                  "null"
                ],
                "format": "date-time"
              },
              "program": {
                "type": [
                  "object",
                  "null"
                ],
                "properties": {
                  "id": {
                    "type": "string",
                    "format": "uuid"
                  },
                  "nameAr": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "nameEn": {
                    "type": [
                      "string",
                      "null"
                    ]
                  },
                  "studyLevel": {
                    "$ref": "#/components/schemas/ProgramStudyLevel"
                  }
                },
                "required": [
                  "id",
                  "nameAr",
                  "nameEn",
                  "studyLevel"
                ]
              },
              "universityId": {
                "type": "string",
                "format": "uuid"
              },
              "status": {
                "$ref": "#/components/schemas/PublicationStatus"
              },
              "createdAt": {
                "type": "string",
                "format": "date-time"
              },
              "updatedAt": {
                "type": "string",
                "format": "date-time"
              }
            },
            "required": [
              "id",
              "scope",
              "studyLevel",
              "programId",
              "contentAr",
              "contentEn",
              "officialSourceUrl",
              "verifiedAt",
              "publishedAt",
              "program",
              "universityId",
              "status",
              "createdAt",
              "updatedAt"
            ]
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminUniversityAdmissionRequirementResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "scope": {
          "$ref": "#/components/schemas/AdmissionRequirementScope"
        },
        "studyLevel": {
          "allOf": [
            {
              "$ref": "#/components/schemas/ProgramStudyLevel"
            },
            {
              "type": [
                "string",
                "null"
              ]
            }
          ]
        },
        "programId": {
          "type": [
            "string",
            "null"
          ],
          "format": "uuid"
        },
        "contentAr": {
          "type": "string"
        },
        "contentEn": {
          "type": [
            "string",
            "null"
          ]
        },
        "officialSourceUrl": {
          "type": [
            "string",
            "null"
          ]
        },
        "verifiedAt": {
          "type": [
            "string",
            "null"
          ],
          "format": "date-time"
        },
        "publishedAt": {
          "type": [
            "string",
            "null"
          ],
          "format": "date-time"
        },
        "program": {
          "type": [
            "object",
            "null"
          ],
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "nameAr": {
              "type": [
                "string",
                "null"
              ]
            },
            "nameEn": {
              "type": [
                "string",
                "null"
              ]
            },
            "studyLevel": {
              "$ref": "#/components/schemas/ProgramStudyLevel"
            }
          },
          "required": [
            "id",
            "nameAr",
            "nameEn",
            "studyLevel"
          ]
        },
        "universityId": {
          "type": "string",
          "format": "uuid"
        },
        "status": {
          "$ref": "#/components/schemas/PublicationStatus"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": [
        "id",
        "scope",
        "studyLevel",
        "programId",
        "contentAr",
        "contentEn",
        "officialSourceUrl",
        "verifiedAt",
        "publishedAt",
        "program",
        "universityId",
        "status",
        "createdAt",
        "updatedAt"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminUniversityGalleryDetachResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        }
      },
      "required": [
        "id"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminUniversityGalleryListResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid"
              },
              "imageUrl": {
                "type": "string"
              },
              "altAr": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "altEn": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "displayOrder": {
                "type": "integer"
              },
              "publishedAt": {
                "type": [
                  "string",
                  "null"
                ],
                "format": "date-time"
              },
              "universityId": {
                "type": "string",
                "format": "uuid"
              },
              "status": {
                "$ref": "#/components/schemas/PublicationStatus"
              },
              "createdAt": {
                "type": "string",
                "format": "date-time"
              },
              "updatedAt": {
                "type": "string",
                "format": "date-time"
              }
            },
            "required": [
              "id",
              "imageUrl",
              "altAr",
              "altEn",
              "displayOrder",
              "publishedAt",
              "universityId",
              "status",
              "createdAt",
              "updatedAt"
            ]
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminUniversityGalleryReorderResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid"
              },
              "imageUrl": {
                "type": "string"
              },
              "altAr": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "altEn": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "displayOrder": {
                "type": "integer"
              },
              "publishedAt": {
                "type": [
                  "string",
                  "null"
                ],
                "format": "date-time"
              },
              "universityId": {
                "type": "string",
                "format": "uuid"
              },
              "status": {
                "$ref": "#/components/schemas/PublicationStatus"
              },
              "createdAt": {
                "type": "string",
                "format": "date-time"
              },
              "updatedAt": {
                "type": "string",
                "format": "date-time"
              }
            },
            "required": [
              "id",
              "imageUrl",
              "altAr",
              "altEn",
              "displayOrder",
              "publishedAt",
              "universityId",
              "status",
              "createdAt",
              "updatedAt"
            ]
          }
        }
      },
      "required": [
        "items"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminUniversityGalleryResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "imageUrl": {
          "type": "string"
        },
        "altAr": {
          "type": [
            "string",
            "null"
          ]
        },
        "altEn": {
          "type": [
            "string",
            "null"
          ]
        },
        "displayOrder": {
          "type": "integer"
        },
        "publishedAt": {
          "type": [
            "string",
            "null"
          ],
          "format": "date-time"
        },
        "universityId": {
          "type": "string",
          "format": "uuid"
        },
        "status": {
          "$ref": "#/components/schemas/PublicationStatus"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": [
        "id",
        "imageUrl",
        "altAr",
        "altEn",
        "displayOrder",
        "publishedAt",
        "universityId",
        "status",
        "createdAt",
        "updatedAt"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminUniversityProgram</summary>

```json
{
  "allOf": [
    {
      "$ref": "#/components/schemas/PublicUniversityProgram"
    },
    {
      "type": "object",
      "properties": {
        "universityId": {
          "type": "string",
          "format": "uuid"
        },
        "academicMajorId": {
          "type": "string",
          "format": "uuid"
        },
        "status": {
          "$ref": "#/components/schemas/PublicationStatus"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": [
        "universityId",
        "academicMajorId",
        "status",
        "createdAt",
        "updatedAt"
      ]
    }
  ]
}
```

</details>


<details><summary>AdminUniversityProgramListResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/AdminUniversityProgram"
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminUniversityProgramResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "$ref": "#/components/schemas/AdminUniversityProgram"
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AdminUser</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "role": {
      "$ref": "#/components/schemas/AdminRole"
    }
  },
  "required": [
    "id",
    "name",
    "email",
    "role"
  ]
}
```

</details>


<details><summary>AdmissionRequirementScope</summary>

```json
{
  "type": "string",
  "enum": [
    "UNIVERSITY",
    "STUDY_LEVEL",
    "PROGRAM"
  ]
}
```

</details>


<details><summary>AnalyticsCtaId</summary>

```json
{
  "type": "string",
  "enum": [
    "APPLY_NOW",
    "REQUEST_CONSULTATION",
    "CONTACT_US",
    "VIEW_UNIVERSITY",
    "VIEW_SCHOLARSHIP",
    "VIEW_SERVICE"
  ]
}
```

</details>


<details><summary>AnalyticsEngagementType</summary>

```json
{
  "type": "string",
  "enum": [
    "SCROLL_50",
    "SCROLL_90",
    "ACTIVE_30_SECONDS",
    "ACTIVE_60_SECONDS"
  ]
}
```

</details>


<details><summary>AnalyticsEventType</summary>

```json
{
  "type": "string",
  "enum": [
    "PAGE_VIEW",
    "CTA_CLICK",
    "ENGAGEMENT",
    "APPLICATION_SUBMITTED",
    "INQUIRY_SUBMITTED"
  ]
}
```

</details>


<details><summary>AnalyticsJourneyResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "range": {
          "type": "object",
          "properties": {
            "from": {
              "type": "string",
              "format": "date"
            },
            "to": {
              "type": "string",
              "format": "date"
            },
            "granularity": {
              "type": "string",
              "enum": [
                "day",
                "week",
                "month"
              ]
            }
          },
          "required": [
            "from",
            "to",
            "granularity"
          ]
        },
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "sessionId": {
                "type": "string",
                "format": "uuid"
              },
              "startedAt": {
                "type": "string",
                "format": "date-time"
              },
              "endedAt": {
                "type": "string",
                "format": "date-time"
              },
              "eventCount": {
                "type": "integer",
                "minimum": 0
              },
              "truncated": {
                "type": "boolean"
              },
              "clientReportedApplication": {
                "type": "boolean"
              },
              "clientReportedInquiry": {
                "type": "boolean"
              },
              "steps": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "eventId": {
                      "type": "string",
                      "format": "uuid"
                    },
                    "type": {
                      "$ref": "#/components/schemas/AnalyticsEventType"
                    },
                    "path": {
                      "type": "string"
                    },
                    "targetPath": {
                      "type": [
                        "string",
                        "null"
                      ]
                    },
                    "ctaId": {
                      "allOf": [
                        {
                          "$ref": "#/components/schemas/AnalyticsCtaId"
                        },
                        {
                          "type": [
                            "string",
                            "null"
                          ]
                        }
                      ]
                    },
                    "engagementType": {
                      "allOf": [
                        {
                          "$ref": "#/components/schemas/AnalyticsEngagementType"
                        },
                        {
                          "type": [
                            "string",
                            "null"
                          ]
                        }
                      ]
                    },
                    "occurredAt": {
                      "type": "string",
                      "format": "date-time"
                    }
                  },
                  "required": [
                    "eventId",
                    "type",
                    "path",
                    "targetPath",
                    "ctaId",
                    "engagementType",
                    "occurredAt"
                  ]
                }
              }
            },
            "required": [
              "sessionId",
              "startedAt",
              "endedAt",
              "eventCount",
              "truncated",
              "clientReportedApplication",
              "clientReportedInquiry",
              "steps"
            ]
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer",
              "minimum": 0
            },
            "limit": {
              "type": "integer",
              "minimum": 0
            },
            "total": {
              "type": "integer",
              "minimum": 0
            },
            "totalPages": {
              "type": "integer",
              "minimum": 0
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "range",
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>AnalyticsSummaryResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "range": {
          "type": "object",
          "properties": {
            "from": {
              "type": "string",
              "format": "date"
            },
            "to": {
              "type": "string",
              "format": "date"
            },
            "granularity": {
              "type": "string",
              "enum": [
                "day",
                "week",
                "month"
              ]
            }
          },
          "required": [
            "from",
            "to",
            "granularity"
          ]
        },
        "totals": {
          "type": "object",
          "properties": {
            "pageViews": {
              "type": "integer",
              "minimum": 0
            },
            "visitors": {
              "type": "integer",
              "minimum": 0
            },
            "sessions": {
              "type": "integer",
              "minimum": 0
            }
          },
          "required": [
            "pageViews",
            "visitors",
            "sessions"
          ]
        },
        "topPages": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "path": {
                "type": "string"
              },
              "pageViews": {
                "type": "integer",
                "minimum": 0
              },
              "visitors": {
                "type": "integer",
                "minimum": 0
              }
            },
            "required": [
              "path",
              "pageViews",
              "visitors"
            ]
          }
        },
        "trafficSources": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "source": {
                "type": "string"
              },
              "medium": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "campaign": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "sessions": {
                "type": "integer",
                "minimum": 0
              },
              "pageViews": {
                "type": "integer",
                "minimum": 0
              }
            },
            "required": [
              "source",
              "medium",
              "campaign",
              "sessions",
              "pageViews"
            ]
          }
        },
        "ctaEngagement": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "ctaId": {
                "$ref": "#/components/schemas/AnalyticsCtaId"
              },
              "clicks": {
                "type": "integer",
                "minimum": 0
              },
              "sessions": {
                "type": "integer",
                "minimum": 0
              }
            },
            "required": [
              "ctaId",
              "clicks",
              "sessions"
            ]
          }
        },
        "clientReportedConversions": {
          "type": "object",
          "properties": {
            "applications": {
              "type": "integer",
              "minimum": 0
            },
            "inquiries": {
              "type": "integer",
              "minimum": 0
            },
            "total": {
              "type": "integer",
              "minimum": 0
            }
          },
          "required": [
            "applications",
            "inquiries",
            "total"
          ]
        },
        "serverVerifiedConversions": {
          "type": "object",
          "properties": {
            "applications": {
              "type": "integer",
              "minimum": 0
            },
            "inquiries": {
              "type": "integer",
              "minimum": 0
            },
            "total": {
              "type": "integer",
              "minimum": 0
            }
          },
          "required": [
            "applications",
            "inquiries",
            "total"
          ]
        },
        "conversionRates": {
          "type": "object",
          "properties": {
            "clientReportedSessionRate": {
              "type": "number",
              "minimum": 0
            },
            "applicationSessionRate": {
              "type": "number",
              "minimum": 0
            },
            "inquirySessionRate": {
              "type": "number",
              "minimum": 0
            }
          },
          "required": [
            "clientReportedSessionRate",
            "applicationSessionRate",
            "inquirySessionRate"
          ]
        },
        "funnel": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "step": {
                "type": "string"
              },
              "sessions": {
                "type": "integer",
                "minimum": 0
              },
              "rateFromPrevious": {
                "type": [
                  "number",
                  "null"
                ],
                "minimum": 0
              }
            },
            "required": [
              "step",
              "sessions",
              "rateFromPrevious"
            ]
          }
        },
        "trends": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "periodStart": {
                "type": "string",
                "format": "date-time"
              },
              "pageViews": {
                "type": "integer",
                "minimum": 0
              },
              "visitors": {
                "type": "integer",
                "minimum": 0
              },
              "sessions": {
                "type": "integer",
                "minimum": 0
              },
              "ctaClicks": {
                "type": "integer",
                "minimum": 0
              },
              "clientReportedConversions": {
                "type": "integer",
                "minimum": 0
              },
              "serverVerifiedApplications": {
                "type": "integer",
                "minimum": 0
              },
              "serverVerifiedInquiries": {
                "type": "integer",
                "minimum": 0
              }
            },
            "required": [
              "periodStart",
              "pageViews",
              "visitors",
              "sessions",
              "ctaClicks",
              "clientReportedConversions",
              "serverVerifiedApplications",
              "serverVerifiedInquiries"
            ]
          }
        }
      },
      "required": [
        "range",
        "totals",
        "topPages",
        "trafficSources",
        "ctaEngagement",
        "clientReportedConversions",
        "serverVerifiedConversions",
        "conversionRates",
        "funnel",
        "trends"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>Article</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string"
    },
    "featured": {
      "type": "boolean"
    },
    "publishedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "seoTitleAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "seoDescriptionAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "titleAr": {
      "type": "string"
    },
    "titleEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "summaryAr": {
      "type": "string"
    },
    "summaryEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "bodyAr": {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/ArticleRichTextBlock"
      }
    },
    "bodyEn": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "$ref": "#/components/schemas/ArticleRichTextBlock"
      }
    },
    "coverImageUrl": {
      "type": [
        "string",
        "null"
      ]
    },
    "coverImageAltAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "coverImageAltEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "countryId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "universityId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "scholarshipId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "country": {
      "type": [
        "object",
        "null"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "slug": {
          "type": "string"
        },
        "nameAr": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "slug",
        "nameAr"
      ]
    },
    "university": {
      "type": [
        "object",
        "null"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "slug": {
          "type": "string"
        },
        "nameAr": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "slug",
        "nameAr"
      ]
    },
    "scholarship": {
      "type": [
        "object",
        "null"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "slug": {
          "type": "string"
        },
        "titleAr": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "slug",
        "titleAr"
      ]
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "slug",
    "featured",
    "publishedAt",
    "seoTitleAr",
    "seoDescriptionAr",
    "titleAr",
    "titleEn",
    "summaryAr",
    "summaryEn",
    "bodyAr",
    "bodyEn",
    "coverImageUrl",
    "coverImageAltAr",
    "coverImageAltEn",
    "countryId",
    "universityId",
    "scholarshipId",
    "status",
    "createdAt",
    "updatedAt"
  ]
}
```

</details>


<details><summary>ArticleCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "titleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "titleEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "summaryAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "summaryEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "bodyAr": {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/ArticleRichTextBlock"
      },
      "minItems": 1,
      "maxItems": 500
    },
    "bodyEn": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "$ref": "#/components/schemas/ArticleRichTextBlock"
      },
      "minItems": 1,
      "maxItems": 500
    },
    "coverImageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "coverImageAltAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "coverImageAltEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "countryId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "universityId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "scholarshipId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "scholarshipIds": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      },
      "maxItems": 50
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "seoTitleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "seoDescriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 320
    }
  },
  "required": [
    "titleAr",
    "summaryAr",
    "bodyAr",
    "slug"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>ArticleDetail</summary>

```json
{
  "allOf": [
    {
      "$ref": "#/components/schemas/Article"
    },
    {
      "type": "object",
      "properties": {
        "scholarshipIds": {
          "type": "array",
          "items": {
            "type": "string",
            "format": "uuid"
          }
        },
        "relatedScholarships": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/ArticleRelatedScholarship"
          }
        }
      },
      "required": [
        "scholarshipIds",
        "relatedScholarships"
      ]
    }
  ]
}
```

</details>


<details><summary>ArticlePatchRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "titleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "titleEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "summaryAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "summaryEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "bodyAr": {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/ArticleRichTextBlock"
      },
      "minItems": 1,
      "maxItems": 500
    },
    "bodyEn": {
      "type": [
        "array",
        "null"
      ],
      "items": {
        "$ref": "#/components/schemas/ArticleRichTextBlock"
      },
      "minItems": 1,
      "maxItems": 500
    },
    "coverImageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "coverImageAltAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "coverImageAltEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "countryId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "universityId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "scholarshipId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "scholarshipIds": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      },
      "maxItems": 50
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "seoTitleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "seoDescriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 320
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>ArticleRelatedScholarship</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string"
    },
    "titleAr": {
      "type": "string"
    },
    "imageUrl": {
      "type": [
        "string",
        "null"
      ]
    },
    "country": {
      "type": [
        "object",
        "null"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "slug": {
          "type": "string"
        },
        "nameAr": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "slug",
        "nameAr"
      ]
    },
    "effectiveApplicationStatus": {
      "$ref": "#/components/schemas/ScholarshipApplicationStatus"
    }
  },
  "required": [
    "id",
    "slug",
    "titleAr",
    "imageUrl",
    "country",
    "effectiveApplicationStatus"
  ]
}
```

</details>


<details><summary>ArticleRichTextBlock</summary>

```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": [
        "paragraph",
        "heading2",
        "heading3",
        "bulleted-list",
        "numbered-list",
        "quote"
      ]
    },
    "text": {
      "type": "string",
      "minLength": 1,
      "maxLength": 10000
    }
  },
  "required": [
    "type",
    "text"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>AuditResourceType</summary>

```json
{
  "type": "string",
  "enum": [
    "COUNTRY",
    "UNIVERSITY",
    "SCHOLARSHIP",
    "SERVICE",
    "ARTICLE",
    "STUDENT_APPLICATION",
    "GENERAL_INQUIRY",
    "ADMIN_USER",
    "SITE_SETTINGS",
    "FAQ_ENTRY",
    "UNIVERSITY_PROGRAM",
    "ACADEMIC_MAJOR",
    "CITY",
    "UNIVERSITY_ADMISSION_REQUIREMENT",
    "UNIVERSITY_GALLERY_IMAGE"
  ]
}
```

</details>


<details><summary>AuthUserResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "user": {
          "$ref": "#/components/schemas/AdminUser"
        }
      },
      "required": [
        "user"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>ChangePasswordRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "currentPassword": {
      "type": "string",
      "minLength": 1,
      "maxLength": 128
    },
    "newPassword": {
      "type": "string",
      "minLength": 12,
      "maxLength": 128,
      "pattern": "[a-z]",
      "description": "A 12-128 character password containing lowercase, uppercase, and numeric characters."
    }
  },
  "required": [
    "currentPassword",
    "newPassword"
  ]
}
```

</details>


<details><summary>City</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "countryId": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string"
    },
    "nameAr": {
      "type": "string"
    },
    "nameEn": {
      "type": "string"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    },
    "country": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "slug": {
          "type": "string"
        },
        "nameAr": {
          "type": "string"
        },
        "nameEn": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "id",
        "slug",
        "nameAr",
        "nameEn"
      ]
    }
  },
  "required": [
    "id",
    "countryId",
    "slug",
    "nameAr",
    "nameEn",
    "createdAt",
    "updatedAt"
  ]
}
```

</details>


<details><summary>CityCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "countryId": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "nameAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "nameEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    }
  },
  "required": [
    "countryId",
    "slug",
    "nameAr",
    "nameEn"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>CityListResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/City"
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>CityResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "$ref": "#/components/schemas/City"
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>Country</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string"
    },
    "featured": {
      "type": "boolean"
    },
    "publishedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "seoTitleAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "seoDescriptionAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "nameAr": {
      "type": "string"
    },
    "nameEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "introductionAr": {
      "type": "string"
    },
    "introductionEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "detailsAr": {
      "type": "string"
    },
    "detailsEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageUrl": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageAltAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageAltEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "displayOrder": {
      "type": "integer"
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "slug",
    "featured",
    "publishedAt",
    "seoTitleAr",
    "seoDescriptionAr",
    "nameAr",
    "nameEn",
    "introductionAr",
    "introductionEn",
    "detailsAr",
    "detailsEn",
    "imageUrl",
    "imageAltAr",
    "imageAltEn",
    "displayOrder",
    "status",
    "createdAt",
    "updatedAt"
  ]
}
```

</details>


<details><summary>CountryCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "nameAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "nameEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "introductionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "introductionEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "detailsAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "detailsEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "imageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "imageAltAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "imageAltEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "displayOrder": {
      "type": "integer",
      "minimum": 0,
      "maximum": 1000000,
      "default": 0
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "seoTitleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "seoDescriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 320
    }
  },
  "required": [
    "nameAr",
    "introductionAr",
    "detailsAr",
    "slug"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>CountryPatchRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "nameAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "nameEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "introductionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "introductionEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "detailsAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "detailsEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "imageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "imageAltAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "imageAltEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "displayOrder": {
      "type": "integer",
      "minimum": 0,
      "maximum": 1000000,
      "default": 0
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "seoTitleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "seoDescriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 320
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>EmptySuccessResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {}
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>ErrorResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        false
      ]
    },
    "error": {
      "type": "object",
      "properties": {
        "code": {
          "type": "string"
        },
        "message": {
          "type": "string"
        },
        "details": {
          "anyOf": [
            {
              "type": "object",
              "additionalProperties": {}
            },
            {
              "type": "array",
              "items": {}
            }
          ]
        }
      },
      "required": [
        "code",
        "message",
        "details"
      ]
    }
  },
  "required": [
    "success",
    "error"
  ]
}
```

</details>


<details><summary>FaqCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "$ref": "#/components/schemas/FaqScope"
    },
    "parentId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid",
      "default": null
    },
    "questionAr": {
      "type": "string",
      "minLength": 2,
      "maxLength": 500
    },
    "answerAr": {
      "type": "string",
      "minLength": 2,
      "maxLength": 10000
    },
    "questionEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 2,
      "maxLength": 500
    },
    "answerEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 2,
      "maxLength": 10000
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    }
  },
  "required": [
    "scope",
    "questionAr",
    "answerAr"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>FaqOrderResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/AdminFaqEntry"
          }
        }
      },
      "required": [
        "items"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>FaqReorderRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "$ref": "#/components/schemas/FaqScope"
    },
    "parentId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid",
      "default": null
    },
    "orderedIds": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      },
      "minItems": 1
    }
  },
  "required": [
    "scope",
    "orderedIds"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>FaqScope</summary>

```json
{
  "type": "string",
  "enum": [
    "GLOBAL",
    "COUNTRY",
    "UNIVERSITY",
    "SERVICE",
    "SCHOLARSHIP"
  ]
}
```

</details>


<details><summary>FaqUpdateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "questionAr": {
      "type": "string",
      "minLength": 2,
      "maxLength": 500
    },
    "answerAr": {
      "type": "string",
      "minLength": 2,
      "maxLength": 10000
    },
    "questionEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 2,
      "maxLength": 500
    },
    "answerEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 2,
      "maxLength": 10000
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>GeneralInquiry</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "fullName": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": [
        "string",
        "null"
      ]
    },
    "subject": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "status": {
      "$ref": "#/components/schemas/SubmissionStatus"
    },
    "internalNote": {
      "type": [
        "string",
        "null"
      ]
    },
    "privacyAcceptedAt": {
      "type": "string",
      "format": "date-time"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "fullName",
    "email",
    "phone",
    "subject",
    "message",
    "status",
    "internalNote",
    "privacyAcceptedAt",
    "createdAt",
    "updatedAt"
  ]
}
```

</details>


<details><summary>GeneralInquiryListResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/GeneralInquiry"
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>GeneralInquiryResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "$ref": "#/components/schemas/GeneralInquiry"
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>ImageUploadRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "resource": {
      "$ref": "#/components/schemas/MediaResource"
    },
    "file": {
      "type": "string",
      "format": "binary",
      "description": "JPEG, PNG, or WebP image up to 4000000 bytes. The complete multipart body must not exceed 4100000 bytes."
    }
  },
  "required": [
    "resource",
    "file"
  ]
}
```

</details>


<details><summary>ImageUploadResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "$ref": "#/components/schemas/UploadedImage"
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>LoginRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "Administrator email. Input is trimmed and normalized to lowercase."
    },
    "password": {
      "type": "string",
      "minLength": 1,
      "maxLength": 128
    }
  },
  "required": [
    "email",
    "password"
  ]
}
```

</details>


<details><summary>ManagedAdminAccount</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "role": {
      "$ref": "#/components/schemas/ManagedAdminRole"
    },
    "isActive": {
      "type": "boolean"
    }
  },
  "required": [
    "id",
    "name",
    "email",
    "role",
    "isActive"
  ]
}
```

</details>


<details><summary>ManagedAdminAccountListResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/ManagedAdminAccount"
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>ManagedAdminAccountResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "$ref": "#/components/schemas/ManagedAdminAccount"
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>ManagedAdminRole</summary>

```json
{
  "type": "string",
  "enum": [
    "ADMIN",
    "SUPER_ADMIN"
  ]
}
```

</details>


<details><summary>MediaResource</summary>

```json
{
  "type": "string",
  "enum": [
    "countries",
    "universities",
    "scholarships",
    "services",
    "articles"
  ],
  "description": "Content resource that will use the uploaded image."
}
```

</details>


<details><summary>Pagination</summary>

```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "integer"
    },
    "limit": {
      "type": "integer"
    },
    "total": {
      "type": "integer"
    },
    "totalPages": {
      "type": "integer"
    }
  },
  "required": [
    "page",
    "limit",
    "total",
    "totalPages"
  ]
}
```

</details>


<details><summary>ProgramDurationUnit</summary>

```json
{
  "type": [
    "string",
    "null"
  ],
  "enum": [
    "MONTHS",
    "YEARS",
    null
  ]
}
```

</details>


<details><summary>ProgramStudyLevel</summary>

```json
{
  "type": "string",
  "enum": [
    "FOUNDATION",
    "DIPLOMA",
    "BACHELORS",
    "MASTERS",
    "PHD"
  ]
}
```

</details>


<details><summary>PublicFaqEntry</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "scope": {
      "$ref": "#/components/schemas/FaqScope"
    },
    "questionAr": {
      "type": "string"
    },
    "answerAr": {
      "type": "string"
    },
    "questionEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "answerEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "displayOrder": {
      "type": "integer"
    },
    "publishedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "scope",
    "questionAr",
    "answerAr",
    "questionEn",
    "answerEn",
    "displayOrder",
    "publishedAt"
  ]
}
```

</details>


<details><summary>PublicUniversityProgram</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "nameAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "nameEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "facultyNameAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "facultyNameEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "durationValue": {
      "type": [
        "integer",
        "null"
      ]
    },
    "durationUnit": {
      "$ref": "#/components/schemas/ProgramDurationUnit"
    },
    "academicMajor": {
      "$ref": "#/components/schemas/AcademicMajorSummary"
    },
    "studyLevel": {
      "$ref": "#/components/schemas/ProgramStudyLevel"
    },
    "languages": {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/TeachingLanguage"
      }
    },
    "officialSourceUrl": {
      "type": "string"
    },
    "verifiedAt": {
      "type": "string",
      "format": "date-time"
    },
    "publishedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "tuition": {
      "$ref": "#/components/schemas/UniversityProgramTuition"
    },
    "tuitionFees": {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/UniversityProgramTuition"
      }
    }
  },
  "required": [
    "id",
    "nameAr",
    "nameEn",
    "facultyNameAr",
    "facultyNameEn",
    "durationValue",
    "durationUnit",
    "academicMajor",
    "studyLevel",
    "languages",
    "officialSourceUrl",
    "verifiedAt",
    "publishedAt",
    "tuition",
    "tuitionFees"
  ]
}
```

</details>


<details><summary>PublicationStatus</summary>

```json
{
  "type": "string",
  "enum": [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED"
  ]
}
```

</details>


<details><summary>Scholarship</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string"
    },
    "featured": {
      "type": "boolean"
    },
    "publishedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "seoTitleAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "seoDescriptionAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "titleAr": {
      "type": "string"
    },
    "titleEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "countryId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "universityId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "studyLevel": {
      "type": "string"
    },
    "fundingType": {
      "type": "string"
    },
    "requirementsAr": {
      "type": "string"
    },
    "requirementsEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "descriptionAr": {
      "type": "string"
    },
    "descriptionEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "verifiedDeadline": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "imageUrl": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageAltAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageAltEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "officialSourceUrl": {
      "type": [
        "string",
        "null"
      ]
    },
    "applicationStatus": {
      "$ref": "#/components/schemas/ScholarshipApplicationStatus"
    },
    "effectiveApplicationStatus": {
      "$ref": "#/components/schemas/ScholarshipApplicationStatus"
    },
    "country": {
      "type": [
        "object",
        "null"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "slug": {
          "type": "string"
        },
        "nameAr": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "slug",
        "nameAr"
      ]
    },
    "university": {
      "type": [
        "object",
        "null"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "slug": {
          "type": "string"
        },
        "nameAr": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "slug",
        "nameAr"
      ]
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "slug",
    "featured",
    "publishedAt",
    "seoTitleAr",
    "seoDescriptionAr",
    "titleAr",
    "titleEn",
    "countryId",
    "universityId",
    "studyLevel",
    "fundingType",
    "requirementsAr",
    "requirementsEn",
    "descriptionAr",
    "descriptionEn",
    "verifiedDeadline",
    "imageUrl",
    "imageAltAr",
    "imageAltEn",
    "officialSourceUrl",
    "applicationStatus",
    "status",
    "createdAt",
    "updatedAt"
  ]
}
```

</details>


<details><summary>ScholarshipApplicationStatus</summary>

```json
{
  "type": "string",
  "enum": [
    "OPEN",
    "CLOSED"
  ]
}
```

</details>


<details><summary>ScholarshipCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "titleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "titleEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "countryId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "universityId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "studyLevel": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "fundingType": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "requirementsAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "requirementsEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "descriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "descriptionEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "imageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "imageAltAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "imageAltEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "verifiedDeadline": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "officialSourceUrl": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 2048,
      "format": "uri"
    },
    "applicationStatus": {
      "$ref": "#/components/schemas/ScholarshipApplicationStatus"
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "seoTitleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "seoDescriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 320
    }
  },
  "required": [
    "titleAr",
    "studyLevel",
    "fundingType",
    "requirementsAr",
    "descriptionAr",
    "slug"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>ScholarshipPatchRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "titleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "titleEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "countryId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "universityId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "studyLevel": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "fundingType": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "requirementsAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "requirementsEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "descriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "descriptionEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "imageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "imageAltAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "imageAltEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "verifiedDeadline": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "officialSourceUrl": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 2048,
      "format": "uri"
    },
    "applicationStatus": {
      "$ref": "#/components/schemas/ScholarshipApplicationStatus"
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "seoTitleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "seoDescriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 320
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>Service</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string"
    },
    "featured": {
      "type": "boolean"
    },
    "publishedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "seoTitleAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "seoDescriptionAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "titleAr": {
      "type": "string"
    },
    "titleEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "summaryAr": {
      "type": "string"
    },
    "summaryEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "descriptionAr": {
      "type": "string"
    },
    "descriptionEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageUrl": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageAltAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageAltEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "displayOrder": {
      "type": "integer"
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "slug",
    "featured",
    "publishedAt",
    "seoTitleAr",
    "seoDescriptionAr",
    "titleAr",
    "titleEn",
    "summaryAr",
    "summaryEn",
    "descriptionAr",
    "descriptionEn",
    "imageUrl",
    "imageAltAr",
    "imageAltEn",
    "displayOrder",
    "status",
    "createdAt",
    "updatedAt"
  ]
}
```

</details>


<details><summary>ServiceCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "titleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "titleEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "summaryAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "summaryEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "descriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "descriptionEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "imageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "imageAltAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "imageAltEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "displayOrder": {
      "type": "integer",
      "minimum": 0,
      "maximum": 1000000,
      "default": 0
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "seoTitleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "seoDescriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 320
    }
  },
  "required": [
    "titleAr",
    "summaryAr",
    "descriptionAr",
    "slug"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>ServicePatchRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "titleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "titleEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "summaryAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "summaryEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "descriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "descriptionEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "imageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "imageAltAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "imageAltEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "displayOrder": {
      "type": "integer",
      "minimum": 0,
      "maximum": 1000000,
      "default": 0
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "seoTitleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "seoDescriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 320
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>SiteSettings</summary>

```json
{
  "type": "object",
  "properties": {
    "academyNameAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "academyNameEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "contactEmail": {
      "type": [
        "string",
        "null"
      ],
      "format": "email"
    },
    "contactPhone": {
      "type": [
        "string",
        "null"
      ]
    },
    "addressAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "addressEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "facebookUrl": {
      "type": [
        "string",
        "null"
      ],
      "format": "uri"
    },
    "instagramUrl": {
      "type": [
        "string",
        "null"
      ],
      "format": "uri"
    },
    "linkedinUrl": {
      "type": [
        "string",
        "null"
      ],
      "format": "uri"
    },
    "youtubeUrl": {
      "type": [
        "string",
        "null"
      ],
      "format": "uri"
    },
    "updatedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    }
  },
  "required": [
    "academyNameAr",
    "academyNameEn",
    "contactEmail",
    "contactPhone",
    "addressAr",
    "addressEn",
    "facebookUrl",
    "instagramUrl",
    "linkedinUrl",
    "youtubeUrl",
    "updatedAt"
  ]
}
```

</details>


<details><summary>SiteSettingsResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "$ref": "#/components/schemas/SiteSettings"
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>SiteSettingsUpdateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "academyNameAr": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 200
    },
    "academyNameEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 200
    },
    "contactEmail": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 254
    },
    "contactPhone": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 7,
      "maxLength": 25,
      "pattern": "^\\+?[0-9][0-9 ()-]{5,23}[0-9]$"
    },
    "addressAr": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 1000
    },
    "addressEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 1000
    },
    "facebookUrl": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 2048,
      "format": "uri"
    },
    "instagramUrl": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 2048,
      "format": "uri"
    },
    "linkedinUrl": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 2048,
      "format": "uri"
    },
    "youtubeUrl": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 2048,
      "format": "uri"
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>StudentApplication</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "applicationType": {
      "$ref": "#/components/schemas/StudentApplicationType"
    },
    "scholarshipId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "countryId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "universityId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "studyLevel": {
      "type": [
        "string",
        "null"
      ]
    },
    "intendedMajor": {
      "type": [
        "string",
        "null"
      ]
    },
    "fullName": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": [
        "string",
        "null"
      ]
    },
    "message": {
      "type": "string"
    },
    "status": {
      "$ref": "#/components/schemas/SubmissionStatus"
    },
    "internalNote": {
      "type": [
        "string",
        "null"
      ]
    },
    "privacyAcceptedAt": {
      "type": "string",
      "format": "date-time"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "applicationType",
    "scholarshipId",
    "countryId",
    "universityId",
    "studyLevel",
    "intendedMajor",
    "fullName",
    "email",
    "phone",
    "message",
    "status",
    "internalNote",
    "privacyAcceptedAt",
    "createdAt",
    "updatedAt"
  ]
}
```

</details>


<details><summary>StudentApplicationListResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/StudentApplication"
          }
        },
        "pagination": {
          "type": "object",
          "properties": {
            "page": {
              "type": "integer"
            },
            "limit": {
              "type": "integer"
            },
            "total": {
              "type": "integer"
            },
            "totalPages": {
              "type": "integer"
            }
          },
          "required": [
            "page",
            "limit",
            "total",
            "totalPages"
          ]
        }
      },
      "required": [
        "items",
        "pagination"
      ]
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>StudentApplicationResponse</summary>

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "enum": [
        true
      ]
    },
    "data": {
      "$ref": "#/components/schemas/StudentApplication"
    }
  },
  "required": [
    "success",
    "data"
  ]
}
```

</details>


<details><summary>StudentApplicationType</summary>

```json
{
  "type": "string",
  "enum": [
    "UNIVERSITY_ADMISSION",
    "SCHOLARSHIP_ASSISTANCE"
  ]
}
```

</details>


<details><summary>SubmissionStatus</summary>

```json
{
  "type": "string",
  "enum": [
    "NEW",
    "IN_REVIEW",
    "RESOLVED",
    "CLOSED"
  ]
}
```

</details>


<details><summary>SubmissionStatusUpdateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "status": {
      "$ref": "#/components/schemas/SubmissionStatus"
    },
    "internalNote": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 5000,
      "description": "Private administrative note. Never returned publicly."
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>TeachingLanguage</summary>

```json
{
  "type": "string",
  "enum": [
    "ARABIC",
    "ENGLISH",
    "FRENCH",
    "GERMAN",
    "TURKISH",
    "ROMANIAN",
    "RUSSIAN",
    "SPANISH",
    "ITALIAN"
  ]
}
```

</details>


<details><summary>TuitionBillingPeriod</summary>

```json
{
  "type": "string",
  "enum": [
    "YEAR",
    "SEMESTER",
    "FULL_PROGRAM"
  ]
}
```

</details>


<details><summary>University</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "slug": {
      "type": "string"
    },
    "featured": {
      "type": "boolean"
    },
    "publishedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "seoTitleAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "seoDescriptionAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "nameAr": {
      "type": "string"
    },
    "nameEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "officialName": {
      "type": "string"
    },
    "countryId": {
      "type": "string",
      "format": "uuid"
    },
    "cityId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "universityType": {
      "allOf": [
        {
          "$ref": "#/components/schemas/UniversityType"
        },
        {
          "type": [
            "string",
            "null"
          ]
        }
      ]
    },
    "cityAr": {
      "type": "string"
    },
    "cityEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "overviewAr": {
      "type": "string"
    },
    "overviewEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "officialWebsite": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageUrl": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageAltAr": {
      "type": [
        "string",
        "null"
      ]
    },
    "imageAltEn": {
      "type": [
        "string",
        "null"
      ]
    },
    "country": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "slug": {
          "type": "string"
        },
        "nameAr": {
          "type": "string"
        },
        "nameEn": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "required": [
        "id",
        "slug",
        "nameAr",
        "nameEn"
      ]
    },
    "city": {
      "type": [
        "object",
        "null"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "slug": {
          "type": "string"
        },
        "nameAr": {
          "type": "string"
        },
        "nameEn": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "slug",
        "nameAr",
        "nameEn"
      ]
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "slug",
    "featured",
    "publishedAt",
    "seoTitleAr",
    "seoDescriptionAr",
    "nameAr",
    "nameEn",
    "officialName",
    "countryId",
    "cityId",
    "universityType",
    "cityAr",
    "cityEn",
    "overviewAr",
    "overviewEn",
    "officialWebsite",
    "imageUrl",
    "imageAltAr",
    "imageAltEn",
    "status",
    "createdAt",
    "updatedAt"
  ]
}
```

</details>


<details><summary>UniversityAdmissionRequirementCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "$ref": "#/components/schemas/AdmissionRequirementScope"
    },
    "studyLevel": {
      "allOf": [
        {
          "$ref": "#/components/schemas/ProgramStudyLevel"
        },
        {
          "type": [
            "string",
            "null"
          ]
        }
      ]
    },
    "programId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid",
      "default": null
    },
    "contentAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "contentEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 20000
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "officialSourceUrl": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 2048,
      "format": "uri",
      "default": null
    },
    "verifiedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time",
      "default": null
    }
  },
  "required": [
    "scope",
    "contentAr"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>UniversityAdmissionRequirementUpdateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "contentAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "contentEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 20000
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "officialSourceUrl": {
      "type": [
        "string",
        "null"
      ],
      "maxLength": 2048,
      "format": "uri"
    },
    "verifiedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>UniversityCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "nameAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "nameEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "officialName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "countryId": {
      "type": "string",
      "format": "uuid"
    },
    "cityId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "universityType": {
      "allOf": [
        {
          "$ref": "#/components/schemas/UniversityType"
        },
        {
          "type": [
            "string",
            "null"
          ]
        }
      ]
    },
    "cityAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "cityEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "overviewAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "overviewEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "officialWebsite": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "imageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "imageAltAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "imageAltEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "seoTitleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "seoDescriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 320
    }
  },
  "required": [
    "nameAr",
    "officialName",
    "countryId",
    "cityAr",
    "overviewAr",
    "slug"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>UniversityGalleryImageCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "imageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "altAr": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 500,
      "default": null
    },
    "altEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 500,
      "default": null
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    }
  },
  "required": [
    "imageUrl"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>UniversityGalleryImageUpdateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "imageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "altAr": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 500,
      "default": null
    },
    "altEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 500,
      "default": null
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>UniversityGalleryReorderRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "orderedIds": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      },
      "maxItems": 100
    }
  },
  "required": [
    "orderedIds"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>UniversityPatchRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "nameAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "nameEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "officialName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "countryId": {
      "type": "string",
      "format": "uuid"
    },
    "cityId": {
      "type": [
        "string",
        "null"
      ],
      "format": "uuid"
    },
    "universityType": {
      "allOf": [
        {
          "$ref": "#/components/schemas/UniversityType"
        },
        {
          "type": [
            "string",
            "null"
          ]
        }
      ]
    },
    "cityAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "cityEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "overviewAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "overviewEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20000
    },
    "officialWebsite": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "imageUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "imageAltAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "imageAltEn": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "slug": {
      "type": "string",
      "minLength": 2,
      "maxLength": 120,
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "seoTitleAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "seoDescriptionAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 320
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>UniversityProgramCreateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "academicMajorId": {
      "type": "string",
      "format": "uuid"
    },
    "nameAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "nameEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 300
    },
    "facultyNameAr": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 300
    },
    "facultyNameEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 300
    },
    "durationValue": {
      "type": [
        "integer",
        "null"
      ],
      "minimum": 1,
      "maximum": 240
    },
    "durationUnit": {
      "$ref": "#/components/schemas/ProgramDurationUnit"
    },
    "studyLevel": {
      "$ref": "#/components/schemas/ProgramStudyLevel"
    },
    "languages": {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/TeachingLanguage"
      },
      "minItems": 1,
      "maxItems": 9
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "officialSourceUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "verifiedAt": {
      "type": "string",
      "format": "date-time"
    },
    "tuition": {
      "$ref": "#/components/schemas/UniversityProgramTuitionInput"
    }
  },
  "required": [
    "academicMajorId",
    "nameAr",
    "studyLevel",
    "languages",
    "officialSourceUrl",
    "verifiedAt"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>UniversityProgramTuition</summary>

```json
{
  "allOf": [
    {
      "$ref": "#/components/schemas/UniversityProgramTuitionInput"
    },
    {
      "type": [
        "object",
        "null"
      ],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": [
        "id",
        "createdAt",
        "updatedAt"
      ],
      "additionalProperties": false
    }
  ]
}
```

</details>


<details><summary>UniversityProgramTuitionInput</summary>

```json
{
  "type": "object",
  "properties": {
    "amount": {
      "type": "string",
      "pattern": "^(?:0|[1-9]\\d{0,9})(?:\\.\\d{1,2})?$"
    },
    "currency": {
      "type": "string",
      "pattern": "^[A-Z]{3}$"
    },
    "billingPeriod": {
      "$ref": "#/components/schemas/TuitionBillingPeriod"
    },
    "academicYear": {
      "type": "string",
      "pattern": "^\\d{4}\\/\\d{4}$"
    }
  },
  "required": [
    "amount",
    "currency",
    "billingPeriod",
    "academicYear"
  ],
  "additionalProperties": false
}
```

</details>


<details><summary>UniversityProgramUpdateRequest</summary>

```json
{
  "type": "object",
  "properties": {
    "academicMajorId": {
      "type": "string",
      "format": "uuid"
    },
    "nameAr": {
      "type": "string",
      "minLength": 1,
      "maxLength": 300
    },
    "nameEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 300
    },
    "facultyNameAr": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 300
    },
    "facultyNameEn": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1,
      "maxLength": 300
    },
    "durationValue": {
      "type": [
        "integer",
        "null"
      ],
      "minimum": 1,
      "maximum": 240
    },
    "durationUnit": {
      "$ref": "#/components/schemas/ProgramDurationUnit"
    },
    "studyLevel": {
      "$ref": "#/components/schemas/ProgramStudyLevel"
    },
    "languages": {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/TeachingLanguage"
      },
      "minItems": 1,
      "maxItems": 9
    },
    "status": {
      "$ref": "#/components/schemas/PublicationStatus"
    },
    "officialSourceUrl": {
      "type": "string",
      "maxLength": 2048,
      "format": "uri"
    },
    "verifiedAt": {
      "type": "string",
      "format": "date-time"
    },
    "tuition": {
      "$ref": "#/components/schemas/UniversityProgramTuitionInput"
    }
  },
  "additionalProperties": false
}
```

</details>


<details><summary>UniversityType</summary>

```json
{
  "type": "string",
  "enum": [
    "PUBLIC",
    "PRIVATE"
  ]
}
```

</details>


<details><summary>UploadedImage</summary>

```json
{
  "type": "object",
  "properties": {
    "assetId": {
      "type": "string"
    },
    "publicId": {
      "type": "string"
    },
    "secureUrl": {
      "type": "string",
      "format": "uri"
    },
    "format": {
      "type": "string",
      "enum": [
        "jpg",
        "png",
        "webp"
      ]
    },
    "bytes": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "width": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "height": {
      "type": "integer",
      "exclusiveMinimum": 0
    }
  },
  "required": [
    "assetId",
    "publicId",
    "secureUrl",
    "format",
    "bytes",
    "width",
    "height"
  ]
}
```

</details>


