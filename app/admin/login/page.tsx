import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
      <section className="hidden bg-[var(--navy)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-lg font-bold tracking-tight">
          طريق أكاديمي{" "}
          <span className="mr-2 text-xs font-normal text-amber-200">
            نسخة مؤقتة
          </span>
        </div>
        <div className="max-w-md">
          <span className="mb-5 inline-flex rounded-full border border-white/20 px-3 py-1 text-sm text-amber-100">
            بوابة الإدارة
          </span>
          <h1 className="text-4xl font-bold leading-tight">
            إدارة واضحة لمسارات التعلّم والطموح.
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-300">
            مساحة عمل مخصصة لفريق طريق أكاديمي، مصممة لتبقى المعلومات والإجراءات
            مركّزة وسهلة المتابعة.
          </p>  
        </div>
        <p className="text-sm text-slate-400">Tareeq Academy Administration</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <p className="text-xl font-bold text-[var(--navy)]">
              طريق أكاديمي{" "}
              <span className="mr-2 text-xs font-normal text-[var(--muted)]">
                نسخة مؤقتة
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_18px_45px_-30px_rgba(18,33,61,0.34)] sm:p-8">
            <p className="text-sm font-semibold text-[var(--gold)]">
              مرحبًا بك
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--navy)]">
              تسجيل الدخول إلى الإدارة
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              استخدم بيانات حسابك المعتمدة للوصول إلى مساحة العمل.
            </p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
