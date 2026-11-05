"use client";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { directoryApi, universitySectionApi, type DirectoryInputs, type DirectoryKind, type SectionInputs, type UniversitySection } from "@/api/university-management";
import { queryKeys } from "@/api/query-keys";
import { normalizeApiError } from "@/api/error";
import { useAdminAccess } from "@/providers/admin-access-provider";

export async function invalidateUniversitySection(client: Pick<QueryClient, "invalidateQueries">, id: string, section: UniversitySection) {
  await client.invalidateQueries({ queryKey: queryKeys.admin.university.section(id, section) });
  if (section === "programs") {
    await client.invalidateQueries({ queryKey: ["admin", "content", "list", "universities"] });
  }
}
export function useDirectoryCreate<K extends DirectoryKind>(kind: K) {
  const client = useQueryClient(); const access = useAdminAccess();
  return useMutation({ retry: false, mutationFn: async (input: DirectoryInputs[K]) => {
    if (access.mockEnabled || !access.user) throw new Error("Real administrator session required.");
    try { return await directoryApi.create(kind, input); }
    catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
  }, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.admin.directory.root(kind) }) });
}
export function useUniversitySave<K extends UniversitySection>(section: K, universityId: string) {
  const client = useQueryClient(); const access = useAdminAccess();
  return useMutation({ retry: false, mutationFn: async ({ input, id }: { input: Partial<SectionInputs[K]>; id?: string }) => {
    if (access.mockEnabled || !access.user) throw new Error("Real administrator session required.");
    try { return await universitySectionApi.save(section, universityId, input, id); }
    catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
  }, onSuccess: () => invalidateUniversitySection(client, universityId, section) });
}
export function useGalleryAction(universityId: string) {
  const client = useQueryClient(); const access = useAdminAccess();
  return useMutation({ retry: false, mutationFn: async (action: { detach: string } | { orderedIds: string[] }) => {
    if (access.mockEnabled || !access.user) throw new Error("Real administrator session required.");
    try { return "detach" in action ? await universitySectionApi.detach(action.detach) : await universitySectionApi.reorder(universityId, action.orderedIds); }
    catch (error) { if (normalizeApiError(error).status === 401) access.reportContentUnauthorized(); throw error; }
  }, onSuccess: () => invalidateUniversitySection(client, universityId, "gallery") });
}
