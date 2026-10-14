/** Centralized query-key factory. Extend only when an approved API resource exists. */
export const queryKeys = {
  session: ["session"] as const,
  admin: {
    root: ["admin"] as const,
  },
} as const;
