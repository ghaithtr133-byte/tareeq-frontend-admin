# Tareeq Admin Working Agreement

- Implement only approved Linear tasks; the Project Lead owns scope and architecture.
- Work only in this `tareeq-admin` repository. Never modify the public website repository from an Admin task.
- Do not invent API endpoints, authentication schemas, refresh flows, or backend behavior. Authentication is owned by the Hono Backend.
- Preserve unrelated changes and do not couple this codebase to the public website.
- Keep API resource functions separate from React hooks. Use `hook/queries/` and `hook/mutations/` exclusively for custom Query and Mutation hooks.
- Never persist session tokens in browser storage. Respect HttpOnly cookie sessions and approved Backend contracts.
- Verify typecheck, lint, and production build before reporting work. Do not start another task without approval.
