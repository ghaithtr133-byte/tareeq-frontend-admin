"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, CloseIcon, SearchIcon, SpinnerIcon } from "@/components/ui/admin-icons";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  allowClear?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Optional server-backed search hook: when passed, typing triggers this callback instead of client-only filtering. */
  searchValue?: string;
  onSearchChange?: (query: string) => void;
  emptyMessage?: string;
  /** Optional footer controls inside dropdown (e.g. page navigation for huge server catalogs). */
  dropdownFooter?: React.ReactNode;
  labelAction?: React.ReactNode;
  size?: "default" | "comfortable";
  selectedLabel?: string;
}

export function SearchableSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "الكل",
  searchPlaceholder = "ابحث بالاسم...",
  allowClear = true,
  clearLabel = "الكل",
  disabled = false,
  required = false,
  error,
  isLoading = false,
  isError = false,
  onRetry,
  searchValue,
  onSearchChange,
  emptyMessage = "لا توجد خيارات مطابقة.",
  dropdownFooter,
  labelAction,
  size = "default",
  selectedLabel,
}: SearchableSelectProps) {
  const comfortable = size === "comfortable";
  const generatedId = useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const listboxId = `${generatedId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = onSearchChange ? (searchValue ?? "") : localQuery;

  const normalizedOptions = useMemo(() => {
    if (!value) return [...options];
    if (options.some((opt) => opt.value === value)) return [...options];
    return [{ value, label: selectedLabel || `${value} (قيمة محفوظة)` }, ...options];
  }, [options, value, selectedLabel]);

  const filteredOptions = useMemo(() => {
    if (onSearchChange) return normalizedOptions;
    const term = query.trim().toLocaleLowerCase("ar");
    if (!term) return normalizedOptions;
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLocaleLowerCase("ar").includes(term) ||
        (opt.sublabel && opt.sublabel.toLocaleLowerCase("ar").includes(term)) ||
        opt.value.toLocaleLowerCase("ar").includes(term),
    );
  }, [normalizedOptions, onSearchChange, query]);

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [open]);

  function openMenu() {
    if (disabled) return;
    setActiveIndex(-1);
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    setActiveIndex(-1);
    if (!onSearchChange) setLocalQuery("");
  }

  function pick(nextValue: string) {
    onChange(nextValue);
    closeMenu();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    const total = filteredOptions.length;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (total > 0) setActiveIndex((prev) => (prev + 1 >= total ? 0 : prev + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (total > 0) setActiveIndex((prev) => (prev - 1 < 0 ? total - 1 : prev - 1));
    } else if (event.key === "Enter" && activeIndex >= 0 && filteredOptions[activeIndex]) {
      event.preventDefault();
      pick(filteredOptions[activeIndex].value);
    }
  }

  return (
    <div ref={containerRef} className="relative min-w-0" onKeyDown={handleKeyDown}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label
          htmlFor={triggerId}
          className={`block font-semibold text-[var(--navy)] ${
            comfortable ? "text-[14px] sm:text-[15px]" : "text-xs"
          }`}
        >
          {label}
          {required ? <span className="text-red-700"> *</span> : null}
        </label>
        {labelAction ? <div className="shrink-0">{labelAction}</div> : null}
      </div>

      <div className="relative flex items-center">
        <button
          id={triggerId}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-invalid={Boolean(error)}
          disabled={disabled}
          onClick={() => (open ? closeMenu() : openMenu())}
          className={`flex w-full items-center justify-between gap-2 border bg-white text-right transition-colors disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
            comfortable
              ? "min-h-11 rounded-xl px-3.5 py-2.5 text-base"
              : "min-h-10 rounded-lg px-3 py-2 text-sm"
          } ${
            error
              ? "border-red-400 focus-visible:border-red-600"
              : open
                ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/20"
                : "border-[var(--line)] hover:border-[var(--line-strong)]"
          }`}
        >
          <span className={`min-w-0 flex-1 truncate ${selectedOption ? "font-medium text-[var(--navy)]" : "text-[var(--muted)]"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {isLoading ? <SpinnerIcon className="size-3.5 animate-spin text-[var(--gold)]" /> : null}
            <ChevronDownIcon
              className={`size-4 text-[var(--muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {allowClear && value && !disabled ? (
          <button
            type="button"
            aria-label={`مسح اختيار ${label}`}
            onClick={(event) => {
              event.stopPropagation();
              pick("");
            }}
            className="absolute left-8 inline-flex size-6 items-center justify-center rounded text-[var(--muted)] transition-colors hover:bg-slate-100 hover:text-[var(--navy)]"
          >
            <CloseIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="absolute inset-x-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-[var(--shadow-dropdown)]"
          style={{ minWidth: "min(100%, 16rem)" }}
        >
          <div className="border-b border-[var(--line)] bg-[var(--surface-subtle)] p-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  if (onSearchChange) onSearchChange(next);
                  else setLocalQuery(next);
                  setActiveIndex(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={`بحث داخل ${label}`}
                className={`w-full rounded-lg border border-[var(--line)] bg-white pr-8 pl-2.5 text-[var(--navy)] placeholder:text-[var(--muted)]/80 focus:border-[var(--gold)] focus:outline-none ${
                  comfortable ? "h-10 text-[15px]" : "h-9 text-sm"
                }`}
              />
            </div>
          </div>

          <ul
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="max-h-60 overflow-y-auto p-1 text-sm"
          >
            {allowClear ? (
              <li role="option" aria-selected={!value}>
                <button
                  type="button"
                  onClick={() => pick("")}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-right transition-colors ${
                    !value
                      ? "bg-[var(--gold-soft)]/70 font-semibold text-[var(--navy)]"
                      : "text-[var(--muted)] hover:bg-slate-50 hover:text-[var(--navy)]"
                  }`}
                >
                  <span className="truncate">{clearLabel}</span>
                  {!value ? <CheckIcon className="size-4 shrink-0 text-[var(--gold-dark)]" /> : null}
                </button>
              </li>
            ) : null}

            {isLoading && filteredOptions.length === 0 ? (
              <li className="flex items-center justify-center gap-2 px-3 py-5 text-xs text-[var(--muted)]">
                <SpinnerIcon className="size-4 animate-spin text-[var(--gold)]" />
                <span>جارٍ تحميل الخيارات…</span>
              </li>
            ) : isError ? (
              <li className="px-3 py-4 text-center text-xs text-red-700">
                <p>تعذّر تحميل الخيارات.</p>
                {onRetry ? (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-1.5 font-semibold underline"
                  >
                    إعادة المحاولة
                  </button>
                ) : null}
              </li>
            ) : filteredOptions.length === 0 ? (
              <li className="px-3 py-5 text-center text-xs text-[var(--muted)]">{emptyMessage}</li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === activeIndex;
                return (
                  <li key={opt.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => pick(opt.value)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-right transition-colors ${
                        isSelected
                          ? "bg-[var(--gold-soft)] font-semibold text-[var(--navy)]"
                          : isHighlighted
                            ? "bg-slate-100 text-[var(--navy)]"
                            : "text-[var(--navy)] hover:bg-slate-50"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{opt.label}</span>
                        {opt.sublabel ? (
                          <span className="block truncate text-[11px] font-normal text-[var(--muted)]">
                            {opt.sublabel}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? <CheckIcon className="size-4 shrink-0 text-[var(--gold-dark)]" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {dropdownFooter ? (
            <div className="border-t border-[var(--line)] bg-[var(--surface-subtle)] px-2.5 py-2 text-xs">
              {dropdownFooter}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className={`mt-1.5 font-medium text-red-700 ${comfortable ? "text-[13px]" : "text-xs"}`}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

