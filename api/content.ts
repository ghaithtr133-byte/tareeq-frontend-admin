import type { AxiosRequestConfig } from "axios";

import { apiClient } from "@/api/client";

export type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ScholarshipApplicationStatus = "OPEN" | "CLOSED";
export type ArticleBlockType = "paragraph" | "heading2" | "heading3" | "bulleted-list" | "numbered-list" | "quote";
export type AdminContentResource = "countries" | "universities" | "scholarships" | "services" | "articles";

export interface ArticleRichTextBlock {
  type: ArticleBlockType;
  text: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Country {
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  seoTitleAr: string | null;
  seoDescriptionAr: string | null;
  nameAr: string;
  nameEn: string | null;
  introductionAr: string;
  introductionEn: string | null;
  detailsAr: string;
  detailsEn: string | null;
  imageUrl: string | null;
  imageAltAr: string | null;
  imageAltEn: string | null;
  displayOrder: number;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CountryReference {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
}

export interface University {
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  seoTitleAr: string | null;
  seoDescriptionAr: string | null;
  nameAr: string;
  nameEn: string | null;
  officialName: string;
  countryId: string;
  cityAr: string;
  cityEn: string | null;
  overviewAr: string;
  overviewEn: string | null;
  officialWebsite: string | null;
  imageUrl: string | null;
  imageAltAr: string | null;
  imageAltEn: string | null;
  country?: CountryReference;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Scholarship {
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  seoTitleAr: string | null;
  seoDescriptionAr: string | null;
  titleAr: string;
  titleEn: string | null;
  countryId: string | null;
  universityId: string | null;
  studyLevel: string;
  fundingType: string;
  requirementsAr: string;
  requirementsEn: string | null;
  descriptionAr: string;
  descriptionEn: string | null;
  verifiedDeadline: string | null;
  officialSourceUrl: string | null;
  applicationStatus: ScholarshipApplicationStatus;
  effectiveApplicationStatus?: ScholarshipApplicationStatus;
  country?: Pick<CountryReference, "id" | "slug" | "nameAr"> | null;
  university?: Pick<University, "id" | "slug" | "nameAr"> | null;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  seoTitleAr: string | null;
  seoDescriptionAr: string | null;
  titleAr: string;
  titleEn: string | null;
  summaryAr: string;
  summaryEn: string | null;
  descriptionAr: string;
  descriptionEn: string | null;
  imageUrl: string | null;
  imageAltAr: string | null;
  imageAltEn: string | null;
  displayOrder: number;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  seoTitleAr: string | null;
  seoDescriptionAr: string | null;
  titleAr: string;
  titleEn: string | null;
  summaryAr: string;
  summaryEn: string | null;
  bodyAr: ArticleRichTextBlock[];
  bodyEn: ArticleRichTextBlock[] | null;
  coverImageUrl: string | null;
  coverImageAltAr: string | null;
  coverImageAltEn: string | null;
  countryId: string | null;
  universityId: string | null;
  scholarshipId: string | null;
  country?: Pick<CountryReference, "id" | "slug" | "nameAr"> | null;
  university?: Pick<University, "id" | "slug" | "nameAr"> | null;
  scholarship?: Pick<Scholarship, "id" | "slug" | "titleAr"> | null;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CountryInput {
  nameAr?: string; nameEn?: string; introductionAr?: string; introductionEn?: string; detailsAr?: string; detailsEn?: string;
  imageUrl?: string; imageAltAr?: string; imageAltEn?: string; displayOrder?: number; slug?: string; featured?: boolean;
  status?: PublicationStatus; seoTitleAr?: string; seoDescriptionAr?: string;
}
export interface UniversityInput {
  nameAr?: string; nameEn?: string; officialName?: string; countryId?: string; cityAr?: string; cityEn?: string;
  overviewAr?: string; overviewEn?: string; officialWebsite?: string; imageUrl?: string; imageAltAr?: string; imageAltEn?: string;
  slug?: string; featured?: boolean; status?: PublicationStatus; seoTitleAr?: string; seoDescriptionAr?: string;
}
export interface ScholarshipInput {
  titleAr?: string; titleEn?: string; countryId?: string | null; universityId?: string | null; studyLevel?: string; fundingType?: string;
  requirementsAr?: string; requirementsEn?: string; descriptionAr?: string; descriptionEn?: string; verifiedDeadline?: string | null;
  officialSourceUrl?: string | null; applicationStatus?: ScholarshipApplicationStatus; slug?: string; featured?: boolean;
  status?: PublicationStatus; seoTitleAr?: string; seoDescriptionAr?: string;
}
export interface ServiceInput {
  titleAr?: string; titleEn?: string; summaryAr?: string; summaryEn?: string; descriptionAr?: string; descriptionEn?: string;
  imageUrl?: string; imageAltAr?: string; imageAltEn?: string; displayOrder?: number; slug?: string; featured?: boolean;
  status?: PublicationStatus; seoTitleAr?: string; seoDescriptionAr?: string;
}
export interface ArticleInput {
  titleAr?: string; titleEn?: string; summaryAr?: string; summaryEn?: string; bodyAr?: ArticleRichTextBlock[]; bodyEn?: ArticleRichTextBlock[] | null;
  coverImageUrl?: string; coverImageAltAr?: string; coverImageAltEn?: string; countryId?: string | null; universityId?: string | null;
  scholarshipId?: string | null; slug?: string; featured?: boolean; status?: PublicationStatus; seoTitleAr?: string; seoDescriptionAr?: string;
}

export interface BaseListParams {
  page?: number;
  limit?: number;
  featured?: "true" | "false";
  status?: PublicationStatus;
}
export interface CountryListParams extends BaseListParams { search?: string; sort?: "manual" | "newest"; }
export interface UniversityListParams extends BaseListParams { search?: string; country?: string; sort?: "newest" | "name"; }
export interface ScholarshipListParams extends BaseListParams { search?: string; country?: string; university?: string; studyLevel?: string; fundingType?: string; applicationStatus?: ScholarshipApplicationStatus; sort?: "newest" | "deadline"; }
export interface ServiceListParams extends BaseListParams { sort?: "manual" | "newest"; }
export interface ArticleListParams extends BaseListParams { search?: string; country?: string; sort?: "newest"; }

export interface ContentTypeMap {
  countries: { record: Country; input: CountryInput; params: CountryListParams };
  universities: { record: University; input: UniversityInput; params: UniversityListParams };
  scholarships: { record: Scholarship; input: ScholarshipInput; params: ScholarshipListParams };
  services: { record: Service; input: ServiceInput; params: ServiceListParams };
  articles: { record: Article; input: ArticleInput; params: ArticleListParams };
}

type SuccessEnvelope<T> = { success: true; data: T };
export type ContentRecord = ContentTypeMap[AdminContentResource]["record"];

function makeContentApi<K extends AdminContentResource>(resource: K) {
  type Entry = ContentTypeMap[K];
  const path = `/admin/${resource}`;
  return {
    async list(params: Entry["params"], config?: Pick<AxiosRequestConfig, "signal">): Promise<{ items: Entry["record"][]; pagination: Pagination }> {
      const response = await apiClient.get<SuccessEnvelope<{ items: Entry["record"][]; pagination: Pagination }>>(path, { ...config, params });
      return response.data.data;
    },
    async get(id: string, config?: Pick<AxiosRequestConfig, "signal">): Promise<Entry["record"]> {
      const response = await apiClient.get<SuccessEnvelope<Entry["record"]>>(`${path}/${id}`, config);
      return response.data.data;
    },
    async create(input: Entry["input"]): Promise<Entry["record"]> {
      const response = await apiClient.post<SuccessEnvelope<Entry["record"]>>(path, input);
      return response.data.data;
    },
    async update(id: string, input: Entry["input"]): Promise<Entry["record"]> {
      const response = await apiClient.patch<SuccessEnvelope<Entry["record"]>>(`${path}/${id}`, input);
      return response.data.data;
    },
  };
}

export type ContentResourceApi<K extends AdminContentResource> = {
  list: (params: ContentTypeMap[K]["params"], config?: Pick<AxiosRequestConfig, "signal">) => Promise<{ items: ContentTypeMap[K]["record"][]; pagination: Pagination }>;
  get: (id: string, config?: Pick<AxiosRequestConfig, "signal">) => Promise<ContentTypeMap[K]["record"]>;
  create: (input: ContentTypeMap[K]["input"]) => Promise<ContentTypeMap[K]["record"]>;
  update: (id: string, input: ContentTypeMap[K]["input"]) => Promise<ContentTypeMap[K]["record"]>;
};

/** The 20 approved Admin content operations, grouped by documented resource. */
export const contentApi = {
  countries: makeContentApi("countries"),
  universities: makeContentApi("universities"),
  scholarships: makeContentApi("scholarships"),
  services: makeContentApi("services"),
  articles: makeContentApi("articles"),
};

export function getContentApi<K extends AdminContentResource>(resource: K): ContentResourceApi<K> {
  return contentApi[resource] as unknown as ContentResourceApi<K>;
}
