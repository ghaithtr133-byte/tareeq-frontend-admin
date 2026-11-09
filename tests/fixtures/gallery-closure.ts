import type { GalleryImage } from "@/lib/api-client/university-management";
import { image } from "./university-management";

export function galleryRows(active: number, archived = 0): GalleryImage[] {
  return Array.from({ length: active + archived }, (_, index) => ({
    ...image,
    id: `55000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    altAr: `صورة اختبار ${index + 1}`,
    status: index < archived ? "ARCHIVED" : index % 2 === 0 ? "DRAFT" : "PUBLISHED",
    displayOrder: active + archived - index - 1,
  }));
}

export function activeGalleryOrder(rows: GalleryImage[]) {
  return rows.filter(row => row.status !== "ARCHIVED").toSorted((a, b) => a.displayOrder - b.displayOrder).map(row => row.id);
}
