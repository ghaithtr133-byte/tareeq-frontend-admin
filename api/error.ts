import axios from "axios";

export type ApiErrorKind = "http" | "network" | "cancelled" | "unknown";

export interface ApiError {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  /** The unmodified originating error for diagnostics and retry policy decisions. */
  cause: unknown;
  responseData?: unknown;
}

export function isRequestCancelled(error: unknown): boolean {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === "ERR_CANCELED");
}

/** Normalizes transport errors without discarding status, response data, or cause. */
export function normalizeApiError(error: unknown): ApiError {
  if (isRequestCancelled(error)) {
    return { kind: "cancelled", message: "Request was cancelled.", cause: error };
  }

  if (axios.isAxiosError(error)) {
    if (error.response) {
      return {
        kind: "http",
        message: error.message,
        status: error.response.status,
        responseData: error.response.data,
        cause: error,
      };
    }

    if (error.request) {
      return { kind: "network", message: error.message, cause: error };
    }
  }

  return {
    kind: "unknown",
    message: error instanceof Error ? error.message : "An unexpected error occurred.",
    cause: error,
  };
}
