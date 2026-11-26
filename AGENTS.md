# Tareeq Admin Working Agreement

- Implement only approved Linear tasks; the Project Lead owns scope and architecture.
- Work only in this `tareeq-admin` repository. Never modify the public website repository from an Admin task.
- Do not invent API endpoints, authentication schemas, refresh flows, or backend behavior. Authentication is owned by the Hono Backend.
- Preserve unrelated changes and do not couple this codebase to the public website.
- Keep API resource functions separate from React hooks. Use `hook/queries/` and `hook/mutations/` exclusively for custom Query and Mutation hooks.
- Never persist session tokens in browser storage. Respect HttpOnly cookie sessions and approved Backend contracts.
- Verify typecheck, lint, and production build before reporting work. Do not start another task without approval.

## Backend API Contract Rules

- The `tareeq-api` Backend is the single source of truth for API contracts.
- Production API documentation: [https://api.tareeq-academy.com/docs](https://api.tareeq-academy.com/docs)
- Authoritative deployed OpenAPI specification: [https://api.tareeq-academy.com/openapi.json](https://api.tareeq-academy.com/openapi.json).
- Deployed Postman collection: [https://api.tareeq-academy.com/postman/collection.json](https://api.tareeq-academy.com/postman/collection.json).
- Use the deployed OpenAPI specification as the primary source before implementing or modifying any API integration.
- Use the deployed Postman collection as a complementary reference for request examples and documented multi-step workflows.
- Do not require manually uploaded Postman collections when the deployed OpenAPI specification and deployed Postman collection are available.
- Request or inspect additional Backend source or `docs/admin-frontend-handoff.md` only when the deployed specification is incomplete, inconsistent, or does not include an unreleased feature.
- Distinguish unpublished local Backend changes from deployed Production changes.
- Detect relevant contract changes before modifying Frontend integrations.
- Never invent endpoints, fields, permissions, or response schemas.
- Do not rely on previously uploaded or outdated Postman collections.
- If documentation is inaccessible or inconsistent, report the exact blocker.
- Do not automatically modify existing integrations without a relevant task.
- Preserve existing functionality and unrelated working-tree changes.

## Performance Requirements

- Contract verification is a development-time operation only.
- Never fetch OpenAPI or Postman collections at application runtime.
- Minimize API requests, duplicate fetching, unnecessary refetching, and re-renders.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
