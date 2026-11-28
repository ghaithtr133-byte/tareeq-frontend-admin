import { ArrowDownIcon, ArrowUpIcon } from "@/components/ui/admin-icons";

export type SortDirection = "ascending" | "descending";

export function SortableTableHeader({
  label,
  active,
  direction,
  onSort,
  className = "",
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onSort: () => void;
  className?: string;
}) {
  const Icon = direction === "ascending" ? ArrowUpIcon : ArrowDownIcon;
  const directionLabel = direction === "ascending" ? "تصاعدي" : "تنازلي";

  return (
    <th
      scope="col"
      aria-sort={active ? direction : "none"}
      className={`whitespace-nowrap ${className}`}
    >
      <button
        type="button"
        onClick={onSort}
        aria-label={`${active ? "الفرز الحالي" : "فرز"} حسب ${label} ${directionLabel}`}
        className={`inline-flex min-h-8 items-center gap-1 rounded px-1 text-right transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${
          active
            ? "font-bold text-[var(--navy)]"
            : "text-[var(--muted)] hover:text-[var(--navy)]"
        }`}
      >
        <span>{label}</span>
        <Icon
          aria-hidden="true"
          className={`size-3.5 shrink-0 ${active ? "text-[var(--gold-dark)]" : "opacity-55"}`}
        />
      </button>
    </th>
  );
}
