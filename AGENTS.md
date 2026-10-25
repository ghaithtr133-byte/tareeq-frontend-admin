# Tareeq Admin Working Agreement

- Implement only approved Linear tasks; the Project Lead owns scope and architecture.
- Work only in this `tareeq-admin` repository. Never modify the public website repository from an Admin task.
- Do not invent API endpoints, authentication schemas, refresh flows, or backend behavior. Authentication is owned by the Hono Backend.
- Preserve unrelated changes and do not couple this codebase to the public website.
- Keep API resource functions separate from React hooks. Use `hook/queries/` and `hook/mutations/` exclusively for custom Query and Mutation hooks.
- Never persist session tokens in browser storage. Respect HttpOnly cookie sessions and approved Backend contracts.
- Verify typecheck, lint, and production build before reporting work. Do not start another task without approval.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
