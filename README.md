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

`NEXT_PUBLIC_API_BASE_URL` is the browser-safe API base URL and must end in the approved `/api/v1` namespace. `API_BASE_URL` is server-only and must never use the `NEXT_PUBLIC_` prefix. No deployed backend URL is assumed in this repository.

The browser Axios instance uses `withCredentials: true` for Backend-managed HttpOnly sessions. It stores no token in local or session storage. The server client is isolated with `server-only` and does not forward cookies implicitly.

## Authentication status

The Backend authentication contract was not supplied with this task. Therefore there are deliberately no guessed login, logout, refresh, or session requests. The login UI validates input and explicitly reports that integration is pending; `/admin` redirects to login until an approved session endpoint and response schema are available.

Once approved, add resource functions under `api/`, `useQuery` hooks only under `hook/queries/`, and `useMutation` hooks only under `hook/mutations/`. Invalidate targeted keys from `api/query-keys.ts` after successful mutations. Session-changing mutations must clear or invalidate private query caches.

## Roles and navigation

Only `ADMIN` and `SUPER_ADMIN` are represented in `lib/admin.ts`. Shared navigation is available to both; Analytics, Audit Log, Admins, and Settings are visible only for `SUPER_ADMIN`. The navigation is a role-driven UI presentation layer, not an authorization boundary. The Backend remains responsible for authorization.

## Structure

```text
app/                 App Router pages and global RTL styles
api/                 Axios clients, error normalization, query keys
components/          Dashboard shell, states, and UI primitives
hook/queries/        Query hooks (intentionally empty until contracts exist)
hook/mutations/      Mutation hooks (intentionally empty until contracts exist)
lib/                 Role and navigation types
providers/           Stable TanStack Query client provider
```
