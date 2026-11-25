import { notFound } from "next/navigation";

import { ContentFormPage } from "@/components/content/content-form-page";
import { CountryFormPage } from "@/components/content/country-form-page";
import { ScholarshipFormPage } from "@/components/content/scholarship-form-page";
import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { contentDefinitions, isContentResource } from "@/lib/content-config";

export default async function NewContentRoute({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!isContentResource(resource)) notFound();
  return (
    <AdminProtectedShell title={`إضافة ${contentDefinitions[resource].singular}`} activeItem={resource}>
      {resource === "countries" ? (
        <CountryFormPage />
      ) : resource === "scholarships" ? (
        <ScholarshipFormPage />
      ) : (
        <ContentFormPage resource={resource} />
      )}
    </AdminProtectedShell>
  );
}
