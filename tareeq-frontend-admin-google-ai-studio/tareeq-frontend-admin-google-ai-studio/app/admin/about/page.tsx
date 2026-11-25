import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { AboutPage } from "@/components/about/about-page";

export default function AboutRoute() {
  return <AdminProtectedShell title="من نحن" activeItem="about"><AboutPage /></AdminProtectedShell>;
}
