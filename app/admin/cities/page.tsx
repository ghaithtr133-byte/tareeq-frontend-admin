import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { DirectoryPage } from "@/components/universities/directory-page";
export default function CitiesPage() { return <AdminProtectedShell title="المدن" activeItem="cities"><DirectoryPage kind="cities" /></AdminProtectedShell>; }
