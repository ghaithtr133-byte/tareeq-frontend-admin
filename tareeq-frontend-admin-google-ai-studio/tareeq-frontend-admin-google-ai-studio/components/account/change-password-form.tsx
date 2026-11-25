"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/password-input";
import { useChangePasswordMutation } from "@/hook/mutations/use-change-password-mutation";
import { changePasswordSchema, safePasswordError, type ChangePasswordRequest } from "@/lib/change-password";
import { useAdminAccess } from "@/providers/admin-access-provider";

export function ChangePasswordForm() {
  const router = useRouter(); const access = useAdminAccess(); const mutation = useChangePasswordMutation(); const [message, setMessage] = useState("");
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm<ChangePasswordRequest>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", newPassword: "" } });
  if (access.mockEnabled) return <p>تغيير كلمة المرور يتطلب جلسة Backend؛ لا تُرسل كلمات مرور من وضع المعاينة.</p>;
  const classes = "min-h-11 w-full rounded-lg border border-[var(--line)] p-3 pl-20 text-left";
  return <form className="max-w-xl space-y-5 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-7" noValidate onSubmit={handleSubmit(async values => {
    setMessage("");
    try { await mutation.submit(values); reset(); router.replace("/admin/login"); }
    catch (error) {
      const safe = safePasswordError(error); if (safe.kind === "cancelled") return;
      for (const field of safe.fields) if (field === "currentPassword" || field === "newPassword") setError(field, { message: "رفض الخادم هذا الحقل؛ تحقق من القيمة دون مشاركتها." });
      setMessage(safe.status === 403 ? "رفض الخادم الإجراء بسبب الصلاحية أو حماية الطلب." : safe.status === 401 ? "تعذّر التحقق من الجلسة أو كلمة المرور الحالية. لم يُعد الطلب تلقائيًا." : safe.kind === "network" ? "تعذّر الاتصال بالخادم؛ لم يُعد الطلب تلقائيًا." : "تعذّر تغيير كلمة المرور؛ راجع الحقول ثم حاول مجددًا.");
    }
  })}>
    <h2 className="text-xl font-bold">تغيير كلمة المرور</h2><p className="text-sm leading-7">بعد النجاح تُلغى الجلسات وتُمسح بيانات الإدارة المحلية. يلزم تسجيل الدخول مجددًا. استخدم 12 إلى 128 حرفًا تشمل حرفًا صغيرًا وكبيرًا ورقمًا.</p>
    {message ? <p role="alert" className="text-sm text-red-700">{message}</p> : null}
    <fieldset disabled={mutation.isPending} className="space-y-4">{([['currentPassword','كلمة المرور الحالية'],['newPassword','كلمة المرور الجديدة']] as const).map(([name,label]) => <div key={name}><label htmlFor={name} className="mb-1 block text-sm font-semibold">{label}</label><PasswordInput id={name} autoComplete={name === "newPassword" ? "new-password" : "current-password"} maxLength={128} className={classes} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined} {...register(name)} />{errors[name] ? <p id={`${name}-error`} role="alert" className="text-sm text-red-700">{errors[name]?.message}</p> : null}</div>)}</fieldset>
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={mutation.isPending} className="min-h-11 rounded-lg bg-[var(--navy)] px-4 text-sm font-bold text-white disabled:opacity-50">{mutation.isPending ? "جارٍ تغيير كلمة المرور…" : "حفظ كلمة المرور الجديدة"}</button><Link href="/admin" className="inline-flex min-h-11 items-center px-3 underline">إلغاء</Link></div>
  </form>;
}
