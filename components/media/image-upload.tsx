"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { validateImageFile, type MediaResource } from "@/api/images";
import { useImageUpload } from "@/hook/mutations/use-image-upload";
import { normalizeApiError } from "@/api/error";
import { useAdminAccess } from "@/providers/admin-access-provider";

/** Uploading an asset never saves the surrounding content form. */
export function ImageUpload({ resource, onUploaded, disabled = false }: { resource: MediaResource; onUploaded: (url: string) => void; disabled?: boolean }) {
  const access = useAdminAccess();
  const upload = useImageUpload(resource);
  const [file, setFile] = useState<File>(); const [preview, setPreview] = useState<string>();
  const [pending, setPending] = useState(false); const [progress, setProgress] = useState(0); const [message, setMessage] = useState<string>();
  const controller = useRef<AbortController | null>(null);
  const previewRef = useRef<string | undefined>(undefined);
  function chooseFile(selected?: File) { if (previewRef.current) URL.revokeObjectURL(previewRef.current); previewRef.current = selected ? URL.createObjectURL(selected) : undefined; setPreview(previewRef.current); setFile(selected); }
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);
  useEffect(() => () => controller.current?.abort(), []);
  const unavailable = disabled || pending || access.mockEnabled;
  return <div className="space-y-3 rounded-xl border border-[var(--line)] p-4">
    <label className="grid gap-2 text-sm font-semibold">رفع صورة جديدة<input aria-label="ملف الصورة" type="file" accept="image/jpeg,image/png,image/webp" disabled={unavailable} onChange={(event) => { const selected = event.target.files?.[0]; setMessage(undefined); if (selected) { const invalid = validateImageFile(selected); if (invalid) { setMessage(invalid); chooseFile(); event.target.value = ""; return; } } chooseFile(selected); }} className="min-w-0 max-w-full" /></label>
    {preview ? <img src={preview} alt="معاينة محلية قبل الرفع" className="max-h-48 max-w-full rounded-lg object-contain" /> : null}
    <p className="text-xs text-[var(--muted)]">JPEG / PNG / WebP · الحد الأقصى 4,000,000 بايت. الرفع لا يحفظ السجل تلقائيًا.</p>
    <button type="button" disabled={!file || unavailable} onClick={async () => {
      if (!file || pending || access.mockEnabled || !access.user) return;
      setPending(true); setMessage(undefined); setProgress(0); controller.current = new AbortController();
      try { const asset = await upload.mutateAsync({ file, progress: setProgress, signal: controller.current.signal }); onUploaded(asset.secureUrl); setMessage("تم رفع الصورة. احفظ النموذج لربطها بالسجل."); }
      catch (error) { const normalized = normalizeApiError(error); if (normalized.status === 401) access.reportContentUnauthorized(); if (normalized.kind !== "cancelled") setMessage(normalized.status === 413 ? "الصورة أو طلب الرفع أكبر من الحد المسموح." : normalized.status === 415 ? "صيغة الصورة غير مدعومة." : normalized.status === 403 ? "لم يُسمح برفع الصورة. تحقق من الصلاحيات." : normalized.status === 502 || normalized.status === 503 ? "خدمة الصور غير متاحة مؤقتًا. بيانات النموذج محفوظة." : "تعذّر رفع الصورة. تحقق من الملف والاتصال؛ لم تُفقد بيانات النموذج."); }
      finally { setPending(false); }
    }} className="min-h-11 rounded-lg bg-[var(--navy)] px-4 text-sm font-bold text-white disabled:opacity-50">{pending ? `جارٍ الرفع ${progress}%` : "رفع الصورة"}</button>
    {pending ? <progress aria-label="تقدم رفع الصورة" value={progress} max={100} className="block w-full" /> : null}
    {message ? <p role="status" className="break-words text-sm">{message}</p> : null}
    {access.mockEnabled ? <p className="text-xs">الرفع معطّل في معاينة التطوير.</p> : null}
  </div>;
}
