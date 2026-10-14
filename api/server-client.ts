import "server-only";

import axios, { type AxiosRequestConfig } from "axios";

/**
 * Creates an isolated server-only transport. Callers must explicitly pass any
 * approved request context once Backend contracts define server-side access.
 * Cookies are deliberately not forwarded automatically across origins.
 */
export function createServerApiClient(config: AxiosRequestConfig = {}) {
  return axios.create({
    baseURL: process.env.API_BASE_URL,
    withCredentials: false,
    headers: { Accept: "application/json" },
    ...config,
  });
}
