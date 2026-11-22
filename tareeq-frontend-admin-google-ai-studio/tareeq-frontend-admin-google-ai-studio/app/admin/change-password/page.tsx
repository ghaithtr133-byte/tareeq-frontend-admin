import { AdminProtectedShell } from "@/components/layout/admin-protected-shell";
import { ChangePasswordForm } from "@/components/account/change-password-form";
export default function ChangePasswordPage() { return <AdminProtectedShell title="تغيير كلمة المرور" activeItem="change-password"><ChangePasswordForm /></AdminProtectedShell>; }
