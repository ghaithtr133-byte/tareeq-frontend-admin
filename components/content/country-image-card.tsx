"use client";

import { ContentImageCard, type ContentImageCardProps } from "@/components/content/content-image-card";

type CountryImageCardProps = Omit<ContentImageCardProps, "resource">;

export function CountryImageCard(props: CountryImageCardProps) {
  return (
    <ContentImageCard
      resource="countries"
      manualUrlPlaceholder="https://example.com/country-cover.jpg"
      uploadSuccessMessage="تم رفع الصورة بنجاح. احفظ الدولة لتثبيت التغييرات."
      {...props}
    />
  );
}

