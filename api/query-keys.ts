/** Centralized query-key factory. Extend only when an approved API resource exists. */
export const queryKeys = {
  session: ["session"] as const,
  admin: {
    root: ["admin"] as const,
    content: {
      root: ["admin", "content"] as const,
      lists: () => ["admin", "content", "list"] as const,
      list: <TResource extends string, TParams>(resource: TResource, params: TParams) => ["admin", "content", "list", resource, params] as const,
      details: () => ["admin", "content", "detail"] as const,
      detail: <TResource extends string>(resource: TResource, id: string) => ["admin", "content", "detail", resource, id] as const,
      selectors: () => ["admin", "content", "selectors"] as const,
      selector: <TResource extends string>(resource: TResource) => ["admin", "content", "selectors", resource] as const,
    },
  },
} as const;
