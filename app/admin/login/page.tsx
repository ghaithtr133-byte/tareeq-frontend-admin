import { LoginForm } from "./login-form";
import Image from "next/image";

const platformHighlights = [
  {
    title: "إدارة المحتوى الأكاديمي",
    detail: "تنظيم بيانات الدول والجامعات والتخصصات والمنح الدراسية والمقالات من مكان واحد.",
  },
  {
    title: "متابعة الطلبات والاستفسارات",
    detail: "استعراض طلبات الطلاب والاستفسارات الواردة وتحديث حالات المعالجة بدقة.",
  },
  {
    title: "جلسات محمية بالخادم",
    detail: "تحقق آمن من الصلاحيات عبر جلسات الخادم دون تخزين أي رموز وصول في المتصفح.",
  },
] as const;

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand / Context Panel */}
      <section className="relative hidden overflow-hidden bg-[var(--navy)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[var(--gold)]"
          aria-hidden="true"
        />

        <div className="flex items-center gap-3">
          <span className="relative inline-block h-10 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--gold)]/50 bg-white" aria-hidden="true">
            <Image src="/tareeq-admin-logo.jpg" alt="" fill sizes="48px" className="object-cover object-center" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">طريق أكاديمي</p>
            <p className="text-xs text-slate-300">بوابة الإدارة</p>
          </div>
        </div>

        <div className="my-auto max-w-lg py-10">
          <p className="text-xs font-semibold text-[var(--gold-soft)]">نظام إدارة المنصة التعليمية</p>
          <h1 className="mt-3 text-3xl font-bold leading-snug text-white xl:text-4xl [text-wrap:balance]">
            إدارة واضحة لمسارات التعلّم والطموح.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            مساحة عمل مخصصة لفريق طريق أكاديمي، مصممة لتبقى المعلومات الأكاديمية والطلبات والإجراءات اليومية مركّزة وسهلة المتابعة.
          </p>

          <dl className="mt-8 divide-y divide-white/10 border-t border-white/10">
            {platformHighlights.map((item) => (
              <div key={item.title} className="py-3.5">
                <dt className="text-sm font-semibold text-white">{item.title}</dt>
                <dd className="mt-1 text-xs leading-6 text-slate-300">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-400">
          <span>Tareeq Academy Administration</span>
          <span>RTL · Arabic Workspace</span>
        </div>
      </section>

      {/* Form Panel */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          {/* Mobile Brand Header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="relative inline-block h-10 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--gold)]/35 bg-white" aria-hidden="true">
              <Image src="/tareeq-admin-logo.jpg" alt="" fill sizes="48px" className="object-cover object-center" />
            </span>
            <div>
              <p className="text-lg font-bold text-[var(--navy)]">طريق أكاديمي</p>
              <p className="text-xs text-[var(--muted)]">بوابة الإدارة</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
            <div className="border-b border-[var(--line)] pb-5">
              <p className="text-xs font-semibold text-[var(--gold-dark)]">مرحبًا بك</p>
              <h1 className="mt-1.5 text-2xl font-bold text-[var(--navy)]">
                تسجيل الدخول إلى الإدارة
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                استخدم بيانات حسابك المعتمدة للوصول إلى لوحة التحكم.
              </p>
            </div>

            <div className="mt-6">
              <LoginForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
