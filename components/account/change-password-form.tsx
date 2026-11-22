"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PasswordInput } from "@/components/ui/password-input";
import { AlertTriangleIcon, KeyRoundIcon, SpinnerIcon } from "@/components/ui/admin-icons";
import { useChangePasswordMutation } from "@/hook/mutations/use-change-password-mutation";
import { changePasswordSchema, safePasswordError, type ChangePasswordRequest } from "@/lib/change-password";
import { useAdminAccess } from "@/providers/admin-access-provider";

const inputClasses =
  "mt-1.5 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 text-left text-sm text-slate-900 shadow-xs transition-colors focus:border-[var(--gold)] focus:outline-none";

export function ChangePasswordForm() {
  const router = useRouter();
  const access = useAdminAccess();
  const mutation = useChangePasswordMutation();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  if (access.mockEnabled) {
    return (
      <section className="max-w-xl rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--background)] text-[var(--navy)]">
            <KeyRoundIcon className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[var(--navy)]">تغيير كلمة المرور</h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
              تغيير كلمة المرور يتطلب جلسة Backend؛ لا تُرسل كلمات مرور من وضع المعاينة.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex h-10 items-center rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-[var(--navy)] transition-colors hover:bg-slate-50"
            >
              العودة إلى لوحة التحكم
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form
      className="max-w-xl space-y-5 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setMessage("");
        try {
          await mutation.submit(values);
          reset();
          router.replace("/admin/login");
        } catch (error) {
          const safe = safePasswordError(error);
          if (safe.kind === "cancelled") return;
          for (const field of safe.fields) {
            if (field === "currentPassword" || field === "newPassword") {
              setError(field, { message: "رفض الخادم هذا الحقل؛ تحقق من القيمة دون مشاركتها." });
            }
          }
          setMessage(
            safe.status === 403
              ? "رفض الخادم الإجراء بسبب الصلاحية أو حماية الطلب."
              : safe.status === 401
                ? "تعذّر التحقق من الجلسة أو كلمة المرور الحالية. لم يُعد الطلب تلقائيًا."
                : safe.kind === "network"
                  ? "تعذّر الاتصال بالخادم؛ لم يُعد الطلب تلقائيًا."
                  : "تعذّر تغيير كلمة المرور؛ راجع الحقول ثم حاول مجددًا.",
          );
        }
      })}
    >
      <div className="border-b border-[var(--line)] pb-4">
        <h2 className="text-xl font-bold text-[var(--navy)]">تغيير كلمة المرور</h2>
        <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
          بعد النجاح تُلغى الجلسات وتُمسح بيانات الإدارة المحلية. يلزم تسجيل الدخول مجددًا. استخدم 12 إلى 128 حرفًا تشمل حرفًا صغيرًا وكبيرًا ورقمًا.
        </p>
      </div>

      {message ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-red-700" />
          <p>{message}</p>
        </div>
      ) : null}

      <fieldset disabled={mutation.isPending} className="space-y-4">
        {(
          [
            ["currentPassword", "كلمة المرور الحالية"],
            ["newPassword", "كلمة المرور الجديدة"],
          ] as const
        ).map(([name, label]) => (
          <div key={name}>
            <label htmlFor={name} className="block text-sm font-semibold text-[var(--navy)]">
              {label}
            </label>
            <PasswordInput
              id={name}
              autoComplete={name === "newPassword" ? "new-password" : "current-password"}
              maxLength={128}
              className={inputClasses}
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
              {...register(name)}
            />
            {errors[name] ? (
              <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-700">
                {errors[name]?.message}
              </p>
            ) : null}
          </div>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--navy-light)] disabled:cursor-wait disabled:opacity-50"
        >
          {mutation.isPending ? <SpinnerIcon className="size-4 animate-spin" /> : null}
          <span>{mutation.isPending ? "جارٍ تغيير كلمة المرور…" : "حفظ كلمة المرور الجديدة"}</span>
        </button>
        <Link
          href="/admin"
          className="inline-flex h-11 items-center rounded-xl border border-[var(--line)] px-4 text-sm font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}
