"use client";

import { useId } from "react";
import { StarIcon } from "@/components/ui/admin-icons";

interface SwitchToggleProps {
  id?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  showStarIcon?: boolean;
}

export function SwitchToggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  showStarIcon = false,
}: SwitchToggleProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <div className="flex min-h-10 items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-white px-2.5 py-2">
      <label htmlFor={controlId} className="min-w-0 flex-1 cursor-pointer select-none">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-snug text-[var(--navy)]">
          {showStarIcon ? (
            <StarIcon
              className={`size-4 shrink-0 transition-colors ${
                checked ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--muted)]"
              }`}
            />
          ) : null}
          <span>{label}</span>
        </span>
        {description ? (
          <span className="mt-0.5 block text-[11px] text-[var(--muted)]">{description}</span>
        ) : null}
      </label>

      <button
        id={controlId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked
            ? "border-[var(--navy)] bg-[var(--navy)]"
            : "border-[var(--line-strong)] bg-slate-200"
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
            checked ? "-translate-x-5" : "-translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

