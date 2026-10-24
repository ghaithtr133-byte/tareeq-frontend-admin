# Tareeq Academy Admin

Independent Arabic-first administration foundation for Tareeq Academy. This repository is intentionally separate from the public website (`tareeq-frontend`) and shared Hono Backend (`tareeq-api`).

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS and reusable UI primitives
- Axios for all HTTP transport
- TanStack Query for client-side server state
- React Hook Form + Zod for safe login form validation

## Getting started

```bash
npm install
copy .env.example .env.local
npm run dev
```

Useful commands:

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment

`NEXT_PUBLIC_API_BASE_URL` is the browser-safe API base URL and must end in the approved `/api/v1` namespace. The template targets `https://tareeq-api.vercel.app/api/v1`; for separate Admin deployments, use the approved Backend origin plus `/api/v1` and ensure that exact Admin origin is allowed by the Backend's credentialed CORS and origin-validation policy. This application does not proxy API calls. `API_BASE_URL` is server-only and must never use the `NEXT_PUBLIC_` prefix.

The browser Axios instance uses `withCredentials: true` for Backend-managed HttpOnly sessions. It stores no token in local or session storage. The server client is isolated with `server-only` and does not forward cookies implicitly.

## Authentication

Authentication uses the approved Backend cookie-session endpoints: `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`, and `POST /auth/logout`. The browser starts from `/auth/me`; a single deduplicated refresh is attempted only after that request returns `401`, followed by a second `/auth/me` verification. Network failures stay recoverable and are never treated as logout.

The application never stores or reads tokens in JavaScript. Login is considered complete only after `/auth/me` confirms the authenticated user. A confirmed logout or invalid session clears the in-memory TanStack Query cache before navigation. Refresh returns the active administrator while rotating HttpOnly cookies; the client still follows it with `/auth/me` before restoring the session.

API resource functions live under `api/`; custom `useQuery` hooks live only in `hook/queries/`, and `useMutation` hooks only in `hook/mutations/`.

## Development-only mock access

Local UI work can opt into the in-memory Dashboard fixture by adding `ADMIN_DEV_MOCK_ACCESS=enabled` to `.env.local`. The value is evaluated by the server and is ignored whenever `NODE_ENV=production`, even if it is set. Mock mode never sends authentication or content requests to the Backend, does not create cookies or tokens, and keeps the selected role and fixtures only in browser memory. A page reload or development-server restart resets mock state.

The visible development control can switch between `ADMIN`, `SUPER_ADMIN`, and signed-out states, reset fixtures, and exercise normal, empty, delayed, validation, forbidden, server-failure, and network-failure content states. Disable or remove the variable to return to the real Axios/cookie-session integration.

Outstanding live verification and missing Backend contracts are tracked in `docs/admin-pending-integrations.md`.

## Roles and navigation

Only `ADMIN` and `SUPER_ADMIN` are represented in `lib/admin.ts`. Shared navigation is available to both; Analytics, Audit Log, Admins, and Settings are visible only for `SUPER_ADMIN`. The navigation is a role-driven UI presentation layer, not an authorization boundary. The Backend remains responsible for authorization.

## Structure

```text
app/                 App Router pages and global RTL styles
api/                 Axios clients, error normalization, query keys
components/          Dashboard shell, states, and UI primitives
hook/queries/        Session query hooks
hook/mutations/      Login and logout mutation hooks
lib/                 Role and navigation types
providers/           Stable TanStack Query client provider
```
##
