"use client";
import { useMutation } from "@tanstack/react-query";
import { uploadImage, type MediaResource } from "@/lib/api-client/images";
import { normalizeApiError } from "@/lib/api-client/error";
import { useAdminAccess } from "@/providers/admin-access-provider";
export function useImageUpload(resource: MediaResource) {
  const access = useAdminAccess();
  return useMutation({ retry: false, mutationFn: async ({ file, progress, signal }: { file: File; progress: (value: number) => void; signal: AbortSignal }) => {
    if (access.mockEnabled || !access.user) throw new Error("Real administrator session required.");
    try { return await uploadImage(resource, file, progress, signal); } catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
  } });
}
