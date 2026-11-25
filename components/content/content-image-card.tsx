"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { normalizeApiError } from "@/lib/api-client/error";
import { validateImageFile, type MediaResource } from "@/lib/api-client/images";
import { useImageUpload } from "@/hook/mutations/use-image-upload";
import { useAdminAccess } from "@/providers/admin-access-provider";
import {
  CloseIcon,
  ImageIcon,
  LinkIcon,
  RefreshCwIcon,
  SpinnerIcon,
  TrashIcon,
  UploadIcon,
  ZoomInIcon,
} from "@/components/ui/admin-icons";

export interface ContentImageCardProps {
  resource?: MediaResource;
  title: string;
  description: string;
  urlFieldId: string;
  altFieldId: string;
  urlValue: string;
  urlError?: string;
  altError?: string;
  altPlaceholder: string;
  manualUrlPlaceholder?: string;
  uploadSuccessMessage?: string;
  canClear?: boolean;
  disabled?: boolean;
  onUrlChange: (nextUrl: string) => void;
  urlInputProps: UseFormRegisterReturn;
  altInputProps: UseFormRegisterReturn;
}

function isValidHttpUrl(value: string): boolean {
  return /^https?:\/\/.+/.test(value.trim());
}

export function ContentImageCard({
  resource = "countries",
  title,
  description,
  urlFieldId,
  altFieldId,
  urlValue,
  urlError,
  altError,
  altPlaceholder,
  manualUrlPlaceholder = "https://example.com/cover.jpg",
  uploadSuccessMessage = "تم رفع الصورة بنجاح. احفظ التغييرات لتثبيت الصورة.",
  canClear = true,
  disabled = false,
  onUrlChange,
  urlInputProps,
  altInputProps,
}: ContentImageCardProps) {
  const access = useAdminAccess();
  const upload = useImageUpload(resource);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const localPreviewRef = useRef<string | undefined>(undefined);
  const fileInputId = useId();
  const lightboxTitleId = useId();

  const [dragging, setDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string>();
  const [lastFile, setLastFile] = useState<File>();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>();
  const [statusError, setStatusError] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(Boolean(urlError));
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string>("");

  const trimmedUrl = urlValue.trim();
  const displayUrl = localPreview || (isValidHttpUrl(trimmedUrl) ? trimmedUrl : "");
  const imgFailed = Boolean(displayUrl && failedUrl === displayUrl);
  const uploadDisabled = disabled || uploading || access.mockEnabled;

  useEffect(
    () => () => {
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
      controllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    const dialog = lightboxRef.current;
    if (!dialog) return;
    if (lightboxOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [lightboxOpen]);

  function clearLocalPreview() {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = undefined;
    }
    setLocalPreview(undefined);
  }

  async function startUpload(file: File) {
    setStatusMessage(undefined);
    setStatusError(false);

    const validationError = validateImageFile(file);
    if (validationError) {
      setStatusError(true);
      setStatusMessage(validationError);
      return;
    }

    setLastFile(file);
    clearLocalPreview();
    const objectUrl = URL.createObjectURL(file);
    localPreviewRef.current = objectUrl;
    setLocalPreview(objectUrl);

    if (access.mockEnabled || !access.user) {
      setStatusError(false);
      setStatusMessage(
        "تمت معاينة الملف محليًا فقط. للربط الفعلي، استخدم الخادم المتصل أو الصق رابط HTTPS مباشر.",
      );
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setUploading(true);
    setProgress(0);
    try {
      const asset = await upload.mutateAsync({
        file,
        progress: setProgress,
        signal: controller.signal,
      });
      onUrlChange(asset.secureUrl);
      clearLocalPreview();
      setStatusError(false);
      setStatusMessage(uploadSuccessMessage);
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 401) access.reportContentUnauthorized();
      if (normalized.kind !== "cancelled") {
        setStatusError(true);
        setStatusMessage(
          normalized.status === 413
            ? "حجم الصورة أو طلب الرفع يتجاوز الحد المسموح (4 ميجابايت)."
            : normalized.status === 415
              ? "صيغة الصورة غير مدعومة. استخدم JPEG أو PNG أو WebP."
              : normalized.status === 403
                ? "لا تملك صلاحية رفع الصور."
                : normalized.status === 502 || normalized.status === 503
                  ? "خدمة رفع الصور غير متاحة مؤقتًا. بيانات النموذج محفوظة."
                  : "تعذّر رفع الصورة. تحقق من الاتصال ثم أعد المحاولة.",
        );
      }
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const selected = files?.[0];
    if (!selected) return;
    void startUpload(selected);
  }

  return (
    <div className="flex flex-col justify-between gap-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)]/60 p-4">
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="min-w-0">
            <h4 className="text-[15px] font-bold text-[var(--navy)]">{title}</h4>
            <p className="mt-0.5 text-[14px] leading-6 text-[var(--muted)]">{description}</p>
          </div>
          {displayUrl ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-2.5 text-[13px] font-semibold text-[var(--navy)] transition-colors hover:border-[var(--line-strong)] hover:bg-slate-50"
                title="معاينة الصورة بالحجم الكامل"
              >
                <ZoomInIcon className="size-3.5 text-[var(--gold-dark)]" />
                <span>معاينة</span>
              </button>
              <button
                type="button"
                disabled={uploadDisabled}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-2.5 text-[13px] font-semibold text-[var(--navy)] transition-colors hover:border-[var(--line-strong)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UploadIcon className="size-3.5 text-[var(--navy)]" />
                <span>استبدال</span>
              </button>
              {canClear ? (
                <button
                  type="button"
                  disabled={disabled || uploading}
                  onClick={() => {
                    clearLocalPreview();
                    onUrlChange("");
                    setStatusMessage(undefined);
                    setStatusError(false);
                  }}
                  aria-label={`إزالة ${title}`}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploadDisabled}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
          className="sr-only"
        />

        {/* Single Compact Preview OR Compact Dropzone */}
        {displayUrl ? (
          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="group relative block aspect-[16/9] max-h-48 w-full overflow-hidden bg-slate-100 text-right focus-visible:outline-offset-[-2px]"
              aria-label={`فتح معاينة ${title} بالحجم الكامل`}
            >
              {!imgFailed ? (
                <img
                  src={displayUrl}
                  alt={title}
                  referrerPolicy="no-referrer"
                  onLoad={() => {
                    if (failedUrl) setFailedUrl("");
                  }}
                  onError={() => setFailedUrl(displayUrl)}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 text-center">
                  <ImageIcon className="size-6 text-[var(--muted)]" />
                  <p className="text-[14px] font-medium text-[var(--muted)]">
                    تعذّر عرض المعاينة، وسيُحفظ الرابط المدخل كما هو.
                  </p>
                </div>
              )}
              <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg bg-[var(--navy)]/85 px-2.5 py-1 text-xs font-semibold text-white opacity-90 shadow-xs backdrop-blur-xs">
                <ZoomInIcon className="size-3.5" />
                <span>تكبير</span>
              </span>
            </button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={uploadDisabled ? -1 : 0}
            aria-disabled={uploadDisabled}
            onClick={() => {
              if (!uploadDisabled) fileInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (!uploadDisabled && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              if (uploadDisabled) return;
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              if (uploadDisabled) return;
              event.preventDefault();
              setDragging(false);
              handleFiles(event.dataTransfer.files);
            }}
            className={`flex min-h-24 items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3.5 text-right transition-colors ${
              uploadDisabled
                ? "cursor-not-allowed border-[var(--line)] bg-white/80 opacity-80"
                : dragging
                  ? "cursor-pointer border-[var(--gold)] bg-[var(--gold-soft)]/60"
                  : "cursor-pointer border-[var(--line-strong)] bg-white hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/25"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--navy)]">
                <UploadIcon className="size-4 text-[var(--gold-dark)]" />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--navy)]">
                  {access.mockEnabled
                    ? "الرفع المباشر متاح عند الاتصال بالخادم"
                    : "اسحب الصورة هنا أو انقر لاختيار ملف"}
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                  JPEG · PNG · WebP · بحد أقصى 4MB
                </p>
              </div>
            </div>
            {!access.mockEnabled ? (
              <span className="inline-flex h-9 shrink-0 items-center rounded-lg border border-[var(--line)] bg-[var(--surface-subtle)] px-3 text-[13px] font-semibold text-[var(--navy)]">
                اختيار ملف
              </span>
            ) : null}
          </div>
        )}

        {/* Upload progress / feedback */}
        {uploading ? (
          <div className="space-y-1.5 rounded-lg border border-[var(--line)] bg-white px-3.5 py-2">
            <div className="flex items-center justify-between text-[13px] font-semibold text-[var(--navy)]">
              <span className="inline-flex items-center gap-2">
                <SpinnerIcon className="size-4 animate-spin text-[var(--gold-dark)]" />
                <span>جارٍ رفع الصورة…</span>
              </span>
              <span className="font-mono tabular-nums">{progress}%</span>
            </div>
            <progress
              aria-label={`تقدم رفع ${title}`}
              value={progress}
              max={100}
              className="block h-1.5 w-full overflow-hidden rounded-full accent-[var(--navy)]"
            />
          </div>
        ) : null}

        {statusMessage ? (
          <div
            role="status"
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium ${
              statusError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            <span>{statusMessage}</span>
            {statusError && lastFile && !access.mockEnabled ? (
              <button
                type="button"
                onClick={() => void startUpload(lastFile)}
                className="inline-flex items-center gap-1 font-bold underline"
              >
                <RefreshCwIcon className="size-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Manual HTTPS URL hidden behind subtle optional action (auto-opens only on validation error) */}
        {(() => {
          const forceManualUrl = Boolean(urlError);
          const manualUrlVisible = forceManualUrl || showManualUrl;
          return (
            <div className="space-y-2">
              {!forceManualUrl ? (
                <button
                  type="button"
                  onClick={() => setShowManualUrl((open) => !open)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--navy)]/85 hover:text-[var(--navy)] hover:underline"
                >
                  <LinkIcon className="size-3.5 text-[var(--gold-dark)]" />
                  <span>
                    {showManualUrl
                      ? "إخفاء رابط الصورة اليدوي"
                      : trimmedUrl
                        ? "تعديل رابط الصورة يدويًا"
                        : "إدخال رابط صورة يدويًا"}
                  </span>
                </button>
              ) : null}

              {manualUrlVisible ? (
                <div>
                  <label
                    htmlFor={urlFieldId}
                    className="block text-[14px] font-semibold text-[var(--navy)]"
                  >
                    رابط الصورة المباشر (HTTPS)
                  </label>
                  <input
                    id={urlFieldId}
                    type="url"
                    dir="ltr"
                    maxLength={2048}
                    placeholder={manualUrlPlaceholder}
                    aria-invalid={Boolean(urlError)}
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-left font-mono text-[15px] text-[var(--navy)] placeholder:text-[var(--muted)]/65 hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
                    {...urlInputProps}
                  />
                  {urlError ? (
                    <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-700">
                      {urlError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <input type="hidden" {...urlInputProps} />
              )}
            </div>
          );
        })()}
      </div>

      {/* Arabic Alt Text */}
      <div className="border-t border-[var(--line)] pt-3">
        <label
          htmlFor={altFieldId}
          className="block text-[14px] sm:text-[15px] font-semibold text-[var(--navy)]"
        >
          النص البديل للصورة بالعربية
        </label>
        <input
          id={altFieldId}
          type="text"
          dir="rtl"
          maxLength={300}
          placeholder={altPlaceholder}
          aria-invalid={Boolean(altError)}
          className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-right text-base text-[var(--navy)] placeholder:text-[var(--muted)]/65 hover:border-[var(--line-strong)] focus:border-[var(--gold)] focus:outline-none"
          {...altInputProps}
        />
        {altError ? (
          <p role="alert" className="mt-1 text-[13px] font-medium text-red-700">
            {altError}
          </p>
        ) : null}
      </div>

      {/* Lightbox Modal */}
      {displayUrl ? (
        <dialog
          ref={lightboxRef}
          aria-labelledby={lightboxTitleId}
          onCancel={(event) => {
            event.preventDefault();
            setLightboxOpen(false);
          }}
          onClick={(event) => {
            if (event.target === lightboxRef.current) setLightboxOpen(false);
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-4xl rounded-2xl border border-[var(--line)] bg-white p-0 shadow-2xl backdrop:bg-slate-950/70"
        >
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5">
            <h3 id={lightboxTitleId} className="text-base font-bold text-[var(--navy)]">
              معاينة {title}
            </h3>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="إغلاق المعاينة"
              className="grid size-9 place-items-center rounded-lg border border-[var(--line)] text-[var(--navy)] hover:bg-slate-50"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
          <div className="flex max-h-[75vh] items-center justify-center bg-slate-950/95 p-4">
            <img
              src={displayUrl}
              alt={title}
              referrerPolicy="no-referrer"
              className="max-h-[68vh] max-w-full rounded-lg object-contain"
            />
          </div>
        </dialog>
      ) : null}
    </div>
  );
}

