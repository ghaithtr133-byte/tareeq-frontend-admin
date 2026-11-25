"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { isLoginSessionVerificationError } from "@/lib/api-client/auth";
import { loginFailureMessage } from "@/lib/login-feedback";
import { PasswordInput } from "@/components/ui/password-input";
import {
  AlertTriangleIcon,
  LockIcon,
  MailIcon,
  SpinnerIcon,
} from "@/components/ui/admin-icons";
import { DevMockLoginOptions } from "@/components/layout/dev-admin-controls";
import { useAdminAccess } from "@/providers/admin-access-provider";

const loginSchema = z.object({
  email: z.string().trim().email("أدخل بريدًا إلكترونيًا صحيحًا."),
  password: z.string().min(1, "أدخل كلمة المرور."),
});

type LoginValues = z.infer<typeof loginSchema>;

const inputClassName =
  "h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-sm text-slate-900 shadow-xs transition-colors placeholder:text-slate-400 focus:border-[var(--gold)] focus:outline-none";

export function LoginForm() {
  const router = useRouter();
  const access = useAdminAccess();
  const [submissionError, setSubmissionError] = useState<string>();
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const forgotNoticeId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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

      setSubmissionError(loginFailureMessage(error));
    }
  }

  if (access.mockEnabled) return <DevMockLoginOptions />;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      aria-describedby="login-contract-note"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-[var(--navy)]">
          البريد الإلكتروني
        </label>
        <div className="relative mt-1.5">
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            placeholder="admin@tareeq-academy.com"
            className={`${inputClassName} pr-11`}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <span
            className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[var(--muted)]"
            aria-hidden="true"
          >
            <MailIcon className="size-[18px]" />
          </span>
        </div>
        {errors.email ? (
          <p id="email-error" className="mt-1.5 text-xs font-medium text-red-700" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="password" className="block text-sm font-semibold text-[var(--navy)]">
            كلمة المرور
          </label>
          <button
            type="button"
            onClick={() => setForgotPasswordOpen((open) => !open)}
            aria-expanded={forgotPasswordOpen}
            aria-controls={forgotNoticeId}
            className="text-xs font-medium text-[var(--muted)] underline-offset-4 transition-colors hover:text-[var(--navy)] hover:underline"
          >
            نسيت كلمة المرور؟
          </button>
        </div>

        <div className="mt-1.5">
          <PasswordInput
            id="password"
            className={inputClassName}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
        </div>
        {errors.password ? (
          <p id="password-error" className="mt-1.5 text-xs font-medium text-red-700" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {forgotPasswordOpen ? (
        <div
          id={forgotNoticeId}
          role="region"
          aria-label="استعادة كلمة المرور"
          className="rounded-xl border border-[var(--line)] bg-[var(--background)] p-3.5 text-xs leading-6 text-[var(--navy)]"
        >
          <p className="font-bold text-[var(--navy)]">
            استعادة كلمة المرور (تصميم مبدئي · PENDING BACKEND/CODEX)
          </p>
          <p className="mt-1 text-[var(--muted)]">
            استعادة كلمة المرور الذاتية غير مفعّلة حاليًا في واجهة البرمجة. يرجى التواصل مع مدير النظام (SUPER_ADMIN) لإعادة تعيين بيانات الدخول.
          </p>
        </div>
      ) : null}

      {submissionError ? (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
          role="alert"
        >
          <AlertTriangleIcon className="mt-1 size-4 shrink-0 text-red-700" />
          <p>{submissionError}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[var(--navy-light)] disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting ? <SpinnerIcon className="size-4 animate-spin" /> : null}
        <span>{isSubmitting ? "جارٍ التحقق…" : "تسجيل الدخول"}</span>
      </button>

      <p
        id="login-contract-note"
        className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs leading-5 text-[var(--muted)]"
      >
        <LockIcon className="size-3.5 shrink-0" />
        <span>تُدار الجلسات الآمنة بواسطة الخادم ولا يتم حفظ أي رموز وصول في المتصفح.</span>
      </p>
    </form>
  );
}
