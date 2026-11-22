"use client";

import { forwardRef, useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/ui/admin-icons";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        type={visible ? "text" : "password"}
        className={className ? `${className} pl-12` : "pl-12"}
        dir="ltr"
        autoComplete={props.autoComplete ?? "current-password"}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-1.5 left-1.5 inline-flex w-9 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-slate-100 hover:text-[var(--navy)]"
        aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        aria-pressed={visible}
        title={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {visible ? <EyeOffIcon className="size-[18px]" /> : <EyeIcon className="size-[18px]" />}
      </button>
    </div>
  );
});
