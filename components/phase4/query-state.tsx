"use client";
import { normalizeApiError } from "@/api/error";
import { ErrorState, UnauthorizedState } from "@/components/dashboard/states";
import { buttonClass } from "@/components/universities/controls";
export function Phase4Error({ error, retry }: { error: unknown; retry: () => unknown }) { return normalizeApiError(error).status === 403 ? <UnauthorizedState /> : <ErrorState action={<button className={buttonClass} onClick={() => void retry()}>إعادة المحاولة</button>} />; }
