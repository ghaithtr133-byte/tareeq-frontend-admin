"use client";

import { useAdminAccess } from "@/providers/admin-access-provider";
import type { MockContentScenario } from "@/api/mock-content-repository";

const scenarios: readonly { value: MockContentScenario; label: string }[] = [
  { value: "normal", label: "بيانات تجريبية طبيعية" },
  { value: "loading", label: "تحميل بطيء" },
  { value: "empty", label: "قائمة فارغة" },
  { value: "forbidden", label: "رفض 403" },
  { value: "validation", label: "خطأ تحقق 400" },
  { value: "failure", label: "خطأ خادم 500" },
  { value: "network", label: "فشل شبكة" },
];

/** Visible only when the server has explicitly enabled development mock mode. */
export function DevAdminControls() {
  const access = useAdminAccess();
  if (!access.mockEnabled) return null;

  return (
    <aside className="mb-4 text-xs text-amber-950" aria-label="أدوات المعاينة">
      <details className="rounded-xl border border-dashed border-amber-400 bg-amber-50">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 font-bold marker:hidden focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--gold)]">
          <span>أدوات المعاينة</span><span className="font-normal text-amber-800">وضع تجريبي محلي</span>
        </summary>
        <div className="border-t border-amber-200 px-3 py-3">
          <p className="min-w-0 break-words">لا يتم إرسال جلسة أو محتوى إلى الخادم. تُعاد البيانات عند إعادة تحميل الصفحة.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => access.setMockRole("ADMIN")} className="rounded-md border border-amber-400 px-2 py-1 font-bold">ADMIN</button>
            <button type="button" onClick={() => access.setMockRole("SUPER_ADMIN")} className="rounded-md border border-amber-400 px-2 py-1 font-bold">SUPER_ADMIN</button>
            <button type="button" onClick={() => access.setMockRole(null)} className="rounded-md border border-amber-400 px-2 py-1 font-bold">تسجيل خروج تجريبي</button>
            <label className="flex items-center gap-1">سيناريو
              <select value={access.scenario} onChange={(event) => access.setScenario(event.target.value as MockContentScenario)} className="rounded-md border border-amber-400 bg-white px-2 py-1">
                {scenarios.map((scenario) => <option key={scenario.value} value={scenario.value}>{scenario.label}</option>)}
              </select>
            </label>
            <button type="button" onClick={access.populateRelationshipScale} className="rounded-md border border-amber-400 px-2 py-1 font-bold">علاقات 60+</button>
            <button type="button" onClick={access.resetMockData} className="rounded-md border border-amber-400 px-2 py-1 font-bold">إعادة البيانات</button>
          </div>
        </div>
      </details>
    </aside>
  );
}

export function DevMockLoginOptions() {
  const access = useAdminAccess();
  if (!access.mockEnabled) return null;
  return (
    <section className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4" aria-label="دخول التطوير التجريبي">
      <p className="font-bold text-amber-950">وضع تطوير تجريبي فقط</p>
      <p className="mt-1 text-xs leading-5 text-amber-900">لا توجد بيانات دخول أو ملفات تعريف ارتباط أو طلبات مصادقة للخادم. ينتهي الاختيار عند إعادة تحميل الصفحة.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => access.setMockRole("ADMIN")} className="h-10 rounded-lg bg-[var(--navy)] px-3 text-sm font-bold text-white">الدخول كمشرف</button>
        <button type="button" onClick={() => access.setMockRole("SUPER_ADMIN")} className="h-10 rounded-lg border border-[var(--navy)] px-3 text-sm font-bold text-[var(--navy)]">الدخول كمدير</button>
      </div>
    </section>
  );
}
