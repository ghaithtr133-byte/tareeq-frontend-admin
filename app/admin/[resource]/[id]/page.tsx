import { notFound } from "next/navigation";

import { ContentFormPage } from "@/components/content/content-form-page";
import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { contentDefinitions, isContentResource } from "@/lib/content-config";

export default async function EditContentRoute({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  if (!isContentResource(resource)) notFound();
  return <AdminProtectedShell title={`تعديل ${contentDefinitions[resource].singular}`} activeItem={resource}><ContentFormPage resource={resource} id={id} /></AdminProtectedShell>;
}
