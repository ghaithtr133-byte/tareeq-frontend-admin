import type { City } from "@/lib/api-client/university-management";
import { cityInputSchema, cityPatchSchema, uuidSchema, type CityInput, type CityPatch } from "@/lib/university-schemas";

export type CityFormValues = {
  nameAr: string;
  nameEn: string;
  countryId: string;
};

export const emptyCityFormValues: CityFormValues = {
  nameAr: "",
  nameEn: "",
  countryId: "",
};

/** The API requires an ASCII slug; the UI deliberately never exposes it as an editable field. */
export function citySlugFromEnglishName(value: string): string {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export function normalizeArabicCityName(value: string): string {
  return value.trim();
}

export function normalizeEnglishCityName(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

export function cityFormErrors(values: CityFormValues): Record<keyof CityFormValues, string | undefined> {
  const errors: Record<keyof CityFormValues, string | undefined> = {
    nameAr: undefined,
    nameEn: undefined,
    countryId: undefined,
  };
  if (!normalizeArabicCityName(values.nameAr)) errors.nameAr = "اسم المدينة بالعربية مطلوب.";
  if (!normalizeEnglishCityName(values.nameEn)) errors.nameEn = "اسم المدينة بالإنجليزية مطلوب.";
  if (!uuidSchema.safeParse(values.countryId).success) errors.countryId = "اختر دولة صالحة.";
  if (!errors.nameEn && citySlugFromEnglishName(values.nameEn).length < 2) {
    errors.nameEn = "استخدم اسمًا إنجليزيًا يمكن تحويله إلى معرّف صالح من حرفين على الأقل.";
  }
  return errors;
}

export function findCityNameDuplicates(
  cities: readonly City[],
  values: CityFormValues,
  currentCityId?: string,
): Partial<Record<"nameAr" | "nameEn", string>> {
  const sameCountry = cities.filter((city) => city.countryId === values.countryId && city.id !== currentCityId);
  const errors: Partial<Record<"nameAr" | "nameEn", string>> = {};
  if (sameCountry.some((city) => normalizeArabicCityName(city.nameAr) === normalizeArabicCityName(values.nameAr))) {
    errors.nameAr = "هذه المدينة موجودة مسبقاً في الدولة المحددة.";
  }
  if (sameCountry.some((city) => normalizeEnglishCityName(city.nameEn) === normalizeEnglishCityName(values.nameEn))) {
    errors.nameEn = "هذه المدينة موجودة مسبقاً في الدولة المحددة.";
  }
  return errors;
}

export function cityCreatePayload(values: CityFormValues): CityInput {
  return cityInputSchema.parse({
    countryId: values.countryId,
    nameAr: values.nameAr.trim(),
    nameEn: values.nameEn.trim(),
    slug: citySlugFromEnglishName(values.nameEn),
  });
}

/** PATCH only includes actual mutable differences; it never submits a slug from the edit form. */
export function cityPatchPayload(values: CityFormValues, original: City): CityPatch {
  const patch: CityPatch = {};
  if (values.nameAr.trim() !== original.nameAr) patch.nameAr = values.nameAr.trim();
  if (values.nameEn.trim() !== original.nameEn) patch.nameEn = values.nameEn.trim();
  if (values.countryId !== original.countryId) patch.countryId = values.countryId;
  return cityPatchSchema.parse(patch);
}
