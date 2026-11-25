"use client";

import { normalizeApiError } from "@/lib/api-client/error";
import { ErrorState, UnauthorizedState } from "@/components/dashboard/states";
import { primaryButtonClass } from "@/components/universities/controls";

export function Phase4Error({ error, retry }: { error: unknown; retry: () => unknown }) {
  return normalizeApiError(error).status === 403 ? (
    <UnauthorizedState />
  ) : (
    <ErrorState
      action={
        <button type="button" className={primaryButtonClass} onClick={() => void retry()}>
          إعادة المحاولة
        </button>
      }
    />
  );
}
