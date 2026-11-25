import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { FaqPage } from "@/components/faqs/faq-page";
export default function FaqRoute() { return <AdminProtectedShell title="الأسئلة الشائعة" activeItem="faqs"><FaqPage /></AdminProtectedShell>; }
