import type { Query, QueryClient } from "@tanstack/react-query";
import type { AuthenticatedUser } from "@/lib/api-client/auth";
import { queryKeys } from "@/lib/api-client/query-keys";
import { privateSessionGeneration } from "@/lib/admin-session-cache";

export class StaleContentSessionError extends Error {
  constructor(cause?: unknown) { super("انتهى سياق الجلسة؛ لم تُطبق نتيجة الحفظ على جلسة أخرى.", { cause }); }
}
export interface ContentSessionContext { userId: string; generation: number; query?: Query; mock: boolean }
export function captureContentSession(client: QueryClient, userId: string | undefined, mock: boolean): ContentSessionContext {
  if (!userId) throw new StaleContentSessionError();
  const context = { userId, generation: privateSessionGeneration(client), query: client.getQueryCache().find({ queryKey: queryKeys.session, exact: true }), mock };
  assertContentSession(client, context);
  return context;
}
export function assertContentSession(client: QueryClient, context: ContentSessionContext, cause?: unknown) {
  const user = client.getQueryData<AuthenticatedUser | null>(queryKeys.session);
  if (privateSessionGeneration(client) !== context.generation || (!context.mock && (
    !context.query || client.getQueryCache().find({ queryKey: queryKeys.session, exact: true }) !== context.query ||
    client.getQueryState(queryKeys.session)?.status !== "success" || user?.id !== context.userId || !["ADMIN", "SUPER_ADMIN"].includes(user.role)
  ))) throw new StaleContentSessionError(cause);
}
