import type { AxiosRequestConfig } from "axios";

import { apiClient } from "@/lib/api-client/client";
import { isRequestCancelled } from "@/lib/api-client/error";
import { z } from "zod";
import { changePasswordSchema, ChangePasswordError, safePasswordError, type ChangePasswordRequest } from "@/lib/change-password";

export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

type AuthenticationResponse = SuccessEnvelope<{ user: AuthenticatedUser }>;

export class UnauthenticatedSessionError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super("The authenticated session is no longer valid.");
    this.name = "UnauthenticatedSessionError";
    this.cause = cause;
  }
}

export class LoginSessionVerificationError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super(
      "Login succeeded but the authenticated session could not be verified.",
    );
    this.name = "LoginSessionVerificationError";
    this.cause = cause;
  }
}

export function isLoginSessionVerificationError(error: unknown): boolean {
  return error instanceof LoginSessionVerificationError;
}

let refreshInFlight: Promise<AuthenticatedUser> | undefined;

function hasHttpStatus(error: unknown, status: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === status
  );
}

export function isUnauthenticatedSessionError(error: unknown): boolean {
  return (
    error instanceof UnauthenticatedSessionError || hasHttpStatus(error, 401)
  );
}

export function isForbiddenSessionError(error: unknown): boolean {
  return hasHttpStatus(error, 403);
}

export async function login(request: LoginRequest): Promise<AuthenticatedUser> {
  const response = await apiClient.post<AuthenticationResponse>(
    "/auth/login",
    request,
  );
  return response.data.data.user;
}

export async function getAuthenticatedUser(
  config?: Pick<AxiosRequestConfig, "signal">,
): Promise<AuthenticatedUser> {
  const response = await apiClient.get<AuthenticationResponse>(
    "/auth/me",
    config,
  );
  return response.data.data.user;
}

/**
 * Deduplicates a cookie-session refresh request. The Backend rotates its
 * HttpOnly cookies and returns the active administrator; callers still
 * revalidate through /auth/me before treating a restored session as usable.
 */
export function refreshSession(): Promise<AuthenticatedUser> {
  if (!refreshInFlight) {
    refreshInFlight = apiClient
      .post<AuthenticationResponse>("/auth/refresh")
      .then((response) => response.data.data.user)
      .finally(() => {
        refreshInFlight = undefined;
      });
  }

  return refreshInFlight;
}

/**
 * Safely restores a browser cookie session. A refresh is attempted only after
 * /auth/me confirms the access session is unauthenticated, and only once per
 * recovery cycle. No failed business mutation is ever replayed.
 */
export async function restoreAuthenticatedUser(
  config?: Pick<AxiosRequestConfig, "signal">,
): Promise<AuthenticatedUser> {
  try {
    return await getAuthenticatedUser(config);
  } catch (error) {
    if (!hasHttpStatus(error, 401) || isRequestCancelled(error)) throw error;
  }

  try {
    await refreshSession();
  } catch (error) {
    if (isRequestCancelled(error)) throw error;
    if (hasHttpStatus(error, 401) || hasHttpStatus(error, 403)) {
      throw new UnauthenticatedSessionError(error);
    }
    throw error;
  }

  return getAuthenticatedUser(config);
}

/** The logout response clears the Backend-managed HttpOnly session cookies. */
export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

/** Backend revokes refresh sessions and clears cookies; never attempt recovery after success. */
export async function changePassword(input: ChangePasswordRequest): Promise<void> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) throw new ChangePasswordError("unknown", undefined, [...new Set(parsed.error.issues.map(issue => String(issue.path[0])))]);
  try {
    const response = await apiClient.post("/auth/change-password", { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.newPassword });
    z.object({ success: z.literal(true), data: z.object({}) }).parse(response.data);
  } catch (error) { throw safePasswordError(error); }
}
