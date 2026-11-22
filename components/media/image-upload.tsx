"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { validateImageFile, type MediaResource } from "@/lib/api-client/images";
import { useImageUpload } from "@/hook/mutations/use-image-upload";
import { normalizeApiError } from "@/lib/api-client/error";
import { useAdminAccess } from "@/providers/admin-access-provider";
import { SpinnerIcon, UploadIcon } from "@/components/ui/admin-icons";

/** Uploading an asset never saves the surrounding content form. */
export function ImageUpload({
  resource,
  onUploaded,
  disabled = false,
  label = "رفع صورة جديدة",
  manualUrlAvailable = true,
}: {
  resource: MediaResource;
  onUploaded: (url: string) => void;
  disabled?: boolean;
  label?: string;
  /** Some forms intentionally accept uploads only and do not expose a URL field. */
  manualUrlAvailable?: boolean;
}) {
  const access = useAdminAccess();
  const upload = useImageUpload(resource);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>();
  const [isError, setIsError] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const previewRef = useRef<string | undefined>(undefined);

  function chooseFile(selected?: File) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = selected ? URL.createObjectURL(selected) : undefined;
    setPreview(previewRef.current);
    setFile(selected);
  }

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );
  useEffect(() => () => controller.current?.abort(), []);

  const unavailable = disabled || pending || access.mockEnabled;

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-subtle)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="min-w-0 flex-1 space-y-1.5 text-xs font-semibold text-[var(--navy)]">
          <span className="block">{label}</span>
          <input
            aria-label={label}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={unavailable}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              setMessage(undefined);
              setIsError(false);
              if (selected) {
                const invalid = validateImageFile(selected);
                if (invalid) {
                  setIsError(true);
                  setMessage(invalid);
                  chooseFile();
                  event.target.value = "";
                  return;
                }
              }
              chooseFile(selected);
            }}
            className="block w-full min-w-0 cursor-pointer text-xs text-[var(--muted)] file:ml-3 file:cursor-pointer file:rounded-lg file:border file:border-[var(--line)] file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--navy)] hover:file:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <button
          type="button"
          disabled={!file || unavailable}
          onClick={async () => {
            if (!file || pending || access.mockEnabled || !access.user) return;
            setPending(true);
            setMessage(undefined);
            setIsError(false);
            setProgress(0);
            controller.current = new AbortController();
            try {
              const asset = await upload.mutateAsync({
                file,
                progress: setProgress,
                signal: controller.current.signal,
              });
              onUploaded(asset.secureUrl);
              setIsError(false);
              setMessage("تم رفع الصورة بنجاح. احفظ النموذج لربطها بالسجل.");
            } catch (error) {
              const normalized = normalizeApiError(error);
              if (normalized.status === 401) access.reportContentUnauthorized();
              if (normalized.kind !== "cancelled") {
                setIsError(true);
                setMessage(
                  normalized.status === 413
                    ? "الصورة أو طلب الرفع أكبر من الحد المسموح."
                    : normalized.status === 415
                      ? "صيغة الصورة غير مدعومة."
                      : normalized.status === 403
                        ? "لم يُسمح برفع الصورة. تحقق من الصلاحيات."
                        : normalized.status === 502 || normalized.status === 503
                          ? "خدمة الصور غير متاحة مؤقتًا. بيانات النموذج محفوظة."
                          : "تعذّر رفع الصورة. تحقق من الملف والاتصال؛ لم تُفقد بيانات النموذج.",
                );
              }
            } finally {
              setPending(false);
            }
          }}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--navy)] px-4 text-xs font-semibold text-white transition-colors hover:bg-[var(--navy-light)] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
        >
          {pending ? (
            <SpinnerIcon className="size-4 animate-spin" />
          ) : (
            <UploadIcon className="size-4" />
          )}
          <span>{pending ? `جارٍ الرفع ${progress}%` : "رفع الصورة"}</span>
        </button>
      </div>

      {preview ? (
        <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white p-2">
          <img
            src={preview}
            alt="معاينة محلية قبل الرفع"
            className="max-h-40 max-w-full rounded object-contain"
          />
        </div>
      ) : null}

      <p className="text-[11px] text-[var(--muted)]">
        الصيغ المدعومة: JPEG / PNG / WebP · الحد الأقصى 4 ميجابايت. الرفع لا يحفظ السجل تلقائيًا.
      </p>

      {pending ? (
        <progress aria-label="تقدم رفع الصورة" value={progress} max={100} className="block h-1.5 w-full" />
      ) : null}

      {message ? (
        <p
          role="status"
          className={`break-words text-xs font-medium ${isError ? "text-red-700" : "text-emerald-800"}`}
        >
          {message}
        </p>
      ) : null}

      {access.mockEnabled ? (
        <p className="text-[11px] text-[var(--muted)]">
          {manualUrlAvailable
            ? "الرفع معطّل في وضع معاينة التطوير المحلية؛ يمكنك لصق رابط صورة مباشر في حقل الرابط."
            : "الرفع معطّل في وضع معاينة التطوير المحلية."}
        </p>
      ) : null}
    </div>
  );
}
