import { notFound } from "next/navigation";

import { ContentListPage } from "@/components/content/content-list-page";
import { ArticlesListPage } from "@/components/content/articles-list-page";
import { CountriesListPage } from "@/components/content/countries-list-page";
import { ScholarshipsListPage } from "@/components/content/scholarships-list-page";
import { UniversitiesListPage } from "@/components/content/universities-list-page";
import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { contentDefinitions, isContentResource } from "@/lib/content-config";

type PageProps = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContentListRoute({
  params,
  searchParams,
}: PageProps) {
  const { resource } = await params;
  if (!isContentResource(resource)) notFound();
  const resolvedSearchParams = await searchParams;

  return (
    <AdminProtectedShell
      title={contentDefinitions[resource].label}
      activeItem={resource}
    >
      {resource === "countries" ? (
        <CountriesListPage searchParams={resolvedSearchParams} />
      ) : resource === "universities" ? (
        <UniversitiesListPage searchParams={resolvedSearchParams} />
      ) : resource === "scholarships" ? (
        <ScholarshipsListPage searchParams={resolvedSearchParams} />
      ) : resource === "articles" ? (
        <ArticlesListPage searchParams={resolvedSearchParams} />
      ) : (
        <ContentListPage resource={resource} searchParams={resolvedSearchParams} />
      )}
    </AdminProtectedShell>
  );
}
