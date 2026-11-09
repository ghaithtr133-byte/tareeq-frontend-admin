# Backend requests — 108 integration, Phase 1 closure

Date: 2026-11-07. Evidence: [published OpenAPI](https://api.tareeq-academy.com/openapi.json), retrieved with one public GET (200); the relevant operations and schemas match the supplied export. No authenticated production request or production mutation was made in this closure pass.

## 1. Clarify the atomic Gallery reorder limit for 101+ non-archived associations

**Classification:** confirmed contract gap **if** more than 100 non-archived associations are reachable. No production University with that condition, or production write failure, was established.

- **Endpoint:** `PATCH /api/v1/admin/universities/{universityId}/gallery/order`; read source: `GET /api/v1/admin/universities/{universityId}/gallery?page={page}&limit=100`.
- **Expected:** reorder every `DRAFT` and `PUBLISHED` association for one University in one ordered, atomic request; exclude `ARCHIVED`. A stale or incomplete set returns `409 GALLERY_ORDER_SET_MISMATCH`.
- **Documented contradiction:** the operation requires every non-archived ID, but `UniversityGalleryReorderRequest.properties.orderedIds.maxItems` is 100. If 101 active associations exist, no valid request can satisfy both constraints. The GET page limit of 100 is not a total collection limit.
- **Sanitized reproduction:** in a non-production/intercepted fixture, provide 101 distinct active IDs plus four archived IDs across two pages. Submitting all 101 is invalid by schema; truncating to 100 violates the full-set rule. Local UI reads both pages, reports the limit, and offers no Save or PATCH. Separately, a 100-active mixed set can be sent in full; an intercepted 409 locks the editor until explicit reload. No reproduction requires creating production data.
- **Required Backend answer:** Is the number of non-archived associations capped at 100 on the server, including attach and any status transition that reactivates an association? If yes, document the invariant, error response, and handling of pre-existing oversized sets. If no, publish and implement a sufficient full-set limit (or another explicitly documented atomic reorder contract) and document its concurrency/error semantics. Do not ask the frontend to batch the current endpoint.
- **Acceptance criteria:** either (a) 101 active associations are provably prevented by documented server enforcement and oversized legacy data has a supported resolution, or (b) a complete 101+ active set is valid and atomically reorders without dropping IDs; archived IDs remain excluded, stale sets remain rejected, and pagination remains usable. Verify in a Backend-approved non-production environment.
- **Waiting on Backend:** yes, for >100 support or an authoritative invariant. Existing <=100 frontend behavior needs no code change.

## 2. Revalidate the historical Analytics Summary HTTP 500

**Classification:** historical authenticated failure; current behavior **unverified / blocked by access**, not a confirmed regression in the new release.

- **Endpoint/query:** `GET https://api.tareeq-academy.com/api/v1/admin/analytics/summary?granularity=day&topLimit=10` (`SUPER_ADMIN`).
- **Expected:** HTTP 200 with `AnalyticsSummaryResponse`: `success: true`, required UTC `range`, `totals`, independent browser-reported and server-verified conversion objects, `conversionRates`, `trends`, `topPages`, `trafficSources`, `ctaEngagement`, and `funnel`. Valid zero-activity periods return zeros and empty arrays, not a fabricated dataset. No student identities, messages, private notes, tokens, or raw form data.
- **Evidence:** earlier Phase 4 authenticated acceptance observed HTTP 500; no fresh UTC timestamp or sanitized error code exists for this closure because no authorized session was available. Current OpenAPI still defines the same success shape and valid query. The local adapter accepts an empty period; previous synthetic 200/500 tests verified mapping and error propagation.
- **Sanitized reproduction:** follow the one-GET browser checklist in [the closure report](admin-backend-108-phase1-report.md#h-final-closure--2026-11-07). If it returns 500, provide exact URL/query, approximate UTC time, status, and allowlisted `error.code` if available. Do not retry, export a HAR, copy headers/cookies, or share the response body. A live HTTP 500 occurs before frontend schema mapping. A live 200 with mismatched shape requires response-contract investigation; 200 with conforming data but a render error indicates a separate frontend investigation.
- **Required Backend action:** once an owner supplies a fresh 500 observation, correlate the sanitized request with server logs and fix the failing query/aggregation/serialization path. Confirm the default documented query works for both empty and populated periods. Do not invent an error code or root cause until verified.
- **Acceptance criteria:** one authorized read-only default query returns conforming HTTP 200 with the documented structures and no private data; supported empty period retains all required keys. If the first new check already returns conforming 200, close the historical failure without filing a new Backend bug.
- **Waiting:** owner access/evidence first. Backend remediation is conditional on a fresh failure, not assumed necessary today.
