"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, SearchIcon, SpinnerIcon } from "@/components/ui/admin-icons";

interface DebouncedSearchBarProps {
  value: string;
  onDebouncedChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  delayMs?: number;
  disabled?: boolean;
  unsupportedNote?: string;
  isFetching?: boolean;
  resetTrigger?: number;
}

export function DebouncedSearchBar({
  value,
  onDebouncedChange,
  placeholder,
  ariaLabel,
  delayMs = 1000,
  disabled = false,
  unsupportedNote,
  isFetching = false,
  resetTrigger = 0,
}: DebouncedSearchBarProps) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [prevResetTrigger, setPrevResetTrigger] = useState(resetTrigger);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  if (resetTrigger !== prevResetTrigger) {
    setPrevResetTrigger(resetTrigger);
    setDraft("");
  }

  useEffect(() => {
    if (resetTrigger > 0 && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [resetTrigger]);

  useEffect(() => {
    if (disabled) return;
    const trimmedDraft = draft.trim();
    const trimmedValue = value.trim();
    if (trimmedDraft === trimmedValue) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onDebouncedChange(trimmedDraft);
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, value, delayMs, disabled, onDebouncedChange]);

  function flushNow(nextValue: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const trimmed = nextValue.trim();
    setDraft(nextValue);
    if (trimmed !== value.trim()) {
      onDebouncedChange(trimmed);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="relative flex items-center">
        <SearchIcon className="pointer-events-none absolute right-3.5 size-[18px] text-[var(--muted)]" />
        <input
          type="search"
          value={draft}
          disabled={disabled}
          maxLength={200}
          aria-label={ariaLabel}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              flushNow(draft);
            } else if (event.key === "Escape" && draft) {
              event.preventDefault();
              flushNow("");
            }
          }}
          className="h-11 w-full rounded-xl border border-[var(--line)] bg-white pr-10 pl-16 text-[15px] text-[var(--navy)] shadow-[var(--shadow-card)] placeholder:text-[var(--muted)]/85 transition-colors hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-[var(--muted)]"
        />

        <div className="absolute left-2.5 flex items-center gap-1.5">
          {isFetching ? (
            <SpinnerIcon className="size-4 animate-spin text-[var(--gold)]" />
          ) : null}
          {draft && !disabled ? (
            <button
              type="button"
              aria-label="مسح البحث"
              onClick={() => flushNow("")}
              className="inline-flex size-7 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-slate-100 hover:text-[var(--navy)]"
            >
              <CloseIcon className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {unsupportedNote ? (
        <p className="text-xs text-[var(--muted)]">{unsupportedNote}</p>
      ) : null}
    </div>
  );
}

