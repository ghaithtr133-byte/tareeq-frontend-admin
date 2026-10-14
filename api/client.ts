import axios from "axios";

/**
 * Browser transport for the approved Hono API. Cookie credentials are included
 * so the Backend can manage HttpOnly sessions; no token is read or persisted here.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});
