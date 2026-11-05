import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
const privateGenerations = new WeakMap<QueryClient, number>();
export function privateSessionGeneration(client: QueryClient) { return privateGenerations.get(client) ?? 0; }

/** Keep the terminal session result so cleanup cannot start another recovery loop. */
export function clearPrivateAdminCache(client: QueryClient) {
  privateGenerations.set(client, privateSessionGeneration(client) + 1);
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== queryKeys.session[0] });
  client.getMutationCache().clear();
}
