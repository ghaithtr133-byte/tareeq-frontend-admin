import { aboutAdminSchema, aboutFields } from "@/lib/about-schemas";

export const aboutDate = "2026-11-05T10:00:00Z";
export const aboutFixture = aboutAdminSchema.parse({
  ...Object.fromEntries(aboutFields.map(([key]) => [key, null])),
  id: "33333333-3333-4333-8333-333333333333", status: "DRAFT", createdAt: aboutDate, updatedAt: aboutDate, publishedAt: null,
  heroImageUrl: "https://example.invalid/fixed-hero.png", heroImageAltAr: "صورة ثابتة", heroImageAltEn: "Fixed hero",
  missionTitleEn: "Preserved optional title",
});
