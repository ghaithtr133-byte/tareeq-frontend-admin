import { AxiosError, type AxiosRequestConfig } from "axios";

import type {
  AdminContentResource,
  Article,
  ContentRecord,
  ContentResourceApi,
  ContentTypeMap,
  Country,
  Pagination,
  Scholarship,
  Service,
  University,
} from "@/api/content";

export type MockContentScenario = "normal" | "loading" | "empty" | "forbidden" | "failure" | "network" | "validation";

const ids = {
  jordan: "0fdabb18-6aa3-4b91-9e78-8157ddc2ad51",
  turkey: "80f4e0ab-873a-4d7b-99d4-24422f9cd0dd",
  german: "d6465d5f-5d39-4bd1-ac2a-2d5eae2b3252",
  middleEast: "5b78eb02-9e07-4469-9d03-f1c3e4f6206b",
  scholarship: "67a1dc3c-c31b-43dd-b7dd-ddf957b4ec14",
  service: "e2e4b4c5-1f20-4ecb-a76d-7c5937074e7c",
  article: "a4b58f13-b82f-40aa-b0d3-efdb4bff3d67",
} as const;

const createdAt = "2026-01-10T09:00:00.000Z";
const updatedAt = "2026-02-12T09:00:00.000Z";
const image = "https://images.unsplash.com/photo-1521295121783-8a321d551ad?auto=format&fit=crop&w=1200&q=80";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mockError(status: number, message: string, fields?: Record<string, string[]>) {
  return new AxiosError(message, undefined, undefined, {}, {
    status,
    statusText: message,
    headers: {},
    config: { headers: {} } as never,
    data: { success: false, error: { message, details: fields ? { fields } : undefined } },
  });
}

function networkError() {
  const error = new AxiosError("Network Error", "ERR_NETWORK", undefined, {});
  error.request = {};
  return error;
}

function cancelledError() {
  return new AxiosError("Request cancelled", "ERR_CANCELED");
}

function now() {
  return new Date().toISOString();
}

function title(resource: AdminContentResource, record: ContentRecord): string {
  return resource === "countries" || resource === "universities"
    ? (record as Country | University).nameAr
    : (record as Scholarship | Service | Article).titleAr;
}

function referenceCountry(country?: Country) {
  return country ? { id: country.id, slug: country.slug, nameAr: country.nameAr, nameEn: country.nameEn } : undefined;
}

function makeSeed(): Record<AdminContentResource, ContentRecord[]> {
  const countries: Country[] = [
    { id: ids.jordan, slug: "jordan", featured: true, publishedAt: "2026-01-12T08:00:00.000Z", seoTitleAr: "الدراسة في الأردن", seoDescriptionAr: "دليل الدراسة في الأردن", nameAr: "الأردن", nameEn: "Jordan", introductionAr: "وجهة أكاديمية قريبة ومتنوعة.", introductionEn: "A nearby and diverse academic destination.", detailsAr: "معلومات عن الجامعات والحياة الطلابية في الأردن.", detailsEn: "Information about universities and student life in Jordan.", imageUrl: image, imageAltAr: "جامعة في الأردن", imageAltEn: "A university in Jordan", displayOrder: 1, status: "PUBLISHED", createdAt, updatedAt },
    { id: ids.turkey, slug: "turkey", featured: false, publishedAt: null, seoTitleAr: null, seoDescriptionAr: null, nameAr: "تركيا", nameEn: "Turkey", introductionAr: "خيارات واسعة للبرامج الدولية.", introductionEn: "A wide range of international programs.", detailsAr: "معلومات أولية عن الدراسة في تركيا.", detailsEn: null, imageUrl: image, imageAltAr: "جامعة في تركيا", imageAltEn: null, displayOrder: 2, status: "DRAFT", createdAt, updatedAt },
  ];
  const universities: University[] = [
    { id: ids.german, slug: "university-of-jordan", featured: true, publishedAt: "2026-01-12T08:00:00.000Z", seoTitleAr: "الجامعة الأردنية", seoDescriptionAr: null, nameAr: "الجامعة الأردنية", nameEn: "The University of Jordan", officialName: "The University of Jordan", countryId: ids.jordan, cityAr: "عمّان", cityEn: "Amman", overviewAr: "جامعة حكومية عريقة في عمّان.", overviewEn: "A leading public university in Amman.", officialWebsite: "https://www.ju.edu.jo", imageUrl: image, imageAltAr: "مبنى الجامعة الأردنية", imageAltEn: "University of Jordan building", status: "PUBLISHED", createdAt, updatedAt },
    { id: ids.middleEast, slug: "middle-east-technical", featured: false, publishedAt: null, seoTitleAr: null, seoDescriptionAr: null, nameAr: "جامعة الشرق الأوسط التقنية", nameEn: "Middle East Technical University", officialName: "Middle East Technical University", countryId: ids.turkey, cityAr: "أنقرة", cityEn: "Ankara", overviewAr: "جامعة تقنية مع برامج متعددة.", overviewEn: null, officialWebsite: "https://www.metu.edu.tr", imageUrl: image, imageAltAr: "حرم جامعي", imageAltEn: null, status: "ARCHIVED", createdAt, updatedAt },
  ];
  const scholarships: Scholarship[] = [
    { id: ids.scholarship, slug: "jordan-engineering-scholarship", featured: true, publishedAt: "2026-02-01T08:00:00.000Z", seoTitleAr: "منحة هندسية", seoDescriptionAr: null, titleAr: "منحة الهندسة للطلبة الدوليين", titleEn: "Engineering Scholarship for International Students", countryId: ids.jordan, universityId: ids.german, studyLevel: "بكالوريوس", fundingType: "تمويل جزئي", requirementsAr: "سجل أكاديمي جيد وإثبات لغة.", requirementsEn: "Good academic record and language evidence.", descriptionAr: "منحة مساندة لدراسة الهندسة.", descriptionEn: "A supporting scholarship for engineering study.", verifiedDeadline: "2026-09-01T12:00:00.000Z", officialSourceUrl: "https://www.ju.edu.jo", applicationStatus: "OPEN", effectiveApplicationStatus: "OPEN", status: "PUBLISHED", createdAt, updatedAt },
  ];
  const services: Service[] = [
    { id: ids.service, slug: "application-guidance", featured: true, publishedAt: "2026-01-15T08:00:00.000Z", seoTitleAr: "إرشاد التقديم", seoDescriptionAr: null, titleAr: "إرشاد التقديم الجامعي", titleEn: "University application guidance", summaryAr: "مراجعة عملية لخطوات التقديم.", summaryEn: "A practical review of application steps.", descriptionAr: "خدمة إرشادية لمساعدة الطالب على تجهيز طلبه.", descriptionEn: "An advisory service for preparing an application.", imageUrl: image, imageAltAr: "جلسة إرشاد", imageAltEn: "Guidance session", displayOrder: 1, status: "PUBLISHED", createdAt, updatedAt },
    { id: "70ffb74a-c3fd-470f-943e-63ba2e3ba5a2", slug: "visa-preparation", featured: false, publishedAt: null, seoTitleAr: null, seoDescriptionAr: null, titleAr: "تحضير ملف التأشيرة", titleEn: null, summaryAr: "تنظيم قائمة وثائق التأشيرة.", summaryEn: null, descriptionAr: "مساعدة عملية في تحضير ملف التأشيرة.", descriptionEn: null, imageUrl: image, imageAltAr: "وثائق سفر", imageAltEn: null, displayOrder: 2, status: "ARCHIVED", createdAt, updatedAt },
  ];
  const articles: Article[] = [
    { id: ids.article, slug: "how-to-choose-university", featured: true, publishedAt: "2026-02-05T08:00:00.000Z", seoTitleAr: "اختيار الجامعة", seoDescriptionAr: null, titleAr: "كيف تختار الجامعة المناسبة؟", titleEn: "How to choose the right university?", summaryAr: "معايير عملية تساعدك على المقارنة.", summaryEn: "Practical comparison criteria.", bodyAr: [{ type: "heading2", text: "ابدأ بأهدافك" }, { type: "paragraph", text: "قارن بين البرنامج والمدينة والميزانية." }, { type: "bulleted-list", text: "الاعتماد الأكاديمي" }], bodyEn: [{ type: "paragraph", text: "Compare the programme, city and budget." }], coverImageUrl: image, coverImageAltAr: "طالب يختار جامعة", coverImageAltEn: "Student choosing a university", countryId: ids.jordan, universityId: ids.german, scholarshipId: ids.scholarship, status: "PUBLISHED", createdAt, updatedAt },
  ];
  return { countries, universities, scholarships, services, articles };
}

export interface MockContentRepository {
  getApi<K extends AdminContentResource>(resource: K): ContentResourceApi<K>;
  setScenario(scenario: MockContentScenario): void;
  getScenario(): MockContentScenario;
  populateRelationshipScale(): void;
  reset(): void;
}

export function createMockContentRepository(): MockContentRepository {
  let records = makeSeed();
  let scenario: MockContentScenario = "normal";
  let counter = 1;

  async function beforeRequest(config?: Pick<AxiosRequestConfig, "signal">) {
    if (config?.signal?.aborted) throw cancelledError();
    if (scenario === "loading") await new Promise((resolve) => setTimeout(resolve, 700));
    if (config?.signal?.aborted) throw cancelledError();
    if (scenario === "forbidden") throw mockError(403, "ليس لديك صلاحية تنفيذ هذا الإجراء.");
    if (scenario === "failure") throw mockError(500, "حدث خطأ داخلي أثناء معالجة الطلب.");
    if (scenario === "network") throw networkError();
  }

  function enriched<K extends AdminContentResource>(resource: K, item: ContentTypeMap[K]["record"]): ContentTypeMap[K]["record"] {
    const value = clone(item) as ContentRecord;
    const countryById = new Map((records.countries as Country[]).map((country) => [country.id, country]));
    const universityById = new Map((records.universities as University[]).map((university) => [university.id, university]));
    const scholarshipById = new Map((records.scholarships as Scholarship[]).map((scholarship) => [scholarship.id, scholarship]));
    if (resource === "universities") (value as University).country = referenceCountry(countryById.get((value as University).countryId));
    if (resource === "scholarships") {
      const scholarship = value as Scholarship;
      scholarship.country = referenceCountry(countryById.get(scholarship.countryId ?? ""));
      const university = universityById.get(scholarship.universityId ?? "");
      scholarship.university = university ? { id: university.id, slug: university.slug, nameAr: university.nameAr } : null;
      scholarship.effectiveApplicationStatus = scholarship.applicationStatus;
    }
    if (resource === "articles") {
      const article = value as Article;
      article.country = referenceCountry(countryById.get(article.countryId ?? ""));
      const university = universityById.get(article.universityId ?? "");
      const scholarship = scholarshipById.get(article.scholarshipId ?? "");
      article.university = university ? { id: university.id, slug: university.slug, nameAr: university.nameAr } : null;
      article.scholarship = scholarship ? { id: scholarship.id, slug: scholarship.slug, titleAr: scholarship.titleAr } : null;
    }
    return value as ContentTypeMap[K]["record"];
  }

  function matches<K extends AdminContentResource>(resource: K, item: ContentTypeMap[K]["record"], params: ContentTypeMap[K]["params"]) {
    const p = params as Record<string, string | number | undefined>;
    const record = item as ContentRecord;
    if (p.featured && String(record.featured) !== p.featured) return false;
    if (p.status && record.status !== p.status) return false;
    if (p.search && !title(resource, record).toLocaleLowerCase("ar").includes(String(p.search).toLocaleLowerCase("ar"))) return false;
    if (resource === "universities" && p.country && (enriched(resource, item) as University).country?.slug !== p.country) return false;
    if (resource === "scholarships") {
      const scholarship = enriched(resource, item) as Scholarship;
      if (p.country && scholarship.country?.slug !== p.country) return false;
      if (p.university && scholarship.university?.slug !== p.university) return false;
      if (p.studyLevel && scholarship.studyLevel !== p.studyLevel) return false;
      if (p.fundingType && scholarship.fundingType !== p.fundingType) return false;
      if (p.applicationStatus && scholarship.applicationStatus !== p.applicationStatus) return false;
    }
    if (resource === "articles" && p.country && (enriched(resource, item) as Article).country?.slug !== p.country) return false;
    return true;
  }

  function sort<K extends AdminContentResource>(resource: K, values: ContentTypeMap[K]["record"][], requested?: string) {
    return [...values].sort((a, b) => {
      if (requested === "manual" && (resource === "countries" || resource === "services")) return (a as Country | Service).displayOrder - (b as Country | Service).displayOrder;
      if (requested === "name" && resource === "universities") return (a as University).nameAr.localeCompare((b as University).nameAr, "ar");
      if (requested === "deadline" && resource === "scholarships") return ((a as Scholarship).verifiedDeadline ?? "9999").localeCompare((b as Scholarship).verifiedDeadline ?? "9999");
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  function uniqueId() {
    const suffix = String(counter++).padStart(12, "0");
    return `9f742019-6d2e-4c1b-9d40-${suffix}`;
  }

  /** Development-only fixture for exercising relationship pagination beyond a 50-item page. */
  function populateRelationshipScale() {
    if ((records.countries as Country[]).some((country) => country.slug === "relationship-country-60")) return;

    for (let index = 1; index <= 60; index += 1) {
      const suffix = String(index).padStart(12, "0");
      const countryId = `10000000-0000-4000-8000-${suffix}`;
      (records.countries as Country[]).push({
        id: countryId,
        slug: `relationship-country-${index}`,
        featured: false,
        publishedAt: null,
        seoTitleAr: null,
        seoDescriptionAr: null,
        nameAr: `دولة اختبار العلاقات ${index}`,
        nameEn: `Relationship test country ${index}`,
        introductionAr: "سجل تطويري لاختبار حقول العلاقات.",
        introductionEn: null,
        detailsAr: "يُستخدم هذا السجل لاختبار تحميل أكثر من خمسين خيارًا.",
        detailsEn: null,
        imageUrl: null,
        imageAltAr: null,
        imageAltEn: null,
        displayOrder: index + 10,
        status: "DRAFT",
        createdAt,
        updatedAt,
      });
      (records.universities as University[]).push({
        id: `20000000-0000-4000-8000-${suffix}`,
        slug: `relationship-university-${index}`,
        featured: false,
        publishedAt: null,
        seoTitleAr: null,
        seoDescriptionAr: null,
        nameAr: `جامعة اختبار العلاقات ${index}`,
        nameEn: `Relationship test university ${index}`,
        officialName: `Relationship Test University ${index}`,
        countryId,
        cityAr: "مدينة الاختبار",
        cityEn: null,
        overviewAr: "سجل تطويري لاختبار تصفية الجامعة حسب الدولة.",
        overviewEn: null,
        officialWebsite: null,
        imageUrl: null,
        imageAltAr: null,
        imageAltEn: null,
        status: "DRAFT",
        createdAt,
        updatedAt,
      });
    }

    const scholarshipSeed = records.scholarships[0] as Scholarship;
    const serviceSeed = records.services[0] as Service;
    const articleSeed = records.articles[0] as Article;
    for (let index = 1; index <= 12; index += 1) {
      const suffix = String(index).padStart(12, "0");
      (records.scholarships as Scholarship[]).push({
        ...clone(scholarshipSeed),
        id: `30000000-0000-4000-8000-${suffix}`,
        slug: `relationship-scholarship-${index}`,
        titleAr: `منحة اختبار الترقيم ${index}`,
        titleEn: null,
        createdAt: `2026-03-${String(index).padStart(2, "0")}T09:00:00.000Z`,
      });
      (records.services as Service[]).push({
        ...clone(serviceSeed),
        id: `40000000-0000-4000-8000-${suffix}`,
        slug: `relationship-service-${index}`,
        titleAr: `خدمة اختبار الترقيم ${index}`,
        titleEn: null,
        createdAt: `2026-03-${String(index).padStart(2, "0")}T09:00:00.000Z`,
      });
      (records.articles as Article[]).push({
        ...clone(articleSeed),
        id: `50000000-0000-4000-8000-${suffix}`,
        slug: `relationship-article-${index}`,
        titleAr: `مقال اختبار الترقيم ${index}`,
        titleEn: null,
        createdAt: `2026-03-${String(index).padStart(2, "0")}T09:00:00.000Z`,
      });
    }
  }

  function build<K extends AdminContentResource>(resource: K, input: ContentTypeMap[K]["input"]): ContentTypeMap[K]["record"] {
    const base = { id: uniqueId(), slug: "", featured: false, publishedAt: null, seoTitleAr: null, seoDescriptionAr: null, status: "DRAFT" as const, createdAt: now(), updatedAt: now() };
    const publishedAt = (input as { status?: string }).status === "PUBLISHED" ? now() : null;
    if (resource === "countries") return { ...base, nameAr: "", nameEn: null, introductionAr: "", introductionEn: null, detailsAr: "", detailsEn: null, imageUrl: null, imageAltAr: null, imageAltEn: null, displayOrder: 0, ...input, publishedAt } as ContentTypeMap[K]["record"];
    if (resource === "universities") return { ...base, nameAr: "", nameEn: null, officialName: "", countryId: "", cityAr: "", cityEn: null, overviewAr: "", overviewEn: null, officialWebsite: null, imageUrl: null, imageAltAr: null, imageAltEn: null, ...input, publishedAt } as ContentTypeMap[K]["record"];
    if (resource === "scholarships") return { ...base, titleAr: "", titleEn: null, countryId: null, universityId: null, studyLevel: "", fundingType: "", requirementsAr: "", requirementsEn: null, descriptionAr: "", descriptionEn: null, verifiedDeadline: null, officialSourceUrl: null, applicationStatus: "OPEN", ...input, publishedAt } as ContentTypeMap[K]["record"];
    if (resource === "services") return { ...base, titleAr: "", titleEn: null, summaryAr: "", summaryEn: null, descriptionAr: "", descriptionEn: null, imageUrl: null, imageAltAr: null, imageAltEn: null, displayOrder: 0, ...input, publishedAt } as ContentTypeMap[K]["record"];
    return { ...base, titleAr: "", titleEn: null, summaryAr: "", summaryEn: null, bodyAr: [], bodyEn: null, coverImageUrl: null, coverImageAltAr: null, coverImageAltEn: null, countryId: null, universityId: null, scholarshipId: null, ...input, publishedAt } as ContentTypeMap[K]["record"];
  }

  function checkMutation<K extends AdminContentResource>(resource: K, input: ContentTypeMap[K]["input"], id?: string) {
    if (scenario === "validation") throw mockError(400, "تحقق من الحقول المدخلة.", { slug: ["قيمة الاختبار غير صالحة."] });
    const slug = (input as { slug?: string }).slug;
    if (slug && records[resource].some((record) => record.slug === slug && record.id !== id)) throw mockError(409, "المعرّف النصي مستخدم بالفعل.", { slug: ["هذا المعرّف النصي مستخدم بالفعل."] });
  }

  function api<K extends AdminContentResource>(resource: K): ContentResourceApi<K> {
    return {
      async list(params, config) {
        await beforeRequest(config);
        const all = records[resource] as ContentTypeMap[K]["record"][];
        const filtered = scenario === "empty" ? [] : sort(resource, all.filter((item) => matches(resource, item, params)), (params as { sort?: string }).sort);
        const limit = Math.min(Math.max(Number((params as { limit?: number }).limit ?? 12), 1), 50);
        const page = Math.max(Number((params as { page?: number }).page ?? 1), 1);
        const pagination: Pagination = { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) };
        return { items: filtered.slice((page - 1) * limit, page * limit).map((item) => enriched(resource, item)), pagination };
      },
      async get(id, config) {
        await beforeRequest(config);
        const item = (records[resource] as ContentTypeMap[K]["record"][]).find((record) => record.id === id);
        if (!item) throw mockError(404, "السجل المطلوب غير موجود.");
        return enriched(resource, item);
      },
      async create(input) {
        await beforeRequest();
        checkMutation(resource, input);
        const item = build(resource, input);
        (records[resource] as ContentTypeMap[K]["record"][]).push(item);
        return enriched(resource, item);
      },
      async update(id, input) {
        await beforeRequest();
        checkMutation(resource, input, id);
        const collection = records[resource] as ContentTypeMap[K]["record"][];
        const index = collection.findIndex((record) => record.id === id);
        if (index < 0) throw mockError(404, "السجل المطلوب غير موجود.");
        const previous = collection[index] as ContentRecord;
        const next = { ...previous, ...input, updatedAt: now() } as ContentTypeMap[K]["record"] & ContentRecord;
        if (input.status === "PUBLISHED" && previous.status !== "PUBLISHED") next.publishedAt = now();
        collection[index] = next as ContentTypeMap[K]["record"];
        return enriched(resource, next as ContentTypeMap[K]["record"]);
      },
    };
  }

  return {
    getApi: api,
    setScenario(value) { scenario = value; },
    getScenario() { return scenario; },
    populateRelationshipScale,
    reset() { records = makeSeed(); scenario = "normal"; counter = 1; },
  };
}
