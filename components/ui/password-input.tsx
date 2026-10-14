"use client";

import { forwardRef, useState } from "react";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        type={visible ? "text" : "password"}
        className={className}
        dir="ltr"
        autoComplete="current-password"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 left-0 px-4 text-sm font-medium text-slate-600 hover:text-slate-900"
        aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        aria-pressed={visible}
      >
        {visible ? "إخفاء" : "إظهار"}
      </button>
    </div>
  );
});
