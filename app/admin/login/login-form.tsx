"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { isLoginSessionVerificationError } from "@/api/auth";
import { normalizeApiError } from "@/api/error";
import { PasswordInput } from "@/components/ui/password-input";
import { DevMockLoginOptions } from "@/components/layout/dev-admin-controls";
import { useAdminAccess } from "@/providers/admin-access-provider";

const loginSchema = z.object({
  email: z.string().trim().email("أدخل بريدًا إلكترونيًا صحيحًا."),
  password: z.string().min(1, "أدخل كلمة المرور."),
});

type LoginValues = z.infer<typeof loginSchema>;

const inputClassName =
  "mt-2 h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-right text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[var(--gold)]";

export function LoginForm() {
  const router = useRouter();
  const access = useAdminAccess();
  const [submissionError, setSubmissionError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  useEffect(() => {
    if (access.user) router.replace("/admin");
  }, [access.user, router]);

  async function onSubmit(values: LoginValues) {
    setSubmissionError(undefined);
    try {
      await access.login(values);
      router.replace("/admin");
    } catch (error) {
      if (isLoginSessionVerificationError(error)) {
        setSubmissionError("تم إرسال بيانات الدخول، لكن تعذّر التحقق من الجلسة. حاول مرة أخرى.");
        return;
      }

      const normalized = normalizeApiError(error);
      if (normalized.kind === "cancelled") return;

      if (normalized.kind === "network") {
        setSubmissionError("تعذّر الاتصال بالخادم. تحقق من الاتصال ثم حاول مرة أخرى.");
      } else if (normalized.status === 401 || normalized.status === 403) {
        setSubmissionError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else {
        setSubmissionError("تعذّر تسجيل الدخول حاليًا. حاول مرة أخرى.");
      }
    }
  }

  if (access.mockEnabled) return <DevMockLoginOptions />;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5" aria-describedby="login-contract-note">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-[var(--navy)]">البريد الإلكتروني</label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          className={inputClassName}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? <p id="email-error" className="mt-2 text-sm text-red-700" role="alert">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-semibold text-[var(--navy)]">كلمة المرور</label>
        <PasswordInput
          id="password"
          className={inputClassName}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password ? <p id="password-error" className="mt-2 text-sm text-red-700" role="alert">{errors.password.message}</p> : null}
      </div>

      {submissionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800" role="alert">
          {submissionError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--navy)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--navy-light)] disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting ? "جارٍ التحقق…" : "تسجيل الدخول"}
      </button>
      <p id="login-contract-note" className="text-center text-xs leading-5 text-[var(--muted)]">
        تُدار الجلسات الآمنة بواسطة الخادم ولا يتم حفظ أي رموز وصول في المتصفح.
      </p>
    </form>
  );
}
