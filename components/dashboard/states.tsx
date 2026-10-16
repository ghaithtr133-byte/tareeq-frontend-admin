type StateProps = { title: string; detail?: string; action?: React.ReactNode };

function StateCard({ title, detail, action }: StateProps) {
  return <section className="rounded-2xl border border-[var(--line)] bg-white p-6 text-center shadow-sm"><h2 className="text-lg font-bold text-[var(--navy)]">{title}</h2>{detail ? <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">{detail}</p> : null}{action ? <div className="mt-5">{action}</div> : null}</section>;
}

export function LoadingState() { return <StateCard title="جارٍ التحميل" detail="يتم تحضير مساحة العمل." />; }
export function EmptyState() { return <StateCard title="لا توجد بيانات لعرضها" detail="ستظهر البيانات هنا عند توفرها من الخادم." />; }
export function ErrorState({ action }: Pick<StateProps, "action"> = {}) { return <StateCard title="تعذّر إتمام الطلب" detail="تحقق من الاتصال ثم أعد المحاولة. لم تُعرض أي تفاصيل حساسة." action={action} />; }
export function UnauthorizedState() { return <StateCard title="لا تملك صلاحية الوصول" detail="يرجى التواصل مع مدير النظام إذا كنت تعتقد أن هذا غير صحيح." />; }
