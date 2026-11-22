import type { ReactNode } from "react";
import { AlertTriangleIcon, InboxIcon, LockIcon, SpinnerIcon } from "@/components/ui/admin-icons";

type StateProps = {
  title: string;
  detail?: string;
  action?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "danger" | "warning";
};

function StateCard({ title, detail, action, icon, tone = "neutral" }: StateProps) {
  const iconWrapClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-[var(--line)] bg-[var(--background)] text-[var(--navy)]";

  return (
    <section className="mx-auto my-4 max-w-xl rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow-card)]">
      {icon ? (
        <div className={`mx-auto mb-4 grid size-12 place-items-center rounded-xl border ${iconWrapClass}`}>
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-bold text-[var(--navy)]">{title}</h2>
      {detail ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{detail}</p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </section>
  );
}

export function LoadingState() {
  return (
    <StateCard
      title="جارٍ التحميل"
      detail="يتم تحضير مساحة العمل والتحقق من الجلسة."
      icon={<SpinnerIcon className="size-5 animate-spin text-[var(--gold)]" />}
    />
  );
}

export function EmptyState() {
  return (
    <StateCard
      title="لا توجد بيانات لعرضها"
      detail="ستظهر السجلات هنا بمجرد إضافتها أو توفرها من الخادم."
      icon={<InboxIcon className="size-5" />}
    />
  );
}

export function ErrorState({ action }: Pick<StateProps, "action"> = {}) {
  return (
    <StateCard
      title="تعذّر إتمام الطلب"
      detail="تحقق من الاتصال ثم أعد المحاولة. لم تُعرض أي تفاصيل تقنية حساسة."
      icon={<AlertTriangleIcon className="size-5" />}
      tone="danger"
      action={action}
    />
  );
}

export function UnauthorizedState() {
  return (
    <StateCard
      title="لا تملك صلاحية الوصول"
      detail="هذا القسم مخصص لصلاحيات أعلى. تواصل مع مدير النظام إذا كنت بحاجة إلى الوصول."
      icon={<LockIcon className="size-5" />}
      tone="warning"
    />
  );
}
