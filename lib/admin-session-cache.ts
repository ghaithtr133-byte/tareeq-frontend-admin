import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";

/** Keep the terminal session result so cleanup cannot start another recovery loop. */
export function clearPrivateAdminCache(client: QueryClient) {
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== queryKeys.session[0] });
  client.getMutationCache().clear();
}
