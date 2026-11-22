import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { FaqPage } from "@/components/faqs/faq-page";
import { faqGroupSchema } from "@/lib/faq-schemas";

export default async function FaqRoute({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; parentId?: string }>;
}) {
  const params = await searchParams;
  const parsedGroup = faqGroupSchema.safeParse({
    scope: params.scope,
    parentId: params.parentId || undefined,
  });

  return (
    <AdminProtectedShell title="الأسئلة الشائعة" activeItem="faqs">
      <FaqPage initialGroup={parsedGroup.success ? parsedGroup.data : undefined} />
    </AdminProtectedShell>
  );
}
