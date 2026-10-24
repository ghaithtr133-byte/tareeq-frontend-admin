import { notFound } from "next/navigation";

import { ContentListPage } from "@/components/content/content-list-page";
import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { contentDefinitions, isContentResource } from "@/lib/content-config";

type PageProps = { params: Promise<{ resource: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ContentListRoute({ params, searchParams }: PageProps) {
  const { resource } = await params;
  if (!isContentResource(resource)) notFound();
  return <AdminProtectedShell title={contentDefinitions[resource].label} activeItem={resource}><ContentListPage resource={resource} searchParams={await searchParams} /></AdminProtectedShell>;
}
