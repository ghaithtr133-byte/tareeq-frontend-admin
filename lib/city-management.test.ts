import assert from "node:assert/strict";
import test from "node:test";

import {
  cityCreatePayload,
  cityFormErrors,
  cityPatchPayload,
  citySlugFromEnglishName,
  findCityNameDuplicates,
} from "@/lib/city-management";
import { city, countryId, dates, recordId } from "@/tests/fixtures/university-management";

test("city creation derives a valid non-editable slug from the English name", () => {
  assert.equal(citySlugFromEnglishName(" Istanbul "), "istanbul");
  assert.equal(citySlugFromEnglishName("São Paulo!"), "sao-paulo");
  assert.deepEqual(cityCreatePayload({ nameAr: " إسطنبول ", nameEn: " Istanbul ", countryId }), {
    countryId,
    nameAr: "إسطنبول",
    nameEn: "Istanbul",
    slug: "istanbul",
  });
  assert.equal(cityFormErrors({ nameAr: "مدينة", nameEn: "A", countryId }).nameEn, "استخدم اسمًا إنجليزيًا يمكن تحويله إلى معرّف صالح من حرفين على الأقل.");
});

test("city duplicate checks are country-scoped, trim values, ignore English case, and exclude the edited city", () => {
  const sameCountry = { ...city, nameAr: " عمّان ", nameEn: "Amman" };
  const otherCountry = { ...city, id: "00000000-0000-4000-8000-000000000099", countryId: "00000000-0000-4000-8000-000000000098", nameAr: "عمّان", nameEn: "AMMAN", ...dates };
  assert.deepEqual(
    findCityNameDuplicates([sameCountry, otherCountry], { nameAr: "عمّان", nameEn: "amman", countryId }),
    { nameAr: "هذه المدينة موجودة مسبقاً في الدولة المحددة.", nameEn: "هذه المدينة موجودة مسبقاً في الدولة المحددة." },
  );
  assert.deepEqual(findCityNameDuplicates([sameCountry], { nameAr: "عمّان", nameEn: "Amman", countryId }, recordId), {});
  assert.deepEqual(findCityNameDuplicates([otherCountry], { nameAr: "عمّان", nameEn: "Amman", countryId }), {});
});

test("city PATCH preserves the existing slug and omits unchanged fields", () => {
  assert.deepEqual(cityPatchPayload({ nameAr: "عمّان الجديدة", nameEn: city.nameEn, countryId }, city), { nameAr: "عمّان الجديدة" });
  assert.throws(() => cityPatchPayload({ nameAr: city.nameAr, nameEn: city.nameEn, countryId }, city));
});
