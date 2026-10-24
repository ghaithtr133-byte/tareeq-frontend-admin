"use client";

import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getContentApi, type AdminContentResource, type ContentResourceApi } from "@/api/content";
import { createMockContentRepository, type MockContentRepository, type MockContentScenario } from "@/api/mock-content-repository";
import { type AuthenticatedUser, UnauthenticatedSessionError } from "@/api/auth";
import { useLoginMutation } from "@/hook/mutations/use-login-mutation";
import { useLogoutMutation } from "@/hook/mutations/use-logout-mutation";
import { useSessionQuery } from "@/hook/queries/use-session-query";
import { queryKeys } from "@/api/query-keys";

type MockRole = AuthenticatedUser["role"] | null;

type AdminAccess = {
  mockEnabled: boolean;
  user: AuthenticatedUser | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isLoggingOut: boolean;
  refetchSession: () => Promise<unknown>;
  reportContentUnauthorized: () => void;
  logout: () => Promise<void>;
  login: (values: { email: string; password: string }) => Promise<void>;
  mockRole: MockRole;
  setMockRole: (role: MockRole) => void;
  contentApi: <K extends AdminContentResource>(resource: K) => ContentResourceApi<K>;
  scenario: MockContentScenario;
  setScenario: (scenario: MockContentScenario) => void;
  populateRelationshipScale: () => void;
  resetMockData: () => void;
};

const AdminAccessContext = createContext<AdminAccess | undefined>(undefined);

const mockUsers: Record<Exclude<MockRole, null>, AuthenticatedUser> = {
  ADMIN: { id: "52d75347-64ad-47e5-bd3c-4ea10654ef22", name: "مشرف التطوير", email: "admin.mock@tareeq.local", role: "ADMIN" },
  SUPER_ADMIN: { id: "cdd5e00d-b5c4-43e9-b419-2ea4b1794e2f", name: "مدير التطوير", email: "super-admin.mock@tareeq.local", role: "SUPER_ADMIN" },
};

function RealAdminAccessProvider({ children }: PropsWithChildren) {
  const session = useSessionQuery();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  const value = useMemo<AdminAccess>(() => ({
    mockEnabled: false,
    user: session.data,
    isPending: session.isPending,
    isError: session.isError,
    error: session.error,
    isLoggingOut: logoutMutation.isPending,
    refetchSession: () => session.refetch(),
    reportContentUnauthorized: () => { void session.refetch(); },
    logout: async () => { await logoutMutation.mutateAsync(); },
    login: async (values) => { await loginMutation.mutateAsync(values); },
    mockRole: null,
    setMockRole: () => undefined,
    contentApi: getContentApi,
    scenario: "normal",
    setScenario: () => undefined,
    populateRelationshipScale: () => undefined,
    resetMockData: () => undefined,
  }), [loginMutation, logoutMutation, session]);
  return <AdminAccessContext.Provider value={value}>{children}</AdminAccessContext.Provider>;
}

function MockAdminAccessProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<MockRole>("ADMIN");
  const [repository] = useState<MockContentRepository>(createMockContentRepository);
  const [scenario, setScenarioState] = useState<MockContentScenario>("normal");

  const value = useMemo<AdminAccess>(() => ({
    mockEnabled: true,
    user: role ? mockUsers[role] : undefined,
    isPending: false,
    isError: role === null,
    error: role === null ? new UnauthenticatedSessionError(new Error("Mock session is signed out.")) : undefined,
    isLoggingOut: false,
    refetchSession: async () => role ? mockUsers[role] : undefined,
    reportContentUnauthorized: () => undefined,
    logout: async () => { setRole(null); queryClient.clear(); },
    login: async () => undefined,
    mockRole: role,
    setMockRole: (nextRole) => { setRole(nextRole); queryClient.clear(); },
    contentApi: repository.getApi,
    scenario,
    setScenario: (nextScenario) => { repository.setScenario(nextScenario); setScenarioState(nextScenario); void queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.root }); },
    populateRelationshipScale: () => { repository.populateRelationshipScale(); void queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.root }); },
    resetMockData: () => { repository.reset(); setScenarioState("normal"); void queryClient.invalidateQueries({ queryKey: queryKeys.admin.content.root }); },
  }), [queryClient, repository, role, scenario]);
  return <AdminAccessContext.Provider value={value}>{children}</AdminAccessContext.Provider>;
}

/** The selected branch is fixed by a server-validated boolean from RootLayout. */
export function AdminAccessProvider({ mockEnabled, children }: PropsWithChildren<{ mockEnabled: boolean }>) {
  return mockEnabled ? <MockAdminAccessProvider>{children}</MockAdminAccessProvider> : <RealAdminAccessProvider>{children}</RealAdminAccessProvider>;
}

export function useAdminAccess() {
  const value = useContext(AdminAccessContext);
  if (!value) throw new Error("useAdminAccess must be rendered inside AdminAccessProvider.");
  return value;
}

export function useContentRepository() {
  return useAdminAccess().contentApi;
}

