# Admin pending integrations

This register covers live Backend work that is intentionally not replaced by the development-only in-memory fixtures. Mock data exists only when `ADMIN_DEV_MOCK_ACCESS=enabled` outside production and is never evidence of live API success.

## Completed development mock UI verification

- Local Playwright verification exercised mock `ADMIN` and `SUPER_ADMIN` navigation, logout/re-entry, protected routes, the six-width RTL responsive matrix, and the production-excluded mock gate.
- The five content modules completed mock list/filter/sort/pagination, create, validation, edit, `DRAFT`/`PUBLISHED`/`ARCHIVED` transitions, archive visibility, and recoverable empty/403/409/400/500/network states.
- Relationship selectors were verified with 60+ in-memory countries and universities, including search, a selection beyond the first 50 results, dependent university filtering, empty results, and persistence after save.
- Article block editing was verified through add, all approved block types, reorder, remove, save, and reopen. The fixtures and verification are local-only; no real authentication or content endpoint was contacted.

## Local same-site resume status

The Backend team reports that its local harness passed HTTP acceptance (84/84) and Chrome authentication (20/20) for the same-site topology `http://localhost:3001` (Admin) → `http://localhost:3002` (API). This is **BACKEND-REPORTED**, not yet independent Admin Dashboard evidence.

- The Admin-only ignored `.env.local` is prepared with `NEXT_PUBLIC_API_BASE_URL` and `API_BASE_URL` set to `http://localhost:3002/api/v1`, and `ADMIN_DEV_MOCK_ACCESS=disabled`. The `/api/v1` prefix is present exactly once.
- On 2026-10-22, this workspace observed no TCP listener at `localhost:3002`; therefore no local Backend or OpenAPI request could be made.
- Port `localhost:3001` is currently held by a Next.js process from the separate public-website checkout, not this Admin repository. It was deliberately not stopped. The Admin development server consequently has not been restarted with the real-mode environment.
- To resume independent browser verification, Backend must start its documented local service on `localhost:3002`, and the Project Owner must free or reassign the documented Admin port `localhost:3001` before starting this repository in real mode. Both origins must remain `localhost` (not `127.0.0.1`).

## Development proxy against the deployed API

- On 2026-10-25, this Admin repository added a development-only, same-origin `/__dev_api` route. It has a fixed upstream of `https://api.tareeq-academy.com/api/v1`, forwards only documented health, auth, and Admin content operations, does not accept an upstream URL, and returns `404` without forwarding in production.
- A local real-mode Admin server verified `GET /__dev_api/health` → upstream health `200`, while unauthenticated `/auth/me` and `/admin/countries` correctly returned upstream `401`. The proxy retains request IDs, query strings, cookies, Origin, Referer, and CSRF headers; it disables response caching and preserves distinct upstream `Set-Cookie` values, mapping only `/api/v1` cookie paths to `/__dev_api`.
- Authentication is still **BLOCKED — BACKEND TRUSTED-ORIGIN DECISION**. A schema-invalid login request through the local proxy, sent with its real local Origin and Referer and no credentials, returned Backend `403`. The proxy intentionally does not rewrite either header. Backend must explicitly authorize the selected local loopback origin or approve a specific Origin/Referer normalization rule before a Project Owner manually enters either account's credentials.

## Historical deployed cross-site session blocker

Real Administrator accounts exist and credentials are available through the approved secure workflow. They are not the blocker and must not be copied into source, test fixtures, logs, screenshots, or reports.

- Browser origin tested: `http://localhost:3000`.
- Backend origin: `https://tareeq-api.vercel.app`.
- `POST /api/v1/auth/login` returned HTTP 200, but Chrome blocked the Backend `Set-Cookie` headers because the Access and Refresh cookies use `SameSite=Lax` in a cross-site response that is not a top-level navigation.
- Consequently, the next `GET /api/v1/auth/me` returned HTTP 401 and `POST /api/v1/auth/refresh` returned HTTP 401. This is not credential, Axios URL, or role evidence.
- The Admin client retains `withCredentials: true`, Backend-managed HttpOnly sessions, bounded `/auth/me` → refresh → `/auth/me` recovery, and no browser token storage. It must not add a proxy, BFF, or bearer-token fallback.
- A credential and partial session-cookie exposure occurred during earlier debugging. Backend/Security must rotate the exposed credential and invalidate affected sessions through the approved security workflow.

## Production integration handoff

- On 2026-10-24, `https://admin.tareeq-academy.com` and its actual `/admin/login` route were reachable over HTTPS, and `https://api.tareeq-academy.com/docs` served the Scalar reference for the `https://api.tareeq-academy.com` production base and `/api/v1` prefix.
- The production API OpenAPI document returned HTTP 200. Contract review confirms the five Admin resources expose only the documented GET, POST, GET-by-UUID, and PATCH operations; no DELETE or standalone publication endpoint is used by this frontend.
- The Project Lead reports that the Admin Vercel production environment variables are not yet configured. Consequently, successful deployed-browser login, HttpOnly cookie persistence, credentialed CORS/CSRF, `/auth/me`, refresh, logout, ADMIN/SUPER_ADMIN RBAC, and live content GET verification remain **BLOCKED — PROJECT OWNER / VERCEL CONFIGURATION**.
- The checked-in production template uses `https://api.tareeq-academy.com/api/v1` exactly once. The Project Owner must set the matching browser-safe deployment value (`NEXT_PUBLIC_API_BASE_URL`) and server-only value (`API_BASE_URL`) in the Admin Vercel project, disable mock access, redeploy, and then provide a manual browser sign-in session for independent verification. This register does not treat template values as proof of deployed configuration.

## Postman read-only verification handoff

- The Project Owner verified separately that both real `ADMIN` and `SUPER_ADMIN` accounts can authenticate through Postman and that `GET /api/v1/auth/me` returns HTTP 200 in each respective Postman Cookie Jar session. This is **VERIFIED — OWNER-OBSERVED** identity evidence, not browser E2E evidence.
- The safe collection is [tareeq-admin-read-only-verification.postman_collection.json](../tests/postman/tareeq-admin-read-only-verification.postman_collection.json). It contains exactly eleven `GET` requests: `/auth/me`, plus a list and dynamic UUID detail request for each of countries, universities, scholarships, services, and articles. It contains no Login, Logout, POST, PATCH, DELETE, publication, archive, or other mutating request.
- List requests assert the documented success envelope, HTTP 200, pagination metadata, appropriate record fields, publication/application states, nullable fields, relationships, and article flat blocks. Each list stores only a returned record UUID in a transient collection variable for its subsequent detail request. A detail request is skipped when its corresponding list has no records and must be reported as **NOT VERIFIED — NO DATA**.
- This workspace cannot access the owner’s Postman Cookie Jar. Consequently, live content GET results are **NOT EXECUTED IN THIS ENVIRONMENT** until the Project Owner imports and runs the safe collection separately for `ADMIN` and `SUPER_ADMIN`. Do not promote the collection preparation or owner identity evidence to live content GET PASS.

| Dependency / prerequisite | Affected feature | Current UI / mock state | Owner | Follow-up | Contract / endpoint |
| --- | --- | --- | --- | --- | --- |
| Existing `ADMIN` account and secure credential workflow | Real ADMIN session verification | Account exists. **BLOCKED — local Backend/port unavailable;** Backend harness separately reports local authentication PASS, but the Admin Dashboard browser is not yet independently verified. | Backend / Project Owner | Start the documented Backend on `localhost:3002`, free/assign Admin `localhost:3001`, then sign in manually and verify login, `/auth/me`, refresh, logout, and RBAC without logging credentials. | `POST /api/v1/auth/login`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout` |
| Existing `SUPER_ADMIN` account and secure credential workflow | Super Admin navigation and authorization | Account exists. **BLOCKED — local Backend/port unavailable;** Backend harness result is not Admin Dashboard role evidence. | Backend / Project Owner | After the local topology is available, sign in manually in a separate session and verify role navigation and Backend authorization. | Same auth contract |
| Authenticated Postman identity check | `ADMIN` and `SUPER_ADMIN` identity | **VERIFIED — OWNER-OBSERVED:** each role authenticated and `/auth/me` returned 200 in its own Postman session | Project Owner | Run the read-only collection separately for each role; do not share cookies, credentials, or exports | `GET /api/v1/auth/me` |
| Local same-site cookie/session policy | All local authenticated requests | **NOT VERIFIED — ADMIN DASHBOARD.** Backend reports its `localhost:3001` → `localhost:3002` harness PASS; this workspace cannot independently test until the Backend listener and Admin port are available. | Backend / Project Owner | Start both documented local services, then verify credentialed CORS, HttpOnly cookies, CSRF, `/auth/me`, refresh, and logout in the actual Dashboard. | `http://localhost:3001` → `http://localhost:3002` |
| Development proxy trusted-origin policy | Local browser session via `/__dev_api` to deployed API | Proxy and safe health forwarding verified; **BLOCKED — Backend returned `403` to the real local Origin/Referer before credentials were entered.** | Backend / Project Owner | Explicitly allow the selected loopback Admin origin, or approve the exact secure normalization rule, then manually sign in as each role and verify cookie/session behavior. | `http://localhost:<port>/__dev_api` → `https://api.tareeq-academy.com/api/v1` |
| Production Admin Vercel environment | Deployed cookie session and all Admin API reads | **BLOCKED — Project Lead reports Vercel production variables are not configured.** HTTPS route/API documentation reachability is not authenticated E2E evidence. | Project Owner | Configure and redeploy the Admin with `NEXT_PUBLIC_API_BASE_URL=https://api.tareeq-academy.com/api/v1`, `API_BASE_URL=https://api.tareeq-academy.com/api/v1`, and production-disabled mock access; then manually verify both roles in Chrome. | `https://admin.tareeq-academy.com` → `https://api.tareeq-academy.com` |
| Expired-session behavior | Session recovery and content `401` | Client revalidates the session; live pending | Backend / Frontend | Verify access expiry, one refresh attempt, terminal redirect, and that POST/PATCH are not replayed | `/auth/me`, `/auth/refresh` |
| Live Admin Content GET results | Countries, universities, scholarships, services, articles | Safe read-only Postman collection prepared; **NOT EXECUTED — local Backend unavailable and actual Dashboard authentication not established.** | Backend / Project Owner / Frontend | Establish a real Dashboard session, then verify list and detail GET requests for both roles without mutating shared data. | `/api/v1/admin/{countries,universities,scholarships,services,articles}` |
| Live content mutation authorization | Countries, universities, scholarships, services, articles | **PENDING OWNER AUTHORIZATION** | Project Owner | POST/PATCH, publication, archive, and test-record changes remain prohibited even after successful GET verification. | Same content endpoints |
| Relationship selector scale | Country, university, scholarship selectors | UI pages collection responses beyond the first 50; live pending | Frontend / Backend | Validate performance and pagination with production-sized data; add a documented search strategy only if necessary | Existing documented list `page`, `limit`, `search` parameters where available |
| Media/upload contract | Image management | URL fields only; no media UI | Backend | Publish upload/media endpoint and response schema before implementation | Missing |
| Applications and inquiries contracts | Deferred Dashboard modules | Disabled navigation only | Backend | Publish approved endpoints, schemas, roles, and pagination/filter semantics | Missing |
| Analytics, audit logs, admins, settings contracts | Deferred Super Admin modules | Disabled navigation only | Backend | Publish approved endpoints, schemas, roles, and audit/retention rules | Missing |

## Current contract notes

- The approved content contract provides list, get, create, and update operations. No deletion or publication-action endpoint is assumed; publication changes use the documented update semantics.
- Scholarships retain separate editorial publication (`DRAFT`/`PUBLISHED`/`ARCHIVED`) and application (`OPEN`/`CLOSED`) statuses. A closed application does not change editorial publication.
- The frontend must continue to treat Backend authorization as authoritative. Role-aware navigation is presentation only.
