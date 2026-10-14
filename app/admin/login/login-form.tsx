"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordInput } from "@/components/ui/password-input";

const loginSchema = z.object({
  email: z.string().trim().email("أدخل بريدًا إلكترونيًا صحيحًا."),
  password: z.string().min(1, "أدخل كلمة المرور."),
});

type LoginValues = z.infer<typeof loginSchema>;

const inputClassName =
  "mt-2 h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-right text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[var(--gold)]";

export function LoginForm() {
  const [integrationBlocked, setIntegrationBlocked] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit() {
    // No endpoint, payload, or success state is assumed until the Hono contract is approved.
    setIntegrationBlocked(true);
  }

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

      {integrationBlocked ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" role="alert">
          تسجيل الدخول غير متاح حاليًا لأن عقد المصادقة من الخادم لم يُعتمد بعد.
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
